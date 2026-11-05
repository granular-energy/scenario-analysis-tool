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

## Example day picker shows a real year
- Date: 2026-11-02
- Milestone: M3 (fix in M4 or M5)
- Severity: low
- Description: The Results "Example day" control shows a full date (01/05/2024). The typical year has no year; show day and month only (e.g. "1 May") with no year anywhere in the UI or report.

## Sankey "Unallocated" label is confusing
- Date: 2026-11-02
- Milestone: M3 (fix in M5)
- Severity: low
- Description: With every generator allocated 100%, the Sankey still shows an "Unallocated" node. That flow is generation no hour could absorb (surplus), not an allocation the user failed to make. Rename to "Surplus (not matched)" or similar and explain it in the tooltip.

## Monthly chart y-axis label is rotated
- Date: 2026-11-02
- Milestone: M3 (fix in M5)
- Severity: low
- Description: The chart style guide calls for a horizontal unit label at the top of the y-axis. The monthly breakdown chart has "MWh" rotated along the axis; the other charts are correct.

## Review on 5 Nov 2026 (Toby) — handled as milestone M3b
- Date: 2026-11-05
- Milestone: M3b
- Severity: high
- Description: (1) size generators by annual MWh, not MW; (2) allocation matrix must show each generator's annual MWh and each consumer's annual MWh, accept % or MWh per cell, and show the computed other value and totals; (3) matching granularity options need real explanations of constraint and result; (4) Sankey has duplicated labels and stale nodes when switching consumer, "Unallocated" is in the wrong column and does not balance in the per-consumer view. Full brief in process/plans/BRIEF-M3b.md.
