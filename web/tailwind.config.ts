import { sqlroomsTailwindPreset } from '@sqlrooms/ui';
import type { Config } from 'tailwindcss';

const config = {
  presets: [sqlroomsTailwindPreset()],
  content: [
    './src/app/[lang]/[version]/sources/**/*.{ts,tsx}',
    './node_modules/@sqlrooms/**/dist/**/*.js',
  ],
  corePlugins: {
    preflight: false,
  },
} satisfies Config;

export default config;
