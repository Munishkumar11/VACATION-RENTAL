import { useEffect, useState, useRef } from "react";
import {
  Search, Map, Grid, SlidersHorizontal, Home, X, ChevronRight,
} from "lucide-react";
import PropertyCard from "./PropertyCard";
import axios from "axios";

// ── India State → Cities data ─────────────────────────────────────────────────
const INDIA_LOCATIONS = {
  "Gujarat":     ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Gandhinagar", "Kutch"],
  "Goa":         ["Panaji", "North Goa", "South Goa", "Calangute", "Anjuna"],
  "Rajasthan":   ["Jaipur", "Udaipur", "Jodhpur", "Jaisalmer", "Pushkar", "Ajmer"],
  "Maharashtra": ["Mumbai", "Pune", "Nashik", "Lonavala", "Mahabaleshwar", "Alibaug"],
  "Kerala":      ["Kochi", "Munnar", "Alleppey", "Kovalam", "Wayanad", "Trivandrum"],
  "Himachal Pradesh": ["Manali", "Shimla", "Dharamshala", "Kasol", "Spiti"],
  "Uttarakhand": ["Nainital", "Mussoorie", "Rishikesh", "Haridwar", "Jim Corbett"],
  "Karnataka":   ["Bengaluru", "Coorg", "Mysuru", "Chikmagalur", "Hampi"],
  "Tamil Nadu":  ["Chennai", "Ooty", "Kodaikanal", "Pondicherry", "Mahabalipuram"],
  "West Bengal": ["Kolkata", "Darjeeling", "Siliguri", "Digha"],
};

const AMENITIES_LIST = [
  { id: "wifi",    label: "WiFi" },
  { id: "pool",    label: "Pool" },
  { id: "ac",      label: "AC" },
  { id: "parking", label: "Parking" },
  { id: "kitchen", label: "Kitchen" },
  { id: "washer",  label: "Washer" },
  { id: "tv",      label: "TV" },
  { id: "gym",     label: "Gym" },
  { id: "bbq",     label: "BBQ" },
];

function PropertyGrid() {

  // ── States ────────────────────────────────────
  const [properties, setProperties]     = useState([]);
  const [wishlistIds, setWishlistIds]   = useState([]);
  const [searchQuery, setSearchQuery]   = useState("");
  const [viewMode, setViewMode]         = useState("grid");
  const [isLoading, setIsLoading]       = useState(true);
  const [wishlistLoaded, setWishlistLoaded] = useState(false);
  const [showDrawer, setShowDrawer]     = useState(false);

  // basic filters (top bar)
  const [filters, setFilters] = useState({
    propertyType: "",
    priceRange:   "",
  });

  // more filters (drawer)
  const [moreFilters, setMoreFilters] = useState({
    selectedState:    "",
    selectedCity:     "",
    minPrice:         0,
    maxPrice:         50000,
    guests:           "",
    bedrooms:         "",
    amenities:        [],
    sortBy:           "",
  });

  // temp filters (applied only on "Apply" click)
  const [tempFilters, setTempFilters] = useState({ ...moreFilters });
  const [activeMoreFiltersCount, setActiveMoreFiltersCount] = useState(0);

  // ── Fetch properties ──────────────────────────
  useEffect(() => {
    const getData = async () => {
      try {
        const res = await axios.get("/property");
        setProperties(res.data.data);
      } catch (error) {
        console.log(error);
      } finally {
        setIsLoading(false);
      }
    };
    getData();
  }, []);

  // ── Fetch wishlist ────────────────────────────
  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        const res = await axios.get("/wishlist", { withCredentials: true });
        const ids = res.data.data.map((p) => p._id?.toString());
        setWishlistIds(ids);
      } catch (error) {
        console.log(error);
      } finally {
        setWishlistLoaded(true);
      }
    };
    fetchWishlist();
  }, []);

  // ── Open drawer — copy applied → temp ─────────
  const openDrawer = () => {
    setTempFilters({ ...moreFilters });
    setShowDrawer(true);
  };

  // ── Apply drawer filters ───────────────────────
  const applyFilters = () => {
    setMoreFilters({ ...tempFilters });

    // count active filters for badge
    let count = 0;
    if (tempFilters.selectedState)       count++;
    if (tempFilters.selectedCity)        count++;
    if (tempFilters.minPrice > 0)        count++;
    if (tempFilters.maxPrice < 50000)    count++;
    if (tempFilters.guests)              count++;
    if (tempFilters.bedrooms)            count++;
    if (tempFilters.amenities.length)    count++;
    if (tempFilters.sortBy)              count++;
    setActiveMoreFiltersCount(count);
    setShowDrawer(false);
  };

  // ── Reset drawer filters ──────────────────────
  const resetFilters = () => {
    const empty = {
      selectedState: "", selectedCity: "",
      minPrice: 0, maxPrice: 50000,
      guests: "", bedrooms: "", amenities: [], sortBy: "",
    };
    setTempFilters(empty);
  };

  const toggleAmenity = (id) => {
    setTempFilters((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(id)
        ? prev.amenities.filter((a) => a !== id)
        : [...prev.amenities, id],
    }));
  };

  // ── Filter + sort logic ───────────────────────
  const filteredProperties = properties
    .filter((p) => {
     const matchesSearch =
  p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
  String(p.location?.city || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType =
        !filters.propertyType || p.propertyType === filters.propertyType;

      const matchesPrice =
        !filters.priceRange ||
        (filters.priceRange === "low"    && p.pricePerNight < 3000) ||
        (filters.priceRange === "medium" && p.pricePerNight >= 3000 && p.pricePerNight < 8000) ||
        (filters.priceRange === "high"   && p.pricePerNight >= 8000);

      const matchesState =
        !moreFilters.selectedState ||
        String(p.location?.state || "").toLowerCase() === moreFilters.selectedState.toLowerCase();

      const matchesCity =
        !moreFilters.selectedCity ||
       String(p.location?.city || "").toLowerCase() === moreFilters.selectedCity.toLowerCase();

      const matchesMorePrice =
        p.pricePerNight >= moreFilters.minPrice &&
        p.pricePerNight <= moreFilters.maxPrice;

      const matchesGuests =
        !moreFilters.guests || p.maxGuests >= Number(moreFilters.guests);

      const matchesBedrooms =
        !moreFilters.bedrooms ||
        (moreFilters.bedrooms === "4+" ? p.bedrooms >= 4 : p.bedrooms === Number(moreFilters.bedrooms));

      const matchesAmenities =
        moreFilters.amenities.length === 0 ||
        moreFilters.amenities.every((a) => p.amenities?.includes(a));

      return (
        matchesSearch && matchesType && matchesPrice &&
        matchesState && matchesCity && matchesMorePrice &&
        matchesGuests && matchesBedrooms && matchesAmenities
      );
    })
    .sort((a, b) => {
      if (moreFilters.sortBy === "price_asc")  return a.pricePerNight - b.pricePerNight;
      if (moreFilters.sortBy === "price_desc") return b.pricePerNight - a.pricePerNight;
      if (moreFilters.sortBy === "rating")     return (b.rating || 0) - (a.rating || 0);
      if (moreFilters.sortBy === "newest")     return new Date(b.createdAt) - new Date(a.createdAt);
      return 0;
    });

  return (
    <div className="min-h-screen bg-[#f5f3ec]">

      {/* ── Header ── */}
      <div className="bg-white border-b border-[#e0dbd0] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">

          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#c5c9a0]" size={18} />
              <input
                type="text"
                placeholder="Search by city, property name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#d6cebc] bg-[#f5f3ec] focus:border-[#6b8c3e] focus:outline-none focus:ring-2 focus:ring-[#e8ecd8] transition-all placeholder-[#b0aa9a] text-[#2d3a1e]"
              />
            </div>

            <div className="flex gap-2">
              {/* Property type */}
              <select
                value={filters.propertyType}
                onChange={(e) => setFilters({ ...filters, propertyType: e.target.value })}
                className="px-4 py-3 rounded-xl border border-[#d6cebc] bg-white focus:border-[#6b8c3e] focus:outline-none text-[#3d5028]"
              >
                <option value="">All Types</option>
                <option value="apartment">Apartment</option>
                <option value="villa">Villa</option>
                <option value="house">House</option>
                <option value="studio">Studio</option>
                <option value="farmhouse">Farmhouse</option>
                <option value="cottage">Cottage</option>
              </select>

              {/* Price range */}
              <select
                value={filters.priceRange}
                onChange={(e) => setFilters({ ...filters, priceRange: e.target.value })}
                className="px-4 py-3 rounded-xl border border-[#d6cebc] bg-white focus:border-[#6b8c3e] focus:outline-none text-[#3d5028]"
              >
                <option value="">Price Range</option>
                <option value="low">Under ₹3,000</option>
                <option value="medium">₹3,000 – ₹8,000</option>
                <option value="high">Over ₹8,000</option>
              </select>

              {/* More Filters button */}
              <button
                onClick={openDrawer}
                className="relative flex items-center gap-2 px-4 py-3 rounded-xl border border-[#d6cebc] bg-white hover:bg-[#f5f3ec] transition-colors"
              >
                <SlidersHorizontal size={18} className="text-[#6b8c3e]" />
                <span className="hidden md:inline text-[#3d5028]">More Filters</span>
                {activeMoreFiltersCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#6b8c3e] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {activeMoreFiltersCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* View toggle */}
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-[#9a9476]">
              Showing {filteredProperties.length} properties
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg ${viewMode === "grid" ? "bg-[#e8ecd8] text-[#3d5028]" : "text-[#c5c9a0] hover:bg-[#f5f3ec]"}`}
              >
                <Grid size={20} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg ${viewMode === "list" ? "bg-[#e8ecd8] text-[#3d5028]" : "text-[#c5c9a0] hover:bg-[#f5f3ec]"}`}
              >
                <Map size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── More Filters Drawer ── */}
      {showDrawer && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 z-50"
            onClick={() => setShowDrawer(false)}
          />

          {/* Drawer */}
          <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col">

            {/* Drawer header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#e0dbd0]">
              <h2 className="text-lg font-bold text-[#2d3a1e]">More Filters</h2>
              <button
                onClick={() => setShowDrawer(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f5f3ec]"
              >
                <X size={18} className="text-[#6b7a50]" />
              </button>
            </div>

            {/* Drawer body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-7">

              {/* ── Location: State → City ── */}
              <div>
                <h3 className="text-sm font-bold text-[#2d3a1e] mb-3">Location</h3>

                {/* States */}
                <p className="text-xs text-[#9a9476] mb-2">Select State</p>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {Object.keys(INDIA_LOCATIONS).map((state) => (
                    <button
                      key={state}
                      onClick={() => setTempFilters((prev) => ({
                        ...prev,
                        selectedState: prev.selectedState === state ? "" : state,
                        selectedCity: "",
                      }))}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl border text-[12px] transition-all ${
                        tempFilters.selectedState === state
                          ? "border-[#6b8c3e] bg-[#edf2e4] text-[#3d5028] font-medium"
                          : "border-[#e0dbd0] bg-white text-[#6b7a50] hover:border-[#a3c46a]"
                      }`}
                    >
                      {state}
                      {tempFilters.selectedState === state && (
                        <ChevronRight size={12} className="text-[#6b8c3e]" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Cities — show only when state selected */}
                {tempFilters.selectedState && (
                  <>
                    <p className="text-xs text-[#9a9476] mb-2">
                      Select City in {tempFilters.selectedState}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {INDIA_LOCATIONS[tempFilters.selectedState].map((city) => (
                        <button
                          key={city}
                          onClick={() => setTempFilters((prev) => ({
                            ...prev,
                            selectedCity: prev.selectedCity === city ? "" : city,
                          }))}
                          className={`px-3 py-2 rounded-xl border text-[12px] transition-all ${
                            tempFilters.selectedCity === city
                              ? "border-[#6b8c3e] bg-[#edf2e4] text-[#3d5028] font-medium"
                              : "border-[#e0dbd0] bg-white text-[#6b7a50] hover:border-[#a3c46a]"
                          }`}
                        >
                          {city}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* ── Price Range slider ── */}
              <div>
                <h3 className="text-sm font-bold text-[#2d3a1e] mb-1">Price Range</h3>
                <div className="flex justify-between text-xs text-[#9a9476] mb-3">
                  <span>₹{tempFilters.minPrice.toLocaleString("en-IN")}</span>
                  <span>₹{tempFilters.maxPrice.toLocaleString("en-IN")}</span>
                </div>
                <div className="space-y-2">
                  <input
                    type="range"
                    min={0} max={50000} step={500}
                    value={tempFilters.minPrice}
                    onChange={(e) => setTempFilters((prev) => ({
                      ...prev,
                      minPrice: Math.min(Number(e.target.value), prev.maxPrice - 500),
                    }))}
                    className="w-full accent-[#6b8c3e]"
                  />
                  <input
                    type="range"
                    min={0} max={50000} step={500}
                    value={tempFilters.maxPrice}
                    onChange={(e) => setTempFilters((prev) => ({
                      ...prev,
                      maxPrice: Math.max(Number(e.target.value), prev.minPrice + 500),
                    }))}
                    className="w-full accent-[#6b8c3e]"
                  />
                </div>
              </div>

              {/* ── Guests ── */}
              <div>
                <h3 className="text-sm font-bold text-[#2d3a1e] mb-3">Guests</h3>
                <div className="flex gap-2 flex-wrap">
                  {["1", "2", "4", "6", "8+"].map((g) => (
                    <button
                      key={g}
                      onClick={() => setTempFilters((prev) => ({
                        ...prev,
                        guests: prev.guests === g ? "" : g,
                      }))}
                      className={`w-12 h-10 rounded-xl border text-[13px] font-medium transition-all ${
                        tempFilters.guests === g
                          ? "border-[#6b8c3e] bg-[#edf2e4] text-[#3d5028]"
                          : "border-[#e0dbd0] bg-white text-[#6b7a50] hover:border-[#a3c46a]"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Bedrooms ── */}
              <div>
                <h3 className="text-sm font-bold text-[#2d3a1e] mb-3">Bedrooms</h3>
                <div className="flex gap-2 flex-wrap">
                  {["1", "2", "3", "4+"].map((b) => (
                    <button
                      key={b}
                      onClick={() => setTempFilters((prev) => ({
                        ...prev,
                        bedrooms: prev.bedrooms === b ? "" : b,
                      }))}
                      className={`w-12 h-10 rounded-xl border text-[13px] font-medium transition-all ${
                        tempFilters.bedrooms === b
                          ? "border-[#6b8c3e] bg-[#edf2e4] text-[#3d5028]"
                          : "border-[#e0dbd0] bg-white text-[#6b7a50] hover:border-[#a3c46a]"
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Amenities ── */}
              <div>
                <h3 className="text-sm font-bold text-[#2d3a1e] mb-3">Amenities</h3>
                <div className="grid grid-cols-3 gap-2">
                  {AMENITIES_LIST.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => toggleAmenity(a.id)}
                      className={`px-2 py-2 rounded-xl border text-[11px] font-medium transition-all ${
                        tempFilters.amenities.includes(a.id)
                          ? "border-[#6b8c3e] bg-[#edf2e4] text-[#3d5028]"
                          : "border-[#e0dbd0] bg-white text-[#6b7a50] hover:border-[#a3c46a]"
                      }`}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Sort by ── */}
              <div>
                <h3 className="text-sm font-bold text-[#2d3a1e] mb-3">Sort by</h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "price_asc",  label: "Price: Low → High" },
                    { value: "price_desc", label: "Price: High → Low" },
                    { value: "rating",     label: "Top Rated" },
                    { value: "newest",     label: "Newest" },
                  ].map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setTempFilters((prev) => ({
                        ...prev,
                        sortBy: prev.sortBy === s.value ? "" : s.value,
                      }))}
                      className={`px-3 py-2 rounded-xl border text-[12px] font-medium transition-all ${
                        tempFilters.sortBy === s.value
                          ? "border-[#6b8c3e] bg-[#edf2e4] text-[#3d5028]"
                          : "border-[#e0dbd0] bg-white text-[#6b7a50] hover:border-[#a3c46a]"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Drawer footer */}
            <div className="px-6 py-4 border-t border-[#e0dbd0] flex gap-3">
              <button
                onClick={resetFilters}
                className="flex-1 h-11 rounded-xl border border-[#d6cebc] text-[#3d5028] text-sm font-medium hover:bg-[#f5f3ec] transition-colors"
              >
                Reset
              </button>
              <button
                onClick={applyFilters}
                className="flex-2 flex-grow-[2] h-11 rounded-xl bg-[#6b8c3e] hover:bg-[#5a7a30] text-white text-sm font-bold transition-colors"
              >
                Show {filteredProperties.length} properties
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Main Content ── */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {isLoading || !wishlistLoaded ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm border border-[#e0dbd0] p-4 animate-pulse">
                <div className="h-64 bg-[#e8ecd8] rounded-xl mb-4" />
                <div className="h-6 bg-[#e8ecd8] rounded w-3/4 mb-2" />
                <div className="h-4 bg-[#e8ecd8] rounded w-1/2 mb-4" />
                <div className="h-10 bg-[#e8ecd8] rounded w-full" />
              </div>
            ))}
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="text-center py-20">
            <Home className="w-16 h-16 text-[#c5c9a0] mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-[#2d3a1e] mb-2">No properties found</h3>
            <p className="text-[#9a9476]">Try adjusting your search or filters to find what you're looking for.</p>
          </div>
        ) : (
          <div className={
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              : "flex flex-col gap-4"
          }>
            {filteredProperties.map((property) => (
              <PropertyCard
                key={property._id}
                property={property}
                initialWishlisted={wishlistIds.includes(property._id.toString())}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default PropertyGrid;