import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import client from "../../api/client";
import CustomerTypeBadge from "../../components/CustomerTypeBadge";
import { CUSTOMER_TYPES } from "../../utils/customerType";
import { Plus, Search, Users, ClipboardList, Phone, Building2, ChevronRight } from "lucide-react";
import { PageHeader, PageSpinner, ErrorBanner, EmptyState, Segmented, SortHeader, Pagination, Badge, usePagination } from "../../components/ui";

const TYPE_FILTERS = ["All", ...CUSTOMER_TYPES];

export default function CustomerList() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadCustomers = async () => {
    try {
      const { data } = await client.get("/customers");
      setCustomers(data);
      setError(null);
    } catch (err) {
      setError(err?.friendlyMessage || "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const visibleCustomers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return customers.filter((c) => {
      const matchesSearch =
        !q ||
        c.customerName.toLowerCase().includes(q) ||
        (c.customerId || "").toLowerCase().includes(q) ||
        (c.mobileNumber || "").toLowerCase().includes(q) ||
        (c.companyName || "").toLowerCase().includes(q);

      if (!matchesSearch) return false;
      if (typeFilter === "All") return true;
      return c.customerType === typeFilter;
    });
  }, [customers, search, typeFilter]);

  const [sortKey, setSortKey] = useState("name");
  const [sortDir, setSortDir] = useState("asc");

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir(key === "name" ? "asc" : "desc");
    }
  };

  const sortedCustomers = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    return [...visibleCustomers].sort((a, b) => {
      if (sortKey === "purchases") return ((a.totalPurchases || 0) - (b.totalPurchases || 0)) * dir;
      if (sortKey === "due") return ((a.totalDueAmount || 0) - (b.totalDueAmount || 0)) * dir;
      return a.customerName.localeCompare(b.customerName) * dir;
    });
  }, [visibleCustomers, sortKey, sortDir]);

  const pg = usePagination(sortedCustomers, `${search}|${typeFilter}|${sortKey}|${sortDir}`);
  const totalDueInView = visibleCustomers.reduce((sum, c) => sum + (c.totalDueAmount || 0), 0);

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle={`${customers.length} customer${customers.length === 1 ? "" : "s"} on record`}
        actions={
          <>
            <button className="btn-secondary !border-red-200 !text-red-700 hover:!bg-red-50" onClick={() => navigate("/customers/due")}>
              <ClipboardList size={16} /> Due Management
            </button>
            <button className="btn-primary" onClick={() => navigate("/customers/add")}>
              <Plus size={16} /> Add Customer
            </button>
          </>
        }
      />

      <ErrorBanner className="mb-4">{error}</ErrorBanner>

      <div className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative w-full xl:max-w-md">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="input pl-9"
              placeholder="Search by name, ID, phone, or company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Segmented options={TYPE_FILTERS} value={typeFilter} onChange={setTypeFilter} />
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 border-b border-slate-100 bg-slate-50/60 px-4 py-2 text-xs text-slate-500">
          <span>
            <span className="font-semibold text-slate-700">{visibleCustomers.length}</span> matching
          </span>
          <span className="ml-auto">
            Outstanding due (view) <span className="font-semibold tabular-nums text-red-600">৳{totalDueInView.toFixed(2)}</span>
          </span>
        </div>

        {loading ? (
          <PageSpinner className="h-56" />
        ) : visibleCustomers.length === 0 ? (
          <EmptyState
            icon={Users}
            title={customers.length === 0 ? "No customers yet" : "No customers match your search/filter"}
            message={customers.length === 0 ? "Customers are created automatically at checkout, or add one manually." : "Try a different keyword or clear the filter."}
          />
        ) : (
          <>
            <div className="table-scroll max-h-[calc(100vh-390px)] min-h-[320px]">
              <table className="data-table min-w-[720px]">
                <thead>
                  <tr>
                    <SortHeader label="Customer" active={sortKey === "name"} dir={sortDir} onClick={() => toggleSort("name")} />
                    <th className="hidden md:table-cell">Contact</th>
                    <th>Type</th>
                    <SortHeader label="Purchases" align="right" active={sortKey === "purchases"} dir={sortDir} onClick={() => toggleSort("purchases")} />
                    <SortHeader label="Due" align="right" active={sortKey === "due"} dir={sortDir} onClick={() => toggleSort("due")} />
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody>
                  {pg.pageItems.map((item) => (
                    <tr key={item._id} className="row-hover" onClick={() => navigate(`/customers/${item._id}`)}>
                      <td className="max-w-[300px]">
                        <p className="truncate font-semibold text-slate-900">{item.customerName}</p>
                        <p className="truncate text-xs text-slate-400">{item.customerId}</p>
                      </td>
                      <td className="hidden md:table-cell">
                        {!!item.mobileNumber && <p className="flex items-center gap-1.5 text-xs text-slate-600"><Phone size={12} className="text-slate-400" /> {item.mobileNumber}</p>}
                        {!!item.companyName && <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500"><Building2 size={12} className="text-slate-400" /> {item.companyName}</p>}
                        {!item.mobileNumber && !item.companyName && <span className="text-slate-300">—</span>}
                      </td>
                      <td>
                        <CustomerTypeBadge type={item.customerType} />
                      </td>
                      <td className="num">{item.totalPurchases || 0}</td>
                      <td className="num">
                        {item.totalDueAmount > 0 ? (
                          <span className="font-bold text-red-600">৳{item.totalDueAmount.toFixed(2)}</span>
                        ) : (
                          <Badge tone="green">No Due</Badge>
                        )}
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
