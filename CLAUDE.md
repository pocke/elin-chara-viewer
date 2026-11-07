# Project Information for Claude

## Development Workflow

### Code Formatting and Linting
- **Always run `npm run format` after editing code** to ensure consistent formatting
- **Always run `npm run lint` after editing code** and fix any issues that arise
- **Always run `npm run typecheck` after editing code** and fix any issues that arise
- **Always run `npm test` after editing code** and fix any failures

### TypeScript Guidelines
- **Never use `any` type** - always specify proper, explicit types
- Use strict typing to maintain code quality and prevent runtime errors

### Project Structure
This is an Elin character viewer application built with Next.js and TypeScript.

### Commands
- `npm run format` - Format code using the project's formatting rules
- `npm run lint` - Run linting checks and identify issues to fix
- `npm run typecheck` - Run TypeScript type checking
- `npm test` - Run the unit tests once (Vitest)
- `npm run test:watch` - Run the unit tests in watch mode

### Testing
- **Framework**: Vitest, configured in `vitest.config.mts`. It collects `src/**/*.test.ts` and resolves the `@/` import alias from the `paths` in `tsconfig.json` (`resolve.tsconfigPaths`)
- **Location**: colocate tests as `*.test.ts` next to the module they test (e.g. `src/lib/versionOrder.test.ts`)
- **Imports**: import `describe`, `it`, `expect` etc. from `'vitest'` explicitly. Do not enable `globals`: `tsconfig.json` is shared with the app, so the global types would leak into app code
- **Test data**: write the data inline and register it with `registerVersionData` under a version key unique to the test (e.g. `'test-chara'`). Never read `db/` CSVs, which change on every game update
- **Version limit**: use at most 3 non-current versions (anything other than `EA` / `Nightly`) per test file, because `db.ts` evicts the oldest one beyond `MAX_RETAINED_VERSIONS`
- **Modules to avoid**: do not import anything that imports `src/lib/bundledData.ts`, directly or transitively (e.g. `src/lib/versions.ts`, `src/lib/pageData.ts`, `src/lib/metadata.ts` via `pageData.ts`, and `src/app/[lang]/ClientLayout.tsx`). `bundledData.ts` imports `.csv` files, which only the Turbopack raw-loader configured in `next.config.ts` can load, so a test that imports them fails with "Failed to parse source for import analysis"
- **Ordering**: do not assert an order produced by `localeCompare`, because it depends on the ICU data and the locale of the machine
- **Bug fixes**: write the failing test first, confirm it fails for the expected reason, then fix the code

### I18n (Internationalization)
- **Always implement I18n for user-facing text** - never hardcode Japanese or English text in components
- **Translation file location**: `src/lib/i18n-resources.ts` contains all translation resources (`src/lib/simple-i18n.tsx` only re-exports the `useTranslation()` hook)
- **Supported languages**: Japanese (`ja`) and English (`en`)
- **Usage**: Use the `useTranslation()` hook to get `t` (translations) and `language` values
- **Model columns with `_JP` suffix**: When models have columns ending with `_JP` (e.g., `name_JP`, `detail_JP`), implement language-specific methods that return the appropriate column based on the current language
  - Example: `name(locale: string)` method that returns `name_JP` for Japanese or `name` for English
- **Adding new translations**: Add both Japanese and English versions to the `resources` object in `i18n-resources.ts`

### Link Component
- **Always use `NoPrefetchLink` instead of Next.js `Link`** - it renders `next/link` with `prefetch={false}`
- **Import**: `import { NoPrefetchLink as Link } from '@/components/NoPrefetchLink'`
- **Reason**: `script/prune-export.cjs` deletes the `__next.*.txt` segment files from the static export to stay under Cloudflare Workers' file limit, so prefetching would only produce 404 requests.

### Important Notes
- Maintain type safety throughout the codebase
- Follow existing code patterns and conventions
- Ensure all code changes are properly formatted and linted before completion
