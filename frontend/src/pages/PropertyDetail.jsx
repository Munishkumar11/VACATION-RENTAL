import { useEffect, useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  MapPin, Users, Bed, Bath, Star, Calendar, CheckCircle,
  MessageCircle, ArrowLeft, ShieldCheck, Wifi, Car, Coffee, Home,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import { formatRating } from "../utils/formatRating";
import useRequireLogin from "../hooks/useRequireLogin";

function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const requireLogin = useRequireLogin();
  const [property, setProperty] = useState();
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [bookingDates, setBookingDates] = useState({
    checkIn: "",
    checkOut: "",
    guests: 1,
  });
  const host = property?.host ?? null;

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser && storedUser !== "undefined") {
        setCurrentUser(JSON.parse(storedUser));
      }
    } catch {
      setCurrentUser(null);
    }
  }, []);

  useEffect(() => {
    const getProperty = async () => {
      try {
        const res = await axios.get(`/property/${id}`);
        setProperty(res.data.data);
      } catch {
        toast.error("Unable to load property details.");
      } finally {
        setLoading(false);
      }
    };
    getProperty();
  }, [id]);

  // ── Build a Set of blocked date strings "YYYY-MM-DD" from DB data ──
  const blockedDateStrings = useMemo(() => {
    const s = new Set();
    (property?.blockedDates || []).forEach((isoStr) => {
      // toISOString gives "2026-03-25T12:00:00.000Z" — take first 10 chars
      const d = new Date(isoStr);
      // Format as local YYYY-MM-DD to match what <input type="date"> gives us
      const yyyy = d.getUTCFullYear();
      const mm   = String(d.getUTCMonth() + 1).padStart(2, "0");
      const dd   = String(d.getUTCDate()).padStart(2, "0");
      s.add(`${yyyy}-${mm}-${dd}`);
    });
    return s;
  }, [property?.blockedDates]);

  // ── Check if a single "YYYY-MM-DD" string is blocked ──────────────
  const isDateBlocked = (dateStr) => blockedDateStrings.has(dateStr);

  // ── Check if any date in a range [start, end) is blocked ──────────
  const rangeHasBlockedDate = (startStr, endStr) => {
    const start = new Date(startStr);
    const end   = new Date(endStr);
    for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
      const yyyy = d.getFullYear();
      const mm   = String(d.getMonth() + 1).padStart(2, "0");
      const dd   = String(d.getDate()).padStart(2, "0");
      if (isDateBlocked(`${yyyy}-${mm}-${dd}`)) return true;
    }
    return false;
  };

  const todayStr = new Date().toISOString().split("T")[0];

  const calculateTotalPrice = () => {
    if (!bookingDates.checkIn || !bookingDates.checkOut) return 0;
    const checkIn  = new Date(bookingDates.checkIn);
    const checkOut = new Date(bookingDates.checkOut);
    const nights   = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    return nights * property?.pricePerNight;
  };

  const totalPrice = calculateTotalPrice();

  const handleCheckInChange = (e) => {
    const val = e.target.value;
    if (isDateBlocked(val)) {
      toast.warn("This date is unavailable. Please choose another check-in date.");
      return;
    }
    // Reset check-out if it's now before the new check-in
    setBookingDates((prev) => ({
      ...prev,
      checkIn: val,
      checkOut: prev.checkOut && prev.checkOut <= val ? "" : prev.checkOut,
    }));
  };

  const handleCheckOutChange = (e) => {
    const val = e.target.value;
    if (isDateBlocked(val)) {
      toast.warn("This date is unavailable. Please choose another check-out date.");
      return;
    }
    // Validate the whole range doesn't cross a blocked date
    if (bookingDates.checkIn && rangeHasBlockedDate(bookingDates.checkIn, val)) {
      toast.warn("Your selected range includes unavailable dates. Please choose different dates.");
      return;
    }
    setBookingDates((prev) => ({ ...prev, checkOut: val }));
  };

  const handleBooking = () => {
    if (!requireLogin("Please login to continue your booking")) {
      return;
    }

    if (!bookingDates.checkIn || !bookingDates.checkOut) return;

    // Final safety check before navigating
    if (rangeHasBlockedDate(bookingDates.checkIn, bookingDates.checkOut)) {
      toast.error("Some selected dates are unavailable. Please choose different dates.");
      return;
    }

    const nights = Math.ceil(
      (new Date(bookingDates.checkOut) - new Date(bookingDates.checkIn)) / (1000 * 60 * 60 * 24)
    );
    navigate("/checkout", {
      state: {
        property,
        checkIn:    bookingDates.checkIn,
        checkOut:   bookingDates.checkOut,
        guests:     bookingDates.guests,
        nights,
        totalPrice,
      },
    });
  };

  const handleMessageHost = () => {
    if (!requireLogin("Please login to message the host")) {
      return;
    }

    if (!host?._id) {
      toast.error("Host information is unavailable right now.");
      return;
    }

    navigate(`/messages?userId=${host._id}&propertyId=${property?._id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f3ec] flex items-center justify-center px-4">
        <div className="rounded-2xl border border-[#e0dbd0] bg-white px-6 py-5 text-sm font-medium text-[#5a7a30] shadow-sm">
          Loading property details...
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-[#f5f3ec] flex items-center justify-center px-4">
        <div className="max-w-md rounded-2xl border border-[#e0dbd0] bg-white px-6 py-5 text-center shadow-sm">
          <p className="text-base font-semibold text-[#2d3a1e]">Property not available</p>
          <p className="mt-2 text-sm text-[#7b745f]">This listing could not be loaded right now.</p>
          <Link
            to="/"
            className="mt-4 inline-flex items-center justify-center rounded-xl bg-[#6b8c3e] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#5a7a30]"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f3ec]">
      {/* Back Button */}
      <div className="bg-white border-b border-[#e0dbd0] sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
          <Link to="/" className="flex items-center gap-2 text-[#6b8c3e] hover:text-[#3d5028] transition-colors">
            <ArrowLeft size={18} />
            <span className="text-sm font-medium">Back</span>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">

            {/* Property Header */}
            <div className="bg-white rounded-2xl shadow-sm border border-[#e0dbd0] p-6">
              <h1 className="text-2xl font-bold text-[#2d3a1e] mb-2">{property?.title}</h1>
              <div className="flex items-center gap-2 text-[#9a9476] mb-4">
                <MapPin className="w-4 h-4" />
                <span>{property?.location?.city}, {property?.location?.country}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="px-3 py-1 bg-[#6b8c3e] text-white text-sm font-semibold rounded-full">
                  {property?.propertyType?.toUpperCase()}
                </span>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold text-[#2d3a1e]">{formatRating(property?.rating)}</span>
                  <span className="text-[#9a9476] text-sm">({property?.reviewCount} reviews)</span>
                </div>
              </div>
            </div>

            {/* Image Gallery */}
            <div className="bg-white rounded-2xl shadow-sm border border-[#e0dbd0] p-6">
              <img
                src={property?.images[selectedImage]?.url || property?.images[selectedImage]}
                alt={property?.title}
                className="w-full h-80 object-cover rounded-xl"
              />
              <div className="flex gap-2 mt-4 overflow-x-auto">
                {property?.images?.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                      selectedImage === index ? "border-[#6b8c3e]" : "border-[#e0dbd0]"
                    }`}
                  >
                    <img src={image?.url || image} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl shadow-sm border border-[#e0dbd0] p-6">
              <h2 className="text-lg font-bold text-[#2d3a1e] mb-3">About</h2>
              <p className="text-[#5a7a30]">{property?.description}</p>
            </div>

            {/* Amenities */}
            <div className="bg-white rounded-2xl shadow-sm border border-[#e0dbd0] p-6">
              <h2 className="text-lg font-bold text-[#2d3a1e] mb-4">Amenities</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { icon: Wifi, name: "WiFi" },
                  { icon: Car, name: "Parking" },
                  { icon: Coffee, name: "Kitchen" },
                  { icon: Home, name: "AC" },
                  { icon: Calendar, name: "Pool" },
                  { icon: CheckCircle, name: "Washer" },
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-[#f5f3ec]">
                    <item.icon className="w-5 h-5 text-[#6b8c3e]" />
                    <span className="text-sm text-[#3d5028]">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* House Rules */}
            <div className="bg-white rounded-2xl shadow-sm border border-[#e0dbd0] p-6">
              <h2 className="text-lg font-bold text-[#2d3a1e] mb-4">House Rules</h2>
              <div className="space-y-2">
                {property?.houseRules?.map((rule, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-[#5a7a30] text-sm">{rule}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Booking Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-[#e0dbd0] p-6 sticky top-24">

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-3xl font-bold text-[#2d3a1e]">₹{property?.pricePerNight}</span>
                  <span className="text-[#9a9476]">/ night</span>
                </div>
                <p className="text-sm text-[#9a9476]">
                  Total: <span className="font-semibold text-[#2d3a1e]">₹{totalPrice || 0}</span>
                </p>
              </div>

              {/* Booking Form */}
              <div className="space-y-4 mb-6">

                {/* Check-in */}
                <div>
                  <label className="block text-sm font-medium text-[#3d5028] mb-1">Check-in</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-[#c5c9a0]" size={16} />
                    <input
                      type="date"
                      value={bookingDates.checkIn}
                      min={todayStr}
                      onChange={handleCheckInChange}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#d6cebc] bg-[#f5f3ec] focus:border-[#6b8c3e] focus:outline-none focus:ring-2 focus:ring-[#e8ecd8] text-sm text-[#2d3a1e]"
                    />
                  </div>
                </div>

                {/* Check-out */}
                <div>
                  <label className="block text-sm font-medium text-[#3d5028] mb-1">Check-out</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-[#c5c9a0]" size={16} />
                    <input
                      type="date"
                      value={bookingDates.checkOut}
                      min={bookingDates.checkIn || todayStr}
                      onChange={handleCheckOutChange}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#d6cebc] bg-[#f5f3ec] focus:border-[#6b8c3e] focus:outline-none focus:ring-2 focus:ring-[#e8ecd8] text-sm text-[#2d3a1e]"
                    />
                  </div>
                </div>

                {/* Unavailable dates notice */}
                {blockedDateStrings.size > 0 && (
                  <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
                    <span className="text-amber-500 text-sm mt-0.5">⚠</span>
                    <p className="text-xs text-amber-700 leading-relaxed">
                      Some dates are unavailable for this property. Selecting a blocked date will show a warning.
                    </p>
                  </div>
                )}

                {/* Guests */}
                <div>
                  <label className="block text-sm font-medium text-[#3d5028] mb-1">Guests</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-[#c5c9a0]" size={16} />
                    <select
                      value={bookingDates.guests}
                      onChange={(e) => setBookingDates({ ...bookingDates, guests: parseInt(e.target.value) })}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#d6cebc] bg-[#f5f3ec] focus:border-[#6b8c3e] focus:outline-none focus:ring-2 focus:ring-[#e8ecd8] text-sm text-[#2d3a1e]"
                    >
                      {[1, 2, 3, 4, 5, 6].map((num) => (
                        <option key={num} value={num}>
                          {num} {num === 1 ? "guest" : "guests"}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <button
                onClick={handleBooking}
                disabled={!bookingDates.checkIn || !bookingDates.checkOut}
                className="w-full bg-[#6b8c3e] text-white py-3.5 rounded-xl font-semibold hover:bg-[#5a7a30] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reserve Now
              </button>

              {/* Trust Badges */}
              <div className="mt-4 pt-4 border-t border-[#e0dbd0]">
                <div className="flex items-center gap-2 text-sm text-[#9a9476]">
                  <ShieldCheck className="w-4 h-4 text-green-500" />
                  <span>Secure payment • Free cancellation</span>
                </div>
              </div>

              {/* Host Info */}
              <div className="mt-6 pt-6 border-t border-[#e0dbd0]">
                {host ? (
                  <>
                    <div className="flex items-center gap-3">
                      {host?.profilePic ? (
                        <img
                          src={host.profilePic}
                          alt={host?.name || "Host"}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-[#e8ecd8] flex items-center justify-center text-sm font-bold text-[#3d5028]">
                          {host?.name?.split(" ").map((part) => part[0]).join("").toUpperCase().slice(0, 2) || "H"}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-semibold text-[#2d3a1e]">{host?.name || "Host"}</p>
                        <p className="text-xs text-[#9a9476]">{host?.email || "Host email unavailable"}</p>
                      </div>
                    </div>
                    <button
                      onClick={handleMessageHost}
                      disabled={String(currentUser?._id) === String(host?._id)}
                      className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 border border-[#d6cebc] rounded-xl text-sm font-medium text-[#3d5028] hover:bg-[#f5f3ec] transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <MessageCircle className="w-4 h-4" />
                      {String(currentUser?._id) === String(host?._id)
                        ? "Your listing"
                        : "Message Host"}
                    </button>
                  </>
                ) : (
                  <div className="rounded-xl border border-[#e0dbd0] bg-[#faf8f2] px-4 py-3 text-sm text-[#7b745f]">
                    Host information is unavailable right now.
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

export default PropertyDetail;
