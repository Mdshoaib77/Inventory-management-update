import React, { useState, useEffect } from "react";
import Modal, { ModalHeader } from "./Modal";

// Web equivalent of mobile/components/SellModal.js — "Add to Cart" from
// the Inventory list. Never completes a sale directly; only calls
// onConfirm(quantity), which adds the line to the shared cart. The actual
// sale/stock deduction happens once at Checkout.
export default function SellModal({ visible, product, onClose, onConfirm }) {
  const [qty, setQty] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setQty("");
      setSubmitting(false);
    }
  }, [visible]);

  if (!product) return null;

  const available = product.quantity;
  const parsedQty = parseInt(qty, 10);
  const isWholeNumberInput = /^\d+$/.test(qty.trim());
  const isValid = isWholeNumberInput && Number.isInteger(parsedQty) && parsedQty > 0 && parsedQty <= available;

  let errorMessage = "";
  if (qty.trim() !== "") {
    if (!isWholeNumberInput || !Number.isInteger(parsedQty) || parsedQty <= 0) {
      errorMessage = "Enter a whole number greater than 0.";
    } else if (parsedQty > available) {
      errorMessage = `Only ${available} unit${available === 1 ? "" : "s"} available.`;
    }
  }

  const handleConfirm = async () => {
    if (!isValid || submitting) return;
    setSubmitting(true);
    try {
      await onConfirm(parsedQty);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} onClose={onClose}>
      <ModalHeader title="Add to Cart" subtitle={product.productName} onClose={onClose} />

      <div className="mb-4 flex gap-3">
        <div className="flex-1 rounded-lg bg-slate-50 px-3.5 py-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Available</p>
          <p className="text-base font-bold tabular-nums text-slate-900">
            {available} unit{available === 1 ? "" : "s"}
          </p>
        </div>
        {!!product.avgCostPrice && (
          <div className="flex-1 rounded-lg bg-slate-50 px-3.5 py-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Average cost</p>
            <p className="text-base font-bold tabular-nums text-slate-900">৳{product.avgCostPrice.toFixed(2)}</p>
          </div>
        )}
      </div>

      {available === 0 ? (
        <p className="rounded-lg bg-red-50 p-3 text-center text-sm font-semibold text-red-700">This product is out of stock.</p>
      ) : (
        <>
          <label className="label">Quantity to sell</label>
          <input
            className={`input !py-2.5 text-base ${errorMessage ? "!border-red-500" : ""}`}
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            type="number"
            placeholder={`Max ${available}`}
            autoFocus
            disabled={submitting}
          />
          {errorMessage && <p className="mt-1.5 text-xs text-red-700">{errorMessage}</p>}
          {isValid && <p className="mt-2.5 text-sm font-semibold text-emerald-600">Selling price is set at Checkout</p>}
        </>
      )}

      <div className="mt-6 flex justify-end gap-3">
        <button className="btn-secondary" onClick={onClose} disabled={submitting}>
          Cancel
        </button>
        <button className="btn-primary" onClick={handleConfirm} disabled={!isValid || submitting || available === 0}>
          {submitting ? "Adding..." : "Add to Cart"}
        </button>
      </div>
    </Modal>
  );
}
