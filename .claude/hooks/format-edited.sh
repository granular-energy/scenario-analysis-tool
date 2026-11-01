#!/usr/bin/env bash
# PostToolUse hook: format whatever file was just edited so diffs stay clean.
set -uo pipefail
input=$(cat)
file=$(echo "$input" | jq -r '.tool_input.file_path // empty')
case "$file" in
  *.ts|*.tsx|*.css|*.json|*.md)
    cd "${CLAUDE_PROJECT_DIR:-.}" && npx --no-install prettier --log-level silent --write "$file" >/dev/null 2>&1 || true
    ;;
esac
exit 0
