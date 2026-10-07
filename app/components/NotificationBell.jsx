"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Check, Trash2, CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { apiClient } from "../utils/apiClient";

export default function NotificationBell() {
    const { isLoggedIn } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef(null);

    useEffect(() => {
        if (!isLoggedIn) {
            setNotifications([]);
            setUnreadCount(0);
            return;
        }

        const fetchNotifications = async () => {
            try {
                const data = await apiClient.get("/api/notifications");
                if (data && data.notifications) {
                    setNotifications(data.notifications);
                    setUnreadCount(data.notifications.filter(n => !n.is_read).length);
                }
            } catch (err) {
                if (err?.response?.status === 401) {
                    // Token is stale/expired even though isLoggedIn says true.
                    // Fail quietly — don't spam console.error for an expected auth state.
                    setNotifications([]);
                    setUnreadCount(0);
                    return;
                }
                console.error("Failed to fetch notifications:", err);
            }
        };

        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, [isLoggedIn]);

    // Handle outside click to close dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const markAsRead = async (id, e) => {
        e.stopPropagation();
        try {
            await apiClient.put(`/api/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error("Failed to mark as read", err);
        }
    };

    const markAllAsRead = async (e) => {
        e.stopPropagation();
        try {
            // Optimistic update
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);

            // Loop through unread and mark them (since there is no bulk endpoint in standard setup, we'll map them or assume a bulk endpoint exists)
            // Ideally backend has: await apiClient.put(`/api/notifications/read-all`);
            // But doing it sequentially for now
            const unread = notifications.filter(n => !n.is_read);
            for (const n of unread) {
                await apiClient.put(`/api/notifications/${n.id}/read`).catch(() => { });
            }
        } catch (err) {
            console.error("Failed to mark all as read", err);
        }
    };

    if (!isLoggedIn) return null;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1.5 md:gap-2 cursor-pointer hover:text-white transition-colors group relative pt-1"
            >
                <div className="relative flex items-center justify-center">
                    <Bell size={18} strokeWidth={2.5} className="md:w-[20px] md:h-[20px]" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold rounded-full h-4 w-4 flex items-center justify-center animate-in zoom-in duration-300">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </div>
                <span className="hidden sm:inline">Notifications</span>
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-3 w-[320px] sm:w-[380px] bg-white text-[#303030] shadow-2xl rounded-sm z-[70] border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                        <h3 className="font-playfair font-bold text-[#135B42] text-sm">Notifications</h3>
                        {unreadCount > 0 && (
                            <button onClick={markAllAsRead} className="text-[11px] text-gray-500 hover:text-[#135B42] font-semibold flex items-center gap-1 transition-colors cursor-pointer">
                                <CheckCircle2 size={12} />
                                Mark all as read
                            </button>
                        )}
                    </div>

                    <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                        {notifications.length > 0 ? (
                            notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`p-4 border-b border-gray-50 flex gap-3 transition-colors ${!notification.is_read ? 'bg-[#FDF8F3]' : 'hover:bg-gray-50/50'}`}
                                >
                                    <div className="flex-1">
                                        <h4 className={`text-[13px] ${!notification.is_read ? 'font-bold text-[#135B42]' : 'font-semibold text-gray-700'}`}>
                                            {notification.title}
                                        </h4>
                                        <p className={`text-[12px] mt-1 ${!notification.is_read ? 'text-gray-800' : 'text-gray-500'}`}>
                                            {notification.message}
                                        </p>
                                        <div className="text-[10px] text-gray-400 mt-2 font-medium tracking-wide">
                                            {new Date(notification.created_at || Date.now()).toLocaleDateString('en-IN', {
                                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                            })}
                                        </div>
                                    </div>
                                    {!notification.is_read && (
                                        <button
                                            onClick={(e) => markAsRead(notification.id, e)}
                                            className="h-6 w-6 rounded-full bg-white border border-[#E8DDD4] flex items-center justify-center text-gray-400 hover:text-[#135B42] hover:border-[#135B42] transition-colors shrink-0"
                                            title="Mark as read"
                                        >
                                            <Check size={12} strokeWidth={3} />
                                        </button>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="p-8 flex flex-col items-center justify-center text-center">
                                <Bell size={32} className="text-gray-200 mb-3" />
                                <p className="text-sm font-semibold text-gray-400">No notifications yet</p>
                                <p className="text-xs text-gray-400 mt-1">We'll notify you when something arrives!</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
