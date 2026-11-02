#!/usr/bin/env bash
# Planner → Generator → Evaluator loop for one milestone, driven by `claude -p`.
#
#   ./process/scripts/harness.sh M2                 # plan + build + evaluate milestone M2
#   ./process/scripts/harness.sh M2 --skip-plan     # reuse process/plans/PLAN-M2.md
#   ./process/scripts/harness.sh M2 --max-rounds 4 --budget 40
#
# Each role runs as a subagent from .claude/agents/ with its own tools, model and turn cap. The
# evaluator always starts a fresh session and returns a structured JSON verdict; the loop repeats
# until it passes or the round limit is hit. Humans review the preview between milestones and file
# findings in process/FEEDBACK.md. Nothing here pushes or deploys.
set -euo pipefail

MILESTONE="${1:?usage: harness.sh <milestone-id> [--skip-plan] [--max-rounds N] [--budget USD]}"
shift
SKIP_PLAN=0
MAX_ROUNDS=3
BUDGET_USD=30
while [ $# -gt 0 ]; do
  case "$1" in
    --skip-plan) SKIP_PLAN=1 ;;
    --max-rounds) MAX_ROUNDS="$2"; shift ;;
    --budget) BUDGET_USD="$2"; shift ;;
    *) echo "unknown option $1" >&2; exit 1 ;;
  esac
  shift
done

PROJECT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$PROJECT_DIR"
PLAN_FILE="process/plans/PLAN-${MILESTONE}.md"
BRIEF_FILE="process/plans/BRIEF-${MILESTONE}.md"
EVAL_DIR="process/evals/${MILESTONE}"
mkdir -p "$EVAL_DIR" process/evals/scratch
[ -f "$BRIEF_FILE" ] || { echo "Missing $BRIEF_FILE (write the milestone brief first)" >&2; exit 1; }

VERDICT_SCHEMA='{"type":"object","required":["pass","failedCriteria","summary"],"properties":{"pass":{"type":"boolean"},"failedCriteria":{"type":"array","items":{"type":"object","required":["id","problem","passingLooksLike"],"properties":{"id":{"type":"string"},"problem":{"type":"string"},"passingLooksLike":{"type":"string"}}}},"summary":{"type":"string"}}}'

GENERATOR_TOOLS='Read,Write,Edit,Glob,Grep,Bash(npm *),Bash(npx *),Bash(node *),Bash(git add *),Bash(git commit *),Bash(git status *),Bash(git diff *),Bash(git log *),Bash(ls *),Bash(cat *),Bash(mkdir *),Bash(cp *),Bash(mv *),Bash(rm *)'
EVALUATOR_TOOLS='Read,Glob,Grep,Bash(npm *),Bash(npx *),Bash(node *),Bash(git status *),Bash(git diff *),Bash(git log *),Bash(ls *),Bash(cat *),Bash(mkdir *),Bash(cat > EVAL.md*),Bash(cat > process/evals/*)'

log() { echo "[harness $(date +%H:%M:%S)] $*"; }

run_role() { # role prompt extra-args...  (stdout is the JSON result; aborts on an API/auth error)
  local role="$1" prompt="$2"; shift 2
  local out
  out=$(claude -p "$prompt" --agent "$role" --permission-mode dontAsk --output-format json --max-budget-usd "$BUDGET_USD" "$@")
  echo "$out"
  if [ "$(echo "$out" | jq -r '.is_error // false')" = "true" ]; then
    echo "[harness] $role failed: $(echo "$out" | jq -r '.result')" >&2
    return 1
  fi
}

if [ "$SKIP_PLAN" -eq 0 ] || [ ! -f "$PLAN_FILE" ]; then
  log "Planning $MILESTONE"
  run_role planner "Write the milestone contract for ${MILESTONE} to ${PLAN_FILE}. The brief is in ${BRIEF_FILE}." \
    --allowedTools "Read,Write,Glob,Grep" > "$EVAL_DIR/planner.json"
  [ -f "$PLAN_FILE" ] || { echo "Planner did not write $PLAN_FILE" >&2; exit 1; }
fi

SESSION_ID=$(uuidgen | tr '[:upper:]' '[:lower:]')
FEEDBACK="none (first attempt)"
for round in $(seq 1 "$MAX_ROUNDS"); do
  log "Generator round $round/$MAX_ROUNDS"
  if [ "$round" -eq 1 ]; then session_args=(--session-id "$SESSION_ID"); else session_args=(--resume "$SESSION_ID"); fi
  run_role generator "Implement the contract in ${PLAN_FILE} for milestone ${MILESTONE}. Evaluator feedback from the previous attempt: ${FEEDBACK}" \
    "${session_args[@]}" --allowedTools "$GENERATOR_TOOLS" > "$EVAL_DIR/generator-$round.json" || log "generator exited non-zero (turn or budget cap?)"

  log "Evaluator round $round"
  rm -f EVAL.md
  run_role evaluator "Grade the working tree against ${PLAN_FILE} for milestone ${MILESTONE}, attempt ${round}. Do not edit source files." \
    --allowedTools "$EVALUATOR_TOOLS" --json-schema "$VERDICT_SCHEMA" > "$EVAL_DIR/verdict-$round.json" || log "evaluator exited non-zero"
  [ -f EVAL.md ] && cp EVAL.md "$EVAL_DIR/EVAL-$round.md"

  if [ "$(jq -r '.structured_output.pass // false' "$EVAL_DIR/verdict-$round.json")" = "true" ]; then
    log "APPROVED: $MILESTONE after $round round(s)"
    jq -r '.structured_output.summary' "$EVAL_DIR/verdict-$round.json"
    exit 0
  fi
  FEEDBACK=$(jq -r '(.structured_output.failedCriteria // []) | map("\(.id): \(.problem) → passing looks like: \(.passingLooksLike)") | join("\n")' "$EVAL_DIR/verdict-$round.json")
  [ -n "$FEEDBACK" ] || FEEDBACK="evaluator returned no structured verdict; re-check every criterion"
  log "NEEDS REVISION:"; echo "$FEEDBACK"
done

log "Round limit reached without approval; see $EVAL_DIR"
exit 1
