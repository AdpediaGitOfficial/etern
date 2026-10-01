import LoginForm from './LoginForm';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ expired?: string }> }) {
  const { expired } = await searchParams;
  return (
    <main className="login">
      <div className="login-card">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Etern Learning" className="login-logo" />
        <h1>Sign in</h1>
        <p className="muted">Etern admin panel</p>
        {expired ? <p className="notice" role="status">Your session ended. Sign in again to continue.</p> : null}
        <LoginForm />
      </div>
    </main>
  );
}
