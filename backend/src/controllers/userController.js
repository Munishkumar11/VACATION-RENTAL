const User = require("../models/userModel.js");
const bcrypt = require("bcrypt");
const sendTemplateMail = require("../utils/mailUtil.js");
const { sendToken } = require("../utils/jwt.js");
const jwt = require("jsonwebtoken");

const secret = process.env.JWT_SECRET;

const register = async (req, res) => {
  try {
    console.log("BODY:", req.body);

    const userData = req.body || {};

    if (!userData.email || !userData.password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const existingUser = await User.findOne({ email: userData.email });

    if (existingUser) {
      return res.status(400).json({
        message: "User email already exists, please login",
      });
    }

    if (!userData.password) {
      return res.status(400).json({
        message: "Password is required",
      });
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);
    userData.password = hashedPassword;

    const createdUser = await User.create(userData);

    sendToken(createdUser, res);

    createdUser.password = undefined;

    try {
      await sendTemplateMail(
        userData.email,
        "Welcome to our app",
        "Welcome.html",
        {
          name: createdUser.name,
        }
      );
    } catch (mailError) {
      console.log("MAIL ERROR:", mailError.message);
    }

    res.status(201).json({
      message: "User created successfully",
      data: createdUser,
    });
  } catch (error) {
    console.log("ERROR:", error.message);
    res.status(500).json({
      message: error.message,
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email: email });

    if (!user) {
      return res.status(400).json({
        message: "User not found, please sign up",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    user.password = undefined;

    sendToken(user, res);

    res.status(200).json({
      message: "User logged in successfully",
      data: user,
    });
  } catch (error) {
    console.log("ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

const logout = async (req, res) => {
  try {
    res.clearCookie("token");

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.log("ERROR:", error.message);
    res.status(500).json({
      message: error.message,
    });
  }
};

const me = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.log("ERROR:", error.message);
    res.status(500).json({
      message: error.message,
    });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.log("ERROR:", error.message);
    res.status(500).json({ message: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { returnDocument: "after" }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ success: true, data: updatedUser });
  } catch (error) {
    console.log("ERROR:", error.message);
    res.status(500).json({ message: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.log("ERROR:", error.message);
    res.status(500).json({ message: error.message });
  }
};

const parseJsonField = (value, fallback = undefined) => {
  if (value === undefined) {
    return fallback;
  }

  if (typeof value !== "string") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    return value;
  }
};

const updateMyProfile = async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates.password;
    delete updates.role;
    delete updates.email;

    updates.emergencyContact = parseJsonField(updates.emergencyContact, undefined);
    updates.savedCards = parseJsonField(updates.savedCards, undefined);
    updates.bankDetails = parseJsonField(updates.bankDetails, undefined);
    updates.notificationPreferences = parseJsonField(updates.notificationPreferences, undefined);
    updates.privacySettings = parseJsonField(updates.privacySettings, undefined);

    if (req.file?.path) {
      updates.profilePic = req.file.path;
    } else if (updates.photo) {
      updates.profilePic = updates.photo;
    }

    delete updates.photo;

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { returnDocument: "after" }
    ).select("-password");

    res.status(200).json({ success: true, data: updatedUser });
  } catch (error) {
    console.log("ERROR:", error.message);
    res.status(500).json({ message: error.message });
  }
};

const addCard = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const { type, last4, expiry } = req.body;

    if (!type || !last4 || !expiry) {
      return res.status(400).json({ message: "Card type, last4 and expiry are required" });
    }

    if (!Array.isArray(user.savedCards)) {
      user.savedCards = [];
    }

    const isDefault = user.savedCards.length === 0;
    user.savedCards.push({ type, last4, expiry, isDefault });
    await user.save();

    res.status(200).json({ success: true, data: user.savedCards });
  } catch (error) {
    console.log("ERROR:", error.message);
    res.status(500).json({ message: error.message });
  }
};

const deleteCard = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.savedCards = user.savedCards.filter(
      (c) => c._id.toString() !== req.params.cardId
    );

    if (user.savedCards.length > 0 && !user.savedCards.some((card) => card.isDefault)) {
      user.savedCards[0].isDefault = true;
    }

    await user.save();
    res.status(200).json({ success: true, data: user.savedCards });
  } catch (error) {
    console.log("ERROR:", error.message);
    res.status(500).json({ message: error.message });
  }
};

const updateBankDetails = async (req, res) => {
  try {
    const { accountHolder, accountNo, ifsc, bank, payoutSchedule } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
        bankDetails: { accountHolder, accountNo, ifsc, bank },
        payoutSchedule,
      },
      { returnDocument: "after" }
    ).select("-password");

    res.status(200).json({ success: true, data: updatedUser });
  } catch (error) {
    console.log("ERROR:", error.message);
    res.status(500).json({ message: error.message });
  }
};

const changeMyPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current password and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters long" });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.log("ERROR:", error.message);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  register,
  login,
  logout,
  me,
  getAllUsers,
  updateUser,
  deleteUser,
  updateMyProfile,
  addCard,
  deleteCard,
  updateBankDetails,
  changeMyPassword,
};
