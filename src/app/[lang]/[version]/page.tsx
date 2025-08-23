import { redirect } from 'next/navigation';

export function generateStaticParams() {
  return [
    { lang: 'ja', version: 'EA' },
    { lang: 'en', version: 'EA' },
  ];
}

interface PageProps {
  params: Promise<{ lang: string; version: string }>;
}

export default async function VersionHome({ params }: PageProps) {
  const { lang } = await params;
  redirect(`/${lang}`);
}
