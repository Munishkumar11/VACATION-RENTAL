import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MapPin, Calendar, Users, Shield, ChevronRight, Phone, Mail, User, MessageSquare, Star, Tag } from "lucide-react";
import { formatRating } from "../utils/formatRating";

function BookingCheckout() {
  const location = useLocation();
  const navigate = useNavigate();

  const { property, checkIn, checkOut, guests, totalPrice, nights } = location.state || {};

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    specialRequests: "",
  });

  const [errors, setErrors] = useState({});
  const [paymentType, setPaymentType] = useState("full"); // "full" or "advance"

  // ── Payment calculations ──────────────────────
  const fullAmount    = totalPrice || (property?.pricePerNight || 0) * (nights || 1);
  const discountRate  = 0.05; // 5% discount for full payment
  const discount      = Math.round(fullAmount * discountRate);
  const fullPayAmount = fullAmount - discount;
  const advanceRate   = 0.30; // 30% advance
  const advanceAmount = Math.round(fullAmount * advanceRate);
  const remainingAmount = fullAmount - advanceAmount;

  const amountToPay = paymentType === "full" ? fullPayAmount : advanceAmount;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const validate = () => {
    const newErrors = {};
    if (!form.fullName.trim()) newErrors.fullName = "Full name is required";
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email))
      newErrors.email = "Valid email is required";
    if (!form.phone.trim() || form.phone.length < 10)
      newErrors.phone = "Valid phone number is required";
    return newErrors;
  };

  const handleSubmit = () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    navigate("/payment", {
      state: {
        property,
        checkIn,
        checkOut,
        guests,
        totalPrice,
        nights,
        guestDetails: form,
        paymentType,
        amountToPay,
        advanceAmount,
        remainingAmount,
        discount,
      },
    });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-[#f5f3ee]">

      {/* Header */}
      <div className="bg-white border-b border-[#e0dbd0] px-6 py-4 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="text-[#6b8c3e] hover:text-[#5a7a30] font-semibold flex items-center gap-1 text-sm"
        >
          ← Back
        </button>
        <span className="text-[#e0dbd0]">|</span>
        <h1 className="text-lg font-bold text-[#2d3a1e]">Complete Your Booking</h1>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-5 gap-8">

        {/* LEFT */}
        <div className="lg:col-span-3 space-y-6">

          {/* Step indicator */}
          <div className="flex items-center gap-2 text-sm font-medium">
            <div className="flex items-center gap-2 text-[#6b8c3e]">
              <span className="w-7 h-7 rounded-full bg-[#6b8c3e] text-white flex items-center justify-center text-xs font-bold">1</span>
              <span>Your Details</span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#c5c9a0]" />
            <div className="flex items-center gap-2 text-[#9a9476]">
              <span className="w-7 h-7 rounded-full bg-[#e0dbd0] text-[#9a9476] flex items-center justify-center text-xs font-bold">2</span>
              <span>Payment</span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#c5c9a0]" />
            <div className="flex items-center gap-2 text-[#9a9476]">
              <span className="w-7 h-7 rounded-full bg-[#e0dbd0] text-[#9a9476] flex items-center justify-center text-xs font-bold">3</span>
              <span>Confirmed</span>
            </div>
          </div>

          {/* Guest Information Form */}
          <div className="bg-white rounded-2xl shadow-sm border border-[#e0dbd0] p-6">
            <h2 className="text-xl font-bold text-[#2d3a1e] mb-1">Guest Information</h2>
            <p className="text-sm text-[#9a9476] mb-6">Please enter the details of the primary guest</p>

            <div className="space-y-5">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-semibold text-[#2d3a1e] mb-1.5">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#c5c9a0]" />
                  <input
                    type="text"
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border ${errors.fullName ? "border-red-400 bg-red-50" : "border-[#e0dbd0]"} text-[#2d3a1e] text-sm focus:outline-none focus:border-[#6b8c3e] focus:ring-2 focus:ring-[#6b8c3e]/20 transition`}
                  />
                </div>
                {errors.fullName && <p className="text-red-400 text-xs mt-1">{errors.fullName}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-[#2d3a1e] mb-1.5">
                  Email Address <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#c5c9a0]" />
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="john@example.com"
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border ${errors.email ? "border-red-400 bg-red-50" : "border-[#e0dbd0]"} text-[#2d3a1e] text-sm focus:outline-none focus:border-[#6b8c3e] focus:ring-2 focus:ring-[#6b8c3e]/20 transition`}
                  />
                </div>
                {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-[#2d3a1e] mb-1.5">
                  Phone Number <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#c5c9a0]" />
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border ${errors.phone ? "border-red-400 bg-red-50" : "border-[#e0dbd0]"} text-[#2d3a1e] text-sm focus:outline-none focus:border-[#6b8c3e] focus:ring-2 focus:ring-[#6b8c3e]/20 transition`}
                  />
                </div>
                {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
              </div>

              {/* Special Requests */}
              <div>
                <label className="block text-sm font-semibold text-[#2d3a1e] mb-1.5">
                  Special Requests <span className="text-[#9a9476] font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3.5 w-4 h-4 text-[#c5c9a0]" />
                  <textarea
                    name="specialRequests"
                    value={form.specialRequests}
                    onChange={handleChange}
                    placeholder="Early check-in, extra pillows, allergies..."
                    rows={3}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#e0dbd0] text-[#2d3a1e] text-sm focus:outline-none focus:border-[#6b8c3e] focus:ring-2 focus:ring-[#6b8c3e]/20 transition resize-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ✅ Payment Options */}
          <div className="bg-white rounded-2xl shadow-sm border border-[#e0dbd0] p-6">
            <h2 className="text-xl font-bold text-[#2d3a1e] mb-1">Payment Option</h2>
            <p className="text-sm text-[#9a9476] mb-5">Choose how you want to pay</p>

            <div className="grid grid-cols-2 gap-3">

              {/* Full Payment */}
              <button
                type="button"
                onClick={() => setPaymentType("full")}
                className={`flex flex-col items-start p-4 rounded-xl border-2 text-left transition-all ${
                  paymentType === "full"
                    ? "border-[#6b8c3e] bg-[#f0f5e8]"
                    : "border-[#e0dbd0] bg-white hover:border-[#c5c9a0]"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <span className="text-[13px] font-bold text-[#2d3a1e]">Full Payment</span>
                  {/* ✅ 5% off badge */}
                  <span className="flex items-center gap-1 text-[10px] font-semibold text-white bg-[#6b8c3e] px-1.5 py-0.5 rounded-full">
                    <Tag className="w-2.5 h-2.5" />
                    5% OFF
                  </span>
                </div>
                <p className="text-[11px] text-[#9a9476] mb-2">Pay everything now and save</p>
                <div>
                  <span className="text-[11px] text-[#9a9476] line-through">₹{fullAmount.toLocaleString("en-IN")}</span>
                  <p className="text-[18px] font-bold text-[#6b8c3e]">₹{fullPayAmount.toLocaleString("en-IN")}</p>
                  <p className="text-[10px] text-[#6b8c3e]">Save ₹{discount.toLocaleString("en-IN")}</p>
                </div>
                {paymentType === "full" && (
                  <div className="mt-2 w-full text-center text-[11px] font-medium text-[#6b8c3e] bg-[#e8ecd8] rounded-lg py-1">
                    ✓ Selected
                  </div>
                )}
              </button>

              {/* Advance Booking */}
              <button
                type="button"
                onClick={() => setPaymentType("advance")}
                className={`flex flex-col items-start p-4 rounded-xl border-2 text-left transition-all ${
                  paymentType === "advance"
                    ? "border-[#6b8c3e] bg-[#f0f5e8]"
                    : "border-[#e0dbd0] bg-white hover:border-[#c5c9a0]"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <span className="text-[13px] font-bold text-[#2d3a1e]">Advance Booking</span>
                  <span className="text-[10px] font-semibold text-[#b45309] bg-[#fef3c7] px-1.5 py-0.5 rounded-full">
                    30% Now
                  </span>
                </div>
                <p className="text-[11px] text-[#9a9476] mb-2">Pay 30% now, rest at check-in</p>
                <div>
                  <p className="text-[18px] font-bold text-[#2d3a1e]">₹{advanceAmount.toLocaleString("en-IN")}</p>
                  <p className="text-[10px] text-[#9a9476]">
                    + ₹{remainingAmount.toLocaleString("en-IN")} at check-in
                  </p>
                </div>
                {paymentType === "advance" && (
                  <div className="mt-2 w-full text-center text-[11px] font-medium text-[#6b8c3e] bg-[#e8ecd8] rounded-lg py-1">
                    ✓ Selected
                  </div>
                )}
              </button>

            </div>

            {/* Selected payment summary */}
            <div className="mt-4 p-3 bg-[#f5f3ec] rounded-xl border border-[#e0dbd0]">
              <div className="flex justify-between items-center">
                <span className="text-[13px] text-[#6b7a50] font-medium">
                  {paymentType === "full" ? "You pay now:" : "You pay now (30%):"}
                </span>
                <span className="text-[16px] font-bold text-[#2d3a1e]">
                  ₹{amountToPay.toLocaleString("en-IN")}
                </span>
              </div>
              {paymentType === "advance" && (
                <div className="flex justify-between items-center mt-1">
                  <span className="text-[12px] text-[#9a9476]">Due at check-in (70%):</span>
                  <span className="text-[13px] text-[#9a9476]">
                    ₹{remainingAmount.toLocaleString("en-IN")}
                  </span>
                </div>
              )}
              {paymentType === "full" && (
                <div className="flex justify-between items-center mt-1">
                  <span className="text-[12px] text-[#6b8c3e]">You save:</span>
                  <span className="text-[13px] text-[#6b8c3e] font-medium">
                    ₹{discount.toLocaleString("en-IN")}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Trust badge */}
          <div className="flex items-center gap-3 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
            <Shield className="w-5 h-5 text-[#6b8c3e] shrink-0" />
            <p className="text-sm text-[#5a7a30]">
              Your personal information is encrypted and secure. We never share your details with third parties.
            </p>
          </div>
        </div>

        {/* RIGHT — Booking Summary */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-2xl shadow-sm border border-[#e0dbd0] overflow-hidden sticky top-6">
            <div className="h-44 overflow-hidden">
              <img
                src={property?.images?.[0]?.url || property?.images?.[0] || "https://placehold.co/600x400?text=Property"}
                alt={property?.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="p-5">
              <div className="mb-4">
                <span className="text-xs font-semibold px-2 py-0.5 bg-[#6b8c3e] text-white rounded-full uppercase tracking-wide">
                  {property?.propertyType || "Property"}
                </span>
                <h3 className="text-base font-bold text-[#2d3a1e] mt-2 line-clamp-2">
                  {property?.title || "Property Name"}
                </h3>
                <div className="flex items-center gap-1 mt-1 text-sm text-[#9a9476]">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{property?.location?.city}, {property?.location?.country}</span>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                  <span className="text-sm font-semibold text-[#2d3a1e]">{formatRating(property?.rating)}</span>
                  <span className="text-xs text-[#9a9476]">({property?.reviews || 0} reviews)</span>
                </div>
              </div>

              <div className="border-t border-[#e0dbd0] pt-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-[#9a9476]">
                    <Calendar className="w-4 h-4" />
                    <span>Check-in</span>
                  </div>
                  <span className="font-semibold text-[#2d3a1e]">{formatDate(checkIn)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-[#9a9476]">
                    <Calendar className="w-4 h-4" />
                    <span>Check-out</span>
                  </div>
                  <span className="font-semibold text-[#2d3a1e]">{formatDate(checkOut)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-[#9a9476]">
                    <Users className="w-4 h-4" />
                    <span>Guests</span>
                  </div>
                  <span className="font-semibold text-[#2d3a1e]">{guests || 1}</span>
                </div>
              </div>

              <div className="border-t border-[#e0dbd0] mt-4 pt-4 space-y-2">
                <div className="flex justify-between text-sm text-[#9a9476]">
                  <span>₹{property?.pricePerNight} × {nights || 1} night{nights > 1 ? "s" : ""}</span>
                  <span>₹{fullAmount.toLocaleString("en-IN")}</span>
                </div>

                {paymentType === "full" && (
                  <div className="flex justify-between text-sm text-[#6b8c3e]">
                    <span>Discount (5%)</span>
                    <span>- ₹{discount.toLocaleString("en-IN")}</span>
                  </div>
                )}

                <div className="flex justify-between text-sm text-[#9a9476]">
                  <span>Service fee</span>
                  <span>₹0</span>
                </div>

                <div className="flex justify-between font-bold text-[#2d3a1e] text-base pt-2 border-t border-[#e0dbd0]">
                  <span>Pay now</span>
                  <span>₹{amountToPay.toLocaleString("en-IN")}</span>
                </div>

                {paymentType === "advance" && (
                  <div className="flex justify-between text-sm text-[#9a9476]">
                    <span>Due at check-in</span>
                    <span>₹{remainingAmount.toLocaleString("en-IN")}</span>
                  </div>
                )}
              </div>

              <button
                onClick={handleSubmit}
                className="mt-5 w-full bg-[#6b8c3e] hover:bg-[#5a7a30] text-white font-bold py-3.5 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                Continue to Payment
                <ChevronRight className="w-4 h-4" />
              </button>

              <p className="text-center text-xs text-[#9a9476] mt-3">
                🔒 Free cancellation • Secure payment
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BookingCheckout;
