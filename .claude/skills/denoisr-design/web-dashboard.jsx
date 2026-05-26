// Web dashboard for Denoisr — extends the look from the user's screenshot.
// Two variants: Jobs mode (original) and People mode.

function WebShell({ children, mode, onMode }) {
  return (
    <div style={{
      width: '100%', height: '100%',
      background: '#fbfaf6', position: 'relative',
      fontFamily: 'Geist, system-ui, sans-serif',
      color: '#1a1715', overflow: 'hidden',
    }}>
      {/* corner washes */}
      <div style={{ position: 'absolute', top: 80, left: -120, width: 460, height: 460, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(255,210,225,.4), transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -120, right: -80, width: 520, height: 520, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(215,210,255,.4), transparent 70%)', pointerEvents: 'none' }} />

      <WebHeader mode={mode} onMode={onMode} />
      <div style={{ position: 'relative', height: 'calc(100% - 84px)' }}>
        {children}
      </div>
    </div>
  );
}

function WebHeader({ mode, onMode }) {
  return (
    <div style={{
      height: 84, padding: '0 36px', display: 'grid', gridTemplateColumns: '1fr auto 1fr',
      alignItems: 'center', position: 'relative', zIndex: 4,
      borderBottom: '1px solid rgba(26,23,21,.05)',
    }}>
      <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: -1, lineHeight: 1 }}>
        Denoisr<span style={{ color: '#a8a39a' }}>.</span>
      </div>

      <div style={{
        background: 'rgba(26,23,21,.06)', borderRadius: 999, padding: 4,
        display: 'flex', alignItems: 'center',
      }}>
        {['Jobs', 'People'].map((opt) => (
          <div key={opt} onClick={() => onMode && onMode(opt)} style={{
            padding: '8px 22px', borderRadius: 999, cursor: 'pointer',
            fontSize: 13, fontFamily: 'Geist Mono, ui-monospace, monospace', letterSpacing: 1,
            background: mode === opt ? '#fbfaf6' : 'transparent',
            color: mode === opt ? '#1a1715' : 'rgba(26,23,21,.55)',
            boxShadow: mode === opt ? '0 1px 2px rgba(0,0,0,.05)' : 'none',
            transition: 'background .15s',
          }}>{opt.toUpperCase()}</div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 0, justifyContent: 'flex-end', alignItems: 'center' }}>
        {[
          { id: 'home', label: 'Home', active: true },
          { id: 'inbox', label: 'Messages' },
          { id: 'you', label: 'Profile' },
          { id: 'out', label: 'Logout' },
        ].map((it) => (
          <div key={it.id} style={{
            padding: '14px 20px', borderRadius: 12,
            background: it.active ? '#1a1715' : 'transparent',
            color: it.active ? '#fbfaf6' : '#1a1715',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
            fontSize: 12, cursor: 'pointer',
          }}>
            <WebNavIcon kind={it.id} active={it.active} />
            <div style={{ fontFamily: 'inherit', fontSize: 12 }}>{it.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WebNavIcon({ kind, active }) {
  const p = { width: 18, height: 18, viewBox: '0 0 18 18', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (kind === 'home') return <svg {...p}><circle cx="9" cy="9" r="7"/><path d="M9 4l3.5 3.5L9 11 5.5 7.5z"/></svg>;
  if (kind === 'inbox') return <svg {...p}><path d="M3 5h12v8H3z"/><path d="M3 5l6 4 6-4"/></svg>;
  if (kind === 'you') return <svg {...p}><circle cx="9" cy="7" r="3"/><path d="M3 15c1-3 3.5-4.5 6-4.5s5 1.5 6 4.5"/></svg>;
  if (kind === 'out') return <svg {...p}><path d="M10 3h4v12h-4M11 9H3M6 6L3 9l3 3"/></svg>;
  return null;
}

// ─────────────────────────────────────────────────────────────
// 3-column layout (filters · card · detail)
// ─────────────────────────────────────────────────────────────
function WebDashboard({ initialMode = 'Jobs' }) {
  const [mode, setMode] = React.useState(initialMode);
  const list = mode === 'Jobs' ? window.DENOISR_JOBS : window.DENOISR_PEOPLE;
  const [stack, setStack] = React.useState(list);
  React.useEffect(() => { setStack(mode === 'Jobs' ? window.DENOISR_JOBS : window.DENOISR_PEOPLE); }, [mode]);
  const top = stack[0];
  const second = stack[1];
  const swipe = () => setStack((s) => s.length > 1 ? s.slice(1) : list);

  return (
    <WebShell mode={mode} onMode={setMode}>
      <div style={{
        position: 'relative', height: '100%', padding: '36px',
        display: 'grid', gridTemplateColumns: '1fr 1.15fr 1fr', gap: 24, alignItems: 'stretch',
      }}>
        <WebFilters />
        <WebCenterStage mode={mode} top={top} second={second} onSwipe={swipe} count={stack.length} />
        <WebPreview mode={mode} subject={top} />
      </div>
    </WebShell>
  );
}

function WebFilters() {
  return (
    <div style={{
      background: '#fff', borderRadius: 24, padding: 28,
      border: '1px solid rgba(26,23,21,.05)',
      boxShadow: '0 1px 0 rgba(0,0,0,.02), 0 10px 30px -10px rgba(40,30,20,.06)',
      display: 'flex', flexDirection: 'column',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ fontFamily: 'Geist Mono, ui-monospace, monospace', fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: 'rgba(26,23,21,.5)' }}>
        Discovery filters
      </div>
      <div style={{ marginTop: 14, fontSize: 26, fontWeight: 600, letterSpacing: -0.6, lineHeight: 1.05 }}>
        Tune for relevance.
      </div>
      <div style={{ marginTop: 10, fontSize: 13, color: 'rgba(26,23,21,.65)', lineHeight: 1.5 }}>
        Denoisr keeps discovery high-signal. Narrow the stream by role, location, experience, and compensation.
      </div>

      <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
        <WebField label="Role"><WebInput placeholder="Search role" /></WebField>
        <WebField label="Experience required" value="Up to 10 years"><WebSlider pct={100} /></WebField>
        <WebField label="Country"><WebInput placeholder="Country" /></WebField>
        <WebField label="City"><WebInput placeholder="City" /></WebField>
        <WebField label="Salary range" value="Up to $200k"><WebSlider pct={86} /></WebField>
      </div>

      <button style={{
        marginTop: 18, height: 52, borderRadius: 14, border: 'none',
        background: '#1a1715', color: '#fbfaf6',
        fontFamily: 'inherit', fontSize: 14, fontWeight: 500, cursor: 'pointer',
      }}>Apply filter</button>
    </div>
  );
}

function WebField({ label, value, children }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontFamily: 'Geist Mono, ui-monospace, monospace', fontSize: 9.5, letterSpacing: 1.4, color: 'rgba(26,23,21,.55)', textTransform: 'uppercase' }}>{label}</div>
        {value && <div style={{ fontSize: 13, color: '#1a1715' }}>{value}</div>}
      </div>
      {children}
    </div>
  );
}

function WebInput({ placeholder }) {
  return (
    <div style={{
      padding: '12px 14px', borderRadius: 10,
      background: '#fbfaf6', border: '1px solid rgba(26,23,21,.08)',
      fontSize: 13.5, color: 'rgba(26,23,21,.4)',
    }}>{placeholder}</div>
  );
}

function WebSlider({ pct }) {
  return (
    <div style={{ height: 6, background: 'rgba(26,23,21,.08)', borderRadius: 999, position: 'relative' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`, background: '#1a1715', borderRadius: 999 }} />
      <div style={{ position: 'absolute', left: `calc(${pct}% - 9px)`, top: -6, width: 18, height: 18, borderRadius: '50%', background: '#fff', border: '1px solid rgba(26,23,21,.2)', boxShadow: '0 2px 6px rgba(0,0,0,.1)' }} />
    </div>
  );
}

function WebCenterStage({ mode, top, second, onSwipe, count }) {
  if (!top) return null;
  const Card = mode === 'Jobs' ? VariantA_Job : VariantA_Person;
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontFamily: 'Geist Mono, ui-monospace, monospace', fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: 'rgba(26,23,21,.5)' }}>
            {mode === 'Jobs' ? 'Job search mode' : 'Network mode'}
          </div>
          <div style={{ marginTop: 6, fontSize: 26, fontWeight: 600, letterSpacing: -0.6, lineHeight: 1.05 }}>
            {mode === 'Jobs' ? 'Curated roles' : 'Curated people'}
          </div>
        </div>
        <div style={{
          padding: '8px 14px', borderRadius: 12, fontSize: 13,
          background: '#fff', border: '1px solid rgba(26,23,21,.08)', color: '#1a1715',
          fontFamily: 'Geist Mono, ui-monospace, monospace', letterSpacing: 0.5,
        }}>{String(count).padStart(2,'0')} LEFT</div>
      </div>

      <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {second && (
          <div style={{ position: 'absolute', transform: 'scale(.95) translateY(12px)', opacity: 0.5, width: 360, height: 520 }}>
            <Card {...(mode === 'Jobs' ? { job: second } : { person: second })} decision={null} />
          </div>
        )}
        <SwipeCard key={top.id} onSwipe={onSwipe} width={360} height={520}>
          {({ decision }) => <Card {...(mode === 'Jobs' ? { job: top } : { person: top })} decision={decision} />}
        </SwipeCard>
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 18 }}>
        <button onClick={() => onSwipe('pass')} style={{
          flex: 1, height: 52, borderRadius: 14, border: '1px solid rgba(26,23,21,.1)',
          background: '#fff', color: '#1a1715',
          fontFamily: 'inherit', fontSize: 14, cursor: 'pointer',
        }}>Skip</button>
        <button onClick={() => onSwipe('like')} style={{
          flex: 1.5, height: 52, borderRadius: 14, border: 'none',
          background: '#1a1715', color: '#fbfaf6',
          fontFamily: 'inherit', fontSize: 14, fontWeight: 500, cursor: 'pointer',
        }}>{mode === 'Jobs' ? 'Apply' : 'Reach out'}</button>
      </div>
    </div>
  );
}

function WebPreview({ mode, subject }) {
  if (!subject) return null;
  if (mode === 'Jobs') {
    return (
      <div style={{
        background: '#fff', borderRadius: 24, padding: 28,
        border: '1px solid rgba(26,23,21,.05)',
        boxShadow: '0 1px 0 rgba(0,0,0,.02), 0 10px 30px -10px rgba(40,30,20,.06)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: 'Geist Mono, ui-monospace, monospace', fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: 'rgba(26,23,21,.5)' }}>
            Role preview
          </div>
          <div style={{ fontFamily: 'Geist Mono, ui-monospace, monospace', fontSize: 10, letterSpacing: 1.2, color: 'rgba(26,23,21,.5)', textAlign: 'right', textTransform: 'uppercase' }}>
            {subject.location.split(',')[0]}<br/>{subject.location.split(',').slice(1).join(',').trim() || subject.mode}
          </div>
        </div>

        <div style={{ marginTop: 14, fontSize: 28, fontWeight: 600, letterSpacing: -0.7, lineHeight: 1.05, textWrap: 'pretty' }}>
          {subject.role}
        </div>
        <div style={{ marginTop: 6, fontSize: 13.5, color: 'rgba(26,23,21,.65)' }}>{subject.company}</div>

        <div style={{ marginTop: 18, fontSize: 14, lineHeight: 1.55, color: 'rgba(26,23,21,.7)' }}>
          {subject.pitch} {subject.why}
        </div>

        <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Statlet k="Experience" v={subject.years.replace('+ years','')} suf=" years" />
          <Statlet k="Comp band" v={subject.comp.split('–')[0].replace(/[^0-9.$€£k]/g,'') || subject.comp} suf="" />
        </div>

        <div style={{ marginTop: 22 }}>
          <div style={{ fontFamily: 'Geist Mono, ui-monospace, monospace', fontSize: 9.5, letterSpacing: 1.4, color: 'rgba(26,23,21,.5)', textTransform: 'uppercase', marginBottom: 10 }}>
            What you will solve
          </div>
          {subject.solve.map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, padding: '5px 0', fontSize: 13, color: '#1a1715', lineHeight: 1.4 }}>
              <span style={{ fontFamily: 'Geist Mono, ui-monospace, monospace', color: 'rgba(26,23,21,.4)' }}>0{i+1}</span>{s}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 22 }}>
          <div style={{ fontFamily: 'Geist Mono, ui-monospace, monospace', fontSize: 9.5, letterSpacing: 1.4, color: 'rgba(26,23,21,.5)', textTransform: 'uppercase', marginBottom: 10 }}>
            Why it is high-signal
          </div>
          <div style={{ fontSize: 13, color: '#1a1715' }}>{subject.why}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: '#fff', borderRadius: 24, padding: 28,
      border: '1px solid rgba(26,23,21,.05)',
      boxShadow: '0 1px 0 rgba(0,0,0,.02), 0 10px 30px -10px rgba(40,30,20,.06)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: 'Geist Mono, ui-monospace, monospace', fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: 'rgba(26,23,21,.5)' }}>
          Person preview
        </div>
        <div style={{ fontFamily: 'Geist Mono, ui-monospace, monospace', fontSize: 10, letterSpacing: 1.2, color: 'rgba(26,23,21,.5)' }}>
          AGE {subject.age}
        </div>
      </div>

      <div style={{ marginTop: 18, display: 'flex', gap: 14, alignItems: 'center' }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: subject.swatch, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, fontWeight: 600,
        }}>{subject.initials}</div>
        <div>
          <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: -0.5, lineHeight: 1.05 }}>{subject.name}</div>
          <div style={{ marginTop: 4, fontFamily: 'Geist Mono, ui-monospace, monospace', fontSize: 11, color: 'rgba(26,23,21,.55)' }}>
            SEEKING {subject.looking.toUpperCase()}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 18, fontSize: 14, lineHeight: 1.55, color: '#1a1715', padding: '14px 0 18px',
        borderTop: '1px solid rgba(26,23,21,.08)', borderBottom: '1px solid rgba(26,23,21,.08)' }}>
        "{subject.why}"
      </div>

      <div style={{ marginTop: 18 }}>
        <div style={{ fontFamily: 'Geist Mono, ui-monospace, monospace', fontSize: 9.5, letterSpacing: 1.4, color: 'rgba(26,23,21,.5)', textTransform: 'uppercase', marginBottom: 10 }}>
          Common ground
        </div>
        {subject.overlap.map((o, i) => (
          <div key={i} style={{ fontSize: 13, color: '#1a1715', padding: '4px 0', display: 'flex', gap: 10 }}>
            <span style={{ color: 'rgba(26,23,21,.4)' }}>·</span>{o}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 18 }}>
        <div style={{ fontFamily: 'Geist Mono, ui-monospace, monospace', fontSize: 9.5, letterSpacing: 1.4, color: 'rgba(26,23,21,.5)', textTransform: 'uppercase', marginBottom: 10 }}>
          Tags
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {subject.tags.map((t) => (
            <div key={t} style={{
              padding: '5px 9px', fontSize: 11.5,
              border: '1px solid rgba(26,23,21,.12)', borderRadius: 999,
              color: 'rgba(26,23,21,.75)',
            }}>{t}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Statlet({ k, v, suf }) {
  return (
    <div style={{
      padding: '14px 14px', borderRadius: 14,
      background: '#fbfaf6', border: '1px solid rgba(26,23,21,.06)',
    }}>
      <div style={{ fontFamily: 'Geist Mono, ui-monospace, monospace', fontSize: 9.5, letterSpacing: 1.2, color: 'rgba(26,23,21,.5)', textTransform: 'uppercase' }}>{k}</div>
      <div style={{ marginTop: 6, fontSize: 26, fontWeight: 500, letterSpacing: -0.8, color: '#1a1715' }}>
        {v}<span style={{ fontSize: 12, color: 'rgba(26,23,21,.5)', marginLeft: 4 }}>{suf}</span>
      </div>
    </div>
  );
}

Object.assign(window, { WebDashboard, WebShell, WebHeader });
