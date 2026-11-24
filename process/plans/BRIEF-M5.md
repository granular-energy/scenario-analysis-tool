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

Context since this brief was written (2026-11-24):
- M4 landed scenarios, the Compare tab and both PDFs. The PDFs are drawn with jsPDF primitives, so their charts are simpler than the on-screen Highcharts ones. Polish item: render the Results charts and the Compare monthly chart into the PDFs at screen fidelity (Highcharts SVG → image, or html2canvas of the on-screen chart) while keeping the current page structure and footer.
- There is no HubSpot gate and none should be added in M5.
- The Allocation tab's selector is "Allocation method"; the annual score is volumetric and may exceed 100 %. Keep copy consistent with that.
- Playwright always builds before serving; never start a separate preview on port 4173 during evaluation.
