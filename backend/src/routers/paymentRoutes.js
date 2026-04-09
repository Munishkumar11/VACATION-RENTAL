const express = require("express");
const router = express.Router();
const { initiatePayment, verifyPayment } = require("../controllers/paymentController");
const { authMiddleware } = require("../middlewares/authMiddleware");

router.post("/initiate", authMiddleware, initiatePayment);
router.post("/verify",   authMiddleware, verifyPayment);

module.exports = router;


