const {
  createBooking,
  getAllBookings,
  getBookingById,
  updateBooking,
  deleteBooking,
  getHostBookings, 
  getMyBookings, // ← add this
  getHostEarnings,
} = require("../controllers/bookingController");

const { authMiddleware } = require("../middlewares/authMiddleware");
const hostMiddleware = require("../middlewares/hostMiddleware");

const router = require("express").Router();

// ⚠️ IMPORTANT — /host must be BEFORE /:id
router.get("/my-bookings", authMiddleware, getMyBookings);
router.get("/host/earnings", authMiddleware, hostMiddleware, getHostEarnings);
router.get("/host", authMiddleware, hostMiddleware, getHostBookings); // ← add this


router.post("/",    authMiddleware, createBooking);
router.get("/",     getAllBookings);            
router.put("/:id",  authMiddleware, updateBooking);
router.delete("/:id", authMiddleware, deleteBooking);
router.get("/:id",  authMiddleware, getBookingById);

module.exports = router;
