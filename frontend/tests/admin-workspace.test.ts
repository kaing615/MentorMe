import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = (path: string) => readFileSync(new URL(`../src/${path}`, import.meta.url), "utf8");

test("admin workspace keeps all operations inside one persisted dashboard", () => {
  const dashboard = source("pages/AdminDashboard.tsx");
  const sidebar = source("components/admin/AdminSidebar.tsx");
  assert.match(dashboard, /adminDashboardSection/);
  assert.match(dashboard, /<AdminSidebar/);
  assert.match(dashboard, /admin-panel-heading/);
  assert.match(dashboard, /aria-labelledby="admin-panel-heading"/);
  for (const label of ["Overview", "Mentor applications", "Users", "Sessions", "Courses", "Help requests", "Refunds", "Payouts", "Audit log", "Settings"]) {
    assert.match(sidebar, new RegExp(label));
  }
  assert.match(sidebar, /Site administrator/);
  assert.doesNotMatch(sidebar, /Icon[A-Z]/);
  assert.match(sidebar, /aria-current/);
  assert.match(sidebar, /admin-section-mobile/);
});

test("admin operation panels expose only approved mutations", () => {
  const panels = source("components/admin/AdminPanels.tsx");
  for (const action of ["Suspend", "Restore", "Grant Admin", "Revoke Admin", "Cancel session", "Record refund", "Mark paid", "Retry email"]) {
    assert.match(panels, new RegExp(action));
  }
  assert.doesNotMatch(panels, />\s*(Accept|Finish session|Delete course|Edit course)\s*</);
  assert.match(panels, /me\.adminLevel === "site_administrator"/);
  assert.match(panels, /currentPassword/);
  assert.match(panels, /catch \(error: any\)/);
  assert.match(panels, /error\?\.response\?\.data\?\.data\?\.message/);
  assert.match(panels, /role="status"/);
  assert.match(panels, /Retry/);
  assert.match(panels, /<table/);
  assert.match(panels, /variant="danger"/);
  assert.match(panels, /bg-\[var\(--ui-accent-fill\)\]/);
  assert.match(panels, /"success"/);
});

test("administrator header uses the minimal navigation mode", () => {
  const header = source("components/common/header.tsx");
  assert.match(header, /isAdminMode/);
  assert.match(header, /showDiscoveryNavigation = !isMentorMode && !isAdminMode/);
  assert.match(header, /!isAdminMode && shouldShowMenteeHeaderActions/);
});

test("admin workspace hides the global footer", () => {
  const layout = source("components/layout/AllPagesLayout.tsx");
  assert.match(layout, /!isAdminRoute && <Footer \/>/);
});
