# GeoView – Agent Guide (tool-neutral)

Rush monorepo (`packages/`): `geoview-core` (APIs, layers, UI, map) + plugins (`aoi-panel`, `custom-legend`, `drawer`, `geochart`, `swiper`, `time-slider`) + `geoview-test-suite` (in-browser test engine, NOT Jest).

## Commands

- `rush update` (never `npm install`, never `npm audit fix`), `rush build`, `rush serve` (http://localhost:8080)
- From `packages/`: `npm run format`, `npm run lint`, `npm run fix`

## Hard rules

> **PUBLIC DOCS ARE THE SOURCE OF TRUTH:** Shared architecture, coding conventions, behavior, and examples belong in `docs/programming/` or `docs/app/`. All agents and developers must link AI references and scoped instructions to the relevant public sections instead of maintaining duplicate explanations. Keep only brief enforcement reminders and genuinely AI-specific routing/workflows in AI files; preserve unique knowledge before removing a copy.

- Never read `packages/geoview-core/public/builds/` (stale bundles). Source of truth: `packages/geoview-core/src/`.
- Architecture: UI components -> controllers -> Zustand store; domains -> controllers -> store. Components never touch `MapViewer`/`mapViewer.map`; add a controller method instead.
- No `any`, explicit return types everywhere, `undefined` over `null`, template literals, named exports.
- Use `Fetch` (no raw `fetch`), `delay()` (no `setTimeout`), dom-helper wrappers (no `document.getElementById/querySelector`), `logger` (no `console.log`).
- Imports: UI + icons from `@/ui` only. Strings via `t()`; keep `en`/`fr` translation files in sync.
- Never delete TODO/NOTE/FIXME/WCAG comments.

## Before modifying code

1. Identify the package and owning subsystem.
2. Search for existing implementations and patterns before introducing new abstractions.
3. Check the architecture documentation relevant to that subsystem.
4. Ask the user when an unresolved ambiguity would materially change scope, behavior, or design, or when you cannot safely proceed without their preference. Otherwise, resolve questions from the code and docs, make a reasonable assumption when needed, and state it.

## Broad or open-ended requests

- Don't scan or try to understand the whole repository by default. For a broad request without a clear goal, scope, or expected output, ask one focused clarifying question before doing repo-wide exploration.
- If a useful first step is clear, offer a bounded approach, state its limits, and proceed without expanding into unrelated areas.

## Branch and PR comparisons

- Unless the user explicitly specifies another base, compare against `upstream/develop` using a merge-base diff (`git diff upstream/develop...HEAD`; use the reviewed branch or PR head in place of `HEAD` when needed).
- Refresh the base before reviewing when possible (`git fetch upstream develop` for the default). If it cannot be refreshed, report the limitation; if it is unavailable, ask rather than silently substituting local `develop`, `origin/develop`, or the PR's configured base.
- Report the base used and distinguish committed changes from staged, unstaged, and untracked changes.

## Reading linked docs

- Follow a `doc.md#heading` link by searching for that heading, then reading only from it to the next heading of the same or higher level. Without a heading link, search for the topic first and read a bounded range around the matches.
- Expand to neighbouring sections, and to the whole document only as a last resort, when the section does not answer the question; say what you expanded and why. Never read a large doc (e.g. `configuration-reference.md`, 3,600+ lines) end to end by default.

## Where the detailed rules live (loaded on demand)

- Always-on summary + index: `.github/copilot-instructions.md`
- Specialist reference docs (read the one matching the task): `.github/ai/*.md` (controllers-store, map-architecture, layers, config-schema, typescript-react, jsdoc-logging, ui-style-a11y-i18n, test-suite, build-deploy)
- Scoped rules: `.github/instructions/*.instructions.md` (auto-applied by file glob)
- Repo memory (gotchas, architecture map): `.github/memories/repo/`
- Deep docs: `docs/programming/*.md` (terminology, controller-architecture, layerset-architecture, best-practices, using-store, event-helper, time-dimension, layer-filters); human guide to this AI setup: `docs/programming/using-ai.md` (update it when agents/skills change)
- Workflows (skills, auto-picked or run with `/name`): `.github/skills/*/SKILL.md` (review-branch, sync-test-counts, new-layer, add-component, add-translation, update-defaults, add-geoview-test, add-display-theme, capture-lesson, optimize-prompt, update-release-candidate). Do not add `.prompt.md` files: the agent-host harness (Copilot CLI) ignores them.

## Delegation policy

- Do small/known-file work directly. Delegate only work needing separate context.
- Match agent to task (`.github/agents/`). Two roles, shown as a tag at the start of each description in the agent picker:
  - **[Workflow]** — runs a whole task end-to-end, usually picked by a dev: BranchReview (pre-PR audit), TestCreator (test-suite tests + release docs), DocUpdate (docs vs code), DepUpdate (dependencies), IssueCreator / IssueReview (GitHub issues vs PR).
  - **[Specialist]** — domain expert, usually delegated to by the main agent for a focused task: GeoViewArchitect (cross-package architecture and design advice), LayerExpert (layer/config/GeoCore), MapGeoExpert (map/projection/OpenLayers runtime), ControllerStoreExpert (controllers/store/events), UIA11yReviewer (components/style/a11y/i18n), CodeExplorer (read-only Q&A).
- New agent: flat file `.github/agents/<PascalName>.agent.md` (no subfolders), `name:` equal to the file name, `description: "[Workflow|Specialist] Use when: ..."`. Name suffix hints the role: `*Expert`/`*Explorer`/`*Reviewer`/`*Architect` = specialist; `*Creator`/`*Review`/`*Update` = workflow. `npm run ai:check` enforces known suffix-to-role matches.
- Agent tools must match the workflow: grant only tools the body actually uses (no unused `agent`/`web`). An agent that edits files either has `execute` with its allowed validation commands listed in the body, or states that validation is reported as pending for the main agent.
- One agent per objective; never nest or re-run the same objective. Give a bounded goal and stop condition.

## Knowledge upkeep (all agents)

When you learn something new and verified in your area (a root cause, pitfall, non-obvious pattern or convention, confirmed by code, a fix, or the user), record it before finishing — don't wait to be asked:

- Shared domain rule or pattern → the matching public doc, with a section link from the relevant `.github/ai/*.md` reference; AI-only routing/workflow → the AI reference itself.
- Short, stable gotcha → `.github/memories/repo/gotchas.md`.
- Short rule that must apply to every edit of some files → the matching `.github/instructions/*.instructions.md`.
- Public behavior/API that devs or users rely on → `docs/programming/` or `docs/app/` (published).
- Keep it factual, concise and deduplicated (update an existing entry instead of adding a near-copy; cite the issue/PR). Never grow `copilot-instructions.md` beyond its index. Read-only agents propose the update in their answer instead of editing. List any doc you changed in your final report. Devs can trigger this on demand with `/capture-lesson`.

## Debugging AI customizations (VS Code)

- `.vscode/settings.json` enables `github.copilot.chat.agentDebugLog.fileLogging.enabled` and `chat.agentHost.agentDebugLog.enabled`.
- If you open the repo through a `.code-workspace` file, VS Code may ignore those folder settings: add the same two keys to the workspace file's `settings` block (or your User settings).
- Reload the window, start a **new** chat session, then run **Developer: Open Agent Debug Logs** (or Chat `...` > **Show Agent Debug Logs**). **Discovery** events show which instructions, skills, prompts and agents were loaded or skipped; `/troubleshoot` analyzes the logs.
