import { Metadata } from 'next';
import { generateAlternates } from '@/lib/metadata';
import HomeClient from './HomeClient';

export async function generateMetadata(props: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await props.params;
  const pathname = `/${lang}`;

  return {
    alternates: generateAlternates(lang, pathname),
  };
}

export default function Home() {
  return <HomeClient />;
}
