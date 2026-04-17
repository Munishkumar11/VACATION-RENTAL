import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { NavLink } from "react-router-dom";
import axios from "axios";
import { Link } from "react-router-dom";
import { MapPin, Star, Users, Bed, Bath } from "lucide-react";
import { toast } from "react-toastify";
import { formatRating } from "../utils/formatRating";
import { normalizeMediaUrl } from "../utils/mediaUrl";


export default function Wishlist() {
  const [properties, setProperties] = useState([]);
  const [isLoading, setIsLoading]   = useState(true);

   let user = null;
   try {
     const storedUser = localStorage.getItem("user");
     if (storedUser && storedUser !== "undefined") {
       user = JSON.parse(storedUser);
     }
   } catch (error) {
     console.error("Failed to parse user from localStorage", error);
   }

  const fetchWishlist = async () => {
    try {
      const res = await axios.get("/wishlist", { withCredentials: true });
      setProperties(res.data.data || []);
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen bg-[#f5f3ec] flex items-center justify-center">
        <div className="bg-white border border-[#e0dbd0] rounded-[14px] p-8 text-center max-w-sm">
          <p className="text-[16px] font-medium text-[#2d3a1e] mb-2">Please login first</p>
          <p className="text-[13px] text-[#9a9476] mb-5">You need to login or signup to access this page</p>
          <div className="flex gap-3 justify-center">
            <NavLink to="/login" className="px-5 py-2 border border-[#d6cebc] rounded-[8px] text-[13px] text-[#3d5028] hover:bg-[#e8ecd8]">Login</NavLink>
            <NavLink to="/signup" className="px-5 py-2 bg-[#6b8c3e] rounded-[8px] text-[13px] text-white hover:bg-[#5a7a30]">Sign up</NavLink>
          </div>
        </div>
      </div>
    );
  }

  // Remove from wishlist
  const handleRemove = async (propertyId) => {
    try {
      await axios.post(`/wishlist/${propertyId}`, {}, { withCredentials: true });
      setProperties((prev) => prev.filter((p) => p._id !== propertyId));
      toast.success("Removed from wishlist");
    } catch (error) {
      toast.error("Something went wrong");
    }
  };


  return (
    <div className="min-h-screen bg-[#f5f3ec] p-6">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[18px] font-medium text-[#2d3a1e]">My Wishlist</h1>
        <p className="text-[12px] text-[#9a9476] mt-0.5">
          {properties.length} saved {properties.length === 1 ? "property" : "properties"}
        </p>
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-[#e0dbd0] rounded-[14px] overflow-hidden animate-pulse">
              <div className="h-[200px] bg-[#ede9df]" />
              <div className="p-3.5 space-y-2">
                <div className="h-3 bg-[#ede9df] rounded w-3/4" />
                <div className="h-2.5 bg-[#ede9df] rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>

      ) : properties.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-[#e0dbd0] rounded-[14px]">
          <div className="w-14 h-14 rounded-full bg-[#f0ede4] flex items-center justify-center mb-4">
            <Heart className="w-6 h-6 text-[#b0a890]" />
          </div>
          <p className="text-[15px] font-medium text-[#2d3a1e] mb-1.5">
            No saved properties yet
          </p>
          <p className="text-[13px] text-[#9a9476] text-center mb-5">
            Click the heart icon on any property to save it here
          </p>
          <Link
            to="/"
            className="px-5 py-2 bg-[#6b8c3e] text-white text-[13px] font-medium rounded-[8px] hover:bg-[#5a7a30] transition-colors"
          >
            Explore properties
          </Link>
        </div>

      ) : (
        /* Wishlist grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties.map((property) => (
            <div key={property._id} className="group bg-white rounded-[14px] border border-[#e0dbd0] overflow-hidden hover:shadow-[0_4px_20px_rgba(45,58,30,0.10)] transition-all duration-200">

              {/* Image */}
              <div className="relative h-[200px] overflow-hidden bg-[#e8ecd8]">
                <img
                  src={normalizeMediaUrl(property.images?.[0], "/placeholder-property.jpg")}
                  alt={property.title}
                  className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-400"
                />
                <span className="absolute top-3 left-3 px-2.5 py-1 bg-[#2d3a1e] text-[#a3c46a] text-[10px] font-medium tracking-[0.04em] uppercase rounded-full">
                  {property.propertyType}
                </span>
                {/* Remove from wishlist */}
                <button
                  onClick={() => handleRemove(property._id)}
                  className="absolute top-2.5 right-2.5 w-[30px] h-[30px] rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors"
                >
                  <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500" />
                </button>
              </div>

              {/* Body */}
              <div className="p-3.5">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <h3 className="text-[13px] font-medium text-[#2d3a1e] line-clamp-1 flex-1">
                    {property.title}
                  </h3>
                  <div className="flex items-center gap-1 shrink-0">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-[12px] font-medium text-[#2d3a1e]">{formatRating(property.rating)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 mb-3">
                  <MapPin className="w-3 h-3 text-[#b0a890] shrink-0" />
                  <span className="text-[11px] text-[#9a9476]">
                    {property.location?.city}, {property.location?.country}
                  </span>
                </div>

                <div className="flex border-t border-b border-[#f0ece4] mb-3">
                  <div className="flex-1 flex items-center justify-center gap-1.5 py-2">
                    <Users className="w-3 h-3 text-[#9a9476]" />
                    <span className="text-[11px] text-[#6b7a50]">{property.maxGuests} guests</span>
                  </div>
                  <div className="flex-1 flex items-center justify-center gap-1.5 py-2 border-x border-[#f0ece4]">
                    <Bed className="w-3 h-3 text-[#9a9476]" />
                    <span className="text-[11px] text-[#6b7a50]">{property.bedrooms} beds</span>
                  </div>
                  <div className="flex-1 flex items-center justify-center gap-1.5 py-2">
                    <Bath className="w-3 h-3 text-[#9a9476]" />
                    <span className="text-[11px] text-[#6b7a50]">{property.bathrooms} baths</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-baseline gap-1">
                    <span className="text-[17px] font-medium text-[#2d3a1e]">
                      ₹{property.pricePerNight?.toLocaleString("en-IN")}
                    </span>
                    <span className="text-[11px] text-[#9a9476]">/ night</span>
                  </div>
                  <Link
                    to={`/property/${property._id}`}
                    className="bg-[#6b8c3e] text-white text-[12px] font-medium px-3.5 py-1.5 rounded-[8px] hover:bg-[#5a7a30] transition-colors"
                  >
                    View details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
