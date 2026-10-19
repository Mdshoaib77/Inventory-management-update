import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Users,
  ScanLine,
  Receipt,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  ShoppingCart,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import CartBar from "./CartBar";

// Same 5 sections as before — now with consistent line icons instead of
// emoji, laid out as a collapsible sidebar on desktop and a bottom tab bar
// on small screens.
const TABS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/inventory", label: "Inventory", icon: Package },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/scan", label: "Scan & Sell", icon: ScanLine, short: "Scan" },
  { to: "/history", label: "History", icon: Receipt },
];

const PAGE_TITLES = [
  ["/inventory/add", "Add Product"],
  ["/inventory/edit", "Edit Product"],
  ["/inventory", "Inventory"],
  ["/customers/add", "Add Customer"],
  ["/customers/edit", "Edit Customer"],
  ["/customers/due", "Due Management"],
  ["/customers", "Customers"],
  ["/scan", "Scan & Sell"],
  ["/checkout", "Checkout"],
  ["/history", "Reports & History"],
  ["/dashboard", "Dashboard"],
];

const COLLAPSE_KEY = "hk.sidebar.collapsed";

function readCollapsed() {
  try {
    return window.localStorage.getItem(COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}

function SidebarLink({ tab, collapsed }) {
  const Icon = tab.icon;
  return (
    <NavLink
      to={tab.to}
      title={collapsed ? tab.label : undefined}
      className={({ isActive }) =>
        `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
          collapsed ? "justify-center" : ""
        } ${isActive ? "bg-brand-50 text-brand" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"}`
      }
    >
      <Icon size={18} className="shrink-0" />
      {!collapsed && <span className="truncate">{tab.label}</span>}
    </NavLink>
  );
}

function TabLink({ tab }) {
  const Icon = tab.icon;
  return (
    <NavLink
      to={tab.to}
      className={({ isActive }) =>
        `flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-semibold ${
          isActive ? "text-brand" : "text-slate-400"
        }`
      }
    >
      <Icon size={20} />
      <span>{tab.short || tab.label}</span>
    </NavLink>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(readCollapsed);

  useEffect(() => {
    try {
      window.localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0");
    } catch {
      // Storage unavailable — the sidebar simply won't remember its state.
    }
  }, [collapsed]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const pageTitle = (PAGE_TITLES.find(([prefix]) => location.pathname.startsWith(prefix)) || [])[1] || "HisabKhata";
  const initial = (user?.shopName || user?.email || "H").trim().charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-[#F6F7F9] md:flex">
      {/* Sidebar (desktop / laptop) */}
      <aside
        className={`sticky top-0 hidden h-screen flex-shrink-0 flex-col border-r border-slate-200 bg-white transition-[width] duration-200 md:flex ${
          collapsed ? "w-[76px]" : "w-64"
        }`}
      >
        <div className={`flex h-16 items-center border-b border-slate-100 ${collapsed ? "justify-center" : "gap-3 px-5"}`}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand text-sm font-extrabold text-white shadow-sm">
            H
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-[15px] font-bold leading-tight tracking-tight text-slate-900">HisabKhata</p>
              <p className="truncate text-[11px] text-slate-400">{user?.shopName}</p>
            </div>
          )}
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
          {!collapsed && <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Workspace</p>}
          {TABS.map((tab) => (
            <SidebarLink key={tab.to} tab={tab} collapsed={collapsed} />
          ))}
        </nav>

        <div className="border-t border-slate-100 p-3">
          <button
            onClick={() => setCollapsed((c) => !c)}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 ${
              collapsed ? "justify-center" : ""
            }`}
          >
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            {!collapsed && <span>Collapse</span>}
          </button>
          <button
            onClick={handleLogout}
            title={collapsed ? "Logout" : undefined}
            className={`mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-red-500 transition hover:bg-red-50 ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <LogOut size={18} />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Sticky top bar (all sizes) */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white/85 px-4 backdrop-blur md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand text-xs font-extrabold text-white md:hidden">
              H
            </div>
            <h2 className="truncate text-[15px] font-semibold text-slate-900">{pageTitle}</h2>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <button
              className="relative hidden items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 sm:inline-flex"
              onClick={() => navigate("/checkout")}
            >
              <ShoppingCart size={15} />
              Cart
              {itemCount > 0 && (
                <span className="rounded-full bg-brand px-1.5 text-[10px] font-bold leading-4 text-white">{itemCount}</span>
              )}
            </button>
            <button className="btn-primary hidden sm:inline-flex" onClick={() => navigate("/scan")}>
              <ScanLine size={16} /> Scan & Sell
            </button>
            <div className="hidden h-8 w-px bg-slate-200 md:block" />
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand">{initial}</div>
              <div className="hidden min-w-0 lg:block">
                <p className="max-w-[180px] truncate text-[13px] font-semibold leading-tight text-slate-800">{user?.shopName}</p>
                <p className="max-w-[180px] truncate text-[11px] text-slate-400">{user?.email}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="btn-icon text-red-500 hover:bg-red-50 hover:text-red-600 md:hidden" title="Logout">
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-page flex-1 px-4 pb-24 pt-6 md:px-8 md:pb-10">
          <Outlet />
        </main>

        {/* Mobile bottom tab bar */}
        <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-slate-200 bg-white md:hidden">
          {TABS.map((tab) => (
            <TabLink key={tab.to} tab={tab} />
          ))}
        </nav>
      </div>

      <CartBar />
    </div>
  );
}
