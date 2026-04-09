const express = require("express");
const router  = express.Router();
const upload  = require("../middlewares/upload");

const {
  getAllProperties,
  createProperty,
  getPropertyById,
  updateProperty,
  deleteProperty,
} = require("../controllers/propertyController");

const { authMiddleware } = require("../middlewares/authMiddleware");
const hostMiddleware     = require("../middlewares/hostMiddleware");
const adminMiddleware    = require("../middlewares/adminMiddleware");

// ── Public ────────────────────────────────────────
router.get("/", getAllProperties);

// ── Host only ─────────────────────────────────────
router.get("/host", authMiddleware, hostMiddleware, async (req, res) => {
  try {
    const Property = require("../models/propertyModel");
    const properties = await Property.find({ host: req.user.id });
    res.status(200).json({ success: true, data: properties });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/",   authMiddleware, hostMiddleware, upload.array("images", 10), createProperty);
router.put("/:id", authMiddleware, hostMiddleware, upload.any(), updateProperty);

// ── Host: save blocked dates for a property ───────
// PATCH /property/:id/blocked-dates
router.patch("/:id/blocked-dates", authMiddleware, hostMiddleware, async (req, res) => {
  try {
    const Property = require("../models/propertyModel");
    const { blockedDates } = req.body;

    if (!Array.isArray(blockedDates)) {
      return res.status(400).json({ success: false, message: "blockedDates must be an array" });
    }

    // Only the host who owns the property can update it
    const property = await Property.findOneAndUpdate(
      { _id: req.params.id, host: req.user._id },
      { blockedDates: blockedDates.map((d) => new Date(d)) },
      { new: true }
    );

    if (!property) {
      return res.status(404).json({ success: false, message: "Property not found or unauthorized" });
    }

    res.status(200).json({ success: true, data: property.blockedDates });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});

// ── Host OR Admin can delete ──────────────────────
router.delete("/:id", authMiddleware, deleteProperty);

// ── Admin only — approve / reject listing ─────────
router.put("/:id/status", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const Property = require("../models/propertyModel");
    const { status } = req.body;

    if (!["active", "inactive", "draft"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const property = await Property.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!property)
      return res.status(404).json({ message: "Property not found" });

    res.status(200).json({
      success: true,
      message: `Listing ${status === "active" ? "approved" : "rejected"}`,
      data: property,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});

// ⚠️ /:id must always be LAST
router.get("/:id", getPropertyById);

module.exports = router;
