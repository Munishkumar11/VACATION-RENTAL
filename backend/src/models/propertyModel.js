const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const propertySchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },

    description: String,

    propertyType: {
      type: String,
      enum: ["apartment", "villa", "house", "studio","farmhouse","cottage"],
    },

    pricePerNight: {
      type: Number,
      required: true,
    },

    location: {
      city: String,
      country: String,
      address: String,
    },

    maxGuests: Number,

    bedrooms: Number,

    bathrooms: Number,

    beds: Number,

    amenities: [String],

    images: [
      {
        url: String,
        public_id: String,
      },
    ],

    rating: {
      type: Number,
      default: 0,
    },

    reviewCount: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["active", "inactive","draft"],
      default: "active",
    },

    host: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },

    // ── Blocked dates (set by host via calendar) ──
    blockedDates: {
      type: [Date],
      default: [],
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Property", propertySchema);