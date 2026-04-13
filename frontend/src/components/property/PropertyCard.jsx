import { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import { formatRating } from "../../utils/formatRating";
import useRequireLogin from "../../hooks/useRequireLogin";
import {
  MapPin,
  Users,
  Bed,
  Bath,
  Star,
  Heart,
  ShieldCheck,
} from "lucide-react";

function PropertyCard({ property, initialWishlisted = false }) {
  const {
    title,
    description,
    propertyType,
    pricePerNight,
    location,
    maxGuests,
    bedrooms,
    bathrooms,
    images = [],
    host,
    rating = 4.5,
    reviews = 120,
  } = property;

  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(pricePerNight);

  const [wishlisted, setWishlisted] = useState(initialWishlisted);
  const [loading, setLoading] = useState(false);
  const requireLogin = useRequireLogin();

  const handleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!requireLogin("Please login to add to wishlist")) {
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(
        `/wishlist/${property._id}`,
        {},
        { withCredentials: true }
      );
      setWishlisted(res.data.wishlisted);
      toast.success(res.data.message);
    } catch (error) {
      if (error.response?.status === 401) {
        requireLogin("Please login to add to wishlist", { force: true });
      } else {
        toast.error("Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="premium-card group overflow-hidden rounded-[28px] border border-[rgba(22,58,47,0.1)] bg-white/95 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_28px_60px_rgba(17,24,39,0.14)]">
      {/* Image Section */}
      <div className="relative h-64 overflow-hidden rounded-[24px] rounded-b-none">
        <img
          src={images[0]?.url || "/placeholder-property.jpg"}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(17,24,39,0.42)] via-transparent to-transparent" />

        <div className="absolute right-4 top-4">
          <button
            onClick={handleWishlist}
            disabled={loading}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[rgba(255,255,255,0.45)] bg-white/88 text-[#163a2f] shadow-[0_12px_28px_rgba(17,24,39,0.16)] backdrop-blur-sm transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Heart
              className={`h-5 w-5 transition-all ${
                wishlisted
                  ? "fill-[#c86161] text-[#c86161]"
                  : "text-[#163a2f]"
              }`}
            />
          </button>
        </div>

        <div className="absolute left-4 top-4">
          <span className="rounded-full border border-[rgba(255,255,255,0.28)] bg-[rgba(22,58,47,0.76)] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-sm">
            {propertyType}
          </span>
        </div>

        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3 text-white">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-white/70">
              From
            </p>
            <div className="flex items-baseline gap-1.5">
              <span className="font-['Cormorant_Garamond',serif] text-3xl font-semibold leading-none">
                {formattedPrice}
              </span>
              <span className="text-sm text-white/78">/ night</span>
            </div>
          </div>

          <div className="rounded-full border border-[rgba(255,255,255,0.28)] bg-white/14 px-3 py-2 backdrop-blur-sm">
            <div className="flex items-center gap-1.5">
              <Star className="h-4 w-4 fill-[#C8A96B] text-[#C8A96B]" />
              <span className="text-sm font-semibold">
                {formatRating(rating)}
              </span>
              <span className="text-xs text-white/70">({reviews})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="space-y-5 p-6">
        {/* Title & Description */}
        <div className="space-y-2">
          <h3 className="font-['Cormorant_Garamond',serif] text-[1.9rem] font-semibold leading-none text-[#163a2f] transition-colors group-hover:text-[#234f41]">
            {title}
          </h3>

          <p className="line-clamp-2 text-sm leading-6 text-[#5f6570]">
            {typeof description === "string" ? description : ""}
          </p>
        </div>

        {/* Location */}
        <div className="flex items-center gap-2 text-sm text-[#6b7280]">
          <MapPin className="h-4 w-4 text-[#C8A96B]" />
          <span className="line-clamp-1">
            {typeof location === "object"
              ? `${location?.city ?? ""}, ${location?.country ?? ""}`
              : location}
          </span>
        </div>

        {/* Property Details */}
        <div className="grid grid-cols-3 gap-3 rounded-[22px] border border-[rgba(22,58,47,0.08)] bg-[#fcfbf8] p-3.5">
          <div className="rounded-[18px] bg-white px-3 py-3 text-center shadow-[0_10px_22px_rgba(17,24,39,0.05)]">
            <Users className="mx-auto mb-2 h-4 w-4 text-[#163a2f]" />
            <span className="text-[10px] uppercase tracking-[0.18em] text-[#9ca3af]">
              Guests
            </span>
            <span className="mt-1 block text-sm font-semibold text-[#1e1e1e]">
              {maxGuests}
            </span>
          </div>

          <div className="rounded-[18px] bg-white px-3 py-3 text-center shadow-[0_10px_22px_rgba(17,24,39,0.05)]">
            <Bed className="mx-auto mb-2 h-4 w-4 text-[#163a2f]" />
            <span className="text-[10px] uppercase tracking-[0.18em] text-[#9ca3af]">
              Bedrooms
            </span>
            <span className="mt-1 block text-sm font-semibold text-[#1e1e1e]">
              {bedrooms}
            </span>
          </div>

          <div className="rounded-[18px] bg-white px-3 py-3 text-center shadow-[0_10px_22px_rgba(17,24,39,0.05)]">
            <Bath className="mx-auto mb-2 h-4 w-4 text-[#163a2f]" />
            <span className="text-[10px] uppercase tracking-[0.18em] text-[#9ca3af]">
              Bathrooms
            </span>
            <span className="mt-1 block text-sm font-semibold text-[#1e1e1e]">
              {bathrooms}
            </span>
          </div>
        </div>

        {/* Host Info */}
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-[#8aab5c] to-[#6b8c3e] text-xs font-bold text-white">
            {host?.name?.charAt(0) || "H"}
          </div>

          <div className="flex-1">
            <p className="text-sm font-medium text-[#2d3a1e]">
              Hosted by {host?.name || "Verified Host"}
            </p>
            <div className="flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-green-500" />
              <span className="text-xs text-[#9a9476]">Verified</span>
            </div>
          </div>
        </div>

        {/* Price & CTA */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-2xl font-bold text-[#2d3a1e]">
              {formattedPrice}
            </span>
            <span className="text-sm text-[#9a9476]"> / night</span>
          </div>

          <Link
            to={`/property/${property?._id}`}
            className="rounded-xl bg-[#6b8c3e] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#5a7a30]"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}

export default PropertyCard;