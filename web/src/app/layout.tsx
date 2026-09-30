import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { parseTheme, THEME_COOKIE } from '@/lib/theme';
import './globals.css';

// Every page is rendered per request so the Content-Security-Policy nonce can be applied to it.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Etern Admin' };

// The chosen theme is a cookie, so the server renders the right colours on the first paint (no inline script needed).
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const theme = parseTheme((await cookies()).get(THEME_COOKIE)?.value);
  return (
    <html lang="en" data-theme={theme}>
      <body>{children}</body>
    </html>
  );
}
