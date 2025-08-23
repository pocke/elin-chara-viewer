# Project Information for Claude

## Development Workflow

### Code Formatting and Linting
- **Always run `npm run format` after editing code** to ensure consistent formatting
- **Always run `npm run lint` after editing code** and fix any issues that arise
- **Always run `npm run typecheck` after editing code** and fix any issues that arise

### TypeScript Guidelines
- **Never use `any` type** - always specify proper, explicit types
- Use strict typing to maintain code quality and prevent runtime errors

### Project Structure
This is an Elin character viewer application built with Next.js and TypeScript.

### Commands
- `npm run format` - Format code using the project's formatting rules
- `npm run lint` - Run linting checks and identify issues to fix
- `npm run typecheck` - Run TypeScript type checking

### I18n (Internationalization)
- **Always implement I18n for user-facing text** - never hardcode Japanese or English text in components
- **Translation file location**: `src/lib/simple-i18n.tsx` contains all translation resources
- **Supported languages**: Japanese (`ja`) and English (`en`)
- **Usage**: Use the `useTranslation()` hook to get `t` (translations) and `language` values
- **Model columns with `_JP` suffix**: When models have columns ending with `_JP` (e.g., `name_JP`, `detail_JP`), implement language-specific methods that return the appropriate column based on the current language
  - Example: `name(locale: string)` method that returns `name_JP` for Japanese or `name` for English
- **Adding new translations**: Add both Japanese and English versions to the `resources` object in `simple-i18n.tsx`

### Important Notes
- Maintain type safety throughout the codebase
- Follow existing code patterns and conventions
- Ensure all code changes are properly formatted and linted before completion
