# Milestone M5 brief: Polish, QA and launch readiness

In scope:
- Design pass against `process/research/design-system.md`: spacing, typography scale, card borders, filter pills, chart styling, consistent empty/loading/error states, no hard-coded colours.
- Accessibility basics: keyboard navigation of tabs, matrix and forms; labels on every input; colour contrast AA; focus rings.
- Mobile pass at 375px and tablet at 768px for every screen.
- Copy pass in British English: explanations of hourly vs annual matching, shape preservation, timezone handling, what the demo scenario is.
- Performance: Lighthouse performance ≥ 90 on the built app; profiles lazy-loaded; engine run < 50 ms for 5×5 hourly.
- Playwright e2e suite covering the demo flow end to end: load → edit portfolio → allocate → results → save → compare → export scenario file.
- `README.md` with setup, scripts, deployment notes (Vercel, `scenarios.granular-energy.com`), and how to update built-in profiles and regenerate golden fixtures from revolt.
- Every open item in `process/FEEDBACK.md` resolved or explicitly deferred with a reason.

Out of scope: new features.
