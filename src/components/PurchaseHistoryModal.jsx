import React, { useState, useEffect } from "react";
import { Calendar, Archive } from "lucide-react";
import Modal, { ModalHeader } from "./Modal";
import client from "../api/client";

export default function PurchaseHistoryModal({ visible, product, onClose }) {
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!visible || !product) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await client.get("/transactions/history", {
          params: { type: "RESTOCK", productId: product._id },
        });
        if (!cancelled) setEntries(data.transactions || []);
      } catch (err) {
        if (!cancelled) setError(err?.friendlyMessage || "Could not load purchase history");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [visible, product]);

  if (!product) return null;

  return (
    <Modal visible={visible} onClose={onClose} drawer maxWidth="max-w-xl">
      <ModalHeader title="Purchase History" subtitle={product.productName} onClose={onClose} />

      <div className="mb-5 flex gap-3">
        <div className="flex-1 rounded-xl bg-brand-50 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Available</p>
          <p className="text-lg font-extrabold tabular-nums text-slate-900">{product.quantity} pcs</p>
        </div>
        {!!product.avgCostPrice && (
          <div className="flex-1 rounded-xl bg-emerald-50 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Avg. Cost</p>
            <p className="text-lg font-extrabold tabular-nums text-slate-900">৳{product.avgCostPrice.toFixed(2)}</p>
          </div>
        )}
      </div>

      {loading ? (
        <div className="py-10 text-center text-sm text-slate-400">Loading...</div>
      ) : error ? (
        <p className="py-4 text-center text-sm text-red-700">{error}</p>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12">
          <Archive size={28} className="text-slate-300" />
          <p className="text-sm text-slate-400">No stock-in records yet</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th className="text-right">Qty</th>
                <th className="text-right">Unit price</th>
                <th className="text-right">Total spent</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((item) => {
                const unitPrice = item.purchasePrice ?? item.unitPrice;
                return (
                  <tr key={item._id}>
                    <td className="whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 text-slate-700">
                        <Calendar size={13} className="text-slate-400" /> {new Date(item.date).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="num font-semibold text-emerald-600">+{item.quantitySold}</td>
                    <td className="num">৳{unitPrice.toFixed(2)}</td>
                    <td className="num font-bold text-slate-900">৳{item.totalAmount.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <button className="btn-secondary mt-6 w-full !py-2.5" onClick={onClose}>
        Close
      </button>
    </Modal>
  );
}
