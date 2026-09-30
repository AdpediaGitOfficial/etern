'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/** Mirrors the Angular menu. Screens not yet moved to Next.js are listed but disabled (phase 2/3). */
const NAV: { label: string; href?: string; items?: string[] }[] = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Master Operations', items: ['Packages', 'Categories', 'Sub Categories', 'Course Materials'] },
  { label: 'Users', items: ['All Users', 'Upcoming Expiry', 'Expired Subscriptions'] },
  { label: 'Offline Payments' },
  { label: 'Online Payments' },
];

export default function Sidebar() {
  const path = usePathname();
  return (
    <aside className="side" aria-label="Main navigation">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.png" alt="Etern Learning" className="side-logo" />
      <nav>
        {NAV.map(n => (
          <div key={n.label} className="nav-group">
            {n.href ? (
              <Link href={n.href} className={'nav-item' + (path.startsWith(n.href) ? ' on' : '')} aria-current={path.startsWith(n.href) ? 'page' : undefined}>
                {n.label}
              </Link>
            ) : (
              <span className="nav-item off" aria-disabled="true">{n.label}<em>Soon</em></span>
            )}
            {n.items?.map(i => (
              <span key={i} className="nav-sub off" aria-disabled="true">{i}</span>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}
