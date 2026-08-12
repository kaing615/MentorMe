import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import adminApi from "../api/modules/admin.api";
import AdminSidebar, { type AdminSection } from "../components/admin/AdminSidebar";
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

  const open = (section: AdminSection) => {
    localStorage.setItem("adminDashboardSection", section);
    setActiveSection(section);
    window.scrollTo({ top: 0, behavior: "smooth" });
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

  if (loading) return <main className="min-h-[100dvh] bg-[var(--ui-page)] px-4 py-8"><div className="mx-auto h-96 max-w-[1500px] animate-pulse rounded-2xl bg-[var(--ui-surface-muted)]" /></main>;

  return (
    <main className="min-h-[100dvh] bg-[var(--ui-page)] px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <div className="mx-auto grid max-w-[1500px] gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <AdminSidebar me={me} active={activeSection} onChange={open} />
        <section className="min-w-0">
          {error ? <p role="alert" className="rounded-2xl border border-red-400 bg-red-50 p-4 text-sm text-red-800 dark:bg-red-950/30 dark:text-red-200">{error}</p> : panel}
        </section>
      </div>
    </main>
  );
};

export default AdminDashboard;
