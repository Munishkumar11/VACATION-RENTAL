const express = require("express");
const router = express.Router();
const { authMiddleware, isHost } = require("../middlewares/authMiddleware");
const upload = require("../middlewares/upload");

const {
  createProperty,
  getMyProperties,
  updateProperty,
  deleteProperty,
  getHostBookings,
  updateBookingStatus,
} = require("../controllers/hostController");


// 🏡 Property Routes
router.post("/property", authMiddleware, isHost, upload.array("images", 10), createProperty);
router.get("/properties", authMiddleware,isHost, getMyProperties);
router.put("/property/:id", authMiddleware,isHost, updateProperty);
router.delete("/property/:id", authMiddleware,isHost, deleteProperty);

// 📅 Booking Routes
router.get("/bookings", authMiddleware,isHost, getHostBookings);
router.put("/booking/:id", authMiddleware,isHost, updateBookingStatus);

router.post("/add-property", upload.array("images", 5), (req, res) => {
    const imageUrls = req.files.map(file => file.path);

  res.json({
    success: true,
    images: imageUrls
  });

});

module.exports = router;
