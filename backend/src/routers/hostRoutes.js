const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { isHost } = require("../middleware/authMiddleware");
const upload = require("../middlewares/upload");

const {
  createProperty,
  getMyProperties,
  updateProperty,
  deleteProperty,
  getHostBookings,
  updateBookingStatus,
} = require("../controllers/hostController");

const { isAuthenticated } = require("../middleware/authMiddleware");

// 🏡 Property Routes
router.post("/property", isAuthenticated, isHost, upload.array("images", 10), createProperty);
router.get("/properties", isAuthenticated,isHost, getMyProperties);
router.put("/property/:id", isAuthenticated,isHost, updateProperty);
router.delete("/property/:id", isAuthenticated,isHost, deleteProperty);

// 📅 Booking Routes
router.get("/bookings", isAuthenticated,isHost, getHostBookings);
router.put("/booking/:id", isAuthenticated,isHost, updateBookingStatus);

router.post("/add-property", upload.array("images", 5), (req, res) => {
    const imageUrls = req.files.map(file => file.path);

  res.json({
    success: true,
    images: imageUrls
  });

});

module.exports = router;