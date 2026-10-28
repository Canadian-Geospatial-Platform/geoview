---
name: add-component
description: "Use when asked to create a new React component following GeoView conventions. Invoke with /add-component."
---

Component: use the user's request (if missing, ask: Name, folder and purpose)

Read `.github/ai/typescript-react.md`, `.github/ai/ui-style-a11y-i18n.md`, `.github/ai/jsdoc-logging.md`. Create the component (named export, explicit return types, `logTraceRender`, JSDoc, handlers in `// #region Handlers`), a companion `*-style.ts` with `getSxClasses`, imports from direct `@/ui/...` modules (not the `@/ui` barrel), state via `useStore*` hooks and mutations via controllers (never `MapViewer`), translated labels in `en` and `fr`.

For larger work, delegate to the `UIA11yReviewer` custom agent.
