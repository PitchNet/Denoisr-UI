// Mobile screens for Denoisr — built around the iOS device frame.
// Uses Variant A aesthetic as the canonical mobile direction.

// ─────────────────────────────────────────────────────────────
// Shared mobile chrome
// ─────────────────────────────────────────────────────────────
function MobileShell({ children, tab = 'home', dark = false, scrollable = false }) {
  const bg = dark ? '#0a0a09' : '#f7f5f1';
  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: bg, paddingTop: 54,
      display: 'flex', flexDirection: 'column',
      fontFamily: 'Geist, system-ui, sans-serif',
      color: dark ? '#f0ece4' : '#1a1715',
      overflow: 'hidden',
    }}>
      <div style={{
        flex: 1, overflow: scrollable ? 'auto' : 'hidden',
        position: 'relative',
      }}>{children}</div>
      <MobileTabBar active={tab} dark={dark} />
    </div>
  );
}

function MobileTabBar({ active = 'home', dark = false }) {
  const items = [
    { id: 'home', label: 'Discover', icon: 'home' },
    { id: 'matches', label: 'Matches', icon: 'matches' },
    { id: 'messages', label: 'Inbox', icon: 'chat' },
    { id: 'profile', label: 'You', icon: 'user' },
  ];
  const text = dark ? '#f0ece4' : '#1a1715';
  const dim = dark ? 'rgba(240,236,228,.4)' : 'rgba(26,23,21,.4)';
  return (
    <div style={{
      padding: '12px 16px 26px',
      background: dark ? 'rgba(10,10,9,.85)' : 'rgba(247,245,241,.85)',
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      borderTop: dark ? '1px solid rgba(240,236,228,.06)' : '1px solid rgba(26,23,21,.06)',
      display: 'flex', justifyContent: 'space-around',
      position: 'relative', zIndex: 5,
    }}>
      {items.map((it) => (
        <div key={it.id} style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
          color: it.id === active ? text : dim,
        }}>
          <TabIcon kind={it.icon} />
          <div style={{ fontFamily: 'Geist Mono, ui-monospace, monospace', fontSize: 9, letterSpacing: 1.2, textTransform: 'uppercase' }}>
            {it.label}
          </div>
        </div>
      ))}
    </div>
  );
}

function TabIcon({ kind }) {
  const props = { width: 22, height: 22, viewBox: '0 0 22 22', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (kind === 'home') return <svg {...props}><path d="M4 9l7-5 7 5v8a1 1 0 01-1 1H5a1 1 0 01-1-1V9z"/></svg>;
  if (kind === 'matches') return <svg {...props}><path d="M11 18s-7-4-7-9a4 4 0 017-2.5A4 4 0 0118 9c0 5-7 9-7 9z"/></svg>;
  if (kind === 'chat') return <svg {...props}><path d="M4 5h14v9H9l-5 4V5z"/></svg>;
  if (kind === 'user') return <svg {...props}><circle cx="11" cy="8" r="3.5"/><path d="M4 18c1-3.5 4-5 7-5s6 1.5 7 5"/></svg>;
  return null;
}

function MobileTopBar({ left, right, center, dark = false, sub }) {
  return (
    <div style={{ padding: '10px 16px 6px', position: 'relative', zIndex: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {left || <div style={{ width: 36 }} />}
        {center}
        {right || <div style={{ width: 36 }} />}
      </div>
      {sub}
    </div>
  );
}

function ModeSwitch({ value, onChange, dark = false, options = ['Jobs', 'People'] }) {
  const trackBg = dark ? 'rgba(240,236,228,.08)' : 'rgba(26,23,21,.06)';
  const knobBg = dark ? '#f0ece4' : '#1a1715';
  const knobText = dark ? '#0a0a09' : '#fbfaf6';
  const idleText = dark ? 'rgba(240,236,228,.6)' : 'rgba(26,23,21,.55)';
  return (
    <div style={{
      background: trackBg, borderRadius: 999, padding: 3,
      display: 'flex', alignItems: 'center', position: 'relative',
    }}>
      {options.map((opt) => (
        <div key={opt} onClick={() => onChange && onChange(opt)} style={{
          padding: '8px 18px', borderRadius: 999, cursor: 'pointer',
          fontSize: 13, fontWeight: 500,
          fontFamily: 'Geist Mono, ui-monospace, monospace', letterSpacing: 0.8,
          background: value === opt ? knobBg : 'transparent',
          color: value === opt ? knobText : idleText,
          transition: 'background .15s',
        }}>
          {opt.toUpperCase()}
        </div>
      ))}
    </div>
  );
}

function Wordmark({ dark = false }) {
  return (
    <div style={{
      fontFamily: 'Geist, system-ui, sans-serif',
      fontSize: 22, fontWeight: 700, letterSpacing: -0.8,
      color: dark ? '#f0ece4' : '#1a1715', lineHeight: 1,
    }}>
      Denoisr<span style={{ color: dark ? '#7a766c' : '#a8a39a' }}>.</span>
    </div>
  );
}

// Round action button used at bottom of swipe screen
function ActionButton({ kind, onClick, dark = false, big = false }) {
  const size = big ? 68 : 56;
  const colors = {
    pass: { stroke: '#c44a39', bg: dark ? '#1c1c1a' : '#fff' },
    boost: { stroke: dark ? 'oklch(0.86 0.18 105)' : '#1a1715', bg: dark ? '#1c1c1a' : '#fff' },
    like: { stroke: '#2c8a55', bg: dark ? '#1c1c1a' : '#fff' },
    rewind: { stroke: '#b58a2a', bg: dark ? '#1c1c1a' : '#fff' },
    bookmark: { stroke: dark ? '#a8a39a' : '#5a534a', bg: dark ? '#1c1c1a' : '#fff' },
  }[kind];
  const ico = {
    pass: <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M5 5l12 12M17 5L5 17"/></svg>,
    boost: <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 3v15M5 9l6-6 6 6"/></svg>,
    like: <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 18s-7-4-7-9a4 4 0 017-2.5A4 4 0 0118 9c0 5-7 9-7 9z"/></svg>,
    rewind: <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 11a7 7 0 1114 0M4 5v6h6"/></svg>,
    bookmark: <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 4h12v15l-6-4-6 4z"/></svg>,
  }[kind];
  return (
    <button onClick={onClick} data-no-drag style={{
      width: size, height: size, borderRadius: '50%',
      background: colors.bg,
      border: `1.5px solid ${dark ? 'rgba(240,236,228,.1)' : 'rgba(26,23,21,.08)'}`,
      color: colors.stroke,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: dark ? '0 8px 20px rgba(0,0,0,.4)' : '0 4px 16px rgba(40,30,20,.08)',
      cursor: 'pointer', flexShrink: 0,
    }}>{ico}</button>
  );
}

// ─────────────────────────────────────────────────────────────
// SCREEN — Mobile Jobs swipe
// ─────────────────────────────────────────────────────────────
function MobileJobsSwipe({ initialMode = 'Jobs' }) {
  const [mode, setMode] = React.useState(initialMode);
  const items = mode === 'Jobs' ? window.DENOISR_JOBS : window.DENOISR_PEOPLE;
  const [stack, setStack] = React.useState(items);

  React.useEffect(() => { setStack(mode === 'Jobs' ? window.DENOISR_JOBS : window.DENOISR_PEOPLE); }, [mode]);

  const top = stack[0];
  const second = stack[1];
  const swipe = (dir) => setStack((s) => s.length > 1 ? s.slice(1) : items);

  const CardA = mode === 'Jobs' ? VariantA_Job : VariantA_Person;

  return (
    <MobileShell tab="home">
      <MobileTopBar
        left={<Wordmark />}
        right={
          <button data-no-drag style={{
            width: 38, height: 38, borderRadius: '50%',
            background: '#fff', border: '1px solid rgba(26,23,21,.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#1a1715" strokeWidth="1.6" strokeLinecap="round">
              <path d="M3 5h12M5 9h8M7 13h4"/>
            </svg>
          </button>
        }
        sub={
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
            <ModeSwitch value={mode} onChange={setMode} />
          </div>
        }
      />

      {/* eyebrow + counter */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 22px 8px' }}>
        <div style={{ fontFamily: 'Geist Mono, ui-monospace, monospace', fontSize: 10, letterSpacing: 1.4, color: 'rgba(26,23,21,.45)', textTransform: 'uppercase' }}>
          Curated for you · today
        </div>
        <div style={{ fontFamily: 'Geist Mono, ui-monospace, monospace', fontSize: 10.5, color: 'rgba(26,23,21,.55)' }}>
          {String(stack.length).padStart(2, '0')} left
        </div>
      </div>

      {/* card stack area */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 22px' }}>
        {/* corner washes for ambience */}
        <div style={{ position: 'absolute', top: 0, right: -40, width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(255,210,225,.45), transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -20, left: -40, width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(215,210,255,.4), transparent 70%)', pointerEvents: 'none' }} />

        {second && (
          <div style={{ position: 'absolute', transform: 'scale(.94) translateY(14px)', opacity: 0.6, width: 320, height: 460 }}>
            <CardA {...(mode === 'Jobs' ? { job: second } : { person: second })} decision={null} />
          </div>
        )}
        {top && (
          <SwipeCard key={top.id} onSwipe={swipe} width={320} height={460}>
            {({ decision }) => <CardA {...(mode === 'Jobs' ? { job: top } : { person: top })} decision={decision} />}
          </SwipeCard>
        )}
      </div>

      {/* action bar */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 14, padding: '6px 22px 18px', alignItems: 'center' }}>
        <ActionButton kind="rewind" />
        <ActionButton kind="pass" big onClick={() => swipe('pass')} />
        <ActionButton kind="boost" onClick={() => swipe('boost')} />
        <ActionButton kind="like" big onClick={() => swipe('like')} />
        <ActionButton kind="bookmark" />
      </div>
    </MobileShell>
  );
}

// ─────────────────────────────────────────────────────────────
// SCREEN — Match moment ("It's a fit")
// ─────────────────────────────────────────────────────────────
function MobileMatch() {
  const job = window.DENOISR_JOBS[0];
  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'linear-gradient(180deg, #fdf5f8 0%, #f3edff 50%, #eef5ff 100%)',
      paddingTop: 54,
      fontFamily: 'Geist, system-ui, sans-serif', color: '#1a1715',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      <div style={{ padding: '14px 22px', display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'rgba(255,255,255,.6)', backdropFilter: 'blur(8px)',
          border: '1px solid rgba(26,23,21,.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#1a1715" strokeWidth="2" strokeLinecap="round">
            <path d="M2 2l10 10M12 2L2 12"/>
          </svg>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 28px' }}>
        <div style={{ fontFamily: 'Geist Mono, ui-monospace, monospace', fontSize: 10.5, letterSpacing: 1.8, color: 'rgba(26,23,21,.55)', textTransform: 'uppercase' }}>
          Mutual interest
        </div>
        <div style={{ marginTop: 12, fontSize: 56, fontWeight: 600, letterSpacing: -2.5, lineHeight: 0.95, textAlign: 'center' }}>
          It's a fit.
        </div>
        <div style={{ marginTop: 14, fontSize: 15, color: 'rgba(26,23,21,.65)', textAlign: 'center', maxWidth: 280, lineHeight: 1.45 }}>
          Northwind Mobility liked your profile back. Their hiring lead is online now.
        </div>

        {/* paired avatars */}
        <div style={{ marginTop: 36, display: 'flex', alignItems: 'center', gap: -8, position: 'relative' }}>
          <div style={{
            width: 88, height: 88, borderRadius: '50%', background: 'oklch(0.78 0.10 320)',
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 30, fontWeight: 600, marginRight: -14,
            boxShadow: '0 12px 30px -8px rgba(0,0,0,.2)', zIndex: 2, transform: 'rotate(-4deg)',
          }}>YO</div>
          <div style={{
            width: 88, height: 88, borderRadius: '50%', background: job.swatch,
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, fontWeight: 600,
            boxShadow: '0 12px 30px -8px rgba(0,0,0,.2)', transform: 'rotate(4deg)',
          }}>{job.initials}</div>
        </div>

        <div style={{ marginTop: 18, fontFamily: 'Geist Mono, ui-monospace, monospace', fontSize: 11, letterSpacing: 1, color: 'rgba(26,23,21,.55)' }}>
          YOU &nbsp;×&nbsp; {job.company.toUpperCase()}
        </div>

        {/* shared room */}
        <div style={{
          marginTop: 32, width: '100%', padding: 16,
          background: 'rgba(255,255,255,.6)', backdropFilter: 'blur(10px)',
          border: '1px solid rgba(26,23,21,.06)', borderRadius: 18,
        }}>
          <div style={{ fontFamily: 'Geist Mono, ui-monospace, monospace', fontSize: 9.5, letterSpacing: 1.4, color: 'rgba(26,23,21,.5)', textTransform: 'uppercase', marginBottom: 10 }}>
            Suggested opener
          </div>
          <div style={{ fontSize: 14, lineHeight: 1.5, color: '#1a1715' }}>
            "Hi — I'm curious about the routing surface you're building. Could we trade 20 minutes this week?"
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: '0 22px 32px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button style={{
          height: 56, borderRadius: 999, border: 'none',
          background: '#1a1715', color: '#fbfaf6',
          fontFamily: 'inherit', fontSize: 15, fontWeight: 500, letterSpacing: -0.2, cursor: 'pointer',
        }}>Send opener</button>
        <button style={{
          height: 48, borderRadius: 999, border: '1px solid rgba(26,23,21,.12)',
          background: 'transparent', color: '#1a1715',
          fontFamily: 'inherit', fontSize: 14, cursor: 'pointer',
        }}>Write your own</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SCREEN — Filters / Tune
// ─────────────────────────────────────────────────────────────
function MobileFilters() {
  const [exp, setExp] = React.useState(7);
  const [sal, setSal] = React.useState(140);
  const [remote, setRemote] = React.useState('Hybrid');
  return (
    <MobileShell tab="home" scrollable>
      <MobileTopBar
        left={
          <button data-no-drag style={{
            background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
            color: '#1a1715', fontFamily: 'inherit',
          }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M14 4l-7 7 7 7"/></svg>
          </button>
        }
        center={<div style={{ fontFamily: 'Geist Mono, ui-monospace, monospace', fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase', color: 'rgba(26,23,21,.55)' }}>Tune</div>}
        right={
          <button data-no-drag style={{
            background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
            fontFamily: 'inherit', fontSize: 14, color: '#1a1715',
          }}>Reset</button>
        }
      />

      <div style={{ padding: '12px 22px 4px' }}>
        <div style={{ fontSize: 34, fontWeight: 600, letterSpacing: -1, lineHeight: 1, textWrap: 'pretty' }}>
          Tune for relevance.
        </div>
        <div style={{ marginTop: 10, fontSize: 14, color: 'rgba(26,23,21,.6)', lineHeight: 1.45 }}>
          Denoisr keeps discovery high-signal. Narrow the stream by role, location, experience, and compensation.
        </div>
      </div>

      <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 22 }}>
        {/* role search */}
        <FilterField label="Role">
          <div style={{
            padding: '14px 16px', background: '#fff', borderRadius: 14,
            border: '1px solid rgba(26,23,21,.08)', fontSize: 15, color: 'rgba(26,23,21,.4)',
          }}>Search role</div>
        </FilterField>

        {/* location */}
        <FilterField label="Location">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {['Country', 'City'].map((p) => (
              <div key={p} style={{
                padding: '14px 16px', background: '#fff', borderRadius: 14,
                border: '1px solid rgba(26,23,21,.08)', fontSize: 15, color: 'rgba(26,23,21,.4)',
              }}>{p}</div>
            ))}
          </div>
        </FilterField>

        {/* remote */}
        <FilterField label="Work mode">
          <div style={{ display: 'flex', gap: 8 }}>
            {['Remote', 'Hybrid', 'On-site'].map((opt) => (
              <div key={opt} onClick={() => setRemote(opt)} style={{
                flex: 1, padding: '11px 0', textAlign: 'center',
                borderRadius: 999, fontSize: 13,
                fontFamily: 'Geist Mono, ui-monospace, monospace', letterSpacing: 0.8,
                background: remote === opt ? '#1a1715' : '#fff',
                color: remote === opt ? '#fbfaf6' : 'rgba(26,23,21,.65)',
                border: '1px solid rgba(26,23,21,.08)', cursor: 'pointer',
              }}>{opt.toUpperCase()}</div>
            ))}
          </div>
        </FilterField>

        <FilterField label="Experience required" value={`Up to ${exp} years`}>
          <FakeSlider value={exp} max={20} onChange={setExp} />
        </FilterField>

        <FilterField label="Salary range" value={`Up to $${sal}k`}>
          <FakeSlider value={sal} max={300} onChange={setSal} />
        </FilterField>
      </div>

      <div style={{ padding: '6px 22px 24px' }}>
        <button style={{
          width: '100%', height: 56, borderRadius: 999, border: 'none',
          background: '#1a1715', color: '#fbfaf6',
          fontFamily: 'inherit', fontSize: 15, fontWeight: 500, cursor: 'pointer',
        }}>Apply filter</button>
      </div>
    </MobileShell>
  );
}

function FilterField({ label, value, children }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
        <div style={{ fontFamily: 'Geist Mono, ui-monospace, monospace', fontSize: 10, letterSpacing: 1.4, color: 'rgba(26,23,21,.55)', textTransform: 'uppercase' }}>{label}</div>
        {value && <div style={{ fontSize: 13.5, color: '#1a1715' }}>{value}</div>}
      </div>
      {children}
    </div>
  );
}

function FakeSlider({ value, max, onChange }) {
  const ref = React.useRef();
  const pct = (value / max) * 100;
  const down = (e) => {
    const r = ref.current.getBoundingClientRect();
    const set = (ev) => onChange(Math.max(0, Math.min(max, Math.round(((ev.clientX - r.left) / r.width) * max))));
    set(e);
    const move = (ev) => set(ev);
    const up = () => { document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', up); };
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up);
  };
  return (
    <div ref={ref} onPointerDown={down} data-no-drag style={{
      height: 8, background: 'rgba(26,23,21,.08)', borderRadius: 999, position: 'relative', cursor: 'pointer',
    }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`, background: '#1a1715', borderRadius: 999 }} />
      <div style={{ position: 'absolute', left: `calc(${pct}% - 11px)`, top: -7, width: 22, height: 22, borderRadius: '50%', background: '#fff', border: '1px solid rgba(26,23,21,.18)', boxShadow: '0 2px 8px rgba(0,0,0,.1)' }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SCREEN — Profile (your own)
// ─────────────────────────────────────────────────────────────
function MobileProfile() {
  return (
    <MobileShell tab="profile" scrollable>
      <MobileTopBar
        center={<div style={{ fontFamily: 'Geist Mono, ui-monospace, monospace', fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase', color: 'rgba(26,23,21,.55)' }}>You</div>}
        right={
          <button data-no-drag style={{
            background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
            fontFamily: 'inherit', fontSize: 14, color: '#1a1715',
          }}>Edit</button>
        }
      />

      <div style={{ position: 'relative', height: 140 }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(255,210,225,.55), rgba(220,210,255,.45) 50%, rgba(210,255,235,.4))' }} />
        <div style={{
          position: 'absolute', bottom: -42, left: 22,
          width: 96, height: 96, borderRadius: '50%', background: 'oklch(0.78 0.10 320)',
          color: '#fff', fontSize: 36, fontWeight: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '4px solid #f7f5f1', boxShadow: '0 8px 24px rgba(0,0,0,.15)',
        }}>YO</div>
      </div>

      <div style={{ padding: '54px 22px 12px' }}>
        <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: -0.7, lineHeight: 1.05 }}>You Okumura</div>
        <div style={{ marginTop: 6, fontSize: 14, color: 'rgba(26,23,21,.65)' }}>Senior product designer · founding instinct</div>
        <div style={{ marginTop: 4, fontFamily: 'Geist Mono, ui-monospace, monospace', fontSize: 11, color: 'rgba(26,23,21,.5)' }}>
          Tokyo · remote-friendly
        </div>
      </div>

      <div style={{ padding: '12px 22px', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {['Open to roles', 'Open to chats', 'Looking for co-founder'].map((t, i) => (
          <div key={t} style={{
            padding: '6px 12px', borderRadius: 999, fontSize: 12,
            background: i === 0 ? '#1a1715' : '#fff',
            color: i === 0 ? '#fbfaf6' : '#1a1715',
            border: i === 0 ? 'none' : '1px solid rgba(26,23,21,.1)',
          }}>{t}</div>
        ))}
      </div>

      {/* signal meter */}
      <div style={{ margin: '18px 22px', padding: 18, background: '#fff', borderRadius: 18, border: '1px solid rgba(26,23,21,.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div style={{ fontFamily: 'Geist Mono, ui-monospace, monospace', fontSize: 10, letterSpacing: 1.4, color: 'rgba(26,23,21,.55)', textTransform: 'uppercase' }}>Signal score</div>
          <div style={{ fontFamily: 'Geist Mono, ui-monospace, monospace', fontSize: 22, color: '#1a1715' }}>84<span style={{ color: 'rgba(26,23,21,.35)' }}>/100</span></div>
        </div>
        <div style={{ marginTop: 12, height: 6, background: 'rgba(26,23,21,.08)', borderRadius: 999, overflow: 'hidden' }}>
          <div style={{ width: '84%', height: '100%', background: 'linear-gradient(90deg, #1a1715, oklch(0.7 0.13 145))' }} />
        </div>
        <div style={{ marginTop: 10, fontSize: 12, color: 'rgba(26,23,21,.6)' }}>
          Strong portfolio, two endorsements, one missing case study.
        </div>
      </div>

      {/* sections */}
      <ProfileSection label="Work" rows={[
        ['Stripe', '2021 — 2024'],
        ['Linear (founding)', '2019 — 2021'],
        ['Self-employed', '2017 — 2019'],
      ]} />

      <ProfileSection label="Looking for" rows={[
        ['Founding design role', 'Pre-seed / seed'],
        ['Coffee chats', 'Tokyo, NYC, Berlin'],
        ['Compensation', '$160–200k + equity'],
      ]} />

      <div style={{ height: 12 }} />
    </MobileShell>
  );
}

function ProfileSection({ label, rows }) {
  return (
    <div style={{ margin: '12px 22px' }}>
      <div style={{ fontFamily: 'Geist Mono, ui-monospace, monospace', fontSize: 10, letterSpacing: 1.4, color: 'rgba(26,23,21,.5)', textTransform: 'uppercase', marginBottom: 10 }}>{label}</div>
      <div style={{ background: '#fff', borderRadius: 18, border: '1px solid rgba(26,23,21,.06)', overflow: 'hidden' }}>
        {rows.map(([k, v], i) => (
          <div key={k} style={{
            padding: '14px 16px', display: 'flex', justifyContent: 'space-between',
            borderTop: i ? '1px solid rgba(26,23,21,.06)' : 'none',
          }}>
            <div style={{ fontSize: 14, color: '#1a1715' }}>{k}</div>
            <div style={{ fontSize: 13, color: 'rgba(26,23,21,.6)' }}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SCREEN — Matches list
// ─────────────────────────────────────────────────────────────
function MobileMatches() {
  const all = [
    { kind: 'job', subject: window.DENOISR_JOBS[0], preview: 'Their hiring lead replied to your opener.', when: '2h', unread: true },
    { kind: 'person', subject: window.DENOISR_PEOPLE[0], preview: 'Wants to trade 20 min on Thursday.', when: '5h', unread: true },
    { kind: 'job', subject: window.DENOISR_JOBS[2], preview: 'They sent over a case study to read.', when: '1d', unread: false },
    { kind: 'person', subject: window.DENOISR_PEOPLE[1], preview: 'You: "Cassandra sharding I can take or leave."', when: '2d', unread: false },
    { kind: 'job', subject: window.DENOISR_JOBS[3], preview: 'Heads-up — they shortlisted you.', when: '3d', unread: false },
  ];
  return (
    <MobileShell tab="matches" scrollable>
      <MobileTopBar
        center={<div style={{ fontFamily: 'Geist Mono, ui-monospace, monospace', fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase', color: 'rgba(26,23,21,.55)' }}>Matches</div>}
      />

      <div style={{ padding: '4px 22px 16px' }}>
        <div style={{ fontSize: 34, fontWeight: 600, letterSpacing: -1, lineHeight: 1 }}>Mutual interest.</div>
        <div style={{ marginTop: 8, fontSize: 14, color: 'rgba(26,23,21,.6)' }}>
          Five fits this week — three still open.
        </div>
      </div>

      {/* new matches row */}
      <div style={{ padding: '0 0 6px 22px', display: 'flex', gap: 14, overflowX: 'auto' }}>
        {all.filter(m => m.unread).map((m) => (
          <div key={m.subject.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, minWidth: 70 }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: m.subject.swatch, color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 600,
              border: '2.5px solid #1a1715', boxShadow: '0 4px 12px rgba(0,0,0,.1)',
            }}>{m.subject.initials || m.subject.name?.split(' ').map(x=>x[0]).join('')}</div>
            <div style={{ fontSize: 11, color: '#1a1715', fontFamily: 'Geist Mono, ui-monospace, monospace', letterSpacing: 0.3, maxWidth: 70, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {(m.subject.company || m.subject.name).split(' ')[0]}
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: '16px 22px 6px', fontFamily: 'Geist Mono, ui-monospace, monospace', fontSize: 10, letterSpacing: 1.4, color: 'rgba(26,23,21,.5)', textTransform: 'uppercase' }}>
        Conversations
      </div>

      <div style={{ padding: '0 12px' }}>
        {all.map((m, i) => (
          <div key={i} style={{
            display: 'flex', gap: 14, padding: '14px 10px', alignItems: 'center',
            borderRadius: 14,
          }}>
            <div style={{
              width: 50, height: 50, borderRadius: '50%',
              background: m.subject.swatch, color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 600, flexShrink: 0,
            }}>{m.subject.initials || m.subject.name?.split(' ').map(x=>x[0]).join('')}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ fontSize: 15, fontWeight: 500, color: '#1a1715', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {m.subject.company || m.subject.name}
                </div>
                <div style={{ fontFamily: 'Geist Mono, ui-monospace, monospace', fontSize: 10.5, color: 'rgba(26,23,21,.4)' }}>{m.when}</div>
              </div>
              <div style={{ marginTop: 3, fontSize: 13, color: m.unread ? '#1a1715' : 'rgba(26,23,21,.55)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {m.preview}
              </div>
            </div>
            {m.unread && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1a1715', flexShrink: 0 }} />}
          </div>
        ))}
      </div>
    </MobileShell>
  );
}

Object.assign(window, {
  MobileJobsSwipe, MobileMatch, MobileFilters, MobileProfile, MobileMatches,
  MobileShell, MobileTopBar, ModeSwitch, Wordmark, ActionButton,
});
