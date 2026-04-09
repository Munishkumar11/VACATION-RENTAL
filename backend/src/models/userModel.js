const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    role: {
      type: String,
      enum: ["admin", "host", "guest"],
      default: "guest",
    },

    phone: {
      type: String,
      unique: true,
      sparse: true, // allows multiple null values
    },

    profilePic: {
      type: String,
      default: "",
    },

    // ✅ Optional Host Details (future use)
    hostDetails: {
      businessName: {
        type: String,
        default: "",
      },
      address: {
        type: String,
        default: "",
      },
      idProof: {
        type: String, // image or document URL
        default: "",
      },
    },

    // ✅ Optional Rating System
    rating: {
      type: Number,
      default: 0,
    },

    is_verified: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    dismissedNotifications: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
