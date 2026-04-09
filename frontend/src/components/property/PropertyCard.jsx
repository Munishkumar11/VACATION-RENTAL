  import { useState } from "react";
  import axios from "axios";
  import { toast } from "react-toastify";
  import { Link } from "react-router-dom";
  import { formatRating } from "../../utils/formatRating";
  import {
    MapPin, Users, Bed, Bath, Home, Star, Heart, ShieldCheck,
  } from "lucide-react";

  function PropertyCard({ property, initialWishlisted = false }) {
    const {
      title, description, propertyType, pricePerNight, location,
      maxGuests, bedrooms, bathrooms, beds, images = [],
      host, rating = 4.5, reviews = 120,
    } = property;

    const formattedPrice = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(pricePerNight);

    const [wishlisted, setWishlisted] = useState(initialWishlisted);
    const [loading, setLoading] = useState(false);
  const handleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // ✅ Check login first
    const storedUser = localStorage.getItem("user");
    if (!storedUser || storedUser === "undefined") {
      toast.error("Please login to add to wishlist");
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
        toast.error("Please login to add to wishlist");
      } else {
        toast.error("Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  };

    return (
      <div className="group bg-white rounded-2xl shadow-sm border border-[#e0dbd0] overflow-hidden hover:shadow-xl transition-all duration-300">
        {/* Image Section */}
        <div className="relative h-56 overflow-hidden">
          <img
            src={images[0]?.url || "/placeholder-property.jpg"}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          <div className="absolute top-3 right-3">
          <button
    onClick={handleWishlist}
    disabled={loading}
    className="p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors shadow-sm"
  >
    <Heart className={`w-5 h-5 transition-all ${
      wishlisted ? "fill-red-500 text-red-500" : "text-[#c5c9a0]"
    }`} />
  </button>
          </div>
          <div className="absolute top-3 left-3">
            <span className="px-3 py-1 bg-[#6b8c3e] text-white text-xs font-semibold rounded-full">
              {propertyType}
            </span>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-5">
          {/* Title & Rating */}
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-lg font-bold text-[#2d3a1e] line-clamp-1 group-hover:text-[#6b8c3e] transition-colors">
              {title}
            </h3>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span className="text-sm font-semibold text-[#2d3a1e]">{formatRating(rating)}</span>
              <span className="text-xs text-[#9a9476]">({reviews})</span>
            </div>
          </div>

          {/* Description */}
       <p className="text-sm text-[#5a7a30] line-clamp-2 mb-4">
  {typeof description === "string" ? description : ""}
</p>
          {/* Location */}
          <div className="flex items-center gap-2 text-sm text-[#9a9476] mb-4">
            <MapPin className="w-4 h-4 text-[#c5c9a0]" />
            <span className="line-clamp-1">
              {typeof location === "object" ? `${location?.city ?? ""}, ${location?.country ?? ""}` : location}
            </span>
          </div>

          {/* Property Details */}
          <div className="grid grid-cols-3 gap-3 py-4 border-y border-[#e0dbd0] mb-4">
            <div className="flex flex-col items-center">
              <Users className="w-5 h-5 text-[#6b8c3e] mb-1" />
              <span className="text-xs text-[#9a9476]">Guests</span>
              <span className="text-sm font-semibold text-[#2d3a1e]">{maxGuests}</span>
            </div>
            <div className="flex flex-col items-center">
              <Bed className="w-5 h-5 text-[#6b8c3e] mb-1" />
              <span className="text-xs text-[#9a9476]">Bedrooms</span>
              <span className="text-sm font-semibold text-[#2d3a1e]">{bedrooms}</span>
            </div>
            <div className="flex flex-col items-center">
              <Bath className="w-5 h-5 text-[#6b8c3e] mb-1" />
              <span className="text-xs text-[#9a9476]">Bathrooms</span>
              <span className="text-sm font-semibold text-[#2d3a1e]">{bathrooms}</span>
            </div>
          </div>

          {/* Host Info */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#8aab5c] to-[#6b8c3e] flex items-center justify-center text-white text-xs font-bold">
              {host?.name?.charAt(0) || "H"}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-[#2d3a1e]">
                Hosted by {host?.name || "Verified Host"}
              </p>
              <div className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-green-500" />
                <span className="text-xs text-[#9a9476]">Verified</span>
              </div>
            </div>
          </div>

          {/* Price & CTA */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-2xl font-bold text-[#2d3a1e]">{formattedPrice}</span>
              <span className="text-sm text-[#9a9476]"> / night</span>
            </div>
            <Link
              to={`/property/${property?._id}`}
              className="bg-[#6b8c3e] text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-[#5a7a30] transition-colors shadow-sm"
            >
              View Details
            </Link>
          </div>
        </div>
      </div>
    );
  }

  export default PropertyCard;
