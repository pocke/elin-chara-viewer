import { all } from '@/lib/db';
import { ElementSchema } from '@/lib/models/element';
import FeatPageClient from './FeatPageClient';

export function generateStaticParams() {
  return [
    { lang: 'ja', version: 'EA' },
    { lang: 'en', version: 'EA' },
  ];
}

export default function FeatPage() {
  const featRows = all('elements', ElementSchema).filter(
    (row) => row.type === 'Feat'
  );

  return <FeatPageClient featRows={featRows} />;
}
