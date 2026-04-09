import { useEffect, useState } from "react";
import { DollarSign, TrendingUp, Clock } from "lucide-react";
import axios from "axios";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function HostEarnings() {
  const [bookings, setBookings] = useState([]);
  const [period, setPeriod] = useState("month");

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await axios.get("/booking/host");
        setBookings(res.data.data || []);
      } catch (error) {
        console.log(error);
      }
    };
    fetchBookings();
  }, []);

  const now = new Date();

  const totalEarnings = bookings
    .filter((b) => b.status === "confirmed" || b.status === "completed")
    .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

  const thisMonthEarnings = bookings
    .filter((b) => {
      const d = new Date(b.createdAt);
      return (b.status === "confirmed" || b.status === "completed") &&
        d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

  const pendingEarnings = bookings
    .filter((b) => b.status === "pending")
    .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

  // Monthly bar data — last 6 months
  const barData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const monthTotal = bookings
      .filter((b) => {
        const bd = new Date(b.createdAt);
        return bd.getMonth() === d.getMonth() && bd.getFullYear() === d.getFullYear() &&
          (b.status === "confirmed" || b.status === "completed");
      })
      .reduce((sum, b) => sum + (b.totalPrice || 0), 0);
    return { month: MONTHS[d.getMonth()], value: monthTotal };
  });

  const maxBar = Math.max(...barData.map((d) => d.value), 1);

  const statusStyle = {
    confirmed: "bg-[#d1f0c4] text-[#2a6310]",
    completed: "bg-[#e8ecd8] text-[#3d5028]",
    pending: "bg-[#fef3c7] text-[#92400e]",
    cancelled: "bg-[#fee2e2] text-[#991b1b]",
  };

  return (
    <div className="min-h-screen bg-[#f5f3ec] p-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[18px] font-medium text-[#2d3a1e]">Earnings</h1>
          <p className="text-[12px] text-[#9a9476] mt-0.5">Your payout overview</p>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="h-[30px] px-2.5 pr-7 border border-[#d6cebc] rounded-[7px] bg-white text-[12px] text-[#3d5028] outline-none focus:border-[#6b8c3e] appearance-none cursor-pointer"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%239a9476' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center" }}
        >
          <option value="month">This month</option>
          <option value="last">Last month</option>
          <option value="year">This year</option>
        </select>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: "This month", value: `₹${thisMonthEarnings.toLocaleString("en-IN")}`, icon: TrendingUp, change: "Confirmed bookings", color: "#6b8c3e" },
          { label: "Pending payout", value: `₹${pendingEarnings.toLocaleString("en-IN")}`, icon: Clock, change: "Awaiting confirmation", color: "#b45309" },
          { label: "Total earnings", value: `₹${totalEarnings.toLocaleString("en-IN")}`, icon: DollarSign, change: "All time", color: "#6b8c3e" },
        ].map((stat, i) => (
          <div key={i} className="bg-white border border-[#e0dbd0] rounded-[10px] p-4">
            <p className="text-[11px] text-[#9a9476] mb-2">{stat.label}</p>
            <div className="flex items-end justify-between mb-1.5">
              <span className="text-[20px] font-medium text-[#2d3a1e] leading-none">{stat.value}</span>
              <div className="w-[30px] h-[30px] rounded-[7px] bg-[#f0f0e4] flex items-center justify-center">
                <stat.icon className="w-3.5 h-3.5 text-[#6b8c3e]" />
              </div>
            </div>
            <p className="text-[11px]" style={{ color: stat.color }}>{stat.change}</p>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div className="bg-white border border-[#e0dbd0] rounded-[12px] p-5 mb-4">
        <p className="text-[13px] font-medium text-[#2d3a1e] mb-1">Monthly earnings</p>
        <p className="text-[11px] text-[#9a9476] mb-4">Last 6 months</p>
        <div className="flex items-flex-end gap-2" style={{ height: 100, alignItems: "flex-end" }}>
          {barData.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5" style={{ height: "100%", justifyContent: "flex-end" }}>
              <div
                className="w-full rounded-t-[4px] transition-all cursor-pointer group relative"
                style={{
                  height: `${Math.max((d.value / maxBar) * 100, 4)}%`,
                  background: i === barData.length - 1 ? "#6b8c3e" : "#e8ecd8",
                }}
                title={`₹${d.value.toLocaleString("en-IN")}`}
              />
              <span className="text-[9px] text-[#b0a890]">{d.month}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Payout history */}
      <div className="bg-white border border-[#e0dbd0] rounded-[12px] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#ece8de]">
          <span className="text-[13px] font-medium text-[#2d3a1e]">Payout history</span>
          <button className="text-[11px] text-[#6b8c3e] px-2.5 py-1 border border-[#c5c9a0] rounded-[6px] bg-[#f5f3ec] hover:bg-[#e8ecd8] transition-colors">
            Download CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#faf9f4]">
                <th className="text-left text-[11px] font-medium text-[#9a9476] px-4 py-2.5 border-b border-[#ece8de]">Date</th>
                <th className="text-left text-[11px] font-medium text-[#9a9476] px-4 py-2.5 border-b border-[#ece8de]">Property</th>
                <th className="text-left text-[11px] font-medium text-[#9a9476] px-4 py-2.5 border-b border-[#ece8de]">Guest</th>
                <th className="text-left text-[11px] font-medium text-[#9a9476] px-4 py-2.5 border-b border-[#ece8de]">Nights</th>
                <th className="text-left text-[11px] font-medium text-[#9a9476] px-4 py-2.5 border-b border-[#ece8de]">Amount</th>
                <th className="text-left text-[11px] font-medium text-[#9a9476] px-4 py-2.5 border-b border-[#ece8de]">Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => {
                const nights = Math.ceil(
                  (new Date(booking.checkOut) - new Date(booking.checkIn)) / 86400000
                );
                return (
                  <tr key={booking._id} className="hover:bg-[#faf9f4] transition-colors">
                    <td className="px-4 py-2.5 text-[12px] text-[#6b7a50] border-b border-[#f5f3ec]">
                      {new Date(booking.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </td>
                    <td className="px-4 py-2.5 text-[12px] text-[#6b7a50] border-b border-[#f5f3ec]">
                      {booking.property?.title}
                    </td>
                    <td className="px-4 py-2.5 text-[12px] font-medium text-[#2d3a1e] border-b border-[#f5f3ec]">
                      {booking.guest?.name}
                    </td>
                    <td className="px-4 py-2.5 text-[12px] text-[#6b7a50] border-b border-[#f5f3ec]">
                      {nights}
                    </td>
                    <td className="px-4 py-2.5 text-[12px] font-medium text-[#2d3a1e] border-b border-[#f5f3ec]">
                      ₹{booking.totalPrice?.toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-2.5 border-b border-[#f5f3ec]">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${statusStyle[booking.status] || "bg-[#e8ecd8] text-[#3d5028]"}`}>
                        {booking.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {bookings.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-[12px] text-[#9a9476]">
                    No payouts yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
     