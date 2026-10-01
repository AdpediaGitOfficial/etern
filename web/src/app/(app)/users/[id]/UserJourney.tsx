'use client';

import Link from 'next/link';
import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Toast, { type ToastData } from '@/components/Toast';
import { ConfirmDialog, PageHead, Pill } from '@/components/ui';
import { api } from '@/lib/api';
import { endsWhen, isRunning, STATUS_LABEL, STATUS_TONE } from '@/lib/access';
import { ageFrom, fmtDate, inr } from '@/lib/format';
import { ago, nudgeFor, timelineWhen } from '@/lib/journeyView';
import type { Journey } from '@/lib/types';

type Tab = 'over' | 'jour' | 'learn' | 'subs';
const TABS: [Tab, string][] = [['over', 'Overview'], ['jour', 'Journey'], ['learn', 'Learning'], ['subs', 'Subscriptions and payments']];

/** One student: who, plan, what they can open, how they are learning, and everything that happened. */
export default function UserJourney({ j }: { j: Journey }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('over');
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);
  const nextId = useRef(1);
  const say = useCallback((msg: string, extra: Partial<ToastData> = {}) => setToast({ id: nextId.current++, msg, ...extra }), []);

  const { student: s, access: a, metrics: m } = j;
  const running = isRunning(a.accessStatus);
  const nudge = nudgeFor(j);
  const age = ageFrom(s.dob);
  const pay = `/offline-payments/new?studentId=${s._id}&name=${encodeURIComponent(s.fullName)}`;
  const mobile = s.parent.mobileNumber ? String(s.parent.mobileNumber) : '';
  const sub = [age === null ? null : `${age} years`, s.gender || null, s.parent.name ? `Parent: ${s.parent.name}` : null, `Joined ${fmtDate(s.createdAt, 'medium')}`].filter(Boolean).join(' · ');

  async function endPlan() {
    setBusy(true);
    const r = await api(`student/unsubscribe/${s._id}`, { method: 'GET' }, 'Could not end the plan.');
    setBusy(false);
    setConfirm(false);
    if (r.ok) { say('Plan ended. The student is now on the free version.'); router.refresh(); } else say(r.message, { tone: 'bad' });
  }
  async function copy() {
    try { await navigator.clipboard.writeText(mobile); say('Mobile number copied.'); } catch { say('Copy is blocked in this browser.', { tone: 'bad' }); }
  }

  // Subscription card numbers
  const start = a.subscriptionStartDate, end = a.subscriptionEndDate;
  const span = start && end ? Math.max(1, (new Date(end).getTime() - new Date(start).getTime()) / 86400000) : 0;
  const used = a.daysLeft === null || !span ? 0 : a.daysLeft <= 0 ? 100 : Math.max(0, Math.min(100, Math.round((1 - a.daysLeft / span) * 100)));
  const locked = Math.max(0, a.totalVideos - a.openVideos);
  const openPct = a.totalVideos ? Math.round((a.openVideos / a.totalVideos) * 100) : 0;
  const lockOff = a.isFreeVersion && !a.freeVersion.enabled;

  return (
    <>
      <PageHead title={s.fullName} subtitle={sub}>
        {mobile ? <button type="button" className="btn" onClick={copy} aria-label={`Copy mobile number ${mobile}`}>{mobile} · Copy</button> : null}
        {running ? <button type="button" className="btn danger-o" onClick={() => setConfirm(true)}>End plan now…</button> : null}
        <Link className="btn primary" href={pay}>{running ? 'Renew plan' : 'Add payment'}</Link>
      </PageHead>

      <div className="grid2">
        <section className="card" aria-label="Subscription">
          <div className="ch"><h2>Subscription</h2><Pill tone={STATUS_TONE[a.accessStatus]}>{STATUS_LABEL[a.accessStatus]}</Pill></div>
          {a.subscriptionEndDate ? (
            <>
              <div className="bigcount">{a.daysLeft !== null && a.daysLeft > 0 ? <>{a.daysLeft} <small>days left</small></> : <>{Math.abs(a.daysLeft ?? 0)} <small>days since it ended</small></>}</div>
              <div className={'bar' + (a.accessStatus === 'expiring' ? ' warn' : a.daysLeft !== null && a.daysLeft <= 0 ? ' bad' : '')} role="img" aria-label={`${used} percent of the plan used`}><i style={{ width: `${used}%` }} /></div>
              <div className="rowk"><span>{fmtDate(start, 'medium')}</span><span>{fmtDate(end, 'medium')}</span></div>
              <dl className="kv">
                <dt>Plan</dt><dd>{a.packageName || '—'}</dd>
                <dt>Ends</dt><dd>{fmtDate(end, 'medium')} <span className="muted">({endsWhen(end)})</span></dd>
              </dl>
            </>
          ) : (
            <><div className="bigcount">No plan yet</div><p className="muted">This student has never paid. They use the free version.</p></>
          )}
        </section>

        <section className="card" aria-label="What this student can open">
          <div className="ch"><h2>What this student can open</h2>{a.isFreeVersion ? <Pill tone="lock">Free version</Pill> : <Pill tone="good">Full access</Pill>}</div>
          <div className="bigcount">{a.openVideos} <small>of {a.totalVideos} videos</small></div>
          <div className="meter" role="img" aria-label={`${a.openVideos} of ${a.totalVideos} videos open`}><i style={{ width: `${openPct}%` }} /></div>
          <div className="legend"><span><b>{a.openVideos}</b> open</span><span><b>{locked}</b> locked</span></div>
          <div className="rulebox">
            {!a.isFreeVersion ? 'A running plan opens every video for this student’s age group.'
              : lockOff ? 'The free version is not switched on yet, so this student can still open every video. Turn it on with FREE_VERSION=on when the app can show locks.'
                : `Free rule: the first ${a.freeVersion.perSubCategory} video${a.freeVersion.perSubCategory === 1 ? '' : 's'} of every sub category stay open. The rest lock until a plan is bought. Progress is kept.`}
          </div>
        </section>
      </div>

      {nudge ? (
        <div className={`nudge ${nudge.tone}`}>
          <div><strong>{nudge.title}</strong><span>{nudge.text}</span></div>
          {nudge.cta ? <Link className="btn primary" href={pay}>{nudge.cta}</Link> : null}
        </div>
      ) : null}

      <div className="card sec">
        <div className="tabs" role="tablist" aria-label="Student details">
          {TABS.map(([k, label]) => <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>{label}</button>)}
        </div>

        {tab === 'over' ? (
          <div className="stack">
            <div className="jkpis">
              <div className="jkpi"><span>Videos viewed</span><b>{m.videosViewed}</b><small>of {a.openVideos} open</small></div>
              <div className="jkpi"><span>Completion</span><b>{m.completionPercent}%</b><small>of open videos</small></div>
              <div className="jkpi"><span>Active days</span><b>{m.activeDaysLast30}</b><small>in the last 30</small></div>
              <div className="jkpi"><span>Last active</span><b className="sm">{ago(m.lastActivityAt)}</b></div>
              <div className="jkpi"><span>First video</span><b className="sm">{m.firstActivityAt ? fmtDate(m.firstActivityAt, 'medium') : '—'}</b></div>
            </div>
            <div><h3 className="sub-h">Latest on the journey</h3><Timeline events={j.timeline.slice(-3)} /></div>
          </div>
        ) : null}

        {tab === 'jour' ? (
          <div><p className="muted lead-p">Everything that happened to this student, oldest first. It comes from sign up, viewing records and subscriptions.</p><Timeline events={j.timeline} /></div>
        ) : null}

        {tab === 'learn' ? (
          <div className="stack">
            <div>
              <h3 className="sub-h">Progress by category</h3>
              {j.learning.categories.length ? (
                <div className="catlist">
                  {j.learning.categories.map(c => {
                    const p = c.total ? Math.round((c.viewed / c.total) * 100) : 0;
                    return (
                      <div key={c.categoryId} className="cat">
                        <div><b>{c.name}</b><div className="muted small">{c.total} videos</div></div>
                        <div className="bar" role="img" aria-label={`${p} percent viewed`}><i style={{ width: `${p}%` }} /></div>
                        <div className="catend"><span className="mono">{c.viewed}/{c.total}</span>{c.locked ? <span className="pill lock">{c.locked} locked</span> : null}</div>
                      </div>
                    );
                  })}
                </div>
              ) : <p className="muted">No categories for this student’s package yet.</p>}
            </div>
            <div>
              <h3 className="sub-h">Recently viewed</h3>
              {j.learning.recent.length ? (
                <div className="tw flat"><table className="tbl">
                  <thead><tr><th>Video</th><th>Category</th><th>When</th><th>Access</th></tr></thead>
                  <tbody>{j.learning.recent.map((r, i) => (
                    <tr key={i}><td><b>{r.name}</b></td><td>{r.category || '—'}</td><td>{ago(r.viewedAt)}</td>
                      <td>{r.locked ? <Pill tone="lock">Locked now</Pill> : <Pill tone="good">Open</Pill>}</td></tr>
                  ))}</tbody>
                </table></div>
              ) : <p className="muted">Nothing viewed yet.</p>}
            </div>
          </div>
        ) : null}

        {tab === 'subs' ? (
          j.subscriptions.length ? (
            <div className="stack">
              <div className="jkpis">
                <div className="jkpi"><span>Total paid</span><b>{inr(j.subscriptions.reduce((n, x) => n + x.amount, 0))}</b></div>
                <div className="jkpi"><span>Plans bought</span><b>{j.subscriptions.length}</b></div>
              </div>
              <div className="tw flat"><table className="tbl">
                <thead><tr><th>Package</th><th>Start</th><th>End</th><th className="n">Paid</th><th>Mode</th><th>Recorded by</th><th>Status</th></tr></thead>
                <tbody>{[...j.subscriptions].reverse().map(x => (
                  <tr key={x._id}><td><b>{x.packageName}</b></td><td>{fmtDate(x.start, 'medium')}</td><td>{fmtDate(x.end, 'medium')}</td><td className="n">{inr(x.amount)}</td>
                    <td>{x.mode.toLowerCase() === 'offline' ? 'Offline' : x.mode}</td><td>{x.recordedBy}</td>
                    <td><Pill tone={x.state === 'running' ? 'good' : x.state === 'upcoming' ? 'warn' : 'off'}>{x.state === 'running' ? 'Running' : x.state === 'upcoming' ? 'Upcoming' : 'Ended'}</Pill></td></tr>
                ))}</tbody>
              </table></div>
              <p className="muted small">Every plan this student has had is kept here, so a renewal never hides what came before.</p>
            </div>
          ) : (
            <div className="empty"><strong>No plans bought yet</strong><span>Plans and payments will be listed here. Use “Add payment” for cash or transfer payments.</span></div>
          )
        ) : null}
      </div>

      <ConfirmDialog open={confirm} danger busy={busy} title="End this plan now?"
                     body={`${s.fullName} moves to the free version straight away. Only the free videos stay open. Progress and history are kept.`}
                     confirmLabel="End plan" onConfirm={endPlan} onCancel={() => setConfirm(false)} />
      <Toast toast={toast} onClose={() => setToast(null)} />
    </>
  );
}

function Timeline({ events }: { events: Journey['timeline'] }) {
  return (
    <ol className="tl">
      {events.map((e, i) => (
        <li key={i}>
          <span className="d">{timelineWhen(e.at, e.kind)}</span>
          <span className={`m ${e.kind}`} aria-hidden="true" />
          <div className="body"><b>{e.title}</b><p>{e.detail}</p></div>
        </li>
      ))}
    </ol>
  );
}
