import { useState, useRef } from "react";
import api from "../api";
import {
  User, Mail, Phone, Lock, MapPin, Bell, Shield,
  CreditCard, Eye, EyeOff, Camera, Check,
  Trash2, Plus, AlertCircle, Facebook, Home, Banknote,
  Calendar, Languages, Chrome
} from "lucide-react";

// ─── MOCK DATA ────────────────────────────────────────────────
const MOCK_GUEST = {
  name: "Aarav Mehta",
  username: "aarav_m",
  email: "aarav@example.com",
  phone: "+91 98765 43210",
  dob: "1995-06-15",
  bio: "Love exploring new places and meeting people.",
  location: "Ahmedabad, Gujarat",
  language: "English",
  photo: null,
  emergencyContact: { name: "Priya Mehta", phone: "+91 97654 32109", relation: "Sister" },
  savedCards: [
    { id: 1, type: "Visa", last4: "4242", expiry: "08/27", isDefault: true },
    { id: 2, type: "Mastercard", last4: "8910", expiry: "03/26", isDefault: false },
  ],
};

const MOCK_HOST = {
  name: "Riya Sharma",
  username: "riya_host",
  email: "riya@example.com",
  phone: "+91 91234 56789",
  dob: "1990-03-22",
  bio: "Superhost with 3 properties across Gujarat. Love welcoming guests!",
  location: "Surat, Gujarat",
  language: "Hindi",
  photo: null,
  bankDetails: { accountHolder: "Riya Sharma", accountNo: "****4567", ifsc: "HDFC0001234", bank: "HDFC Bank" },
  payoutSchedule: "Monthly",
  propertyCount: 3,
  responseRate: "98%",
  availability: "Weekdays only",
};

// ─── HELPERS ──────────────────────────────────────────────────
const InputField = ({ label, type = "text", value, onChange, placeholder, icon: Icon, hint, disabled }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-semibold text-[#5a7050] uppercase tracking-wider">{label}</label>
    <div className="relative">
      {Icon && <Icon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8aab5c]" />}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full ${Icon ? "pl-10" : "pl-4"} pr-4 py-2.5 text-sm text-[#2d3a1e] bg-[#fafaf7] border border-[#ddd8cc] rounded-xl focus:outline-none focus:border-[#8aab5c] focus:ring-2 focus:ring-[#8aab5c]/20 transition-all placeholder:text-[#b0aa9a] disabled:opacity-50 disabled:cursor-not-allowed`}
      />
    </div>
    {hint && <p className="text-xs text-[#9a9485]">{hint}</p>}
  </div>
);

const TextareaField = ({ label, value, onChange, placeholder, rows = 3 }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-semibold text-[#5a7050] uppercase tracking-wider">{label}</label>
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-4 py-2.5 text-sm text-[#2d3a1e] bg-[#fafaf7] border border-[#ddd8cc] rounded-xl focus:outline-none focus:border-[#8aab5c] focus:ring-2 focus:ring-[#8aab5c]/20 transition-all placeholder:text-[#b0aa9a] resize-none"
    />
  </div>
);

const Toggle = ({ checked, onChange }) => (
  <button
    onClick={() => onChange(!checked)}
    className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${checked ? "bg-[#8aab5c]" : "bg-[#d0ccc0]"}`}
  >
    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${checked ? "translate-x-5" : "translate-x-0"}`} />
  </button>
);

const SectionCard = ({ title, subtitle, children }) => (
  <div className="bg-white rounded-2xl border border-[#e8e4da] overflow-hidden">
    {(title || subtitle) && (
      <div className="px-6 py-4 border-b border-[#f0ede6]">
        {title && <h3 className="text-sm font-bold text-[#2d3a1e]">{title}</h3>}
        {subtitle && <p className="text-xs text-[#9a9485] mt-0.5">{subtitle}</p>}
      </div>
    )}
    <div className="p-6">{children}</div>
  </div>
);

const SaveButton = ({ onClick, saved }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
      saved ? "bg-[#e8f0df] text-[#5a7a30]" : "bg-[#3d5028] text-white hover:bg-[#2d3a1e] shadow-md hover:shadow-lg"
    }`}
  >
    {saved ? <><Check size={15} /> Saved!</> : "Save Changes"}
  </button>
);

// ─── TAB: BASIC INFO ──────────────────────────────────────────
function BasicInfoTab({ role, data, setData }) {
  const [saved, setSaved] = useState(false);
  const fileRef = useRef();
  const initials = data.name?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="space-y-5">
      <SectionCard title="Profile Photo">
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#8aab5c] to-[#3d5028] flex items-center justify-center text-white text-2xl font-bold shadow-lg overflow-hidden">
              {data.photo ? <img src={data.photo} alt="avatar" className="w-full h-full object-cover" /> : initials}
            </div>
            <button
              onClick={() => fileRef.current.click()}
              className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-white border-2 border-[#e8e4da] rounded-full flex items-center justify-center hover:bg-[#f5f3ec] transition-colors shadow"
            >
              <Camera size={12} className="text-[#5a7050]" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={e => {
                const f = e.target.files[0];
                if (f) setData(d => ({ ...d, photo: URL.createObjectURL(f) }));
              }}
            />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#2d3a1e]">{data.name}</p>
            <p className="text-xs text-[#9a9485] mt-0.5">JPG, PNG up to 5MB</p>
            <button onClick={() => fileRef.current.click()} className="mt-2 text-xs font-semibold text-[#5a7a30] hover:text-[#3d5028] transition-colors">
              Change photo
            </button>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Personal Information" subtitle="This will be shown on your public profile">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField label="Full Name" value={data.name} onChange={e => setData(d => ({ ...d, name: e.target.value }))} placeholder="Your full name" icon={User} />
          <InputField label="Username" value={data.username} onChange={e => setData(d => ({ ...d, username: e.target.value }))} placeholder="@username" hint="Shown publicly" />
          <InputField label="Date of Birth" type="date" value={data.dob} onChange={e => setData(d => ({ ...d, dob: e.target.value }))} icon={Calendar} hint="Not shown publicly" />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#5a7050] uppercase tracking-wider">Language</label>
            <div className="relative">
              <Languages size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8aab5c]" />
              <select
                value={data.language}
                onChange={e => setData(d => ({ ...d, language: e.target.value }))}
                className="w-full pl-10 pr-4 py-2.5 text-sm text-[#2d3a1e] bg-[#fafaf7] border border-[#ddd8cc] rounded-xl focus:outline-none focus:border-[#8aab5c] transition-all appearance-none"
              >
                {["English", "Hindi", "Gujarati", "Marathi", "Tamil", "Telugu"].map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
          </div>
          <div className="sm:col-span-2">
            <InputField label="Location" value={data.location} onChange={e => setData(d => ({ ...d, location: e.target.value }))} placeholder="City, State" icon={MapPin} />
          </div>
          <div className="sm:col-span-2">
            <TextareaField label="Bio" value={data.bio} onChange={e => setData(d => ({ ...d, bio: e.target.value }))} placeholder="Tell others a bit about yourself..." />
            <p className="text-xs text-[#b0aa9a] mt-1 text-right">{data.bio?.length || 0}/200</p>
          </div>
        </div>
      </SectionCard>

      {role === "guest" && (
        <SectionCard title="Emergency Contact" subtitle="Only used in case of an emergency during your stay">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <InputField label="Contact Name" value={data.emergencyContact?.name} onChange={e => setData(d => ({ ...d, emergencyContact: { ...d.emergencyContact, name: e.target.value } }))} placeholder="Full name" icon={User} />
            <InputField label="Phone Number" value={data.emergencyContact?.phone} onChange={e => setData(d => ({ ...d, emergencyContact: { ...d.emergencyContact, phone: e.target.value } }))} placeholder="+91 XXXXX XXXXX" icon={Phone} />
            <InputField label="Relationship" value={data.emergencyContact?.relation} onChange={e => setData(d => ({ ...d, emergencyContact: { ...d.emergencyContact, relation: e.target.value } }))} placeholder="e.g. Sister" />
          </div>
        </SectionCard>
      )}

      {role === "host" && (
        <SectionCard title="Host Overview" subtitle="Your hosting stats at a glance">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Properties", value: data.propertyCount },
              { label: "Response Rate", value: data.responseRate },
              { label: "Availability", value: data.availability },
            ].map(stat => (
              <div key={stat.label} className="bg-[#f5f3ec] rounded-xl p-4 text-center">
                <p className="text-lg font-bold text-[#3d5028]">{stat.value}</p>
                <p className="text-xs text-[#7a8f5a] mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      <div className="flex justify-end">
        <SaveButton onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }} saved={saved} />
      </div>
    </div>
  );
}

// ─── TAB: SECURITY ────────────────────────────────────────────
function SecurityTab({ data }) {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwords, setPasswords] = useState({ current: "", newP: "", confirm: "" });
  const [saved, setSaved] = useState(false);
  const [twoFA, setTwoFA] = useState(false);

  const strength = (p) => {
    if (!p) return null;
    if (p.length < 6) return { label: "Weak", color: "#e07070", width: "30%" };
    if (p.length < 10) return { label: "Medium", color: "#d4a84b", width: "60%" };
    return { label: "Strong", color: "#8aab5c", width: "100%" };
  };
  const str = strength(passwords.newP);

  return (
    <div className="space-y-5">
      <SectionCard title="Contact Information" subtitle="Used for login and account recovery">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField label="Email Address" value={data.email} icon={Mail} hint="Used to log in" disabled />
          <InputField label="Phone Number" value={data.phone} icon={Phone} hint="For SMS verification" onChange={() => {}} />
        </div>
        <div className="mt-4 flex items-center gap-2 p-3 bg-[#fffbf0] border border-[#f0e0a0] rounded-xl">
          <AlertCircle size={14} className="text-[#c08a30] shrink-0" />
          <p className="text-xs text-[#8a6020]">Email changes require verification. A confirmation link will be sent.</p>
        </div>
      </SectionCard>

      <SectionCard title="Change Password">
        <div className="space-y-4">
          {[
            { label: "Current Password", key: "current", show: showCurrent, toggle: () => setShowCurrent(v => !v) },
            { label: "New Password", key: "newP", show: showNew, toggle: () => setShowNew(v => !v) },
            { label: "Confirm New Password", key: "confirm", show: showConfirm, toggle: () => setShowConfirm(v => !v) },
          ].map(({ label, key, show, toggle }) => (
            <div key={key} className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#5a7050] uppercase tracking-wider">{label}</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8aab5c]" />
                <input
                  type={show ? "text" : "password"}
                  value={passwords[key]}
                  onChange={e => setPasswords(p => ({ ...p, [key]: e.target.value }))}
                  placeholder={`Enter ${label.toLowerCase()}`}
                  className="w-full pl-10 pr-10 py-2.5 text-sm text-[#2d3a1e] bg-[#fafaf7] border border-[#ddd8cc] rounded-xl focus:outline-none focus:border-[#8aab5c] focus:ring-2 focus:ring-[#8aab5c]/20 transition-all placeholder:text-[#b0aa9a]"
                />
                <button onClick={toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9a9485] hover:text-[#5a7050]">
                  {show ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {key === "newP" && str && (
                <div className="mt-1 space-y-1">
                  <div className="h-1.5 bg-[#ece9e0] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: str.width, backgroundColor: str.color }} />
                  </div>
                  <p className="text-xs" style={{ color: str.color }}>{str.label} password</p>
                </div>
              )}
              {key === "confirm" && passwords.confirm && passwords.newP !== passwords.confirm && (
                <p className="text-xs text-[#e07070]">Passwords do not match</p>
              )}
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Two-Factor Authentication" subtitle="Add an extra layer of security">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${twoFA ? "bg-[#e8f0df]" : "bg-[#f0ede6]"}`}>
              <Shield size={16} className={twoFA ? "text-[#5a7a30]" : "text-[#9a9485]"} />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#2d3a1e]">SMS Authentication</p>
              <p className="text-xs text-[#9a9485]">{twoFA ? `Enabled — code sent to ${data.phone}` : "Not enabled"}</p>
            </div>
          </div>
          <Toggle checked={twoFA} onChange={setTwoFA} />
        </div>
      </SectionCard>

      <SectionCard title="Connected Accounts">
        {[
          { name: "Google", icon: Chrome, connected: true, email: data.email },
          { name: "Facebook", icon: Facebook, connected: false },
        ].map(acc => (
          <div key={acc.name} className="flex items-center justify-between py-3 border-b border-[#f0ede6] last:border-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#f5f3ec] flex items-center justify-center">
                <acc.icon size={16} className="text-[#5a7050]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#2d3a1e]">{acc.name}</p>
                <p className="text-xs text-[#9a9485]">{acc.connected ? acc.email : "Not connected"}</p>
              </div>
            </div>
            <button className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${acc.connected ? "text-[#e07070] bg-[#fdf0f0] hover:bg-[#f5e0e0]" : "text-[#5a7a30] bg-[#e8f0df] hover:bg-[#dce8d0]"}`}>
              {acc.connected ? "Disconnect" : "Connect"}
            </button>
          </div>
        ))}
      </SectionCard>

      <div className="flex justify-between items-center">
        <button className="text-xs font-semibold text-[#e07070] hover:text-[#c05050] transition-colors flex items-center gap-1.5">
          <Trash2 size={13} /> Delete Account
        </button>
        <SaveButton onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }} saved={saved} />
      </div>
    </div>
  );
}

// ─── TAB: PAYMENT ─────────────────────────────────────────────
function PaymentTab({ role, data, setData }) {
  const [saved, setSaved] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div className="space-y-5">
      {role === "guest" && (
        <SectionCard title="Saved Payment Methods" subtitle="Used for booking payments">
          <div className="space-y-3">
            {data.savedCards?.map(card => (
              <div key={card.id} className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${card.isDefault ? "border-[#8aab5c] bg-[#f5faf0]" : "border-[#e8e4da] bg-[#fafaf7]"}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-7 rounded-md flex items-center justify-center text-xs font-bold ${card.type === "Visa" ? "bg-[#1a1f71] text-white" : "bg-[#eb001b] text-white"}`}>
                    {card.type === "Visa" ? "VISA" : "MC"}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#2d3a1e]">{card.type} •••• {card.last4}</p>
                    <p className="text-xs text-[#9a9485]">Expires {card.expiry}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {card.isDefault ? (
                    <span className="text-xs font-semibold text-[#5a7a30] bg-[#e8f0df] px-2 py-1 rounded-lg">Default</span>
                  ) : (
                    <button onClick={() => setData(d => ({ ...d, savedCards: d.savedCards.map(c => ({ ...c, isDefault: c.id === card.id })) }))} className="text-xs text-[#8aab5c] hover:text-[#5a7a30] font-semibold">
                      Set default
                    </button>
                  )}
                  <button onClick={() => setData(d => ({ ...d, savedCards: d.savedCards.filter(c => c.id !== card.id) }))} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#fdf0f0] text-[#c0a0a0] hover:text-[#e07070] transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}

            {showAdd ? (
              <div className="p-4 rounded-xl border-2 border-dashed border-[#8aab5c] bg-[#f5faf0] space-y-3">
                <p className="text-sm font-semibold text-[#2d3a1e]">Add New Card</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <InputField label="Card Number" placeholder="1234 5678 9012 3456" icon={CreditCard} onChange={() => {}} value="" />
                  <InputField label="Cardholder Name" placeholder="Name on card" icon={User} onChange={() => {}} value="" />
                  <InputField label="Expiry" placeholder="MM/YY" onChange={() => {}} value="" />
                  <InputField label="CVV" placeholder="•••" type="password" onChange={() => {}} value="" />
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={() => setShowAdd(false)} className="flex-1 py-2 text-sm font-semibold text-[#2d3a1e] bg-[#f0ede6] rounded-xl hover:bg-[#e8e4da] transition-colors">Cancel</button>
                  <button onClick={() => setShowAdd(false)} className="flex-1 py-2 text-sm font-semibold text-white bg-[#3d5028] rounded-xl hover:bg-[#2d3a1e] transition-colors">Add Card</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowAdd(true)} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-[#c8d8b8] text-sm font-semibold text-[#8aab5c] hover:border-[#8aab5c] hover:bg-[#f5faf0] transition-all">
                <Plus size={15} /> Add New Card
              </button>
            )}
          </div>
        </SectionCard>
      )}

      {role === "host" && (
        <>
          <SectionCard title="Payout Bank Account" subtitle="Earnings will be transferred to this account">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField label="Account Holder Name" value={data.bankDetails?.accountHolder} icon={User} onChange={e => setData(d => ({ ...d, bankDetails: { ...d.bankDetails, accountHolder: e.target.value } }))} placeholder="As per bank records" />
              <InputField label="Account Number" value={data.bankDetails?.accountNo} icon={Banknote} placeholder="Account number" onChange={e => setData(d => ({ ...d, bankDetails: { ...d.bankDetails, accountNo: e.target.value } }))} />
              <InputField label="IFSC Code" value={data.bankDetails?.ifsc} placeholder="e.g. HDFC0001234" onChange={e => setData(d => ({ ...d, bankDetails: { ...d.bankDetails, ifsc: e.target.value } }))} />
              <InputField label="Bank Name" value={data.bankDetails?.bank} placeholder="Bank name" onChange={e => setData(d => ({ ...d, bankDetails: { ...d.bankDetails, bank: e.target.value } }))} />
            </div>
            <div className="mt-4 flex items-center gap-2 p-3 bg-[#f5faf0] border border-[#c8d8b8] rounded-xl">
              <Shield size={14} className="text-[#5a7a30] shrink-0" />
              <p className="text-xs text-[#5a7a30]">Your bank details are encrypted and never shared with guests.</p>
            </div>
          </SectionCard>

          <SectionCard title="Payout Schedule" subtitle="When you receive your earnings">
            <div className="grid grid-cols-3 gap-3">
              {["Daily", "Weekly", "Monthly"].map(opt => (
                <button key={opt} onClick={() => setData(d => ({ ...d, payoutSchedule: opt }))}
                  className={`py-3 rounded-xl text-sm font-semibold border-2 transition-all ${data.payoutSchedule === opt ? "border-[#8aab5c] bg-[#f5faf0] text-[#3d5028]" : "border-[#e8e4da] text-[#9a9485] hover:border-[#c8d8b8]"}`}>
                  {opt}
                </button>
              ))}
            </div>
          </SectionCard>
        </>
      )}

      <div className="flex justify-end">
        <SaveButton onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }} saved={saved} />
      </div>
    </div>
  );
}

// ─── TAB: NOTIFICATIONS ───────────────────────────────────────
function NotificationsTab({ role }) {
  const [prefs, setPrefs] = useState({
    bookingConfirmations: true, bookingReminders: true, newMessages: true,
    promotions: false, updates: true, smsAlerts: false, pushNotifs: true,
    newBookingRequests: true, reviewAlerts: true, payoutNotifs: true,
  });
  const [privacy, setPrivacy] = useState({
    showProfile: true, showReviews: true, shareDataAnalytics: false, personalizedAds: false,
  });
  const [saved, setSaved] = useState(false);

  const NRow = ({ label, sub, field, obj, setObj }) => (
    <div className="flex items-center justify-between py-3 border-b border-[#f0ede6] last:border-0">
      <div>
        <p className="text-sm font-semibold text-[#2d3a1e]">{label}</p>
        {sub && <p className="text-xs text-[#9a9485] mt-0.5">{sub}</p>}
      </div>
      <Toggle checked={obj[field]} onChange={v => setObj(p => ({ ...p, [field]: v }))} />
    </div>
  );

  return (
    <div className="space-y-5">
      <SectionCard title="Email Notifications">
        <NRow label="Booking Confirmations" sub="When a booking is confirmed or cancelled" field="bookingConfirmations" obj={prefs} setObj={setPrefs} />
        <NRow label="Booking Reminders" sub="24 hours before your stay begins" field="bookingReminders" obj={prefs} setObj={setPrefs} />
        <NRow label="New Messages" sub="When you receive a message" field="newMessages" obj={prefs} setObj={setPrefs} />
        <NRow label="Promotions & Deals" sub="Special offers and discounts" field="promotions" obj={prefs} setObj={setPrefs} />
        <NRow label="Product Updates" sub="New features and improvements" field="updates" obj={prefs} setObj={setPrefs} />
      </SectionCard>

      {role === "host" && (
        <SectionCard title="Host Notifications">
          <NRow label="New Booking Requests" sub="When a guest requests to book your property" field="newBookingRequests" obj={prefs} setObj={setPrefs} />
          <NRow label="Review Alerts" sub="When a guest leaves you a review" field="reviewAlerts" obj={prefs} setObj={setPrefs} />
          <NRow label="Payout Notifications" sub="When earnings are transferred to your bank" field="payoutNotifs" obj={prefs} setObj={setPrefs} />
        </SectionCard>
      )}

      <SectionCard title="Other Channels">
        <NRow label="SMS Alerts" sub="Text messages for urgent updates" field="smsAlerts" obj={prefs} setObj={setPrefs} />
        <NRow label="Push Notifications" sub="In-app and browser notifications" field="pushNotifs" obj={prefs} setObj={setPrefs} />
      </SectionCard>

      <SectionCard title="Privacy Settings" subtitle="Control how your data and profile are used">
        <NRow label="Public Profile" sub="Allow others to view your profile" field="showProfile" obj={privacy} setObj={setPrivacy} />
        <NRow label="Show Reviews" sub="Display reviews on your public profile" field="showReviews" obj={privacy} setObj={setPrivacy} />
        <NRow label="Analytics Data Sharing" sub="Help us improve with anonymous usage data" field="shareDataAnalytics" obj={privacy} setObj={setPrivacy} />
        <NRow label="Personalized Ads" sub="See ads relevant to your interests" field="personalizedAds" obj={privacy} setObj={setPrivacy} />
      </SectionCard>

      <div className="flex justify-end">
        <SaveButton onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }} saved={saved} />
      </div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────
const TABS = [
  { id: "basic", label: "Basic Info", icon: User },
  { id: "security", label: "Account Security", icon: Lock },
  { id: "payment", label: "Payment", icon: CreditCard },
  { id: "notifications", label: "Notifications & Privacy", icon: Bell },
];

export default function ProfileSettings() {
  const [activeTab, setActiveTab] = useState("basic");
  const [role, setRole] = useState("guest");
  const [guestData, setGuestData] = useState(MOCK_GUEST);
  const [hostData, setHostData] = useState(MOCK_HOST);

  const data = role === "guest" ? guestData : hostData;
  const setData = role === "guest" ? setGuestData : setHostData;
  const initials = data.name?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="min-h-screen bg-[#f5f3ec]">
      {/* Header */}
      <div className="bg-white border-b border-[#e8e4da] px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-[#2d3a1e]">Profile Settings</h1>
          <p className="text-xs text-[#9a9485]">Manage your account information</p>
        </div>
        {/* Role switcher — demo only */}
        <div className="flex items-center gap-1 bg-[#f0ede6] rounded-xl p-1">
          {["guest", "host"].map(r => (
            <button key={r} onClick={() => setRole(r)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${role === r ? "bg-white text-[#3d5028] shadow-sm" : "text-[#9a9485] hover:text-[#5a7050]"}`}>
              {r === "guest" ? <User size={12} /> : <Home size={12} />} {r}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Profile summary */}
        <div className="bg-white rounded-2xl border border-[#e8e4da] p-5 mb-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#8aab5c] to-[#3d5028] flex items-center justify-center text-white text-xl font-bold shadow overflow-hidden">
            {data.photo ? <img src={data.photo} alt="avatar" className="w-full h-full object-cover" /> : initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[#2d3a1e]">{data.name}</p>
            <p className="text-xs text-[#9a9485]">@{data.username} · {data.location}</p>
          </div>
          <span className={`text-xs font-bold px-3 py-1.5 rounded-full capitalize ${role === "host" ? "bg-[#fff8e8] text-[#b07030]" : "bg-[#e8f0df] text-[#5a7a30]"}`}>
            {role}
          </span>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-[#e8e4da] rounded-2xl p-1 mb-6 overflow-x-auto">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex-1 justify-center ${activeTab === tab.id ? "bg-[#3d5028] text-white shadow-sm" : "text-[#7a8f5a] hover:bg-[#f5f3ec] hover:text-[#3d5028]"}`}>
                <Icon size={13} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        {activeTab === "basic" && <BasicInfoTab role={role} data={data} setData={setData} />}
        {activeTab === "security" && <SecurityTab data={data} />}
        {activeTab === "payment" && <PaymentTab role={role} data={data} setData={setData} />}
        {activeTab === "notifications" && <NotificationsTab role={role} />}
      </div>
    </div>
  );
}
