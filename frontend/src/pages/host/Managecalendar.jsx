import { useEffect, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAYS = ["Su","Mo","Tu","We","Th","Fr","Sa"];

export default function ManageCalendar() {
  const [properties, setProperties]             = useState([]);
  const [bookings, setBookings]                 = useState([]);
  const [selectedProperty, setSelectedProperty] = useState("");
  const [currentDate, setCurrentDate]           = useState(new Date());
  const [mode, setMode]                         = useState("select");
  const [saving, setSaving]                     = useState(false);

  const [blockedDates, setBlockedDates]         = useState({});
  const [customPrices, setCustomPrices]         = useState({});
  const [minStays, setMinStays]                 = useState({});

  const [selectedDays, setSelectedDays]         = useState(new Set());
  const [customPriceInput, setCustomPriceInput] = useState("");
  const [minStayInput, setMinStayInput]         = useState("");
  const [bulkFrom, setBulkFrom]                 = useState("");
  const [bulkTo, setBulkTo]                     = useState("");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // ── Fetch properties + bookings, hydrate blockedDates from DB ────
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pRes, bRes] = await Promise.all([
          axios.get("/property/host"),
          axios.get("/booking/host"),
        ]);
        const props = pRes.data.data || [];
        setProperties(props);
        if (props.length > 0) setSelectedProperty(props[0]._id);
        setBookings(bRes.data.data || []);

        const blockedMap = {};
        props.forEach((p) => {
          const s = new Set();
          (p.blockedDates || []).forEach((isoStr) => {
            const d = new Date(isoStr);
            s.add(dateKey(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
          });
          blockedMap[p._id] = s;
        });
        setBlockedDates(blockedMap);
      } catch (error) {
        console.log(error);
      }
    };
    fetchData();
  }, []);

  const year        = currentDate.getFullYear();
  const month       = currentDate.getMonth();
  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const dateKey = (y, m, d) => `${y}-${m}-${d}`;

  const dateKeyToISO = (key) => {
    const [y, m, d] = key.split("-").map(Number);
    return new Date(Date.UTC(y, m, d, 12, 0, 0)).toISOString();
  };

  // ── Save blocked dates to DB ──────────────────────────────────────
  const saveBlockedDates = useCallback(async (propertyId, newSet) => {
    if (!propertyId) return;
    setSaving(true);
    try {
      await axios.patch(`/property/${propertyId}/blocked-dates`, {
        blockedDates: [...newSet].map(dateKeyToISO),
      });
    } catch (err) {
      toast.error("Failed to save — check your connection");
    } finally {
      setSaving(false);
    }
  }, []);

  // ── Build booked set for selected property ────────────────────────
  const bookedSet = new Set();
  bookings
    .filter((b) => b.property?._id === selectedProperty && b.status !== "cancelled")
    .forEach((b) => {
      const ci = new Date(b.checkIn);
      const co = new Date(b.checkOut);
      for (let d = new Date(ci); d <= co; d.setDate(d.getDate() + 1)) {
        if (d.getMonth() === month && d.getFullYear() === year) {
          bookedSet.add(dateKey(year, month, d.getDate()));
        }
      }
    });

  const propBlocked  = blockedDates[selectedProperty] || new Set();
  const propPrices   = customPrices[selectedProperty]  || {};
  const propMinStays = minStays[selectedProperty]      || {};

  const toggleDay = (day) => {
    if (mode !== "select") return;
    const cellDate = new Date(year, month, day);
    cellDate.setHours(0, 0, 0, 0);
    if (cellDate < today) return;
    const key = dateKey(year, month, day);
    if (bookedSet.has(key)) return;
    setSelectedDays((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const getDayStyle = (day) => {
    const cellDate = new Date(year, month, day);
    cellDate.setHours(0, 0, 0, 0);
    const key      = dateKey(year, month, day);
    const isToday  = cellDate.getTime() === today.getTime();
    const isPast   = cellDate < today && !isToday;
    const isBooked = bookedSet.has(key);
    const isBlocked = propBlocked.has(key);
    const isSel    = selectedDays.has(key);

    if (isToday)   return { bg: "#4e7c2a", text: "#fff",     border: "transparent", cursor: "default" };
    if (isBooked)  return { bg: "#eaf0f8", text: "#5a7aaa",  border: "#c0d0e8",     cursor: "default",   strike: true };
    if (isBlocked) return { bg: "#fdf6ee", text: "#c8a870",  border: "#e8d8b8",     cursor: "pointer",   strike: true };
    if (isSel)     return { bg: "#dff0c8", text: "#1c3a08",  border: "#4e7c2a",     cursor: "pointer" };
    if (isPast)    return { bg: "transparent", text: "#c8ccc0", border: "transparent", cursor: "default" };
    return         { bg: "transparent", text: "#2d4a14",    border: "transparent", cursor: "pointer", hover: true };
  };

  const applySettings = () => {
    if (selectedDays.size === 0) return;
    if (customPriceInput) {
      setCustomPrices((prev) => {
        const map = { ...(prev[selectedProperty] || {}) };
        selectedDays.forEach((k) => { map[k] = parseInt(customPriceInput); });
        return { ...prev, [selectedProperty]: map };
      });
    }
    if (minStayInput) {
      setMinStays((prev) => {
        const map = { ...(prev[selectedProperty] || {}) };
        selectedDays.forEach((k) => { map[k] = parseInt(minStayInput); });
        return { ...prev, [selectedProperty]: map };
      });
    }
    toast.success("Settings applied");
    setCustomPriceInput("");
    setMinStayInput("");
    setSelectedDays(new Set());
  };

  const blockSelected = () => {
    if (selectedDays.size === 0 || !selectedProperty) return;
    const current = blockedDates[selectedProperty] || new Set();
    const s = new Set(current);
    selectedDays.forEach((k) => s.add(k));
    setBlockedDates((prev) => ({ ...prev, [selectedProperty]: s }));
    setSelectedDays(new Set());
    saveBlockedDates(selectedProperty, s);
    toast.success("Dates blocked");
  };

  const unblockSelected = () => {
    if (selectedDays.size === 0 || !selectedProperty) return;
    const current = blockedDates[selectedProperty] || new Set();
    const s = new Set(current);
    selectedDays.forEach((k) => s.delete(k));
    setBlockedDates((prev) => ({ ...prev, [selectedProperty]: s }));
    setSelectedDays(new Set());
    saveBlockedDates(selectedProperty, s);
    toast.success("Dates unblocked");
  };

  const bulkBlock = (shouldBlock) => {
    if (!bulkFrom || !bulkTo)  { toast.error("Select both dates"); return; }
    if (!selectedProperty)     { toast.error("No property selected"); return; }
    const from = new Date(bulkFrom);
    const to   = new Date(bulkTo);
    if (from > to) { toast.error("From must be before To"); return; }
    const current = blockedDates[selectedProperty] || new Set();
    const s = new Set(current);
    for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
      const k = dateKey(d.getFullYear(), d.getMonth(), d.getDate());
      shouldBlock ? s.add(k) : s.delete(k);
    }
    setBlockedDates((prev) => ({ ...prev, [selectedProperty]: s }));
    saveBlockedDates(selectedProperty, s);
    toast.success(shouldBlock ? "Range blocked" : "Range unblocked");
    setBulkFrom(""); setBulkTo("");
  };

  const upcoming = bookings
    .filter((b) => {
      const ci = new Date(b.checkIn);
      return b.property?._id === selectedProperty && b.status !== "cancelled" && ci >= today;
    })
    .sort((a, b) => new Date(a.checkIn) - new Date(b.checkIn))
    .slice(0, 4);

  const selectedProp = properties.find((p) => p._id === selectedProperty);
  const totalBlocked = (blockedDates[selectedProperty] || new Set()).size;

  return (
    <div className="min-h-screen p-5" style={{ background: "#f4f6f0" }}>

      {/* ── Page header ──────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 500, color: "#1c2a10" }}>Manage calendar</h1>
          <p style={{ fontSize: 12, color: "#7a8f5a", marginTop: 2 }}>Block dates · Set prices · Track check-ins</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Property selector */}
          <div className="relative">
            <select
              value={selectedProperty}
              onChange={(e) => { setSelectedProperty(e.target.value); setSelectedDays(new Set()); }}
              className="appearance-none pl-7 pr-8 h-8 rounded-full text-xs font-medium outline-none cursor-pointer"
              style={{ background: "#fff", border: "1px solid #d4ddc4", color: "#2d4a14" }}
            >
              {properties.map((p) => (
                <option key={p._id} value={p._id}>{p.title}</option>
              ))}
            </select>
            {/* green dot */}
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full" style={{ background: "#4e7c2a" }} />
            <ChevronRight className="absolute right-2.5 top-1/2 -translate-y-1/2 rotate-90 w-3 h-3" style={{ color: "#7a8f5a" }} />
          </div>

          {/* Mode toggle */}
          <div className="flex rounded-full p-0.5" style={{ background: "#e5ead8" }}>
            {[{ key: "select", label: "Select dates" }, { key: "bulk", label: "Bulk block" }].map((m) => (
              <button
                key={m.key}
                onClick={() => { setMode(m.key); setSelectedDays(new Set()); }}
                className="px-3 h-7 rounded-full text-xs font-medium transition-all"
                style={mode === m.key
                  ? { background: "#fff", color: "#2d4a14" }
                  : { background: "transparent", color: "#7a8f5a" }}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Saving indicator */}
          {saving && (
            <span className="flex items-center gap-1.5 text-xs" style={{ color: "#7a8f5a" }}>
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#4e7c2a" }} />
              Saving…
            </span>
          )}
        </div>
      </div>

      {/* ── Main grid ────────────────────────────────────────── */}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">

        {/* Calendar card */}
        <div className="rounded-2xl p-5" style={{ background: "#fff", border: "1px solid #dde5cc" }}>

          {/* Month nav */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => { setCurrentDate(new Date(year, month - 1, 1)); setSelectedDays(new Set()); }}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
              style={{ border: "1px solid #dde5cc", background: "#fff", color: "#5a7a30" }}
              onMouseEnter={e => e.currentTarget.style.background="#f0f5e8"}
              onMouseLeave={e => e.currentTarget.style.background="#fff"}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span style={{ fontSize: 15, fontWeight: 500, color: "#1c2a10" }}>{MONTHS[month]} {year}</span>
            <button
              onClick={() => { setCurrentDate(new Date(year, month + 1, 1)); setSelectedDays(new Set()); }}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
              style={{ border: "1px solid #dde5cc", background: "#fff", color: "#5a7a30" }}
              onMouseEnter={e => e.currentTarget.style.background="#f0f5e8"}
              onMouseLeave={e => e.currentTarget.style.background="#fff"}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Day names */}
          <div className="grid grid-cols-7 mb-1.5">
            {DAYS.map((d) => (
              <div key={d} className="text-center py-1" style={{ fontSize: 10, color: "#a0b070", fontWeight: 500 }}>{d}</div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: firstDay }, (_, i) => (
              <div
                key={`e-${i}`}
                className="min-h-[88px] rounded-xl"
                style={{ background: "#fafbf7", border: "1px dashed #eef2e8" }}
              />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day   = i + 1;
              const key   = dateKey(year, month, day);
              const style = getDayStyle(day);
              const price    = propPrices[key];
              const minStay  = propMinStays[key];
              const cellDate = new Date(year, month, day);
              cellDate.setHours(0, 0, 0, 0);
              const isToday = cellDate.getTime() === today.getTime();
              const isBooked = bookedSet.has(key);
              const isBlocked = propBlocked.has(key);
              return (
                <div
                  key={day}
                  onClick={() => toggleDay(day)}
                  className="min-h-[88px] rounded-xl flex flex-col justify-between p-3 transition-all"
                  style={{
                    cursor: style.cursor,
                    background: style.bg,
                    color: style.text,
                    border: `1.5px solid ${style.border}`,
                    textDecoration: style.strike ? "line-through" : "none",
                  }}
                  onMouseEnter={e => { if (style.hover) e.currentTarget.style.background="#f0f5e8"; }}
                  onMouseLeave={e => { if (style.hover) e.currentTarget.style.background="transparent"; }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{day}</span>
                    {isToday && (
                      <span
                        className="rounded-full px-2 py-0.5"
                        style={{ fontSize: 9, background: "rgba(255,255,255,0.18)", color: "#fff" }}
                      >
                        Today
                      </span>
                    )}
                  </div>
                  <div className="mt-auto flex flex-col gap-1">
                    {price && !isBooked && !isBlocked && (
                      <span
                        className="inline-flex w-fit rounded-full px-2 py-1"
                        style={{ fontSize: 9, color: "#2d6010", background: "#eaf5d8", lineHeight: 1 }}
                      >
                        ₹{(price/1000).toFixed(1)}k
                      </span>
                    )}
                    {minStay && !isBooked && !isBlocked && (
                      <span style={{ fontSize: 9, color: "#7a8f5a", lineHeight: 1.1 }}>{minStay} night minimum</span>
                    )}
                    {isBooked && (
                      <span style={{ fontSize: 9, color: "#5a7aaa", lineHeight: 1.1 }}>Reserved</span>
                    )}
                    {isBlocked && (
                      <span style={{ fontSize: 9, color: "#b07a35", lineHeight: 1.1 }}>Blocked</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex gap-4 mt-4 pt-3 flex-wrap" style={{ borderTop: "1px solid #eef2e8" }}>
            {[
              { bg: "#4e7c2a", label: "Today" },
              { bg: "#eaf0f8", border: "#c0d0e8", label: "Booked" },
              { bg: "#fdf6ee", border: "#e8d8b8", label: "Blocked" },
              { bg: "#dff0c8", border: "#4e7c2a", label: "Selected" },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-1.5" style={{ fontSize: 10, color: "#7a8f5a" }}>
                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: l.bg, border: l.border ? `1px solid ${l.border}` : "none" }} />
                {l.label}
              </div>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div className="flex flex-col gap-3">

          {/* Stats row */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { n: totalBlocked, label: "Blocked days" },
              { n: upcoming.length, label: "Upcoming" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: "#fff", border: "1px solid #dde5cc" }}>
                <div style={{ fontSize: 22, fontWeight: 500, color: "#1c2a10" }}>{s.n}</div>
                <div style={{ fontSize: 10, color: "#7a8f5a", marginTop: 1 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Select mode panel */}
          {mode === "select" && (
            <div className="rounded-2xl p-4" style={{ background: "#fff", border: "1px solid #dde5cc" }}>
              <p style={{ fontSize: 13, fontWeight: 500, color: "#1c2a10", marginBottom: 10 }}>
                {selectedDays.size > 0
                  ? `${selectedDays.size} date${selectedDays.size > 1 ? "s" : ""} selected`
                  : "Select dates to manage"}
              </p>

              {selectedDays.size === 0 ? (
                <div className="rounded-lg p-2.5" style={{ background: "#f4f6f0", fontSize: 11, color: "#5a7050", lineHeight: 1.6 }}>
                  Click any available date on the calendar to select it.
                </div>
              ) : (
                <>
                  <div className="rounded-lg p-2.5 mb-3" style={{ background: "#f4f6f0", fontSize: 11, color: "#5a7050", lineHeight: 1.6 }}>
                    {[...selectedDays].sort().map((k) => {
                      const [, m, d] = k.split("-");
                      return `${d} ${MONTHS[parseInt(m)].slice(0, 3)}`;
                    }).join(", ")}
                  </div>

                  {/* Custom price & min stay */}
                  <div className="space-y-2 mb-3">
                    <div>
                      <label style={{ display: "block", fontSize: 10, color: "#7a8f5a", fontWeight: 500, marginBottom: 3 }}>Custom price / night (₹)</label>
                      <input
                        type="number" placeholder="e.g. 5500" min="0"
                        value={customPriceInput}
                        onChange={(e) => setCustomPriceInput(e.target.value)}
                        className="w-full rounded-lg px-2.5 outline-none"
                        style={{ height: 34, border: "1px solid #dde5cc", background: "#f8faf4", fontSize: 11, color: "#1c2a10" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 10, color: "#7a8f5a", fontWeight: 500, marginBottom: 3 }}>Min stay (nights)</label>
                      <input
                        type="number" placeholder="e.g. 2" min="1"
                        value={minStayInput}
                        onChange={(e) => setMinStayInput(e.target.value)}
                        className="w-full rounded-lg px-2.5 outline-none"
                        style={{ height: 34, border: "1px solid #dde5cc", background: "#f8faf4", fontSize: 11, color: "#1c2a10" }}
                      />
                    </div>
                    <button
                      onClick={applySettings}
                      className="w-full rounded-lg font-medium transition-colors"
                      style={{ height: 34, background: "#4e7c2a", color: "#fff", fontSize: 12, border: "none", cursor: "pointer" }}
                    >
                      Apply settings
                    </button>
                  </div>

                  {/* Block / Unblock */}
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <button
                      onClick={blockSelected}
                      disabled={saving}
                      className="rounded-lg font-medium transition-colors"
                      style={{ height: 32, background: "#fff0f0", color: "#b04040", border: "1px solid #f0c8c8", fontSize: 11, cursor: "pointer" }}
                    >
                      Block dates
                    </button>
                    <button
                      onClick={unblockSelected}
                      disabled={saving}
                      className="rounded-lg font-medium transition-colors"
                      style={{ height: 32, background: "#eaf5d8", color: "#2d6010", border: "1px solid #c0dc98", fontSize: 11, cursor: "pointer" }}
                    >
                      Unblock
                    </button>
                  </div>

                  <button
                    onClick={() => setSelectedDays(new Set())}
                    className="w-full transition-colors"
                    style={{ height: 28, fontSize: 11, color: "#7a8f5a", border: "none", background: "none", cursor: "pointer" }}
                  >
                    Clear selection
                  </button>
                </>
              )}
            </div>
          )}

          {/* Bulk block panel */}
          {mode === "bulk" && (
            <div className="rounded-2xl p-4" style={{ background: "#fff", border: "1px solid #dde5cc" }}>
              <p style={{ fontSize: 13, fontWeight: 500, color: "#1c2a10", marginBottom: 12 }}>Block a date range</p>
              <div className="space-y-2 mb-3">
                {[
                  { label: "From date", val: bulkFrom, set: setBulkFrom },
                  { label: "To date",   val: bulkTo,   set: setBulkTo },
                ].map((f) => (
                  <div key={f.label}>
                    <label style={{ display: "block", fontSize: 10, color: "#7a8f5a", fontWeight: 500, marginBottom: 3 }}>{f.label}</label>
                    <input
                      type="date" value={f.val}
                      onChange={(e) => f.set(e.target.value)}
                      className="w-full rounded-lg px-2.5 outline-none"
                      style={{ height: 34, border: "1px solid #dde5cc", background: "#f8faf4", fontSize: 11, color: "#1c2a10" }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-1.5">
                <button
                  onClick={() => bulkBlock(true)}
                  disabled={saving}
                  className="w-full rounded-lg font-medium"
                  style={{ height: 34, background: "#fff0f0", color: "#b04040", border: "1px solid #f0c8c8", fontSize: 12, cursor: "pointer" }}
                >
                  Block date range
                </button>
                <button
                  onClick={() => bulkBlock(false)}
                  disabled={saving}
                  className="w-full rounded-lg font-medium"
                  style={{ height: 34, background: "#eaf5d8", color: "#2d6010", border: "1px solid #c0dc98", fontSize: 12, cursor: "pointer" }}
                >
                  Unblock date range
                </button>
              </div>
            </div>
          )}

          {/* Upcoming check-ins */}
          <div className="rounded-2xl p-4" style={{ background: "#fff", border: "1px solid #dde5cc" }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: "#1c2a10", marginBottom: 12 }}>Upcoming check-ins</p>
            {upcoming.length === 0 ? (
              <p className="text-center py-4" style={{ fontSize: 11, color: "#7a8f5a" }}>No upcoming check-ins</p>
            ) : (
              <div className="flex flex-col gap-2">
                {upcoming.map((booking, i) => {
                  const ci     = new Date(booking.checkIn);
                  const nights = Math.ceil((new Date(booking.checkOut) - ci) / 86400000);
                  return (
                    <div key={booking._id} className="flex items-center gap-2.5 rounded-lg p-2" style={{ background: "#f8faf4" }}>
                      {/* Date bubble */}
                      <div className="rounded-lg flex flex-col items-center justify-center shrink-0" style={{ width: 36, height: 36, background: "#eaf5d8" }}>
                        <span style={{ fontSize: 14, fontWeight: 500, color: "#2d6010", lineHeight: 1 }}>{ci.getDate()}</span>
                        <span style={{ fontSize: 8, color: "#5a9030", textTransform: "uppercase" }}>{MONTHS[ci.getMonth()].slice(0, 3)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p style={{ fontSize: 11, fontWeight: 500, color: "#1c2a10" }} className="truncate">{booking.guest?.name || "Guest"}</p>
                        <p style={{ fontSize: 10, color: "#7a8f5a" }} className="truncate">{booking.property?.title}</p>
                        <p style={{ fontSize: 10, color: "#4e7c2a" }}>{nights} night{nights !== 1 ? "s" : ""}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
