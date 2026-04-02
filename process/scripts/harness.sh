#!/bin/bash
# =============================================================================
# Claude Code Harness
# =============================================================================
# Three-agent loop (Planner, Generator, Evaluator) orchestrated via claude -p.
# Inspired by https://anthropic.com/engineering/harness-design-long-running-apps
#
# Usage:
#   ./process/scripts/harness.sh [options]
#
# Options:
#   --start-sprint N     Resume from sprint N (default: 1)
#   --phase N            Set the phase number (default: 1)
#   --max-revisions N    Max revision attempts per sprint (default: 5)
#   --plan FILE          Path to plan file (default: process/plans/PLAN.md)
#
# Prerequisites:
#   - claude CLI installed and authenticated
#   - CLAUDE.md in the project root with project context and coding standards
#
# Directory structure expected:
#   project/
#   ├── CLAUDE.md                    # Project context (read by all agents)
#   ├── process/
#   │   ├── plans/PLAN.md            # Sprint contracts (written by planner)
#   │   ├── scripts/harness.sh       # This script
#   │   ├── evals/                   # Archived evaluations
#   │   ├── research/                # Design docs, specs, references
#   │   └── FEEDBACK.md              # Manual bug reports / observations
#   ├── EVAL.md                      # Latest evaluation (written by evaluator)
#   └── STATUS                       # Current harness state
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
PROCESS_DIR="$PROJECT_DIR/process"
EVAL_FILE="$PROJECT_DIR/EVAL.md"
STATUS_FILE="$PROJECT_DIR/STATUS"

# Defaults
PHASE=1
MAX_REVISIONS=5
START_SPRINT=1
PLAN_FILE="$PROCESS_DIR/plans/PLAN.md"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --start-sprint)
            START_SPRINT="$2"
            shift 2
            ;;
        --phase)
            PHASE="$2"
            shift 2
            ;;
        --max-revisions)
            MAX_REVISIONS="$2"
            shift 2
            ;;
        --plan)
            PLAN_FILE="$2"
            shift 2
            ;;
        -h|--help)
            head -30 "$0" | grep "^#" | sed 's/^# \?//'
            exit 0
            ;;
        *)
            echo "Unknown option: $1 (use --help for usage)"
            exit 1
            ;;
    esac
done

EVALS_DIR="$PROCESS_DIR/evals/phase${PHASE}"
mkdir -p "$EVALS_DIR"

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

update_status() {
    cat > "$STATUS_FILE" << EOF
phase=$PHASE
sprint=$1
attempt=$2
agent=$3
timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
EOF
}

run_claude() {
    local prompt="$1"
    local tools="$2"
    local max_retries=3
    local retry_delay=30
    local attempt=0

    while [ $attempt -lt $max_retries ]; do
        if output=$(echo "$prompt" | claude -p \
            --allowedTools "$tools" \
            --output-format text \
            2>/tmp/claude_harness_stderr); then
            echo "$output"
            return 0
        fi

        stderr=$(cat /tmp/claude_harness_stderr 2>/dev/null || true)
        if echo "$stderr" | grep -qE "529|500|overloaded|rate.limit"; then
            attempt=$((attempt + 1))
            echo "[harness] API error (attempt $attempt/$max_retries), retrying in ${retry_delay}s..." >&2
            sleep $retry_delay
            retry_delay=$((retry_delay * 2))
        else
            echo "[harness] Claude failed with non-retryable error" >&2
            echo "$stderr" >&2
            return 1
        fi
    done

    echo "[harness] Exhausted retries" >&2
    return 1
}

# ---------------------------------------------------------------------------
# Agent 1: Planner
# ---------------------------------------------------------------------------
# Runs once per phase. Reads project context, research, and feedback, then
# produces a plan with numbered sprint contracts. Each sprint contains a
# table of testable acceptance criteria.
#
# Skipped if the plan file already exists. To re-plan, delete or rename
# the existing plan file.
# ---------------------------------------------------------------------------

run_planner() {
    if [ -f "$PLAN_FILE" ]; then
        echo "[harness] Plan already exists at $PLAN_FILE, skipping planner."
        return 0
    fi

    echo "[harness] Running Planner agent..."
    update_status 0 0 "planner"

    local plan_relpath
    plan_relpath=$(python3 -c "import os; print(os.path.relpath('$PLAN_FILE', '$PROJECT_DIR'))")

    local prompt
    prompt=$(cat << PLANNER_PROMPT
You are the PLANNER agent.

Your job is to read the project context and produce a phased development plan
with sprint contracts. Each sprint should have 3-7 testable acceptance criteria.

Read these files for context:
- CLAUDE.md for project context and coding standards
- process/research/ for any design research or specifications
- process/FEEDBACK.md for any prior feedback or bug reports

Output a plan to ${plan_relpath} with this structure:

# Phase $PHASE Plan

## Overview
Brief description of goals for this phase.

## Sprint N: Title
| # | Criterion | How to verify |
|---|-----------|---------------|
| N.1 | Specific testable requirement | Exact verification steps |
| N.2 | ... | ... |

Rules:
- Each criterion must be independently testable
- Include build/test verification in every sprint
- Criteria should reference specific files, commands, or observable behaviours
- Do not include vague criteria like "code is clean" or "follows best practices"
PLANNER_PROMPT
    )

    run_claude "$prompt" "Read,Write,Glob,Grep,Bash(read-only:true),Agent"
    echo "[harness] Plan created."
}

# ---------------------------------------------------------------------------
# Agent 2: Generator
# ---------------------------------------------------------------------------
# Implements one sprint per invocation. On the first attempt, implements from
# scratch. On subsequent attempts (revisions), reads EVAL.md and fixes only
# the failed criteria.
# ---------------------------------------------------------------------------

run_generator() {
    local sprint=$1
    local attempt=$2

    echo "[harness] Running Generator agent (Sprint $sprint, Attempt $attempt)..."
    update_status "$sprint" "$attempt" "generator"

    local plan_relpath
    plan_relpath=$(python3 -c "import os; print(os.path.relpath('$PLAN_FILE', '$PROJECT_DIR'))")

    local revision_context=""
    if [ "$attempt" -gt 1 ] && [ -f "$EVAL_FILE" ]; then
        revision_context="

IMPORTANT: This is revision attempt $attempt. The evaluator found issues.
Read EVAL.md for the evaluation results. Fix ONLY the failed criteria.
Do not re-implement passing criteria."
    fi

    local feedback_context=""
    if [ -f "$PROCESS_DIR/FEEDBACK.md" ]; then
        feedback_context="
Also read process/FEEDBACK.md for any manual bug reports to address."
    fi

    local prompt
    prompt=$(cat << GENERATOR_PROMPT
You are the GENERATOR agent.

Your job is to implement Sprint $sprint from the plan.

Read:
- ${plan_relpath} for the sprint contract
- CLAUDE.md for project context and coding standards${revision_context}${feedback_context}

Implementation rules:
1. Follow the coding standards in CLAUDE.md exactly
2. Run the build/test commands from CLAUDE.md to verify your work compiles and passes
3. Commit your work after each material change
4. Do not modify files outside the scope of the sprint contract
5. If a criterion is ambiguous, implement the most reasonable interpretation

When done, confirm all sprint criteria are met.
GENERATOR_PROMPT
    )

    run_claude "$prompt" "Read,Write,Edit,Glob,Grep,Bash,Agent"
}

# ---------------------------------------------------------------------------
# Agent 3: Evaluator
# ---------------------------------------------------------------------------
# Grades one sprint attempt against the contract criteria. Writes a structured
# evaluation to EVAL.md with PASS/FAIL/WARN per criterion and an overall
# APPROVED or NEEDS REVISION verdict.
#
# The evaluator is intentionally prompted to be skeptical. The blog post warns
# that evaluators tend to talk themselves into approving.
# ---------------------------------------------------------------------------

run_evaluator() {
    local sprint=$1
    local attempt=$2

    echo "[harness] Running Evaluator agent (Sprint $sprint, Attempt $attempt)..."
    update_status "$sprint" "$attempt" "evaluator"

    local plan_relpath
    plan_relpath=$(python3 -c "import os; print(os.path.relpath('$PLAN_FILE', '$PROJECT_DIR'))")

    local prompt
    prompt=$(cat << EVALUATOR_PROMPT
You are the EVALUATOR agent.

Your job is to rigorously evaluate Sprint $sprint (Attempt $attempt).

Read:
- ${plan_relpath} for the sprint $sprint contract
- All files modified or created for this sprint
- CLAUDE.md for project context and coding standards

Evaluation process:
1. Read every criterion in the sprint contract
2. For each criterion, run the specified verification steps exactly as written
3. Run the build and test commands from CLAUDE.md
4. Be skeptical. Do not rubber-stamp. When in doubt, FAIL.
5. A criterion either works or it does not. Partial credit is a FAIL.

Write your evaluation to EVAL.md with this format:

# Sprint $sprint Evaluation (Attempt $attempt)

## Criteria

| # | Criterion | Result | Notes |
|---|-----------|--------|-------|
| N.1 | ... | PASS/FAIL/WARN | Specific details of what you verified |

## Summary
- Passed: X/Y
- Failed: X/Y
- Warnings: X/Y

## Verdict: APPROVED / NEEDS REVISION

If NEEDS REVISION, list exactly what needs to be fixed.
If all criteria pass, the verdict is APPROVED.
EVALUATOR_PROMPT
    )

    run_claude "$prompt" "Read,Write,Glob,Grep,Bash,Agent"
}

# ---------------------------------------------------------------------------
# Main loop
# ---------------------------------------------------------------------------

echo "============================================="
echo "Claude Code Harness (Phase $PHASE)"
echo "============================================="
echo ""

cd "$PROJECT_DIR"

# Verify CLAUDE.md exists
if [ ! -f "$PROJECT_DIR/CLAUDE.md" ]; then
    echo "[harness] WARNING: No CLAUDE.md found in project root."
    echo "[harness] The agents rely on CLAUDE.md for project context."
    echo "[harness] Create one before running, or agents will lack context."
    echo ""
fi

# Step 1: Plan
run_planner

# Step 2: Determine sprint count from plan
if [ ! -f "$PLAN_FILE" ]; then
    echo "[harness] ERROR: No plan file found at $PLAN_FILE"
    exit 1
fi

TOTAL_SPRINTS=$(grep -c "^## Sprint" "$PLAN_FILE" || echo "0")
echo "[harness] Found $TOTAL_SPRINTS sprints in plan."

if [ "$TOTAL_SPRINTS" -eq 0 ]; then
    echo "[harness] ERROR: No sprints found in plan."
    exit 1
fi

if [ "$START_SPRINT" -gt "$TOTAL_SPRINTS" ]; then
    echo "[harness] ERROR: --start-sprint $START_SPRINT exceeds total sprints ($TOTAL_SPRINTS)."
    exit 1
fi

# Step 3: Sprint loop
for sprint in $(seq "$START_SPRINT" "$TOTAL_SPRINTS"); do
    echo ""
    echo "============================================="
    echo "Sprint $sprint / $TOTAL_SPRINTS"
    echo "============================================="

    approved=false

    for attempt in $(seq 1 "$MAX_REVISIONS"); do
        echo ""
        echo "--- Attempt $attempt / $MAX_REVISIONS ---"

        # Generate
        run_generator "$sprint" "$attempt"

        # Evaluate
        run_evaluator "$sprint" "$attempt"

        # Archive eval
        cp "$EVAL_FILE" "$EVALS_DIR/eval-sprint${sprint}-attempt${attempt}.md" 2>/dev/null || true

        # Check verdict
        if grep -qi "APPROVED" "$EVAL_FILE" 2>/dev/null; then
            echo "[harness] Sprint $sprint APPROVED on attempt $attempt."
            approved=true
            break
        else
            echo "[harness] Sprint $sprint NEEDS REVISION (attempt $attempt/$MAX_REVISIONS)."
        fi
    done

    if [ "$approved" = false ]; then
        echo ""
        echo "[harness] Sprint $sprint not approved after $MAX_REVISIONS attempts."
        read -rp "Continue to next sprint anyway? (y/n): " choice
        if [ "$choice" != "y" ]; then
            echo "[harness] Stopping."
            exit 1
        fi
    fi
done

echo ""
echo "============================================="
echo "All sprints complete!"
echo "============================================="
