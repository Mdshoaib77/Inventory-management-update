import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import client from "../../api/client";
import CustomerTypeBadge from "../../components/CustomerTypeBadge";
import AddPaymentModal from "../../components/AddPaymentModal";
import ReminderModal from "../../components/ReminderModal";
import InvoiceModal from "../../components/InvoiceModal";
import { useCart } from "../../context/CartContext";
import {
  ArrowLeft, Bell, HandCoins, ShoppingCart, ShoppingBag, Phone, MessageCircle, Mail, Building2, MapPin,
  Pencil, Trash2, Receipt, CheckCircle2, AlertCircle,
} from "lucide-react";
import { PageHeader, SectionCard, StatCard, Badge, EmptyState, PageSpinner } from "../../components/ui";

export default function CustomerProfile() {
  const { id: customerId } = useParams();
  const navigate = useNavigate();
  const { clearCart, setPresetCustomer } = useCart();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [selectedSaleDetail, setSelectedSaleDetail] = useState(null);
  const [loadingSaleDetail, setLoadingSaleDetail] = useState(false);
  const [reminderVisible, setReminderVisible] = useState(false);
  const [reminderLoading, setReminderLoading] = useState(false);
  const [reminder, setReminder] = useState(null);

  const loadProfile = async () => {
    try {
      const { data: profile } = await client.get(`/customers/${customerId}`);
      setData(profile);
    } catch (error) {
      alert(error?.friendlyMessage || "Could not load customer");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  const handleDelete = async () => {
    if (!window.confirm("This also removes their purchase and payment history. This cannot be undone. Continue?")) return;
    if (deleting) return;
    setDeleting(true);
    try {
      await client.delete(`/customers/${customerId}`);
      navigate("/customers");
    } catch (error) {
      alert(error?.friendlyMessage || "Could not delete customer");
    } finally {
      setDeleting(false);
    }
  };

  const handleCollectPayment = async ({ paymentAmount, paymentMethod, paymentNote }) => {
    try {
      await client.post(`/customers/${customerId}/payments`, { paymentAmount, paymentMethod, paymentNote });
      setPaymentModalVisible(false);
      loadProfile();
    } catch (error) {
      alert(error?.friendlyMessage || error?.response?.data?.message || "Could not record payment");
    }
  };

  const handleOpenReminder = async () => {
    setReminderVisible(true);
    setReminderLoading(true);
    try {
      const { data: r } = await client.get(`/customers/${customerId}/reminder`);
      setReminder(r);
    } catch (error) {
      alert(error?.friendlyMessage || "Could not prepare reminder");
      setReminderVisible(false);
    } finally {
      setReminderLoading(false);
    }
  };

  // "New Sale" starts the unified Cart -> Checkout flow pre-filled for
  // this customer — every purchase, from here or from Inventory/Scan,
  // goes through the same Checkout page.
  const handleStartNewSale = () => {
    clearCart();
    setPresetCustomer(data.customer);
    if (window.confirm(`Add products for ${data.customer.customerName} from Inventory or Scan, then Checkout.\n\nGo to Inventory now?`)) {
      navigate("/inventory");
    }
  };

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

  const mergedHistory = data
    ? [
        ...data.purchases.map((p) => ({ kind: "purchase", id: p._id, date: p.date, record: p })),
        ...data.sales.map((s) => ({ kind: "sale", id: s._id, date: s.date, record: s })),
      ].sort((a, b) => new Date(b.date) - new Date(a.date))
    : [];

  if (loading) {
    return <PageSpinner />;
  }

  if (!data) return null;

  const { customer, summary, payments } = data;

  return (
    <div>
      <PageHeader
        title={customer.customerName}
        subtitle={customer.customerId}
        back={
          <button className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-900" onClick={() => navigate(-1)}>
            <ArrowLeft size={14} /> Back
          </button>
        }
        actions={
          <>
            <button className="btn-secondary" onClick={handleOpenReminder} disabled={summary.totalDueAmount <= 0}>
              <Bell size={16} /> Send Reminder
            </button>
            <button className="btn-success" onClick={() => setPaymentModalVisible(true)} disabled={summary.totalDueAmount <= 0}>
              <HandCoins size={16} /> Collect Payment
            </button>
            <button className="btn-primary" onClick={handleStartNewSale}>
              <ShoppingCart size={16} /> New Sale
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Left: customer card */}
        <div className="xl:col-span-1">
          <SectionCard
            title="Customer information"
            actions={<CustomerTypeBadge type={customer.customerType} />}
            bodyClass="p-5"
            className="xl:sticky xl:top-24"
          >
            <dl className="space-y-3.5 text-sm">
              <InfoRow icon={Phone} label="Mobile" value={customer.mobileNumber} />
              <InfoRow icon={MessageCircle} label="WhatsApp" value={customer.whatsappNumber} />
              <InfoRow icon={Mail} label="Email" value={customer.email} />
              <InfoRow icon={Building2} label="Company" value={customer.companyName} />
              <InfoRow icon={MapPin} label="Address" value={customer.address} />
              {!customer.mobileNumber && !customer.whatsappNumber && !customer.email && !customer.companyName && !customer.address && (
                <p className="text-slate-400">No contact details on file.</p>
              )}
            </dl>

            <div className="mt-6 flex gap-2 border-t border-slate-100 pt-5">
              <button
                className="btn-secondary flex-1"
                onClick={() => navigate(`/customers/edit/${customer._id}`, { state: { customer } })}
              >
                <Pencil size={14} /> Edit
              </button>
              <button className="btn-danger-soft flex-1" onClick={handleDelete} disabled={deleting}>
                <Trash2 size={14} /> {deleting ? "..." : "Delete"}
              </button>
            </div>
          </SectionCard>
        </div>

        {/* Right: summary + histories */}
        <div className="space-y-6 xl:col-span-2">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Total Purchase" value={`৳${summary.totalPurchaseAmount.toFixed(2)}`} icon={Receipt} tone="indigo" />
            <StatCard label="Paid" value={`৳${summary.totalPaidAmount.toFixed(2)}`} icon={CheckCircle2} tone="emerald" valueClass="!text-emerald-700" />
            <StatCard
              label="Due"
              value={`৳${summary.totalDueAmount.toFixed(2)}`}
              icon={AlertCircle}
              tone={summary.totalDueAmount > 0 ? "red" : "emerald"}
              valueClass={summary.totalDueAmount > 0 ? "!text-red-700" : "!text-emerald-700"}
            />
            <StatCard
              label="Purchases"
              value={summary.totalPurchases}
              icon={ShoppingBag}
              tone="violet"
              hint={`Last: ${summary.lastPurchaseDate ? new Date(summary.lastPurchaseDate).toLocaleDateString() : "—"}`}
            />
          </div>

          <SectionCard title="Purchase History" bodyClass="p-0">
            {mergedHistory.length === 0 ? (
              <EmptyState icon={Receipt} title="No purchases yet" />
            ) : (
              <div className="table-scroll max-h-[420px]">
                <table className="data-table min-w-[560px]">
                  <thead>
                    <tr>
                      <th>Reference</th>
                      <th>Type</th>
                      <th>Date</th>
                      <th className="text-right">Amount</th>
                      <th className="w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {mergedHistory.map((entry) =>
                      entry.kind === "sale" ? (
                        <tr
                          key={entry.id}
                          className={`row-hover ${loadingSaleDetail ? "opacity-60" : ""}`}
                          onClick={() => {
                            if (!loadingSaleDetail) handleOpenSale(entry.record._id);
                          }}
                        >
                          <td className="font-semibold text-slate-900">{entry.record.invoiceNumber}</td>
                          <td>
                            <Badge tone="indigo">SALE</Badge>
                            <span className="ml-2 text-xs text-slate-400">{entry.record.status}</span>
                          </td>
                          <td className="text-slate-500">{new Date(entry.record.date).toLocaleDateString()}</td>
                          <td className="num font-bold text-slate-900">৳{entry.record.totalAmount.toFixed(2)}</td>
                          <td className="text-xs font-semibold text-brand">View</td>
                        </tr>
                      ) : (
                        <tr key={entry.id} className="row-hover" onClick={() => setSelectedPurchase(entry.record)}>
                          <td>
                            <p className="font-semibold text-slate-900">{entry.record.productName}</p>
                            <p className="text-xs text-slate-400">{entry.record.invoiceNumber}</p>
                          </td>
                          <td>
                            <Badge>PURCHASE</Badge>
                            <span className="ml-2 text-xs text-slate-400">Qty {entry.record.quantity}</span>
                          </td>
                          <td className="text-slate-500">{new Date(entry.record.date).toLocaleDateString()}</td>
                          <td className="num font-bold text-slate-900">৳{entry.record.totalAmount.toFixed(2)}</td>
                          <td className="text-xs font-semibold text-brand">View</td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Payment History"
            bodyClass="p-0"
            actions={
              <Badge tone={summary.totalPurchases === 0 ? "slate" : summary.totalDueAmount > 0 ? "amber" : "green"}>
                {summary.totalPurchases === 0 ? "NO PURCHASES" : summary.totalDueAmount > 0 ? "PARTIAL" : "FULL PAID"}
              </Badge>
            }
          >
            {payments.length === 0 ? (
              <EmptyState icon={HandCoins} title="No payments recorded yet" />
            ) : (
              <div className="table-scroll max-h-[360px]">
                <table className="data-table min-w-[480px]">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Method</th>
                      <th>Note</th>
                      <th className="text-right">Paid</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((pay) => (
                      <tr key={pay._id}>
                        <td className="whitespace-nowrap font-semibold text-slate-900">{new Date(pay.paymentDate).toLocaleDateString()}</td>
                        <td>
                          <Badge>{pay.paymentMethod}</Badge>
                        </td>
                        <td className="text-slate-500">{pay.paymentNote || "—"}</td>
                        <td className="num font-bold text-emerald-600">৳{pay.paymentAmount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        </div>
      </div>

      <AddPaymentModal
        visible={paymentModalVisible}
        dueAmount={summary.totalDueAmount}
        onClose={() => setPaymentModalVisible(false)}
        onConfirm={handleCollectPayment}
      />

      <ReminderModal visible={reminderVisible} loading={reminderLoading} reminder={reminder} onClose={() => setReminderVisible(false)} />

      <InvoiceModal purchase={selectedPurchase} visible={!!selectedPurchase} onClose={() => setSelectedPurchase(null)} />

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
        }))}
        payments={selectedSaleDetail?.payments}
        onClose={() => setSelectedSaleDetail(null)}
      />
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
        <Icon size={15} />
      </div>
      <div className="min-w-0">
        <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</dt>
        <dd className="break-words text-slate-800">{value}</dd>
      </div>
    </div>
  );
}
