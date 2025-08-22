import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Elin Character Viewer',
  description: 'Browse and manage character information for Elin',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
