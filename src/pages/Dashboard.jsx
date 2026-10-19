import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Wallet,
  TrendingUp,
  ShoppingBag,
  Package,
  Layers,
  AlertTriangle,
  PackageX,
  PackageCheck,
  PackagePlus,
  ScanLine,
  ArrowDownToLine,
  ArrowRight,
} from "lucide-react";
import client from "../api/client";
import { PageHeader, PageSpinner, ErrorBanner, StatCard, SectionCard, Badge, EmptyState } from "../components/ui";

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const loadDashboard = async () => {
    try {
      const { data } = await client.get("/transactions/dashboard");
      setStats(data);
      setLoadError(null);
    } catch (error) {
      setLoadError(error?.friendlyMessage || "Could not load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return <PageSpinner />;
  }

  const lowStock = stats?.lowStockItems || [];
  const recent = stats?.recentActivity || [];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="A live overview of your stock, sales and alerts."
        actions={
          <>
            <button className="btn-secondary" onClick={() => navigate("/inventory")}>
              <ArrowDownToLine size={16} /> Stock In
            </button>
            <button className="btn-secondary" onClick={() => navigate("/inventory/add")}>
              <PackagePlus size={16} /> Add Product
            </button>
            <button className="btn-primary" onClick={() => navigate("/scan")}>
              <ScanLine size={16} /> Scan & Sell
            </button>
          </>
        }
      />

      <ErrorBanner className="mb-5">{loadError}</ErrorBanner>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-600 p-6 text-white shadow-card sm:col-span-2">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
          <div className="absolute -bottom-16 right-16 h-40 w-40 rounded-full bg-white/5" />
          <div className="relative">
            <div className="flex items-center gap-2 text-sm font-medium text-indigo-100">
              <Wallet size={16} /> Total Inventory Value
            </div>
            <p className="mt-3 text-4xl font-bold tabular-nums tracking-tight">৳ {stats?.totalInventoryValue?.toFixed(2) ?? "0.00"}</p>
            <p className="mt-1 text-xs text-indigo-200">Across {stats?.totalItems ?? 0} products · {stats?.totalStockUnits ?? 0} units on hand</p>
          </div>
        </div>
        <StatCard label="Today's Revenue" value={`৳ ${stats?.dailyRevenue?.toFixed(2) ?? "0.00"}`} icon={TrendingUp} tone="sky" />
        <StatCard label="Units Sold Today" value={stats?.dailyUnitsSold ?? 0} icon={ShoppingBag} tone="violet" />
        <StatCard label="Total Products" value={stats?.totalItems ?? 0} icon={Package} tone="emerald" />
        <StatCard label="Total Stock Units" value={stats?.totalStockUnits ?? 0} icon={Layers} tone="amber" />
        <StatCard label="Low Stock Count" value={stats?.lowStockCount ?? 0} icon={AlertTriangle} tone="amber" />
        <StatCard label="Out of Stock Count" value={stats?.outOfStockCount ?? 0} icon={PackageX} tone="red" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-5">
        <SectionCard
          className="xl:col-span-2"
          bodyClass="p-0"
          title="Low Stock Alerts"
          description="Products at or below their alert threshold"
          actions={
            <button className="btn-secondary btn-sm" onClick={() => navigate("/inventory")}>
              Open inventory <ArrowRight size={13} />
            </button>
          }
        >
          {lowStock.length ? (
            <div className="table-scroll max-h-[420px]">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th className="text-right">Remaining</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStock.map((item) => (
                    <tr key={item._id}>
                      <td className="font-medium text-slate-900">{item.productName}</td>
                      <td className="num">
                        <Badge tone="red">{item.quantity} left</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState icon={PackageCheck} title="No low stock items 🎉" message="Everything is comfortably above its alert threshold." />
          )}
        </SectionCard>

        <SectionCard
          className="xl:col-span-3"
          bodyClass="p-0"
          title="Recent Activity"
          description="Latest sales and stock-in movements"
          actions={
            <button className="btn-secondary btn-sm" onClick={() => navigate("/history")}>
              Full history <ArrowRight size={13} />
            </button>
          }
        >
          {recent.length ? (
            <div className="table-scroll max-h-[420px]">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Type</th>
                    <th className="hidden sm:table-cell">Date & time</th>
                    <th className="text-right">Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((t) => (
                    <tr key={t._id}>
                      <td className="font-medium text-slate-900">{t.productName}</td>
                      <td>
                        <Badge tone={t.type === "SALE" ? "red" : "green"}>{t.type}</Badge>
                      </td>
                      <td className="hidden text-xs text-slate-400 sm:table-cell">
                        {new Date(t.date).toLocaleDateString()} {new Date(t.date).toLocaleTimeString()}
                      </td>
                      <td className={`num font-bold ${t.type === "SALE" ? "text-red-500" : "text-emerald-600"}`}>
                        {t.type === "SALE" ? `-${t.quantitySold}` : `+${t.quantitySold}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No activity yet" message="Sales and stock-ins will show up here." />
          )}
        </SectionCard>
      </div>
    </div>
  );
}
