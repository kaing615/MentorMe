import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("the root app shell themes every route and global overlay", () => {
  const app = source("src/App.tsx");
  assert.match(app, /className="app-shell/);
  assert.match(app, /data-theme=\{theme\}/);
  assert.match(app, /<ToastContainer[\s\S]*theme=\{theme\}/);
});

test("every route transition uses the global loading screen", () => {
  const app = source("src/App.tsx");
  assert.match(app, /useNavigationLoading/);
  assert.match(app, /loading=\{isLoading \|\| isNavigationLoading\}/);
});

test("dark theme exposes coherent sitewide surface and overlay tokens", () => {
  const css = source("src/index.css");
  for (const token of [
    "--ui-text-subtle",
    "--ui-overlay",
    "--ui-scrollbar-track",
    "--ui-scrollbar-thumb",
  ]) {
    assert.match(css, new RegExp(token));
  }
  assert.match(css, /data-theme="dark"[\s\S]*\.bg-white/);
  assert.match(css, /\.Toastify__toast/);
  assert.doesNotMatch(css, /\.app-shell :is\(h1, h2, h3, h4\)/);
});

test("browser chrome uses the same page colors as the theme tokens", () => {
  const theme = source("src/utils/theme.ts");
  assert.match(theme, /#071127/);
  assert.match(theme, /#f4f7ff/);
});
