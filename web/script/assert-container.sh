#!/bin/sh
# package.json runs this as preinstall. It is a .sh rather than a .cjs so that
# compose.yaml can mount it read-only: prettier rewrites .cjs, and a read-only
# mount would make `npm run format` fail on it.
set -eu

if [ -f /.dockerenv ] ||
  [ -n "${ELIN_DEV_CONTAINER:-}" ] ||
  [ -n "${GITHUB_ACTIONS:-}" ] ||
  [ -n "${VERCEL:-}" ]; then
  exit 0
fi

cat >&2 <<'EOF'

Dependencies are installed inside the container, never on this machine:

    docker compose run --rm check npm ci --ignore-scripts

Installing here would run every dependency's install scripts against your
home directory, your SSH keys and your gh token.

EOF
exit 1
