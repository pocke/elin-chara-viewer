import { Metadata } from 'next';
import { archiveShellMetadata } from '@/lib/archiveShellMetadata';
import ArchiveShell from '../ArchiveShell';

export async function generateMetadata(props: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await props.params;
  return archiveShellMetadata(lang);
}

export default function Page() {
  return <ArchiveShell screen="sources" />;
}
