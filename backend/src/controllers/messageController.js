const Message = require("../models/messageModel");
const User = require("../models/userModel");
const Property = require("../models/propertyModel");
const Booking = require("../models/bookingModel");

const getCurrentUserId = (req) => req.user?.id || req.user?._id;

const buildUserPreview = (user) => {
  if (!user) return null;

  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    profilePic: user.profilePic || "",
  };
};

const buildConversationPreview = ({ user, message = null, property = null, unreadCount = 0 }) => ({
  user: buildUserPreview(user),
  property: property
    ? {
        _id: property._id,
        title: property.title,
      }
    : null,
  lastMessage: message?.message || "",
  lastMessageAt: message?.createdAt || null,
  unreadCount,
});

const getConversationContacts = async (req) => {
  const currentUserId = getCurrentUserId(req);
  const contactMap = new Map();

  const upsertContact = (user, property = null) => {
    if (!user || String(user._id) === String(currentUserId)) return;

    const key = String(user._id);
    const existing = contactMap.get(key);

    contactMap.set(key, {
      user,
      property: existing?.property || property || null,
    });
  };

  if (req.user.role === "admin") {
    const users = await User.find({ _id: { $ne: currentUserId } }).select("name email role profilePic");
    users.forEach((user) => upsertContact(user));
    return contactMap;
  }

  if (req.user.role === "guest") {
    const bookings = await Booking.find({ guest: currentUserId })
      .populate("host", "name email role profilePic")
      .populate("property", "title")
      .sort({ createdAt: -1 });

    bookings.forEach((booking) => upsertContact(booking.host, booking.property));
    return contactMap;
  }

  if (req.user.role === "host") {
    const bookings = await Booking.find({ host: currentUserId })
      .populate("guest", "name email role profilePic")
      .populate("property", "title")
      .sort({ createdAt: -1 });

    bookings.forEach((booking) => upsertContact(booking.guest, booking.property));
    return contactMap;
  }

  return contactMap;
};

const getConversations = async (req, res) => {
  try {
    const currentUserId = getCurrentUserId(req);
    const contacts = await getConversationContacts(req);

    const messages = await Message.find({
      $or: [{ sender: currentUserId }, { receiver: currentUserId }],
    })
      .sort({ createdAt: -1 })
      .populate("sender", "name email role profilePic")
      .populate("receiver", "name email role profilePic")
      .populate("property", "title");

    const conversations = new Map();

    messages.forEach((message) => {
      const isSender = String(message.sender?._id) === String(currentUserId);
      const otherUser = isSender ? message.receiver : message.sender;

      if (!otherUser) return;

      const key = String(otherUser._id);
      const existing = conversations.get(key);
      const unreadIncrement = !isSender && !message.isRead ? 1 : 0;

      if (!existing) {
        conversations.set(
          key,
          buildConversationPreview({
            user: otherUser,
            message,
            property: message.property,
            unreadCount: unreadIncrement,
          })
        );
        return;
      }

      existing.unreadCount += unreadIncrement;
      if (!existing.property && message.property) {
        existing.property = {
          _id: message.property._id,
          title: message.property.title,
        };
      }
    });

    contacts.forEach(({ user, property }, key) => {
      if (!conversations.has(key)) {
        conversations.set(key, buildConversationPreview({ user, property }));
      }
    });

    const data = Array.from(conversations.values()).sort((a, b) => {
      const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return bTime - aTime || a.user.name.localeCompare(b.user.name);
    });

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.log("GET CONVERSATIONS ERROR:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getConversationMessages = async (req, res) => {
  try {
    const currentUserId = getCurrentUserId(req);
    const { userId } = req.params;
    const { propertyId } = req.query;

    if (String(currentUserId) === String(userId)) {
      return res.status(400).json({ message: "You cannot message yourself" });
    }

    const participant = await User.findById(userId).select("name email role profilePic");
    if (!participant) {
      return res.status(404).json({ message: "User not found" });
    }

    let property = null;
    if (propertyId) {
      property = await Property.findById(propertyId).select("title host");
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
    }

    const query = {
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId },
      ],
    };

    if (propertyId) {
      query.property = propertyId;
    }

    const messages = await Message.find(query)
      .sort({ createdAt: 1 })
      .populate("sender", "name email role profilePic")
      .populate("receiver", "name email role profilePic")
      .populate("property", "title");

    await Message.updateMany(
      {
        sender: userId,
        receiver: currentUserId,
        isRead: false,
        ...(propertyId ? { property: propertyId } : {}),
      },
      { $set: { isRead: true } }
    );

    res.status(200).json({
      success: true,
      participant: buildUserPreview(participant),
      property: property
        ? {
            _id: property._id,
            title: property.title,
          }
        : null,
      data: messages,
    });
  } catch (error) {
    console.log("GET MESSAGES ERROR:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

const sendMessage = async (req, res) => {
  try {
    const senderId = getCurrentUserId(req);
    const { receiverId, message, propertyId } = req.body || {};

    if (!receiverId || !message?.trim()) {
      return res.status(400).json({ message: "Receiver and message are required" });
    }

    if (String(senderId) === String(receiverId)) {
      return res.status(400).json({ message: "You cannot message yourself" });
    }

    const receiver = await User.findById(receiverId).select("name email role profilePic");
    if (!receiver) {
      return res.status(404).json({ message: "Receiver not found" });
    }

    let property = null;
    if (propertyId) {
      property = await Property.findById(propertyId).select("title");
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
    }

    const savedMessage = await Message.create({
      sender: senderId,
      receiver: receiverId,
      property: propertyId || undefined,
      message: message.trim(),
    });

    const populatedMessage = await Message.findById(savedMessage._id)
      .populate("sender", "name email role profilePic")
      .populate("receiver", "name email role profilePic")
      .populate("property", "title");

    const io = req.app.get("io");
    io.to(String(receiverId)).emit("getMessage", populatedMessage);

    res.status(201).json({ success: true, data: populatedMessage });
  } catch (error) {
    console.log("SEND MESSAGE ERROR:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

const markConversationRead = async (req, res) => {
  try {
    const currentUserId = getCurrentUserId(req);
    const { userId } = req.params;
    const { propertyId } = req.body || {};

    await Message.updateMany(
      {
        sender: userId,
        receiver: currentUserId,
        isRead: false,
        ...(propertyId ? { property: propertyId } : {}),
      },
      { $set: { isRead: true } }
    );

    res.status(200).json({ success: true });
  } catch (error) {
    console.log("MARK READ ERROR:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

const deleteMessage = async (req, res) => {
  try {
    const currentUserId = getCurrentUserId(req);
    const { messageId } = req.params;

    const existingMessage = await Message.findById(messageId);
    if (!existingMessage) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (String(existingMessage.sender) !== String(currentUserId)) {
      return res.status(403).json({ message: "You can delete only your own messages" });
    }

    await Message.findByIdAndDelete(messageId);

    const io = req.app.get("io");
    const payload = { messageId: String(messageId) };

    io.to(String(existingMessage.sender)).emit("messageDeleted", payload);
    io.to(String(existingMessage.receiver)).emit("messageDeleted", payload);

    res.status(200).json({ success: true, message: "Message deleted", data: payload });
  } catch (error) {
    console.log("DELETE MESSAGE ERROR:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  getConversations,
  getConversationMessages,
  sendMessage,
  markConversationRead,
  deleteMessage,
};
