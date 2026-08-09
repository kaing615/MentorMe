# Frontend Lint Baseline

**Implementation status:** Current

Measured on 2026-08-08 from the production-architecture worktree with `npm ci` followed by `rtk lint .`:

- 210 errors and 16 warnings across 29 files.
- Main rules: 158 `no-unused-vars`, 21 `no-empty`, 15 `react-hooks/exhaustive-deps`, 15 `no-undef`, and 11 `no-useless-catch` findings.
- Highest-debt files: `mentor-profile.jsx` (46), `mentee-profile.jsx` (25), `order-complete-course.jsx` (23), and `mentor-page.jsx` (18).

This is a debt ledger, not a passing quality claim. CI must keep the full baseline visible and reject new findings in changed files. Remediation priority is runtime correctness (`no-undef`, duplicate keys, unreachable code), then hook correctness, then dead-code cleanup.
