import type { Metadata } from 'next';
import { resources, toLanguage } from './i18n-resources';

export const archiveShellMetadata = (langParam: string): Metadata => {
  const t = resources[toLanguage(langParam)].common;

  return {
    title: `${t.pastVersionsTitle} - ${t.title}`,
    robots: { index: false, follow: false },
  };
};
