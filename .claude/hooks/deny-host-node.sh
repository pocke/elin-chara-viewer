#!/bin/sh
# PreToolUse hook for Bash. Only exit 2 blocks a tool call, so a failure in
# here has to become one rather than any other status.
#
# It catches mistakes, not an attacker: `$(npm ci)`, `bash -c 'npm i'` and
# anything reached through a script all pass, while a quoted `&& npm i`
# anywhere in the line is blocked even though nothing runs it.
set -eu

command -v jq >/dev/null 2>&1 || {
  echo 'deny-host-node.sh: jq is missing, so the host guard cannot run' >&2
  exit 2
}
command_line="$(jq -r '.tool_input.command // ""')" || exit 2

# Only the first word of each segment is a command, so `docker compose run
# ... npm ci` keeps working while `cd x && npm ci` does not.
blocked="$(
  printf '%s\n' "$command_line" |
    sed -e 's/&&/\n/g' -e 's/||/\n/g' -e 's/[;|&]/\n/g' |
    awk '{
      i = 1
      while ($i ~ /^[A-Za-z_][A-Za-z0-9_]*=/) i++
      word = ""
      while (i <= NF) {
        word = $i
        sub(/^[({!]+/, "", word)
        sub(/.*\//, "", word)
        if (word != "" && word !~ /^(sudo|env|time|command|nice|nohup|xargs|then|do|else)$/) break
        word = ""
        i++
      }
      if (word ~ /^(npm|npx|node|yarn|pnpm|tsx|corepack|bun|deno)$/) { print word; exit }
    }'
)" || exit 2

[ -n "$blocked" ] || exit 0

cat >&2 <<EOF
\`$blocked\` runs dependency code, so it belongs in the container:

    docker compose run --rm app npm run <script>   # format, lint, typecheck, build
    docker compose run --rm check npm ci --ignore-scripts
    docker compose up                              # dev server on localhost:3000

See CLAUDE.md.
EOF
exit 2
