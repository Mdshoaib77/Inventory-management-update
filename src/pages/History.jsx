import React, { useState, useEffect } from "react";
import client from "../api/client";
import InvoiceModal from "../components/InvoiceModal";
import { TrendingUp, ShoppingBag, PackagePlus, Package, Percent, Wallet, PiggyBank, ChevronRight, ChevronDown } from "lucide-react";
import { PageHeader, PageSpinner, ErrorBanner, EmptyState, StatCard, Badge, Segmented, Tabs, Pagination, usePagination } from "../components/ui";

const VIEW_MODES = ["Stock Log", "Sales History", "Revenue & Profit"];
const TYPE_FILTERS = ["All", "Sales", "Restock"];
const PERIOD_FILTERS = ["Today", "7 Days", "30 Days", "All"];

function periodToDateRange(period) {
  if (period === "All") return {};
  const to = new Date();
  const from = new Date();
  if (period === "Today") from.setHours(0, 0, 0, 0);
  else if (period === "7 Days") from.setDate(from.getDate() - 7);
  else if (period === "30 Days") from.setDate(from.getDate() - 30);
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
}

export default function History() {
  const [viewMode, setViewMode] = useState("Stock Log");
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ salesRevenue: 0, unitsSold: 0, unitsRestocked: 0 });
  const [typeFilter, setTypeFilter] = useState("All");
  const [period, setPeriod] = useState("30 Days");

  const [sales, setSales] = useState([]);
  const [selectedSaleDetail, setSelectedSaleDetail] = useState(null);
  const [loadingSaleDetail, setLoadingSaleDetail] = useState(false);

  const [revenueData, setRevenueData] = useState({
    totalStockPurchaseCost: 0,
    totalRevenue: 0,
    totalDiscount: 0,
    totalBaseProfit: 0,
    totalNetProfit: 0,
    sales: [],
  });

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const loadStockLog = async () => {
    const params = {};
    if (typeFilter === "Sales") params.type = "SALE";
    if (typeFilter === "Restock") params.type = "RESTOCK";
    Object.assign(params, periodToDateRange(period));

    const { data } = await client.get("/transactions/history", { params });
    setTransactions(data.transactions || []);
    setSummary(data.summary || { salesRevenue: 0, unitsSold: 0, unitsRestocked: 0 });
  };

  const loadSalesHistory = async () => {
    const params = {};
    const range = periodToDateRange(period);
    if (range.from) params.from = range.from;
    if (range.to) params.to = range.to;

    const { data } = await client.get("/sales", { params });
    setSales(data || []);
  };

  const loadRevenueProfit = async () => {
    const params = {};
    const range = periodToDateRange(period);
    if (range.from) params.from = range.from;
    if (range.to) params.to = range.to;

    const { data } = await client.get("/sales/analytics/revenue-profit", { params });
    setRevenueData({
      totalStockPurchaseCost: data.totalStockPurchaseCost || 0,
      totalRevenue: data.totalRevenue || 0,
      totalDiscount: data.totalDiscount || 0,
      totalBaseProfit: data.totalBaseProfit || 0,
      totalNetProfit: data.totalNetProfit || 0,
      sales: data.sales || [],
    });
  };

  const loadHistory = async () => {
    setLoading(true);
    try {
      if (viewMode === "Stock Log") await loadStockLog();
      else if (viewMode === "Sales History") await loadSalesHistory();
      else await loadRevenueProfit();
      setLoadError(null);
    } catch (error) {
      setLoadError(error?.friendlyMessage || "Could not load history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter, period, viewMode]);

  const handleOpenSale = async (saleId) => {
    setLoadingSaleDetail(true);
    try {
      const { data: detail } = await client.get(`/sales/${saleId}`);
      setSelectedSaleDetail(detail);
    } catch (error) {
      alert(error?.friendlyMessage || "Could not load invoice");
    } finally {
      setLoadingSaleDetail(false);
    }
  };

  const [expandedSale, setExpandedSale] = useState(null);
  const pgStock = usePagination(transactions, `${typeFilter}|${period}|${viewMode}`);
  const pgSales = usePagination(sales, `${period}|${viewMode}`);
  const pgRevenue = usePagination(revenueData.sales, `${period}|${viewMode}`);

  const statusTone = (s) => (s === "PAID" ? "green" : s === "PARTIAL" ? "amber" : "red");
  const dateCell = (d) => (
    <>
      <span className="text-slate-700">{new Date(d).toLocaleDateString()}</span>
      <span className="ml-1.5 text-xs text-slate-400">{new Date(d).toLocaleTimeString()}</span>
    </>
  );

  return (
    <div>
      <PageHeader title="Reports & History" subtitle="Stock movements, sales invoices, and revenue & profit." />

      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <Tabs options={VIEW_MODES} value={viewMode} onChange={setViewMode} />
        <div className="flex flex-wrap items-center gap-3">
          {viewMode === "Stock Log" && <Segmented options={TYPE_FILTERS} value={typeFilter} onChange={setTypeFilter} />}
          <Segmented options={PERIOD_FILTERS} value={period} onChange={setPeriod} />
        </div>
      </div>

      {viewMode === "Stock Log" && (
        <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Sales Revenue" value={`৳${summary.salesRevenue.toFixed(2)}`} icon={TrendingUp} tone="sky" />
          <StatCard label="Units Sold" value={summary.unitsSold} icon={ShoppingBag} tone="violet" />
          <StatCard label="Units Restocked" value={summary.unitsRestocked} icon={PackagePlus} tone="emerald" />
        </div>
      )}

      {viewMode === "Revenue & Profit" && (
        <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard label="Stock Purchase Cost" value={`৳${revenueData.totalStockPurchaseCost.toFixed(2)}`} icon={Package} tone="slate" />
          <StatCard label="Total Revenue" value={`৳${revenueData.totalRevenue.toFixed(2)}`} icon={TrendingUp} tone="sky" />
          <StatCard label="Total Discount Issued" value={`৳${revenueData.totalDiscount.toFixed(2)}`} icon={Percent} tone="amber" />
          <StatCard
            label="Base Profit (pre-discount)"
            value={`৳${revenueData.totalBaseProfit.toFixed(2)}`}
            icon={Wallet}
            tone="violet"
            valueClass={revenueData.totalBaseProfit < 0 ? "!text-red-700" : ""}
          />
          <StatCard
            label="Net Profit"
            value={`৳${revenueData.totalNetProfit.toFixed(2)}`}
            icon={PiggyBank}
            tone={revenueData.totalNetProfit < 0 ? "red" : "emerald"}
            valueClass={revenueData.totalNetProfit < 0 ? "!text-red-700" : ""}
          />
        </div>
      )}

      <ErrorBanner className="mb-4">{loadError}</ErrorBanner>

      <div className="card overflow-hidden">
        {loading ? (
          <PageSpinner className="h-56" />
        ) : viewMode === "Stock Log" ? (
          transactions.length === 0 ? (
            <EmptyState title="No transactions for this period" message="Try widening the period or type filter." />
          ) : (
            <>
              <div className="table-scroll max-h-[calc(100vh-430px)] min-h-[300px]">
                <table className="data-table min-w-[640px]">
                  <thead>
                    <tr>
                      <th>Date & time</th>
                      <th>Product</th>
                      <th>Type</th>
                      <th className="text-right">Units</th>
                      <th className="text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pgStock.pageItems.map((item) => (
                      <tr key={item._id}>
                        <td className="whitespace-nowrap">{dateCell(item.date)}</td>
                        <td className="font-semibold text-slate-900">{item.productName}</td>
                        <td>
                          <Badge tone={item.type === "SALE" ? "red" : "green"}>{item.type}</Badge>
                        </td>
                        <td className={`num font-semibold ${item.type === "SALE" ? "text-red-500" : "text-emerald-600"}`}>
                          {item.type === "SALE" ? "-" : "+"}
                          {item.quantitySold}
                        </td>
                        <td className="num font-bold text-slate-900">
                          {item.type === "SALE" ? `৳ ${item.totalAmount.toFixed(2)}` : <span className="font-normal text-slate-300">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination pg={pgStock} />
            </>
          )
        ) : viewMode === "Sales History" ? (
          sales.length === 0 ? (
            <EmptyState title="No sales for this period" message="Completed sales appear here with their invoice numbers." />
          ) : (
            <>
              <div className="table-scroll max-h-[calc(100vh-380px)] min-h-[300px]">
                <table className="data-table min-w-[760px]">
                  <thead>
                    <tr>
                      <th>Invoice</th>
                      <th>Customer</th>
                      <th className="hidden md:table-cell">Date & time</th>
                      <th>Status</th>
                      <th className="text-right">Total</th>
                      <th className="hidden text-right lg:table-cell">Paid</th>
                      <th className="text-right">Due</th>
                      <th className="w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {pgSales.pageItems.map((item) => (
                      <tr
                        key={item._id}
                        className={`row-hover ${loadingSaleDetail ? "opacity-60" : ""}`}
                        onClick={() => {
                          if (!loadingSaleDetail) handleOpenSale(item._id);
                        }}
                      >
                        <td className="font-semibold text-slate-900">{item.invoiceNumber}</td>
                        <td>
                          <p className="text-slate-800">{item.customer?.customerName || "Walk-in"}</p>
                          {!!item.customer?.mobileNumber && <p className="text-xs text-slate-400">{item.customer.mobileNumber}</p>}
                        </td>
                        <td className="hidden whitespace-nowrap md:table-cell">{dateCell(item.date)}</td>
                        <td>
                          <Badge tone={statusTone(item.status)}>{item.status}</Badge>
                        </td>
                        <td className="num font-bold text-slate-900">৳ {item.totalAmount.toFixed(2)}</td>
                        <td className="num hidden text-emerald-600 lg:table-cell">৳{item.paidAmount.toFixed(2)}</td>
                        <td className={`num ${item.dueAmount > 0 ? "font-bold text-red-600" : "text-slate-300"}`}>
                          {item.dueAmount > 0 ? `৳${item.dueAmount.toFixed(2)}` : "—"}
                        </td>
                        <td className="text-slate-300">
                          <ChevronRight size={16} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination pg={pgSales} />
            </>
          )
        ) : revenueData.sales.length === 0 ? (
          <EmptyState title="No sales for this period" message="Profit analytics appear once sales are recorded." />
        ) : (
          <>
            <div className="table-scroll max-h-[calc(100vh-460px)] min-h-[300px]">
              <table className="data-table min-w-[900px]">
                <thead>
                  <tr>
                    <th className="w-8" />
                    <th>Invoice</th>
                    <th>Customer</th>
                    <th>Status</th>
                    <th className="text-right">Subtotal</th>
                    <th className="text-right">Discount</th>
                    <th className="text-right">Revenue</th>
                    <th className="text-right">Base Profit</th>
                    <th className="text-right">Net Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {pgRevenue.pageItems.map((item) => {
                    const open = expandedSale === item.saleId;
                    return (
                      <React.Fragment key={item.saleId}>
                        <tr className="row-hover" onClick={() => setExpandedSale(open ? null : item.saleId)}>
                          <td className="text-slate-400">
                            <ChevronDown size={16} className={`transition-transform ${open ? "rotate-180" : ""}`} />
                          </td>
                          <td>
                            <p className="font-semibold text-slate-900">{item.invoiceNumber}</p>
                            <p className="text-xs text-slate-400">
                              {new Date(item.date).toLocaleDateString()} {new Date(item.date).toLocaleTimeString()}
                            </p>
                          </td>
                          <td>
                            <p className="text-slate-800">{item.customerName}</p>
                            {!!item.mobileNumber && <p className="text-xs text-slate-400">{item.mobileNumber}</p>}
                          </td>
                          <td>
                            <Badge tone={statusTone(item.status)}>{item.status}</Badge>
                          </td>
                          <td className="num">৳{item.subtotal.toFixed(2)}</td>
                          <td className={`num ${item.discount > 0 ? "text-red-600" : "text-slate-300"}`}>
                            {item.discount > 0 ? `- ৳${item.discount.toFixed(2)}` : "—"}
                          </td>
                          <td className="num font-semibold text-slate-900">৳{item.revenue.toFixed(2)}</td>
                          <td className={`num ${item.baseProfit < 0 ? "text-red-600" : ""}`}>৳{item.baseProfit.toFixed(2)}</td>
                          <td className={`num font-bold ${item.profit >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                            {item.profit >= 0 ? "" : "-"}৳{Math.abs(item.profit).toFixed(2)}
                          </td>
                        </tr>
                        {open && (
                          <tr>
                            <td colSpan={9} className="!bg-slate-50/70 !p-0">
                              <div className="px-6 py-4">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                      <th className="pb-2 pr-4">Item</th>
                                      <th className="pb-2 pr-4 text-right">Qty</th>
                                      <th className="pb-2 pr-4 text-right">Avg Cost</th>
                                      <th className="pb-2 pr-4 text-right">Sell Price</th>
                                      <th className="pb-2 pr-4 text-right">Revenue</th>
                                      <th className="pb-2 text-right">Profit / Loss</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {item.items.map((li, idx) => {
                                      const hasCost = li.avgCostAtSale !== undefined && li.avgCostAtSale !== null;
                                      return (
                                        <tr key={`${item.saleId}-${idx}`} className="border-t border-slate-200/70">
                                          <td className="py-2 pr-4 font-semibold text-slate-800">{li.productName}</td>
                                          <td className="py-2 pr-4 text-right tabular-nums">× {li.quantity}</td>
                                          <td className="py-2 pr-4 text-right tabular-nums text-slate-500">{hasCost ? `৳${li.avgCostAtSale.toFixed(2)}` : "—"}</td>
                                          <td className="py-2 pr-4 text-right tabular-nums text-slate-500">৳{li.sellPrice.toFixed(2)}</td>
                                          <td className="py-2 pr-4 text-right tabular-nums">৳{li.itemRevenue.toFixed(2)}</td>
                                          <td className={`py-2 text-right font-bold tabular-nums ${li.itemBaseProfit < 0 ? "text-red-600" : "text-emerald-600"}`}>
                                            {li.itemBaseProfit >= 0 ? "Profit" : "Loss"} ৳{Math.abs(li.itemBaseProfit).toFixed(2)}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                                <div className="mt-3 flex flex-wrap justify-end gap-x-8 gap-y-1 border-t border-slate-200 pt-3 text-sm">
                                  <span className="text-slate-500">
                                    Final Paid (Revenue) <span className="font-bold tabular-nums text-slate-900">৳{item.revenue.toFixed(2)}</span>
                                  </span>
                                  <span className="text-slate-500">
                                    Net {item.profit >= 0 ? "Profit" : "Loss"} (after discount){" "}
                                    <span className={`font-bold tabular-nums ${item.profit >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                                      ৳{Math.abs(item.profit).toFixed(2)}
                                    </span>
                                  </span>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination pg={pgRevenue} />
          </>
        )}
      </div>

      <InvoiceModal
        visible={!!selectedSaleDetail}
        sale={selectedSaleDetail?.sale}
        customer={selectedSaleDetail?.customer}
        lineItems={selectedSaleDetail?.lineItems?.map((t) => ({
          productId: t.productId,
          productName: t.productName,
          quantity: t.quantitySold,
          unitPrice: t.unitPrice,
          lineTotal: t.totalAmount,
          costPriceAtSale: t.costPriceAtSale,
        }))}
        payments={selectedSaleDetail?.payments}
        onClose={() => setSelectedSaleDetail(null)}
      />
    </div>
  );
}
