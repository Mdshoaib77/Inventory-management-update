import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthShell from "../components/AuthShell";
import { ErrorBanner, Field } from "../components/ui";

export default function Register() {
  const { register } = useAuth();
  const [shopName, setShopName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [shopPhone, setShopPhone] = useState("");
  const [shopAddress, setShopAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // Once registration succeeds, we stop showing the form and show a
  // "waiting for approval" confirmation instead — there is no token to log
  // in with, since new accounts start out PENDING.
  const [submittedEmail, setSubmittedEmail] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    if (!shopName.trim() || !email.trim() || !password || !shopPhone.trim()) {
      setError("Please fill all fields (phone number is required)");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (!/^[0-9+\-\s]{7,20}$/.test(shopPhone.trim())) {
      setError("Please enter a valid phone number");
      return;
    }
    setLoading(true);
    try {
      const data = await register(
        shopName.trim(),
        email.trim(),
        password,
        shopPhone.trim(),
        shopAddress.trim()
      );
      setSubmittedEmail(data?.email || email.trim());
    } catch (err) {
      setError(err?.friendlyMessage || err?.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (submittedEmail) {
    return (
      <AuthShell>
        <div className="text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-3xl text-amber-500">⏳</div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Registration Submitted</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-500">
            Thanks! Your account for <span className="font-semibold text-slate-700">{submittedEmail}</span> has been created and is now{" "}
            <span className="font-semibold text-amber-600">waiting for Super Admin approval</span>. You'll be able to log in as soon as it's approved.
          </p>
          <Link to="/login" className="btn-primary mt-8 w-full !py-2.5">
            Back to Login
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell wide>
      <form onSubmit={handleRegister}>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Create Account</h1>
        <p className="mb-6 mt-1.5 text-sm text-slate-500">Register your shop on HisabKhata</p>

        <ErrorBanner className="mb-4">{error}</ErrorBanner>

        <p className="mb-5 rounded-lg border border-indigo-100 bg-indigo-50 p-3 text-xs leading-relaxed text-indigo-700">
          New accounts require Super Admin approval before you can log in. A valid phone number is required so the Super Admin can verify your
          shop before approving.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Shop Name" className="sm:col-span-2">
            <input className="input !py-2.5" placeholder="Shop Name" value={shopName} onChange={(e) => setShopName(e.target.value)} disabled={loading} />
          </Field>
          <Field label="Email" className="sm:col-span-2">
            <input
              className="input !py-2.5"
              placeholder="Email"
              type="email"
              autoCapitalize="none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </Field>
          <Field label="Password">
            <input
              className="input !py-2.5"
              placeholder="Password (min. 6 characters)"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </Field>
          <Field label="Phone Number">
            <input className="input !py-2.5" placeholder="Phone Number" type="tel" value={shopPhone} onChange={(e) => setShopPhone(e.target.value)} disabled={loading} />
          </Field>
          <Field label="Shop Address (optional)" className="sm:col-span-2">
            <input
              className="input !py-2.5"
              placeholder="Shop Address (optional)"
              value={shopAddress}
              onChange={(e) => setShopAddress(e.target.value)}
              disabled={loading}
            />
          </Field>
        </div>

        <button type="submit" className="btn-primary mt-6 w-full !py-2.5" disabled={loading}>
          {loading ? "Submitting..." : "Register"}
        </button>

        <Link to="/login" className="mt-6 block text-center text-sm text-slate-500">
          Already have an account? <span className="font-semibold text-brand hover:underline">Login</span>
        </Link>
      </form>
    </AuthShell>
  );
}
