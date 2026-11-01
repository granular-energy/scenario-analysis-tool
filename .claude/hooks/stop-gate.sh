#!/usr/bin/env bash
# Stop hook: refuse to let the generator finish while typecheck, unit tests or lint fail.
# Exit 2 feeds stderr back to the agent as feedback; exit 0 lets it stop.
set -uo pipefail

input=$(cat)
if echo "$input" | jq -e '.stop_hook_active == true' >/dev/null 2>&1; then
  exit 0 # already looping on this hook; don't block forever
fi

cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0

fail=0
for step in "npm run -s typecheck" "npm run -s test" "npm run -s lint"; do
  if ! out=$($step 2>&1); then
    echo "Stop gate: '$step' failed:" >&2
    echo "$out" | tail -40 >&2
    fail=1
  fi
done

if [ "$fail" -ne 0 ]; then
  echo "Fix the failures above before finishing." >&2
  exit 2
fi
exit 0
