import Sidebar from './Sidebar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="shell">
      <Sidebar />
      <div className="shell-main">
        <header className="topbar">
          <span className="topbar-title">Admin</span>
          <form action="/api/auth/logout" method="post">
            <button type="submit" className="btn">Sign out</button>
          </form>
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
