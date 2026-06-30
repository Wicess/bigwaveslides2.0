---
name: polish
description: Apply premium visual + interaction polish to the changed UI — spacing/alignment rhythm, responsive behaviour (mobile-first, no horizontal scroll), smooth motion, hover/active/focus states, empty/loading states, and accessibility. Use after building or editing any UI to take it from "works" to "feels expensive". Reviews the working diff and applies fixes.
---

# Polish

Take the changed UI from functional to **top-tier product quality**. Review the
working diff (`git diff`) for touched components/pages, then *apply* fixes
directly (don't just report). Quality bar: a paid, professional SaaS product.

## Checklist (apply what's relevant)

**Layout & rhythm**
- Consistent spacing scale (no random px); align to a 4px grid.
- Optical alignment of icons to text; consistent card padding.
- Content fills the available width on large screens — no dead empty space and
  no content squeezed into a narrow column. Cap ultrawide with a sane max-width.
- Fixed shells: sidebars/headers stay put; only content scrolls. Never let
  `overflow-hidden` on an ancestor silently break `position: sticky`.

**Responsive (mobile-first, this is non-negotiable)**
- Test every breakpoint mentally: 360 / 768 / 1024 / 1440+.
- No horizontal scroll/jiggle (watch translateX reveals — clip at section level).
- Tables → rich stacked cards on mobile; long action sets → dropdown menus.
- Tap targets ≥ 40px; readable type ≥ 14px on mobile.

**Motion (smooth, purposeful, never janky)**
- Animate only `transform` / `opacity` (compositor-friendly).
- Enter animations stagger (rise/fade) with easing `cubic-bezier(.22,1,.36,1)`.
- Hover lift + transitions on interactive cards; respect `prefers-reduced-motion`.

**States**
- Every list has a designed empty state (icon + message + CTA).
- Loading/skeletons where data fetches; disabled/pending on buttons.
- Hover, active, and focus-visible styles on everything clickable.

**Accessibility**
- Semantic elements; `<ul>` contains only `<li>`; headings in order.
- Labels/aria on inputs and icon-only buttons; visible focus rings.
- Sufficient contrast (WCAG AA).

**Consistency**
- Reuse the project's tokens/primitives (colors, radii, shadows, shared
  components) — never one-off hex values or bespoke spacing.

## Process
1. `git diff --name-only` to find touched UI files; read them.
2. Apply fixes in place, matching existing conventions/idioms.
3. Run typecheck + lint on changed files; keep the build green.
4. Summarize what you polished, grouped by the categories above.
