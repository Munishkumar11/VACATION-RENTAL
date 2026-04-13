import { useEffect, useMemo, useRef, useState } from "react";
import { User, Lock, CreditCard, Bell, Camera, Trash2, Plus, Eye, EyeOff } from "lucide-react";
import api from "../api";

const EMPTY = {
  name: "",
  username: "",
  email: "",
  phone: "",
  dob: "",
  bio: "",
  location: "",
  language: "English",
  photo: "",
  emergencyContact: { name: "", phone: "", relation: "" },
  savedCards: [],
  bankDetails: { accountHolder: "", accountNo: "", ifsc: "", bank: "" },
  payoutSchedule: "Monthly",
  notificationPreferences: {
    bookingConfirmations: true,
    bookingReminders: true,
    newMessages: true,
    promotions: false,
    updates: true,
    smsAlerts: false,
    pushNotifs: true,
    newBookingRequests: true,
    reviewAlerts: true,
    payoutNotifs: true,
  },
  privacySettings: {
    showProfile: true,
    showReviews: true,
    shareDataAnalytics: false,
    personalizedAds: false,
  },
};

const normalizeUser = (user = {}) => ({
  ...EMPTY,
  ...user,
  dob: user?.dob ? String(user.dob).slice(0, 10) : "",
  photo: user?.profilePic || user?.photo || "",
  emergencyContact: { ...EMPTY.emergencyContact, ...(user?.emergencyContact || {}) },
  savedCards: Array.isArray(user?.savedCards) ? user.savedCards : [],
  bankDetails: { ...EMPTY.bankDetails, ...(user?.bankDetails || {}) },
  notificationPreferences: { ...EMPTY.notificationPreferences, ...(user?.notificationPreferences || {}) },
  privacySettings: { ...EMPTY.privacySettings, ...(user?.privacySettings || {}) },
});

const fieldCls = "w-full rounded-xl border border-[#ddd8cc] bg-[#fafaf7] px-4 py-2.5 text-sm text-[#2d3a1e] outline-none focus:border-[#8aab5c]";
const cardCls = "rounded-2xl border border-[#e8e4da] bg-white p-5";

function SaveButton({ onClick, loading, saved, label = "Save Changes" }) {
  return (
    <button type="button" onClick={onClick} disabled={loading} className={`rounded-xl px-4 py-2 text-sm font-semibold ${saved ? "bg-[#e8f0df] text-[#5a7a30]" : "bg-[#3d5028] text-white"}`}>
      {loading ? "Saving..." : saved ? "Saved!" : label}
    </button>
  );
}

export default function ProfileSettings() {
  const [tab, setTab] = useState("basic");
  const [profile, setProfile] = useState(EMPTY);
  const [role, setRole] = useState("guest");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState("");
  const [error, setError] = useState("");
  const [showAddCard, setShowAddCard] = useState(false);
  const [cardForm, setCardForm] = useState({ type: "Visa", cardNumber: "", expiry: "" });
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [showPw, setShowPw] = useState({ currentPassword: false, newPassword: false, confirmPassword: false });
  const fileRef = useRef(null);

  const initials = useMemo(() => (profile.name || "U").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2), [profile.name]);
  const avatarSrc = profile.photoPreview || profile.photo;

  const flashSaved = (key) => {
    setSaved(key);
    setTimeout(() => setSaved(""), 1800);
  };

  const loadProfile = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.getProfile();
      if (!res?.success) throw new Error(res?.message || "Could not load profile");
      setProfile(normalizeUser(res.data));
      setRole(res.data?.role || "guest");
      localStorage.setItem("vr_user", JSON.stringify(res.data));
    } catch (err) {
      setError(err.message || "Could not load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const saveProfileFields = async (fields, key) => {
    setSaving(true);
    setError("");
    try {
      const res = await api.saveProfile(fields);
      if (!res?.success) throw new Error(res?.message || "Save failed");
      setProfile(normalizeUser(res.data));
      localStorage.setItem("vr_user", JSON.stringify(res.data));
      flashSaved(key);
      return true;
    } catch (err) {
      setError(err.message || "Save failed");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const saveBasic = () => saveProfileFields({
    name: profile.name,
    username: profile.username,
    phone: profile.phone,
    dob: profile.dob,
    bio: profile.bio,
    location: profile.location,
    language: profile.language,
    emergencyContact: profile.emergencyContact,
    ...(profile.photo instanceof File ? { photo: profile.photo } : {}),
  }, "basic");

  const savePhone = () => saveProfileFields({ phone: profile.phone }, "security-phone");

  const saveNotifications = () => saveProfileFields({
    notificationPreferences: profile.notificationPreferences,
    privacySettings: profile.privacySettings,
  }, "notifications");

  const saveDefaultCard = (cardId) => saveProfileFields({
    savedCards: profile.savedCards.map((card) => ({ ...card, isDefault: String(card._id || card.id) === String(cardId) })),
  }, "payment");

  const saveBank = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await api.saveBank({ ...profile.bankDetails, payoutSchedule: profile.payoutSchedule });
      if (!res?.success) throw new Error(res?.message || "Could not save bank details");
      setProfile(normalizeUser(res.data));
      flashSaved("payment");
    } catch (err) {
      setError(err.message || "Could not save bank details");
    } finally {
      setSaving(false);
    }
  };

  const addCard = async () => {
    const digits = cardForm.cardNumber.replace(/\D/g, "");
    if (digits.length < 4 || !cardForm.expiry) {
      setError("Enter a valid card number and expiry");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await api.addCard({ type: cardForm.type, last4: digits.slice(-4), expiry: cardForm.expiry });
      if (!res?.success) throw new Error(res?.message || "Could not add card");
      setProfile((current) => ({ ...current, savedCards: res.data }));
      setCardForm({ type: "Visa", cardNumber: "", expiry: "" });
      setShowAddCard(false);
      flashSaved("payment");
    } catch (err) {
      setError(err.message || "Could not add card");
    } finally {
      setSaving(false);
    }
  };

  const deleteCard = async (cardId) => {
    setSaving(true);
    setError("");
    try {
      const res = await api.deleteCard(cardId);
      if (!res?.success) throw new Error(res?.message || "Could not delete card");
      setProfile((current) => ({ ...current, savedCards: res.data }));
      flashSaved("payment");
    } catch (err) {
      setError(err.message || "Could not delete card");
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (passwords.newPassword !== passwords.confirmPassword) {
      setError("New password and confirm password do not match");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await api.changePassword({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword });
      if (!res?.success) throw new Error(res?.message || "Could not update password");
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
      flashSaved("security-password");
    } catch (err) {
      setError(err.message || "Could not update password");
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: "basic", label: "Basic Info", icon: User },
    { id: "security", label: "Security", icon: Lock },
    { id: "payment", label: "Payment", icon: CreditCard },
    { id: "notifications", label: "Notifications", icon: Bell },
  ];

  if (loading) return <div className="min-h-screen bg-[#f5f3ec] px-6 py-8">Loading profile...</div>;

  return (
    <div className="min-h-screen bg-[#f5f3ec] px-4 py-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between rounded-2xl border border-[#e8e4da] bg-white px-6 py-4">
          <div>
            <h1 className="text-lg font-bold text-[#2d3a1e]">Profile Settings</h1>
            <p className="text-sm text-[#8c8678]">Changes here are now saved through real APIs.</p>
          </div>
          <div className="rounded-xl bg-[#f0ede6] px-4 py-2 text-xs font-semibold capitalize text-[#3d5028]">{role}</div>
        </div>

        {error && <div className="rounded-xl border border-[#f0d0d0] bg-[#fff5f5] px-4 py-3 text-sm text-[#c05050]">{error}</div>}

        <div className="flex items-center gap-4 rounded-2xl border border-[#e8e4da] bg-white p-5">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#8aab5c] to-[#3d5028] text-xl font-bold text-white">
            {avatarSrc ? <img src={avatarSrc} alt="avatar" className="h-full w-full object-cover" /> : initials}
          </div>
          <div className="flex-1">
            <div className="font-bold text-[#2d3a1e]">{profile.name || "No name yet"}</div>
            <div className="text-sm text-[#8c8678]">@{profile.username || "username"} · {profile.location || "No location"}</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 rounded-2xl border border-[#e8e4da] bg-white p-2">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" onClick={() => setTab(id)} className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold ${tab === id ? "bg-[#3d5028] text-white" : "text-[#5a7050]"}`}>
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {tab === "basic" && (
          <div className="space-y-5">
            <div className={cardCls}>
              <div className="mb-4 text-sm font-semibold text-[#2d3a1e]">Profile Photo</div>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#8aab5c] to-[#3d5028] text-2xl font-bold text-white">
                    {avatarSrc ? <img src={avatarSrc} alt="avatar" className="h-full w-full object-cover" /> : initials}
                  </div>
                  <button type="button" onClick={() => fileRef.current?.click()} className="absolute -bottom-1 -right-1 rounded-full bg-white p-2 shadow">
                    <Camera size={12} />
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setProfile((current) => ({ ...current, photo: file, photoPreview: URL.createObjectURL(file) }));
                  }} />
                </div>
                <div className="text-sm text-[#8c8678]">Upload JPG or PNG up to 5MB.</div>
              </div>
            </div>

            <div className={cardCls}>
              <div className="mb-4 text-sm font-semibold text-[#2d3a1e]">Personal Information</div>
              <div className="grid gap-4 sm:grid-cols-2">
                <input className={fieldCls} placeholder="Full name" value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} />
                <input className={fieldCls} placeholder="Username" value={profile.username} onChange={(e) => setProfile((p) => ({ ...p, username: e.target.value }))} />
                <input className={fieldCls} placeholder="Phone" value={profile.phone} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} />
                <input className={fieldCls} type="date" value={profile.dob} onChange={(e) => setProfile((p) => ({ ...p, dob: e.target.value }))} />
                <input className={fieldCls} placeholder="Email" value={profile.email} disabled />
                <input className={fieldCls} placeholder="Location" value={profile.location} onChange={(e) => setProfile((p) => ({ ...p, location: e.target.value }))} />
                <select className={fieldCls} value={profile.language} onChange={(e) => setProfile((p) => ({ ...p, language: e.target.value }))}>
                  {["English", "Hindi", "Gujarati", "Marathi", "Tamil", "Telugu"].map((item) => <option key={item}>{item}</option>)}
                </select>
                <div />
                <textarea className={fieldCls + " sm:col-span-2 min-h-[110px]"} placeholder="Bio" value={profile.bio} onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value.slice(0, 200) }))} />
              </div>
            </div>

            {role === "guest" && (
              <div className={cardCls}>
                <div className="mb-4 text-sm font-semibold text-[#2d3a1e]">Emergency Contact</div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <input className={fieldCls} placeholder="Contact name" value={profile.emergencyContact.name} onChange={(e) => setProfile((p) => ({ ...p, emergencyContact: { ...p.emergencyContact, name: e.target.value } }))} />
                  <input className={fieldCls} placeholder="Phone" value={profile.emergencyContact.phone} onChange={(e) => setProfile((p) => ({ ...p, emergencyContact: { ...p.emergencyContact, phone: e.target.value } }))} />
                  <input className={fieldCls} placeholder="Relation" value={profile.emergencyContact.relation} onChange={(e) => setProfile((p) => ({ ...p, emergencyContact: { ...p.emergencyContact, relation: e.target.value } }))} />
                </div>
              </div>
            )}

            <div className="flex justify-end"><SaveButton onClick={saveBasic} loading={saving} saved={saved === "basic"} /></div>
          </div>
        )}

        {tab === "security" && (
          <div className="space-y-5">
            <div className={cardCls}>
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-[#2d3a1e]">Contact Information</div>
                  <div className="text-sm text-[#8c8678]">Phone number is now saved to your account.</div>
                </div>
                <SaveButton onClick={savePhone} loading={saving} saved={saved === "security-phone"} label="Save Phone" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <input className={fieldCls} value={profile.email} disabled />
                <input className={fieldCls} value={profile.phone} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} placeholder="Phone" />
              </div>
            </div>

            <div className={cardCls}>
              <div className="mb-4 flex items-center justify-between gap-4">
                <div className="text-sm font-semibold text-[#2d3a1e]">Change Password</div>
                <SaveButton onClick={changePassword} loading={saving} saved={saved === "security-password"} label="Update Password" />
              </div>
              <div className="space-y-4">
                {[
                  ["currentPassword", "Current Password"],
                  ["newPassword", "New Password"],
                  ["confirmPassword", "Confirm Password"],
                ].map(([key, label]) => (
                  <div key={key} className="relative">
                    <input
                      className={fieldCls + " pr-10"}
                      type={showPw[key] ? "text" : "password"}
                      placeholder={label}
                      value={passwords[key]}
                      onChange={(e) => setPasswords((p) => ({ ...p, [key]: e.target.value }))}
                      autoComplete={key === "currentPassword" ? "current-password" : "new-password"}
                    />
                    <button type="button" onClick={() => setShowPw((s) => ({ ...s, [key]: !s[key] }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8c8678]">
                      {showPw[key] ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "payment" && role === "guest" && (
          <div className="space-y-5">
            <div className={cardCls}>
              <div className="mb-4 text-sm font-semibold text-[#2d3a1e]">Saved Cards</div>
              <div className="space-y-3">
                {profile.savedCards.map((card) => {
                  const cardId = card._id || card.id;
                  return (
                    <div key={cardId} className="flex items-center justify-between rounded-xl border border-[#e8e4da] px-4 py-3">
                      <div>
                        <div className="font-semibold text-[#2d3a1e]">{card.type} •••• {card.last4}</div>
                        <div className="text-sm text-[#8c8678]">Expires {card.expiry}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        {card.isDefault ? <span className="rounded-lg bg-[#e8f0df] px-2 py-1 text-xs font-semibold text-[#5a7a30]">Default</span> : <button type="button" onClick={() => saveDefaultCard(cardId)} className="text-sm font-semibold text-[#5a7a30]">Set default</button>}
                        <button type="button" onClick={() => deleteCard(cardId)} className="text-[#c05050]"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  );
                })}

                {showAddCard ? (
                  <div className="rounded-xl border border-dashed border-[#8aab5c] p-4">
                    <div className="grid gap-3 sm:grid-cols-3">
                      <select className={fieldCls} value={cardForm.type} onChange={(e) => setCardForm((c) => ({ ...c, type: e.target.value }))}>
                        <option>Visa</option>
                        <option>Mastercard</option>
                        <option>RuPay</option>
                      </select>
                      <input className={fieldCls} placeholder="Card number" value={cardForm.cardNumber} onChange={(e) => setCardForm((c) => ({ ...c, cardNumber: e.target.value }))} />
                      <input className={fieldCls} placeholder="MM/YY" value={cardForm.expiry} onChange={(e) => setCardForm((c) => ({ ...c, expiry: e.target.value }))} />
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button type="button" onClick={() => setShowAddCard(false)} className="rounded-xl bg-[#f0ede6] px-4 py-2 text-sm font-semibold text-[#2d3a1e]">Cancel</button>
                      <button type="button" onClick={addCard} className="rounded-xl bg-[#3d5028] px-4 py-2 text-sm font-semibold text-white">Add Card</button>
                    </div>
                  </div>
                ) : (
                  <button type="button" onClick={() => setShowAddCard(true)} className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#c8d8b8] px-4 py-3 text-sm font-semibold text-[#5a7a30]">
                    <Plus size={14} /> Add New Card
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {tab === "payment" && role === "host" && (
          <div className="space-y-5">
            <div className={cardCls}>
              <div className="mb-4 text-sm font-semibold text-[#2d3a1e]">Bank Details</div>
              <div className="grid gap-4 sm:grid-cols-2">
                <input className={fieldCls} placeholder="Account Holder" value={profile.bankDetails.accountHolder} onChange={(e) => setProfile((p) => ({ ...p, bankDetails: { ...p.bankDetails, accountHolder: e.target.value } }))} />
                <input className={fieldCls} placeholder="Account Number" value={profile.bankDetails.accountNo} onChange={(e) => setProfile((p) => ({ ...p, bankDetails: { ...p.bankDetails, accountNo: e.target.value } }))} />
                <input className={fieldCls} placeholder="IFSC" value={profile.bankDetails.ifsc} onChange={(e) => setProfile((p) => ({ ...p, bankDetails: { ...p.bankDetails, ifsc: e.target.value } }))} />
                <input className={fieldCls} placeholder="Bank" value={profile.bankDetails.bank} onChange={(e) => setProfile((p) => ({ ...p, bankDetails: { ...p.bankDetails, bank: e.target.value } }))} />
              </div>
              <div className="mt-4 flex gap-2">
                {["Daily", "Weekly", "Monthly"].map((item) => (
                  <button key={item} type="button" onClick={() => setProfile((p) => ({ ...p, payoutSchedule: item }))} className={`rounded-xl px-4 py-2 text-sm font-semibold ${profile.payoutSchedule === item ? "bg-[#e8f0df] text-[#5a7a30]" : "bg-[#f0ede6] text-[#5a7050]"}`}>
                    {item}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end"><SaveButton onClick={saveBank} loading={saving} saved={saved === "payment"} /></div>
          </div>
        )}

        {tab === "notifications" && (
          <div className="space-y-5">
            <div className={cardCls}>
              <div className="mb-4 text-sm font-semibold text-[#2d3a1e]">Notification Preferences</div>
              <div className="space-y-3">
                {Object.entries(profile.notificationPreferences).map(([key, value]) => (
                  <label key={key} className="flex items-center justify-between rounded-xl border border-[#e8e4da] px-4 py-3 text-sm text-[#2d3a1e]">
                    <span>{key}</span>
                    <input type="checkbox" checked={value} onChange={(e) => setProfile((p) => ({ ...p, notificationPreferences: { ...p.notificationPreferences, [key]: e.target.checked } }))} />
                  </label>
                ))}
              </div>
            </div>
            <div className={cardCls}>
              <div className="mb-4 text-sm font-semibold text-[#2d3a1e]">Privacy Settings</div>
              <div className="space-y-3">
                {Object.entries(profile.privacySettings).map(([key, value]) => (
                  <label key={key} className="flex items-center justify-between rounded-xl border border-[#e8e4da] px-4 py-3 text-sm text-[#2d3a1e]">
                    <span>{key}</span>
                    <input type="checkbox" checked={value} onChange={(e) => setProfile((p) => ({ ...p, privacySettings: { ...p.privacySettings, [key]: e.target.checked } }))} />
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-end"><SaveButton onClick={saveNotifications} loading={saving} saved={saved === "notifications"} /></div>
          </div>
        )}
      </div>
    </div>
  );
}
