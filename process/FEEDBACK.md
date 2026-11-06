# Feedback

Findings from human testing between milestones. The generator reads this file and the evaluator checks it. Add an entry per issue; mark it `[fixed in <milestone>]` when resolved.

Format:

```
## <short title>
- Date: 2026-11-02
- Milestone: M2
- Severity: high | medium | low
- Description: what happened, what was expected, how to reproduce.
```

## Inherited from the previous tools (April 2026 Slack feedback)

- Date: 2026-04-06
- Severity: medium
- Description: Priya: the annual matching metric was placed oddly, above the generator hourly contribution chart, and read as if it belonged to that chart. Show annual score as context beside the hourly score, clearly labelled.
- Description: Priya: it was unclear whether results respected shape preservation. v3 must state the matching granularity in the results header and the report.
- Description: Samuel: uploads must be timezone-aware. v3 asks for the timezone and documents DST handling in the upload help text.

## Example day picker shows a real year [fixed in M3b]

- Date: 2026-11-02
- Milestone: M3 (fix in M4 or M5)
- Severity: low
- Description: The Results "Example day" control shows a full date (01/05/2024). The typical year has no year; show day and month only (e.g. "1 May") with no year anywhere in the UI or report.

## Sankey "Unallocated" label is confusing [fixed in M3b]

- Date: 2026-11-02
- Milestone: M3 (fix in M5)
- Severity: low
- Description: With every generator allocated 100%, the Sankey still shows an "Unallocated" node. That flow is generation no hour could absorb (surplus), not an allocation the user failed to make. Rename to "Surplus (not matched)" or similar and explain it in the tooltip.

## Monthly chart y-axis label is rotated [fixed in M3b]

- Date: 2026-11-02
- Milestone: M3 (fix in M5)
- Severity: low
- Description: The chart style guide calls for a horizontal unit label at the top of the y-axis. The monthly breakdown chart has "MWh" rotated along the axis; the other charts are correct.

## Review on 5 Nov 2026 (Toby) — handled as milestone M3b [fixed in M3b/M3c]

- Date: 2026-11-05
- Milestone: M3b
- Severity: high
- Description: (1) size generators by annual MWh, not MW; (2) allocation matrix must show each generator's annual MWh and each consumer's annual MWh, accept % or MWh per cell, and show the computed other value and totals; (3) matching granularity options need real explanations of constraint and result; (4) Sankey has duplicated labels and stale nodes when switching consumer, "Unallocated" is in the wrong column and does not balance in the per-consumer view. Full brief in process/plans/BRIEF-M3b.md.

## Method descriptions must use the agreed copy (M3b regression) [fixed in M3c]
- Date: 2026-11-05
- Milestone: M3c
- Severity: high
- Description: The Allocation tab descriptions were rewritten and the meaning drifted. "A generator can cover demand in any hour of the same month, even if it was not generating in that specific hour" is wrong: allocation always keeps the generator's hourly shape, so it never covers hours it was not generating in. Use the copy in process/plans/BRIEF-M3b.md section 3 verbatim (with the cap-window phrases from BRIEF-M3c section 2 added), under the labels "Hourly matching only", "Monthly matching target", "Annual matching target", "As produced (no cap)".

## Sankey node labels missing (M3b regression) [fixed in M3c + manual follow-up]
- Date: 2026-11-05
- Milestone: M3c
- Severity: high
- Description: After the M3b overlap fix no node labels render at all, in either the portfolio or per-consumer view. Every node must show its name; only link labels are suppressed. Where a node is too small for a label, place the label outside the node rather than hiding it.

## Unmatched segment is at the bottom of the bars (M3b regression) [fixed manually after M3c]
- Date: 2026-11-05
- Milestone: M3c
- Severity: high
- Description: In all three bar charts the hatched "Unmatched" segment is stacked at the bottom. Required order from the bottom: matched per generator, then unmatched (hatched) so its top meets the demand line, then excess per generator above the demand line. See process/research/reference-platform-demand-allocation-chart.webp.

## 2026-11-06 — stale e2e server (fixed)

- Playwright `webServer` had `reuseExistingServer: true` with a bare `npm run preview`. Any preview left running from an earlier harness run served an old `dist/`, so the e2e suite passed against stale code. Config now builds before serving and never reuses a server. Harness evaluators must not start their own preview on 4173.
