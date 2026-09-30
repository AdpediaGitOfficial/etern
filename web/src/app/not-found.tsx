import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="card" style={{ margin: 24 }}>
      <div className="empty">
        <strong>Page not found</strong>
        <span>The page you were looking for does not exist.</span>
        <Link className="btn primary" href="/dashboard">Go to dashboard</Link>
      </div>
    </div>
  );
}
