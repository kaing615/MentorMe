import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = (path: string) => readFileSync(new URL(`../src/${path}`, import.meta.url), "utf8");

test("admin workspace keeps all operations inside one persisted dashboard", () => {
  const dashboard = source("pages/AdminDashboard.tsx");
  const sidebar = source("components/admin/AdminSidebar.tsx");
  assert.match(dashboard, /adminDashboardSection/);
  assert.match(dashboard, /<AdminSidebar/);
  for (const label of ["Overview", "Mentor applications", "Users", "Sessions", "Courses", "Help requests", "Refunds", "Payouts", "Audit log", "Settings"]) {
    assert.match(sidebar, new RegExp(label));
  }
  assert.match(sidebar, /Site administrator/);
  assert.doesNotMatch(sidebar, /Icon[A-Z]/);
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
});

test("administrator header uses the minimal navigation mode", () => {
  const header = source("components/common/header.tsx");
  assert.match(header, /isAdminMode/);
  assert.match(header, /showDiscoveryNavigation = !isMentorMode && !isAdminMode/);
  assert.match(header, /!isAdminMode && shouldShowMenteeHeaderActions/);
});

test("admin workspace hides the global mascot and footer", () => {
  const app = source("App.tsx");
  const layout = source("components/layout/AllPagesLayout.tsx");
  assert.match(app, /!isAdminRoute && <MascotQuickHelp \/>/);
  assert.match(layout, /!isAdminRoute && <Footer \/>/);
});
