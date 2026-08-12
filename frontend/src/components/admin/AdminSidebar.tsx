export type AdminSection =
  | "overview" | "applications" | "users" | "sessions" | "courses"
  | "help" | "refunds" | "payouts" | "audit" | "settings";

type AdminUser = {
  firstName?: string;
  lastName?: string;
  email?: string;
  avatarUrl?: string;
  adminLevel?: "site_administrator" | "admin";
};

const navigation: Array<[string, AdminSection]> = [
  ["Overview", "overview"],
  ["Mentor applications", "applications"],
  ["Users", "users"],
  ["Sessions", "sessions"],
  ["Courses", "courses"],
  ["Help requests", "help"],
  ["Refunds", "refunds"],
  ["Payouts", "payouts"],
  ["Audit log", "audit"],
  ["Settings", "settings"],
];

export default function AdminSidebar({ me, active, onChange }: {
  me: AdminUser;
  active: AdminSection;
  onChange: (section: AdminSection) => void;
}) {
  const role = me.adminLevel === "site_administrator" ? "Site administrator" : "Admin";
  return (
    <aside className="h-fit overflow-hidden rounded-2xl border-2 border-[var(--ui-border)] bg-[var(--ui-surface)] p-3 lg:sticky lg:top-24">
      <div className="flex items-center gap-3 border-b border-[var(--ui-border)] px-2 pb-4 pt-2">
        {me.avatarUrl ? (
          <img src={me.avatarUrl} alt="" className="h-11 w-11 rounded-xl border border-[var(--ui-border)] object-cover" />
        ) : (
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--ui-accent-soft)] font-bold text-[var(--ui-accent)]">{me.firstName?.[0] || "A"}</div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-[var(--ui-text)]">{me.firstName} {me.lastName}</p>
          <p className="mt-0.5 text-xs text-[var(--ui-text-muted)]">{role}</p>
        </div>
      </div>
      <nav aria-label="Administrator workspace" className="mt-3 grid grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-1">
        {navigation.map(([label, section]) => (
          <button key={section} type="button" onClick={() => onChange(section)}
            className={`rounded-xl px-3 py-2.5 text-left text-sm transition ${active === section ? "bg-[var(--ui-accent)] font-bold text-white" : "font-medium text-[var(--ui-text-muted)] hover:bg-[var(--ui-surface-muted)] hover:text-[var(--ui-text)]"}`}>
            {label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
