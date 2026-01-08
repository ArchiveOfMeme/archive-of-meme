'use client';

import { useState, useEffect } from 'react';

export default function UpdateBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    // Listen for messages from Service Worker
    const handleMessage = (event) => {
      if (event.data?.type === 'SW_UPDATED') {
        setShowBanner(true);
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);

    // Also check for waiting service worker on load
    navigator.serviceWorker.ready.then((registration) => {
      if (registration.waiting) {
        setShowBanner(true);
      }

      // Listen for new service worker installing
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker?.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            setShowBanner(true);
          }
        });
      });
    });

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, []);

  const handleUpdate = () => {
    window.location.reload();
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[100] max-w-md mx-auto">
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#a5b4fc]/20 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-[#a5b4fc]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <p className="text-white text-sm">New version available</p>
        </div>
        <button
          onClick={handleUpdate}
          className="px-4 py-2 bg-[#a5b4fc] hover:bg-[#8b9cf0] text-black text-sm font-bold rounded-full transition-colors flex-shrink-0"
        >
          Update
        </button>
      </div>
    </div>
  );
}
