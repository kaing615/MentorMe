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
  return <section className="rounded-2xl border-2 border-[var(--ui-border)] bg-[var(--ui-surface)] p-5 sm:p-6">
    <div className="flex flex-col gap-3 border-b border-[var(--ui-border)] pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div><h2 className="text-xl font-bold tracking-[-0.02em] text-[var(--ui-text)]">{title}</h2>{note && <p className="mt-1 max-w-2xl text-sm text-[var(--ui-text-muted)]">{note}</p>}</div>
      {actions}
    </div>
    <div className="mt-5">{children}</div>
  </section>;
}

const Button = ({ children, muted = false, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { muted?: boolean }) =>
  <button {...props} className={`rounded-lg border px-3 py-2 text-sm font-semibold transition active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 ${muted ? "border-[var(--ui-border)] bg-[var(--ui-surface-muted)] text-[var(--ui-text)]" : "border-[var(--ui-accent)] bg-[var(--ui-accent)] text-white"}`}>{children}</button>;
const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} className="min-h-10 w-full rounded-lg border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 text-sm text-[var(--ui-text)] outline-none focus:border-[var(--ui-accent)]" />;
const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => <select {...props} className="min-h-10 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 text-sm text-[var(--ui-text)] outline-none focus:border-[var(--ui-accent)]" />;
const Textarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...props} className="min-h-24 w-full resize-y rounded-lg border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2 text-sm text-[var(--ui-text)] outline-none focus:border-[var(--ui-accent)]" />;
const Empty = ({ loading, error, children }: { loading: boolean; error: string; children: ReactNode }) => loading ? <div className="space-y-3">{[0, 1, 2].map(i => <div key={i} className="h-16 animate-pulse rounded-xl bg-[var(--ui-surface-muted)]" />)}</div> : error ? <p role="alert" className="rounded-xl border border-red-400 bg-red-50 p-4 text-sm text-red-800 dark:bg-red-950/30 dark:text-red-200">{error}</p> : <>{children}</>;
const Row = ({ children }: { children: ReactNode }) => <div className="grid gap-3 border-b border-[var(--ui-border)] py-4 last:border-0 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">{children}</div>;

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
  return <div className="space-y-6">
    <header className="rounded-2xl border-2 border-[var(--ui-border)] bg-[var(--ui-accent)] px-6 py-7 text-white sm:px-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-3xl font-black tracking-[-0.04em] sm:text-4xl">Administrator workspace</h1><p className="mt-2 max-w-2xl text-sm text-blue-100">Review access, learning activity, support and money movement from one operational view.</p></div><Button muted onClick={() => void refresh()}>Refresh data</Button></div>
    </header>
    <Empty loading={loading} error={error}><>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[["Total users", metrics.totalUsers], ["Pending applications", metrics.pendingApplications], ["Active sessions", metrics.activeSessions], ["Open help requests", metrics.openHelpRequests]].map(([label, value]) => <article key={String(label)} className="rounded-2xl border-2 border-[var(--ui-border)] bg-[var(--ui-surface)] p-5"><p className="text-sm text-[var(--ui-text-muted)]">{label}</p><p className="mt-3 text-3xl font-black tabular-nums text-[var(--ui-text)]">{Number(value || 0)}</p></article>)}</div>
      <div className="grid gap-6 xl:grid-cols-2"><Frame title="Needs attention" note="Queues that can block users or money movement."><div>{links.map(([label, count, section]) => <button key={section} onClick={() => onNavigate(section)} className="flex w-full items-center justify-between border-b border-[var(--ui-border)] py-3 text-left last:border-0"><span className="font-medium text-[var(--ui-text)]">{label}</span><span className="font-bold tabular-nums text-[var(--ui-accent)]">{count || 0}</span></button>)}</div></Frame><Frame title="Recent activity" note="Latest privileged actions."><div>{(value.recentActivity || []).slice(0, 8).map((item: RecordItem) => <Row key={item._id}><div><p className="font-medium text-[var(--ui-text)]">{item.action}</p><p className="text-xs text-[var(--ui-text-muted)]">{item.targetType} · {dateOf(item.createdAt)}</p></div><span className="text-xs text-[var(--ui-text-muted)]">{item.result}</span></Row>)}{!value.recentActivity?.length && <p className="text-sm text-[var(--ui-text-muted)]">No administrative activity yet.</p>}</div></Frame></div>
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
  return <Frame title="Mentor applications" note="Inspect the complete submitted profile before deciding." actions={<Select value={status} onChange={event => setStatus(event.target.value)}><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option></Select>}><Empty loading={loading} error={error}><div>{(value.applications || []).map((item: RecordItem) => <details key={item._id} className="border-b border-[var(--ui-border)] py-4 last:border-0"><summary className="cursor-pointer list-none"><p className="font-bold text-[var(--ui-text)]">{nameOf(item.user)}</p><p className="mt-1 text-sm text-[var(--ui-text-muted)]">{item.user?.jobTitle || "No job title"} · {item.user?.category || "No category"}</p></summary><div className="mt-4 grid gap-4 md:grid-cols-2"><div className="space-y-2 text-sm text-[var(--ui-text-muted)]"><p>{item.user?.email}</p><p>{item.user?.location}</p><p>{item.user?.bio}</p><p><strong className="text-[var(--ui-text)]">Why mentor:</strong> {item.user?.mentorReason}</p><p><strong className="text-[var(--ui-text)]">Skills:</strong> {(item.user?.skills || []).join(", ") || "—"}</p></div>{item.status === "pending" && <div className="space-y-3"><Textarea aria-label="Rejection reason" placeholder="Reason required for rejection" value={reason[item._id] || ""} onChange={event => setReason(current => ({ ...current, [item._id]: event.target.value }))} minLength={5} /><div className="flex gap-2"><Button onClick={() => void review(item._id, "approved")}>Approve</Button><Button muted onClick={() => void review(item._id, "rejected")}>Reject</Button></div></div>}</div></details>)}{!value.applications?.length && <p className="text-sm text-[var(--ui-text-muted)]">No applications in this queue.</p>}</div></Empty></Frame>;
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
  return <Frame title="Users" note="Search accounts, suspend policy violations and manage delegated access." actions={<div className="flex flex-wrap gap-2"><Input aria-label="Search users" placeholder="Search users" value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value, page: 1 })}/><Select value={filters.role} onChange={e => setFilters({ ...filters, role: e.target.value, page: 1 })}><option value="">All roles</option><option value="mentee">Mentee</option><option value="mentor">Mentor</option><option value="admin">Admin</option></Select></div>}><Empty loading={loading} error={error}><div>{(value.items || []).map((item: RecordItem) => <Row key={item._id}><div><p className="font-bold text-[var(--ui-text)]">{nameOf(item)}</p><p className="text-sm text-[var(--ui-text-muted)]">{item.email} · {item.role}{item.isSuspended ? ` · Suspended: ${item.suspensionReason}` : ""}</p>{reasonFor === item._id && <div className="mt-3 flex max-w-xl gap-2"><Input autoFocus minLength={5} placeholder="Suspension reason" value={reason} onChange={e => setReason(e.target.value)}/><Button onClick={() => void mutate("Suspend", item._id)}>Confirm</Button><Button muted onClick={() => setReasonFor("")}>Cancel</Button></div>}</div><div className="flex flex-wrap gap-2">{item.isSuspended ? <Button muted onClick={() => void mutate("Restore", item._id)}>Restore</Button> : <Button muted onClick={() => setReasonFor(item._id)}>Suspend</Button>}{me.adminLevel === "site_administrator" && item.adminLevel !== "site_administrator" && (item.adminLevel === "admin" ? <Button muted onClick={() => void mutate("Revoke Admin", item._id)}>Revoke Admin</Button> : <Button muted onClick={() => void mutate("Grant Admin", item._id)}>Grant Admin</Button>)}</div></Row>)}<div className="mt-5 flex items-center justify-between"><Button muted disabled={filters.page <= 1} onClick={() => setFilters({ ...filters, page: filters.page - 1 })}>Previous</Button><span className="text-sm text-[var(--ui-text-muted)]">Page {filters.page}</span><Button muted disabled={(value.items || []).length < (value.limit || 10)} onClick={() => setFilters({ ...filters, page: filters.page + 1 })}>Next</Button></div></div></Empty></Frame>;
}

export function AdminSessionsPanel() {
  const [status, setStatus] = useState(""); const [editing, setEditing] = useState(""); const [text, setText] = useState(""); const [cancelId, setCancelId] = useState("");
  const { value, loading, error, refresh } = useLoad(() => adminApi.sessions({ status, limit: 100 }), [status]);
  const saveNotes = async (id: string) => { await adminApi.updateSessionNotes(id, text); setEditing(""); toast.success("Session notes saved"); await refresh(); };
  const cancel = async (id: string) => { if (text.trim().length < 5) return toast.error("Add a reason of at least 5 characters."); await adminApi.cancelSession(id, text); setCancelId(""); setText(""); toast.success("Session cancelled"); await refresh(); };
  const refund = async (id: string) => { if (text.trim().length < 3) return toast.error("Add the provider refund reference."); await adminApi.processBookingRefund(id, text); setEditing(""); setText(""); toast.success("Record refund completed"); await refresh(); };
  return <Frame title="Sessions" note="Operational notes, cancellations and refund handling only." actions={<Select value={status} onChange={e => setStatus(e.target.value)}><option value="">All statuses</option>{["pending", "active", "finished", "cancelled", "rejected"].map(item => <option key={item}>{item}</option>)}</Select>}><Empty loading={loading} error={error}><div>{(value.items || []).map((item: RecordItem) => <Row key={item._id}><div><p className="font-bold text-[var(--ui-text)]">{nameOf(item.mentor)} with {nameOf(item.mentee)}</p><p className="text-sm text-[var(--ui-text-muted)]">{dateOf(item.date)} · {item.start}-{item.end} · {item.status} · {item.paymentStatus}</p><p className="mt-1 text-sm text-[var(--ui-text-muted)]">{item.notes || "No operational notes"}</p>{(editing === item._id || cancelId === item._id) && <div className="mt-3 flex max-w-2xl gap-2"><Input autoFocus minLength={editing === item._id && item.paymentStatus === "refund_pending" ? 3 : 5} placeholder={cancelId === item._id ? "Cancellation reason" : item.paymentStatus === "refund_pending" ? "Provider refund reference" : "Operational notes"} value={text} onChange={e => setText(e.target.value)}/><Button onClick={() => void (cancelId === item._id ? cancel(item._id) : item.paymentStatus === "refund_pending" ? refund(item._id) : saveNotes(item._id))}>Confirm</Button></div>}</div><div className="flex flex-wrap gap-2"><Button muted onClick={() => { setEditing(item._id); setCancelId(""); setText(item.notes || ""); }}>Edit notes</Button>{["pending", "active"].includes(item.status) && <Button muted onClick={() => { setCancelId(item._id); setEditing(""); setText(""); }}>Cancel session</Button>}{item.paymentStatus === "refund_pending" && <Button muted onClick={() => { setEditing(item._id); setCancelId(""); setText(""); }}>Record refund</Button>}</div></Row>)}</div></Empty></Frame>;
}

export function AdminCoursesPanel() {
  const [filters, setFilters] = useState({ search: "", status: "" }); const [selected, setSelected] = useState(""); const [reason, setReason] = useState("");
  const { value, loading, error, refresh } = useLoad(() => adminApi.courses(filters), [filters.search, filters.status]);
  const suspend = async (id: string) => { if (reason.trim().length < 5) return toast.error("Add a reason of at least 5 characters."); await adminApi.suspendCourse(id, reason); setSelected(""); setReason(""); toast.success("Course suspended"); await refresh(); };
  return <Frame title="Courses" note="Moderate marketplace visibility. Existing buyers keep access." actions={<div className="flex gap-2"><Input placeholder="Search courses" value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })}/><Select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}><option value="">All states</option><option value="published">Published</option><option value="suspended">Suspended</option></Select></div>}><Empty loading={loading} error={error}><div>{(value.items || []).map((item: RecordItem) => <Row key={item._id}><div><p className="font-bold text-[var(--ui-text)]">{item.title}</p><p className="text-sm text-[var(--ui-text-muted)]">{nameOf(item.mentor)} · {money(item.price)} · {item.moderationStatus || "published"}</p>{item.suspensionReason && <p className="mt-1 text-sm text-[var(--ui-text-muted)]">{item.suspensionReason}</p>}{selected === item._id && <div className="mt-3 flex max-w-xl gap-2"><Input autoFocus minLength={5} placeholder="Suspension reason" value={reason} onChange={e => setReason(e.target.value)}/><Button onClick={() => void suspend(item._id)}>Confirm</Button></div>}</div><div>{item.moderationStatus === "suspended" ? <Button muted onClick={async () => { await adminApi.restoreCourse(item._id); toast.success("Course restored"); await refresh(); }}>Restore</Button> : <Button muted onClick={() => setSelected(item._id)}>Suspend</Button>}</div></Row>)}</div></Empty></Frame>;
}

export function AdminHelpPanel() {
  const [filters, setFilters] = useState({ status: "", priority: "", category: "" }); const [selected, setSelected] = useState(""); const [response, setResponse] = useState(""); const [nextStatus, setNextStatus] = useState("Resolved");
  const { value, loading, error, refresh } = useLoad(() => adminApi.helpRequests(filters), [filters.status, filters.priority, filters.category]);
  const send = async (id: string) => { if (!response.trim()) return toast.error("Write a response first."); const result = dataOf(await adminApi.respondHelpRequest(id, response, nextStatus)); toast[result.emailDeliveryStatus === "failed" ? "warning" : "success"](result.emailDeliveryStatus === "failed" ? "Response saved. Email failed; retry is available." : "Response sent"); setSelected(""); setResponse(""); await refresh(); };
  return <Frame title="Help requests" note="Responses are saved before email delivery." actions={<div className="flex flex-wrap gap-2"><Select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}><option value="">All statuses</option>{["Open", "In Progress", "Resolved", "Closed"].map(item => <option key={item}>{item}</option>)}</Select><Select value={filters.priority} onChange={e => setFilters({ ...filters, priority: e.target.value })}><option value="">All priorities</option>{["Urgent", "High", "Medium", "Low"].map(item => <option key={item}>{item}</option>)}</Select></div>}><Empty loading={loading} error={error}><div>{(value.items || []).map((item: RecordItem) => <details key={item._id} className="border-b border-[var(--ui-border)] py-4 last:border-0"><summary className="cursor-pointer list-none"><p className="font-bold text-[var(--ui-text)]">{item.subject}</p><p className="text-sm text-[var(--ui-text-muted)]">{item.ticketNumber} · {item.priorityLevel} · {item.status} · email {item.emailDeliveryStatus || "not sent"}</p></summary><div className="mt-4 space-y-3"><p className="text-sm leading-6 text-[var(--ui-text-muted)]">{item.issueDetails}</p>{item.adminResponse && <div className="rounded-xl bg-[var(--ui-surface-muted)] p-4 text-sm text-[var(--ui-text)]" dangerouslySetInnerHTML={{ __html: item.adminResponse }} />}{item.emailDeliveryStatus === "failed" && <Button muted onClick={async () => { await adminApi.retryHelpEmail(item._id); toast.success("Retry email completed"); await refresh(); }}>Retry email</Button>}<Button muted onClick={() => { setSelected(item._id); setResponse(item.adminResponse || ""); }}>Write response</Button>{selected === item._id && <div className="space-y-2"><Textarea value={response} onChange={e => setResponse(e.target.value)} placeholder="Response to requester"/><Select value={nextStatus} onChange={e => setNextStatus(e.target.value)}>{["Open", "In Progress", "Resolved", "Closed"].map(status => <option key={status}>{status}</option>)}</Select><Button onClick={() => void send(item._id)}>Save and send email</Button></div>}</div></details>)}</div></Empty></Frame>;
}

export function AdminFinancePanel({ kind }: { kind: "refunds" | "payouts" }) {
  const loader = kind === "refunds" ? () => adminApi.refunds() : () => earningsApi.admin();
  const { value, loading, error, refresh } = useLoad(loader, [kind]); const [selected, setSelected] = useState(""); const [reference, setReference] = useState("");
  const raw = kind === "refunds" ? (value.items || []) : (value.items || []); const items = kind === "refunds" ? raw.filter((item: RecordItem) => ["refund_pending", "refunded"].includes(item.paymentStatus)) : raw;
  const submit = async (id: string) => { if (reference.trim().length < 3) return toast.error("A provider or bank reference is required."); if (kind === "refunds") await adminApi.processBookingRefund(id, reference); else await earningsApi.markPaid(id, reference); toast.success(kind === "refunds" ? "Record refund completed" : "Mark paid completed"); setSelected(""); setReference(""); await refresh(); };
  return <Frame title={kind === "refunds" ? "Refunds" : "Payouts"} note={kind === "refunds" ? "Pending and processed booking refunds." : "Eligible and paid mentor earnings."}><Empty loading={loading} error={error}><div>{items.map((item: RecordItem) => <Row key={item._id}><div><p className="font-bold text-[var(--ui-text)]">{money(kind === "refunds" ? item.refundAmount : item.netAmount)}</p><p className="text-sm text-[var(--ui-text-muted)]">{kind === "refunds" ? `Booking ${item._id} · ${item.paymentStatus}` : `${nameOf(item.mentor)} · ${item.status}`} · {item.refundReference || item.payoutReference || "No reference"}</p>{selected === item._id && <div className="mt-3 flex max-w-xl gap-2"><Input autoFocus minLength={3} placeholder={kind === "refunds" ? "Provider refund reference" : "Bank transfer reference"} value={reference} onChange={e => setReference(e.target.value)}/><Button onClick={() => void submit(item._id)}>Confirm</Button></div>}</div>{((kind === "refunds" && item.paymentStatus === "refund_pending") || (kind === "payouts" && item.status === "eligible")) && <Button muted onClick={() => setSelected(item._id)}>{kind === "refunds" ? "Record refund" : "Mark paid"}</Button>}</Row>)}{!items.length && <p className="text-sm text-[var(--ui-text-muted)]">No records found.</p>}</div></Empty></Frame>;
}

export function AdminAuditPanel() {
  const [filters, setFilters] = useState({ action: "", targetType: "", page: 1 }); const { value, loading, error } = useLoad(() => adminApi.audit(filters), [filters.action, filters.targetType, filters.page]);
  return <Frame title="Audit log" note="Immutable history of privileged operations." actions={<div className="flex gap-2"><Input placeholder="Action" value={filters.action} onChange={e => setFilters({ ...filters, action: e.target.value, page: 1 })}/><Input placeholder="Target type" value={filters.targetType} onChange={e => setFilters({ ...filters, targetType: e.target.value, page: 1 })}/></div>}><Empty loading={loading} error={error}><div>{(value.items || []).map((item: RecordItem) => <Row key={item._id}><div><p className="font-bold text-[var(--ui-text)]">{item.action}</p><p className="text-sm text-[var(--ui-text-muted)]">{nameOf(item.actor)} · {item.actorAdminLevel} · {item.targetType} · {dateOf(item.createdAt)}</p>{item.reason && <p className="mt-1 text-sm text-[var(--ui-text-muted)]">{item.reason}</p>}</div><span className="text-xs font-semibold text-[var(--ui-text-muted)]">{item.result}</span></Row>)}</div></Empty></Frame>;
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
  return <div className="space-y-6"><Frame title="Settings" note="Profile changes are separate from credential changes."><div className="grid gap-6 xl:grid-cols-3"><form onSubmit={e => void submit(e, "profile")} className="space-y-3"><h3 className="font-bold text-[var(--ui-text)]">Name</h3><Input required value={profile.firstName} onChange={e => setProfile({ ...profile, firstName: e.target.value })}/><Input required value={profile.lastName} onChange={e => setProfile({ ...profile, lastName: e.target.value })}/><Button type="submit" disabled={Boolean(saving)}>{saving === "profile" ? "Saving..." : "Save name"}</Button></form><form onSubmit={e => void submit(e, "email")} className="space-y-3"><h3 className="font-bold text-[var(--ui-text)]">Email</h3><Input type="email" required value={email.email} onChange={e => setEmail({ ...email, email: e.target.value })}/><Input type="password" required placeholder="Current password" value={email.currentPassword} onChange={e => setEmail({ ...email, currentPassword: e.target.value })}/><Button type="submit" disabled={Boolean(saving)}>{saving === "email" ? "Saving..." : "Change email"}</Button></form><form onSubmit={e => void submit(e, "password")} className="space-y-3"><h3 className="font-bold text-[var(--ui-text)]">Password</h3><Input type="password" required placeholder="Current password" value={password.currentPassword} onChange={e => setPassword({ ...password, currentPassword: e.target.value })}/><Input type="password" required minLength={8} placeholder="New strong password" value={password.newPassword} onChange={e => setPassword({ ...password, newPassword: e.target.value })}/><p className="text-xs leading-5 text-[var(--ui-text-muted)]">At least 8 characters with uppercase, lowercase, number and symbol.</p><Button type="submit" disabled={Boolean(saving)}>{saving === "password" ? "Saving..." : "Change password"}</Button></form></div></Frame>{me.adminLevel === "site_administrator" && <Frame title="Administrator access" note="Only the Site administrator can grant or revoke Admin access." actions={<Input placeholder="Search account" value={search} onChange={e => setSearch(e.target.value)}/>}><Empty loading={access.loading} error={access.error}><div>{(access.value.items || []).filter((item: RecordItem) => item.adminLevel !== "site_administrator").map((item: RecordItem) => <Row key={item._id}><div><p className="font-bold text-[var(--ui-text)]">{nameOf(item)}</p><p className="text-sm text-[var(--ui-text-muted)]">{item.email} · {item.adminLevel || item.role}</p></div>{item.adminLevel === "admin" ? <Button muted onClick={async () => { await adminApi.revokeAdmin(item._id); await access.refresh(); }}>Revoke Admin</Button> : <Button muted onClick={async () => { await adminApi.grantAdmin(item._id); await access.refresh(); }}>Grant Admin</Button>}</Row>)}</div></Empty></Frame>}</div>;
}
