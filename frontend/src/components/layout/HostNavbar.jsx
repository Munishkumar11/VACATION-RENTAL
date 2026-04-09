// src/components/layout/HostNavbar.jsx
import { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Home, LayoutDashboard, Calendar, DollarSign,
  MessageCircle, LogOut, User, ChevronDown, ChevronUp, Menu, X
} from "lucide-react";
import NotificationBell from "./NotificationBell";

function HostNavbar() {
  const [user, setUser] = useState(null);
  const [accountMenu, setAccountMenu] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser && storedUser !== "undefined") {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setAccountMenu(false);
        setMobileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await axios.get("http://localhost:5000/user/logout", { withCredentials: true });
      localStorage.removeItem("user");
      navigate("/login");
      window.location.reload();
    } catch (error) {
      console.log(error);
    }
  };

  const hostLinks = [
    { label: "Dashboard",   icon: LayoutDashboard, path: "/host/HostDashboard" },
    { label: "My Listings", icon: Home,             path: "/host/HostListings" },
    { label: "Calendar",    icon: Calendar,         path: "/Managecalendar" },
    { label: "Earnings",    icon: DollarSign,       path: "/hostearnings" },
    { label: "Messages",    icon: MessageCircle,    path: "/messages" },
  ];

  return (
    <div ref={containerRef} className="sticky top-0 z-50">
      <nav className="bg-[#f5f3ec] border-b border-[#d6cebc] px-4 md:px-6 h-16 flex items-center gap-3 shadow-sm">

        {/* Logo */}
        <NavLink to="/host/HostDashboard" className="flex items-center gap-2 shrink-0">
          <div className="bg-[#6b8c3e] p-1.5 rounded-lg">
            <Home size={18} className="text-white" />
          </div>
          <span className="text-lg font-bold text-[#2d3a1e]">
            Home<span className="text-[#6b8c3e]">Haven</span>
            <span className="ml-2 text-xs font-medium text-white bg-[#6b8c3e] px-2 py-0.5 rounded-full">Host</span>
          </span>
        </NavLink>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-2 ml-auto">
          {hostLinks.map(({ label, icon: Icon, path }) => (
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

        {/* Right Side */}
        <div className="flex items-center gap-2 ml-auto md:ml-0">
          <NotificationBell
            enabled={!!user}
            storageKey={`notifications_seen_${user?._id || "host"}`}
            buttonClassName="relative flex h-9 w-9 items-center justify-center rounded-full border border-[#c5c9a0] transition-colors hover:bg-[#e8ecd8] disabled:cursor-not-allowed disabled:opacity-60"
            iconClassName="text-[#6b8c3e]"
            badgeClassName="absolute -right-1 -top-1 inline-flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#6b8c3e] px-1 text-[10px] font-bold text-white"
          />

          {/* Avatar */}
          {user && (
            <button
              onClick={() => setAccountMenu(!accountMenu)}
              className="flex items-center h-9 bg-[#e8ecd8] border border-[#c5c9a0] rounded-full px-2 hover:bg-[#d6e8b8] transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#8aab5c] to-[#6b8c3e] flex items-center justify-center text-white text-xs font-bold">
                {user?.name?.split(" ").map((w) => w[0]).join("").toUpperCase()}
              </div>
              {accountMenu
                ? <ChevronUp className="text-[#8aab5c] ml-1" size={14} />
                : <ChevronDown className="text-[#8aab5c] ml-1" size={14} />
              }
            </button>
          )}

          {/* Mobile Toggle */}
          <button
            onClick={() => setMobileMenu(!mobileMenu)}
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-full border border-[#c5c9a0] hover:bg-[#e8ecd8]"
          >
            {mobileMenu ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div className={`md:hidden overflow-hidden transition-all duration-300 ${mobileMenu ? "max-h-96 opacity-100" : "max-h-0 opacity-0"} bg-[#f5f3ec] border-b border-[#d6cebc]`}>
        <div className="flex flex-col p-2">
          {hostLinks.map(({ label, icon: Icon, path }) => (
            <NavLink
              key={path}
              to={path}
              onClick={() => setMobileMenu(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all ${
                  isActive ? "bg-[#d6e8b8] text-[#3d5028] font-medium" : "text-[#5a7a30] hover:bg-[#e8ecd8]"
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </div>
      </div>

      {/* Account Dropdown */}
      {accountMenu && (
        <div className="absolute right-6 top-16 w-64 bg-white border border-[#d6cebc] rounded-2xl shadow-xl overflow-hidden z-50">
          <div className="px-5 py-4 bg-[#f5f3ec] border-b border-[#e0dbd0]">
            <p className="font-bold text-[#2d3a1e]">{user?.name}</p>
            <p className="text-xs text-[#8aab5c]">Host • Verified</p>
          </div>
          <div className="flex flex-col p-2">
            <NavLink
              to="/profile"
              onClick={() => setAccountMenu(false)}
              className="flex items-center gap-3 px-3 py-2.5 text-sm text-[#3d5028] rounded-lg hover:bg-[#f5f3ec]"
            >
              <User size={16} className="text-[#8aab5c]" />
              Profile Settings
            </NavLink>
            <div className="my-1 border-t border-[#e0dbd0]" />
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 text-sm text-[#5a7a30] rounded-lg hover:bg-[#f5f3ec]"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default HostNavbar;
