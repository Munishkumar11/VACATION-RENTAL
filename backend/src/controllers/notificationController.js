const Booking = require("../models/bookingModel");
const Message = require("../models/messageModel");
const Property = require("../models/propertyModel");
const User = require("../models/userModel");

const MAX_NOTIFICATIONS = 12;
const RECENT_DAYS = 30;
const RECENT_WINDOW_MS = RECENT_DAYS * 24 * 60 * 60 * 1000;

const getCurrentUserId = (req) => req.user?.id || req.user?._id;

const isRecent = (value) => {
  if (!value) return false;
  return Date.now() - new Date(value).getTime() <= RECENT_WINDOW_MS;
};

const buildNotification = ({
  id,
  type,
  title,
  description,
  createdAt,
  link,
  isUnread = false,
}) => ({
  id,
  type,
  title,
  description,
  createdAt,
  link,
  isUnread,
});

const sortAndLimit = (items) =>
  items
    .filter((item) => item?.createdAt)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, MAX_NOTIFICATIONS);

const getDismissedNotificationIds = async (currentUserId) => {
  if (!currentUserId) return [];

  const user = await User.findById(currentUserId)
    .select("dismissedNotifications")
    .lean();

  return user?.dismissedNotifications || [];
};

const getUnreadMessageNotifications = async (currentUserId) => {
  const messages = await Message.find({
    receiver: currentUserId,
    isRead: false,
  })
    .sort({ createdAt: -1 })
    .populate("sender", "name")
    .populate("property", "title")
    .lean();

  const seenConversations = new Set();
  const notifications = [];

  messages.forEach((message) => {
    const senderId = String(message.sender?._id || "");
    const propertyId = String(message.property?._id || "");
    const key = `${senderId}:${propertyId}`;

    if (!senderId || seenConversations.has(key)) return;
    seenConversations.add(key);

    const link = message.property?._id
      ? `/messages?userId=${senderId}&propertyId=${message.property._id}`
      : `/messages?userId=${senderId}`;

    notifications.push(
      buildNotification({
        id: `message:${message._id}`,
        type: "message",
        title: `New message from ${message.sender?.name || "a user"}`,
        description: message.property?.title
          ? `${message.property.title}: ${message.message}`
          : message.message,
        createdAt: message.createdAt,
        link,
        isUnread: true,
      })
    );
  });

  return notifications;
};

const getGuestNotifications = async (currentUserId) => {
  const bookings = await Booking.find({ guest: currentUserId })
    .populate("property", "title")
    .populate("host", "name")
    .sort({ updatedAt: -1 })
    .limit(8)
    .lean();

  const notifications = [];
  const now = Date.now();

  bookings.forEach((booking) => {
    const timestamp = booking.updatedAt || booking.createdAt;
    const propertyTitle = booking.property?.title || "your stay";
    const hostName = booking.host?.name || "the host";

    if (isRecent(timestamp)) {
      const configByStatus = {
        pending: {
          title: "Booking pending",
          description: `Your request for ${propertyTitle} is waiting for ${hostName}.`,
        },
        confirmed: {
          title: "Booking confirmed",
          description: `${propertyTitle} was confirmed by ${hostName}.`,
        },
        cancelled: {
          title: "Booking cancelled",
          description: `${propertyTitle} was cancelled. Please review your booking details.`,
        },
        completed: {
          title: "Stay completed",
          description: `Your stay at ${propertyTitle} has been marked complete.`,
        },
      };

      const config = configByStatus[booking.status];
      if (config) {
        notifications.push(
          buildNotification({
            id: `booking:${booking._id}:${booking.status}`,
            type: "booking",
            title: config.title,
            description: config.description,
            createdAt: timestamp,
            link: "/bookings",
          })
        );
      }
    }

    const checkInTime = new Date(booking.checkIn).getTime();
    const daysUntilCheckIn = Math.ceil((checkInTime - now) / 86400000);

    if (booking.status === "confirmed" && daysUntilCheckIn >= 0 && daysUntilCheckIn <= 3) {
      notifications.push(
        buildNotification({
          id: `booking:${booking._id}:upcoming`,
          type: "booking",
          title: "Upcoming stay",
          description: `Your stay at ${propertyTitle} starts on ${new Date(
            booking.checkIn
          ).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
          })}.`,
          createdAt: booking.checkIn,
          link: "/bookings",
        })
      );
    }
  });

  return notifications;
};

const getHostNotifications = async (currentUserId) => {
  const bookings = await Booking.find({ host: currentUserId })
    .populate("property", "title")
    .populate("guest", "name")
    .sort({ updatedAt: -1 })
    .limit(8)
    .lean();

  const notifications = [];

  bookings.forEach((booking) => {
    const timestamp = booking.updatedAt || booking.createdAt;
    if (!isRecent(timestamp)) return;

    const propertyTitle = booking.property?.title || "your property";
    const guestName = booking.guest?.name || "A guest";

    const configByStatus = {
      pending: {
        title: "New booking request",
        description: `${guestName} requested to book ${propertyTitle}.`,
      },
      confirmed: {
        title: "Booking confirmed",
        description: `${guestName}'s stay at ${propertyTitle} is confirmed.`,
      },
      cancelled: {
        title: "Booking cancelled",
        description: `${guestName}'s booking for ${propertyTitle} was cancelled.`,
      },
      completed: {
        title: "Stay completed",
        description: `${guestName}'s stay at ${propertyTitle} is complete.`,
      },
    };

    const config = configByStatus[booking.status];
    if (!config) return;

    const link = booking.guest?._id
      ? `/messages?userId=${booking.guest._id}${
          booking.property?._id ? `&propertyId=${booking.property._id}` : ""
        }`
      : "/host/HostDashboard";

    notifications.push(
      buildNotification({
        id: `host-booking:${booking._id}:${booking.status}`,
        type: "booking",
        title: config.title,
        description: config.description,
        createdAt: timestamp,
        link,
      })
    );
  });

  return notifications;
};

const getAdminNotifications = async () => {
  const [pendingBookings, draftProperties, recentUsers] = await Promise.all([
    Booking.find({ status: "pending" })
      .populate("guest", "name")
      .populate("property", "title")
      .sort({ updatedAt: -1 })
      .limit(4)
      .lean(),
    Property.find({ status: "draft" })
      .populate("host", "name")
      .sort({ updatedAt: -1 })
      .limit(4)
      .lean(),
    User.find()
      .select("name role createdAt")
      .sort({ createdAt: -1 })
      .limit(4)
      .lean(),
  ]);

  const notifications = [];

  pendingBookings.forEach((booking) => {
    notifications.push(
      buildNotification({
        id: `admin-booking:${booking._id}`,
        type: "booking",
        title: "Booking awaiting review",
        description: `${booking.guest?.name || "A guest"} booked ${
          booking.property?.title || "a property"
        }.`,
        createdAt: booking.updatedAt || booking.createdAt,
        link: "/admin",
      })
    );
  });

  draftProperties.forEach((property) => {
    notifications.push(
      buildNotification({
        id: `admin-property:${property._id}`,
        type: "listing",
        title: "Listing awaiting review",
        description: `${property.title} was submitted by ${property.host?.name || "a host"}.`,
        createdAt: property.updatedAt || property.createdAt,
        link: "/admin",
      })
    );
  });

  recentUsers.forEach((user) => {
    if (!isRecent(user.createdAt)) return;

    notifications.push(
      buildNotification({
        id: `admin-user:${user._id}`,
        type: "user",
        title: "New user registered",
        description: `${user.name || "A user"} joined as ${user.role || "guest"}.`,
        createdAt: user.createdAt,
        link: "/admin",
      })
    );
  });

  return notifications;
};

const getNotifications = async (req, res) => {
  try {
    const currentUserId = getCurrentUserId(req);
    const role = req.user?.role;

    const [messageNotifications, roleNotifications, dismissedNotifications] = await Promise.all([
      getUnreadMessageNotifications(currentUserId),
      role === "guest"
        ? getGuestNotifications(currentUserId)
        : role === "host"
          ? getHostNotifications(currentUserId)
          : role === "admin"
            ? getAdminNotifications()
            : Promise.resolve([]),
      getDismissedNotificationIds(currentUserId),
    ]);

    const dismissedIdSet = new Set(dismissedNotifications);
    const notifications = sortAndLimit([...messageNotifications, ...roleNotifications]).filter(
      (notification) => !dismissedIdSet.has(notification.id)
    );

    res.status(200).json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    console.log("GET NOTIFICATIONS ERROR:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

const dismissNotification = async (req, res) => {
  try {
    const currentUserId = getCurrentUserId(req);
    const { notificationId } = req.params;

    if (!currentUserId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!notificationId) {
      return res.status(400).json({ message: "Notification ID is required" });
    }

    await User.findByIdAndUpdate(currentUserId, {
      $addToSet: { dismissedNotifications: notificationId },
    });

    res.status(200).json({
      success: true,
      message: "Notification dismissed successfully",
    });
  } catch (error) {
    console.log("DISMISS NOTIFICATION ERROR:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  getNotifications,
  dismissNotification,
};
