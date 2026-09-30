'use client';

/** Route-level error boundary: never shows stack traces to the user. */
export default function RouteError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="card" role="alert" style={{ margin: 24 }}>
      <div className="err">
        <strong>Something went wrong.</strong>
        <span>The page could not be shown. Your data is safe.</span>
        <button type="button" className="btn" onClick={reset}>Try again</button>
      </div>
    </div>
  );
}
