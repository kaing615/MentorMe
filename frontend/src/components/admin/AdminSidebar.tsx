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

const navigation: Array<[string, Array<[string, AdminSection]>]> = [
  ["Workspace", [["Overview", "overview"]]],
  ["Operations", [
    ["Mentor applications", "applications"],
    ["Users", "users"],
    ["Sessions", "sessions"],
    ["Courses", "courses"],
    ["Help requests", "help"],
  ]],
  ["Finance", [["Refunds", "refunds"], ["Payouts", "payouts"]]],
  ["System", [["Audit log", "audit"], ["Settings", "settings"]]],
];

const adminSectionLabels = Object.fromEntries(
  navigation.flatMap(([, items]) => items.map(([label, section]) => [section, label])),
) as Record<AdminSection, string>;

export function AdminSectionTitle({ section }: { section: AdminSection }) {
  return adminSectionLabels[section];
}

export default function AdminSidebar({ me, active, onChange }: {
  me: AdminUser;
  active: AdminSection;
  onChange: (section: AdminSection) => void;
}) {
  const role = me.adminLevel === "site_administrator" ? "Site administrator" : "Admin";
  return (
    <aside className="lg:sticky lg:top-24 lg:h-[calc(100dvh-7rem)] lg:self-start">
      <div className="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface)] p-3 lg:hidden">
        <label htmlFor="admin-section-mobile" className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-[var(--ui-text-muted)]">
          Admin section
        </label>
        <select
          id="admin-section-mobile"
          value={active}
          onChange={(event) => onChange(event.target.value as AdminSection)}
          className="min-h-11 w-full rounded-lg border border-[var(--ui-border-strong)] bg-[var(--ui-surface-raised)] px-3 text-sm font-semibold text-[var(--ui-text)] outline-none transition-colors focus:border-[var(--ui-accent)] focus:ring-2 focus:ring-[var(--ui-accent-soft)]"
        >
          {navigation.map(([group, items]) => (
            <optgroup key={group} label={group}>
              {items.map(([label, section]) => <option key={section} value={section}>{label}</option>)}
            </optgroup>
          ))}
        </select>
      </div>

      <div className="hidden h-full overflow-hidden rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface)] lg:flex lg:flex-col">
        <div className="h-1 shrink-0 bg-[var(--ui-highlight)]" />
        <div className="flex items-center gap-3 border-b border-[var(--ui-border)] px-4 py-4">
          {me.avatarUrl ? (
            <img src={me.avatarUrl} alt="" className="h-11 w-11 rounded-lg border border-[var(--ui-border)] object-cover" />
          ) : (
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[var(--ui-accent-soft)] font-bold text-[var(--ui-accent)]">{me.firstName?.[0] || "A"}</div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-[var(--ui-text)]">{me.firstName} {me.lastName}</p>
            <p className="mt-0.5 text-xs text-[var(--ui-text-muted)]">{role}</p>
          </div>
        </div>

        <nav aria-label="Administrator workspace" className="min-h-0 flex-1 space-y-4 overflow-y-auto p-3">
          {navigation.map(([group, items]) => (
            <div key={group}>
              <p className="mb-1 px-3 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[var(--ui-text-muted)]">{group}</p>
              <div className="space-y-0.5">
                {items.map(([label, section]) => {
                  const selected = active === section;
                  return (
                    <button
                      key={section}
                      type="button"
                      aria-current={selected ? "page" : undefined}
                      onClick={() => onChange(section)}
                      className={`min-h-11 w-full rounded-lg border-l-[3px] px-3 py-2 text-left text-sm transition-colors ${selected
                        ? "border-[var(--ui-accent)] bg-[var(--ui-accent-soft)] font-bold text-[var(--ui-accent)]"
                        : "border-transparent font-medium text-[var(--ui-text-muted)] hover:bg-[var(--ui-surface-muted)] hover:text-[var(--ui-text)]"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
}
