import React, { useState, useEffect } from "react";
import Modal, { ModalHeader } from "./Modal";
import { PAYMENT_METHODS } from "../utils/customerType";

export default function AddPaymentModal({ visible, dueAmount, onClose, onConfirm }) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("Cash");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setAmount("");
      setMethod("Cash");
      setNote("");
      setSubmitting(false);
    }
  }, [visible]);

  const parsedAmount = parseFloat(amount);
  const isValid = Number.isFinite(parsedAmount) && parsedAmount > 0 && parsedAmount <= dueAmount;

  const handleConfirm = async () => {
    if (!isValid) return;
    setSubmitting(true);
    try {
      await onConfirm({ paymentAmount: parsedAmount, paymentMethod: method, paymentNote: note.trim() });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} onClose={onClose}>
      <ModalHeader title="Collect Payment" onClose={onClose} />
      <div className="mb-5 flex items-center justify-between rounded-lg border border-red-100 bg-red-50 px-4 py-3">
        <span className="text-sm font-medium text-red-700">Current due</span>
        <span className="text-lg font-bold tabular-nums text-red-700">৳{dueAmount?.toFixed(2) ?? "0.00"}</span>
      </div>

      <label className="label">Payment amount</label>
      <input
        className="input !py-2.5 text-base"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        type="number"
        placeholder="e.g. 20000"
        autoFocus
      />
      {amount.trim() !== "" && !isValid && (
        <p className="mt-1.5 text-xs text-red-500">
          {parsedAmount > dueAmount ? "Cannot exceed the current due amount" : "Enter an amount greater than 0"}
        </p>
      )}

      <label className="label mt-4">Payment method</label>
      <div className="mb-4 flex flex-wrap gap-2">
        {PAYMENT_METHODS.map((m) => (
          <button
            key={m}
            type="button"
            className={`rounded-lg border px-3 py-2 text-[13px] font-semibold transition ${
              method === m ? "border-brand bg-brand-50 text-brand" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
            onClick={() => setMethod(m)}
          >
            {m}
          </button>
        ))}
      </div>

      <label className="label">Note (optional)</label>
      <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Advance payment received" />

      <div className="mt-6 flex justify-end gap-3">
        <button className="btn-secondary" onClick={onClose} disabled={submitting}>
          Cancel
        </button>
        <button className="btn-success" onClick={handleConfirm} disabled={!isValid || submitting}>
          {submitting ? "Recording..." : "Record Payment"}
        </button>
      </div>
    </Modal>
  );
}
