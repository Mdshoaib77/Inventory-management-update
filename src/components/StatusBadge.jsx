import React from "react";
import { STOCK_STATUS_LABEL } from "../utils/stockStatus";

const TONE_CLASS = {
  IN_STOCK: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
  LOW_STOCK: "bg-amber-50 text-amber-700 ring-amber-600/20",
  OUT_OF_STOCK: "bg-red-50 text-red-700 ring-red-600/15",
};
const DOT_CLASS = {
  IN_STOCK: "bg-emerald-500",
  LOW_STOCK: "bg-amber-500",
  OUT_OF_STOCK: "bg-red-500",
};

export default function StatusBadge({ status }) {
  const key = TONE_CLASS[status] ? status : "IN_STOCK";
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${TONE_CLASS[key]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${DOT_CLASS[key]}`} />
      {STOCK_STATUS_LABEL[status]}
    </span>
  );
}
