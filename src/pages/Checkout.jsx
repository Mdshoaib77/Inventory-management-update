import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Minus, Plus, Trash2, ArrowLeft, ShoppingCart } from "lucide-react";
import client from "../api/client";
import { useCart } from "../context/CartContext";
import { CUSTOMER_TYPES, PAYMENT_METHODS } from "../utils/customerType";
import InvoiceModal from "../components/InvoiceModal";
import { PageHeader, SectionCard, EmptyState } from "../components/ui";

export default function Checkout() {
  const navigate = useNavigate();
  const { items, incrementItem, decrementItem, removeItem, updateSellingPrice, clearCart, subtotal, presetCustomer } = useCart();

  const [customerName, setCustomerName] = useState(presetCustomer?.customerName || "");
  const [mobileNumber, setMobileNumber] = useState(presetCustomer?.mobileNumber || "");
  const [whatsappNumber, setWhatsappNumber] = useState(presetCustomer?.whatsappNumber || "");
  const [email, setEmail] = useState(presetCustomer?.email || "");
  const [address, setAddress] = useState(presetCustomer?.address || "");
  const [companyName, setCompanyName] = useState(presetCustomer?.companyName || "");
  const [customerType, setCustomerType] = useState(presetCustomer?.customerType || "New Customer");

  const [discount, setDiscount] = useState("0");
  const [paymentMode, setPaymentMode] = useState("Full");
  const [partialAmount, setPartialAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [paymentNote, setPaymentNote] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [completedSale, setCompletedSale] = useState(null);

  const discountNum = Number(discount) || 0;
  const totalAmount = Math.max(0, subtotal - discountNum);
  const paidAmount = paymentMode === "Full" ? totalAmount : Number(partialAmount) || 0;
  const dueAmount = Math.max(0, totalAmount - paidAmount);

  const totalCost = useMemo(() => items.reduce((sum, l) => sum + (l.product.avgCostPrice || 0) * l.quantity, 0), [items]);
  const baseProfit = subtotal - totalCost;
  const netProfit = baseProfit - discountNum;

  const validationError = useMemo(() => {
    if (items.length === 0) return "Your cart is empty.";
    if (!customerName.trim()) return "Customer name is required.";
    if (!mobileNumber.trim()) return "Mobile number is required.";
    const invalidPriceLine = items.find((l) => !Number.isFinite(Number(l.sellingPrice)) || Number(l.sellingPrice) < 0);
    if (invalidPriceLine) return `Enter a valid selling price for ${invalidPriceLine.product.productName}.`;
    if (discountNum < 0) return "Discount cannot be negative.";
    if (discountNum > subtotal) return "Discount cannot be greater than the subtotal.";
    if (paymentMode === "Partial") {
      if (partialAmount.trim() === "" || !Number.isFinite(Number(partialAmount)) || Number(partialAmount) <= 0) {
        return "Enter a valid partial payment amount.";
      }
      if (Number(partialAmount) > totalAmount) return "Payment amount cannot exceed the total amount.";
    }
    return null;
  }, [items, customerName, mobileNumber, discountNum, subtotal, paymentMode, partialAmount, totalAmount]);

  const handleCompleteSale = async () => {
    if (validationError) {
      alert(validationError);
      return;
    }
    if (submitting) return;
    setSubmitting(true);
    try {
      const payload = {
        items: items.map((line) => ({
          productId: line.product._id,
          quantity: line.quantity,
          sellingPrice: Number(line.sellingPrice),
        })),
        customer: {
          customerName: customerName.trim(),
          mobileNumber: mobileNumber.trim(),
          whatsappNumber: whatsappNumber.trim(),
          email: email.trim(),
          address: address.trim(),
          companyName: companyName.trim(),
          customerType,
        },
        discount: discountNum,
        paidAmount,
        paymentMethod,
        paymentNote: paymentNote.trim(),
      };

      const { data } = await client.post("/sales/checkout", payload);
      setCompletedSale(data);
    } catch (error) {
      alert(error?.friendlyMessage || error?.response?.data?.message || "Could not complete the sale.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseInvoice = () => {
    setCompletedSale(null);
    clearCart();
    navigate(-1);
  };

  const chipClass = (active) =>
    `rounded-lg border px-3 py-2 text-[13px] font-semibold transition ${
      active ? "border-brand bg-brand-50 text-brand" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
    }`;

  return (
    <div>
      <PageHeader
        title="Checkout"
        subtitle="Review the cart, confirm the customer and take payment."
        back={
          <button className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-900" onClick={() => navigate(-1)}>
            <ArrowLeft size={14} /> Back
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* ---------------- Left: cart + customer ---------------- */}
        <div className="space-y-6 xl:col-span-2">
          <SectionCard title={`Cart (${items.length})`} bodyClass="p-0">
            {items.length === 0 ? (
              <EmptyState icon={ShoppingCart} title="Your cart is empty" message="Go back and add products from Inventory or Scan." />
            ) : (
              <div className="table-scroll">
                <table className="data-table min-w-[720px]">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th className="text-center">Quantity</th>
                      <th>Selling price / unit</th>
                      <th className="text-right">Line total</th>
                      <th className="text-right">Profit</th>
                      <th className="w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((line) => {
                      const avgCost = line.product.avgCostPrice || 0;
                      const priceNum = Number(line.sellingPrice);
                      const priceIsValid = Number.isFinite(priceNum) && priceNum >= 0;
                      const profitPerUnit = priceIsValid ? priceNum - avgCost : null;
                      const lineTotal = priceIsValid ? priceNum * line.quantity : 0;
                      const lineProfit = profitPerUnit !== null ? profitPerUnit * line.quantity : null;

                      return (
                        <tr key={line.product._id}>
                          <td className="max-w-[260px]">
                            <p className="truncate font-semibold text-slate-900">{line.product.productName}</p>
                            {avgCost > 0 && <p className="text-xs text-slate-400">Avg cost: ৳{avgCost.toFixed(2)}</p>}
                          </td>
                          <td>
                            <div className="mx-auto flex w-fit items-center gap-1 rounded-lg border border-slate-200 bg-white p-0.5">
                              <button
                                className="flex h-7 w-7 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100"
                                onClick={() => decrementItem(line.product._id)}
                              >
                                <Minus size={14} />
                              </button>
                              <span className="min-w-[28px] text-center text-sm font-bold tabular-nums text-slate-900">{line.quantity}</span>
                              <button
                                className="flex h-7 w-7 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                                onClick={() => incrementItem(line.product._id)}
                                disabled={line.quantity >= line.product.quantity}
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          </td>
                          <td>
                            <input
                              className={`input w-32 font-semibold tabular-nums ${priceIsValid ? "" : "!border-red-500 !ring-red-100"}`}
                              value={String(line.sellingPrice)}
                              onChange={(e) => updateSellingPrice(line.product._id, e.target.value === "" ? "" : Number(e.target.value))}
                              type="number"
                              step="0.01"
                            />
                          </td>
                          <td className="num font-bold text-slate-900">৳{lineTotal.toFixed(2)}</td>
                          <td className="num">
                            {profitPerUnit !== null && lineProfit !== null && (
                              <>
                                <p className={`text-xs font-semibold ${lineProfit < 0 ? "text-red-600" : "text-emerald-600"}`}>
                                  {lineProfit >= 0 ? "Profit" : "Loss"} ৳{Math.abs(lineProfit).toFixed(2)}
                                </p>
                                <p className="text-[11px] text-slate-400">
                                  ৳{Math.abs(profitPerUnit).toFixed(2)}/unit
                                </p>
                              </>
                            )}
                          </td>
                          <td>
                            <button className="btn-icon hover:!bg-red-50 hover:!text-red-600" onClick={() => removeItem(line.product._id)} title="Remove">
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>

          <SectionCard title="Customer information" description="Matching mobile numbers reuse the existing customer profile">
            {presetCustomer && (
              <p className="mb-4 rounded-lg bg-brand-50 p-2.5 text-xs text-brand">Pre-filled for {presetCustomer.customerName}. Edit if needed.</p>
            )}
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Customer Name *" value={customerName} onChange={setCustomerName} placeholder="e.g. Rahim Ahmed" />
              <Field
                label="Mobile Number *"
                value={mobileNumber}
                onChange={setMobileNumber}
                placeholder="e.g. 01700000000"
                type="tel"
                hint="If this number matches an existing customer, their profile will be used automatically — no duplicate will be created."
              />
              <Field label="WhatsApp Number" value={whatsappNumber} onChange={setWhatsappNumber} type="tel" />
              <Field label="Email Address" value={email} onChange={setEmail} type="email" />
              <Field label="Company Name" value={companyName} onChange={setCompanyName} />
              <div>
                <label className="label">Customer Type</label>
                <div className="flex flex-wrap gap-2">
                  {CUSTOMER_TYPES.map((t) => (
                    <button key={t} className={chipClass(customerType === t)} onClick={() => setCustomerType(t)}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="label">Address</label>
                <textarea className="input min-h-[72px]" value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>
            </div>
          </SectionCard>
        </div>

        {/* ---------------- Right: summary + payment ---------------- */}
        <div className="xl:col-span-1">
          <div className="space-y-6 xl:sticky xl:top-24">
            <SectionCard title="Order summary">
              <Row label="Subtotal" value={`৳${subtotal.toFixed(2)}`} />
              <div className="flex items-center justify-between py-1.5">
                <span className="text-sm text-slate-500">Discount</span>
                <input
                  className="input w-28 text-right tabular-nums"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  type="number"
                />
              </div>
              <div className="my-2 border-t border-dashed border-slate-200" />
              <div className="flex items-center justify-between py-1">
                <span className="text-[15px] font-bold text-slate-900">Total</span>
                <span className="text-2xl font-extrabold tabular-nums tracking-tight text-brand">৳{totalAmount.toFixed(2)}</span>
              </div>
              <div className="mt-3 rounded-lg bg-slate-50 p-3">
                <Row label="Base Profit (before discount)" value={`৳${baseProfit.toFixed(2)}`} valueClass={baseProfit < 0 ? "text-red-700" : ""} />
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-[13px] font-bold text-slate-900">Net Profit (after discount)</span>
                  <span className={`text-sm font-bold tabular-nums ${netProfit < 0 ? "text-red-700" : "text-emerald-700"}`}>৳{netProfit.toFixed(2)}</span>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Payment">
              <div className="mb-4 grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
                <button
                  className={`rounded-md py-2 text-[13px] font-semibold transition ${paymentMode === "Full" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
                  onClick={() => setPaymentMode("Full")}
                >
                  Full Payment
                </button>
                <button
                  className={`rounded-md py-2 text-[13px] font-semibold transition ${paymentMode === "Partial" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
                  onClick={() => setPaymentMode("Partial")}
                >
                  Partial Payment
                </button>
              </div>

              {paymentMode === "Partial" && (
                <div className="mb-4">
                  <Field
                    label="Amount received now"
                    value={partialAmount}
                    onChange={setPartialAmount}
                    type="number"
                    placeholder={`Max ৳${totalAmount.toFixed(2)}`}
                  />
                </div>
              )}

              <label className="label">Payment Method</label>
              <div className="mb-4 flex flex-wrap gap-2">
                {PAYMENT_METHODS.map((m) => (
                  <button key={m} className={chipClass(paymentMethod === m)} onClick={() => setPaymentMethod(m)}>
                    {m}
                  </button>
                ))}
              </div>

              <Field label="Note (optional)" value={paymentNote} onChange={setPaymentNote} placeholder="e.g. Advance received" />

              <div className="mt-4 border-t border-slate-100 pt-3">
                <Row label="Paying now" value={`৳${paidAmount.toFixed(2)}`} />
                <Row label="Due after this sale" value={`৳${dueAmount.toFixed(2)}`} valueClass={dueAmount > 0 ? "text-red-700" : ""} />
              </div>
            </SectionCard>

            {!!validationError && items.length > 0 && (
              <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-center text-xs font-medium text-red-700">{validationError}</p>
            )}

            <button className="btn-success w-full !py-3.5 !text-[15px]" onClick={handleCompleteSale} disabled={!!validationError || submitting}>
              {submitting ? "Processing..." : `Complete Sale — ৳${totalAmount.toFixed(2)}`}
            </button>
          </div>
        </div>
      </div>

      <InvoiceModal
        visible={!!completedSale}
        sale={completedSale?.sale}
        customer={completedSale?.customer}
        lineItems={completedSale?.lineItems}
        payments={completedSale?.payment ? [completedSale.payment] : []}
        onClose={handleCloseInvoice}
      />
    </div>
  );
}

function Row({ label, value, valueClass = "" }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-slate-500">{label}</span>
      <span className={`text-sm font-semibold tabular-nums text-slate-900 ${valueClass}`}>{value}</span>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder, hint }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input className="input" value={value} onChange={(e) => onChange(e.target.value)} type={type} placeholder={placeholder} />
      {hint && <p className="hint">{hint}</p>}
    </div>
  );
}
