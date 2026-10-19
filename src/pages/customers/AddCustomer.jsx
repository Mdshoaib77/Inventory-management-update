import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import client from "../../api/client";
import { CUSTOMER_TYPES } from "../../utils/customerType";
import { ArrowLeft } from "lucide-react";
import { PageHeader, ErrorBanner, Field, SectionCard } from "../../components/ui";

export default function AddCustomer() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const isEdit = !!id;
  const [existing, setExisting] = useState(location.state?.customer || null);
  const [loadingExisting, setLoadingExisting] = useState(isEdit && !location.state?.customer);

  const [customerName, setCustomerName] = useState(existing?.customerName || "");
  const [mobileNumber, setMobileNumber] = useState(existing?.mobileNumber || "");
  const [whatsappNumber, setWhatsappNumber] = useState(existing?.whatsappNumber || "");
  const [email, setEmail] = useState(existing?.email || "");
  const [address, setAddress] = useState(existing?.address || "");
  const [companyName, setCompanyName] = useState(existing?.companyName || "");
  const [customerType, setCustomerType] = useState(existing?.customerType || "New Customer");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isEdit || existing) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await client.get(`/customers/${id}`);
        if (!cancelled) {
          const c = data.customer;
          setExisting(c);
          setCustomerName(c.customerName || "");
          setMobileNumber(c.mobileNumber || "");
          setWhatsappNumber(c.whatsappNumber || "");
          setEmail(c.email || "");
          setAddress(c.address || "");
          setCompanyName(c.companyName || "");
          setCustomerType(c.customerType || "New Customer");
        }
      } finally {
        if (!cancelled) setLoadingExisting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    const trimmedName = customerName.trim();
    if (!trimmedName) {
      setError("Customer name is required");
      return;
    }

    const payload = {
      customerName: trimmedName,
      mobileNumber: mobileNumber.trim(),
      whatsappNumber: whatsappNumber.trim(),
      email: email.trim(),
      address: address.trim(),
      companyName: companyName.trim(),
      customerType,
    };

    setSaving(true);
    try {
      if (isEdit) {
        await client.put(`/customers/${existing?._id || id}`, payload);
      } else {
        await client.post("/customers", payload);
      }
      navigate(isEdit ? `/customers/${existing?._id || id}` : "/customers");
    } catch (err) {
      setError(err?.friendlyMessage || err?.response?.data?.message || "Could not save customer");
    } finally {
      setSaving(false);
    }
  };

  if (loadingExisting) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title={isEdit ? "Edit Customer" : "Add Customer"}
        subtitle={isEdit ? "Update this customer's details." : "Create a customer profile you can sell to and track dues for."}
        back={
          <button type="button" className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-900" onClick={() => navigate(-1)}>
            <ArrowLeft size={14} /> Back
          </button>
        }
      />

      <ErrorBanner className="mb-4">{error}</ErrorBanner>

      <form onSubmit={handleSave} className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <SectionCard title="Contact details" description="How to reach this customer">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Customer Name" required className="sm:col-span-2">
                <input className="input" value={customerName} onChange={(e) => setCustomerName(e.target.value)} disabled={saving} />
              </Field>
              <Field label="Mobile Number">
                <input className="input" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} type="tel" disabled={saving} />
              </Field>
              <Field label="WhatsApp Number">
                <input
                  className="input"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  type="tel"
                  placeholder="Leave blank if same as mobile"
                  disabled={saving}
                />
              </Field>
              <Field label="Email Address" className="sm:col-span-2">
                <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoCapitalize="none" disabled={saving} />
              </Field>
            </div>
          </SectionCard>

          <SectionCard title="Business details">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Company Name">
                <input className="input" value={companyName} onChange={(e) => setCompanyName(e.target.value)} disabled={saving} />
              </Field>
              <Field label="Customer Type">
                <div className="flex flex-wrap gap-2">
                  {CUSTOMER_TYPES.map((t) => (
                    <button
                      type="button"
                      key={t}
                      className={`rounded-lg border px-3 py-2 text-[13px] font-semibold transition ${
                        customerType === t
                          ? "border-brand bg-brand-50 text-brand"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                      onClick={() => setCustomerType(t)}
                      disabled={saving}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Address" className="sm:col-span-2">
                <textarea className="input min-h-[88px]" value={address} onChange={(e) => setAddress(e.target.value)} disabled={saving} />
              </Field>
            </div>
          </SectionCard>
        </div>

        <div className="lg:col-span-1">
          <div className="card sticky top-24 p-5">
            <h3 className="text-sm font-semibold text-slate-900">{isEdit ? "Save changes" : "Ready to save?"}</h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Only the customer name is required. Customers are also created automatically when you check out a sale.
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <button type="submit" className="btn-primary w-full !py-2.5" disabled={saving}>
                {saving ? "Saving..." : isEdit ? "Update Customer" : "Save Customer"}
              </button>
              <button type="button" className="btn-secondary w-full !py-2.5" onClick={() => navigate(-1)} disabled={saving}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
