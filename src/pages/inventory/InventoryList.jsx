import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import client from "../../api/client";
import StatusBadge from "../../components/StatusBadge";
import RestockModal from "../../components/RestockModal";
import SellModal from "../../components/SellModal";
import PurchaseHistoryModal from "../../components/PurchaseHistoryModal";
import BarcodeScannerModal from "../../components/BarcodeScannerModal";
import useBarcodeWedge from "../../hooks/useBarcodeWedge";
import { useCart } from "../../context/CartContext";
import { getStockStatus } from "../../utils/stockStatus";
import { FILTER_ICONS, ACTION_ICONS } from "../../utils/inventoryIcons";
import { Plus, Search, Package, ScanLine } from "lucide-react";
import { PageHeader, PageSpinner, ErrorBanner, EmptyState, Segmented, SortHeader, Pagination, usePagination } from "../../components/ui";

const STOCK_FILTERS = ["All", "In Stock", "Low Stock", "Out of Stock"];
const SORT_OPTIONS = ["Newest", "Name A-Z", "Quantity Low-High", "Price Low-High"];

export default function InventoryList() {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState("All");
  const [sortBy, setSortBy] = useState("Newest");
  const [loading, setLoading] = useState(true);
  const [restockTarget, setRestockTarget] = useState(null);
  const [sellTarget, setSellTarget] = useState(null);
  const [historyTarget, setHistoryTarget] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState(null);
  const [scannerOpen, setScannerOpen] = useState(false);

  // USB / handheld scanner: scanning anywhere on this page drops the code
  // into the search box, which already matches on barcode. Paused while the
  // camera modal is open (it listens for the scanner itself).
  useBarcodeWedge({
    enabled: !scannerOpen && !restockTarget && !sellTarget && !historyTarget,
    onScan: setSearch,
  });

  const loadProducts = async () => {
    try {
      const { data } = await client.get("/products");
      setProducts(data);
      setError(null);
    } catch (err) {
      setError(err?.friendlyMessage || "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    if (deletingId === id) return;
    setDeletingId(id);
    try {
      await client.delete(`/products/${id}`);
      loadProducts();
    } catch (err) {
      alert(err?.friendlyMessage || "Could not delete product");
    } finally {
      setDeletingId(null);
    }
  };

  const handleRestockConfirm = async (quantityAdded, purchasePrice) => {
    try {
      await client.post("/transactions/restock", {
        productId: restockTarget._id,
        quantityAdded,
        purchasePrice,
      });
      setRestockTarget(null);
      loadProducts();
    } catch (err) {
      alert(err?.friendlyMessage || "Could not add stock");
    }
  };

  const handleSellConfirm = (quantity) => {
    addItem(sellTarget, quantity);
    setSellTarget(null);
  };

  const visibleProducts = useMemo(() => {
    const q = search.trim().toLowerCase();

    let list = products.filter((p) => {
      const matchesSearch =
        !q ||
        p.productName.toLowerCase().includes(q) ||
        (p.category || "").toLowerCase().includes(q) ||
        (p.barcode || "").toLowerCase().includes(q);

      if (!matchesSearch) return false;

      const status = getStockStatus(p);
      if (stockFilter === "In Stock") return status === "IN_STOCK";
      if (stockFilter === "Low Stock") return status === "LOW_STOCK";
      if (stockFilter === "Out of Stock") return status === "OUT_OF_STOCK";
      return true;
    });

    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case "Name A-Z":
          return a.productName.localeCompare(b.productName);
        case "Quantity Low-High":
          return a.quantity - b.quantity;
        case "Price Low-High": {
          const costA = a.avgCostPrice > 0 ? a.avgCostPrice : a.unitPrice;
          const costB = b.avgCostPrice > 0 ? b.avgCostPrice : b.unitPrice;
          return costA - costB;
        }
        case "Newest":
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

    return list;
  }, [products, search, stockFilter, sortBy]);

  const pg = usePagination(visibleProducts, `${search}|${stockFilter}|${sortBy}`);

  const filterOptions = STOCK_FILTERS.map((f) => ({ key: f, label: f, icon: FILTER_ICONS[f] }));
  const countFor = (f) =>
    f === "All"
      ? products.length
      : products.filter((p) => getStockStatus(p) === { "In Stock": "IN_STOCK", "Low Stock": "LOW_STOCK", "Out of Stock": "OUT_OF_STOCK" }[f]).length;
  const totalValue = visibleProducts.reduce((sum, p) => sum + (p.avgCostPrice > 0 ? p.avgCostPrice : p.unitPrice) * p.quantity, 0);

  return (
    <div>
      <PageHeader
        title="Inventory"
        subtitle={`${products.length} product${products.length === 1 ? "" : "s"} in stock catalogue`}
        actions={
          <button className="btn-primary" onClick={() => navigate("/inventory/add")}>
            <Plus size={16} /> Add Product
          </button>
        }
      />

      <ErrorBanner className="mb-4">{error}</ErrorBanner>

      <div className="card overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex w-full items-center gap-2 xl:max-w-md">
            <div className="relative flex-1">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className="input pl-9"
                placeholder="Search by name, category, or barcode..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="btn-secondary !border-indigo-200 !text-brand hover:!bg-brand-50"
              onClick={() => setScannerOpen(true)}
              title="Scan a barcode with the camera"
            >
              <ScanLine size={16} />
              <span className="hidden sm:inline">Scan</span>
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Segmented options={filterOptions} value={stockFilter} onChange={setStockFilter} />
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              Sort
              <select className="input w-auto py-1.5" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                {SORT_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {/* Summary strip */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 border-b border-slate-100 bg-slate-50/60 px-4 py-2 text-xs text-slate-500">
          <span>
            <span className="font-semibold text-slate-700">{visibleProducts.length}</span> matching
          </span>
          <span>
            In stock <span className="font-semibold text-slate-700">{countFor("In Stock")}</span>
          </span>
          <span>
            Low <span className="font-semibold text-amber-600">{countFor("Low Stock")}</span>
          </span>
          <span>
            Out <span className="font-semibold text-red-600">{countFor("Out of Stock")}</span>
          </span>
          <span className="ml-auto">
            Stock value (view) <span className="font-semibold tabular-nums text-slate-700">৳{totalValue.toFixed(2)}</span>
          </span>
        </div>

        {loading ? (
          <PageSpinner className="h-56" />
        ) : visibleProducts.length === 0 ? (
          <EmptyState
            icon={Package}
            title={products.length === 0 ? "No products yet" : "No products match your search/filter"}
            message={products.length === 0 ? "Add your first product to start tracking stock." : "Try a different keyword or clear the filter."}
          />
        ) : (
          <>
            <div className="table-scroll max-h-[calc(100vh-390px)] min-h-[320px]">
              <table className="data-table min-w-[760px]">
                <thead>
                  <tr>
                    <SortHeader label="Product" active={sortBy === "Name A-Z"} onClick={() => setSortBy("Name A-Z")} />
                    <th className="hidden xl:table-cell">Barcode</th>
                    <th>Status</th>
                    <SortHeader label="Qty" align="right" active={sortBy === "Quantity Low-High"} onClick={() => setSortBy("Quantity Low-High")} />
                    <SortHeader label="Avg Cost" align="right" className="hidden md:table-cell" active={sortBy === "Price Low-High"} onClick={() => setSortBy("Price Low-High")} />
                    <th className="hidden text-right md:table-cell">Stock Value</th>
                    <SortHeader label="Added" className="hidden 2xl:table-cell" active={sortBy === "Newest"} dir="desc" onClick={() => setSortBy("Newest")} />
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pg.pageItems.map((item) => {
                    const status = getStockStatus(item);
                    const isDeleting = deletingId === item._id;
                    const cost = item.avgCostPrice > 0 ? item.avgCostPrice : item.unitPrice;
                    return (
                      <tr key={item._id}>
                        <td className="max-w-[320px]">
                          <p className="truncate font-semibold text-slate-900">{item.productName}</p>
                          <p className="truncate text-xs text-slate-400">{item.category || "General"}</p>
                        </td>
                        <td className="hidden font-mono text-xs text-slate-500 xl:table-cell">{item.barcode || "—"}</td>
                        <td>
                          <StatusBadge status={status} />
                        </td>
                        <td className="num font-semibold text-slate-900">{item.quantity}</td>
                        <td className="num hidden md:table-cell">৳{cost.toFixed(2)}</td>
                        <td className="num hidden font-semibold text-slate-900 md:table-cell">৳{(cost * item.quantity).toFixed(2)}</td>
                        <td className="hidden whitespace-nowrap text-xs text-slate-400 2xl:table-cell">
                          {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "—"}
                        </td>
                        <td>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              className="btn-secondary btn-sm !border-emerald-200 !text-emerald-700 hover:!bg-emerald-50"
                              onClick={() => setRestockTarget(item)}
                              title="Stock In"
                            >
                              <ACTION_ICONS.stockIn size={14} /> <span className="hidden lg:inline">Stock In</span>
                            </button>
                            <button
                              className="btn-primary btn-sm"
                              onClick={() => setSellTarget(item)}
                              disabled={status === "OUT_OF_STOCK"}
                              title="Sell"
                            >
                              <ACTION_ICONS.sell size={14} /> <span className="hidden lg:inline">Sell</span>
                            </button>
                            <button className="btn-icon" onClick={() => setHistoryTarget(item)} title="Purchase History">
                              <ACTION_ICONS.history size={16} />
                            </button>
                            <button
                              className="btn-icon"
                              onClick={() => navigate(`/inventory/edit/${item._id}`, { state: { product: item } })}
                              title="Edit"
                            >
                              <ACTION_ICONS.edit size={16} />
                            </button>
                            <button
                              className="btn-icon hover:!bg-red-50 hover:!text-red-600"
                              onClick={() => handleDelete(item._id)}
                              disabled={isDeleting}
                              title="Delete"
                            >
                              <ACTION_ICONS.delete size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination pg={pg} />
          </>
        )}
      </div>

      <RestockModal
        visible={!!restockTarget}
        product={restockTarget}
        onClose={() => setRestockTarget(null)}
        onConfirm={handleRestockConfirm}
      />
      <SellModal visible={!!sellTarget} product={sellTarget} onClose={() => setSellTarget(null)} onConfirm={handleSellConfirm} />
      <PurchaseHistoryModal visible={!!historyTarget} product={historyTarget} onClose={() => setHistoryTarget(null)} />
      <BarcodeScannerModal
        visible={scannerOpen}
        onClose={() => setScannerOpen(false)}
        title="Scan to search"
        onDetected={(code) => {
          setScannerOpen(false);
          setSearch(code);
        }}
      />
    </div>
  );
}
