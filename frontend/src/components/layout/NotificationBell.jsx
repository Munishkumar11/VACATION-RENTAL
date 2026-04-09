import { useEffect, useRef, useState } from "react";
import { Bell, Calendar, Home, MessageSquare, RefreshCw, Trash2, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";
import axios from "axios";

const formatRelativeTime = (value) => {
  const timestamp = new Date(value).getTime();
  const diffMs = Date.now() - timestamp;
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
};

const getNotificationIcon = (type) => {
  if (type === "message") return MessageSquare;
  if (type === "listing") return Home;
  if (type === "user") return UserPlus;
  return Calendar;
};

export default function NotificationBell({
  enabled = true,
  storageKey = "notifications_seen",
  title = "Notifications",
  buttonClassName = "",
  iconClassName = "",
  panelClassName = "",
  badgeClassName = "",
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState("");
  const [seenAt, setSeenAt] = useState(0);
  const containerRef = useRef(null);

  const saveSeenAt = (items) => {
    const latestTimestamp = items.reduce((latest, item) => {
      const itemTimestamp = new Date(item.createdAt).getTime();
      return itemTimestamp > latest ? itemTimestamp : latest;
    }, 0);

    if (!latestTimestamp) return;

    const nextSeenAt = new Date(latestTimestamp).toISOString();
    localStorage.setItem(storageKey, nextSeenAt);
    setSeenAt(latestTimestamp);
  };

  const fetchNotifications = async ({ silent = false, markSeen = false } = {}) => {
    if (!enabled) {
      setNotifications([]);
      return;
    }

    if (!silent) {
      setLoading(true);
    }

    try {
      const res = await axios.get("/notification");
      const nextNotifications = res.data?.data || [];

      setNotifications(nextNotifications);
      setError("");

      if (markSeen) {
        saveSeenAt(nextNotifications);
      }
    } catch (fetchError) {
      setNotifications([]);
      setError(fetchError.response?.data?.message || "Unable to load notifications");
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!enabled) return undefined;

    const rawSeenAt = localStorage.getItem(storageKey);
    if (rawSeenAt) {
      setSeenAt(new Date(rawSeenAt).getTime());
    } else {
      setSeenAt(0);
    }

    fetchNotifications({ silent: true });

    const intervalId = window.setInterval(() => {
      fetchNotifications({ silent: true });
    }, 60000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [enabled, storageKey]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const unreadBaseline = seenAt > 0 ? seenAt : Date.now() - 7 * 24 * 60 * 60 * 1000;

  const unreadCount = notifications.filter((notification) => {
    const createdAt = new Date(notification.createdAt).getTime();
    return notification.isUnread || createdAt > unreadBaseline;
  }).length;

  const handleToggle = async () => {
    const nextOpen = !open;
    setOpen(nextOpen);

    if (nextOpen) {
      await fetchNotifications({ markSeen: true });
    }
  };

  const handleDeleteNotification = async (event, notificationId) => {
    event.preventDefault();
    event.stopPropagation();

    try {
      await axios.delete(`/notification/${encodeURIComponent(notificationId)}`);
      setNotifications((currentNotifications) =>
        currentNotifications.filter((notification) => notification.id !== notificationId)
      );
    } catch (deleteError) {
      setError(deleteError.response?.data?.message || "Unable to delete notification");
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label={title}
        aria-expanded={open}
        onClick={handleToggle}
        disabled={!enabled}
        className={buttonClassName}
      >
        <Bell className={iconClassName} size={18} />
        {unreadCount > 0 && (
          <span className={badgeClassName}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className={`absolute right-0 top-full z-50 mt-3 w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-[#d6cebc] bg-white shadow-xl ${panelClassName}`}
        >
          <div className="flex items-center justify-between border-b border-[#ece8de] bg-[#faf9f4] px-4 py-3">
            <div>
              <h3 className="text-sm font-semibold text-[#2d3a1e]">{title}</h3>
              <p className="text-[11px] text-[#8a8267]">
                {unreadCount > 0 ? `${unreadCount} new item${unreadCount > 1 ? "s" : ""}` : "You're all caught up"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => fetchNotifications()}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#d6cebc] text-[#8a8267] transition hover:border-[#6b8c3e] hover:text-[#6b8c3e]"
              aria-label="Refresh notifications"
              title="Refresh notifications"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {loading ? (
              <div className="px-4 py-8 text-center text-sm text-[#8a8267]">
                Loading notifications...
              </div>
            ) : error ? (
              <div className="px-4 py-8 text-center text-sm text-[#b45309]">
                {error}
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-[#8a8267]">
                No notifications yet.
              </div>
            ) : (
              notifications.map((notification) => {
                const Icon = getNotificationIcon(notification.type);

                return (
                  <div
                    key={notification.id}
                    className="flex items-start gap-3 border-b border-[#f3efe6] px-4 py-3 transition-colors hover:bg-[#faf9f4]"
                  >
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#edf3e2] text-[#6b8c3e]">
                      <Icon className="h-4 w-4" />
                    </div>
                    <Link
                      to={notification.link || "#"}
                      onClick={() => setOpen(false)}
                      className="min-w-0 flex-1"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-medium text-[#2d3a1e]">
                          {notification.title}
                        </p>
                        <span className="shrink-0 text-[10px] text-[#9a9476]">
                          {formatRelativeTime(notification.createdAt)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs leading-5 text-[#7c755e]">
                        {notification.description}
                      </p>
                    </Link>
                    <button
                      type="button"
                      onClick={(event) => handleDeleteNotification(event, notification.id)}
                      className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#b8af94] transition hover:bg-[#f3efe6] hover:text-red-500"
                      aria-label="Delete notification"
                      title="Delete notification"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    {notification.isUnread && (
                      <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-[#6b8c3e]" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
