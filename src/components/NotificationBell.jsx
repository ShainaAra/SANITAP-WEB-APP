import { useEffect, useMemo, useState } from "react";
import { Bell, AlertTriangle } from "lucide-react";
import { authFetch } from "../utils/authFetch";
import "./NotificationBell.css";

function isToday(date) {
  const now = new Date();
  return date.toDateString() === now.toDateString();
}

function isYesterday(date) {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return date.toDateString() === yesterday.toDateString();
}

function groupNotifications(notifications) {
  const groups = {
    Today: [],
    Yesterday: [],
    Earlier: [],
  };

  notifications.forEach((notif) => {
    const date = new Date(notif.created_at);

    if (isToday(date)) {
      groups.Today.push(notif);
    } else if (isYesterday(date)) {
      groups.Yesterday.push(notif);
    } else {
      groups.Earlier.push(notif);
    }
  });

  return groups;
}

function formatTime(dateString) {
  return new Date(dateString).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await authFetch("http://localhost:5001/api/notifications");
      const data = await res.json();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("❌ Fetch notifications failed:", error);
      setNotifications([]);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(() => {
      fetchNotifications();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const unreadCount = Array.isArray(notifications)
    ? notifications.filter((n) => n.is_read === 0).length
    : 0;

  const grouped = useMemo(
    () => groupNotifications(Array.isArray(notifications) ? notifications : []),
    [notifications]
  );

  const handleOpen = async () => {
    const nextOpen = !open;
    setOpen(nextOpen);

    if (nextOpen) {
      try {
        await authFetch("http://localhost:5001/api/notifications/read-all", {
          method: "PUT",
        });

        setNotifications((prev) =>
          Array.isArray(prev) ? prev.map((n) => ({ ...n, is_read: 1 })) : []
        );
      } catch (error) {
        console.error("❌ Mark all as read failed:", error);
      }
    }
  };

  const renderGroup = (label, items) => {
    if (!items.length) return null;

    return (
      <div className="notif-group">
        <div className="notif-group-title">{label}</div>

        <div className="notif-group-list">
          {items.map((notif) => (
            <div
              key={notif.id}
              className={`notif-item ${notif.is_read ? "read" : "unread"}`}
            >
              <div className="notif-item-icon">
                <AlertTriangle size={18} />
              </div>

              <div className="notif-item-content">
                <div className="notif-title-row">
                  <span className="notif-title">{notif.title}</span>
                  <span className="notif-time">
                    {formatTime(notif.created_at)}
                  </span>
                </div>

                <div className="notif-body">
                  <strong>{notif.product_name}</strong> {notif.message}
                </div>
              </div>

              {!notif.is_read && <div className="notif-unread-dot" />}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="notif-bell-container">
      <button className="notif-bell-button" onClick={handleOpen}>
        <Bell className="notif-bell-icon" />
        {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
      </button>

      {open && (
        <div className="notif-dropdown">
          <div className="notif-dropdown-header">
            <h3>Notifications</h3>
          </div>

          {notifications.length === 0 ? (
            <p className="notif-empty">No notifications yet.</p>
          ) : (
            <div className="notif-sections">
              {renderGroup("Today", grouped.Today)}
              {renderGroup("Yesterday", grouped.Yesterday)}
              {renderGroup("Earlier", grouped.Earlier)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}