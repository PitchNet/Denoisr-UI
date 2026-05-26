// Three visual variants of the Denoisr swipe card.
// All share the SwipeCard drag primitive; each renders its own visual.

// ────────────────────────────────────────────────────────────
// VARIANT A — Editorial Mono (matches the web screenshot)
// Soft pastel-washed off-white, charcoal sans, mono small-caps eyebrows.
// ────────────────────────────────────────────────────────────
function VariantA_Job({ job, decision }) {
  return (
    <div style={{
      width: '100%', height: '100%',
      background: '#fbfaf6',
      borderRadius: 22,
      boxShadow: '0 1px 0 rgba(0,0,0,.04), 0 20px 50px -20px rgba(40,30,20,.18), 0 0 0 1px rgba(20,20,20,.04)',
      padding: 26, boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'Geist, system-ui, sans-serif',
      color: '#1a1715', position: 'relative', overflow: 'hidden',
    }}>
      {/* corner washes */}
      <div style={{ position: 'absolute', top: -60, right: -60, width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(255,210,225,.6), transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -80, left: -60, width: 240, height: 240, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(220,210,255,.5), transparent 70%)', pointerEvents: 'none' }} />

      <SwipeStamp decision={decision} palette="a" />

      {/* eyebrow */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
        <div style={{ fontFamily: 'Geist Mono, ui-monospace, monospace', fontSize: 10.5, letterSpacing: 1.4, color: 'rgba(26,23,21,.55)', textTransform: 'uppercase' }}>
          {job.company}
        </div>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: job.swatch, color: '#fff', fontSize: 12, fontWeight: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Geist Mono, ui-monospace, monospace', letterSpacing: 0.5,
        }}>{job.initials}</div>
      </div>

      {/* role */}
      <div style={{ marginTop: 22, fontSize: 30, lineHeight: 1.05, fontWeight: 600, letterSpacing: -0.8, textWrap: 'pretty' }}>
        {job.role}
      </div>
      <div style={{ marginTop: 10, fontSize: 14.5, lineHeight: 1.45, color: 'rgba(26,23,21,.66)' }}>
        {job.pitch}
      </div>

      {/* metadata pills */}
      <div style={{ display: 'flex', gap: 6, marginTop: 18, flexWrap: 'wrap', position: 'relative' }}>
        {[job.location, job.years, job.comp].map((t, i) => (
          <div key={i} style={{
            padding: '6px 10px', borderRadius: 999,
            border: '1px solid rgba(26,23,21,.14)', fontSize: 11.5,
            color: 'rgba(26,23,21,.78)',
          }}>{t}</div>
        ))}
      </div>

      {/* what you'd solve */}
      <div style={{ marginTop: 22, position: 'relative' }}>
        <div style={{ fontFamily: 'Geist Mono, ui-monospace, monospace', fontSize: 10, letterSpacing: 1.4, color: 'rgba(26,23,21,.45)', textTransform: 'uppercase', marginBottom: 8 }}>
          What you would solve
        </div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 7 }}>
          {job.solve.map((s, i) => (
            <li key={i} style={{ display: 'flex', gap: 10, fontSize: 13.5, lineHeight: 1.35, color: '#2a2520' }}>
              <span style={{ fontFamily: 'Geist Mono, ui-monospace, monospace', color: 'rgba(26,23,21,.4)' }}>0{i+1}</span>
              <span>{s}</span>
            </li>
          ))}
        </ul>
      </div>

      <div style={{ flex: 1 }} />

      {/* tag row */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', position: 'relative' }}>
        {job.tags.map((t) => (
          <div key={t} style={{
            padding: '5px 9px', fontSize: 11,
            background: '#1a1715', color: '#fbfaf6',
            fontFamily: 'Geist Mono, ui-monospace, monospace', letterSpacing: 0.4,
          }}>{t}</div>
        ))}
      </div>
    </div>
  );
}

function VariantA_Person({ person, decision }) {
  return (
    <div style={{
      width: '100%', height: '100%',
      background: '#fbfaf6', borderRadius: 22,
      boxShadow: '0 1px 0 rgba(0,0,0,.04), 0 20px 50px -20px rgba(40,30,20,.18), 0 0 0 1px rgba(20,20,20,.04)',
      padding: 26, boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'Geist, system-ui, sans-serif',
      color: '#1a1715', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(220,255,225,.7), transparent 70%)', pointerEvents: 'none' }} />
      <SwipeStamp decision={decision} palette="a" />

      <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
        <div style={{ fontFamily: 'Geist Mono, ui-monospace, monospace', fontSize: 10.5, letterSpacing: 1.4, color: 'rgba(26,23,21,.55)', textTransform: 'uppercase' }}>
          Looking for · {person.looking}
        </div>
        <div style={{ fontFamily: 'Geist Mono, ui-monospace, monospace', fontSize: 10.5, color: 'rgba(26,23,21,.45)' }}>
          {person.age}
        </div>
      </div>

      {/* avatar */}
      <div style={{
        marginTop: 18, width: 86, height: 86, borderRadius: '50%',
        background: person.swatch, color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 30, fontWeight: 600, letterSpacing: -1,
        position: 'relative',
        boxShadow: '0 8px 20px -8px rgba(0,0,0,.25)',
      }}>{person.initials}</div>

      <div style={{ marginTop: 16, fontSize: 28, fontWeight: 600, letterSpacing: -0.7, lineHeight: 1.05 }}>
        {person.name}
      </div>
      <div style={{ marginTop: 6, fontSize: 13.5, color: 'rgba(26,23,21,.66)', lineHeight: 1.4 }}>
        {person.headline}
      </div>
      <div style={{ marginTop: 4, fontFamily: 'Geist Mono, ui-monospace, monospace', fontSize: 11, color: 'rgba(26,23,21,.5)' }}>
        {person.location}
      </div>

      <div style={{
        marginTop: 18, padding: '14px 14px',
        borderLeft: '2px solid #1a1715',
        fontSize: 13.5, lineHeight: 1.5, color: '#2a2520',
        background: 'rgba(255,255,255,.4)',
      }}>"{person.why}"</div>

      <div style={{ marginTop: 16 }}>
        <div style={{ fontFamily: 'Geist Mono, ui-monospace, monospace', fontSize: 10, letterSpacing: 1.4, color: 'rgba(26,23,21,.45)', textTransform: 'uppercase', marginBottom: 8 }}>
          You overlap on
        </div>
        {person.overlap.map((o, i) => (
          <div key={i} style={{ fontSize: 12.5, color: '#2a2520', display: 'flex', gap: 8, alignItems: 'baseline', padding: '4px 0' }}>
            <span style={{ color: '#1a1715' }}>·</span>{o}
          </div>
        ))}
      </div>

      <div style={{ flex: 1 }} />
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {person.tags.map((t) => (
          <div key={t} style={{ padding: '5px 9px', fontSize: 11, background: '#1a1715', color: '#fbfaf6', fontFamily: 'Geist Mono, ui-monospace, monospace', letterSpacing: 0.4 }}>{t}</div>
        ))}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// VARIANT B — Paper & Ink
// Warm cream, serif headlines, magazine brief.
// ────────────────────────────────────────────────────────────
function VariantB_Job({ job, decision }) {
  return (
    <div style={{
      width: '100%', height: '100%',
      background: '#f6efe2',
      borderRadius: 4, padding: 26, boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'Geist, system-ui, sans-serif',
      color: '#1f1c17', position: 'relative', overflow: 'hidden',
      boxShadow: '0 24px 56px -24px rgba(60,40,20,.3), 0 0 0 1px rgba(60,40,20,.08)',
    }}>
      {/* paper texture line */}
      <div style={{ position: 'absolute', top: 18, left: 26, right: 26, height: 1, background: 'rgba(31,28,23,.15)' }} />
      <SwipeStamp decision={decision} palette="b" />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: 2 }}>
        <div style={{ fontFamily: 'Geist Mono, ui-monospace, monospace', fontSize: 10, letterSpacing: 1.6, textTransform: 'uppercase', color: 'rgba(31,28,23,.6)' }}>
          Brief №&nbsp;{job.id.replace('j','')}
        </div>
        <div style={{ fontFamily: 'Geist Mono, ui-monospace, monospace', fontSize: 10, letterSpacing: 1.6, color: 'rgba(31,28,23,.6)' }}>
          {job.mode.toUpperCase()}
        </div>
      </div>

      <div style={{ marginTop: 24, fontFamily: '"Instrument Serif", Georgia, serif', fontWeight: 400, fontSize: 38, lineHeight: 0.95, letterSpacing: -0.5, textWrap: 'pretty' }}>
        {job.role}
      </div>
      <div style={{ marginTop: 16, fontSize: 14, lineHeight: 1.55, color: '#3a342b', maxWidth: '94%' }}>
        {job.pitch}
      </div>

      {/* meta grid */}
      <div style={{ marginTop: 22, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 18px',
        paddingTop: 14, borderTop: '1px solid rgba(31,28,23,.18)',
      }}>
        {[['Company', job.company], ['Comp', job.comp], ['Where', job.location.split(',')[0]], ['Exp', job.years]].map(([k, v]) => (
          <div key={k}>
            <div style={{ fontFamily: 'Geist Mono, ui-monospace, monospace', fontSize: 9.5, letterSpacing: 1.4, textTransform: 'uppercase', color: 'rgba(31,28,23,.5)' }}>{k}</div>
            <div style={{ marginTop: 4, fontSize: 14, color: '#1f1c17' }}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 22, fontFamily: '"Instrument Serif", Georgia, serif', fontStyle: 'italic', fontSize: 16, lineHeight: 1.45, color: '#3a342b' }}>
        “{job.why}”
      </div>

      <div style={{ flex: 1 }} />

      <div style={{ display: 'flex', gap: 14, paddingTop: 14, borderTop: '1px solid rgba(31,28,23,.18)' }}>
        {job.tags.map((t, i) => (
          <React.Fragment key={t}>
            {i > 0 && <div style={{ color: 'rgba(31,28,23,.3)' }}>·</div>}
            <div style={{ fontSize: 12, textDecoration: 'underline', textDecorationColor: 'rgba(31,28,23,.35)', textUnderlineOffset: 4 }}>{t}</div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function VariantB_Person({ person, decision }) {
  return (
    <div style={{
      width: '100%', height: '100%',
      background: '#f6efe2', borderRadius: 4, padding: 26, boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'Geist, system-ui, sans-serif',
      color: '#1f1c17', position: 'relative', overflow: 'hidden',
      boxShadow: '0 24px 56px -24px rgba(60,40,20,.3), 0 0 0 1px rgba(60,40,20,.08)',
    }}>
      <SwipeStamp decision={decision} palette="b" />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div style={{ fontFamily: 'Geist Mono, ui-monospace, monospace', fontSize: 10, letterSpacing: 1.6, textTransform: 'uppercase', color: 'rgba(31,28,23,.6)' }}>
          Person №&nbsp;{person.id.replace('p','')}
        </div>
        <div style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontStyle: 'italic', fontSize: 14, color: 'rgba(31,28,23,.65)' }}>
          seeks {person.looking.toLowerCase()}
        </div>
      </div>

      <div style={{ marginTop: 22, display: 'flex', alignItems: 'flex-end', gap: 16 }}>
        <div style={{
          width: 78, height: 78, borderRadius: 0,
          background: person.swatch, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: '"Instrument Serif", Georgia, serif',
          fontSize: 34, fontWeight: 400, letterSpacing: -1,
        }}>{person.initials}</div>
        <div style={{ paddingBottom: 4 }}>
          <div style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontSize: 32, fontWeight: 400, lineHeight: 1, letterSpacing: -0.6 }}>
            {person.name}
          </div>
          <div style={{ marginTop: 6, fontSize: 12, color: 'rgba(31,28,23,.6)' }}>{person.age} · {person.location}</div>
        </div>
      </div>

      <div style={{ marginTop: 20, fontSize: 14, lineHeight: 1.5, color: '#3a342b' }}>
        {person.headline}
      </div>

      <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(31,28,23,.18)',
        fontFamily: '"Instrument Serif", Georgia, serif', fontStyle: 'italic', fontSize: 17, lineHeight: 1.4, color: '#1f1c17' }}>
        “{person.why}”
      </div>

      <div style={{ marginTop: 18 }}>
        <div style={{ fontFamily: 'Geist Mono, ui-monospace, monospace', fontSize: 9.5, letterSpacing: 1.4, textTransform: 'uppercase', color: 'rgba(31,28,23,.5)', marginBottom: 8 }}>
          You share
        </div>
        {person.overlap.map((o, i) => (
          <div key={i} style={{ fontSize: 13, color: '#1f1c17', padding: '3px 0', display: 'flex', gap: 10 }}>
            <span style={{ fontFamily: 'Geist Mono, ui-monospace, monospace', color: 'rgba(31,28,23,.4)' }}>—</span>{o}
          </div>
        ))}
      </div>

      <div style={{ flex: 1 }} />
      <div style={{ display: 'flex', gap: 14, paddingTop: 14, borderTop: '1px solid rgba(31,28,23,.18)' }}>
        {person.tags.map((t, i) => (
          <React.Fragment key={t}>
            {i > 0 && <div style={{ color: 'rgba(31,28,23,.3)' }}>·</div>}
            <div style={{ fontSize: 12, textDecoration: 'underline', textDecorationColor: 'rgba(31,28,23,.35)', textUnderlineOffset: 4 }}>{t}</div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// VARIANT C — Dark Studio
// Near-black, single electric accent, mono numerals.
// ────────────────────────────────────────────────────────────
function VariantC_Job({ job, decision }) {
  const accent = 'oklch(0.86 0.18 105)';
  return (
    <div style={{
      width: '100%', height: '100%',
      background: '#141413', borderRadius: 18, padding: 26, boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'Geist, system-ui, sans-serif',
      color: '#f0ece4', position: 'relative', overflow: 'hidden',
      boxShadow: '0 30px 60px -20px rgba(0,0,0,.6), 0 0 0 1px rgba(255,255,255,.06)',
    }}>
      <SwipeStamp decision={decision} palette="c" />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 6, background: accent, color: '#0a0a09',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Geist Mono, ui-monospace, monospace', fontSize: 12, fontWeight: 700,
          }}>{job.initials}</div>
          <div style={{ fontSize: 13, color: '#f0ece4' }}>{job.company}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'Geist Mono, ui-monospace, monospace', fontSize: 10, color: '#6e6a62', letterSpacing: 1 }}>
          <div style={{ width: 6, height: 6, borderRadius: 3, background: accent }} />
          ACTIVELY HIRING
        </div>
      </div>

      <div style={{ marginTop: 28, fontSize: 32, lineHeight: 1.02, fontWeight: 500, letterSpacing: -0.9, color: '#f8f5ee' }}>
        {job.role}
      </div>
      <div style={{ marginTop: 12, fontSize: 14, lineHeight: 1.5, color: '#a8a39a' }}>
        {job.pitch}
      </div>

      {/* big stat row */}
      <div style={{ marginTop: 22, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0,
        border: '1px solid rgba(240,236,228,.1)' }}>
        {[['Comp', job.comp], ['Exp', job.years.replace('+', '+')]].map(([k, v], i) => (
          <div key={k} style={{
            padding: '14px 14px', borderLeft: i ? '1px solid rgba(240,236,228,.1)' : 'none',
          }}>
            <div style={{ fontFamily: 'Geist Mono, ui-monospace, monospace', fontSize: 9.5, letterSpacing: 1.4, color: '#6e6a62', textTransform: 'uppercase' }}>{k}</div>
            <div style={{ marginTop: 4, fontFamily: 'Geist Mono, ui-monospace, monospace', fontSize: 18, color: accent }}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 18 }}>
        <div style={{ fontFamily: 'Geist Mono, ui-monospace, monospace', fontSize: 9.5, letterSpacing: 1.4, color: '#6e6a62', textTransform: 'uppercase', marginBottom: 10 }}>
          Scope
        </div>
        {job.solve.slice(0, 3).map((s, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, padding: '5px 0', fontSize: 13, color: '#d8d3c8', lineHeight: 1.4 }}>
            <span style={{ fontFamily: 'Geist Mono, ui-monospace, monospace', color: accent, fontSize: 11 }}>→</span>{s}
          </div>
        ))}
      </div>

      <div style={{ flex: 1 }} />

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', paddingTop: 12 }}>
        {job.tags.map((t) => (
          <div key={t} style={{
            padding: '4px 9px', fontSize: 10.5, fontFamily: 'Geist Mono, ui-monospace, monospace',
            border: '1px solid rgba(240,236,228,.15)', color: '#a8a39a', borderRadius: 3, letterSpacing: 0.5,
          }}>{t.toUpperCase()}</div>
        ))}
      </div>
    </div>
  );
}

function VariantC_Person({ person, decision }) {
  const accent = 'oklch(0.86 0.18 105)';
  return (
    <div style={{
      width: '100%', height: '100%',
      background: '#141413', borderRadius: 18, padding: 26, boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'Geist, system-ui, sans-serif',
      color: '#f0ece4', position: 'relative', overflow: 'hidden',
      boxShadow: '0 30px 60px -20px rgba(0,0,0,.6), 0 0 0 1px rgba(255,255,255,.06)',
    }}>
      <SwipeStamp decision={decision} palette="c" />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: 'Geist Mono, ui-monospace, monospace', fontSize: 10.5, letterSpacing: 1.4, color: '#6e6a62', textTransform: 'uppercase' }}>
          INTENT — {person.looking}
        </div>
        <div style={{ fontFamily: 'Geist Mono, ui-monospace, monospace', fontSize: 10.5, color: '#6e6a62' }}>
          AGE {person.age}
        </div>
      </div>

      <div style={{ marginTop: 22, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: person.swatch, color: '#0a0a09',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, fontWeight: 600, letterSpacing: -0.5,
        }}>{person.initials}</div>
        <div>
          <div style={{ fontSize: 24, fontWeight: 500, letterSpacing: -0.5, lineHeight: 1.05, color: '#f8f5ee' }}>{person.name}</div>
          <div style={{ marginTop: 4, fontSize: 12, color: '#a8a39a' }}>{person.headline}</div>
        </div>
      </div>

      <div style={{ marginTop: 18, padding: '14px 14px', background: '#1c1c1a', borderLeft: `2px solid ${accent}`,
        fontSize: 13.5, color: '#d8d3c8', lineHeight: 1.5 }}>
        "{person.why}"
      </div>

      <div style={{ marginTop: 18 }}>
        <div style={{ fontFamily: 'Geist Mono, ui-monospace, monospace', fontSize: 9.5, letterSpacing: 1.4, color: '#6e6a62', textTransform: 'uppercase', marginBottom: 10 }}>
          Common ground
        </div>
        {person.overlap.map((o, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, padding: '5px 0', fontSize: 13, color: '#d8d3c8', lineHeight: 1.4 }}>
            <span style={{ fontFamily: 'Geist Mono, ui-monospace, monospace', color: accent, fontSize: 11 }}>+</span>{o}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 14, fontFamily: 'Geist Mono, ui-monospace, monospace', fontSize: 10.5, color: '#6e6a62', letterSpacing: 0.5 }}>
        {person.location.toUpperCase()}
      </div>

      <div style={{ flex: 1 }} />
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', paddingTop: 12 }}>
        {person.tags.map((t) => (
          <div key={t} style={{
            padding: '4px 9px', fontSize: 10.5, fontFamily: 'Geist Mono, ui-monospace, monospace',
            border: '1px solid rgba(240,236,228,.15)', color: '#a8a39a', borderRadius: 3, letterSpacing: 0.5,
          }}>{t.toUpperCase()}</div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, {
  VariantA_Job, VariantA_Person,
  VariantB_Job, VariantB_Person,
  VariantC_Job, VariantC_Person,
});
