import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import client from "../../api/client";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { PageHeader, PageSpinner, ErrorBanner, EmptyState, Segmented, Pagination, usePagination } from "../../components/ui";

const FILTERS = [
  { key: "all", label: "All Due" },
  { key: "today", label: "Today's Due" },
  { key: "month", label: "This Month" },
  { key: "old", label: "Old Due" },
  { key: "paid", label: "Paid" },
];

export default function DueManagement() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");
  const [customers, setCustomers] = useState([]);
  const [totalDue, setTotalDue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const loadDueList = async () => {
    try {
      const { data } = await client.get("/customers/due/list", { params: { filter } });
      setCustomers(data.customers || []);
      setTotalDue(data.totalDue || 0);
      setLoadError(null);
    } catch (error) {
      setLoadError(error?.friendlyMessage || "Could not load due list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDueList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const pg = usePagination(customers, filter);

  return (
    <div>
      <PageHeader
        title="Due Management"
        subtitle="Track outstanding balances and jump straight to a customer to collect."
        back={
          <button className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-900" onClick={() => navigate("/customers")}>
            <ArrowLeft size={14} /> Customers
          </button>
        }
        actions={<Segmented options={FILTERS} value={filter} onChange={setFilter} />}
      />

      <ErrorBanner className="mb-4">{loadError}</ErrorBanner>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-slate-900 p-5 text-white shadow-card sm:col-span-1">
          <p className="text-xs font-medium text-slate-400">Total in this view</p>
          <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight">৳{totalDue.toFixed(2)}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-medium text-slate-500">Customers in view</p>
          <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-slate-900">{customers.length}</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <PageSpinner className="h-56" />
        ) : customers.length === 0 ? (
          <EmptyState title="No customers in this view" message="Try another due filter above." />
        ) : (
          <>
            <div className="table-scroll max-h-[calc(100vh-420px)] min-h-[280px]">
              <table className="data-table min-w-[560px]">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th className="hidden sm:table-cell">Customer ID</th>
                    <th className="hidden md:table-cell">Last purchase</th>
                    <th className="text-right">Due</th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody>
                  {pg.pageItems.map((item) => (
                    <tr key={item._id} className="row-hover" onClick={() => navigate(`/customers/${item._id}`)}>
                      <td className="font-semibold text-slate-900">{item.customerName}</td>
                      <td className="hidden font-mono text-xs text-slate-500 sm:table-cell">{item.customerId}</td>
                      <td className="hidden text-xs text-slate-500 md:table-cell">
                        {item.lastPurchaseDate ? new Date(item.lastPurchaseDate).toLocaleDateString() : "—"}
                      </td>
                      <td className={`num font-bold ${item.totalDueAmount > 0 ? "text-red-600" : "text-emerald-600"}`}>
                        ৳{item.totalDueAmount.toFixed(2)}
                      </td>
                      <td className="text-slate-300">
                        <ChevronRight size={16} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination pg={pg} />
          </>
        )}
      </div>
    </div>
  );
}
