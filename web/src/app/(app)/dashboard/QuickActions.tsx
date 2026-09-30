import Link from 'next/link';
import Icon, { type IconName } from '@/components/icons';
import { usersLink } from '@/lib/dates';

const ACTIONS: { href: string; icon: IconName; title: string; hint: string }[] = [
  { href: usersLink({ subscription: 'false' }), icon: 'wallet', title: 'Record a payment', hint: 'Pick a free student' },
  { href: '/users/upcoming', icon: 'clock', title: 'Review expiring', hint: 'Renewals due in 7 days' },
  { href: '/course-materials/new', icon: 'video', title: 'Add course material', hint: 'Upload a new video link' },
  { href: '/packages/new', icon: 'package', title: 'Create a package', hint: 'Plans and prices' },
];

/** Shortcuts to the jobs admins do most. */
export default function QuickActions() {
  return (
    <nav className="quick" aria-label="Quick actions">
      {ACTIONS.map(a => (
        <Link key={a.href + a.title} href={a.href}>
          <span className="qi"><Icon name={a.icon} /></span>
          <span><span>{a.title}</span><small>{a.hint}</small></span>
        </Link>
      ))}
    </nav>
  );
}
