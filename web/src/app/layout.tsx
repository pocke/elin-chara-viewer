import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Elin Character Viewer',
  description: 'Browse and manage character information for Elin',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', type: 'image/x-icon' },
    ],
    apple: '/apple-touch-icon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
