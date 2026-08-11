import assert from "node:assert/strict";
import test from "node:test";
import { getAuthTransitionPlan } from "../src/utils/auth-transition.ts";

test("auth navigation uses a perceptible two-phase directional transition", () => {
  const signUp = getAuthTransitionPlan("/auth/signup", false);
  const signIn = getAuthTransitionPlan("/auth/signin", false);

  assert.ok(signUp.exitX < 0 && signUp.enterX > 0);
  assert.ok(signIn.exitX > 0 && signIn.enterX < 0);
  const totalDuration = signUp.exitDuration + signUp.enterDuration;
  assert.ok(totalDuration >= 0.45 && totalDuration <= 0.6);
  assert.deepEqual(getAuthTransitionPlan("/auth/signup", true), {
    exitX: 0,
    enterX: 0,
    exitDuration: 0,
    enterDuration: 0,
  });
});
