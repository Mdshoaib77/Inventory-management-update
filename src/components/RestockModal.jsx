import React, { useState, useEffect } from "react";
import Modal, { ModalHeader } from "./Modal";

export default function RestockModal({ visible, product, onClose, onConfirm }) {
  const [qty, setQty] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setQty("");
      setPurchasePrice("");
      setSubmitting(false);
    }
  }, [visible]);

  if (!product) return null;

  const parsedQty = parseInt(qty, 10);
  const parsedPrice = parseFloat(purchasePrice);
  const isValid = Number.isInteger(parsedQty) && parsedQty > 0 && Number.isFinite(parsedPrice) && parsedPrice >= 0;

  const handleConfirm = async () => {
    if (!isValid) return;
    setSubmitting(true);
    try {
      await onConfirm(parsedQty, parsedPrice);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} onClose={onClose}>
      <ModalHeader title="Stock In" subtitle={product.productName} onClose={onClose} />
      <div className="mb-5 flex gap-3">
        <div className="flex-1 rounded-lg bg-slate-50 px-3.5 py-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Current stock</p>
          <p className="text-base font-bold tabular-nums text-slate-900">{product.quantity}</p>
        </div>
        {!!product.avgCostPrice && (
          <div className="flex-1 rounded-lg bg-slate-50 px-3.5 py-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Avg cost</p>
            <p className="text-base font-bold tabular-nums text-slate-900">৳{product.avgCostPrice.toFixed(2)}</p>
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Quantity to add</label>
          <input
            className="input !py-2.5 text-base"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            type="number"
            min="1"
            placeholder="e.g. 10"
            autoFocus
          />
        </div>
        <div>
          <label className="label">Purchase price (per unit)</label>
          <input
            className="input !py-2.5 text-base"
            value={purchasePrice}
            onChange={(e) => setPurchasePrice(e.target.value)}
            type="number"
            min="0"
            step="0.01"
            placeholder="e.g. 2000"
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button className="btn-secondary" onClick={onClose} disabled={submitting}>
          Cancel
        </button>
        <button className="btn-success" onClick={handleConfirm} disabled={!isValid || submitting}>
          {submitting ? "Adding..." : "Add Stock"}
        </button>
      </div>
    </Modal>
  );
}
