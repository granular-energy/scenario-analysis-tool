# Claude Code Harness

A generic three-agent loop for automated software development using `claude -p` (pipeline mode). Based on the [Anthropic blog post on harness design](https://anthropic.com/engineering/harness-design-long-running-apps).

## How it works

The harness orchestrates three Claude Code agents in a loop:

1. Planner: reads project context, produces a plan with numbered sprint contracts
2. Generator: implements one sprint, following the contract and coding standards
3. Evaluator: grades the implementation against each criterion, issues APPROVED or NEEDS REVISION

If a sprint fails evaluation, the Generator retries (up to 5 times by default), reading the Evaluator's feedback to fix only the failed criteria.

```
                 ┌─────────────────────────────────┐
                 │           Planner                │
                 │  Reads context, writes plan      │
                 │  (runs once per phase)           │
                 └──────────────┬──────────────────-┘
                                │
                 ┌──────────────▼──────────────────-┐
            ┌───►│          Generator               │
            │    │  Implements sprint N              │
            │    │  On retry, reads EVAL.md          │
            │    └──────────────┬──────────────────-┘
            │                   │
            │    ┌──────────────▼──────────────────-┐
            │    │          Evaluator                │
            │    │  Grades against contract          │
            │    │  Writes EVAL.md                   │
            │    └──────────────┬──────────────────-┘
            │                   │
            │         ┌────────-┴────────-┐
            │         │                   │
            │    NEEDS REVISION      APPROVED
            │         │                   │
            └─────────┘          Next sprint / Done
```

## Setup

### Prerequisites

- [Claude CLI](https://docs.anthropic.com/en/docs/claude-code) installed and authenticated
- A project with a `CLAUDE.md` in the root describing the project context and coding standards

### Install

Copy the `process/` directory into your project root:

```bash
cp -r process/ /path/to/your/project/process/
```

Add these lines to your `.gitignore`:

```
process/evals/
STATUS
EVAL.md
```

### Project structure

```
your-project/
├── CLAUDE.md                    # Project context (read by all agents)
├── process/
│   ├── plans/                   # Sprint contracts (written by Planner)
│   │   └── PLAN.md
│   ├── scripts/
│   │   └── harness.sh           # This harness
│   ├── evals/                   # Archived evaluations (gitignored)
│   ├── research/                # Design docs, specs, references
│   └── FEEDBACK.md              # Manual bug reports
├── EVAL.md                      # Latest evaluation (gitignored)
└── STATUS                       # Current harness state (gitignored)
```

## Usage

```bash
# Run the full harness from sprint 1
./process/scripts/harness.sh

# Resume from a specific sprint
./process/scripts/harness.sh --start-sprint 3

# Set the phase number (affects eval archive directory)
./process/scripts/harness.sh --phase 2

# Use a custom plan file
./process/scripts/harness.sh --plan process/plans/PLAN-PHASE2.md

# Increase max revision attempts
./process/scripts/harness.sh --max-revisions 8

# Show help
./process/scripts/harness.sh --help
```

## Writing a good CLAUDE.md

The agents rely on `CLAUDE.md` for project context. A good one includes:

- What the project is and what it does
- How to build and test (exact commands)
- Coding standards and conventions
- Project structure overview
- Architecture patterns

The more specific and actionable your CLAUDE.md, the better the agents will perform.

## Writing research docs

Place design documents, specs, or reference material in `process/research/`. The Planner reads these when creating sprint contracts. Good research docs include:

- User stories or customer journey descriptions
- Technical design decisions
- API specs or data models
- Wireframes or mockup descriptions

## Filing feedback

Add entries to `process/FEEDBACK.md` when you test the output and find issues. The Generator reads this file and incorporates fixes. Format:

```markdown
## Button doesn't respond on mobile
- Date: 2026-04-02
- Severity: medium
- Description: The submit button on the registration form doesn't trigger on iOS Safari.
  Tapping it does nothing. Works fine on desktop Chrome.
```

## Running multiple phases

For larger projects, create separate plan files per phase:

```bash
# Phase 1 (creates process/plans/PLAN.md)
./process/scripts/harness.sh --phase 1

# Phase 2 (creates process/plans/PLAN-PHASE2.md)
./process/scripts/harness.sh --phase 2 --plan process/plans/PLAN-PHASE2.md
```

Evals are archived per phase in `process/evals/phase1/`, `process/evals/phase2/`, etc.

## Customisation

The agent prompts are embedded in `harness.sh`. To customise:

- Planner prompt: adjust what context it reads, how many sprints to plan
- Generator prompt: add project-specific build/test commands
- Evaluator prompt: adjust strictness, add domain-specific checks

The `run_claude` helper handles API retries with exponential backoff (529, 500, rate limits).
