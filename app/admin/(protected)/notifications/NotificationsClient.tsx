"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Notification {
  id: number;
  client_id: number;
  work_entry_id: number;
  message: string;
  is_read: boolean;
  created_at: string;
}

export function NotificationsClient() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const res = await fetch("/api/admin/notifications");
        if (res.ok) {
          const data = await res.json();
          setNotifications(data);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchNotifications();
  }, []);

  async function handleMarkAllRead() {
    await fetch("/api/admin/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  async function handleNotificationClick(n: Notification) {
    if (!n.is_read) {
      await fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: n.id }),
      });
      // Optionally update local state, though we are navigating away
      setNotifications((prev) => prev.map((notif) => (notif.id === n.id ? { ...notif, is_read: true } : notif)));
    }
    router.push(`/admin/clients/${n.client_id}`);
  }

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500 mt-1">
            You have {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}.
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-sm px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700 font-medium transition-colors"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {notifications.length === 0 ? (
          <div className="text-center py-12 text-gray-500 text-sm">
            No notifications yet.
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {notifications.map((n) => (
              <li
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors flex items-start gap-4 ${
                  !n.is_read ? "bg-indigo-50/30" : ""
                }`}
              >
                <div className="mt-1">
                  {!n.is_read ? (
                    <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full" />
                  ) : (
                    <div className="w-2.5 h-2.5 bg-gray-300 rounded-full" />
                  )}
                </div>
                <div className="flex-1">
                  <p className={`text-sm ${!n.is_read ? "font-semibold text-gray-900" : "text-gray-700"}`}>
                    {n.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(n.created_at).toLocaleString()}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
