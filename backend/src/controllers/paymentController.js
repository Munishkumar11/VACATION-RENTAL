const crypto = require("crypto");
const Razorpay = require("razorpay");
const Booking = require("../models/bookingModel");
const Payment = require("../models/paymentModel");
const Property = require("../models/propertyModel");

const getRazorpayConfig = () => {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();

  const isPlaceholder = (value) =>
    !value ||
    value.startsWith("replace_with_") ||
    value.startsWith("your_") ||
    value.includes("dummy");

  if (isPlaceholder(keyId) || isPlaceholder(keySecret)) {
    return null;
  }

  return {
    keyId,
    keySecret,
    instance: new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    }),
  };
};

// ── STEP 1: Initiate Mock Payment ─────────────────────────────────────────────
// POST /payment/initiate
const initiatePayment = async (req, res) => {
  try {
    const { propertyId, checkIn, checkOut, guestsCount, paymentType = "full" } = req.body;
    const guestId = req.user._id || req.user.id;
    const razorpay = getRazorpayConfig();

    if (!razorpay) {
      return res.status(500).json({
        message: "Razorpay is not configured. Add real RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in backend/.env.",
      });
    }

    // 1. fetch property
    const property = await Property.findById(propertyId);
    if (!property)
      return res.status(404).json({ message: "Property not found" });

    // 2. calculate nights + total
    const nights = Math.ceil(
      (new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)
    );
    if (nights <= 0)
      return res.status(400).json({ message: "Invalid dates" });

    const totalPrice = nights * property.pricePerNight;

    // 3. calculate amount based on paymentType
    let amountToPay;
    if (paymentType === "full") {
      amountToPay = Math.round(totalPrice * 0.95); // 5% discount
    } else {
      amountToPay = Math.round(totalPrice * 0.30); // 30% advance
    }

    // 4. create booking as "pending"
    const booking = await Booking.create({
      property:   propertyId,
      guest:      guestId,
      host:       property.host,
      checkIn,
      checkOut,
      guestsCount,
      totalPrice,
      status:     "pending",
    });

    // 5. create pending Payment record
    await Payment.create({
      booking:       booking._id,
      guest:         guestId,
      host:          property.host,
      amount:        amountToPay,
      paymentStatus: "pending",
      paymentMethod: "upi",
    });

    let order;

    try {
      order = await razorpay.instance.orders.create({
        amount: amountToPay * 100,
        currency: "INR",
        receipt: `booking_${String(booking._id).slice(-12)}`,
        notes: {
          bookingId: String(booking._id),
          propertyId: String(property._id),
          guestId: String(guestId),
          paymentType,
        },
      });
    } catch (orderError) {
      await Booking.findByIdAndDelete(booking._id);
      await Payment.deleteOne({ booking: booking._id });
      throw orderError;
    }

    await Payment.findOneAndUpdate(
      { booking: booking._id },
      {
        currency: order.currency,
        razorpayOrderId: order.id,
      }
    );

    res.status(200).json({
      success:       true,
      bookingId:     booking._id,
      amount:        amountToPay,
      currency:      order.currency,
      propertyTitle: property.title,
      keyId:         razorpay.keyId,
      orderId:       order.id,
    });

  } catch (error) {
    console.log("PAYMENT INITIATE ERROR:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// ── STEP 2: Mock Verify — directly confirm booking ───────────────────────────
// POST /payment/verify
const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;
    const razorpay = getRazorpayConfig();

    if (!razorpay) {
      return res.status(500).json({
        message: "Razorpay is not configured. Add real RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in backend/.env.",
      });
    }

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !bookingId) {
      return res.status(400).json({ success: false, message: "Missing Razorpay verification fields." });
    }

    const expectedSignature = crypto
      .createHmac("sha256", razorpay.keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      await Payment.findOneAndUpdate(
        { booking: bookingId },
        {
          paymentStatus: "failed",
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
        }
      );

      return res.status(400).json({ success: false, message: "Payment verification failed." });
    }

    await Booking.findByIdAndUpdate(bookingId, { status: "confirmed" });
    await Payment.findOneAndUpdate(
      { booking: bookingId },
      {
        paymentStatus: "paid",
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
      }
    );

    res.status(200).json({ success: true, bookingId });

  } catch (error) {
    console.log("PAYMENT VERIFY ERROR:", error.message);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { initiatePayment, verifyPayment };
