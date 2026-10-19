import React, { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown, ChevronLeft, ChevronRight, AlertCircle, Inbox } from "lucide-react";

/* ------------------------------------------------------------------ */
/* Shared presentational building blocks for the desktop-first UI.     */
/* Nothing in here talks to the API or owns business state.            */
/* ------------------------------------------------------------------ */

export function Spinner({ className = "h-8 w-8" }) {
  return <div className={`${className} animate-spin rounded-full border-[3px] border-brand border-t-transparent`} />;
}

export function PageSpinner({ className = "h-72" }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Spinner className="h-9 w-9" />
    </div>
  );
}

export function PageHeader({ title, subtitle, actions, back }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {back}
        <h1 className="truncate text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function ErrorBanner({ children, className = "" }) {
  if (!children) return null;
  return (
    <div className={`flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 ${className}`}>
      <AlertCircle size={16} className="mt-0.5 shrink-0" />
      <div className="min-w-0 whitespace-pre-line">{children}</div>
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, message }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <Icon size={22} />
      </div>
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      {message && <p className="mt-1 max-w-sm text-sm text-slate-400">{message}</p>}
    </div>
  );
}

const TONES = {
  indigo: { icon: "bg-indigo-50 text-indigo-600", bar: "bg-indigo-500" },
  emerald: { icon: "bg-emerald-50 text-emerald-600", bar: "bg-emerald-500" },
  amber: { icon: "bg-amber-50 text-amber-600", bar: "bg-amber-500" },
  red: { icon: "bg-red-50 text-red-600", bar: "bg-red-500" },
  sky: { icon: "bg-sky-50 text-sky-600", bar: "bg-sky-500" },
  violet: { icon: "bg-violet-50 text-violet-600", bar: "bg-violet-500" },
  slate: { icon: "bg-slate-100 text-slate-600", bar: "bg-slate-500" },
};

export function StatCard({ label, value, icon: Icon, tone = "indigo", valueClass = "", hint }) {
  const t = TONES[tone] || TONES.indigo;
  return (
    <div className="card flex items-center gap-4 p-5">
      {Icon && (
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${t.icon}`}>
          <Icon size={20} />
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-slate-500">{label}</p>
        <p className={`mt-0.5 truncate text-xl font-bold tabular-nums tracking-tight text-slate-900 ${valueClass}`}>{value}</p>
        {hint && <p className="mt-0.5 truncate text-[11px] text-slate-400">{hint}</p>}
      </div>
    </div>
  );
}

const BADGE_TONES = {
  green: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
  amber: "bg-amber-50 text-amber-700 ring-amber-600/20",
  red: "bg-red-50 text-red-700 ring-red-600/15",
  indigo: "bg-indigo-50 text-indigo-700 ring-indigo-600/15",
  slate: "bg-slate-100 text-slate-600 ring-slate-500/15",
};

export function Badge({ tone = "slate", children, className = "" }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-md px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${BADGE_TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

// Segmented pill control for filters / view modes. `options` may be plain
// strings or { key, label, icon } objects.
export function Segmented({ options, value, onChange, className = "" }) {
  return (
    <div className={`inline-flex max-w-full items-center gap-0.5 overflow-x-auto rounded-lg bg-slate-100 p-1 chip-scroll ${className}`}>
      {options.map((opt) => {
        const o = typeof opt === "string" ? { key: opt, label: opt } : opt;
        const active = value === o.key;
        const Icon = o.icon;
        return (
          <button
            key={o.key}
            type="button"
            onClick={() => onChange(o.key)}
            className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-[13px] font-semibold transition ${
              active ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {Icon && <Icon size={14} />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// Underlined tab bar used for top-level view switching inside a page.
export function Tabs({ options, value, onChange }) {
  return (
    <div className="flex gap-6 border-b border-slate-200">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          className={`-mb-px border-b-2 px-0.5 pb-3 text-sm font-semibold transition ${
            value === o ? "border-brand text-brand" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

export function SortHeader({ label, active = false, dir = "asc", onClick, align = "left", className = "" }) {
  if (!onClick) {
    return <th className={`${align === "right" ? "text-right" : ""} ${className}`}>{label}</th>;
  }
  const Icon = !active ? ChevronsUpDown : dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <th className={`${align === "right" ? "text-right" : ""} ${className}`} aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"}>
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-1 uppercase tracking-wider transition hover:text-slate-900 ${
          active ? "text-slate-900" : ""
        } ${align === "right" ? "flex-row-reverse" : ""}`}
      >
        {label}
        <Icon size={12} className={active ? "text-brand" : "text-slate-300"} />
      </button>
    </th>
  );
}

const PAGE_SIZES = [10, 25, 50, 100];

// Pure UI pagination state: slices an already-filtered/sorted list. It
// never changes the list itself, only which window of it is rendered.
export function usePagination(list, resetKey = "", initialSize = 25) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialSize);

  useEffect(() => {
    setPage(1);
  }, [resetKey, pageSize]);

  const total = list.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pageCount);
  const start = (safePage - 1) * pageSize;

  return {
    pageItems: list.slice(start, start + pageSize),
    page: safePage,
    pageSize,
    pageCount,
    total,
    start,
    setPage,
    setPageSize,
  };
}

export function Pagination({ pg }) {
  if (pg.total === 0) return null;
  const from = pg.start + 1;
  const to = Math.min(pg.start + pg.pageSize, pg.total);
  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <span className="tabular-nums">
          Showing <span className="font-semibold text-slate-700">{from}–{to}</span> of{" "}
          <span className="font-semibold text-slate-700">{pg.total}</span>
        </span>
        <label className="hidden items-center gap-2 sm:flex">
          <span className="text-xs">Rows</span>
          <select
            value={pg.pageSize}
            onChange={(e) => pg.setPageSize(Number(e.target.value))}
            className="rounded-md border border-slate-300 bg-white py-1 pl-2 pr-6 text-xs font-semibold text-slate-700 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
          >
            {PAGE_SIZES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="flex items-center gap-1">
        <button className="btn-secondary btn-sm" onClick={() => pg.setPage(pg.page - 1)} disabled={pg.page <= 1}>
          <ChevronLeft size={14} /> Prev
        </button>
        <span className="px-3 text-xs font-semibold tabular-nums text-slate-600">
          Page {pg.page} / {pg.pageCount}
        </span>
        <button className="btn-secondary btn-sm" onClick={() => pg.setPage(pg.page + 1)} disabled={pg.page >= pg.pageCount}>
          Next <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

export function Field({ label, hint, required, children, className = "" }) {
  return (
    <div className={className}>
      {label && (
        <label className="label">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
      )}
      {children}
      {hint && <p className="hint">{hint}</p>}
    </div>
  );
}

export function SectionCard({ title, description, actions, children, className = "", bodyClass = "p-5" }) {
  return (
    <section className={`card ${className}`}>
      {(title || actions) && (
        <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
            {description && <p className="mt-0.5 text-xs text-slate-400">{description}</p>}
          </div>
          {actions}
        </header>
      )}
      <div className={bodyClass}>{children}</div>
    </section>
  );
}

export function SummaryRow({ label, value, valueClass = "", strong = false }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className={`text-sm ${strong ? "font-semibold text-slate-900" : "text-slate-500"}`}>{label}</span>
      <span className={`text-sm font-semibold tabular-nums text-slate-900 ${strong ? "text-base font-bold" : ""} ${valueClass}`}>{value}</span>
    </div>
  );
}

export const fmtDate = (d) => new Date(d).toLocaleDateString();
export const fmtTime = (d) => new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
