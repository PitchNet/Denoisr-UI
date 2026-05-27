// SwipeCard — real drag-to-swipe primitive used across all card variants.
// Children receive a "decision" prop (null | 'pass' | 'like' | 'boost')
// derived from drag state so the visual can show overlays.

function SwipeCard({
  children, onSwipe, width = 340, height = 540,
  enabled = true, threshold = 80, restingRotate = 0, idx = 0,
}) {
  const ref = React.useRef(null);
  const [drag, setDrag] = React.useState({ x: 0, y: 0, active: false, exit: null });

  // Decision threshold for in-progress overlay
  const decision = (() => {
    if (drag.exit) return drag.exit;
    if (!drag.active) return null;
    if (drag.y < -threshold && Math.abs(drag.y) > Math.abs(drag.x)) return 'boost';
    if (drag.x > threshold) return 'like';
    if (drag.x < -threshold) return 'pass';
    return null;
  })();

  React.useEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;
    let startX = 0, startY = 0, active = false, pid = null;

    const down = (e) => {
      if (e.target.closest('[data-no-drag]')) return;
      active = true; pid = e.pointerId;
      startX = e.clientX; startY = e.clientY;
      el.setPointerCapture(pid);
      setDrag({ x: 0, y: 0, active: true, exit: null });
    };
    const move = (e) => {
      if (!active) return;
      setDrag({ x: e.clientX - startX, y: e.clientY - startY, active: true, exit: null });
    };
    const up = (e) => {
      if (!active) return;
      active = false;
      try { el.releasePointerCapture(pid); } catch {}
      const dx = e.clientX - startX, dy = e.clientY - startY;
      let exit = null;
      if (dy < -threshold && Math.abs(dy) > Math.abs(dx)) exit = 'boost';
      else if (dx > threshold) exit = 'like';
      else if (dx < -threshold) exit = 'pass';
      if (exit) {
        setDrag({ x: dx, y: dy, active: false, exit });
        setTimeout(() => { onSwipe && onSwipe(exit); setDrag({ x: 0, y: 0, active: false, exit: null }); }, 260);
      } else {
        setDrag({ x: 0, y: 0, active: false, exit: null });
      }
    };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    return () => {
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
    };
  }, [enabled, threshold, onSwipe]);

  // Compute transform
  let tx = drag.x, ty = drag.y, rot = restingRotate + drag.x * 0.05;
  if (drag.exit === 'pass') { tx = -window.innerWidth * 0.8; rot = -25; }
  if (drag.exit === 'like') { tx = window.innerWidth * 0.8; rot = 25; }
  if (drag.exit === 'boost') { ty = -window.innerHeight * 0.8; rot = 0; }
  const transition = drag.active ? 'none' : 'transform .26s cubic-bezier(.2,.7,.25,1)';

  return (
    <div ref={ref} style={{
      width, height, position: 'relative',
      transform: `translate(${tx}px, ${ty}px) rotate(${rot}deg)`,
      transition,
      touchAction: 'none',
      cursor: enabled ? (drag.active ? 'grabbing' : 'grab') : 'default',
      userSelect: 'none',
    }}>
      {typeof children === 'function' ? children({ decision, drag }) : children}
    </div>
  );
}

// Decision-stamp overlay used by variant A. Shape varies but the same
// "show on threshold" semantics so it can sit on any card.
function SwipeStamp({ decision, palette = 'a' }) {
  if (!decision) return null;
  const colors = {
    a: { pass: '#c44a39', like: '#2c8a55', boost: '#1a1715' },
    b: { pass: '#a8442d', like: '#3b6d3f', boost: '#1f1c17' },
    c: { pass: '#ff6a55', like: 'oklch(0.86 0.18 105)', boost: '#f0ece4' },
  }[palette];
  const txt = { pass: 'SKIP', like: 'LIKE', boost: 'BOOST' }[decision];
  const rot = { pass: -14, like: 14, boost: -3 }[decision];
  return (
    <div style={{
      position: 'absolute', top: 36,
      left: decision === 'like' ? 'auto' : 28,
      right: decision === 'like' ? 28 : 'auto',
      padding: '6px 16px',
      border: `2.5px solid ${colors[decision]}`, color: colors[decision],
      borderRadius: 6, transform: `rotate(${rot}deg)`,
      fontFamily: 'Geist Mono, ui-monospace, monospace',
      fontSize: 18, fontWeight: 700, letterSpacing: 2,
      pointerEvents: 'none', zIndex: 5,
    }}>{txt}</div>
  );
}

Object.assign(window, { SwipeCard, SwipeStamp });
