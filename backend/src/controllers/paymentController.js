const crypto = require("crypto");
const axios = require("axios");
const Booking = require("../models/bookingModel");
const Payment = require("../models/paymentModel");
const Property = require("../models/propertyModel");

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);

const formatDate = (value) => {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

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
  };
};

const canAccessBooking = (booking, user) => {
  const userId = String(user?.id || user?._id || "");

  return (
    user?.role === "admin" ||
    String(booking.guest?._id || booking.guest) === userId ||
    String(booking.host?._id || booking.host) === userId
  );
};

const getInvoiceDataForBooking = async (bookingId, user) => {
  const booking = await Booking.findById(bookingId)
    .populate("property", "title location pricePerNight")
    .populate("guest", "name email phone")
    .populate("host", "name email phone hostDetails")
    .lean();

  if (!booking) {
    const error = new Error("Booking not found.");
    error.statusCode = 404;
    throw error;
  }

  if (!canAccessBooking(booking, user)) {
    const error = new Error("You are not allowed to access this invoice.");
    error.statusCode = 403;
    throw error;
  }

  const payment = await Payment.findOne({ booking: booking._id })
    .sort({ createdAt: -1 })
    .lean();

  if (!payment || payment.paymentStatus !== "paid") {
    const error = new Error("Invoice is available after successful payment only.");
    error.statusCode = 400;
    throw error;
  }

  const nights = Math.max(
    1,
    Math.ceil((new Date(booking.checkOut) - new Date(booking.checkIn)) / 86400000)
  );
  const paidAmount = payment.amount || 0;
  const totalAmount = booking.totalPrice || paidAmount;
  const fullPaymentAfterDiscount = Math.round(totalAmount * 0.95);
  const hasFullPaymentDiscount = Math.abs(paidAmount - fullPaymentAfterDiscount) <= 1;
  const discountAmount = hasFullPaymentDiscount ? Math.max(totalAmount - paidAmount, 0) : 0;
  const payableAmount = Math.max(totalAmount - discountAmount, 0);
  const balanceAmount = Math.max(payableAmount - paidAmount, 0);
  const invoiceDate = payment.updatedAt || payment.createdAt || new Date();
  const invoiceNumber = `INV-${new Date(invoiceDate).getFullYear()}-${String(booking._id).slice(-8).toUpperCase()}`;

  return {
    invoiceNumber,
    invoiceDate,
    booking: {
      id: booking._id,
      status: booking.status,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      nights,
      guestsCount: booking.guestsCount,
      totalPrice: totalAmount,
    },
    property: {
      title: booking.property?.title || "Property",
      pricePerNight: booking.property?.pricePerNight || 0,
      location: booking.property?.location || {},
    },
    guest: {
      name: booking.guest?.name || "Guest",
      email: booking.guest?.email || "",
      phone: booking.guest?.phone || "",
    },
    host: {
      name: booking.host?.hostDetails?.businessName || booking.host?.name || "Host",
      email: booking.host?.email || "",
      phone: booking.host?.phone || "",
      address: booking.host?.hostDetails?.address || "",
    },
    payment: {
      id: payment._id,
      status: payment.paymentStatus,
      method: payment.paymentMethod || "upi",
      paidAmount,
      balanceAmount,
      currency: payment.currency || "INR",
      razorpayOrderId: payment.razorpayOrderId,
      razorpayPaymentId: payment.razorpayPaymentId,
      paidAt: payment.updatedAt || payment.createdAt,
    },
    totals: {
      nightlyRate: booking.property?.pricePerNight || 0,
      subtotal: totalAmount,
      discount: discountAmount,
      payable: payableAmount,
      paid: paidAmount,
      balance: balanceAmount,
    },
  };
};

const renderInvoiceHtml = (invoice) => {
  const locationParts = [
    invoice.property.location?.address,
    invoice.property.location?.city,
    invoice.property.location?.country,
  ].filter(Boolean);

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(invoice.invoiceNumber)}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #243018; margin: 0; background: #f5f3ee; }
    .page { max-width: 860px; margin: 32px auto; background: #fff; border: 1px solid #ddd8cc; padding: 36px; }
    .top { display: flex; justify-content: space-between; gap: 24px; border-bottom: 2px solid #6b8c3e; padding-bottom: 22px; }
    h1 { margin: 0; color: #2f4f1f; font-size: 30px; }
    h2 { margin: 0 0 10px; font-size: 15px; color: #2f4f1f; text-transform: uppercase; letter-spacing: .08em; }
    p { margin: 4px 0; line-height: 1.45; }
    .muted { color: #7d7968; font-size: 13px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 28px; }
    .box { border: 1px solid #e0dbd0; background: #faf8f2; padding: 16px; }
    table { width: 100%; border-collapse: collapse; margin-top: 28px; }
    th, td { padding: 13px 12px; border-bottom: 1px solid #e8e3d8; text-align: left; }
    th { background: #f2efe6; color: #4a5f30; font-size: 12px; text-transform: uppercase; }
    td:last-child, th:last-child { text-align: right; }
    .totals { margin-left: auto; margin-top: 22px; width: 330px; }
    .line { display: flex; justify-content: space-between; padding: 9px 0; border-bottom: 1px solid #ece7dc; }
    .paid { font-weight: bold; color: #2f4f1f; font-size: 18px; }
    .footer { margin-top: 32px; padding-top: 18px; border-top: 1px solid #e8e3d8; color: #7d7968; font-size: 12px; }
    @media print { body { background: #fff; } .page { margin: 0; border: 0; } }
  </style>
</head>
<body>
  <main class="page">
    <section class="top">
      <div>
        <h1>StayNest Invoice</h1>
        <p class="muted">Payment receipt for your confirmed booking</p>
      </div>
      <div>
        <p><strong>Invoice:</strong> ${escapeHtml(invoice.invoiceNumber)}</p>
        <p><strong>Date:</strong> ${formatDate(invoice.invoiceDate)}</p>
        <p><strong>Booking:</strong> ${escapeHtml(invoice.booking.id)}</p>
      </div>
    </section>

    <section class="grid">
      <div class="box">
        <h2>Billed To</h2>
        <p><strong>${escapeHtml(invoice.guest.name)}</strong></p>
        <p>${escapeHtml(invoice.guest.email)}</p>
        <p>${escapeHtml(invoice.guest.phone)}</p>
      </div>
      <div class="box">
        <h2>Host</h2>
        <p><strong>${escapeHtml(invoice.host.name)}</strong></p>
        <p>${escapeHtml(invoice.host.email)}</p>
        <p>${escapeHtml(invoice.host.phone)}</p>
        <p>${escapeHtml(invoice.host.address)}</p>
      </div>
    </section>

    <section class="grid">
      <div class="box">
        <h2>Stay Details</h2>
        <p><strong>${escapeHtml(invoice.property.title)}</strong></p>
        <p>${escapeHtml(locationParts.join(", "))}</p>
        <p>${formatDate(invoice.booking.checkIn)} to ${formatDate(invoice.booking.checkOut)}</p>
        <p>${invoice.booking.nights} night(s), ${invoice.booking.guestsCount} guest(s)</p>
      </div>
      <div class="box">
        <h2>Payment</h2>
        <p><strong>Status:</strong> ${escapeHtml(invoice.payment.status.toUpperCase())}</p>
        <p><strong>Method:</strong> ${escapeHtml(invoice.payment.method.toUpperCase())}</p>
        <p><strong>Razorpay Payment:</strong> ${escapeHtml(invoice.payment.razorpayPaymentId || "-")}</p>
      </div>
    </section>

    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th>Qty</th>
          <th>Rate</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${escapeHtml(invoice.property.title)} stay</td>
          <td>${invoice.booking.nights} night(s)</td>
          <td>${formatCurrency(invoice.totals.nightlyRate)}</td>
          <td>${formatCurrency(invoice.totals.subtotal)}</td>
        </tr>
      </tbody>
    </table>

    <section class="totals">
      <div class="line"><span>Total booking amount</span><strong>${formatCurrency(invoice.totals.subtotal)}</strong></div>
      <div class="line"><span>Discount</span><strong>-${formatCurrency(invoice.totals.discount)}</strong></div>
      <div class="line"><span>Payable amount</span><strong>${formatCurrency(invoice.totals.payable)}</strong></div>
      <div class="line paid"><span>Paid online</span><span>${formatCurrency(invoice.totals.paid)}</span></div>
      <div class="line"><span>Balance due at check-in</span><strong>${formatCurrency(invoice.totals.balance)}</strong></div>
    </section>

    <p class="footer">
      This invoice was generated from verified booking and Razorpay payment data. Keep it for your records.
    </p>
  </main>
</body>
</html>`;
};

const createRazorpayOrder = async ({ amount, currency, receipt, notes, razorpay }) => {
  try {
    const response = await axios.post(
      "https://api.razorpay.com/v1/orders",
      {
        amount,
        currency,
        receipt,
        notes,
      },
      {
        auth: {
          username: razorpay.keyId,
          password: razorpay.keySecret,
        },
        proxy: false,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (apiError) {
    const details =
      apiError.response?.data?.error?.description ||
      apiError.response?.data?.error?.reason ||
      apiError.response?.data?.error?.code ||
      apiError.message;

    throw new Error(`Razorpay order creation failed: ${details}`);
  }
};

// ── STEP 1: Initiate Mock Payment ─────────────────────────────────────────────
// POST /payment/initiate
const initiatePayment = async (req, res) => {
  try {
    const { propertyId, checkIn, checkOut, guestsCount, paymentType = "full" } = req.body;
    const guestId = req.user?._id || req.user?.id;
    const razorpay = getRazorpayConfig();

    if (!guestId) {
      return res.status(401).json({ message: "Please login to continue payment." });
    }

    if (!razorpay) {
      return res.status(500).json({
        message: "Razorpay is not configured. Add real RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in backend/.env.",
      });
    }

    if (!propertyId || !checkIn || !checkOut || !guestsCount) {
      return res.status(400).json({
        message: "Missing payment details. Please select dates and guests again.",
      });
    }

    // 1. fetch property
    const property = await Property.findById(propertyId);
    if (!property)
      return res.status(404).json({ message: "Property not found" });

    if (!property.host) {
      return res.status(400).json({
        message: "This listing is missing host information, so payment cannot be started yet.",
      });
    }

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
      order = await createRazorpayOrder({
        amount: amountToPay * 100,
        currency: "INR",
        receipt: `booking_${String(booking._id).slice(-12)}`,
        notes: {
          bookingId: String(booking._id),
          propertyId: String(property._id),
          guestId: String(guestId),
          paymentType,
        },
        razorpay,
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
    res.status(500).json({ message: error.message || "Unable to initiate payment." });
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

const getInvoice = async (req, res) => {
  try {
    const invoice = await getInvoiceDataForBooking(req.params.bookingId, req.user);

    res.status(200).json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Unable to load invoice.",
    });
  }
};

const downloadInvoice = async (req, res) => {
  try {
    const invoice = await getInvoiceDataForBooking(req.params.bookingId, req.user);
    const html = renderInvoiceHtml(invoice);

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${invoice.invoiceNumber}.html"`
    );
    res.status(200).send(html);
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Unable to download invoice.",
    });
  }
};

module.exports = { initiatePayment, verifyPayment, getInvoice, downloadInvoice };
