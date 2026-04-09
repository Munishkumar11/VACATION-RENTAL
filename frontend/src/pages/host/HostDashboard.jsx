import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  DollarSign, Home, Calendar, CheckCircle,
  Plus, MessageCircle, ArrowRight,
} from "lucide-react";
import axios from "axios";

export default function HostDashboard() {
  const [bookings, setBookings] = useState([]);
  const [properties, setProperties] = useState([]);
  const [earnings, setEarnings] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bRes, pRes] = await Promise.all([
          axios.get("/booking/host", { withCredentials: true }),
          axios.get("/property/host", { withCredentials: true }),
        ]);
        setBookings(bRes.data.data || []);
        setProperties(pRes.data.data || []);
        const total = (bRes.data.data || [])
          .filter((b) => b.status === "confirmed" || b.status === "completed")
          .reduce((sum, b) => sum + (b.totalPrice || 0), 0);
        setEarnings(total);
      } catch (error) {
        console.log(error);
      }
    };
    fetchData();
  }, []);

  const pendingCount = bookings.filter((b) => b.status === "pending").length;

  const stats = [
    {
      label: "Total earnings",
      value: `₹${earnings.toLocaleString("en-IN")}`,
      icon: DollarSign,
      change: "This year",
      changeColor: "#6b8c3e",
    },
    {
      label: "Active listings",
      value: properties.length,
      icon: Home,
      change: `${properties.filter((p) => p.status === "active").length} active`,
      changeColor: "#6b8c3e",
    },
    {
      label: "Total bookings",
      value: bookings.length,
      icon: Calendar,
      change: `+${bookings.filter((b) => {
        const d = new Date(b.createdAt);
        return d.getMonth() === new Date().getMonth();
      }).length} this month`,
      changeColor: "#6b8c3e",
    },
    {
      label: "Pending requests",
      value: pendingCount,
      icon: CheckCircle,
      change: pendingCount > 0 ? "Needs review" : "All clear",
      changeColor: pendingCount > 0 ? "#b45309" : "#6b8c3e",
    },
  ];

  const quickActions = [
    { icon: Plus, title: "Add new listing", sub: "List a new property", to: "/AddListing" },
    { icon: Calendar, title: "Manage calendar", sub: "Block or open dates", to: "/Managecalendar" },
    { icon: MessageCircle, title: "Messages", sub: "Chat with guests", to: "/messages" },
    { icon: DollarSign, title: "Payout settings", sub: "Bank & UPI details", to: "/Managepayouts" },
  ];

  const statusStyle = {
    confirmed: "bg-[#d1f0c4] text-[#2a6310]",
    pending: "bg-[#fef3c7] text-[#92400e]",
    cancelled: "bg-[#fee2e2] text-[#991b1b]",
    completed: "bg-[#e8ecd8] text-[#3d5028]",
  };

  return (
    <div className="min-h-screen bg-[#f5f3ec] p-6">

      {/* Header */}
      <div className="mb-5">
        <h1 className="text-[18px] font-medium text-[#2d3a1e]">Host dashboard</h1>
        <p className="text-[12px] text-[#9a9476] mt-0.5">Welcome back</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white border border-[#e0dbd0] rounded-[10px] p-4">
            <p className="text-[11px] text-[#9a9476] mb-2">{stat.label}</p>
            <div className="flex items-end justify-between">
              <span className="text-[22px] font-medium text-[#2d3a1e] leading-none">
                {stat.value}
              </span>
              <div className="w-[30px] h-[30px] rounded-[7px] bg-[#f0f0e4] flex items-center justify-center">
                <stat.icon className="w-3.5 h-3.5 text-[#6b8c3e]" />
              </div>
            </div>
            <p className="text-[11px] mt-1.5" style={{ color: stat.changeColor }}>
              {stat.change}
            </p>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid lg:grid-cols-3 gap-4">

        {/* Recent bookings */}
        <div className="lg:col-span-2 bg-white border border-[#e0dbd0] rounded-[12px] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#ece8de]">
            <span className="text-[13px] font-medium text-[#2d3a1e]">Recent bookings</span>
            <Link
              to="/host/bookings"
              className="text-[11px] text-[#6b8c3e] px-2.5 py-1 border border-[#c5c9a0] rounded-[6px] bg-[#f5f3ec] hover:bg-[#e8ecd8] transition-colors"
            >
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#faf9f4]">
                  <th className="text-left text-[11px] font-medium text-[#9a9476] px-4 py-2.5 border-b border-[#ece8de]">Guest</th>
                  <th className="text-left text-[11px] font-medium text-[#9a9476] px-4 py-2.5 border-b border-[#ece8de]">Property</th>
                  <th className="text-left text-[11px] font-medium text-[#9a9476] px-4 py-2.5 border-b border-[#ece8de]">Check-in</th>
                  <th className="text-left text-[11px] font-medium text-[#9a9476] px-4 py-2.5 border-b border-[#ece8de]">Nights</th>
                  <th className="text-left text-[11px] font-medium text-[#9a9476] px-4 py-2.5 border-b border-[#ece8de]">Status</th>
                  <th className="text-left text-[11px] font-medium text-[#9a9476] px-4 py-2.5 border-b border-[#ece8de]">Message</th>
                </tr>
              </thead>
              <tbody>
                {bookings.slice(0, 6).map((booking) => {
                  const nights = Math.ceil(
                    (new Date(booking.checkOut) - new Date(booking.checkIn)) / 86400000
                  );
                  return (
                    <tr key={booking._id} className="hover:bg-[#faf9f4] transition-colors">
                      <td className="px-4 py-2.5 text-[12px] font-medium text-[#2d3a1e] border-b border-[#f5f3ec]">
                        {booking.guest?.name}
                      </td>
                      <td className="px-4 py-2.5 text-[12px] text-[#6b7a50] border-b border-[#f5f3ec]">
                        {booking.property?.title}
                      </td>
                      <td className="px-4 py-2.5 text-[12px] text-[#6b7a50] border-b border-[#f5f3ec]">
                        {new Date(booking.checkIn).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </td>
                      <td className="px-4 py-2.5 text-[12px] text-[#6b7a50] border-b border-[#f5f3ec]">
                        {nights}
                      </td>
                      <td className="px-4 py-2.5 border-b border-[#f5f3ec]">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${statusStyle[booking.status] || "bg-[#e8ecd8] text-[#3d5028]"}`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 border-b border-[#f5f3ec]">
                        <Link
                          to={`/messages?userId=${booking.guest?._id}${booking.property?._id ? `&propertyId=${booking.property._id}` : ""}`}
                          className="inline-flex items-center rounded-[8px] border border-[#d6cebc] px-2.5 py-1 text-[11px] font-medium text-[#3d5028] hover:bg-[#f5f3ec]"
                        >
                          Chat
                        </Link>
                      </td>
                    </tr>
                  );
                })}
                {bookings.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-[12px] text-[#9a9476]">
                      No bookings yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick actions */}
        <div className="bg-white border border-[#e0dbd0] rounded-[12px] p-4">
          <p className="text-[13px] font-medium text-[#2d3a1e] mb-3">Quick actions</p>
          <div className="flex flex-col gap-2">
            {quickActions.map((action, i) => (
              <Link
                key={i}
                to={action.to}
                className="flex items-center gap-2.5 p-2.5 rounded-[8px] border border-[#e0dbd0] bg-[#faf9f4] hover:bg-[#f0ede4] transition-colors"
              >
                <div className="w-[30px] h-[30px] rounded-[7px] bg-[#e8ecd8] flex items-center justify-center shrink-0">
                  <action.icon className="w-3.5 h-3.5 text-[#6b8c3e]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium text-[#2d3a1e]">{action.title}</p>
                  <p className="text-[11px] text-[#9a9476]">{action.sub}</p>
                </div>
                <ArrowRight className="w-3 h-3 text-[#c0b898] shrink-0" />
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
