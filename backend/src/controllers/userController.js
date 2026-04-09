const User = require("../models/userModel.js");
const bcrypt = require("bcrypt");
const sendTemplateMail = require("../utils/mailUtil.js");
const { sendToken } = require("../utils/jwt.js");
const jwt = require("jsonwebtoken");
const secret = process.env.JWT_SECRET;
const register = async (req, res) => {
  try {
    console.log("BODY:", req.body); // ✅ debug

    const userData = req.body || {};

    if (!userData.email || !userData.password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const existingUser = await User.findOne({ email: userData.email });

    //checks if the email is already registered
    if (existingUser) {
      return res.status(400).json({
        message: "User email already exists, please login",
      });
    }

    // ✅ password check
    if (!userData.password) {
      return res.status(400).json({
        message: "Password is required",
      });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    userData.password = hashedPassword;

    //creating user in database
    const createdUser = await User.create(userData);

    //creating token
    sendToken(createdUser, res);

    // hide password in response
    createdUser.password = undefined;

    // ✅ FIX: mail crash handle
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
    console.log("ERROR:", error.message); // ✅ better error
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

    // ✅ sendToken sets the cookie
    sendToken(user, res);

    res.status(200).json({
      message: "User logged in successfully",
      data: user,  // ← frontend uses this for role check
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
      message: "Logged out successfully"
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

// READ ALL USERS
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.log("ERROR:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// UPDATE USER
// UPDATE USER (admin)
const updateUser = async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      {  returnDocument: "after"  }
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

// DELETE USER (admin)
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

// ─── ADD THESE 4 NEW FUNCTIONS BELOW ──────────────────────────

// UPDATE OWN PROFILE (logged-in user)
const updateMyProfile = async (req, res) => {
  try {
    const updates = req.body;
    delete updates.password; // safety — never allow here
    delete updates.role;     // safety — never allow here

    // If photo uploaded via Cloudinary/multer
    if (req.file?.path) {
      updates.photo = req.file.path;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,       // ← from authMiddleware (logged-in user's own id)
      updates,
      {  returnDocument: "after"  }
    ).select("-password");

    res.status(200).json({ success: true, data: updatedUser });
  } catch (error) {
    console.log("ERROR:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// ADD CARD (guest)
const addCard = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const { type, last4, expiry } = req.body;
    const isDefault = user.savedCards.length === 0; // first card = default
    user.savedCards.push({ type, last4, expiry, isDefault });
    await user.save();
    res.status(200).json({ success: true, data: user.savedCards });
  } catch (error) {
    console.log("ERROR:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// DELETE CARD (guest)
const deleteCard = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.savedCards = user.savedCards.filter(
      (c) => c._id.toString() !== req.params.cardId
    );
    await user.save();
    res.status(200).json({ success: true, data: user.savedCards });
  } catch (error) {
    console.log("ERROR:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// UPDATE BANK DETAILS (host)
const updateBankDetails = async (req, res) => {
  try {
    const { accountHolder, accountNo, ifsc, bank, payoutSchedule } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
        bankDetails: { accountHolder, accountNo, ifsc, bank },
        payoutSchedule,
      },
      {  returnDocument: "after"  }
    ).select("-password");

    res.status(200).json({ success: true, data: updatedUser });
  } catch (error) {
    console.log("ERROR:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// ─── UPDATE module.exports ─────────────────────────────────────
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
};