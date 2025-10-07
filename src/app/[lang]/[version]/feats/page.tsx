import { all } from '@/lib/db';
import { ElementSchema, Element } from '@/lib/models/element';
import FeatPageClient from './FeatPageClient';

export function generateStaticParams() {
  return [
    { lang: 'ja', version: 'EA' },
    { lang: 'en', version: 'EA' },
  ];
}

export default function FeatPage() {
  const featRows = all('elements', ElementSchema).filter((row) => {
    const element = new Element(row);
    if (!element.isFeat()) return false;

    const tags = element.tags();
    return !tags.includes('hidden');
  });

  return <FeatPageClient featRows={featRows} />;
}
