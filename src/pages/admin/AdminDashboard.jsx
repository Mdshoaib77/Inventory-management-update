import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import client from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import ConfirmModal from "../../components/ConfirmModal";
import { LogOut, Clock, UserCheck, UserX, Phone, MapPin } from "lucide-react";
import { PageSpinner, ErrorBanner, StatCard, EmptyState } from "../../components/ui";

const SECTIONS = [
  { key: "PENDING", title: "Pending Requests", color: "amber" },
  { key: "APPROVED", title: "Approved Users", color: "emerald" },
  { key: "REJECTED", title: "Rejected Users", color: "red" },
];

// Tailwind needs full class names to appear somewhere in source for the JIT
// compiler to pick them up — so each color's classes are spelled out here
// instead of built with string interpolation like `bg-${color}-50`.
const COLOR_CLASSES = {
  amber: { pill: "bg-amber-50 text-amber-600", dot: "bg-amber-400", tone: "amber", Icon: Clock },
  emerald: { pill: "bg-emerald-50 text-emerald-600", dot: "bg-emerald-400", tone: "emerald", Icon: UserCheck },
  red: { pill: "bg-red-50 text-red-600", dot: "bg-red-400", tone: "red", Icon: UserX },
};

function formatDate(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [busyId, setBusyId] = useState(null);

  // Destructive-action confirmation modal state: { type: "reject"|"delete", user }
  const [confirmAction, setConfirmAction] = useState(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await client.get("/admin/users");
      setUsers(data);
    } catch (err) {
      setError(err?.friendlyMessage || err?.response?.data?.message || "Failed to load registration requests");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const grouped = useMemo(() => {
    const g = { PENDING: [], APPROVED: [], REJECTED: [] };
    for (const u of users) {
      if (g[u.status]) g[u.status].push(u);
    }
    return g;
  }, [users]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Accept has no destructive side-effect, so it runs immediately —
  // Reject and Delete go through the confirmation modal first.
  const handleApprove = async (target) => {
    setActionError("");
    setBusyId(target._id);
    try {
      await client.put(`/admin/users/${target._id}/approve`);
      setUsers((prev) => prev.map((u) => (u._id === target._id ? { ...u, status: "APPROVED" } : u)));
    } catch (err) {
      setActionError(err?.friendlyMessage || err?.response?.data?.message || "Failed to approve this account");
    } finally {
      setBusyId(null);
    }
  };

  const runConfirmedAction = async () => {
    if (!confirmAction) return;
    const { type, user: target } = confirmAction;
    setActionError("");
    setBusyId(target._id);
    try {
      if (type === "reject") {
        await client.put(`/admin/users/${target._id}/reject`);
        setUsers((prev) => prev.map((u) => (u._id === target._id ? { ...u, status: "REJECTED" } : u)));
      } else if (type === "delete") {
        await client.delete(`/admin/users/${target._id}`);
        setUsers((prev) => prev.filter((u) => u._id !== target._id));
      }
      setConfirmAction(null);
    } catch (err) {
      setActionError(
        err?.friendlyMessage ||
          err?.response?.data?.message ||
          `Failed to ${type === "reject" ? "reject" : "delete"} this account`
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F7F9]">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/85 px-4 backdrop-blur sm:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-sm font-extrabold text-white shadow-sm">H</div>
          <div>
            <p className="text-[15px] font-bold leading-tight tracking-tight text-slate-900">HisabKhata</p>
            <p className="text-[11px] text-slate-400">Super Admin Dashboard · {user?.email}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="btn-secondary !text-red-600 hover:!bg-red-50">
          <LogOut size={15} /> Logout
        </button>
      </header>

      <main className="mx-auto w-full max-w-page px-4 py-8 sm:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Registration Requests</h1>
          <p className="mt-1 text-sm text-slate-500">Review, approve and manage shop accounts.</p>
        </div>

        <ErrorBanner className="mb-4">{actionError}</ErrorBanner>

        {loading ? (
          <PageSpinner />
        ) : error ? (
          <ErrorBanner>
            {error}
            <button onClick={loadUsers} className="mt-2 block font-semibold underline">
              Try again
            </button>
          </ErrorBanner>
        ) : (
          <>
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {SECTIONS.map((section) => {
                const c = COLOR_CLASSES[section.color];
                return <StatCard key={section.key} label={section.title} value={grouped[section.key].length} icon={c.Icon} tone={c.tone} />;
              })}
            </div>

            <div className="space-y-6">
              {SECTIONS.map((section) => {
                const list = grouped[section.key];
                const colors = COLOR_CLASSES[section.color];
                return (
                  <section key={section.key} className="card overflow-hidden">
                    <header className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
                      <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                        <span className={`h-2 w-2 rounded-full ${colors.dot}`} />
                        {section.title}
                      </h2>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${colors.pill}`}>{list.length}</span>
                    </header>

                    {list.length === 0 ? (
                      <EmptyState icon={colors.Icon} title="No accounts here yet." />
                    ) : (
                      <div className="table-scroll max-h-[520px]">
                        <table className="data-table min-w-[760px]">
                          <thead>
                            <tr>
                              <th>Shop</th>
                              <th>Email</th>
                              <th className="hidden lg:table-cell">Phone</th>
                              <th className="hidden xl:table-cell">Address</th>
                              <th>Registered</th>
                              <th className="text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {list.map((u) => {
                              const busy = busyId === u._id;
                              return (
                                <tr key={u._id}>
                                  <td className="font-semibold text-slate-900">{u.shopName}</td>
                                  <td className="text-slate-600">{u.email}</td>
                                  <td className="hidden lg:table-cell">
                                    {u.shopPhone ? (
                                      <span className="inline-flex items-center gap-1.5 text-slate-600">
                                        <Phone size={12} className="text-slate-400" /> {u.shopPhone}
                                      </span>
                                    ) : (
                                      <span className="text-slate-300">—</span>
                                    )}
                                  </td>
                                  <td className="hidden max-w-[240px] xl:table-cell">
                                    {u.shopAddress ? (
                                      <span className="flex items-center gap-1.5 truncate text-slate-500">
                                        <MapPin size={12} className="shrink-0 text-slate-400" /> <span className="truncate">{u.shopAddress}</span>
                                      </span>
                                    ) : (
                                      <span className="text-slate-300">—</span>
                                    )}
                                  </td>
                                  <td className="whitespace-nowrap text-xs text-slate-500">{formatDate(u.createdAt)}</td>
                                  <td>
                                    <div className="flex items-center justify-end gap-2">
                                      {u.status !== "APPROVED" && (
                                        <button onClick={() => handleApprove(u)} disabled={busy} className="btn-success btn-sm">
                                          Accept
                                        </button>
                                      )}
                                      {u.status !== "REJECTED" && (
                                        <button
                                          onClick={() => setConfirmAction({ type: "reject", user: u })}
                                          disabled={busy}
                                          className="btn-secondary btn-sm !border-amber-200 !text-amber-700 hover:!bg-amber-50"
                                        >
                                          Reject
                                        </button>
                                      )}
                                      <button
                                        onClick={() => setConfirmAction({ type: "delete", user: u })}
                                        disabled={busy}
                                        className="btn-danger-soft btn-sm"
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          </>
        )}
      </main>

      <ConfirmModal
        visible={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={runConfirmedAction}
        loading={!!confirmAction && busyId === confirmAction.user._id}
        title={confirmAction?.type === "delete" ? "Delete this account?" : "Reject this registration?"}
        message={
          confirmAction?.type === "delete"
            ? `This will permanently delete ${confirmAction.user.shopName} (${confirmAction.user.email}). This cannot be undone.`
            : `${confirmAction?.user?.shopName} (${confirmAction?.user?.email}) will be blocked from logging in until approved again.`
        }
        confirmLabel={confirmAction?.type === "delete" ? "Delete" : "Reject"}
      />
    </div>
  );
}
