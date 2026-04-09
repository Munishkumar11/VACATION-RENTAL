import { useState, useRef, useEffect } from "react";
import { NavLink } from "react-router-dom";
import axios from "axios";
import {
  Heart, BookOpen, MessageCircle, Compass, Home, Menu, X,
  ChevronDown, User, Settings, LogOut, LayoutDashboard, Calendar,
  DollarSign, ChevronUp,
} from "lucide-react";
import NotificationBell from "./NotificationBell";

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
      .get("http://localhost:5000/user/me", { withCredentials: true })
      .then((res) => { setUser(res.data.data); })
      .catch((err) => { console.log(err); })
      .finally(() => { setUserLoading(false); });
  }, []);

  const handleLogout = async () => {
     console.log("LOGOUT CLICKED");
    console.log("LOGOUT CLICKED");
  try {
    await axios.post("http://localhost:5000/user/logout",{}, { withCredentials: true });
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
      <div ref={containerRef} className="sticky top-0 z-50" >
        {/* Main Navbar */}
        <nav
          className=" bg-[#f5f3ec] border-b border-[#d6cebc] px-4 md:px-6 h-16 flex items-center gap-3 shadow-sm"
          role="navigation"
          aria-label="Main navigation"
        >
          {/* Logo */}
          <NavLink
            to="/"
            className="flex items-center gap-2 shrink-0 no-underline"
            aria-label="Go to homepage"
          >
            <div className="bg-[#6b8c3e] p-1.5 rounded-lg">
              <Home size={18} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-green-700">AKSHU ELITE HOMES</h1>
          </NavLink>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-2 ml-auto">
            {displayLinks.map(({ label, icon: Icon, path }) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-[#d6e8b8] text-[#3d5028] shadow-sm"
                      : "text-[#5a7a30] hover:bg-[#e8ecd8] hover:text-[#2d3a1e]"
                  }`
                }
              >
                <Icon size={16} />
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
              buttonClassName="relative flex h-9 w-9 items-center justify-center rounded-full border border-[#c5c9a0] transition-colors hover:bg-[#e8ecd8] disabled:cursor-not-allowed disabled:opacity-60"
              iconClassName="text-[#6b8c3e]"
              badgeClassName="absolute -right-1 -top-1 inline-flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#6b8c3e] px-1 text-[10px] font-bold text-white"
            />

            {/* Desktop CTA */}
            {role === "host" && (
  <NavLink
    to="/host/HostDashboard"
    className="hidden md:block bg-[#6b8c3e] text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-[#5a7a30] transition-colors shadow-sm"
  >
    Host Dashboard
  </NavLink>
)}

            
  {/* Avatar */}
{userLoading ? (
  <div className="w-8 h-8 rounded-full bg-[#e8ecd8] animate-pulse" />
) : user ? (
  <button
    onClick={() => { setAccountMenu(!accountMenu); setMobileMenu(false); }}
    className="flex items-center justify-center h-9 bg-[#e8ecd8] border border-[#c5c9a0] rounded-full px-2 hover:bg-[#d6e8b8] transition-colors"
  >
    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#8aab5c] to-[#6b8c3e] flex items-center justify-center text-white text-xs font-bold shadow-sm">
      {user?.name.split(" ").map((w) => w[0]).join("").toUpperCase()}
    </div>
    {accountMenu
      ? <ChevronUp className="text-[#8aab5c] ml-1" size={14} />
      : <ChevronDown className="text-[#8aab5c] ml-1" size={14} />
    }
  </button>
) : (
  <div className="flex items-center gap-2">
    <NavLink to="/login" className="text-sm font-medium text-[#3d5028] px-4 py-2 rounded-lg border border-[#d6cebc] hover:bg-[#e8ecd8]">Login</NavLink>
    <NavLink to="/signup" className="text-sm font-medium text-white bg-[#6b8c3e] px-4 py-2 rounded-lg hover:bg-[#5a7a30]">Sign up</NavLink>
  </div>
)}

            {/* Mobile Menu Toggle */}
            <button
              aria-label="Open menu"
              onClick={() => { setMobileMenu(!mobileMenu); setAccountMenu(false); }}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-full border border-[#c5c9a0] hover:bg-[#e8ecd8] transition-colors"
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
          } bg-[#f5f3ec] border-b border-[#d6cebc]`}
        >
          <div className="flex flex-col p-2">
            {displayLinks.map(({ label, icon: Icon, path }) => (
              <NavLink
                key={path}
                to={path}
                onClick={() => setMobileMenu(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                    isActive
                      ? "bg-[#d6e8b8] text-[#3d5028] font-medium"
                      : "text-[#5a7a30] hover:bg-[#e8ecd8] hover:text-[#2d3a1e]"
                  }`
                }
              >
                <Icon size={20} />
                {label}
              </NavLink>
            ))}

            <div className="my-2 border-t border-[#c5c9a0]" />

            <NavLink
              to={role === "host" ? "/host/HostDashboard" : "/explore"}
              onClick={() => setMobileMenu(false)}
              className="mx-2 flex items-center justify-center gap-2 bg-[#6b8c3e] text-white font-semibold py-3.5 rounded-xl shadow-sm hover:bg-[#5a7a30] transition-colors"
            >
              {role === "host" ? <LayoutDashboard size={18} /> : <Compass size={18} />}
              {role === "host" ? "Host Dashboard" : "Host a Property"}
            </NavLink>
          </div>
        </div>
      </div>

      {/* Account Dropdown */}
      {accountMenu && (
        <div className="absolute right-6 top-16 w-72 bg-white border border-[#d6cebc] rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
          {/* User Info Header */}
          <div className="px-5 py-4 bg-[#f5f3ec] border-b border-[#e0dbd0]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#8aab5c] to-[#6b8c3e] flex items-center justify-center text-white font-bold shadow-md">
                {user
  ? user?.name.split(" ").map((w) => w[0]).join("").toUpperCase()
  : document.cookie.includes("token") ? "..." : "?"}
              </div>
              <div>
              <p className="font-bold text-[#2d3a1e]">
  {user ? user.name : "Loading..."}
</p>
                <p className="text-xs text-[#8aab5c]">
                  {role === "host" ? "Host" : "Guest"} • Verified
                </p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="flex flex-col p-2">
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
