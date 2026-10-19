import React, { useEffect } from "react";

// Generic modal shell used by every *Modal component in this app — the
// web equivalent of React Native's <Modal transparent animationType="fade">
// + a centered white card. Clicking the dark backdrop closes the modal
// (mirrors onRequestClose); clicking inside the card never does.
//
// Desktop polish: blurred backdrop, entrance animation, Esc-to-close and an
// optional `drawer` variant that slides in from the right edge for
// longer, list-style content. API is otherwise unchanged.
export default function Modal({ visible, onClose, children, maxWidth = "max-w-md", drawer = false }) {
  useEffect(() => {
    if (!visible || !onClose) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible, onClose]);

  if (!visible) return null;

  if (drawer) {
    return (
      <div
        className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-[2px] animate-fade-in"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget && onClose) onClose();
        }}
      >
        <div className={`h-full w-full ${maxWidth} animate-slide-in-right overflow-y-auto bg-white p-6 shadow-pop`}>{children}</div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[2px] animate-fade-in sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && onClose) onClose();
      }}
    >
      <div
        className={`w-full ${maxWidth} max-h-[90vh] animate-scale-in overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-pop`}
      >
        {children}
      </div>
    </div>
  );
}

// Consistent title row for modal / drawer bodies.
export function ModalHeader({ title, subtitle, onClose }) {
  return (
    <div className="mb-5 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-lg font-bold tracking-tight text-slate-900">{title}</h2>
        {subtitle && <p className="mt-0.5 truncate text-sm text-slate-500">{subtitle}</p>}
      </div>
      {onClose && (
        <button type="button" onClick={onClose} className="btn-icon -mr-1.5 -mt-1 shrink-0" aria-label="Close">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
