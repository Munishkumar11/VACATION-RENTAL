const Booking = require("../models/bookingModel");
const Payment = require("../models/paymentModel");

const REVENUE_STATUSES = new Set(["confirmed", "completed"]);
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const isSameMonth = (date, refDate) =>
  date.getMonth() === refDate.getMonth() && date.getFullYear() === refDate.getFullYear();

const getPeriodLabel = (period) => {
  if (period === "last") return "Last month";
  if (period === "year") return "This year";
  return "This month";
};

const matchesPeriod = (value, period, now) => {
  const date = new Date(value);

  if (period === "year") {
    return date.getFullYear() === now.getFullYear();
  }

  if (period === "last") {
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return isSameMonth(date, lastMonth);
  }

  return isSameMonth(date, now);
};

const buildTrendBuckets = (period, now) => {
  if (period === "year") {
    return Array.from({ length: 12 }, (_, monthIndex) => ({
      label: MONTH_LABELS[monthIndex],
      month: monthIndex,
      year: now.getFullYear(),
    }));
  }

  const endOffset = period === "last" ? 1 : 0;

  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index) - endOffset, 1);

    return {
      label: MONTH_LABELS[date.getMonth()],
      month: date.getMonth(),
      year: date.getFullYear(),
    };
  });
};

// CREATE BOOKING
const createBooking = async (req, res) => {
  try {
    const booking = await Booking.create(req.body);
    res.status(201).json({
      message: "Booking created successfully",
      data: booking,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// READ ALL BOOKINGS
const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("property", "title location pricePerNight")
      .populate("guest", "name email")
      .populate("host", "name email");
    res.status(200).json({ message: "Bookings fetched successfully", data: bookings });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// READ ONE BOOKING
const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("property", "title location pricePerNight")
      .populate("guest", "name email")
      .populate("host", "name email");
    if (!booking)
      return res.status(404).json({ message: "Booking not found" });
    res.status(200).json({ message: "Booking fetched successfully", data: booking });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// UPDATE BOOKING
const updateBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      req.body,
      {  returnDocument: "after" }
    );
    if (!booking)
      return res.status(404).json({ message: "Booking not found" });
    res.status(200).json({ message: "Booking updated successfully", data: booking });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// DELETE BOOKING
const deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking)
      return res.status(404).json({ message: "Booking not found" });
    res.status(200).json({ message: "Booking deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
// ✅ NEW — GET GUEST'S OWN BOOKINGS
const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ guest: req.user.id })
      .populate("property", "title location images pricePerNight")
      .populate("host", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: bookings });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};


// ✅ NEW — GET HOST BOOKINGS
// Returns all bookings for properties owned by the logged-in host
const getHostBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ host: req.user.id })
      .populate("property", "title location pricePerNight images")
      .populate("guest", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getHostEarnings = async (req, res) => {
  try {
    const period = ["month", "last", "year"].includes(req.query.period)
      ? req.query.period
      : "month";

    const bookings = await Booking.find({ host: req.user.id })
      .populate("property", "title")
      .populate("guest", "name email")
      .sort({ createdAt: -1 })
      .lean();

    const bookingIds = bookings.map((booking) => booking._id);
    const payments = bookingIds.length
      ? await Payment.find({ booking: { $in: bookingIds } }).sort({ createdAt: -1 }).lean()
      : [];

    const paymentsByBooking = new Map();
    payments.forEach((payment) => {
      const key = String(payment.booking);
      const existing = paymentsByBooking.get(key) || [];
      existing.push(payment);
      paymentsByBooking.set(key, existing);
    });

    const normalizedBookings = bookings.map((booking) => {
      const bookingPayments = paymentsByBooking.get(String(booking._id)) || [];
      const latestPayment = bookingPayments[0] || null;
      const paidAmount = bookingPayments
        .filter((payment) => payment.paymentStatus === "paid")
        .reduce((sum, payment) => sum + (payment.amount || 0), 0);

      return {
        _id: booking._id,
        createdAt: booking.createdAt,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        totalPrice: booking.totalPrice || 0,
        status: booking.status,
        property: booking.property
          ? {
              _id: booking.property._id,
              title: booking.property.title,
            }
          : null,
        guest: booking.guest
          ? {
              _id: booking.guest._id,
              name: booking.guest.name,
              email: booking.guest.email,
            }
          : null,
        nights: Math.max(
          1,
          Math.ceil((new Date(booking.checkOut) - new Date(booking.checkIn)) / 86400000)
        ),
        paidAmount,
        paymentStatus: latestPayment?.paymentStatus || "unpaid",
        paymentMethod: latestPayment?.paymentMethod || "",
      };
    });

    const now = new Date();
    const history = normalizedBookings.filter((booking) =>
      matchesPeriod(booking.createdAt, period, now)
    );

    const periodEarnings = normalizedBookings
      .filter(
        (booking) =>
          REVENUE_STATUSES.has(booking.status) &&
          matchesPeriod(booking.createdAt, period, now)
      )
      .reduce((sum, booking) => sum + booking.totalPrice, 0);

    const pendingEarnings = normalizedBookings
      .filter((booking) => booking.status === "pending")
      .reduce((sum, booking) => sum + booking.totalPrice, 0);

    const totalEarnings = normalizedBookings
      .filter((booking) => REVENUE_STATUSES.has(booking.status))
      .reduce((sum, booking) => sum + booking.totalPrice, 0);

    const trend = buildTrendBuckets(period, now).map((bucket) => {
      const value = normalizedBookings
        .filter((booking) => {
          const bookingDate = new Date(booking.createdAt);

          return (
            REVENUE_STATUSES.has(booking.status) &&
            bookingDate.getMonth() === bucket.month &&
            bookingDate.getFullYear() === bucket.year
          );
        })
        .reduce((sum, booking) => sum + booking.totalPrice, 0);

      return {
        label: bucket.label,
        value,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        summary: {
          period,
          periodLabel: getPeriodLabel(period),
          periodEarnings,
          pendingEarnings,
          totalEarnings,
        },
        trend,
        history,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ✅ updated exports
module.exports = {
  createBooking,
  getAllBookings,
  getBookingById,
  updateBooking,
  deleteBooking,
  getHostBookings,
  getMyBookings,
  getHostEarnings,
};
