import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { DEFAULT_THEME, parseTheme, THEME_COOKIE } from '@/lib/theme';
import './globals.css';

// Every page is rendered per request so the Content-Security-Policy nonce can be applied to it.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Etern Admin' };

// Dark is the default. A user's choice is stored in a cookie, so the server renders the right colours on the first
// paint (no inline script needed, and no flash of the wrong theme).
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const theme = parseTheme((await cookies()).get(THEME_COOKIE)?.value) ?? DEFAULT_THEME;
  return (
    <html lang="en" data-theme={theme}>
      <body>{children}</body>
    </html>
  );
}
