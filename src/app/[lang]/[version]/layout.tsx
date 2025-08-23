import { notFound } from 'next/navigation';

interface VersionLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    lang: string;
    version: string;
  }>;
}

export default async function VersionLayout({
  children,
  params,
}: VersionLayoutProps) {
  const { version } = await params;

  // 現在はEAのみをサポート
  if (version !== 'EA') {
    notFound();
  }

  return <>{children}</>;
}
