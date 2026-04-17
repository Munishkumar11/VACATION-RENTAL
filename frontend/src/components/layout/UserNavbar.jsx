import { useState, useRef, useEffect } from "react";
import { NavLink } from "react-router-dom";
import axios from "axios";
import {
  Heart, BookOpen, MessageCircle, Compass, Home, Menu, X,
  ChevronDown, User, Settings, LogOut, LayoutDashboard, Calendar,
  DollarSign, ChevronUp,
} from "lucide-react";
import NotificationBell from "./NotificationBell";
import { normalizeMediaUrl } from "../../utils/mediaUrl";

function UserNavbar({ userRole = "guest" }) {
  const [user, setUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [accountMenu, setAccountMenu] = useState(false);
  const containerRef = useRef(null);

  const guestLinks = [
    { id: "explore", label: "Explore", icon: Compass, path: "/" },
    { id: "wishlist", label: "Wishlist", icon: Heart, path: "/wishlist" },
    { id: "bookings", label: "My Bookings", icon: BookOpen, path: "/bookings" },
    { id: "messages", label: "Messages", icon: MessageCircle, path: "/messages" },
  ];

  const hostLinks = [
    { id: "dashboard", label: "explore", icon: LayoutDashboard, path: "/" },
    { id: "listings", label: "My Listings", icon: Home, path: "/host/HostListings" },
    { id: "calendar", label: "Calendar", icon: Calendar, path: "/Managecalendar" },
    { id: "earnings", label: "Earnings", icon: DollarSign, path: "/host/earnings" },
    { id: "messages", label: "Messages", icon: MessageCircle, path: "/messages" },
  ];

  const role = user?.role || userRole;
  const displayLinks = role === "host" ? hostLinks : guestLinks;
  const avatarSrc = normalizeMediaUrl(user?.profilePic || user?.photo || "");
  const userInitials = user?.name
    ? user.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setMobileMenu(false);
        setAccountMenu(false);
      }
    }
    document.addEventListener("click", handleClickOutside); 
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  useEffect(() => {
    axios
      .get("/user/me", { withCredentials: true })
      .then((res) => { setUser(res.data.data); })
      .catch((err) => { console.log(err); })
      .finally(() => { setUserLoading(false); });
  }, []);

  const handleLogout = async () => {
     console.log("LOGOUT CLICKED");
    console.log("LOGOUT CLICKED");
  try {
    await axios.post("/user/logout",{}, { withCredentials: true });
    localStorage.removeItem("user");
    setUser(null);
    setAccountMenu(false);
    window.location.href = "/";
  } catch (error) {
    console.log("LOGOUT ERROR:", error.message);
  }
};


  return (
    <>
      <div ref={containerRef} className="sticky top-0 z-50 px-3 pb-2 pt-3 md:px-6" >
        {/* Main Navbar */}
        <nav
          className="premium-card-strong mx-auto flex h-[74px] max-w-7xl items-center gap-3 rounded-[28px] border border-[rgba(22,58,47,0.12)] px-4 md:px-6"
          role="navigation"
          aria-label="Main navigation"
        >
          {/* Logo */}
          <NavLink
            to="/"
            className="flex shrink-0 items-center gap-3 no-underline"
            aria-label="Go to homepage"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#163a2f] shadow-[0_16px_28px_rgba(22,58,47,0.18)]">
              <Home size={18} className="text-[#f8f5ef]" />
            </div>
            <div className="hidden min-[430px]:block">
              <h1 className="premium-heading text-[1.55rem] font-semibold leading-none tracking-[-0.03em] text-[#163a2f]">AKSHU ELITE HOMES</h1>
              <p className="mt-1 text-[10px] uppercase tracking-[0.34em] text-[#8f7a57]">Curated Vacation Stays</p>
            </div>
          </NavLink>

          {/* Desktop Nav */}
          <div className="hidden xl:flex items-center gap-2 ml-auto">
            {displayLinks.map(({ label, icon: Icon, path }) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) =>
                  `premium-button inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm ${
                    isActive
                      ? "bg-[#163a2f] text-white shadow-[0_16px_30px_rgba(22,58,47,0.18)]"
                      : "premium-pill hover:border-[rgba(200,169,107,0.45)] hover:bg-white hover:text-[#10281f]"
                  }`
                }
              >
                <Icon size={16} strokeWidth={1.8} />
                {label}
              </NavLink>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 ml-auto md:ml-0">
            {/* Notifications */}
            <NotificationBell
              enabled={!userLoading && !!user}
              storageKey={`notifications_seen_${user?._id || role || "guest"}`}
              buttonClassName="premium-pill relative inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              iconClassName="text-[#163a2f]"
              badgeClassName="absolute -right-1 -top-1 inline-flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#163a2f] px-1 text-[10px] font-bold text-white shadow-[0_8px_18px_rgba(22,58,47,0.22)]"
              panelClassName="!mt-4"
            />

            {/* Desktop CTA */}
            {role === "host" && (
  <NavLink
    to="/host/HostDashboard"
    className="premium-button hidden rounded-full bg-[#163a2f] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_34px_rgba(22,58,47,0.18)] hover:bg-[#10281f] md:inline-flex"
  >
    Host Dashboard
  </NavLink>
)}

            
  {/* Avatar */}
{userLoading ? (
  <div className="h-10 w-10 rounded-full bg-[rgba(22,58,47,0.08)] animate-pulse" />
) : user ? (
  <button
    onClick={() => { setAccountMenu(!accountMenu); setMobileMenu(false); }}
    className="premium-pill inline-flex h-11 items-center justify-center gap-2 rounded-full px-2.5 hover:bg-white"
  >
    <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-[linear-gradient(145deg,#c8a96b,#163a2f)] text-xs font-bold text-white shadow-[0_12px_20px_rgba(22,58,47,0.18)]">
      {avatarSrc ? (
        <img src={avatarSrc} alt={user.name} className="h-full w-full object-cover" />
      ) : (
        userInitials
      )}
    </div>
    {accountMenu
      ? <ChevronUp className="ml-1 text-[#8f7a57]" size={14} />
      : <ChevronDown className="ml-1 text-[#8f7a57]" size={14} />
    }
  </button>
) : (
  <div className="flex items-center gap-2">
    <NavLink to="/login" className="premium-button premium-pill rounded-full px-4 py-2.5 text-sm font-medium hover:bg-white">Login</NavLink>
    <NavLink to="/signup" className="premium-button rounded-full bg-[#163a2f] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_18px_34px_rgba(22,58,47,0.18)] hover:bg-[#10281f]">Sign up</NavLink>
  </div>
)}

            {/* Mobile Menu Toggle */}
            <button
              aria-label="Open menu"
              onClick={() => { setMobileMenu(!mobileMenu); setAccountMenu(false); }}
              className="premium-pill inline-flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-white xl:hidden"
            >
              {mobileMenu
                ? <X size={20} className="text-[#3d5028]" />
                : <Menu size={20} className="text-[#3d5028]" />
              }
            </button>
          </div>
        </nav>

        {/* Mobile Menu Drawer */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            mobileMenu ? "max-h-125 opacity-100" : "max-h-0 opacity-0"
          } mx-auto max-w-7xl`}
        >
          <div className="premium-card-strong flex flex-col rounded-[26px] border border-[rgba(22,58,47,0.12)] p-3">
            {displayLinks.map(({ label, icon: Icon, path }) => (
              <NavLink
                key={path}
                to={path}
                onClick={() => setMobileMenu(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                    isActive
                      ? "bg-[#163a2f] text-white shadow-[0_14px_26px_rgba(22,58,47,0.16)]"
                      : "text-[#264238] hover:bg-[rgba(22,58,47,0.05)]"
                  }`
                }
              >
                <Icon size={18} strokeWidth={1.8} />
                {label}
              </NavLink>
            ))}

            <div className="my-3 border-t border-[rgba(22,58,47,0.09)]" />

            <NavLink
              to={role === "host" ? "/host/HostDashboard" : "/explore"}
              onClick={() => setMobileMenu(false)}
              className="premium-button mx-1 flex items-center justify-center gap-2 rounded-2xl bg-[#163a2f] py-3.5 text-white shadow-[0_18px_34px_rgba(22,58,47,0.16)] hover:bg-[#10281f]"
            >
              {role === "host" ? <LayoutDashboard size={18} /> : <Compass size={18} />}
              {role === "host" ? "Host Dashboard" : "Host a Property"}
            </NavLink>
          </div>
        </div>
      </div>

      {/* Account Dropdown */}
      {accountMenu && (
        <div className="absolute right-6 top-[92px] z-50 w-72 overflow-hidden rounded-[26px] border border-[rgba(22,58,47,0.12)] bg-[rgba(255,255,255,0.96)] shadow-[0_30px_60px_rgba(17,24,39,0.12)] backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
          {/* User Info Header */}
          <div className="border-b border-[rgba(22,58,47,0.08)] bg-[linear-gradient(180deg,rgba(22,58,47,0.06),rgba(200,169,107,0.08))] px-5 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-[linear-gradient(145deg,#c8a96b,#163a2f)] font-bold text-white shadow-[0_14px_26px_rgba(22,58,47,0.18)]">
                {avatarSrc ? (
                  <img src={avatarSrc} alt={user?.name || "User"} className="h-full w-full object-cover" />
                ) : user ? (
                  userInitials
                ) : document.cookie.includes("token") ? "..." : "?"}
              </div>
              <div>
              <p className="text-sm font-semibold text-[#163a2f]">
  {user ? user.name : "Loading..."}
</p>
                <p className="text-[10px] uppercase tracking-[0.28em] text-[#8f7a57]">
                  {role === "host" ? "Host" : "Guest"} • Verified
                </p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="flex flex-col gap-1 p-2.5">
            {role === "host" && (
              <>
                <NavLink
                  to="/host/HostDashboard"
                  className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-[#3d5028] rounded-lg hover:bg-[#f5f3ec] hover:text-[#2d3a1e] transition-colors"
                  onClick={() => setAccountMenu(false)}
                >
                  <LayoutDashboard size={18} className="text-[#8aab5c]" />
                  Host Dashboard
                </NavLink>
                <NavLink
                  to="/host/listings"
                  className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-[#3d5028] rounded-lg hover:bg-[#f5f3ec] hover:text-[#2d3a1e] transition-colors"
                  onClick={() => setAccountMenu(false)}
                >
                  <Home size={18} className="text-[#8aab5c]" />
                  My Listings
                </NavLink>
                <NavLink
                  to="/host/earnings"
                  className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-[#3d5028] rounded-lg hover:bg-[#f5f3ec] hover:text-[#2d3a1e] transition-colors"
                  onClick={() => setAccountMenu(false)}
                >
                  <DollarSign size={18} className="text-[#8aab5c]" />
                  Earnings & Payouts
                </NavLink>
                <div className="my-2 border-t border-[#e0dbd0]" />
              </>
            )}

            <NavLink
              to="/profile"
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-[#3d5028] rounded-lg hover:bg-[#f5f3ec] hover:text-[#2d3a1e] transition-colors"
              onClick={() => setAccountMenu(false)}
            >
              <User size={18} className="text-[#8aab5c]" />
              Profile Settings
            </NavLink>
            <NavLink
              to="/bookings"
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-[#3d5028] rounded-lg hover:bg-[#f5f3ec] hover:text-[#2d3a1e] transition-colors"
              onClick={() => setAccountMenu(false)}
            >
              <BookOpen size={18} className="text-[#8aab5c]" />
              My Bookings
            </NavLink>
            <NavLink
              to="/messages"
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-[#3d5028] rounded-lg hover:bg-[#f5f3ec] hover:text-[#2d3a1e] transition-colors"
              onClick={() => setAccountMenu(false)}
            >
              <MessageCircle size={18} className="text-[#8aab5c]" />
              Messages
            </NavLink>

            {role === "guest" && (
  <>
    <div className="my-2 border-t border-[#e0dbd0]" />
    <NavLink
      to="/wishlist"
      className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-[#3d5028] rounded-lg hover:bg-[#f5f3ec] hover:text-[#2d3a1e] transition-colors"
      onClick={() => setAccountMenu(false)}
    >
      <Heart size={18} className="text-[#8aab5c]" />
      Wishlist
    </NavLink>
  </>
)}

            <div className="my-2 border-t border-[#e0dbd0]" />

            <NavLink
              to="/settings"
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-[#3d5028] rounded-lg hover:bg-[#f5f3ec] hover:text-[#2d3a1e] transition-colors"
              onClick={() => setAccountMenu(false)}
            >
              <Settings size={18} className="text-[#8aab5c]" />
              Account Settings
            </NavLink>

            <div className="my-2 border-t border-[#e0dbd0]" />

            <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-[#5a7a30] rounded-lg hover:bg-[#f5f3ec] transition-colors">
              <LogOut size={18} />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default UserNavbar;
