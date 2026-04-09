import { useEffect, useState } from "react";
import { AlertCircle, Clock, DollarSign, Download, TrendingUp } from "lucide-react";
import axios from "axios";

const EMPTY_EARNINGS = {
  summary: {
    period: "month",
    periodLabel: "This month",
    periodEarnings: 0,
    pendingEarnings: 0,
    totalEarnings: 0,
  },
  trend: [],
  history: [],
};

const PERIOD_OPTIONS = [
  { value: "month", label: "This month" },
  { value: "last", label: "Last month" },
  { value: "year", label: "This year" },
];

const STATUS_STYLE = {
  confirmed: "bg-[#d1f0c4] text-[#2a6310]",
  completed: "bg-[#e8ecd8] text-[#3d5028]",
  pending: "bg-[#fef3c7] text-[#92400e]",
  cancelled: "bg-[#fee2e2] text-[#991b1b]",
};

const formatCurrency = (value = 0) => `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;

const formatShortDate = (value) =>
  new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const csvEscape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

export default function HostEarningsLive() {
  const [period, setPeriod] = useState("month");
  const [earningsData, setEarningsData] = useState(EMPTY_EARNINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    const fetchEarnings = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await axios.get("/booking/host/earnings", {
          params: { period },
        });

        if (!ignore) {
          setEarningsData(res.data?.data || EMPTY_EARNINGS);
        }
      } catch (fetchError) {
        if (!ignore) {
          setEarningsData(EMPTY_EARNINGS);
          setError(fetchError.response?.data?.message || "Failed to load earnings");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    fetchEarnings();

    return () => {
      ignore = true;
    };
  }, [period]);

  const summary = earningsData.summary || EMPTY_EARNINGS.summary;
  const trend = earningsData.trend || [];
  const history = earningsData.history || [];
  const maxTrendValue = Math.max(...trend.map((item) => item.value || 0), 1);

  const handleDownloadCsv = () => {
    if (!history.length) return;

    const header = [
      "Date",
      "Property",
      "Guest",
      "Nights",
      "Booked Amount",
      "Paid Amount",
      "Booking Status",
      "Payment Status",
    ];

    const rows = history.map((item) => [
      formatShortDate(item.createdAt),
      item.property?.title || "Untitled property",
      item.guest?.name || "Unknown guest",
      item.nights,
      item.totalPrice || 0,
      item.paidAmount || 0,
      item.status || "",
      item.paymentStatus || "",
    ]);

    const csv = [
      header.map(csvEscape).join(","),
      ...rows.map((row) => row.map(csvEscape).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `host-earnings-${period}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#f5f3ec] p-6">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[18px] font-medium text-[#2d3a1e]">Earnings</h1>
          <p className="mt-0.5 text-[12px] text-[#9a9476]">
            Live revenue from your host bookings.
          </p>
        </div>

        <select
          value={period}
          onChange={(event) => setPeriod(event.target.value)}
          className="h-[32px] cursor-pointer appearance-none rounded-[7px] border border-[#d6cebc] bg-white px-3 pr-8 text-[12px] text-[#3d5028] outline-none focus:border-[#6b8c3e]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%239a9476' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E\")",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 8px center",
          }}
        >
          {PERIOD_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mb-5 flex items-start gap-3 rounded-[10px] border border-[#f4c7c3] bg-[#fff5f4] px-4 py-3 text-[12px] text-[#a1433f]">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-3">
        {[
          {
            label: summary.periodLabel,
            value: formatCurrency(summary.periodEarnings),
            icon: TrendingUp,
            note: "Confirmed and completed bookings",
            noteColor: "#6b8c3e",
          },
          {
            label: "Pending revenue",
            value: formatCurrency(summary.pendingEarnings),
            icon: Clock,
            note: "Bookings awaiting confirmation",
            noteColor: "#b45309",
          },
          {
            label: "Total earnings",
            value: formatCurrency(summary.totalEarnings),
            icon: DollarSign,
            note: "All confirmed and completed revenue",
            noteColor: "#6b8c3e",
          },
        ].map((stat) => (
          <div key={stat.label} className="rounded-[10px] border border-[#e0dbd0] bg-white p-4">
            <p className="mb-2 text-[11px] text-[#9a9476]">{stat.label}</p>
            <div className="mb-1.5 flex items-end justify-between">
              <span className="text-[20px] font-medium leading-none text-[#2d3a1e]">
                {loading ? "Loading..." : stat.value}
              </span>
              <div className="flex h-[30px] w-[30px] items-center justify-center rounded-[7px] bg-[#f0f0e4]">
                <stat.icon className="h-3.5 w-3.5 text-[#6b8c3e]" />
              </div>
            </div>
            <p className="text-[11px]" style={{ color: stat.noteColor }}>
              {stat.note}
            </p>
          </div>
        ))}
      </div>

      <div className="mb-4 rounded-[12px] border border-[#e0dbd0] bg-white p-5">
        <p className="mb-1 text-[13px] font-medium text-[#2d3a1e]">Revenue trend</p>
        <p className="mb-4 text-[11px] text-[#9a9476]">
          {summary.period === "year" ? "Month-by-month view for this year" : "Rolling six-month view"}
        </p>

        {loading ? (
          <div className="flex h-[120px] items-center justify-center text-[12px] text-[#9a9476]">
            Loading chart...
          </div>
        ) : trend.length === 0 ? (
          <div className="flex h-[120px] items-center justify-center text-[12px] text-[#9a9476]">
            No earnings trend available for this period.
          </div>
        ) : (
          <div className="flex items-end gap-2" style={{ height: 120 }}>
            {trend.map((item, index) => (
              <div
                key={`${item.label}-${index}`}
                className="flex h-full flex-1 flex-col items-center justify-end gap-1.5"
              >
                <div
                  className="w-full cursor-pointer rounded-t-[4px] transition-all"
                  style={{
                    height: `${Math.max((item.value / maxTrendValue) * 100, 4)}%`,
                    background: index === trend.length - 1 ? "#6b8c3e" : "#e8ecd8",
                  }}
                  title={formatCurrency(item.value)}
                />
                <span className="text-[9px] text-[#b0a890]">{item.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-[12px] border border-[#e0dbd0] bg-white">
        <div className="flex items-center justify-between gap-3 border-b border-[#ece8de] px-4 py-3.5">
          <span className="text-[13px] font-medium text-[#2d3a1e]">Earnings history</span>
          <button
            type="button"
            onClick={handleDownloadCsv}
            disabled={!history.length}
            className="inline-flex items-center gap-2 rounded-[6px] border border-[#c5c9a0] bg-[#f5f3ec] px-2.5 py-1 text-[11px] text-[#6b8c3e] transition-colors hover:bg-[#e8ecd8] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            Download CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#faf9f4]">
                <th className="border-b border-[#ece8de] px-4 py-2.5 text-left text-[11px] font-medium text-[#9a9476]">Date</th>
                <th className="border-b border-[#ece8de] px-4 py-2.5 text-left text-[11px] font-medium text-[#9a9476]">Property</th>
                <th className="border-b border-[#ece8de] px-4 py-2.5 text-left text-[11px] font-medium text-[#9a9476]">Guest</th>
                <th className="border-b border-[#ece8de] px-4 py-2.5 text-left text-[11px] font-medium text-[#9a9476]">Nights</th>
                <th className="border-b border-[#ece8de] px-4 py-2.5 text-left text-[11px] font-medium text-[#9a9476]">Booked</th>
                <th className="border-b border-[#ece8de] px-4 py-2.5 text-left text-[11px] font-medium text-[#9a9476]">Paid</th>
                <th className="border-b border-[#ece8de] px-4 py-2.5 text-left text-[11px] font-medium text-[#9a9476]">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-[12px] text-[#9a9476]">
                    Loading earnings history...
                  </td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-[12px] text-[#9a9476]">
                    No earnings records found for {summary.periodLabel.toLowerCase()}.
                  </td>
                </tr>
              ) : (
                history.map((booking) => (
                  <tr key={booking._id} className="transition-colors hover:bg-[#faf9f4]">
                    <td className="border-b border-[#f5f3ec] px-4 py-2.5 text-[12px] text-[#6b7a50]">
                      {formatShortDate(booking.createdAt)}
                    </td>
                    <td className="border-b border-[#f5f3ec] px-4 py-2.5 text-[12px] text-[#6b7a50]">
                      {booking.property?.title || "Untitled property"}
                    </td>
                    <td className="border-b border-[#f5f3ec] px-4 py-2.5 text-[12px] font-medium text-[#2d3a1e]">
                      {booking.guest?.name || "Unknown guest"}
                    </td>
                    <td className="border-b border-[#f5f3ec] px-4 py-2.5 text-[12px] text-[#6b7a50]">
                      {booking.nights}
                    </td>
                    <td className="border-b border-[#f5f3ec] px-4 py-2.5 text-[12px] font-medium text-[#2d3a1e]">
                      {formatCurrency(booking.totalPrice)}
                    </td>
                    <td className="border-b border-[#f5f3ec] px-4 py-2.5 text-[12px] text-[#6b7a50]">
                      {formatCurrency(booking.paidAmount)}
                    </td>
                    <td className="border-b border-[#f5f3ec] px-4 py-2.5">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          STATUS_STYLE[booking.status] || "bg-[#e8ecd8] text-[#3d5028]"
                        }`}
                      >
                        {booking.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
