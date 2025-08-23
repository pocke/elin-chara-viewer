import VersionHomeClient from './VersionHomeClient';

export function generateStaticParams() {
  return [
    { lang: 'ja', version: 'EA' },
    { lang: 'en', version: 'EA' },
  ];
}

export default function VersionHome() {
  return <VersionHomeClient />;
}
