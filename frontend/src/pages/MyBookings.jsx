import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";

const STATUS_STYLES = {
  confirmed: { background: "#e8f5e8", color: "#2d6a2d" },
  completed: { background: "#e8eef5", color: "#2d5a8a" },
  cancelled: { background: "#fde8e8", color: "#8a2d2d" },
};

const TABS = ["upcoming", "completed", "cancelled"];
const FALLBACK_PROPERTY_IMAGE =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 180"><rect width="220" height="180" fill="%23eef2e8"/><path d="M38 128l34-36 24 28 34-40 52 48H38z" fill="%23bfd0b4"/><circle cx="73" cy="63" r="14" fill="%2392af83"/><text x="110" y="158" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="%23576848">Property image</text></svg>';

function getImageSrc(image) {
  if (!image) return "";
  if (typeof image === "string") return image;
  if (typeof image === "object") return image.url || image.secure_url || "";
  return "";
}

function getLocationText(location, fallbackLocation) {
  if (!location || typeof location !== "object") {
    return fallbackLocation || "Location unavailable";
  }

  const parts = [location.city, location.state, location.country].filter(Boolean);
  return parts.length ? parts.join(", ") : (fallbackLocation || "Location unavailable");
}

export default function MyBookings() {
  const [activeTab, setActiveTab] = useState("upcoming");
  const [bookings, setBookings] = useState({ upcoming: [], completed: [], cancelled: [] });
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [updatingBookingId, setUpdatingBookingId] = useState("");

  const hydrateBookings = (allBookings = []) => {
    const upcoming = allBookings.filter((booking) => booking.status === "confirmed");
    const completed = allBookings.filter((booking) => booking.status === "completed");
    const cancelled = allBookings.filter((booking) => booking.status === "cancelled");
    setBookings({ upcoming, completed, cancelled });
  };

  useEffect(() => {
    api.getMyBookings()
      .then((res) => {
        if (res.success) {
          hydrateBookings(res.data);
          return;
        }

        setIsLoggedIn(false);
      })
      .catch(() => setIsLoggedIn(false))
      .finally(() => setLoading(false));
  }, []);

  if (!isLoggedIn) {
    return (
      <div style={styles.pageState}>
        <div style={styles.loginCard}>
          <p style={styles.loginTitle}>Please login first</p>
          <p style={styles.loginSubtitle}>Login or signup to view your bookings</p>
          <div style={styles.loginActions}>
            <Link to="/login" style={styles.loginSecondaryLink}>Login</Link>
            <Link to="/signup" style={styles.loginPrimaryLink}>Sign up</Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={styles.pageState}>
        <p style={styles.loadingText}>Loading bookings...</p>
      </div>
    );
  }

  const currentBookings = bookings[activeTab];

  const handleCancelBooking = async (booking) => {
    if (!booking?._id || updatingBookingId) return;

    const shouldCancel = window.confirm("Cancel this booking?");
    if (!shouldCancel) return;

    setUpdatingBookingId(booking._id);
    try {
      const res = await api.updateBookingStatus(booking._id, "cancelled");
      if (!res?.success) {
        throw new Error("Unable to cancel booking");
      }

      const allBookings = [...bookings.upcoming, ...bookings.completed, ...bookings.cancelled];
      const updatedBookings = allBookings.map((item) =>
        item._id === booking._id ? { ...item, status: "cancelled" } : item
      );

      hydrateBookings(updatedBookings);
      setActiveTab("cancelled");
    } catch {
      window.alert("Failed to cancel booking. Please try again.");
    } finally {
      setUpdatingBookingId("");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.h1}>My Bookings</h1>
        <p style={styles.subtitle}>View and manage all your reservations</p>
      </div>

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

      <div>
        {currentBookings.length === 0 ? (
          <div style={styles.empty}>
            <span style={styles.emptyTitle}>Bookings</span>
            <p style={styles.emptyText}>No {activeTab} bookings</p>
          </div>
        ) : (
          currentBookings.map((booking) => (
            <BookingCard
              key={booking._id}
              booking={booking}
              tab={activeTab}
              onCancel={handleCancelBooking}
              isUpdating={updatingBookingId === booking._id}
            />
          ))
        )}
      </div>
    </div>
  );
}

function BookingCard({ booking, tab, onCancel, isUpdating }) {
  const navigate = useNavigate();
  const statusStyle = STATUS_STYLES[booking.status] || {};
  const title = booking.property?.title || booking.title || "Property";
  const location = getLocationText(booking.property?.location, booking.location);
  const image = getImageSrc(booking.property?.images?.[0]) || FALLBACK_PROPERTY_IMAGE;
  const propertyId = booking.property?._id || booking.property?.id;

  const handleViewDetails = () => {
    if (!propertyId) {
      window.alert("Property details are unavailable for this booking.");
      return;
    }
    navigate(`/property/${propertyId}`);
  };

  return (
    <div style={styles.card}>
      <div style={styles.cardImg}>
        <img
          src={image}
          alt={title}
          style={styles.cardImgTag}
          onError={(event) => {
            if (event.currentTarget.src === FALLBACK_PROPERTY_IMAGE) return;
            event.currentTarget.src = FALLBACK_PROPERTY_IMAGE;
          }}
        />
      </div>

      <div style={styles.cardInfo}>
        <h3 style={styles.cardTitle}>{title}</h3>
        <p style={styles.cardLocation}>Location: {location}</p>

        <div style={styles.datesRow}>
          <DateItem
            label="Check-in"
            value={new Date(booking.checkIn).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          />
          <DateItem
            label="Check-out"
            value={new Date(booking.checkOut).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          />
          <DateItem label="Guests" value={booking.guestsCount || booking.guests || 1} />
        </div>

        <div style={styles.cardMeta}>
          <div style={styles.metaLeft}>
            <span style={{ ...styles.statusBadge, ...statusStyle }}>
              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
            </span>
            <span style={styles.totalPrice}>Rs. {booking.totalPrice?.toLocaleString() || 0} total</span>
          </div>

          <div style={styles.actions}>
            {tab === "upcoming" && (
              <>
                <button
                  style={styles.btnOutline}
                  onClick={() =>
                    navigate(`/messages?userId=${booking.host?._id}${booking.property?._id ? `&propertyId=${booking.property._id}` : ""}`)
                  }
                >
                  Message Host
                </button>
                <button
                  type="button"
                  style={{
                    ...styles.btnOutline,
                    ...(isUpdating ? styles.btnDisabled : {}),
                  }}
                  onClick={() => onCancel?.(booking)}
                  disabled={isUpdating}
                >
                  {isUpdating ? "Cancelling..." : "Cancel"}
                </button>
                <button type="button" style={styles.btnPrimary} onClick={handleViewDetails}>
                  View Details
                </button>
              </>
            )}
            {tab === "completed" && (
              <>
                <button type="button" style={styles.btnOutline} onClick={handleViewDetails}>Book Again</button>
                <button
                  type="button"
                  style={styles.btnPrimary}
                  onClick={() =>
                    navigate(`/messages?userId=${booking.host?._id}${propertyId ? `&propertyId=${propertyId}` : ""}`)
                  }
                >
                  Leave Review
                </button>
              </>
            )}
            {tab === "cancelled" && (
              <button type="button" style={styles.btnPrimary} onClick={handleViewDetails}>View Details</button>
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
  pageState: { minHeight: "100vh", background: "#f5f3ec", display: "flex", alignItems: "center", justifyContent: "center" },
  loginCard: { background: "white", border: "1px solid #e0dbd0", borderRadius: 14, padding: 32, textAlign: "center", maxWidth: 360 },
  loginTitle: { fontSize: 16, fontWeight: 600, color: "#2d3a1e", marginBottom: 8 },
  loginSubtitle: { fontSize: 13, color: "#9a9476", marginBottom: 20 },
  loginActions: { display: "flex", gap: 12, justifyContent: "center" },
  loginSecondaryLink: { padding: "8px 20px", border: "1px solid #d6cebc", borderRadius: 8, fontSize: 13, color: "#3d5028", textDecoration: "none" },
  loginPrimaryLink: { padding: "8px 20px", background: "#6b8c3e", borderRadius: 8, fontSize: 13, color: "white", textDecoration: "none" },
  loadingText: { fontSize: 14, color: "#5a7050", fontWeight: 600 },
  container: { padding: "32px 28px", maxWidth: 1200, margin: "0 auto" },
  header: { marginBottom: 28 },
  h1: { fontSize: 26, fontWeight: 700, color: "#1a1a1a", margin: 0 },
  subtitle: { color: "#6b6b60", fontSize: 14, marginTop: 4 },
  tabsWrapper: { display: "flex", gap: 4, marginBottom: 24, borderBottom: "1.5px solid #e0e0d8", flexWrap: "wrap" },
  tabBtn: { padding: "10px 20px", fontSize: 14, fontWeight: 500, color: "#6b6b60", cursor: "pointer", border: "none", background: "none", borderBottom: "2.5px solid transparent", marginBottom: -1.5, display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s" },
  tabBtnActive: { color: "#2d6a2d", borderBottomColor: "#2d6a2d", fontWeight: 600 },
  tabCount: { background: "#e0e0d8", color: "#6b6b60", fontSize: 11, fontWeight: 600, padding: "1px 7px", borderRadius: 10 },
  tabCountActive: { background: "#e8f5e8", color: "#2d6a2d" },
  empty: { display: "flex", flexDirection: "column", alignItems: "center", padding: "60px 0", gap: 10, color: "#6b6b60" },
  emptyTitle: { fontSize: 20, fontWeight: 700, color: "#6b8c3e" },
  emptyText: { fontSize: 15, fontWeight: 600 },
  card: { background: "#fff", border: "1px solid #e0e0d8", borderRadius: 14, padding: 20, marginBottom: 16, display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" },
  cardImg: { width: 110, height: 90, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden", background: "#eef2e8" },
  cardImgTag: { width: "100%", height: "100%", objectFit: "cover", borderRadius: 10, display: "block" },
  cardInfo: { flex: 1, minWidth: 260 },
  cardTitle: { fontSize: 16, fontWeight: 700, color: "#1a1a1a", marginBottom: 4, marginTop: 0 },
  cardLocation: { fontSize: 13, color: "#6b6b60", marginBottom: 10, marginTop: 0 },
  datesRow: { display: "flex", gap: 24, marginBottom: 14, flexWrap: "wrap" },
  dateLabel: { display: "block", fontSize: 11, color: "#6b6b60", textTransform: "uppercase", letterSpacing: "0.04em" },
  dateValue: { display: "block", fontSize: 14, fontWeight: 600, color: "#1a1a1a" },
  cardMeta: { display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 },
  metaLeft: { display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" },
  statusBadge: { fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 10 },
  totalPrice: { fontSize: 15, fontWeight: 700, color: "#1a1a1a" },
  actions: { display: "flex", gap: 8, flexWrap: "wrap" },
  btnOutline: { border: "1.5px solid #e0e0d8", background: "none", color: "#1a1a1a", padding: "10px 16px", borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: "pointer", minWidth: 104, transition: "all 0.2s ease" },
  btnPrimary: { background: "#3a7a3a", color: "white", border: "none", padding: "10px 16px", borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: "pointer", minWidth: 122, transition: "all 0.2s ease" },
  btnDisabled: { opacity: 0.7, cursor: "not-allowed" },
};
