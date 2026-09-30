'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type Item = { label: string; href?: string };
type Group = { label: string; href?: string; items?: Item[] };

/** Mirrors the Angular menu. Screens not yet moved to Next.js are listed but disabled (phase 3). */
const NAV: Group[] = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Master Operations', items: [{ label: 'Packages' }, { label: 'Categories' }, { label: 'Sub Categories' }, { label: 'Course Materials' }] },
  { label: 'Users', items: [{ label: 'All Users', href: '/users' }, { label: 'Upcoming Expiry', href: '/users/upcoming' }, { label: 'Expired Subscriptions', href: '/users/expired' }] },
  { label: 'Offline Payments', href: '/offline-payments' },
  { label: 'Online Payments', href: '/online-payments' },
];

export default function Sidebar() {
  const path = usePathname();
  return (
    <aside className="side" aria-label="Main navigation">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.png" alt="Etern Learning" className="side-logo" />
      <nav>
        {NAV.map(n => {
          const active = (h?: string) => Boolean(h) && (path === h || path.startsWith(h + '/')) ;
          // Exact match for the sibling links under Users, so /users is not "on" while viewing /users/expired.
          const exact = (h?: string) => Boolean(h) && (h === '/users' ? path === '/users' || /^\/users\/[0-9a-f]{24}$/i.test(path) : active(h));
          return (
            <div key={n.label} className="nav-group">
              {n.href ? (
                <Link href={n.href} className={'nav-item' + (active(n.href) ? ' on' : '')} aria-current={active(n.href) ? 'page' : undefined}>{n.label}</Link>
              ) : (
                <span className={'nav-item' + (n.items?.some(i => i.href) ? '' : ' off')}>{n.label}{n.items?.some(i => i.href) ? null : <em>Soon</em>}</span>
              )}
              {n.items?.map(i => i.href ? (
                <Link key={i.label} href={i.href} className={'nav-sub' + (exact(i.href) ? ' on' : '')} aria-current={exact(i.href) ? 'page' : undefined}>{i.label}</Link>
              ) : (
                <span key={i.label} className="nav-sub off" aria-disabled="true">{i.label}</span>
              ))}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
