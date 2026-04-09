import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2, MapPin, Star } from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";

export default function HostListings() {
  const [properties, setProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProperties = async () => {
    try {
      const res = await axios.get("/property/host",{ withCredentials: true });
      setProperties(res.data.data || []);
    } catch (error) {
      console.log(error);
      toast.error("Failed to load listings");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchProperties(); }, []);

  const deleteProperty = async (id) => {
    if (!window.confirm("Delete this listing?")) return;
    try {
      await axios.delete(`/property/${id}`,{ withCredentials: true });
      toast.success("Listing deleted");
      fetchProperties();
    } catch (error) {
      toast.error("Failed to delete listing");
    }
  };

  const statusStyle = {
    active: "bg-[#e8ecd8] text-[#3d5028]",
    inactive: "bg-[#f0ece4] text-[#9a9476]",
    draft: "bg-[#fef3c7] text-[#92400e]",
  };

  return (
    <div className="min-h-screen bg-[#f5f3ec] p-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[18px] font-medium text-[#2d3a1e]">My listings</h1>
          <p className="text-[12px] text-[#9a9476] mt-0.5">
            {properties.length} {properties.length === 1 ? "property" : "properties"}
          </p>
        </div>
        <Link
          to="/host/AddListing"
          className="flex items-center gap-1.5 h-[36px] px-4 bg-[#6b8c3e] text-white text-[12px] font-medium rounded-[8px] hover:bg-[#5a7a30] transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add listing
        </Link>
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-[#e0dbd0] rounded-[12px] overflow-hidden animate-pulse">
              <div className="h-[130px] bg-[#ede9df]" />
              <div className="p-3.5 space-y-2">
                <div className="h-3 bg-[#ede9df] rounded w-3/4" />
                <div className="h-2.5 bg-[#ede9df] rounded w-1/2" />
                <div className="h-7 bg-[#ede9df] rounded" />
              </div>
            </div>
          ))}
        </div>

      ) : properties.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-[#e0dbd0] rounded-[12px]">
          <div className="w-12 h-12 rounded-full bg-[#f0ede4] flex items-center justify-center mb-4">
            <Plus className="w-5 h-5 text-[#b0a890]" />
          </div>
          <p className="text-[15px] font-medium text-[#2d3a1e] mb-1.5">next listings </p>
          <p className="text-[13px] text-[#9a9476] mb-5">Again add your property to start hosting</p>
          <Link
            to="/host/AddListing"
            className="px-5 py-2 bg-[#6b8c3e] text-white text-[13px] font-medium rounded-[8px] hover:bg-[#5a7a30] transition-colors"
          >
            Add your first listing
          </Link>
        </div>

      ) : (
        /* Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties.map((property) => (
            <div key={property._id} className="bg-white border border-[#e0dbd0] rounded-[12px] overflow-hidden hover:shadow-[0_4px_16px_rgba(45,58,30,0.08)] transition-all">

              {/* Image */}
              <div className="relative h-[140px] bg-[#e8ecd8] overflow-hidden">
                {property.images?.[0] ? (
                  <img
                    src={property.images[0]?.url}
                    alt={property.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-8 h-8 stroke-[#8aab5c] fill-none opacity-40" strokeWidth="1.5" strokeLinecap="round" viewBox="0 0 24 24">
                      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                      <polyline points="9 22 9 12 15 12 15 22"/>
                    </svg>
                  </div>
                )}
                <div className="absolute top-2.5 left-2.5">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${statusStyle[property.status] || statusStyle.active}`}>
                    {property.status || "active"}
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="p-3.5">
                <h3 className="text-[13px] font-medium text-[#2d3a1e] mb-1 truncate">
                  {property.title}
                </h3>

                <div className="flex items-center gap-1 mb-2.5">
                  <MapPin className="w-3 h-3 text-[#b0a890] shrink-0" />
                  <span className="text-[11px] text-[#9a9476] truncate">
                    {property.location?.city}, {property.location?.country}
                  </span>
                </div>

                <div className="flex items-center gap-3 mb-3">
                  <div className="text-[11px] text-[#6b7a50]">
                    Bookings: <span className="font-medium text-[#2d3a1e]">{property.bookingCount || 0}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-[#6b7a50]">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium text-[#2d3a1e]">{property.rating || "—"}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[15px] font-medium text-[#2d3a1e]">
                      ₹{property.pricePerNight?.toLocaleString("en-IN")}
                    </span>
                    <span className="text-[10px] text-[#9a9476]"> / night</span>
                  </div>
                  <div className="flex gap-1.5">
                    <Link
                      to={`/host/listings/edit/${property._id}`}
                      className="w-[26px] h-[26px] border border-[#e0dbd0] rounded-[6px] bg-[#faf9f4] flex items-center justify-center hover:bg-[#f0ede4] transition-colors"
                    >
                      <Pencil className="w-3 h-3 text-[#6b7a50]" />
                    </Link>
                    <button
                      onClick={() => deleteProperty(property._id)}
                      className="w-[26px] h-[26px] border border-[#e0dbd0] rounded-[6px] bg-[#faf9f4] flex items-center justify-center hover:bg-red-50 hover:border-red-200 transition-colors"
                    >
                      <Trash2 className="w-3 h-3 text-[#9a9476] hover:text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
