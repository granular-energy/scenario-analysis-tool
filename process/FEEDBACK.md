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
