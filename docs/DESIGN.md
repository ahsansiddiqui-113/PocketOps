# ClearLedger — Product & UI Design

## Positioning
A calm, confident money tool. Competitors look like banks (cold) or spreadsheets (dull). ClearLedger should feel
like a **precision instrument you can touch**: tactile, dimensional, quick. The 3D language is *a ledger made
physical* — money split into solid, weighted blocks.

## Design principles
1. **Clarity first.** 3D is seasoning, never in the way of the numbers. Calculators stay flat, fast and legible.
2. **Depth = meaning.** Height encodes amount. Needs / wants / savings / debt are four colored blocks everywhere.
3. **Touchable.** Hover/tilt/parallax respond to the pointer; nothing moves without a reason.
4. **Fast and fair.** 3D is lazy-loaded, only on the home hero, paused offscreen, skipped for reduced-motion and
   low-power devices. No layout shift (fixed-height canvas box) — required for AdSense CLS.

## Visual system
| Token | Light | Dark | Use |
|---|---|---|---|
| Ink | #14181c | #eef1ec | text |
| Paper | #f6f5f0 | #0d100e | background |
| Emerald (primary) | #0f6b4f | #3ecf9b | actions, savings |
| Needs | #3b6fd8 | #6c9bff | bucket: need |
| Wants | #d9822b | #ffb35c | bucket: want |
| Savings | #0f6b4f | #3ecf9b | bucket: saving |
| Debt | #c2414b | #ff7a85 | bucket: debt |

Type: system UI stack, tight tracking on headings (-0.03em), tabular numerals for all money.
Shape: 14px radius cards, 1px hairline borders, soft layered shadows. Glass header (blur) over the page.

## 3D concept — "The Block Ledger"
Hero scene: four rounded blocks (need/want/saving/debt) of different heights standing on a faint grid plane,
a slowly orbiting coin ring above them. Pointer parallax tilts the whole group; blocks gently "breathe".
Colors come from the bucket tokens so the scene matches the calculators.
- Library: three + @react-three/fiber (no heavy helpers).
- Canvas height fixed (360px desktop / 260px mobile); DPR capped at 1.75.
- Loaded with `next/dynamic({ ssr: false })` after the hero text paints; static gradient fallback underneath.
- `frameloop="demand"` is not used (continuous), but animation pauses via IntersectionObserver when offscreen.
- Skipped entirely when `prefers-reduced-motion` or `navigator.connection.saveData`.
- Not used on /tools/*, /blog/* or /dashboard/* (ad pages and work pages stay light).

## Interaction components
- **TiltCard**: CSS 3D perspective tilt toward the pointer with a moving glare; disabled for touch and reduced motion.
- **Bucket bars** in the Budget Splitter: a small isometric block stack that grows with the inputs (CSS only).

## Page map (unchanged routes)
Home: hero (copy + 3D scene + two CTAs) → three tilt tool cards → how-it-works strip → latest guides → pricing teaser.
Tools: flat, focused, ad slot below results. Dashboard: flat, no ads, no 3D.

## Accessibility & performance budget
- Canvas is `aria-hidden`; all information also in text. Contrast ≥ 4.5:1 in both themes.
- 3D chunk loaded lazily; target < 150 KB gzip added to home only.
- No autoplay motion under `prefers-reduced-motion`.
