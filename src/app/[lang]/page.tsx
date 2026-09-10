import { Metadata } from 'next';
import { generateAlternates } from '@/lib/metadata';
import { resources, toLanguage } from '@/lib/i18n-resources';
import HomeClient from './HomeClient';

export async function generateMetadata(props: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang: langParam } = await props.params;
  const lang = toLanguage(langParam);
  const pathname = `/${lang}`;

  return {
    title: resources[lang].common.title,
    description: resources[lang].pageMeta.home.description,
    alternates: generateAlternates(lang, pathname),
  };
}

export default function Home() {
  return <HomeClient />;
}
