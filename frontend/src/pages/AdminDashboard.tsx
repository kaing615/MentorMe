import { useCallback, useEffect, useState } from "react";
import { IconCheck, IconRefresh, IconShieldCheck, IconX } from "@tabler/icons-react";
import { toast } from "react-toastify";
import adminApi from "../api/modules/admin.api";
import earningsApi from "../api/modules/earnings.api";

const AdminDashboard = () => {
  const [applications, setApplications] = useState<any[]>([]);
  const [refunds, setRefunds] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [busy, setBusy] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [applicationResponse, refundResponse, payoutResponse] = await Promise.all([
        adminApi.mentorApplications(),
        adminApi.refunds(),
        earningsApi.admin({ status: "eligible" }),
      ]);
      setApplications(applicationResponse.data?.data?.applications || []);
      setRefunds(
        (refundResponse.data?.data?.items || []).filter(
          (booking: any) => booking.paymentStatus === "refund_pending",
        ),
      );
      setPayouts(payoutResponse.data?.data?.items || []);
    } catch {
      setError("We couldn't load the operations queue. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const review = async (id: string, status: "approved" | "rejected") => {
    setBusy(id);
    try {
      const reason = status === "rejected" ? "Profile needs more verifiable detail." : "";
      await adminApi.reviewMentorApplication(id, status, reason);
      toast.success(status === "approved" ? "Mentor approved" : "Application rejected");
      await load();
    } finally {
      setBusy("");
    }
  };

  const processRefund = async (id: string) => {
    const reference = window.prompt("Provider refund reference");
    if (!reference) return;
    await adminApi.processBookingRefund(id, reference);
    toast.success("Refund recorded");
    await load();
  };

  const markPaid = async (id: string) => {
    const reference = window.prompt("Bank transfer reference");
    if (!reference) return;
    await earningsApi.markPaid(id, reference);
    toast.success("Payout recorded");
    await load();
  };

  return (
    <main className="min-h-[100dvh] bg-[var(--ui-page)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="ui-brand-hero relative overflow-hidden p-6 sm:p-8">
          <span aria-hidden="true" className="absolute -right-6 -top-7 h-28 w-28 rounded-full border-2 border-dashed border-white/35" />
          <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-yellow-300">Trust operations</p>
              <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-white sm:text-4xl">Admin dashboard</h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100">Review people and money movement from one clear queue.</p>
            </div>
            <button onClick={() => void load()} disabled={loading} className="ui-button-highlight inline-flex items-center justify-center gap-2 self-start px-4 py-2.5 text-sm font-black text-blue-950 disabled:opacity-60 sm:self-auto">
              <IconRefresh className={loading ? "animate-spin" : ""} size={17} /> Refresh
            </button>
          </div>
        </header>

        {error && <div className="ui-sketch-note border-red-400 bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-200" role="alert">{error}</div>}

        <section className="ui-card ui-card-yellow p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-lg font-bold text-[var(--ui-text)]"><IconShieldCheck className="text-[var(--ui-accent)]" /> Mentor applications ({applications.length})</h2>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {loading && [0, 1].map((item) => <div key={item} className="h-44 animate-pulse rounded-2xl bg-[var(--ui-surface-muted)]" />)}
            {applications.map((application) => (
              <article key={application._id} className="rounded-2xl border-2 border-dashed border-[var(--ui-border)] bg-[var(--ui-surface)] p-5 transition-transform hover:-translate-y-0.5">
                <div className="flex items-start gap-4">
                  <img src={application.user?.avatarUrl || "/favicon.svg"} alt="" className="h-12 w-12 rounded-2xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-[var(--ui-text)]">{application.user?.firstName} {application.user?.lastName}</h3>
                    <p className="text-sm text-[var(--ui-text-muted)]">{application.user?.jobTitle} · {application.user?.category}</p>
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--ui-text-muted)]">{application.user?.bio}</p>
                  </div>
                </div>
                <div className="mt-5 flex gap-2">
                  <button disabled={busy === application._id} onClick={() => void review(application._id, "approved")} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--ui-accent)] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"><IconCheck size={17} /> Approve</button>
                  <button disabled={busy === application._id} onClick={() => void review(application._id, "rejected")} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--ui-surface-muted)] px-4 py-2.5 text-sm font-bold text-[var(--ui-text)]"><IconX size={17} /> Reject</button>
                </div>
              </article>
            ))}
            {!loading && !applications.length && <p className="text-sm text-[var(--ui-text-muted)]">No applications waiting.</p>}
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="ui-card ui-card-blue p-5 sm:p-6">
            <h2 className="text-lg font-bold text-[var(--ui-text)]">Refund queue ({refunds.length})</h2>
            <div className="mt-4 space-y-3">
              {refunds.map((booking) => (
                <button key={booking._id} onClick={() => void processRefund(booking._id)} className="flex w-full items-center justify-between rounded-2xl border-2 border-dashed border-[var(--ui-border)] bg-[var(--ui-surface)] p-4 text-left transition-transform hover:-translate-y-0.5 hover:border-[var(--ui-accent)]">
                  <span><strong className="block text-[var(--ui-text)]">{booking.refundAmount?.toLocaleString("vi-VN")} ₫</strong><small className="text-[var(--ui-text-muted)]">Booking {booking._id}</small></span>
                  <span className="text-sm font-bold text-[var(--ui-accent)]">Record refund</span>
                </button>
              ))}
              {loading && <div className="h-20 animate-pulse rounded-2xl bg-[var(--ui-surface-muted)]" />}
              {!loading && !refunds.length && <p className="text-sm text-[var(--ui-text-muted)]">No pending refunds.</p>}
            </div>
          </section>

          <section className="ui-card ui-card-yellow p-5 sm:p-6">
            <h2 className="text-lg font-bold text-[var(--ui-text)]">Payout queue ({payouts.length})</h2>
            <div className="mt-4 space-y-3">
              {payouts.map((earning) => (
                <button key={earning._id} onClick={() => void markPaid(earning._id)} className="flex w-full items-center justify-between rounded-2xl border-2 border-dashed border-[var(--ui-border)] bg-[var(--ui-surface)] p-4 text-left transition-transform hover:-translate-y-0.5 hover:border-[var(--ui-accent)]">
                  <span><strong className="block text-[var(--ui-text)]">{earning.netAmount?.toLocaleString("vi-VN")} ₫</strong><small className="text-[var(--ui-text-muted)]">{earning.mentor?.firstName} {earning.mentor?.lastName}</small></span>
                  <span className="text-sm font-bold text-[var(--ui-accent)]">Mark paid</span>
                </button>
              ))}
              {loading && <div className="h-20 animate-pulse rounded-2xl bg-[var(--ui-surface-muted)]" />}
              {!loading && !payouts.length && <p className="text-sm text-[var(--ui-text-muted)]">No eligible payouts.</p>}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
};

export default AdminDashboard;
