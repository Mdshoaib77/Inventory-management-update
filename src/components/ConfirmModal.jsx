import React from "react";
import Modal from "./Modal";

// Generic "are you sure?" confirmation dialog, styled to match the rest of
// the app's modals (built on the shared <Modal> shell). Used by the Super
// Admin Dashboard before Reject / Delete actions.
export default function ConfirmModal({
  visible,
  onClose,
  onConfirm,
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = true,
  loading = false,
}) {
  return (
    <Modal visible={visible} onClose={loading ? undefined : onClose} maxWidth="max-w-sm">
      <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-full ${danger ? "bg-red-50 text-red-600" : "bg-brand-50 text-brand"}`}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <path d="M12 9v4M12 17h.01" />
        </svg>
      </div>
      <h2 className="text-lg font-bold tracking-tight text-slate-900">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-500">{message}</p>

      <div className="mt-6 flex justify-end gap-3">
        <button type="button" onClick={onClose} disabled={loading} className="btn-secondary">
          {cancelLabel}
        </button>
        <button type="button" onClick={onConfirm} disabled={loading} className={danger ? "btn-danger" : "btn-primary"}>
          {loading ? "Please wait..." : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
