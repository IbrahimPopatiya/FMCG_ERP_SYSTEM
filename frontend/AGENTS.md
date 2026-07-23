<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## UI/UX Quality Bar — This Is Not Optional

This product will be judged on how it looks and feels, not just whether it works. Every screen you build must look like it came from a professional product team — not a functional-but-plain internal tool. Treat this section as a hard requirement on every frontend task, not a nice-to-have.

### The standard
- Build screens that look **designed**, not assembled. If a screen looks like a default HTML form with Tailwind utility classes slapped on with no thought to hierarchy, spacing, or rhythm, it is not done — redo it.
- Reference `../UI_UX_REQUIREMENTS.md` for the product's intended feel (simple, clean, professional, mobile-first) before building any screen. Every screen should read as part of one coherent design system, not a one-off.
- Compare your own output against what a senior product designer would ship. If you wouldn't be proud to demo it, it isn't finished.

### No shortcuts
- Do not ship a screen just because it "technically works." A form that renders but has cramped spacing, inconsistent alignment, or an ugly default button is not acceptable — finish the visual pass before calling the task done.
- Don't copy-paste raw HTML elements with ad-hoc classes when a shared primitive already exists in `components/ui/` — and don't skip building a shared primitive when the same pattern repeats, just to move faster.
- Never leave default browser styling on interactive elements (buttons, inputs, selects, checkboxes) — every element the user touches should be intentionally styled.

### Concretely, get these right on every screen
- **Spacing & layout**: consistent padding/margin scale (no arbitrary one-off pixel values), clear visual grouping of related fields/actions, generous whitespace — don't cram content edge-to-edge.
- **Typography**: a clear type scale (distinct sizes/weights for page titles, section headers, body text, captions/labels) — not everything at the same size and weight.
- **Color**: use the palette deliberately (primary action color, neutral grays, semantic red/green for errors/success) — no arbitrary one-off colors, no clashing or low-contrast text.
- **Navigation & flow**: the fastest, most obvious path through a task is the one the UI presents. Primary actions are visually primary; destructive/secondary actions are visually secondary. No dead ends, no unnecessary steps or clicks.
- **Responsiveness**: every screen genuinely works at mobile and desktop widths per `../UI_UX_REQUIREMENTS.md` — not "shrinks without breaking," but deliberately adapted (e.g. dashboard simplified on mobile, full on desktop).
- **States**: design loading, empty, and error states with the same care as the happy path — a bare spinner or a raw error string is a shortcut, not a finished screen.
- **Performance feel**: fast perceived interactions — optimistic UI where sensible, skeleton/loading states instead of blank screens, no janky layout shifts.
