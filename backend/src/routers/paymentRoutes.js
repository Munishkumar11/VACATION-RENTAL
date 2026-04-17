const express = require("express");
const router = express.Router();
const {
  initiatePayment,
  verifyPayment,
  getInvoice,
  downloadInvoice,
} = require("../controllers/paymentController");
const { authMiddleware } = require("../middlewares/authMiddleware");

router.post("/initiate", authMiddleware, initiatePayment);
router.post("/verify",   authMiddleware, verifyPayment);
router.get("/invoice/:bookingId", authMiddleware, getInvoice);
router.get("/invoice/:bookingId/download", authMiddleware, downloadInvoice);

module.exports = router;


