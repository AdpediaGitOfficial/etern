import type { Metadata } from 'next';
import './globals.css';

// Every page is rendered per request so the Content-Security-Policy nonce can be applied to it.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Etern Admin' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
