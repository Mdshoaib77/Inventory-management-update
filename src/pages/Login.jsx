import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthShell from "../components/AuthShell";
import { ErrorBanner, Field } from "../components/ui";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }
    setLoading(true);
    try {
      const data = await login(email.trim(), password);
      // The Super Admin account (role === "SUPER_ADMIN") goes to its own
      // dashboard; every normal, approved shop account goes to the
      // existing app dashboard as before.
      navigate(data?.role === "SUPER_ADMIN" ? "/admin" : "/dashboard");
    } catch (err) {
      setError(err?.friendlyMessage || err?.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <form onSubmit={handleLogin}>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Welcome back</h1>
        <p className="mb-8 mt-1.5 text-sm text-slate-500">Sign in to manage your stock and sales.</p>

        <ErrorBanner className="mb-5">{error}</ErrorBanner>

        <div className="space-y-4">
          <Field label="Email">
            <input
              className="input !py-2.5"
              placeholder="you@shop.com"
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
              placeholder="••••••••"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </Field>
        </div>

        <button type="submit" className="btn-primary mt-6 w-full !py-2.5" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>

        <Link to="/register" className="mt-6 block text-center text-sm text-slate-500">
          Don't have an account? <span className="font-semibold text-brand hover:underline">Register</span>
        </Link>
      </form>
    </AuthShell>
  );
}
