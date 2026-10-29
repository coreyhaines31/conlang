import {Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {BORDER, FOREGROUND, MONO, MUTED, PRIMARY} from './OgVideo';

// The editor's Generate Words card for a new Elvish-preset language: Generate is pressed, five words arrive
// one by one and the counter climbs, then the list clears and the counter swaps back to 0, so the loop has no seam.
// The words are real output of src/lib/generator.ts (Elvish preset, seed 7).
const WORDS = ['suvo', 'iraef', 'wadhar', 'awind', 'saerai'];
const ROW = 46;

const STANDARD = Easing.bezier(0.4, 0, 0.2, 1);
const IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);
const OUT_EASE = Easing.bezier(0, 0, 0.2, 1);

export const GenerateCard = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const ease = (input: number[], output: number[], easing: (n: number) => number) =>
    interpolate(t, input, output, {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing});

  // 0.45–0.75s press · 0.8–2.55s words arrive · hold to 4.6s · 4.6–5.15s list clears · 5.0–5.36s count swaps back to 0
  const press = ease([0.45, 0.6], [0, 1], STANDARD) - ease([0.6, 0.8], [0, 1], STANDARD);
  const arrive = WORDS.map((_, i) => ease([0.8 + 0.3 * i, 1.25 + 0.3 * i], [0, 1], OUT_EASE));
  // The count ticks quickly as each word settles, then holds, so a digit is always fully on screen between ticks.
  const count = WORDS.reduce((sum, _, i) => sum + ease([1.0 + 0.3 * i, 1.16 + 0.3 * i], [0, 1], STANDARD), 0);
  // On reset the 5 swaps straight to 0 instead of counting down.
  const countOut = ease([5.0, 5.18], [0, 1], STANDARD);
  const zeroIn = ease([5.14, 5.36], [0, 1], OUT_EASE);
  const listOpacity = 1 - ease([4.6, 5.15], [0, 1], IN_OUT);

  return (
    <div
      style={{width: '100%', height: '100%', boxSizing: 'border-box', padding: '28px 30px', borderRadius: 14, background: '#fcfcfc',
        boxShadow: `0 0 0 1px ${BORDER}, 0 1px 3px rgba(0,0,0,0.06), 0 12px 32px rgba(32,32,32,0.08)`}}
    >
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div style={{fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em'}}>Veyran</div>
        <div style={{fontSize: 18, fontWeight: 500, color: '#582d1d', background: '#ffdfb5', borderRadius: 8, padding: '5px 12px'}}>Elvish</div>
      </div>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 22}}>
        <div>
          {/* Each digit crossfades with a small rise as the fractional count passes it; neighbours never overlap. */}
          <div style={{position: 'relative', height: 60, fontSize: 58, fontWeight: 700, lineHeight: '60px', letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums'}}>
            {[0, 1, 2, 3, 4, 5].map((n) => (
              <div
                key={n}
                style={{position: 'absolute', left: 0, top: 0, opacity: Math.max(0, 1 - Math.abs(count - n) * 2.2) * (1 - countOut),
                  transform: `translateY(${(n - count) * 24 - countOut * 8}px)`}}
              >
                {n}
              </div>
            ))}
            <div style={{position: 'absolute', left: 0, top: 0, opacity: zeroIn, transform: `translateY(${(1 - zeroIn) * 8}px)`}}>0</div>
          </div>
          <div style={{fontSize: 19, color: MUTED, marginTop: 2}}>Words Generated</div>
        </div>
        <div
          style={{display: 'flex', alignItems: 'center', gap: 10, height: 50, padding: '0 20px', borderRadius: 10, background: PRIMARY, color: '#fff',
            fontSize: 21, fontWeight: 500, transform: `scale(${1 - 0.05 * press})`, filter: `brightness(${1 - 0.12 * press})`}}
        >
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M9.94 14.06 4.5 19.5M14 3l1.4 3.6L19 8l-3.6 1.4L14 13l-1.4-3.6L9 8l3.6-1.4z" />
            <path d="M20 14v4M18 16h4M5 3v3M3.5 4.5h3" />
          </svg>
          Generate
        </div>
      </div>
      <div style={{marginTop: 22, borderRadius: 10, boxShadow: `inset 0 0 0 1px ${BORDER}`, height: WORDS.length * ROW, overflow: 'hidden', background: '#fff'}}>
        {WORDS.map((w, i) => (
          <div
            key={w}
            style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: ROW, padding: '0 18px', boxSizing: 'border-box',
              borderTop: i ? `1px solid ${BORDER}` : 'none', fontFamily: MONO, opacity: arrive[i] * listOpacity, transform: `translateY(${(1 - arrive[i]) * 10}px)`}}
          >
            <span style={{fontSize: 20, color: MUTED}}>/{w}/</span>
            <span style={{fontSize: 24, fontWeight: 600, color: FOREGROUND}}>{w}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
