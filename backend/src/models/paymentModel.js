const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const paymentSchema = new Schema(
  {
    booking: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Booking",
    },

    guest: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    host: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    amount: {
      type: Number,
      required: true
    },

    currency: {
      type: String,
      default: "INR",
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },

    paymentMethod: {
      type: String,
      enum: ["card", "upi", "wallet"],
    },

    razorpayOrderId: {
      type: String,
      default: "",
    },

    razorpayPaymentId: {
      type: String,
      default: "",
    },

    razorpaySignature: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Payment", paymentSchema);
