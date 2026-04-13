import { useEffect, useState, useMemo, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";

const STATUS_STYLES = {
  pending: { background: "#fff3e0", color: "#e65100" },
  confirmed: { background: "#e8f5e8", color: "#2d6a2d" },
  completed: { background: "#e8eef5", color: "#2d5a8a" },
  cancelled: { background: "#fde8e8", color: "#8a2d2d" },
};

const TABS = ["pending", "confirmed", "completed", "cancelled"];
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

export default function HostBookings() {
  const [activeTab, setActiveTab] = useState("pending");
  const [bookings, setBookings] = useState({
    pending: [],
    confirmed: [],
    completed: [],
    cancelled: [],
  });
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [updatingBookingId, setUpdatingBookingId] = useState("");

  // ✅ Define ALL hooks BEFORE any conditional logic
  const hydrateBookings = (allBookings = []) => {
    const pending = allBookings.filter((booking) => booking.status === "pending");
    const confirmed = allBookings.filter((booking) => booking.status === "confirmed");
    const completed = allBookings.filter((booking) => booking.status === "completed");
    const cancelled = allBookings.filter((booking) => booking.status === "cancelled");
    setBookings({ pending, confirmed, completed, cancelled });
  };

  useEffect(() => {
    api
      .getHostBookings()
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

  const handleUpdateBookingStatus = useCallback(async (booking, newStatus) => {
    if (!booking?._id || updatingBookingId) return;

    const confirmMessage =
      newStatus === "cancelled"
        ? "Are you sure you want to cancel this booking?"
        : `Are you sure you want to mark this booking as ${newStatus}?`;

    const shouldUpdate = window.confirm(confirmMessage);
    if (!shouldUpdate) return;

    const oldStatus = booking.status;
    setUpdatingBookingId(booking._id);
    
    // Optimistic update - instantly move booking to new status for responsive UI
    setBookings((prev) => {
      const updated = { ...prev };
      updated[oldStatus] = updated[oldStatus].filter((b) => b._id !== booking._id);
      updated[newStatus] = [...updated[newStatus], { ...booking, status: newStatus }];
      return updated;
    });
    
    // Send API update in background without blocking
    api.updateBookingStatus(booking._id, newStatus)
      .then((res) => {
        // Accept both response formats: with or without success field
        const isSuccess = res?.success === true || (res?.message && res?.data);
        
        if (!isSuccess) {
          console.error("Update failed:", res);
          throw new Error(res?.message || "Unable to update booking");
        }
        console.log("Booking updated successfully:", res.data);
      })
      .catch((error) => {
        console.error("Booking update error:", error);
        // Revert on error
        setBookings((prev) => {
          const updated = { ...prev };
          updated[newStatus] = updated[newStatus].filter((b) => b._id !== booking._id);
          updated[oldStatus] = [...updated[oldStatus], booking];
          return updated;
        });
        window.alert("Failed to update booking. Please try again.");
      })
      .finally(() => {
        setUpdatingBookingId("");
      });
  }, [updatingBookingId]);

  // ✅ NOW do the early returns AFTER all hooks are defined
  if (!isLoggedIn) {
    return (
      <div style={styles.pageState}>
        <div style={styles.loginCard}>
          <p style={styles.loginTitle}>Access Denied</p>
          <p style={styles.loginSubtitle}>You need to be logged in as a host to view bookings</p>
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

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.h1}>Guest Bookings</h1>
        <p style={styles.subtitle}>Manage all guest reservations for your properties</p>
      </div>

      <div style={styles.tabsWrapper}>
        {TABS.map((tab) => (
          <button
            key={tab}
            style={{
              ...styles.tabBtn,
              ...(activeTab === tab ? styles.tabBtnActive : {}),
            }}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            <span
              style={{
                ...styles.tabCount,
                ...(activeTab === tab ? styles.tabCountActive : {}),
              }}
            >
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
            <MemoizedBookingCard
              key={booking._id}
              booking={booking}
              tab={activeTab}
              onUpdateStatus={handleUpdateBookingStatus}
              isUpdating={updatingBookingId === booking._id}
            />
          ))
        )}
      </div>
    </div>
  );
}

function BookingCard({ booking, tab, onUpdateStatus, isUpdating }) {
  const navigate = useNavigate();
  const statusStyle = STATUS_STYLES[booking.status] || {};
  const title = booking.property?.title || booking.title || "Property";
  const location = getLocationText(booking.property?.location, booking.location);
  const image =
    getImageSrc(booking.property?.images?.[0]) || FALLBACK_PROPERTY_IMAGE;
  const propertyId = booking.property?._id || booking.property?.id;
  const guestName = booking.guest?.name || "Guest";
  const guestEmail = booking.guest?.email || "";

  const nights = Math.ceil(
    (new Date(booking.checkOut) - new Date(booking.checkIn)) / 86400000
  );

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

        <div style={styles.guestInfo}>
          <span style={styles.guestLabel}>Guest:</span>
          <span style={styles.guestName}>{guestName}</span>
          {guestEmail && <span style={styles.guestEmail}>({guestEmail})</span>}
        </div>

        <div style={styles.datesRow}>
          <DateItem
            label="Check-in"
            value={new Date(booking.checkIn).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          />
          <DateItem
            label="Check-out"
            value={new Date(booking.checkOut).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          />
          <DateItem label="Nights" value={nights} />
        </div>

        <div style={styles.cardMeta}>
          <div style={styles.metaLeft}>
            <span style={{ ...styles.statusBadge, ...statusStyle }}>
              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
            </span>
            <span style={styles.totalPrice}>
              Rs. {booking.totalPrice?.toLocaleString() || 0} total
            </span>
          </div>

          <div style={styles.actions}>
            {tab === "pending" && (
              <>
                <button
                  style={{
                    ...styles.btnOutline,
                    ...(isUpdating ? styles.btnDisabled : {}),
                  }}
                  onClick={() => onUpdateStatus?.(booking, "confirmed")}
                  disabled={isUpdating}
                >
                  {isUpdating ? "Processing..." : "Confirm"}
                </button>
                <button
                  style={{
                    ...styles.btnOutline,
                    ...(isUpdating ? styles.btnDisabled : {}),
                  }}
                  onClick={() => onUpdateStatus?.(booking, "cancelled")}
                  disabled={isUpdating}
                >
                  {isUpdating ? "Processing..." : "Reject"}
                </button>
                <button
                  type="button"
                  style={styles.btnPrimary}
                  onClick={() =>
                    navigate(
                      `/messages?userId=${booking.guest?._id}${
                        booking.property?._id
                          ? `&propertyId=${booking.property._id}`
                          : ""
                      }`
                    )
                  }
                >
                  Message Guest
                </button>
              </>
            )}
            {tab === "confirmed" && (
              <>
                <button
                  style={{
                    ...styles.btnOutline,
                    ...(isUpdating ? styles.btnDisabled : {}),
                  }}
                  onClick={() => onUpdateStatus?.(booking, "completed")}
                  disabled={isUpdating}
                >
                  {isUpdating ? "Processing..." : "Mark Complete"}
                </button>
                <button
                  type="button"
                  style={styles.btnPrimary}
                  onClick={() =>
                    navigate(
                      `/messages?userId=${booking.guest?._id}${
                        booking.property?._id
                          ? `&propertyId=${booking.property._id}`
                          : ""
                      }`
                    )
                  }
                >
                  Message Guest
                </button>
              </>
            )}
            {tab === "completed" && (
              <button
                type="button"
                style={styles.btnPrimary}
                onClick={() =>
                  navigate(
                    `/messages?userId=${booking.guest?._id}${
                      propertyId ? `&propertyId=${propertyId}` : ""
                    }`
                  )
                }
              >
                Follow Up
              </button>
            )}
            {tab === "cancelled" && (
              <button
                type="button"
                style={styles.btnOutline}
                onClick={() =>
                  navigate(`/property/${propertyId}`)
                }
              >
                View Property
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export const MemoizedBookingCard = memo(BookingCard);

function DateItem({ label, value }) {
  return (
    <div>
      <span style={styles.dateLabel}>{label}</span>
      <span style={styles.dateValue}>{value}</span>
    </div>
  );
}

const styles = {
  pageState: {
    minHeight: "100vh",
    background: "#f5f3ec",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  loginCard: {
    background: "white",
    border: "1px solid #e0dbd0",
    borderRadius: 14,
    padding: 32,
    textAlign: "center",
    maxWidth: 360,
  },
  loginTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: "#2d3a1e",
    marginBottom: 8,
  },
  loginSubtitle: {
    fontSize: 13,
    color: "#9a9476",
    marginBottom: 20,
  },
  loadingText: { fontSize: 14, color: "#5a7050", fontWeight: 600 },
  container: { padding: "32px 28px", maxWidth: 1200, margin: "0 auto" },
  header: { marginBottom: 28 },
  h1: { fontSize: 26, fontWeight: 700, color: "#1a1a1a", margin: 0 },
  subtitle: { color: "#6b6b60", fontSize: 14, marginTop: 4 },
  tabsWrapper: {
    display: "flex",
    gap: 4,
    marginBottom: 24,
    borderBottom: "1.5px solid #e0e0d8",
    flexWrap: "wrap",
  },
  tabBtn: {
    padding: "10px 20px",
    fontSize: 14,
    fontWeight: 500,
    color: "#6b6b60",
    cursor: "pointer",
    border: "none",
    background: "none",
    borderBottomWidth: "2.5px",
    borderBottomStyle: "solid",
    borderBottomColor: "transparent",
    marginBottom: -1.5,
    display: "flex",
    alignItems: "center",
    gap: 6,
    transition: "all 0.15s",
  },
  tabBtnActive: {
    color: "#2d6a2d",
    borderBottomColor: "#2d6a2d",
    fontWeight: 600,
  },
  tabCount: {
    background: "#e0e0d8",
    color: "#6b6b60",
    fontSize: 11,
    fontWeight: 600,
    padding: "1px 7px",
    borderRadius: 10,
  },
  tabCountActive: { background: "#e8f5e8", color: "#2d6a2d" },
  empty: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "60px 0",
    gap: 10,
    color: "#6b6b60",
  },
  emptyTitle: { fontSize: 20, fontWeight: 700, color: "#6b8c3e" },
  emptyText: { fontSize: 15, fontWeight: 600 },
  card: {
    background: "#fff",
    border: "1px solid #e0e0d8",
    borderRadius: 14,
    padding: 20,
    marginBottom: 16,
    display: "flex",
    gap: 20,
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  cardImg: {
    width: 110,
    height: 90,
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    overflow: "hidden",
    background: "#eef2e8",
  },
  cardImgTag: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    borderRadius: 10,
    display: "block",
  },
  cardInfo: { flex: 1, minWidth: 260 },
  cardTitle: { fontSize: 16, fontWeight: 700, color: "#1a1a1a", marginBottom: 4, marginTop: 0 },
  cardLocation: {
    fontSize: 13,
    color: "#6b6b60",
    marginBottom: 8,
    marginTop: 0,
  },
  guestInfo: {
    fontSize: 13,
    color: "#6b6b60",
    marginBottom: 10,
    display: "flex",
    gap: 6,
    alignItems: "center",
    flexWrap: "wrap",
  },
  guestLabel: { fontWeight: 600, color: "#1a1a1a" },
  guestName: { fontWeight: 600, color: "#1a1a1a" },
  guestEmail: { color: "#6b6b60", fontSize: 12 },
  datesRow: {
    display: "flex",
    gap: 24,
    marginBottom: 14,
    flexWrap: "wrap",
  },
  dateLabel: {
    display: "block",
    fontSize: 11,
    color: "#6b6b60",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  dateValue: { display: "block", fontSize: 14, fontWeight: 600, color: "#1a1a1a" },
  cardMeta: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 10,
  },
  metaLeft: { display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" },
  statusBadge: { fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 10 },
  totalPrice: { fontSize: 15, fontWeight: 700, color: "#1a1a1a" },
  actions: { display: "flex", gap: 8, flexWrap: "wrap" },
  btnOutline: {
    border: "1.5px solid #e0e0d8",
    background: "none",
    color: "#1a1a1a",
    padding: "10px 16px",
    borderRadius: 12,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    minWidth: 104,
    transition: "all 0.2s ease",
  },
  btnPrimary: {
    background: "#3a7a3a",
    color: "white",
    border: "none",
    padding: "10px 16px",
    borderRadius: 12,
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    minWidth: 122,
    transition: "all 0.2s ease",
  },
  btnDisabled: { opacity: 0.7, cursor: "not-allowed" },
};
