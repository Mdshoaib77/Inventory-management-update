import React, { useState } from "react";
import Modal, { ModalHeader } from "./Modal";

// Web equivalent of mobile/components/ReminderModal.js. React Native's
// Share sheet (WhatsApp/SMS/etc.) becomes the Web Share API where
// supported (mobile Chrome/Safari), with a "Copy" fallback everywhere
// else (most desktop browsers don't implement navigator.share).
export default function ReminderModal({ visible, loading, reminder, onClose }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (!reminder?.message) return;
    if (navigator.share) {
      try {
        await navigator.share({ text: reminder.message });
      } catch {
        // Share sheet dismissal/cancellation throws too — nothing to show.
      }
    } else {
      try {
        await navigator.clipboard.writeText(reminder.message);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Clipboard API blocked — nothing more we can do silently.
      }
    }
  };

  return (
    <Modal visible={visible} onClose={onClose} maxWidth="max-w-lg">
      <ModalHeader title="Payment Reminder" onClose={onClose} />

      {loading ? (
        <div className="py-10 text-center text-sm text-slate-400">Loading...</div>
      ) : (
        <>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm leading-relaxed text-slate-800">{reminder?.message}</p>
          </div>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-500">
            {!!reminder?.whatsappNumber && <p>WhatsApp: {reminder.whatsappNumber}</p>}
            {!!reminder?.mobileNumber && <p>Mobile: {reminder.mobileNumber}</p>}
          </div>
        </>
      )}

      <div className="mt-6 flex justify-end gap-3">
        <button className="btn-secondary" onClick={onClose}>
          Close
        </button>
        <button className="btn-primary" onClick={handleShare} disabled={loading}>
          {copied ? "Copied!" : navigator.share ? "Share" : "Copy"}
        </button>
      </div>
    </Modal>
  );
}
