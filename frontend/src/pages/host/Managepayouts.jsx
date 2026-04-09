import { useEffect, useState } from "react";
import { DollarSign, TrendingUp, Clock, Plus, X } from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";

export default function HostPayouts() {
  const [bookings, setBookings]               = useState([]);
  const [withdrawAmount, setWithdrawAmount]   = useState("");
  const [selectedBank, setSelectedBank]       = useState(0);
  const [showAddBank, setShowAddBank]         = useState(false);
  const [newBank, setNewBank]                 = useState({ name: "", accountNo: "", ifsc: "" });
  const [banks, setBanks]                     = useState([
    { id: 1, name: "SBI Savings",  masked: "••••4521", primary: true },
    { id: 2, name: "HDFC Savings", masked: "••••8823", primary: false },
  ]);

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

  const paid = bookings.filter((b) => b.status === "completed" || b.status === "confirmed");
  const pending = bookings.filter((b) => b.status === "pending");

  const totalPaid    = paid.reduce((s, b) => s + (b.totalPrice || 0), 0);
  const totalPending = pending.reduce((s, b) => s + (b.totalPrice || 0), 0);

  const now = new Date();
  const available = paid
    .filter((b) => {
      const co = new Date(b.checkOut);
      return co <= now;
    })
    .reduce((s, b) => s + (b.totalPrice || 0), 0);

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) { toast.error("Enter a valid amount"); return; }
    if (amount > available) { toast.error("Amount exceeds available balance"); return; }
    try {
      await axios.post("/payout/withdraw", {
        amount,
        bankId: banks[selectedBank]?.id,
      });
      toast.success(`₹${amount.toLocaleString("en-IN")} withdrawal initiated`);
      setWithdrawAmount("");
    } catch (error) {
      toast.error(error.response?.data?.message || "Withdrawal failed");
    }
  };

  const addBank = () => {
    if (!newBank.name || !newBank.accountNo || !newBank.ifsc) {
      toast.error("Fill all bank details"); return;
    }
    setBanks((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: newBank.name,
        masked: `••••${newBank.accountNo.slice(-4)}`,
        primary: false,
      },
    ]);
    setNewBank({ name: "", accountNo: "", ifsc: "" });
    setShowAddBank(false);
    toast.success("Bank account added");
  };

  const setPrimary = (id) => {
    setBanks((prev) => prev.map((b) => ({ ...b, primary: b.id === id })));
  };

  const statusStyle = {
    confirmed:  "bg-[#d1f0c4] text-[#2a6310]",
    completed:  "bg-[#e8ecd8] text-[#3d5028]",
    pending:    "bg-[#fef3c7] text-[#92400e]",
    cancelled:  "bg-[#fee2e2] text-[#991b1b]",
    processing: "bg-[#e0e8ff] text-[#3730a3]",
  };

  const inputWrap = "flex items-center bg-[#f5f3ec] border border-[#d6cebc] rounded-[7px] px-2.5 h-[34px] focus-within:border-[#6b8c3e] focus-within:bg-white transition-all";
  const innerInput = "bg-transparent border-none outline-none text-[12px] text-[#2d3a1e] w-full placeholder-[#c0baa8]";
  const labelClass = "text-[10px] font-medium text-[#6b7a50]";

  return (
    <div className="min-h-screen bg-[#f5f3ec] p-6">

      {/* Header */}
      <div className="mb-5">
        <h1 className="text-[18px] font-medium text-[#2d3a1e]">Manage payouts</h1>
        <p className="text-[12px] text-[#9a9476] mt-0.5">Track earnings and manage bank details</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: "Available balance", value: `₹${available.toLocaleString("en-IN")}`, icon: DollarSign, sub: "Ready to withdraw", subColor: "#6b8c3e" },
          { label: "Pending", value: `₹${totalPending.toLocaleString("en-IN")}`, icon: Clock, sub: "Awaiting confirmation", subColor: "#b45309" },
          { label: "Total paid out", value: `₹${totalPaid.toLocaleString("en-IN")}`, icon: TrendingUp, sub: "All time", subColor: "#9a9476" },
        ].map((s, i) => (
          <div key={i} className="bg-white border border-[#e0dbd0] rounded-[10px] p-4">
            <p className="text-[11px] text-[#9a9476] mb-2">{s.label}</p>
            <div className="flex items-end justify-between mb-1.5">
              <span className="text-[20px] font-medium text-[#2d3a1e] leading-none">{s.value}</span>
              <div className="w-[28px] h-[28px] rounded-[7px] bg-[#f0f0e4] flex items-center justify-center">
                <s.icon className="w-3.5 h-3.5 text-[#6b8c3e]" />
              </div>
            </div>
            <p className="text-[10px]" style={{ color: s.subColor }}>{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">

        {/* Payout history table */}
        <div className="lg:col-span-2 bg-white border border-[#e0dbd0] rounded-[12px] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#ece8de]">
            <span className="text-[13px] font-medium text-[#2d3a1e]">Payout history</span>
            <button className="text-[10px] text-[#6b8c3e] px-2.5 py-1 border border-[#c5c9a0] rounded-[5px] bg-[#f5f3ec] hover:bg-[#e8ecd8] transition-colors">
              Download CSV
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#faf9f4]">
                  {["Date","Guest","Property","Nights","Amount","Status"].map((h) => (
                    <th key={h} className="text-left text-[10px] font-medium text-[#9a9476] px-4 py-2.5 border-b border-[#ece8de]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => {
                  const nights = Math.ceil(
                    (new Date(b.checkOut) - new Date(b.checkIn)) / 86400000
                  );
                  return (
                    <tr key={b._id} className="hover:bg-[#faf9f4] transition-colors">
                      <td className="px-4 py-2.5 text-[11px] text-[#6b7a50] border-b border-[#f5f3ec]">
                        {new Date(b.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </td>
                      <td className="px-4 py-2.5 text-[11px] font-medium text-[#2d3a1e] border-b border-[#f5f3ec]">{b.guest?.name}</td>
                      <td className="px-4 py-2.5 text-[11px] text-[#6b7a50] border-b border-[#f5f3ec]">{b.property?.title}</td>
                      <td className="px-4 py-2.5 text-[11px] text-[#6b7a50] border-b border-[#f5f3ec]">{nights}</td>
                      <td className="px-4 py-2.5 text-[11px] font-medium text-[#2d3a1e] border-b border-[#f5f3ec]">
                        ₹{b.totalPrice?.toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-2.5 border-b border-[#f5f3ec]">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-medium ${statusStyle[b.status] || statusStyle.pending}`}>
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {bookings.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-[11px] text-[#9a9476]">
                      No payout history yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right side */}
        <div className="flex flex-col gap-3">

          {/* Withdraw card */}
          <div className="bg-white border border-[#e0dbd0] rounded-[12px] p-4">
            <p className="text-[12px] font-medium text-[#2d3a1e] mb-1">Withdraw funds</p>
            <p className="text-[11px] text-[#9a9476] mb-3">Available: <span className="font-medium text-[#2d3a1e]">₹{available.toLocaleString("en-IN")}</span></p>

            <div className="space-y-2 mb-3">
              <div className="flex flex-col gap-1">
                <label className={labelClass}>Amount (₹)</label>
                <div className={inputWrap}>
                  <input
                    className={innerInput}
                    type="number"
                    placeholder="Enter amount"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    max={available}
                    min={1}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className={labelClass}>To account</label>
                <select
                  value={selectedBank}
                  onChange={(e) => setSelectedBank(parseInt(e.target.value))}
                  className="h-[34px] px-2.5 pr-7 border border-[#d6cebc] rounded-[7px] bg-[#f5f3ec] text-[11px] text-[#3d5028] outline-none focus:border-[#6b8c3e] appearance-none cursor-pointer"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%239a9476' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center" }}
                >
                  {banks.map((b, i) => (
                    <option key={b.id} value={i}>
                      {b.name} {b.masked}{b.primary ? " (Primary)" : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleWithdraw}
              className="w-full h-[36px] bg-[#6b8c3e] text-white text-[12px] font-medium rounded-[7px] hover:bg-[#5a7a30] transition-colors"
            >
              Withdraw now
            </button>
          </div>

          {/* Bank accounts card */}
          <div className="bg-white border border-[#e0dbd0] rounded-[12px] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#ece8de]">
              <span className="text-[12px] font-medium text-[#2d3a1e]">Bank accounts</span>
              <button
                onClick={() => setShowAddBank((v) => !v)}
                className="w-6 h-6 rounded-[5px] bg-[#e8ecd8] flex items-center justify-center hover:bg-[#d6e8b8] transition-colors"
              >
                {showAddBank
                  ? <X className="w-3 h-3 text-[#3d5028]" />
                  : <Plus className="w-3 h-3 text-[#3d5028]" />
                }
              </button>
            </div>

            <div className="p-3">
              {banks.map((bank) => (
                <div key={bank.id} className="flex items-center justify-between py-2.5 border-b border-[#f0ece4] last:border-none">
                  <div>
                    <p className="text-[11px] font-medium text-[#2d3a1e]">{bank.name}</p>
                    <p className="text-[10px] text-[#9a9476]">
                      {bank.masked}{bank.primary ? " · Primary" : ""}
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    {!bank.primary && (
                      <button
                        onClick={() => setPrimary(bank.id)}
                        className="text-[10px] text-[#6b8c3e] px-2 py-0.5 border border-[#c5c9a0] rounded-[5px] bg-[#f5f3ec] hover:bg-[#e8ecd8] transition-colors"
                      >
                        Set primary
                      </button>
                    )}
                    <button
                      onClick={() => setBanks((prev) => prev.filter((b) => b.id !== bank.id))}
                      className="text-[10px] text-[#9a9476] px-2 py-0.5 border border-[#e0dbd0] rounded-[5px] hover:text-red-500 hover:border-red-200 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}

              {/* Add bank form */}
              {showAddBank && (
                <div className="mt-2.5 pt-2.5 border-t border-[#f0ece4] space-y-2">
                  <div className="flex flex-col gap-1">
                    <label className={labelClass}>Bank name</label>
                    <div className={inputWrap}>
                      <input className={innerInput} placeholder="e.g. ICICI Savings" value={newBank.name} onChange={(e) => setNewBank({ ...newBank, name: e.target.value })} />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className={labelClass}>Account number</label>
                    <div className={inputWrap}>
                      <input className={innerInput} placeholder="Enter account number" value={newBank.accountNo} onChange={(e) => setNewBank({ ...newBank, accountNo: e.target.value })} />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className={labelClass}>IFSC code</label>
                    <div className={inputWrap}>
                      <input className={innerInput} placeholder="e.g. ICIC0001234" value={newBank.ifsc} onChange={(e) => setNewBank({ ...newBank, ifsc: e.target.value })} />
                    </div>
                  </div>
                  <button
                    onClick={addBank}
                    className="w-full h-[32px] bg-[#6b8c3e] text-white text-[11px] font-medium rounded-[7px] hover:bg-[#5a7a30] transition-colors"
                  >
                    Add bank account
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
