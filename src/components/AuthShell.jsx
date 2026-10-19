import React from "react";
import { PackageCheck, BarChart3, ScanLine, Users } from "lucide-react";

const FEATURES = [
  { icon: PackageCheck, text: "Real-time stock levels with low-stock alerts" },
  { icon: ScanLine, text: "Barcode scan-and-sell checkout" },
  { icon: Users, text: "Customer profiles, dues and payment reminders" },
  { icon: BarChart3, text: "Revenue and profit reports at a glance" },
];

// Split-screen shell for Login / Register: brand panel on large screens,
// form card everywhere. Presentation only.
export default function AuthShell({ children, wide = false }) {
  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-base font-extrabold shadow-lg">H</div>
          <span className="text-lg font-bold tracking-tight">HisabKhata</span>
        </div>
        <div className="relative max-w-lg">
          <h2 className="text-4xl font-bold leading-tight tracking-tight">Run your shop's stock and sales from one clean workspace.</h2>
          <p className="mt-4 text-base text-slate-300">Smart stock and inventory management built for busy counters and back offices.</p>
          <ul className="mt-10 space-y-4">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-slate-200">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/10">
                  <Icon size={17} />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-slate-500">© HisabKhata</p>
      </aside>

      <main className="flex items-center justify-center px-6 py-12">
        <div className={`w-full ${wide ? "max-w-md" : "max-w-sm"}`}>
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-sm font-extrabold text-white">H</div>
            <span className="text-lg font-bold tracking-tight text-slate-900">HisabKhata</span>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
