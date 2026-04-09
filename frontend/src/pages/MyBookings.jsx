import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";

const STATUS_STYLES = {
  confirmed: { background: "#e8f5e8", color: "#2d6a2d" },
  completed: { background: "#e8eef5", color: "#2d5a8a" },
  cancelled: { background: "#fde8e8", color: "#8a2d2d" },
};

const TABS = ["upcoming", "completed", "cancelled"];

export default function MyBookings() {
  const [activeTab, setActiveTab]   = useState("upcoming");
  const [bookings, setBookings]     = useState({ upcoming: [], completed: [], cancelled: [] });
  const [loading, setLoading]       = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  useEffect(() => {
    api.getMyBookings()
      .then((res) => {
        if (res.success) {
          const upcoming  = res.data.filter(b => b.status === "confirmed");
          const completed = res.data.filter(b => b.status === "completed");
          const cancelled = res.data.filter(b => b.status === "cancelled");
          setBookings({ upcoming, completed, cancelled });
        } else {
          setIsLoggedIn(false);
        }
      })
      .catch(() => setIsLoggedIn(false))
      .finally(() => setLoading(false));
  }, []);

  if (!isLoggedIn) {
    return (
      <div style={{ minHeight: "100vh", background: "#f5f3ec", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ background: "white", border: "1px solid #e0dbd0", borderRadius: 14, padding: 32, textAlign: "center", maxWidth: 360 }}>
          <p style={{ fontSize: 16, fontWeight: 600, color: "#2d3a1e", marginBottom: 8 }}>Please login first</p>
          <p style={{ fontSize: 13, color: "#9a9476", marginBottom: 20 }}>Login or signup to view your bookings</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <Link to="/login"  style={{ padding: "8px 20px", border: "1px solid #d6cebc", borderRadius: 8, fontSize: 13, color: "#3d5028", textDecoration: "none" }}>Login</Link>
            <Link to="/signup" style={{ padding: "8px 20px", background: "#6b8c3e", borderRadius: 8, fontSize: 13, color: "white", textDecoration: "none" }}>Sign up</Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#f5f3ec", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontSize: 14, color: "#5a7050", fontWeight: 600 }}>Loading bookings...</p>
      </div>
    );
  }

  const currentBookings = bookings[activeTab];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.h1}>My Bookings</h1>
        <p style={styles.subtitle}>View and manage all your reservations</p>
      </div>

      {/* Tabs */}
      <div style={styles.tabsWrapper}>
        {TABS.map((tab) => (
          <button
            key={tab}
            style={{ ...styles.tabBtn, ...(activeTab === tab ? styles.tabBtnActive : {}) }}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            <span style={{ ...styles.tabCount, ...(activeTab === tab ? styles.tabCountActive : {}) }}>
              {bookings[tab].length}
            </span>
          </button>
        ))}
      </div>

      {/* Booking Cards */}
      <div>
        {currentBookings.length === 0 ? (
          <div style={styles.empty}>
            <span style={{ fontSize: 40 }}>📋</span>
            <p style={styles.emptyText}>No {activeTab} bookings</p>
          </div>
        ) : (
          currentBookings.map((b) => (
            <BookingCard key={b._id} booking={b} tab={activeTab} />
          ))
        )}
      </div>
    </div>
  );
}

function BookingCard({ booking: b, tab }) {
  const navigate = useNavigate();
  const statusStyle = STATUS_STYLES[b.status] || {};

  // ── handle both real DB data & fallback display ───────────────
  const title    = b.property?.title    || b.title    || "Property";
  const loc = b.property?.location;
const location = loc ? `${loc.city ?? ""}, ${loc.country ?? ""}` : (b.location || "—");
  const image    = b.property?.images?.[0];

  return (
    <div style={styles.card}>
      {/* Image or emoji fallback */}
      <div style={{ ...styles.cardImg, background: image ? "transparent" : "#dce8f5" }}>
        {image
          ? <img src={image} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 10 }} />
          : <span style={{ fontSize: 36 }}>🏠</span>
        }
      </div>

      <div style={styles.cardInfo}>
        <h3 style={styles.cardTitle}>{title}</h3>
        <p style={styles.cardLocation}>📍 {location}</p>

        <div style={styles.datesRow}>
          <DateItem label="Check-in"  value={new Date(b.checkIn).toLocaleDateString("en-IN",  { day: "numeric", month: "short", year: "numeric" })} />
          <DateItem label="Check-out" value={new Date(b.checkOut).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} />
          <DateItem label="Guests"    value={b.guestsCount || b.guests || 1} />
        </div>

        <div style={styles.cardMeta}>
          <div style={styles.metaLeft}>
            <span style={{ ...styles.statusBadge, ...statusStyle }}>
              {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
            </span>
            <span style={styles.totalPrice}>₹{b.totalPrice?.toLocaleString()} total</span>
          </div>

          <div style={styles.actions}>
            {tab === "upcoming" && (
              <>
                <button
                  style={styles.btnOutline}
                  onClick={() =>
                    navigate(`/messages?userId=${b.host?._id}${b.property?._id ? `&propertyId=${b.property._id}` : ""}`)
                  }
                >
                  Message Host
                </button>
                <button style={styles.btnOutline}>Cancel</button>
                <button style={styles.btnPrimary}>View Details</button>
              </>
            )}
            {tab === "completed" && (
              <>
                <button style={styles.btnOutline}>Book Again</button>
                <button style={styles.btnPrimary}>Leave Review</button>
              </>
            )}
            {tab === "cancelled" && (
              <button style={styles.btnPrimary}>View Details</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DateItem({ label, value }) {
  return (
    <div>
      <span style={styles.dateLabel}>{label}</span>
      <span style={styles.dateValue}>{value}</span>
    </div>
  );
}

const styles = {
  container:      { padding: "32px 28px", maxWidth: 1200, margin: "0 auto" },
  header:         { marginBottom: 28 },
  h1:             { fontSize: 26, fontWeight: 700, color: "#1a1a1a" },
  subtitle:       { color: "#6b6b60", fontSize: 14, marginTop: 4 },
  tabsWrapper:    { display: "flex", gap: 4, marginBottom: 24, borderBottom: "1.5px solid #e0e0d8" },
  tabBtn:         { padding: "10px 20px", fontSize: 14, fontWeight: 500, color: "#6b6b60", cursor: "pointer", border: "none", background: "none", borderBottom: "2.5px solid transparent", marginBottom: -1.5, display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s" },
  tabBtnActive:   { color: "#2d6a2d", borderBottomColor: "#2d6a2d", fontWeight: 600 },
  tabCount:       { background: "#e0e0d8", color: "#6b6b60", fontSize: 11, fontWeight: 600, padding: "1px 7px", borderRadius: 10 },
  tabCountActive: { background: "#e8f5e8", color: "#2d6a2d" },
  empty:          { display: "flex", flexDirection: "column", alignItems: "center", padding: "60px 0", gap: 10, color: "#6b6b60" },
  emptyText:      { fontSize: 15, fontWeight: 600 },
  card:           { background: "#fff", border: "1px solid #e0e0d8", borderRadius: 14, padding: 20, marginBottom: 16, display: "flex", gap: 20, alignItems: "flex-start" },
  cardImg:        { width: 110, height: 90, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" },
  cardInfo:       { flex: 1 },
  cardTitle:      { fontSize: 16, fontWeight: 700, color: "#1a1a1a", marginBottom: 4 },
  cardLocation:   { fontSize: 13, color: "#6b6b60", marginBottom: 10 },
  datesRow:       { display: "flex", gap: 24, marginBottom: 14 },
  dateLabel:      { display: "block", fontSize: 11, color: "#6b6b60", textTransform: "uppercase", letterSpacing: "0.04em" },
  dateValue:      { display: "block", fontSize: 14, fontWeight: 600, color: "#1a1a1a" },
  cardMeta:       { display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 },
  metaLeft:       { display: "flex", alignItems: "center", gap: 12 },
  statusBadge:    { fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 10 },
  totalPrice:     { fontSize: 15, fontWeight: 700, color: "#1a1a1a" },
  actions:        { display: "flex", gap: 8 },
  btnOutline:     { border: "1.5px solid #e0e0d8", background: "none", color: "#1a1a1a", padding: "7px 14px", borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: "pointer" },
  btnPrimary:     { background: "#3a7a3a", color: "white", border: "none", padding: "7px 14px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer" },
};
