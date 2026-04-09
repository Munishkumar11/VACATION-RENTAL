import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Home, MapPin, Bed, Image, CheckSquare,
  FileText, DollarSign, Plus, X, ArrowLeft,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";


const AMENITIES = [
  { id: "wifi",     label: "WiFi" },
  { id: "parking",  label: "Parking" },
  { id: "kitchen",  label: "Kitchen" },
  { id: "ac",       label: "AC" },
  { id: "pool",     label: "Pool" },
  { id: "washer",   label: "Washer" },
  { id: "tv",       label: "TV" },
  { id: "gym",      label: "Gym" },
  { id: "bbq",      label: "BBQ" },
];

export default function AddListing() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    propertyType: "villa",
    maxGuests: "",
    bedrooms: "",
    beds: "",
    bathrooms: "",
    pricePerNight: "",
    securityDeposit: "",
    minStay: "1",
    maxStay: "30",
    location: {
      city: "",
      state: "",
      country: "India",
      pincode: "",
      address: "",
    },
  });

  const [amenities, setAmenities] = useState(["wifi", "kitchen"]);
  const [houseRules, setHouseRules] = useState([
    "No smoking inside",
    "Check-in after 3 PM",
  ]);
  const [images, setImages] = useState([]);
  const [newRule, setNewRule] = useState("");

  const updateForm = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const updateLocation = (key, value) =>
    setForm((prev) => ({
      ...prev,
      location: { ...prev.location, [key]: value },
    }));

  const toggleAmenity = (id) => {
    setAmenities((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const addRule = () => {
    if (!newRule.trim()) return;
    setHouseRules((prev) => [...prev, newRule.trim()]);
    setNewRule("");
  };

  const removeRule = (index) =>
    setHouseRules((prev) => prev.filter((_, i) => i !== index));

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setImages((prev) => [...prev, ...files]);
  };

 const handleSubmit = async (status = "active") => {
  if (!form.title || !form.pricePerNight || !form.location.city) {
    toast.error("Please fill in all required fields");
    return;
  }
  try {
    setLoading(true);
    const formData = new FormData();

    // ✅ append simple fields
    formData.append("title",           form.title);
    formData.append("description",     form.description);
    formData.append("propertyType",    form.propertyType);
    formData.append("pricePerNight",   form.pricePerNight);
    formData.append("securityDeposit", form.securityDeposit);
    formData.append("minStay",         form.minStay);
    formData.append("maxStay",         form.maxStay);
    formData.append("maxGuests",       form.maxGuests);
    formData.append("bedrooms",        form.bedrooms);
    formData.append("beds",            form.beds);
    formData.append("bathrooms",       form.bathrooms);
    formData.append("status",          status);

    // ✅ send location as JSON string
    formData.append("location", JSON.stringify(form.location));

    // ✅ send amenities
    amenities.forEach((a) => formData.append("amenities[]", a));

    // ✅ send house rules
    houseRules.forEach((r) => formData.append("houseRules[]", r));

    // ✅ send images
    images.forEach((img) => formData.append("images", img));

    await axios.post("/property", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      withCredentials: true,
    });

    toast.success(status === "active" ? "Listing published!" : "Saved as draft");
    navigate("/host/HostListings");

  } catch (error) {
    console.log(error);
    toast.error(error.response?.data?.message || "Failed to create listing");
  } finally {
    setLoading(false);
  }
};

  const fieldClass = `
    flex items-center gap-2 bg-white border border-[#d6cebc] rounded-[9px] px-3 h-[38px]
    focus-within:border-[#6b8c3e] focus-within:ring-2 focus-within:ring-[#e0e8d0] transition-all
  `;

  const inputClass =
    "bg-transparent border-none outline-none text-[13px] text-[#2d3a1e] w-full placeholder-[#c0baa8]";

  const labelClass = "text-[11px] font-medium text-[#6b7a50]";

  return (
    <div className="min-h-screen bg-[#f5f3ec] p-6">

      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => navigate("/host/listings")}
          className="w-8 h-8 border border-[#d6cebc] rounded-[7px] bg-white flex items-center justify-center hover:bg-[#f0ede4] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#6b7a50]" />
        </button>
        <div>
          <h1 className="text-[18px] font-medium text-[#2d3a1e]">Add new listing</h1>
          <p className="text-[12px] text-[#9a9476] mt-0.5">Fill in the details to publish your property</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">

        {/* ── Left — form ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Basic info */}
          <div className="bg-white border border-[#e0dbd0] rounded-[12px] p-5">
            <div className="flex items-center gap-2 mb-4">
              <Home className="w-3.5 h-3.5 text-[#6b8c3e]" />
              <span className="text-[13px] font-medium text-[#2d3a1e]">Basic information</span>
            </div>
            <div className="space-y-3">

              <div className="flex flex-col gap-1">
                <label className={labelClass}>Property title *</label>
                <div className={fieldClass}>
                  <input
                    className={inputClass}
                    placeholder="e.g. Serene hilltop villa with valley views"
                    value={form.title}
                    onChange={(e) => updateForm("title", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className={labelClass}>Property type</label>
                  <div className={fieldClass}>
                    <select
                      className={`${inputClass} cursor-pointer`}
                      value={form.propertyType}
                      onChange={(e) => updateForm("propertyType", e.target.value)}
                    >
                      <option value="villa">Villa</option>
                      <option value="apartment">Apartment</option>
                      <option value="house">House</option>
                      <option value="studio">Studio</option>
                      <option value="farmhouse">Farmhouse</option>
                      <option value="cottage">Cottage</option>
                    </select>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className={labelClass}>Max guests *</label>
                  <div className={fieldClass}>
                    <input
                      type="number"
                      className={inputClass}
                      placeholder="e.g. 6"
                      min="1"
                      value={form.maxGuests}
                      onChange={(e) => updateForm("maxGuests", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className={labelClass}>Description</label>
                <textarea
                  rows={3}
                  className="bg-white border border-[#d6cebc] rounded-[9px] px-3 py-2.5 text-[13px] text-[#2d3a1e] placeholder-[#c0baa8] outline-none focus:border-[#6b8c3e] focus:ring-2 focus:ring-[#e0e8d0] resize-none transition-all"
                  placeholder="Describe your property — what makes it special, nearby attractions, etc."
                  value={form.description}
                  onChange={(e) => updateForm("description", e.target.value)}
                />
              </div>

            </div>
          </div>

          {/* Location */}
          <div className="bg-white border border-[#e0dbd0] rounded-[12px] p-5">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-3.5 h-3.5 text-[#6b8c3e]" />
              <span className="text-[13px] font-medium text-[#2d3a1e]">Location</span>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className={labelClass}>City *</label>
                  <div className={fieldClass}>
                    <input className={inputClass} placeholder="e.g. Coorg" value={form.location.city} onChange={(e) => updateLocation("city", e.target.value)} />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className={labelClass}>State</label>
                  <div className={fieldClass}>
                    <input className={inputClass} placeholder="e.g. Karnataka" value={form.location.state} onChange={(e) => updateLocation("state", e.target.value)} />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className={labelClass}>Country</label>
                  <div className={fieldClass}>
                    <input className={inputClass} placeholder="India" value={form.location.country} onChange={(e) => updateLocation("country", e.target.value)} />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className={labelClass}>Pincode</label>
                  <div className={fieldClass}>
                    <input className={inputClass} placeholder="e.g. 571201" value={form.location.pincode} onChange={(e) => updateLocation("pincode", e.target.value)} />
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelClass}>Full address</label>
                <div className={fieldClass}>
                  <input className={inputClass} placeholder="Street / landmark" value={form.location.address} onChange={(e) => updateLocation("address", e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          {/* Rooms */}
          <div className="bg-white border border-[#e0dbd0] rounded-[12px] p-5">
            <div className="flex items-center gap-2 mb-4">
              <Bed className="w-3.5 h-3.5 text-[#6b8c3e]" />
              <span className="text-[13px] font-medium text-[#2d3a1e]">Rooms & beds</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Bedrooms", key: "bedrooms", placeholder: "3" },
                { label: "Beds", key: "beds", placeholder: "4" },
                { label: "Bathrooms", key: "bathrooms", placeholder: "2" },
              ].map(({ label, key, placeholder }) => (
                <div key={key} className="flex flex-col gap-1">
                  <label className={labelClass}>{label}</label>
                  <div className={fieldClass}>
                    <input
                      type="number"
                      className={inputClass}
                      placeholder={placeholder}
                      min="0"
                      value={form[key]}
                      onChange={(e) => updateForm(key, e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Photos */}
          <div className="bg-white border border-[#e0dbd0] rounded-[12px] p-5">
            <div className="flex items-center gap-2 mb-4">
              <Image className="w-3.5 h-3.5 text-[#6b8c3e]" />
              <span className="text-[13px] font-medium text-[#2d3a1e]">Photos</span>
            </div>

            <label className="block border border-dashed border-[#c5c9a0] rounded-[9px] p-6 text-center cursor-pointer bg-[#faf9f4] hover:border-[#6b8c3e] hover:bg-[#f0f5e8] transition-all">
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
              <div className="w-9 h-9 rounded-full bg-[#e8ecd8] flex items-center justify-center mx-auto mb-2">
                <Plus className="w-4 h-4 text-[#6b8c3e]" />
              </div>
              <p className="text-[12px] font-medium text-[#2d3a1e] mb-0.5">Click to upload photos</p>
              <p className="text-[11px] text-[#9a9476]">PNG, JPG up to 10MB each · Min 3 photos</p>
            </label>

            {images.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mt-3">
                {images.map((img, i) => (
                  <div key={i} className="relative aspect-square rounded-[7px] overflow-hidden bg-[#e8ecd8]">
                    <img
                      src={URL.createObjectURL(img)}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/40 flex items-center justify-center"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Amenities */}
          <div className="bg-white border border-[#e0dbd0] rounded-[12px] p-5">
            <div className="flex items-center gap-2 mb-4">
              <CheckSquare className="w-3.5 h-3.5 text-[#6b8c3e]" />
              <span className="text-[13px] font-medium text-[#2d3a1e]">Amenities</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {AMENITIES.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => toggleAmenity(a.id)}
                  className={`flex items-center gap-2 px-2.5 py-2 rounded-[8px] border text-[11px] transition-all ${
                    amenities.includes(a.id)
                      ? "border-[#6b8c3e] bg-[#edf2e4] text-[#3d5028]"
                      : "border-[#d6cebc] bg-white text-[#6b7a50] hover:border-[#a3c46a]"
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${amenities.includes(a.id) ? "bg-[#6b8c3e]" : "bg-[#d6cebc]"}`} />
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          {/* House rules */}
          <div className="bg-white border border-[#e0dbd0] rounded-[12px] p-5">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-3.5 h-3.5 text-[#6b8c3e]" />
              <span className="text-[13px] font-medium text-[#2d3a1e]">House rules</span>
            </div>
            <div className="space-y-2 mb-3">
              {houseRules.map((rule, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="flex-1 h-[34px] bg-[#f5f3ec] border border-[#e0dbd0] rounded-[7px] px-3 flex items-center">
                    <span className="text-[12px] text-[#4a5020]">{rule}</span>
                  </div>
                  <button
                    onClick={() => removeRule(i)}
                    className="w-7 h-7 flex items-center justify-center text-[#b0a890] hover:text-red-400 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <div className="flex-1 h-[34px] bg-white border border-[#d6cebc] rounded-[7px] px-3 flex items-center focus-within:border-[#6b8c3e]">
                <input
                  className="bg-transparent border-none outline-none text-[12px] text-[#2d3a1e] w-full placeholder-[#c0baa8]"
                  placeholder="Add a rule…"
                  value={newRule}
                  onChange={(e) => setNewRule(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addRule()}
                />
              </div>
              <button
                onClick={addRule}
                className="h-[34px] px-3 bg-[#e8ecd8] text-[#3d5028] text-[12px] font-medium rounded-[7px] hover:bg-[#d6e8b8] transition-colors"
              >
                Add
              </button>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white border border-[#e0dbd0] rounded-[12px] p-5">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="w-3.5 h-3.5 text-[#6b8c3e]" />
              <span className="text-[13px] font-medium text-[#2d3a1e]">Pricing</span>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="flex flex-col gap-1">
                <label className={labelClass}>Price per night (₹) *</label>
                <div className={fieldClass}>
                  <input type="number" className={inputClass} placeholder="e.g. 4500" min="0" value={form.pricePerNight} onChange={(e) => updateForm("pricePerNight", e.target.value)} />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelClass}>Security deposit (₹)</label>
                <div className={fieldClass}>
                  <input type="number" className={inputClass} placeholder="e.g. 5000" min="0" value={form.securityDeposit} onChange={(e) => updateForm("securityDeposit", e.target.value)} />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className={labelClass}>Min stay (nights)</label>
                <div className={fieldClass}>
                  <input type="number" className={inputClass} placeholder="1" min="1" value={form.minStay} onChange={(e) => updateForm("minStay", e.target.value)} />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelClass}>Max stay (nights)</label>
                <div className={fieldClass}>
                  <input type="number" className={inputClass} placeholder="30" min="1" value={form.maxStay} onChange={(e) => updateForm("maxStay", e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pb-6">
            <button
              onClick={() => handleSubmit("draft")}
              disabled={loading}
              className="h-[42px] px-5 bg-white border border-[#d6cebc] text-[#3d5028] text-[13px] font-medium rounded-[9px] hover:bg-[#f5f3ec] transition-colors disabled:opacity-50"
            >
              Save as draft
            </button>
            <button
              onClick={() => handleSubmit("active")}
              disabled={loading}
              className="flex-1 h-[42px] bg-[#6b8c3e] text-white text-[13px] font-medium rounded-[9px] hover:bg-[#5a7a30] transition-colors disabled:opacity-50"
            >
              {loading ? "Publishing…" : "Publish listing"}
            </button>
          </div>

        </div>

        {/* ── Right — preview card ── */}
        <div>
          <div className="bg-white border border-[#e0dbd0] rounded-[12px] p-4 sticky top-6">
            <p className="text-[12px] font-medium text-[#2d3a1e] mb-3">Listing preview</p>

            <div className="h-[90px] rounded-[8px] bg-[#e8ecd8] flex items-center justify-center mb-3">
              {images[0] ? (
                <img src={URL.createObjectURL(images[0])} alt="" className="w-full h-full object-cover rounded-[8px]" />
              ) : (
                <Home className="w-7 h-7 text-[#8aab5c] opacity-40" />
              )}
            </div>

            <p className="text-[13px] font-medium text-[#2d3a1e] mb-0.5">
              {form.title || "Your property title"}
            </p>
            <p className="text-[11px] text-[#9a9476] mb-2">
              {form.location.city || "City"}{form.location.country ? `, ${form.location.country}` : ""}
            </p>
            <p className="text-[16px] font-medium text-[#2d3a1e]">
              {form.pricePerNight ? `₹${parseInt(form.pricePerNight).toLocaleString("en-IN")}` : "₹0"}
              <span className="text-[11px] text-[#9a9476] font-normal"> / night</span>
            </p>

            {/* Checklist */}
            <div className="mt-3 pt-3 border-t border-[#f0ece4]">
              <p className="text-[11px] text-[#9a9476] mb-2">Checklist</p>
              <div className="space-y-1.5">
                {[
                  { label: "Property title", done: !!form.title },
                  { label: "Location", done: !!form.location.city },
                  { label: "Photos added", done: images.length >= 3 },
                  { label: "Price set", done: !!form.pricePerNight },
                  { label: "Amenities selected", done: amenities.length > 0 },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${item.done ? "bg-[#6b8c3e]" : "bg-[#e8ecd8]"}`}>
                      {item.done && (
                        <svg className="w-2 h-2 stroke-white fill-none" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 12 12">
                          <polyline points="2 6 5 9 10 3" />
                        </svg>
                      )}
                    </div>
                    <span className={`text-[11px] ${item.done ? "text-[#3d5028]" : "text-[#b0a890]"}`}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
