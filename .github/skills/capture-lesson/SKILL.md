---
name: capture-lesson
description: 'Use when asked to remember, capture, record or document a lesson learned, gotcha, root cause or new convention in the AI docs. Invoke with /capture-lesson.'
---

Lesson to capture: use the user's request; if it is missing, use the most recent verified finding in this conversation. If there is none, ask: "What did we learn, and which issue/PR or code proves it?"

1. **Verify** — Confirm the lesson against the source in `packages/*/src/` (never `public/builds/`), a fix in this branch, or the user's explicit statement. Don't record guesses; ask if unsure.
2. **Route** — Pick ONE destination (see `AGENTS.md` → Knowledge upkeep):
   - Shared domain rule/pattern or public behavior/API → matching public section in `docs/programming/` or `docs/app/`; link that section from the AI reference instead of copying it
   - AI-only routing/workflow → matching `.github/ai/*.md`
   - Internal implementation-maintenance details → owning `.github/ai/*.md`, linked to the public behavioral contract; follow [documentation.md](../../ai/documentation.md), section **Linking behavior and implementation**, and synchronize affected counterparts
   - Short, stable gotcha (1-3 lines) → `.github/memories/repo/gotchas.md`
   - Must apply on every edit of certain files → brief reminder and canonical section link in `.github/instructions/*.instructions.md` (keep under 400 lines)
3. **Deduplicate** — Search the destination (and the other AI docs) for the topic first. Update or correct the existing entry rather than adding a near-copy; remove anything the lesson proves wrong.
4. **Write** — Put it under the most relevant heading. Make it concise, factual and actionable (rule + why + a ✅/❌ example only if needed). Cite the issue/PR (`#1234`) and link files with relative paths. Never grow `copilot-instructions.md` beyond its index, and keep the file UTF-8.
5. **Check** — From `packages/`, run `npm run ai:check`, which checks links and heading anchors, metadata, size budgets and encoding. Fix any new failure.
6. **Report** — Show the file(s) changed and the exact text added or replaced.
