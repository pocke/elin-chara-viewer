#!/bin/sh
# package.json runs this as preinstall. The container can write it, since it
# sits in web/ with everything else npm touches; CI checks that it still
# refuses.
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
