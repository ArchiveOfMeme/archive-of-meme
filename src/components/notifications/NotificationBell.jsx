'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import { useTheme } from '@/hooks/useTheme';

export default function NotificationBell() {
  const { address, isConnected } = useAccount();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!address) return;

    try {
      const res = await fetch(`/api/notifications?wallet=${address}&limit=10`);
      const data = await res.json();

      if (!data.error) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  // Initial fetch and polling
  useEffect(() => {
    if (isConnected && address) {
      fetchNotifications();

      // Poll every 60 seconds
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [isConnected, address]);

  // Mount state for Portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Mark single as read
  const markAsRead = async (notificationId) => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: address, notificationId }),
      });

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    if (unreadCount === 0) return;

    setLoading(true);
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: address, markAll: true }),
      });

      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    setIsOpen(false);
  };

  if (!isConnected) {
    return null;
  }

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-[var(--bg-elevated)] transition-colors"
        aria-label="Notifications"
      >
        <svg
          className="w-6 h-6 text-[var(--text-secondary)]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown - Portal para evitar problemas de z-index */}
      {isOpen && mounted && createPortal(
        <>
          <div
            className="fixed inset-0 z-[9998]"
            onClick={() => setIsOpen(false)}
          />
          <div
            ref={dropdownRef}
            className="fixed w-80 z-[9999] overflow-hidden"
            style={{
              top: '60px',
              right: '16px',
              backgroundColor: isLight ? 'var(--color-white)' : 'var(--bg-card)',
              border: isLight ? '2px solid var(--border-sketch)' : '1px solid var(--bg-elevated)',
              borderRadius: isLight ? '8px 15px 10px 12px' : '12px',
              boxShadow: isLight ? '3px 3px 0px var(--color-ink)' : '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
          >
            {/* Header */}
            <div
              className="px-4 py-3 flex items-center justify-between"
              style={{
                borderBottom: isLight ? '1px dashed var(--border-sketch)' : '1px solid var(--bg-elevated)',
              }}
            >
              <h3
                className="font-semibold"
                style={{ color: isLight ? 'var(--color-ink)' : 'white' }}
              >
                Notifications
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  disabled={loading}
                  className="text-xs hover:underline disabled:opacity-50"
                  style={{ color: isLight ? 'var(--color-accent)' : 'var(--accent-primary)' }}
                >
                  {loading ? '...' : 'Mark all read'}
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <span className="text-3xl block mb-2 opacity-30">🔔</span>
                  <p
                    className="text-sm"
                    style={{ color: isLight ? 'var(--color-ink-light)' : 'var(--text-muted)' }}
                  >
                    No notifications yet
                  </p>
                </div>
              ) : (
                notifications.map((notification, index) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onClick={() => handleNotificationClick(notification)}
                    isLight={isLight}
                    isLast={index === notifications.length - 1}
                  />
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div
                className="px-4 py-2 text-center"
                style={{
                  borderTop: isLight ? '1px dashed var(--border-sketch)' : '1px solid var(--bg-elevated)',
                }}
              >
                <button
                  onClick={() => {
                    fetchNotifications();
                    setIsOpen(false);
                  }}
                  className="text-xs transition-colors"
                  style={{ color: isLight ? 'var(--color-ink-light)' : 'var(--text-muted)' }}
                >
                  Refresh
                </button>
              </div>
            )}
          </div>
        </>,
        document.body
      )}
    </div>
  );
}

// =============================================
// NOTIFICATION ITEM
// =============================================

function NotificationItem({ notification, onClick, isLight, isLast }) {
  const content = (
    <div
      className="px-4 py-3 flex items-start gap-3 transition-all cursor-pointer active:scale-[0.98] active:opacity-70"
      style={{
        backgroundColor: !notification.isRead
          ? (isLight ? 'var(--color-paper-dark)' : 'rgba(var(--accent-primary-rgb), 0.05)')
          : 'transparent',
        borderBottom: !isLast
          ? (isLight ? '1px dashed var(--border-sketch)' : '1px solid var(--bg-elevated)')
          : 'none',
      }}
      onClick={onClick}
    >
      {/* Icon */}
      <span className="text-xl shrink-0 mt-0.5">{notification.icon}</span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-medium"
          style={{
            color: notification.isRead
              ? (isLight ? 'var(--color-ink-light)' : 'var(--text-secondary)')
              : (isLight ? 'var(--color-ink)' : 'white'),
          }}
        >
          {notification.title}
        </p>
        <p
          className="text-xs mt-0.5 line-clamp-2"
          style={{ color: isLight ? 'var(--color-ink-light)' : 'var(--text-muted)' }}
        >
          {notification.message}
        </p>
        <p
          className="text-xs mt-1 opacity-60"
          style={{ color: isLight ? 'var(--color-ink-light)' : 'var(--text-muted)' }}
        >
          {notification.timeAgo}
        </p>
      </div>

      {/* Unread Dot */}
      {!notification.isRead && (
        <span
          className="w-2 h-2 rounded-full shrink-0 mt-2"
          style={{ backgroundColor: isLight ? 'var(--color-accent)' : 'var(--accent-primary)' }}
        />
      )}
    </div>
  );

  if (notification.actionUrl) {
    return (
      <Link href={notification.actionUrl}>
        {content}
      </Link>
    );
  }

  return content;
}
