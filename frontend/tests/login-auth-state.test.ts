import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("login synchronizes the auth slice before opening a protected route", () => {
  const login = readFileSync(new URL("../src/pages/Login.tsx", import.meta.url), "utf8");

  assert.match(login, /import \{ initializeAuth \} from "\.\.\/redux\/features\/auth\.slice"/);
  assert.match(login, /localStorage\.setItem\("actkn", response\.data\.token\);[\s\S]*dispatch\(initializeAuth\(\)\);[\s\S]*navigate\(/);
});
