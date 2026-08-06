# Project Information for Claude

## Development Environment

Everything that runs project dependencies runs inside Docker, so a compromised
package cannot reach the host's SSH keys, gh token or Windows files.

The application lives in `web/`, which is the only part of the repository the
container is given. Everything the host runs — `update.sh`, `script/*.rb`,
`.github`, `.claude`, `compose.yaml` — sits outside it and stays out of reach.
A file that the host executes or reads as configuration belongs outside `web/`.

- **Never run `npm`, `npx`, `node`, `yarn`, `pnpm` or `tsx` on the host.** A
  PreToolUse hook refuses, and a `preinstall` guard catches the installs that
  reach npm anyway. Neither sees a command built at runtime, so treat them as
  a reminder rather than the boundary.
- `node_modules` lives in a named volume rather than the working tree, so the
  host has no copy of it to read or execute.

| Task | Command |
|---|---|
| Install dependencies | `mkdir -p web/node_modules` then `docker compose run --rm check npm ci --ignore-scripts` |
| Dev server on localhost:3000 | `docker compose up` |
| Everything else | `docker compose run --rm app npm run <script>` |
| Add a dependency | `docker compose run --rm app npm install --ignore-scripts <pkg>` |

`docker compose run` does not publish ports, which is why the dev server is the
one command that uses `up`.

`npm ci` runs in the `check` service, which mounts `web/` read-only:
`update.sh` commits and merges the working tree right after installing. The
directory has to exist for the volume to mount into it, hence the `mkdir`.
Adding a dependency writes `package.json`, so it uses `app` instead.

CI checks that the container still reaches nothing but `web/` and a read-only
`.git` — by mount, by `privileged` and friends, or through a named volume that
binds — and that nothing the host runs or reads as instruction has moved under
`web/`. A `docker compose run -v ...` is outside that check, so mount
read-only whenever the command only reads.

## Development Workflow

### Code Formatting and Linting
- **Always run `docker compose run --rm app npm run format` after editing code** to ensure consistent formatting
- **Always run `docker compose run --rm app npm run lint` after editing code** and fix any issues that arise
- **Always run `docker compose run --rm app npm run typecheck` after editing code** and fix any issues that arise

### TypeScript Guidelines
- **Never use `any` type** - always specify proper, explicit types
- Use strict typing to maintain code quality and prevent runtime errors

### Project Structure
This is an Elin character viewer application built with Next.js and TypeScript.

### Commands
- `docker compose run --rm app npm run format` - Format code using the project's formatting rules
- `docker compose run --rm app npm run lint` - Run linting checks and identify issues to fix
- `docker compose run --rm app npm run typecheck` - Run TypeScript type checking

### I18n (Internationalization)
- **Always implement I18n for user-facing text** - never hardcode Japanese or English text in components
- **Translation file location**: `web/src/lib/simple-i18n.tsx` contains all translation resources
- **Supported languages**: Japanese (`ja`) and English (`en`)
- **Usage**: Use the `useTranslation()` hook to get `t` (translations) and `language` values
- **Model columns with `_JP` suffix**: When models have columns ending with `_JP` (e.g., `name_JP`, `detail_JP`), implement language-specific methods that return the appropriate column based on the current language
  - Example: `name(locale: string)` method that returns `name_JP` for Japanese or `name` for English
- **Adding new translations**: Add both Japanese and English versions to the `resources` object in `simple-i18n.tsx`

### Link Component
- **Always use `HoverPrefetchLink` instead of Next.js `Link`** - to reduce Vercel Edge Requests
- **Import**: `import { HoverPrefetchLink as Link } from '@/components/HoverPrefetchLink'`
- **Reason**: The default `next/link` prefetches on viewport entry, causing excessive Edge Requests. `HoverPrefetchLink` only prefetches on hover.

### Important Notes
- Maintain type safety throughout the codebase
- Follow existing code patterns and conventions
- Ensure all code changes are properly formatted and linted before completion
