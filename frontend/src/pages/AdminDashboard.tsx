import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import adminApi from "../api/modules/admin.api";
import AdminSidebar, { AdminSectionTitle, type AdminSection } from "../components/admin/AdminSidebar";
import {
  AdminApplicationsPanel,
  AdminAuditPanel,
  AdminCoursesPanel,
  AdminFinancePanel,
  AdminHelpPanel,
  AdminOverviewPanel,
  AdminSessionsPanel,
  AdminSettingsPanel,
  AdminUsersPanel,
} from "../components/admin/AdminPanels";
import { updateUser } from "../redux/features/user.slice";

const sections: AdminSection[] = [
  "overview", "applications", "users", "sessions", "courses",
  "help", "refunds", "payouts", "audit", "settings",
];

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const [me, setMe] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const previousSection = useRef<AdminSection | null>(null);
  const [activeSection, setActiveSection] = useState<AdminSection>(() => {
    const saved = localStorage.getItem("adminDashboardSection") as AdminSection | null;
    return saved && sections.includes(saved) ? saved : "overview";
  });

  useEffect(() => {
    adminApi.me()
      .then(response => setMe(response.data?.data || {}))
      .catch(() => setError("Could not load administrator identity."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (previousSection.current && previousSection.current !== activeSection) {
      window.scrollTo({ top: 0, behavior: "auto" });
      headingRef.current?.focus({ preventScroll: true });
    }
    previousSection.current = activeSection;
  }, [activeSection]);

  const open = (section: AdminSection) => {
    localStorage.setItem("adminDashboardSection", section);
    setActiveSection(section);
  };

  const updateMe = (user: any) => {
    setMe(user);
    dispatch(updateUser(user));
  };

  const panel = {
    overview: <AdminOverviewPanel onNavigate={open} />,
    applications: <AdminApplicationsPanel />,
    users: <AdminUsersPanel me={me} />,
    sessions: <AdminSessionsPanel />,
    courses: <AdminCoursesPanel />,
    help: <AdminHelpPanel />,
    refunds: <AdminFinancePanel kind="refunds" />,
    payouts: <AdminFinancePanel kind="payouts" />,
    audit: <AdminAuditPanel />,
    settings: <AdminSettingsPanel me={me} onChanged={updateMe} />,
  }[activeSection];

  if (loading) return <main className="min-h-[100dvh] bg-[var(--ui-page)] px-4 py-6 sm:px-6 lg:px-8"><div className="mx-auto max-w-[1500px]"><p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--ui-accent)]">Administrator workspace</p><h1 id="admin-panel-heading" className="mt-1 text-2xl font-black tracking-[-0.03em] text-[var(--ui-text)]">Loading workspace</h1><div className="mt-5 h-80 animate-pulse rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)]" /></div></main>;

  return (
    <main className="min-h-[100dvh] bg-[var(--ui-page)] px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
      <div className="mx-auto grid max-w-[1500px] gap-4 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-6">
        <AdminSidebar me={me} active={activeSection} onChange={open} />
        <section aria-labelledby="admin-panel-heading" className="min-w-0">
          <header className="mb-4 flex min-h-16 items-end justify-between border-b border-[var(--ui-border)] pb-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--ui-accent)]">Administrator workspace</p>
              <h1 ref={headingRef} id="admin-panel-heading" tabIndex={-1} className="mt-1 text-2xl font-black tracking-[-0.03em] text-[var(--ui-text)] outline-none sm:text-3xl">
                <AdminSectionTitle section={activeSection} />
              </h1>
            </div>
            <span className="hidden rounded-full bg-[var(--ui-highlight-soft)] px-3 py-1 text-xs font-bold text-[var(--ui-highlight-strong)] sm:inline">Operations console</span>
          </header>
          {error && <p role="alert" className="mb-4 rounded-xl border border-[var(--ui-warning)] bg-[var(--ui-warning-soft)] p-3 text-sm text-[var(--ui-text)]"><strong className="font-bold text-[var(--ui-warning)]">Identity warning:</strong> {error}</p>}
          {panel}
        </section>
      </div>
    </main>
  );
};

export default AdminDashboard;
