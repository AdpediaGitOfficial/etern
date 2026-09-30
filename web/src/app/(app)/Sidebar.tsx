'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon, { type IconName } from '@/components/icons';
import { useShell } from '@/components/ShellProvider';

interface NavItem { label: string; href: string; icon: IconName; badgeKey?: 'expiring' }
const SECTIONS: { title: string; items: NavItem[] }[] = [
  { title: 'Analytics', items: [{ label: 'Dashboard', href: '/dashboard', icon: 'dashboard' }] },
  { title: 'Learners', items: [
    { label: 'All Users', href: '/users', icon: 'users' },
    { label: 'Upcoming Expiry', href: '/users/upcoming', icon: 'clock', badgeKey: 'expiring' },
    { label: 'Expired Subscriptions', href: '/users/expired', icon: 'alert' },
  ] },
  { title: 'Finance', items: [
    { label: 'Offline Payments', href: '/offline-payments', icon: 'wallet' },
    { label: 'Online Payments', href: '/online-payments', icon: 'card' },
  ] },
  { title: 'Catalogue', items: [
    { label: 'Packages', href: '/packages', icon: 'package' },
    { label: 'Categories', href: '/categories', icon: 'folder' },
    { label: 'Sub Categories', href: '/sub-categories', icon: 'layers' },
    { label: 'Course Materials', href: '/course-materials', icon: 'video' },
  ] },
];

const STUDENT_DETAIL = /^\/users\/[0-9a-f]{24}$/i;

export default function Sidebar({ expiringCount }: { expiringCount: number }) {
  const path = usePathname();
  const { navOpen, setNavOpen } = useShell();

  // "/users" must not light up while viewing /users/expired, but a student's detail page still belongs to Users.
  const isOn = (href: string) => (href === '/users' ? path === '/users' || STUDENT_DETAIL.test(path) : path === href || path.startsWith(href + '/'));

  return (
    <>
      {navOpen ? <div className="scrim" onClick={() => setNavOpen(false)} aria-hidden="true" /> : null}
      <aside className={'side' + (navOpen ? ' open' : '')} aria-label="Main navigation" id="main-nav">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Etern Learning" className="side-logo" />
        <nav>
          {SECTIONS.map(section => (
            <div key={section.title} className="nav-group">
              <div className="nav-label">{section.title}</div>
              {section.items.map(item => {
                const on = isOn(item.href);
                return (
                  <Link key={item.href} href={item.href} className={'nav-item' + (on ? ' on' : '')} aria-current={on ? 'page' : undefined}>
                    <Icon name={item.icon} />
                    <span>{item.label}</span>
                    {item.badgeKey === 'expiring' && expiringCount > 0 ? <em className="nav-badge" aria-label={`${expiringCount} expiring`}>{expiringCount}</em> : null}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="side-user">
          <span className="avatar" aria-hidden="true">A</span>
          <div><strong>Admin</strong><small>Etern administrator</small></div>
        </div>
      </aside>
    </>
  );
}
