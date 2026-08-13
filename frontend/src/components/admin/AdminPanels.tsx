import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { toast } from "react-toastify";
import adminApi from "../../api/modules/admin.api";
import earningsApi from "../../api/modules/earnings.api";
import type { AdminSection } from "./AdminSidebar";

type RecordItem = Record<string, any>;
type AdminMe = RecordItem & { adminLevel?: "site_administrator" | "admin" };

const dataOf = (response: any) => response?.data?.data ?? response?.data ?? {};
const nameOf = (value?: RecordItem) => value ? `${value.firstName || ""} ${value.lastName || ""}`.trim() || value.email || "Unknown" : "Unknown";
const dateOf = (value?: string | Date) => value ? new Date(value).toLocaleString("vi-VN") : "—";
const money = (value?: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value || 0);

function Frame({ title, note, actions, children }: { title: string; note?: string; actions?: ReactNode; children: ReactNode }) {
  return <section className="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface)] p-4 sm:p-5">
    <div className="flex flex-col gap-3 border-b border-[var(--ui-border)] pb-4 sm:flex-row sm:items-end sm:justify-between">
      <div><h2 className="text-lg font-bold tracking-[-0.02em] text-[var(--ui-text)]">{title}</h2>{note && <p className="mt-1 max-w-2xl text-sm text-[var(--ui-text-muted)]">{note}</p>}</div>
      {actions}
    </div>
    <div className="mt-4">{children}</div>
  </section>;
}

type ButtonVariant = "primary" | "neutral" | "danger";
const Button = ({ children, muted = false, variant = "primary", className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { muted?: boolean; variant?: ButtonVariant }) => {
  const tone = muted ? "neutral" : variant;
  const tones: Record<ButtonVariant, string> = {
    primary: "border-[var(--ui-accent-fill)] bg-[var(--ui-accent-fill)] text-[var(--ui-accent-contrast)] hover:bg-[var(--ui-accent-fill-hover)]",
    neutral: "border-[var(--ui-border)] bg-[var(--ui-surface-muted)] text-[var(--ui-text)] hover:border-[var(--ui-accent)]",
    danger: "border-red-600 bg-red-600 text-white hover:bg-red-700 dark:border-red-500 dark:bg-red-600",
  };
  return <button {...props} className={`min-h-11 rounded-lg border px-3 py-2 text-sm font-semibold transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ui-surface)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${tones[tone]} ${className}`}>{children}</button>;
};
const Input = ({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} className={`min-h-11 w-full rounded-lg border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 text-sm text-[var(--ui-text)] outline-none placeholder:text-[var(--ui-text-muted)] focus-visible:border-[var(--ui-accent)] focus-visible:ring-2 focus-visible:ring-[var(--ui-accent)]/25 ${className}`} />;
const Select = ({ className = "", ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) => <select {...props} className={`min-h-11 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 text-sm text-[var(--ui-text)] outline-none focus-visible:border-[var(--ui-accent)] focus-visible:ring-2 focus-visible:ring-[var(--ui-accent)]/25 ${className}`} />;
const Textarea = ({ className = "", ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...props} className={`min-h-24 w-full resize-y rounded-lg border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2 text-sm text-[var(--ui-text)] outline-none placeholder:text-[var(--ui-text-muted)] focus-visible:border-[var(--ui-accent)] focus-visible:ring-2 focus-visible:ring-[var(--ui-accent)]/25 ${className}`} />;

const Empty = ({ loading, error, onRetry, children }: { loading: boolean; error: string; onRetry: () => void; children: ReactNode }) => loading ? <div role="status" aria-busy="true" aria-live="polite" className="space-y-2"><span className="sr-only">Loading admin data</span>{[0, 1, 2].map(i => <div key={i} className="h-12 animate-pulse rounded-lg bg-[var(--ui-surface-muted)] motion-reduce:animate-none" />)}</div> : error ? <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200"><span>{error}</span><Button variant="danger" onClick={onRetry}>Retry</Button></div> : <>{children}</>;
const Row = ({ children }: { children: ReactNode }) => <div className="grid gap-3 border-b border-[var(--ui-border)] py-3 last:border-0 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">{children}</div>;

type BadgeTone = "neutral" | "info" | "warning" | "success" | "danger";
const Badge = ({ children, tone = "neutral" }: { children: ReactNode; tone?: BadgeTone }) => {
  const tones: Record<BadgeTone, string> = {
    neutral: "bg-[var(--ui-surface-muted)] text-[var(--ui-text-muted)]",
    info: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-200",
    warning: "bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200",
    success: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200",
    danger: "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-200",
  };
  return <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold capitalize ${tones[tone]}`}>{children}</span>;
};
const statusTone = (value?: string): BadgeTone => {
  const status = (value || "").toLowerCase();
  if (["active", "approved", "finished", "published", "resolved", "paid", "refunded", "success"].includes(status)) return "success";
  if (["pending", "in progress", "eligible", "refund_pending", "high"].includes(status)) return "warning";
  if (["suspended", "cancelled", "rejected", "failed", "closed", "urgent"].includes(status)) return "danger";
  if (status === "low") return "neutral";
  return status ? "info" : "neutral";
};
const StatusBadge = ({ value }: { value?: string }) => <Badge tone={statusTone(value)}>{(value || "Unknown").replaceAll("_", " ")}</Badge>;

function DataTable({ label, headers, children }: { label: string; headers: string[]; children: ReactNode }) {
  return <div className="overflow-x-auto rounded-lg border border-[var(--ui-border)]">
    <table aria-label={label} className="w-full min-w-[760px] border-collapse text-left text-sm">
      <thead className="bg-[var(--ui-surface-muted)] text-xs font-semibold uppercase tracking-[0.04em] text-[var(--ui-text-muted)]"><tr>{headers.map(header => <th key={header} scope="col" className="border-b border-[var(--ui-border)] px-3 py-3">{header}</th>)}</tr></thead>
      <tbody className="divide-y divide-[var(--ui-border)]">{children}</tbody>
    </table>
  </div>;
}

function useLoad(load: () => Promise<any>, dependencies: unknown[] = []) {
  const [state, setState] = useState({ loading: true, error: "", value: {} as any });
  const refresh = useCallback(async () => {
    setState(current => ({ ...current, loading: true, error: "" }));
    try { setState({ loading: false, error: "", value: dataOf(await load()) }); }
    catch { setState({ loading: false, error: "Could not load this section.", value: {} }); }
  }, dependencies);
  useEffect(() => { void refresh(); }, [refresh]);
  return { ...state, refresh };
}

export function AdminOverviewPanel({ onNavigate }: { onNavigate: (section: AdminSection) => void }) {
  const { value, loading, error, refresh } = useLoad(() => adminApi.overview());
  const metrics = value.metrics || {};
  const attention = value.needsAttention || {};
  const links: Array<[string, number, AdminSection]> = [
    ["Mentor applications", attention.pendingApplications, "applications"], ["Help requests", attention.openHelpRequests, "help"],
    ["Pending refunds", attention.refundPending, "refunds"], ["Eligible payouts", attention.eligiblePayouts, "payouts"], ["Suspended courses", attention.suspendedCourses, "courses"],
  ];
  return <div className="space-y-4">
    <header className="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface)] px-5 py-5 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ui-accent)]">Operations</p><h1 className="mt-1 text-2xl font-black tracking-[-0.04em] text-[var(--ui-text)] sm:text-3xl">Administrator workspace</h1><p className="mt-2 max-w-2xl text-sm text-[var(--ui-text-muted)]">Review access, learning activity, support and money movement from one operational view.</p></div><Button muted onClick={() => void refresh()}>Refresh data</Button></div>
    </header>
    <Empty loading={loading} error={error} onRetry={() => void refresh()}><>
      <div className="grid overflow-hidden rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface)] sm:grid-cols-2 xl:grid-cols-4">{[["Total users", metrics.totalUsers], ["Pending applications", metrics.pendingApplications], ["Active sessions", metrics.activeSessions], ["Open help requests", metrics.openHelpRequests]].map(([label, metric]) => <article key={String(label)} className="border-b border-[var(--ui-border)] p-4 last:border-b-0 sm:border-r sm:[&:nth-child(2)]:border-r-0 xl:border-b-0 xl:[&:nth-child(2)]:border-r xl:last:border-r-0"><p className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--ui-text-muted)]">{label}</p><p className="mt-2 text-2xl font-black tabular-nums text-[var(--ui-text)]">{Number(metric || 0)}</p></article>)}</div>
      <div className="grid gap-4 xl:grid-cols-2"><Frame title="Needs attention" note="Queues that can block users or money movement."><div>{links.map(([label, count, section]) => <button key={section} onClick={() => onNavigate(section)} className="flex min-h-11 w-full items-center justify-between border-b border-[var(--ui-border)] px-1 py-2 text-left transition-colors last:border-0 hover:text-[var(--ui-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-accent)]"><span className="font-medium text-[var(--ui-text)]">{label}</span><Badge tone={count ? "warning" : "neutral"}>{count || 0}</Badge></button>)}</div></Frame><Frame title="Recent activity" note="Latest privileged actions."><div>{(value.recentActivity || []).slice(0, 8).map((item: RecordItem) => <Row key={item._id}><div><p className="font-medium text-[var(--ui-text)]">{item.action}</p><p className="text-xs text-[var(--ui-text-muted)]">{item.targetType} · {dateOf(item.createdAt)}</p></div><StatusBadge value={item.result} /></Row>)}{!value.recentActivity?.length && <p className="rounded-lg bg-[var(--ui-surface-muted)] p-4 text-sm text-[var(--ui-text-muted)]">No privileged activity has been recorded yet.</p>}</div></Frame></div>
    </></Empty>
  </div>;
}

export function AdminApplicationsPanel() {
  const [status, setStatus] = useState("pending");
  const [reason, setReason] = useState<Record<string, string>>({});
  const { value, loading, error, refresh } = useLoad(() => adminApi.mentorApplications(status), [status]);
  const review = async (id: string, decision: "approved" | "rejected") => {
    if (decision === "rejected" && (reason[id] || "").trim().length < 5) return toast.error("Add a rejection reason of at least 5 characters.");
    await adminApi.reviewMentorApplication(id, decision, reason[id] || ""); toast.success(decision === "approved" ? "Mentor approved" : "Application rejected"); await refresh();
  };
  const applications = value.applications || [];
  return <Frame title="Mentor applications" note="Inspect the complete submitted profile before deciding." actions={<><label htmlFor="application-status" className="sr-only">Application status</label><Select id="application-status" value={status} onChange={event => setStatus(event.target.value)}><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option></Select></>}><Empty loading={loading} error={error} onRetry={() => void refresh()}><div className="space-y-2">{applications.map((item: RecordItem) => <details key={item._id} className="group rounded-lg border border-[var(--ui-border)] bg-[var(--ui-surface)] open:bg-[var(--ui-surface-muted)]"><summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-accent)]"><div><p className="font-bold text-[var(--ui-text)]">{nameOf(item.user)}</p><p className="mt-1 text-sm text-[var(--ui-text-muted)]">{item.user?.jobTitle || "No job title"} · {item.user?.category || "No category"}</p></div><StatusBadge value={item.status} /></summary><div className="grid gap-4 border-t border-[var(--ui-border)] p-4 md:grid-cols-2"><div className="space-y-2 text-sm text-[var(--ui-text-muted)]"><p>{item.user?.email || "No email"}</p><p>{item.user?.location || "No location"}</p><p>{item.user?.bio || "No biography provided."}</p><p><strong className="text-[var(--ui-text)]">Why mentor:</strong> {item.user?.mentorReason || "—"}</p><p><strong className="text-[var(--ui-text)]">Skills:</strong> {(item.user?.skills || []).join(", ") || "—"}</p></div>{item.status === "pending" && <div className="space-y-3"><label htmlFor={`application-reason-${item._id}`} className="text-sm font-semibold text-[var(--ui-text)]">Rejection reason</label><Textarea id={`application-reason-${item._id}`} placeholder="Required only when rejecting" value={reason[item._id] || ""} onChange={event => setReason(current => ({ ...current, [item._id]: event.target.value }))} minLength={5} /><div className="flex flex-wrap gap-2"><Button onClick={() => void review(item._id, "approved")}>Approve</Button><Button variant="danger" onClick={() => void review(item._id, "rejected")}>Reject</Button></div></div>}</div></details>)}{!applications.length && <p className="rounded-lg bg-[var(--ui-surface-muted)] p-4 text-sm text-[var(--ui-text-muted)]">No {status} mentor applications.</p>}</div></Empty></Frame>;
}

export function AdminUsersPanel({ me }: { me: AdminMe }) {
  const [filters, setFilters] = useState({ search: "", role: "", suspended: "", page: 1 });
  const [reasonFor, setReasonFor] = useState(""); const [reason, setReason] = useState("");
  const { value, loading, error, refresh } = useLoad(() => adminApi.users(filters), [filters.search, filters.role, filters.suspended, filters.page]);
  const mutate = async (action: string, id: string) => {
    if (action === "Suspend") { if (reason.trim().length < 5) return toast.error("Add a reason of at least 5 characters."); await adminApi.suspendUser(id, reason); }
    if (action === "Restore") await adminApi.restoreUser(id);
    if (action === "Grant Admin") await adminApi.grantAdmin(id);
    if (action === "Revoke Admin") await adminApi.revokeAdmin(id);
    setReasonFor(""); setReason(""); toast.success(`${action} completed`); await refresh();
  };
  const items = value.items || [];
  return <Frame title="Users" note="Search accounts, suspend policy violations and manage delegated access." actions={<div className="flex flex-wrap gap-2"><label htmlFor="user-search" className="sr-only">Search users</label><Input id="user-search" className="sm:w-56" placeholder="Search users" value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value, page: 1 })}/><label htmlFor="user-role" className="sr-only">Filter users by role</label><Select id="user-role" value={filters.role} onChange={e => setFilters({ ...filters, role: e.target.value, page: 1 })}><option value="">All roles</option><option value="mentee">Mentee</option><option value="mentor">Mentor</option><option value="admin">Admin</option></Select></div>}>
    <Empty loading={loading} error={error} onRetry={() => void refresh()}><div className="space-y-4">
      {items.length ? <DataTable label="User accounts" headers={["Account", "Role", "Status", "Actions"]}>{items.map((item: RecordItem) => <tr key={item._id} className="align-top hover:bg-[var(--ui-surface-muted)]/60">
        <td className="px-3 py-3"><p className="font-semibold text-[var(--ui-text)]">{nameOf(item)}</p><p className="mt-1 text-xs text-[var(--ui-text-muted)]">{item.email}</p>{reasonFor === item._id && <div className="mt-3 flex min-w-[300px] flex-wrap gap-2"><label htmlFor={`suspension-reason-${item._id}`} className="sr-only">Suspension reason for {nameOf(item)}</label><Input id={`suspension-reason-${item._id}`} className="flex-1" autoFocus minLength={5} placeholder="Suspension reason" value={reason} onChange={e => setReason(e.target.value)}/><Button variant="danger" onClick={() => void mutate("Suspend", item._id)}>Confirm</Button><Button muted onClick={() => setReasonFor("")}>Cancel</Button></div>}</td>
        <td className="px-3 py-3"><Badge>{item.adminLevel || item.role || "Unknown"}</Badge></td>
        <td className="px-3 py-3"><StatusBadge value={item.isSuspended ? "suspended" : "active"} />{item.isSuspended && <p className="mt-2 max-w-xs text-xs text-[var(--ui-text-muted)]">{item.suspensionReason}</p>}</td>
        <td className="px-3 py-3"><div className="flex flex-wrap justify-end gap-2">{item.isSuspended ? <Button muted onClick={() => void mutate("Restore", item._id)}>Restore</Button> : <Button variant="danger" onClick={() => setReasonFor(item._id)}>Suspend</Button>}{me.adminLevel === "site_administrator" && item.adminLevel !== "site_administrator" && (item.adminLevel === "admin" ? <Button muted onClick={() => void mutate("Revoke Admin", item._id)}>Revoke Admin</Button> : <Button muted onClick={() => void mutate("Grant Admin", item._id)}>Grant Admin</Button>)}</div></td>
      </tr>)}</DataTable> : <p className="rounded-lg bg-[var(--ui-surface-muted)] p-4 text-sm text-[var(--ui-text-muted)]">No users match the current search and role filters.</p>}
      <nav aria-label="User pages" className="flex items-center justify-between"><Button muted disabled={filters.page <= 1} onClick={() => setFilters({ ...filters, page: filters.page - 1 })}>Previous</Button><span className="text-sm tabular-nums text-[var(--ui-text-muted)]">Page {filters.page}</span><Button muted disabled={items.length < (value.limit || 10)} onClick={() => setFilters({ ...filters, page: filters.page + 1 })}>Next</Button></nav>
    </div></Empty>
  </Frame>;
}

export function AdminSessionsPanel() {
  const [status, setStatus] = useState(""); const [editing, setEditing] = useState(""); const [text, setText] = useState(""); const [cancelId, setCancelId] = useState("");
  const { value, loading, error, refresh } = useLoad(() => adminApi.sessions({ status, limit: 100 }), [status]);
  const saveNotes = async (id: string) => { await adminApi.updateSessionNotes(id, text); setEditing(""); toast.success("Session notes saved"); await refresh(); };
  const cancel = async (id: string) => { if (text.trim().length < 5) return toast.error("Add a reason of at least 5 characters."); await adminApi.cancelSession(id, text); setCancelId(""); setText(""); toast.success("Session cancelled"); await refresh(); };
  const refund = async (id: string) => { if (text.trim().length < 3) return toast.error("Add the provider refund reference."); await adminApi.processBookingRefund(id, text); setEditing(""); setText(""); toast.success("Record refund completed"); await refresh(); };
  const items = value.items || [];
  return <Frame title="Sessions" note="Operational notes, cancellations and refund handling only." actions={<><label htmlFor="session-status" className="sr-only">Filter sessions by status</label><Select id="session-status" value={status} onChange={e => setStatus(e.target.value)}><option value="">All statuses</option>{["pending", "active", "finished", "cancelled", "rejected"].map(item => <option key={item}>{item}</option>)}</Select></>}>
    <Empty loading={loading} error={error} onRetry={() => void refresh()}>{items.length ? <DataTable label="Mentoring sessions" headers={["Participants", "Schedule", "Status", "Notes", "Actions"]}>{items.map((item: RecordItem) => {
      const formOpen = editing === item._id || cancelId === item._id;
      const isRefund = editing === item._id && item.paymentStatus === "refund_pending";
      const inputLabel = cancelId === item._id ? "Cancellation reason" : isRefund ? "Provider refund reference" : "Operational notes";
      return <tr key={item._id} className="align-top hover:bg-[var(--ui-surface-muted)]/60">
        <td className="px-3 py-3"><p className="font-semibold text-[var(--ui-text)]">{nameOf(item.mentor)}</p><p className="mt-1 text-xs text-[var(--ui-text-muted)]">with {nameOf(item.mentee)}</p></td>
        <td className="whitespace-nowrap px-3 py-3 text-[var(--ui-text)]"><p>{dateOf(item.date)}</p><p className="mt-1 text-xs text-[var(--ui-text-muted)]">{item.start || "—"}–{item.end || "—"}</p></td>
        <td className="px-3 py-3"><div className="flex flex-col items-start gap-2"><StatusBadge value={item.status} /><StatusBadge value={item.paymentStatus} /></div></td>
        <td className="max-w-xs px-3 py-3 text-[var(--ui-text-muted)]"><p>{item.notes || "No operational notes"}</p>{formOpen && <div className="mt-3 min-w-[280px] space-y-2"><label htmlFor={`session-input-${item._id}`} className="text-xs font-semibold text-[var(--ui-text)]">{inputLabel}</label><Input id={`session-input-${item._id}`} autoFocus minLength={isRefund ? 3 : 5} placeholder={inputLabel} value={text} onChange={e => setText(e.target.value)}/><div className="flex gap-2"><Button variant={cancelId === item._id ? "danger" : "primary"} onClick={() => void (cancelId === item._id ? cancel(item._id) : isRefund ? refund(item._id) : saveNotes(item._id))}>Confirm</Button><Button muted onClick={() => { setEditing(""); setCancelId(""); setText(""); }}>Cancel</Button></div></div>}</td>
        <td className="px-3 py-3"><div className="flex min-w-max flex-wrap justify-end gap-2"><Button muted onClick={() => { setEditing(item._id); setCancelId(""); setText(item.notes || ""); }}>Edit notes</Button>{["pending", "active"].includes(item.status) && <Button variant="danger" onClick={() => { setCancelId(item._id); setEditing(""); setText(""); }}>Cancel session</Button>}{item.paymentStatus === "refund_pending" && <Button muted onClick={() => { setEditing(item._id); setCancelId(""); setText(""); }}>Record refund</Button>}</div></td>
      </tr>;
    })}</DataTable> : <p className="rounded-lg bg-[var(--ui-surface-muted)] p-4 text-sm text-[var(--ui-text-muted)]">No sessions match the selected status.</p>}</Empty>
  </Frame>;
}

export function AdminCoursesPanel() {
  const [filters, setFilters] = useState({ search: "", status: "" }); const [selected, setSelected] = useState(""); const [reason, setReason] = useState("");
  const { value, loading, error, refresh } = useLoad(() => adminApi.courses(filters), [filters.search, filters.status]);
  const suspend = async (id: string) => { if (reason.trim().length < 5) return toast.error("Add a reason of at least 5 characters."); await adminApi.suspendCourse(id, reason); setSelected(""); setReason(""); toast.success("Course suspended"); await refresh(); };
  const items = value.items || [];
  return <Frame title="Courses" note="Moderate marketplace visibility. Existing buyers keep access." actions={<div className="flex flex-wrap gap-2"><label htmlFor="course-search" className="sr-only">Search courses</label><Input id="course-search" className="sm:w-56" placeholder="Search courses" value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })}/><label htmlFor="course-status" className="sr-only">Filter courses by state</label><Select id="course-status" value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}><option value="">All states</option><option value="published">Published</option><option value="suspended">Suspended</option></Select></div>}>
    <Empty loading={loading} error={error} onRetry={() => void refresh()}>{items.length ? <DataTable label="Marketplace courses" headers={["Course", "Mentor", "Price", "Moderation", "Actions"]}>{items.map((item: RecordItem) => <tr key={item._id} className="align-top hover:bg-[var(--ui-surface-muted)]/60">
      <td className="px-3 py-3"><p className="font-semibold text-[var(--ui-text)]">{item.title}</p>{selected === item._id && <div className="mt-3 min-w-[300px] space-y-2"><label htmlFor={`course-reason-${item._id}`} className="text-xs font-semibold text-[var(--ui-text)]">Suspension reason</label><Input id={`course-reason-${item._id}`} autoFocus minLength={5} placeholder="Suspension reason" value={reason} onChange={e => setReason(e.target.value)}/><div className="flex gap-2"><Button variant="danger" onClick={() => void suspend(item._id)}>Confirm</Button><Button muted onClick={() => { setSelected(""); setReason(""); }}>Cancel</Button></div></div>}</td>
      <td className="px-3 py-3 text-[var(--ui-text-muted)]">{nameOf(item.mentor)}</td>
      <td className="whitespace-nowrap px-3 py-3 font-semibold tabular-nums text-[var(--ui-text)]">{money(item.price)}</td>
      <td className="px-3 py-3"><StatusBadge value={item.moderationStatus || "published"} />{item.suspensionReason && <p className="mt-2 max-w-xs text-xs text-[var(--ui-text-muted)]">{item.suspensionReason}</p>}</td>
      <td className="px-3 py-3 text-right">{item.moderationStatus === "suspended" ? <Button muted onClick={async () => { await adminApi.restoreCourse(item._id); toast.success("Course restored"); await refresh(); }}>Restore</Button> : <Button variant="danger" onClick={() => setSelected(item._id)}>Suspend</Button>}</td>
    </tr>)}</DataTable> : <p className="rounded-lg bg-[var(--ui-surface-muted)] p-4 text-sm text-[var(--ui-text-muted)]">No courses match the current search and state filters.</p>}</Empty>
  </Frame>;
}

export function AdminHelpPanel() {
  const [filters, setFilters] = useState({ status: "", priority: "", category: "" }); const [selected, setSelected] = useState(""); const [response, setResponse] = useState(""); const [nextStatus, setNextStatus] = useState("Resolved");
  const { value, loading, error, refresh } = useLoad(() => adminApi.helpRequests(filters), [filters.status, filters.priority, filters.category]);
  const send = async (id: string) => { if (!response.trim()) return toast.error("Write a response first."); const result = dataOf(await adminApi.respondHelpRequest(id, response, nextStatus)); toast[result.emailDeliveryStatus === "failed" ? "warning" : "success"](result.emailDeliveryStatus === "failed" ? "Response saved. Email failed; retry is available." : "Response sent"); setSelected(""); setResponse(""); await refresh(); };
  const items = value.items || [];
  return <Frame title="Help requests" note="Responses are saved before email delivery." actions={<div className="flex flex-wrap gap-2"><label htmlFor="help-status" className="sr-only">Filter help requests by status</label><Select id="help-status" value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}><option value="">All statuses</option>{["Open", "In Progress", "Resolved", "Closed"].map(item => <option key={item}>{item}</option>)}</Select><label htmlFor="help-priority" className="sr-only">Filter help requests by priority</label><Select id="help-priority" value={filters.priority} onChange={e => setFilters({ ...filters, priority: e.target.value })}><option value="">All priorities</option>{["Urgent", "High", "Medium", "Low"].map(item => <option key={item}>{item}</option>)}</Select></div>}>
    <Empty loading={loading} error={error} onRetry={() => void refresh()}><div className="space-y-2">{items.map((item: RecordItem) => <details key={item._id} className="rounded-lg border border-[var(--ui-border)] bg-[var(--ui-surface)] open:bg-[var(--ui-surface-muted)]"><summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-accent)]"><div><p className="font-bold text-[var(--ui-text)]">{item.subject}</p><p className="mt-1 text-sm text-[var(--ui-text-muted)]">{item.ticketNumber || "No ticket number"} · email {item.emailDeliveryStatus || "not sent"}</p></div><div className="flex flex-wrap justify-end gap-2"><StatusBadge value={item.priorityLevel} /><StatusBadge value={item.status} /></div></summary><div className="space-y-3 border-t border-[var(--ui-border)] p-4"><p className="text-sm leading-6 text-[var(--ui-text-muted)]">{item.issueDetails || "No issue details provided."}</p>{item.adminResponse && <div className="rounded-lg bg-[var(--ui-surface)] p-4 text-sm text-[var(--ui-text)]" dangerouslySetInnerHTML={{ __html: item.adminResponse }} />}<div className="flex flex-wrap gap-2">{item.emailDeliveryStatus === "failed" && <Button variant="danger" onClick={async () => { await adminApi.retryHelpEmail(item._id); toast.success("Retry email completed"); await refresh(); }}>Retry email</Button>}<Button muted onClick={() => { setSelected(item._id); setResponse(item.adminResponse || ""); }}>Write response</Button></div>{selected === item._id && <div className="max-w-3xl space-y-2"><label htmlFor={`help-response-${item._id}`} className="text-sm font-semibold text-[var(--ui-text)]">Response to requester</label><Textarea id={`help-response-${item._id}`} value={response} onChange={e => setResponse(e.target.value)} placeholder="Write a clear response"/><label htmlFor={`help-next-status-${item._id}`} className="text-sm font-semibold text-[var(--ui-text)]">Status after response</label><Select id={`help-next-status-${item._id}`} value={nextStatus} onChange={e => setNextStatus(e.target.value)}>{["Open", "In Progress", "Resolved", "Closed"].map(status => <option key={status}>{status}</option>)}</Select><div><Button onClick={() => void send(item._id)}>Save and send email</Button></div></div>}</div></details>)}{!items.length && <p className="rounded-lg bg-[var(--ui-surface-muted)] p-4 text-sm text-[var(--ui-text-muted)]">No help requests match the selected status and priority.</p>}</div></Empty>
  </Frame>;
}

export function AdminFinancePanel({ kind }: { kind: "refunds" | "payouts" }) {
  const loader = kind === "refunds" ? () => adminApi.refunds() : () => earningsApi.admin();
  const { value, loading, error, refresh } = useLoad(loader, [kind]); const [selected, setSelected] = useState(""); const [reference, setReference] = useState("");
  const raw = kind === "refunds" ? (value.items || []) : (value.items || []); const items = kind === "refunds" ? raw.filter((item: RecordItem) => ["refund_pending", "refunded"].includes(item.paymentStatus)) : raw;
  const submit = async (id: string) => { if (reference.trim().length < 3) return toast.error("A provider or bank reference is required."); if (kind === "refunds") await adminApi.processBookingRefund(id, reference); else await earningsApi.markPaid(id, reference); toast.success(kind === "refunds" ? "Record refund completed" : "Mark paid completed"); setSelected(""); setReference(""); await refresh(); };
  const title = kind === "refunds" ? "Refunds" : "Payouts";
  return <Frame title={title} note={kind === "refunds" ? "Pending and processed booking refunds." : "Eligible and paid mentor earnings."}>
    <Empty loading={loading} error={error} onRetry={() => void refresh()}>{items.length ? <DataTable label={title} headers={[kind === "refunds" ? "Booking" : "Mentor", "Amount", "Status", "Reference", "Actions"]}>{items.map((item: RecordItem) => {
      const status = kind === "refunds" ? item.paymentStatus : item.status;
      const actionable = (kind === "refunds" && status === "refund_pending") || (kind === "payouts" && status === "eligible");
      return <tr key={item._id} className="align-top hover:bg-[var(--ui-surface-muted)]/60">
        <td className="px-3 py-3"><p className="font-semibold text-[var(--ui-text)]">{kind === "refunds" ? `Booking ${item._id}` : nameOf(item.mentor)}</p></td>
        <td className="whitespace-nowrap px-3 py-3 font-semibold tabular-nums text-[var(--ui-text)]">{money(kind === "refunds" ? item.refundAmount : item.netAmount)}</td>
        <td className="px-3 py-3"><StatusBadge value={status} /></td>
        <td className="px-3 py-3 text-[var(--ui-text-muted)]">{item.refundReference || item.payoutReference || "No reference"}{selected === item._id && <div className="mt-3 min-w-[280px] space-y-2"><label htmlFor={`finance-reference-${item._id}`} className="text-xs font-semibold text-[var(--ui-text)]">{kind === "refunds" ? "Provider refund reference" : "Bank transfer reference"}</label><Input id={`finance-reference-${item._id}`} autoFocus minLength={3} placeholder={kind === "refunds" ? "Provider refund reference" : "Bank transfer reference"} value={reference} onChange={e => setReference(e.target.value)}/><div className="flex gap-2"><Button onClick={() => void submit(item._id)}>Confirm</Button><Button muted onClick={() => { setSelected(""); setReference(""); }}>Cancel</Button></div></div>}</td>
        <td className="px-3 py-3 text-right">{actionable && <Button muted onClick={() => setSelected(item._id)}>{kind === "refunds" ? "Record refund" : "Mark paid"}</Button>}</td>
      </tr>;
    })}</DataTable> : <p className="rounded-lg bg-[var(--ui-surface-muted)] p-4 text-sm text-[var(--ui-text-muted)]">{kind === "refunds" ? "No pending or processed booking refunds." : "No eligible or paid mentor earnings."}</p>}</Empty>
  </Frame>;
}

export function AdminAuditPanel() {
  const [filters, setFilters] = useState({ action: "", targetType: "", page: 1 }); const { value, loading, error, refresh } = useLoad(() => adminApi.audit(filters), [filters.action, filters.targetType, filters.page]);
  const items = value.items || [];
  return <Frame title="Audit log" note="Immutable history of privileged operations." actions={<div className="flex flex-wrap gap-2"><label htmlFor="audit-action" className="sr-only">Filter by action</label><Input id="audit-action" className="sm:w-44" placeholder="Action" value={filters.action} onChange={e => setFilters({ ...filters, action: e.target.value, page: 1 })}/><label htmlFor="audit-target" className="sr-only">Filter by target type</label><Input id="audit-target" className="sm:w-44" placeholder="Target type" value={filters.targetType} onChange={e => setFilters({ ...filters, targetType: e.target.value, page: 1 })}/></div>}>
    <Empty loading={loading} error={error} onRetry={() => void refresh()}>{items.length ? <DataTable label="Privileged operation audit log" headers={["Action", "Actor", "Target", "Reason", "Result", "Time"]}>{items.map((item: RecordItem) => <tr key={item._id} className="align-top hover:bg-[var(--ui-surface-muted)]/60">
      <td className="px-3 py-3 font-semibold text-[var(--ui-text)]">{item.action}</td><td className="px-3 py-3 text-[var(--ui-text)]"><p>{nameOf(item.actor)}</p><p className="mt-1 text-xs text-[var(--ui-text-muted)]">{item.actorAdminLevel || "Unknown level"}</p></td><td className="px-3 py-3 text-[var(--ui-text-muted)]">{item.targetType || "—"}</td><td className="max-w-xs px-3 py-3 text-[var(--ui-text-muted)]">{item.reason || "—"}</td><td className="px-3 py-3"><StatusBadge value={item.result} /></td><td className="whitespace-nowrap px-3 py-3 text-[var(--ui-text-muted)]">{dateOf(item.createdAt)}</td>
    </tr>)}</DataTable> : <p className="rounded-lg bg-[var(--ui-surface-muted)] p-4 text-sm text-[var(--ui-text-muted)]">No privileged operations match the current filters.</p>}</Empty>
  </Frame>;
}

export function AdminSettingsPanel({ me, onChanged }: { me: AdminMe; onChanged: (user: AdminMe) => void }) {
  const [profile, setProfile] = useState({ firstName: me.firstName || "", lastName: me.lastName || "" });
  const [email, setEmail] = useState({ email: me.email || "", currentPassword: "" }); const [password, setPassword] = useState({ currentPassword: "", newPassword: "" }); const [search, setSearch] = useState("");
  const [saving, setSaving] = useState<"profile" | "email" | "password" | "">("");
  const access = useLoad(() => adminApi.users({ search, limit: 20 }), [search]);
  const submit = async (event: FormEvent, kind: "profile" | "email" | "password") => {
    event.preventDefault();
    setSaving(kind);
    try {
      const result = kind === "profile" ? dataOf(await adminApi.updateProfile(profile)) : kind === "email" ? dataOf(await adminApi.changeEmail(email)) : dataOf(await adminApi.changePassword(password));
      if (kind !== "password") onChanged(result);
      if (kind === "email") setEmail(current => ({ ...current, currentPassword: "" }));
      if (kind === "password") setPassword({ currentPassword: "", newPassword: "" });
      toast.success(kind === "email" ? "Email updated" : kind === "password" ? "Password updated" : "Name updated");
    } catch (error: any) {
      toast.error(error?.response?.data?.data?.message || "Could not update settings.");
    } finally {
      setSaving("");
    }
  };
  const admins = (access.value.items || []).filter((item: RecordItem) => item.adminLevel !== "site_administrator");
  return <div className="space-y-4"><Frame title="Settings" note="Profile changes are separate from credential changes."><div className="grid gap-6 xl:grid-cols-3">
    <form onSubmit={e => void submit(e, "profile")} className="space-y-3"><h3 className="font-bold text-[var(--ui-text)]">Name</h3><label htmlFor="settings-first-name" className="text-sm font-semibold text-[var(--ui-text)]">First name</label><Input id="settings-first-name" autoComplete="given-name" required value={profile.firstName} onChange={e => setProfile({ ...profile, firstName: e.target.value })}/><label htmlFor="settings-last-name" className="text-sm font-semibold text-[var(--ui-text)]">Last name</label><Input id="settings-last-name" autoComplete="family-name" required value={profile.lastName} onChange={e => setProfile({ ...profile, lastName: e.target.value })}/><Button type="submit" disabled={Boolean(saving)}>{saving === "profile" ? "Saving..." : "Save name"}</Button></form>
    <form onSubmit={e => void submit(e, "email")} className="space-y-3"><h3 className="font-bold text-[var(--ui-text)]">Email</h3><label htmlFor="settings-email" className="text-sm font-semibold text-[var(--ui-text)]">Email address</label><Input id="settings-email" type="email" autoComplete="email" required value={email.email} onChange={e => setEmail({ ...email, email: e.target.value })}/><label htmlFor="settings-email-password" className="text-sm font-semibold text-[var(--ui-text)]">Current password</label><Input id="settings-email-password" type="password" autoComplete="current-password" required value={email.currentPassword} onChange={e => setEmail({ ...email, currentPassword: e.target.value })}/><Button type="submit" disabled={Boolean(saving)}>{saving === "email" ? "Saving..." : "Change email"}</Button></form>
    <form onSubmit={e => void submit(e, "password")} className="space-y-3"><h3 className="font-bold text-[var(--ui-text)]">Password</h3><label htmlFor="settings-current-password" className="text-sm font-semibold text-[var(--ui-text)]">Current password</label><Input id="settings-current-password" type="password" autoComplete="current-password" required value={password.currentPassword} onChange={e => setPassword({ ...password, currentPassword: e.target.value })}/><label htmlFor="settings-new-password" className="text-sm font-semibold text-[var(--ui-text)]">New password</label><Input id="settings-new-password" type="password" autoComplete="new-password" required minLength={8} value={password.newPassword} onChange={e => setPassword({ ...password, newPassword: e.target.value })}/><p className="text-xs leading-5 text-[var(--ui-text-muted)]">At least 8 characters with uppercase, lowercase, number and symbol.</p><Button type="submit" disabled={Boolean(saving)}>{saving === "password" ? "Saving..." : "Change password"}</Button></form>
  </div></Frame>{me.adminLevel === "site_administrator" && <Frame title="Administrator access" note="Only the Site administrator can grant or revoke Admin access." actions={<><label htmlFor="admin-access-search" className="sr-only">Search account</label><Input id="admin-access-search" className="sm:w-56" placeholder="Search account" value={search} onChange={e => setSearch(e.target.value)}/></>}><Empty loading={access.loading} error={access.error} onRetry={() => void access.refresh()}><div>{admins.map((item: RecordItem) => <Row key={item._id}><div><p className="font-bold text-[var(--ui-text)]">{nameOf(item)}</p><p className="text-sm text-[var(--ui-text-muted)]">{item.email} · {item.adminLevel || item.role}</p></div>{item.adminLevel === "admin" ? <Button muted onClick={async () => { await adminApi.revokeAdmin(item._id); await access.refresh(); }}>Revoke Admin</Button> : <Button muted onClick={async () => { await adminApi.grantAdmin(item._id); await access.refresh(); }}>Grant Admin</Button>}</Row>)}{!admins.length && <p className="rounded-lg bg-[var(--ui-surface-muted)] p-4 text-sm text-[var(--ui-text-muted)]">No accounts match this search.</p>}</div></Empty></Frame>}</div>;
}
