'use client';

import { useState, useEffect } from 'react';

/**
 * Admin Panel - Gestión de Eventos
 *
 * Página protegida para crear y gestionar eventos especiales.
 * Requiere ADMIN_SECRET_KEY para operar.
 */
export default function AdminEventsPage() {
  const [adminKey, setAdminKey] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Form state
  const [form, setForm] = useState({
    name: '',
    description: '',
    multiplier: '1.5',
    icon: '🎉',
    startDate: '',
    endDate: '',
  });

  // Verificar admin key guardada
  useEffect(() => {
    const savedKey = localStorage.getItem('admin_key');
    if (savedKey) {
      setAdminKey(savedKey);
      setIsAuthenticated(true);
      fetchEvents(savedKey);
    }
  }, []);

  const handleLogin = () => {
    if (adminKey.length > 10) {
      localStorage.setItem('admin_key', adminKey);
      setIsAuthenticated(true);
      fetchEvents(adminKey);
    }
  };

  const fetchEvents = async (key) => {
    try {
      const res = await fetch('/api/events?all=true');
      const data = await res.json();
      setEvents(data.events || []);
    } catch (err) {
      console.error('Error fetching events:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // Use localStorage directly to avoid state sync issues
    const key = localStorage.getItem('admin_key') || adminKey;

    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          adminKey: key,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(`Event "${form.name}" created successfully!`);
        setForm({
          name: '',
          description: '',
          multiplier: '1.5',
          icon: '🎉',
          startDate: '',
          endDate: '',
        });
        fetchEvents(adminKey);
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    }

    setLoading(false);
  };

  const handleDelete = async (eventId) => {
    if (!confirm('Disable this event?')) return;

    const key = localStorage.getItem('admin_key') || adminKey;

    try {
      const res = await fetch('/api/events', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, adminKey: key }),
      });

      if (res.ok) {
        fetchEvents(adminKey);
      }
    } catch (err) {
      console.error('Error deleting event:', err);
    }
  };

  const triggerMemeMondayCron = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/cron/meme-monday');
      const data = await res.json();
      setMessage(data.success ? 'Meme Monday created!' : `Error: ${data.error}`);
      fetchEvents(adminKey);
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    }
    setLoading(false);
  };

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-4">
        <div className="bg-[var(--bg-card)] rounded-xl p-6 w-full max-w-md">
          <h1 className="text-white text-xl font-bold mb-4">Admin Login</h1>
          <input
            type="password"
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            placeholder="Enter admin key..."
            className="w-full bg-[var(--bg-elevated)] border border-[var(--bg-elevated)] rounded-lg px-4 py-3 text-white mb-4"
          />
          <button
            onClick={handleLogin}
            className="w-full bg-[var(--accent-primary)] text-black font-bold py-3 rounded-lg hover:opacity-90"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-white text-2xl font-bold mb-6">Event Management</h1>

        {/* Quick Actions */}
        <div className="bg-[var(--bg-card)] rounded-xl p-6 mb-6">
          <h2 className="text-white font-semibold mb-4">Quick Actions</h2>
          <div className="flex gap-4">
            <button
              onClick={triggerMemeMondayCron}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Create Meme Monday
            </button>
            <button
              onClick={() => fetchEvents(adminKey)}
              className="px-4 py-2 bg-[var(--bg-elevated)] text-white rounded-lg hover:bg-[var(--bg-elevated)]/80"
            >
              Refresh List
            </button>
          </div>
        </div>

        {/* Create Event Form */}
        <div className="bg-[var(--bg-card)] rounded-xl p-6 mb-6">
          <h2 className="text-white font-semibold mb-4">Create Special Event</h2>

          {message && (
            <div className={`p-3 rounded-lg mb-4 ${message.includes('Error') ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[var(--text-secondary)] text-sm mb-1">
                  Event Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., Halloween Spooky"
                  required
                  className="w-full bg-[var(--bg-elevated)] border border-[var(--bg-elevated)] rounded-lg px-4 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-[var(--text-secondary)] text-sm mb-1">
                  Icon
                </label>
                <input
                  type="text"
                  value={form.icon}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  placeholder="🎉"
                  className="w-full bg-[var(--bg-elevated)] border border-[var(--bg-elevated)] rounded-lg px-4 py-2 text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-[var(--text-secondary)] text-sm mb-1">
                Description
              </label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Celebrate Halloween with bonus points!"
                className="w-full bg-[var(--bg-elevated)] border border-[var(--bg-elevated)] rounded-lg px-4 py-2 text-white"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-[var(--text-secondary)] text-sm mb-1">
                  Multiplier
                </label>
                <select
                  value={form.multiplier}
                  onChange={(e) => setForm({ ...form, multiplier: e.target.value })}
                  className="w-full bg-[var(--bg-elevated)] border border-[var(--bg-elevated)] rounded-lg px-4 py-2 text-white"
                >
                  <option value="1.5">1.5x (+50%)</option>
                  <option value="2">2x (Double)</option>
                  <option value="2.5">2.5x</option>
                  <option value="3">3x (Triple)</option>
                </select>
              </div>
              <div>
                <label className="block text-[var(--text-secondary)] text-sm mb-1">
                  Start Date
                </label>
                <input
                  type="datetime-local"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  required
                  className="w-full bg-[var(--bg-elevated)] border border-[var(--bg-elevated)] rounded-lg px-4 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-[var(--text-secondary)] text-sm mb-1">
                  End Date
                </label>
                <input
                  type="datetime-local"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  required
                  className="w-full bg-[var(--bg-elevated)] border border-[var(--bg-elevated)] rounded-lg px-4 py-2 text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--accent-primary)] text-black font-bold py-3 rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Event'}
            </button>
          </form>
        </div>

        {/* Events List */}
        <div className="bg-[var(--bg-card)] rounded-xl p-6">
          <h2 className="text-white font-semibold mb-4">All Events</h2>

          {events.length === 0 ? (
            <p className="text-[var(--text-muted)] text-center py-8">
              No events yet
            </p>
          ) : (
            <div className="space-y-3">
              {events.map((event) => {
                const isActive = event.is_active &&
                  new Date(event.start_date) <= new Date() &&
                  new Date(event.end_date) >= new Date();
                const isPast = new Date(event.end_date) < new Date();

                return (
                  <div
                    key={event.id}
                    className={`flex items-center justify-between p-4 rounded-lg ${
                      isActive
                        ? 'bg-green-500/10 border border-green-500/30'
                        : isPast
                        ? 'bg-[var(--bg-elevated)]/50 opacity-60'
                        : 'bg-[var(--bg-elevated)]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{event.icon}</span>
                      <div>
                        <p className="text-white font-medium">
                          {event.name}
                          {isActive && (
                            <span className="ml-2 px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                              ACTIVE
                            </span>
                          )}
                        </p>
                        <p className="text-[var(--text-muted)] text-xs">
                          {event.type} | {event.multiplier}x |{' '}
                          {new Date(event.start_date).toLocaleDateString()} -{' '}
                          {new Date(event.end_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {event.is_active && !isPast && (
                      <button
                        onClick={() => handleDelete(event.id)}
                        className="text-red-400 text-sm hover:text-red-300"
                      >
                        Disable
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
