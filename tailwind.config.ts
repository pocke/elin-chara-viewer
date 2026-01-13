import type { Config } from 'tailwindcss';

const config = {
  prefix: 'tw-',
  content: [
    './src/app/[lang]/[version]/sources/**/*.{ts,tsx}',
    './node_modules/@sqlrooms/**/dist/**/*.js',
  ],
  corePlugins: {
    preflight: false,
  },
} satisfies Config;

export default config;
