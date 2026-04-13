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

    username: {
      type: String,
      trim: true,
      default: "",
    },

    dob: {
      type: Date,
      default: null,
    },

    bio: {
      type: String,
      default: "",
    },

    location: {
      type: String,
      default: "",
    },

    language: {
      type: String,
      default: "English",
    },

    profilePic: {
      type: String,
      default: "",
    },

    emergencyContact: {
      name: { type: String, default: "" },
      phone: { type: String, default: "" },
      relation: { type: String, default: "" },
    },

    savedCards: {
      type: [
        {
          type: {
            type: String,
            default: "",
          },
          last4: {
            type: String,
            default: "",
          },
          expiry: {
            type: String,
            default: "",
          },
          isDefault: {
            type: Boolean,
            default: false,
          },
        },
      ],
      default: [],
    },

    bankDetails: {
      accountHolder: { type: String, default: "" },
      accountNo: { type: String, default: "" },
      ifsc: { type: String, default: "" },
      bank: { type: String, default: "" },
    },

    payoutSchedule: {
      type: String,
      enum: ["Daily", "Weekly", "Monthly", ""],
      default: "",
    },

    notificationPreferences: {
      bookingConfirmations: { type: Boolean, default: true },
      bookingReminders: { type: Boolean, default: true },
      newMessages: { type: Boolean, default: true },
      promotions: { type: Boolean, default: false },
      updates: { type: Boolean, default: true },
      smsAlerts: { type: Boolean, default: false },
      pushNotifs: { type: Boolean, default: true },
      newBookingRequests: { type: Boolean, default: true },
      reviewAlerts: { type: Boolean, default: true },
      payoutNotifs: { type: Boolean, default: true },
    },

    privacySettings: {
      showProfile: { type: Boolean, default: true },
      showReviews: { type: Boolean, default: true },
      shareDataAnalytics: { type: Boolean, default: false },
      personalizedAds: { type: Boolean, default: false },
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

    readNotifications: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
