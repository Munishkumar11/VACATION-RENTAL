import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MapPin, Calendar, Users, Shield, Smartphone } from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";

export default function Payment() {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const {
    property,
    checkIn,
    checkOut,
    guests,
    nights,
    guestDetails,
    paymentType,
    amountToPay,
    remainingAmount,
    discount,
    totalPrice,
  } = location.state || {};

  useEffect(() => {
    if (!property) navigate("/");
  }, [property, navigate]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
    });
  };

  const verifyAndFinishPayment = async (bookingId, razorpayResponse) => {
    try {
      const verifyRes = await axios.post(
        "/payment/verify",
        {
          razorpay_order_id: razorpayResponse.razorpay_order_id,
          razorpay_payment_id: razorpayResponse.razorpay_payment_id,
          razorpay_signature: razorpayResponse.razorpay_signature,
          bookingId,
        },
        { withCredentials: true }
      );

      if (verifyRes.data.success) {
        navigate(`/booking/success?bookingId=${bookingId}`);
      } else {
        navigate(`/booking/failed?bookingId=${bookingId}`);
      }
    } catch {
      navigate(`/booking/failed?bookingId=${bookingId}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async () => {
    try {
      setLoading(true);

      // 1. create order on backend
      const res = await axios.post(
        "/payment/initiate",
        {
          propertyId:  property._id,
          checkIn,
          checkOut,
          guestsCount: guests,
          paymentType,
        },
        { withCredentials: true }
      );

      const { orderId, amount, currency, keyId, bookingId, propertyTitle } = res.data;

      if (typeof window === "undefined" || typeof window.Razorpay !== "function") {
        throw new Error("Razorpay checkout failed to load. Please refresh and try again.");
      }

      // 2. open Razorpay checkout popup
      const options = {
        key:         keyId,
        amount:      amount * 100, // paise
        currency:    currency || "INR",
        name:        "StayNest",
        description: propertyTitle,
        order_id:    orderId,
        handler: async (response) => {
          await verifyAndFinishPayment(bookingId, response);
        },
        prefill: {
          name:    guestDetails?.fullName,
          email:   guestDetails?.email,
          contact: guestDetails?.phone,
        },
        theme: { color: "#6b8c3e" },
        modal: {
          ondismiss: () => {
            setLoading(false);
            toast.error("Payment cancelled");
          },
        },
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.open();

    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || "Payment failed. Please try again.");
      setLoading(false);
    }
  };

  if (!property) return null;

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
        <h1 className="text-lg font-bold text-[#2d3a1e]">Payment</h1>

        {/* Step indicator */}
        <div className="ml-auto flex items-center gap-2 text-sm font-medium">
          <span className="w-7 h-7 rounded-full bg-[#e0dbd0] text-[#9a9476] flex items-center justify-center text-xs">1</span>
          <div className="w-6 h-px bg-[#e0dbd0]" />
          <span className="w-7 h-7 rounded-full bg-[#6b8c3e] text-white flex items-center justify-center text-xs font-bold">2</span>
          <div className="w-6 h-px bg-[#e0dbd0]" />
          <span className="w-7 h-7 rounded-full bg-[#e0dbd0] text-[#9a9476] flex items-center justify-center text-xs">3</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-5 gap-8">

        {/* LEFT */}
        <div className="lg:col-span-3 space-y-5">

          {/* Guest details summary */}
          <div className="bg-white rounded-2xl border border-[#e0dbd0] p-5">
            <h2 className="text-base font-bold text-[#2d3a1e] mb-3">Guest Details</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-[#9a9476] text-xs mb-0.5">Full Name</p>
                <p className="text-[#2d3a1e] font-medium">{guestDetails?.fullName}</p>
              </div>
              <div>
                <p className="text-[#9a9476] text-xs mb-0.5">Email</p>
                <p className="text-[#2d3a1e] font-medium">{guestDetails?.email}</p>
              </div>
              <div>
                <p className="text-[#9a9476] text-xs mb-0.5">Phone</p>
                <p className="text-[#2d3a1e] font-medium">{guestDetails?.phone}</p>
              </div>
              {guestDetails?.specialRequests && (
                <div className="col-span-2">
                  <p className="text-[#9a9476] text-xs mb-0.5">Special Requests</p>
                  <p className="text-[#2d3a1e] font-medium">{guestDetails.specialRequests}</p>
                </div>
              )}
            </div>
          </div>

          {/* Pay via UPI */}
          <div className="bg-white rounded-2xl border border-[#e0dbd0] p-5">
            <h2 className="text-base font-bold text-[#2d3a1e] mb-1">Pay via UPI</h2>
            <p className="text-xs text-[#9a9476] mb-5">
              Complete your payment securely via Razorpay — supports GPay, Paytm, PhonePe & all UPI apps
            </p>

            {/* UPI apps */}
            <div className="flex items-center gap-3 mb-5">
              {[
                { name: "GPay",    emoji: "🟢" },
                { name: "Paytm",   emoji: "🔵" },
                { name: "PhonePe", emoji: "🟣" },
                { name: "Any UPI", emoji: "💳" },
              ].map((app) => (
                <div
                  key={app.name}
                  className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl bg-white border border-[#e0dbd0]"
                >
                  <span className="text-xl">{app.emoji}</span>
                  <span className="text-[10px] text-[#6b7a50] font-medium">{app.name}</span>
                </div>
              ))}
            </div>

            {/* Amount */}
            <div className="bg-[#f5f3ec] rounded-xl border border-[#e0dbd0] p-4 mb-5">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-[#9a9476]">
                    {paymentType === "full" ? "Total (incl. 5% discount)" : "Advance (30% now)"}
                  </p>
                  <p className="text-2xl font-bold text-[#2d3a1e] mt-0.5">
                    ₹{amountToPay?.toLocaleString("en-IN")}
                  </p>
                  {paymentType === "advance" && (
                    <p className="text-xs text-[#9a9476] mt-0.5">
                      + ₹{remainingAmount?.toLocaleString("en-IN")} due at check-in
                    </p>
                  )}
                  {paymentType === "full" && (
                    <p className="text-xs text-[#6b8c3e] mt-0.5">
                      You save ₹{discount?.toLocaleString("en-IN")}
                    </p>
                  )}
                </div>
                <Smartphone className="w-8 h-8 text-[#6b8c3e] opacity-60" />
              </div>
            </div>

            <button
              onClick={handlePay}
              disabled={loading}
              className="w-full bg-[#6b8c3e] hover:bg-[#5a7a30] disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Opening payment…
                </>
              ) : (
                <>🔒 Pay ₹{amountToPay?.toLocaleString("en-IN")} via UPI</>
              )}
            </button>
          </div>

          {/* Security note */}
          <div className="flex items-center gap-3 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
            <Shield className="w-5 h-5 text-[#6b8c3e] shrink-0" />
            <p className="text-sm text-[#5a7a30]">
              Payments are processed securely by Razorpay. We never store your UPI or card details.
            </p>
          </div>
        </div>

        {/* RIGHT — booking summary */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-[#e0dbd0] overflow-hidden sticky top-6">
            <div className="h-36 overflow-hidden">
              <img
                src={property?.images?.[0]?.url || "https://placehold.co/600x400?text=Property"}
                alt={property?.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-5 space-y-3">
              <div>
                <h3 className="text-sm font-bold text-[#2d3a1e] line-clamp-2">{property?.title}</h3>
                <div className="flex items-center gap-1 mt-1 text-xs text-[#9a9476]">
                  <MapPin className="w-3 h-3" />
                  <span>{property?.location?.city}, {property?.location?.country}</span>
                </div>
              </div>

              <div className="border-t border-[#e0dbd0] pt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <div className="flex items-center gap-1.5 text-[#9a9476]">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Check-in</span>
                  </div>
                  <span className="font-medium text-[#2d3a1e]">{formatDate(checkIn)}</span>
                </div>
                <div className="flex justify-between">
                  <div className="flex items-center gap-1.5 text-[#9a9476]">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Check-out</span>
                  </div>
                  <span className="font-medium text-[#2d3a1e]">{formatDate(checkOut)}</span>
                </div>
                <div className="flex justify-between">
                  <div className="flex items-center gap-1.5 text-[#9a9476]">
                    <Users className="w-3.5 h-3.5" />
                    <span>Guests</span>
                  </div>
                  <span className="font-medium text-[#2d3a1e]">{guests}</span>
                </div>
              </div>

              <div className="border-t border-[#e0dbd0] pt-3 space-y-1.5 text-sm">
                <div className="flex justify-between text-[#9a9476]">
                  <span>₹{property?.pricePerNight} × {nights} nights</span>
                  <span>₹{totalPrice?.toLocaleString("en-IN")}</span>
                </div>
                {paymentType === "full" && (
                  <div className="flex justify-between text-[#6b8c3e]">
                    <span>Discount (5%)</span>
                    <span>- ₹{discount?.toLocaleString("en-IN")}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-[#2d3a1e] pt-2 border-t border-[#e0dbd0]">
                  <span>Pay now</span>
                  <span>₹{amountToPay?.toLocaleString("en-IN")}</span>
                </div>
                {paymentType === "advance" && (
                  <div className="flex justify-between text-xs text-[#9a9476]">
                    <span>Due at check-in</span>
                    <span>₹{remainingAmount?.toLocaleString("en-IN")}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
