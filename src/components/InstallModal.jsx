'use client';

export default function InstallModal({ isOpen, onClose, onInstall, isIOS }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-[#111] border border-[#2a2a2a] rounded-2xl max-w-sm w-full p-6 shadow-2xl">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-[#1a1a1a] rounded-2xl flex items-center justify-center">
            {isIOS ? (
              <svg className="w-8 h-8 text-[#a5b4fc]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-[#a5b4fc]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            )}
          </div>
        </div>

        {/* Title */}
        <h2 className="text-white text-xl font-semibold text-center mb-2">
          Install Archive of Meme
        </h2>

        {/* Description */}
        <p className="text-[#a0a0a0] text-sm text-center mb-6">
          {isIOS
            ? "Open in Safari and follow these steps:"
            : "Add to your home screen for quick access. No app store needed."
          }
        </p>

        {isIOS ? (
          /* iOS Instructions */
          <div className="space-y-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 bg-[#a5b4fc] text-black rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                1
              </div>
              <div className="flex-1">
                <p className="text-white text-sm">
                  Tap the <span className="inline-flex items-center mx-1">
                    <svg className="w-5 h-5 text-[#a5b4fc]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  </span> Share button
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-7 h-7 bg-[#a5b4fc] text-black rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                2
              </div>
              <div className="flex-1">
                <p className="text-white text-sm">
                  Scroll and tap <span className="text-[#a5b4fc] font-medium">"Add to Home Screen"</span>
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-7 h-7 bg-[#a5b4fc] text-black rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                3
              </div>
              <div className="flex-1">
                <p className="text-white text-sm">
                  Tap <span className="text-[#a5b4fc] font-medium">"Add"</span> to confirm
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Standard Benefits */
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 text-sm">
              <span className="text-[#00ff88]">✓</span>
              <span className="text-[#ccc]">Works offline</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-[#00ff88]">✓</span>
              <span className="text-[#ccc]">Faster loading</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-[#00ff88]">✓</span>
              <span className="text-[#ccc]">Full screen experience</span>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 text-[#a0a0a0] hover:text-white border border-[#2a2a2a] hover:border-[#3a3a3a] rounded-xl transition-colors text-sm font-medium"
          >
            {isIOS ? "Close" : "Not now"}
          </button>
          {!isIOS && (
            <button
              onClick={onInstall}
              className="flex-1 px-4 py-3 bg-[#a5b4fc] hover:bg-[#8b9cf0] text-black rounded-xl transition-colors text-sm font-bold"
            >
              Install
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
