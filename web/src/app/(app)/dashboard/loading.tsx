export default function Loading() {
  return (
    <div className="dash" aria-busy="true" aria-label="Loading dashboard">
      <div className="kpis">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="card kpi"><div className="skel"><i /><i /><i /></div></div>
        ))}
      </div>
      <div className="grid">
        <div className="card"><div className="skel tall"><i /><i /><i /></div></div>
        <div className="card"><div className="skel tall"><i /><i /><i /></div></div>
      </div>
    </div>
  );
}
