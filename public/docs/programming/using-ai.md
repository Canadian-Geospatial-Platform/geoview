# Using AI Assistants in GeoView

This guide explains how the GeoView repository is set up for AI coding assistants (GitHub Copilot in VS Code, Copilot CLI and other tools that read `AGENTS.md`). It covers the moving parts — instructions, specialist docs, custom agents, skills and memory — and how to use, extend and debug them.

> **Note:** The AI configuration files live under `.github/` and at the repository root. They are **not** published with the documentation site; open them from the repository.

## Table of Contents

- [Quick Start](#quick-start)
- [Recommended Issue-to-PR Workflow](#recommended-issue-to-pr-workflow)
- [How the Pieces Fit Together](#how-the-pieces-fit-together)
- [Always-Loaded Instructions](#always-loaded-instructions)
- [Scoped Instructions](#scoped-instructions)
- [Specialist Reference Docs](#specialist-reference-docs)
- [Custom Agents](#custom-agents)
- [Interactive Browser UI Checking](#interactive-browser-ui-checking)
- [Skills (Workflows)](#skills-workflows)
- [Drafting PR Descriptions](#drafting-pr-descriptions)
- [Repo Memory](#repo-memory)
- [Knowledge Upkeep](#knowledge-upkeep)
- [Using the Copilot CLI](#using-the-copilot-cli)
- [Adding or Changing AI Customizations](#adding-or-changing-ai-customizations)
- [Health Check](#health-check)
- [Debugging AI Customizations](#debugging-ai-customizations)
- [Tips and Good Practices](#tips-and-good-practices)

## Quick Start

| I want to...                              | Do this                                                                          |
| ----------------------------------------- | -------------------------------------------------------------------------------- |
| Take an issue from draft to PR            | Follow the [Recommended Issue-to-PR Workflow](#recommended-issue-to-pr-workflow) |
| Ask a question or make a small change     | Use the default agent in Copilot Chat; the repo instructions load by themselves  |
| Run a full task (review, tests, issue)    | Pick a **[Workflow]** agent in the agent picker (e.g. `BranchReview`)            |
| Work deep in one area (layers, store, UI) | Pick a **[Specialist]** agent, or let the main agent delegate to it              |
| Follow a repeatable recipe                | Type `/` in chat and run a skill (e.g. `/add-translation`, `/review-branch`)     |
| Save something the AI learned             | Run `/capture-lesson`                                                            |
| Check the AI setup after editing it       | From `packages/`, run `npm run ai:check`                                         |
| See why an instruction/agent did not load | Open **Show Agent Debug Logs** (see [Debugging](#debugging-ai-customizations))   |

## Recommended Issue-to-PR Workflow

> **IMPORTANT:** Each agent has one job. **Do not use `IssueReview` to fix an issue.** It reviews a _finished_ fix, so the fix must exist first and must be written by someone else.

| Step | Use                             | Purpose                                                                                                                                                                                                                   |
| ---- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | **`IssueCreator`** agent        | Draft the issue: root cause, proposed fix, affected files.                                                                                                                                                                |
| 2    | **Default agent**               | Implement the fix. Paste the issue; name a specialist (for example `LayerExpert`) when the area is clear.                                                                                                                 |
| 3    | **`BranchReview`** agent        | Check the branch against GeoView best practices and conventions. Also records the change in the release tracker.                                                                                                          |
| 4    | **`IssueReview`** agent         | Compare the final diff with the issue's proposed fix, capture lessons learned when they differ, and refine the release tracker entry using the issue.                                                                     |
| 5    | **Release tracker** (automatic) | Steps 3 and 4 record the change in [RELEASE-CANDIDATE.md](./release-testing/RELEASE-CANDIDATE.md) for PR and release notes through `/update-release-candidate`. Run the skill yourself only if you skipped those reviews. |

### Why the default agent fixes the issue, not `IssueReview`

- **Independence:** `IssueReview` judges whether the fix matches the issue and what the issue got wrong. If it wrote the fix, it would be reviewing its own work, and the lessons it captures lose their value.
- **It needs a diff:** its workflow starts from the branch diff against `upstream/develop`. Before the fix, there is nothing to compare.

### Tips

- **Run `IssueReview` after `BranchReview`,** so it compares the final code rather than a version that `BranchReview` then changes.
- **Start `IssueReview` in a new chat.** It then judges the fix only from the issue and the diff, without inheriting the reasoning of the chat that wrote the fix.
- **A mismatch is not automatically a bad fix.** When the developer's fix differs from the proposed fix, the issue may have been wrong. That is exactly the lesson `IssueReview` records so future issues improve.
- **Reviews compare against `upstream/develop`** unless you name another base.
- **Need a review without file changes?** Say "read-only". The agents then propose the release tracker entry and documentation updates in their report instead of editing.
- **Running both reviews is safe for the tracker.** `BranchReview` and `IssueReview` use the same skill, which is instructed to update an existing entry for the branch instead of adding a second one. Check the tracker diff before committing.

## How the Pieces Fit Together

```
AGENTS.md                         ← tool-neutral entry point (any AI tool)
.github/
├── copilot-instructions.md       ← always loaded: overview + index of specialist docs
├── instructions/*.instructions.md← auto-loaded when editing files matching `applyTo`
├── ai/*.md                       ← specialist reference docs, read on demand
├── agents/*.agent.md             ← custom agents ([Workflow] and [Specialist])
├── skills/<name>/SKILL.md        ← workflows, auto-picked or run with /name
└── memories/repo/                ← short, stable gotchas
scripts/ai-health-check.cjs       ← validates the setup (npm run ai:check)
.vscode/settings.json             ← shared AI settings (debug logs, search exclusions)
```

The design goal is **targeted context**: keep what is always loaded small, and load detailed rules only when they are relevant. This keeps answers accurate and avoids wasting the model's context window.

### Documentation Ownership: Public Docs First

> **WRITE FOR THE AUDIENCE.** Public docs own user-facing behavior and shared developer concepts; AI references hold internal implementation-maintenance details and agent procedures, not duplicate public explanations.

- Link AI references and scoped instructions to the **specific public section** that owns the topic.
- Keep viewer guides brief and focused on what users can do. Developer docs explain concepts, responsibilities, and supported patterns rather than internal repair checklists.
- AI-only procedures stay in instructions, AI references, agents, or skills; they are not part of public developer/user guides.
- Preserve source-specific maintenance knowledge in the owning AI reference, with a link to its public behavioral contract. Public developer docs can link back through the repository for maintainers; viewer guides need no internal links.
- Keep behavior and implementation references synchronized when either changes; source code is the authority for internal mechanics. Keep short implementation gotchas in repo memory when appropriate.
- Update the canonical section when behavior or conventions change. Optional tagged AI summaries are reserved for unusually large sections and must stay synchronized; they are not a second authority. The agent procedure is maintained in the repository's `.github/ai/documentation.md` (open it in the repository; AI files are not published), not copied into this guide.

### Practical Context Flow

These resources are complementary, not a mandatory chain where each one must be read before the next. For a coding task, use them in this order as needed:

1. **Load the repository guidance available to the AI tool.** `AGENTS.md` is the tool-neutral entry point; `.github/copilot-instructions.md` provides Copilot's project overview and specialist-doc index. Which files load automatically depends on the tool.
2. **Apply matching scoped instructions.** Files in `.github/instructions/` add rules for the source files being edited; they point to deeper references where useful.
3. **Identify the package and owning subsystem.** Use the subsystem index and, when helpful, a matching specialist agent to focus the investigation.
4. **Read the relevant AI reference and public documentation.** `.github/ai/*.md` contains concise agent-focused patterns and lessons. `docs/programming/` and `docs/app/` explain architecture, behavior, and APIs for developers; consult them whenever they help, not only as a last resort. **Read the linked section, not the whole document:** the AI references link to specific headings, and agents read from that heading to the next one, expanding only when the section is not enough. This matters because several linked docs are long; `configuration-reference.md` alone is over 3,600 lines.
5. **Search the code for existing implementations and follow the closest applicable patterns.** Not every task needs every instruction file, agent, or document.

| Piece                     | Loaded when                                 | Size goal        |
| ------------------------- | ------------------------------------------- | ---------------- |
| `copilot-instructions.md` | Every request                               | ≤ 250 lines      |
| `AGENTS.md`               | Every request (tools that support it)       | ≤ 80 lines       |
| Scoped instructions       | Only when a matching file is in context     | ≤ 400 lines each |
| Specialist docs           | Only when an agent reads them for the task  | No hard limit    |
| Skills                    | Only when invoked or matched by description | Short recipes    |

## Always-Loaded Instructions

- **`.github/copilot-instructions.md`** — Project overview, architecture summary, non-negotiable rules and an **index table** pointing to each specialist doc. Keep it an overview; shared detail belongs in public docs, with on-demand routing through `.github/ai/`.
- **`AGENTS.md`** — The tool-neutral equivalent: commands, hard rules, where detailed rules live, delegation policy, knowledge upkeep and debugging notes. Read by Copilot CLI and other agentic tools.

## Scoped Instructions

Files in `.github/instructions/` carry a short rule set and an `applyTo` glob. They load automatically when you work on matching files.

| File                                | Applies to                                 |
| ----------------------------------- | ------------------------------------------ |
| `typescript-react.instructions.md`  | All `packages/**/*.{ts,tsx}`               |
| `jsdoc-logging.instructions.md`     | All `packages/**/*.{ts,tsx}`               |
| `controllers-store.instructions.md` | Controllers, stores, domains, API events   |
| `layers-config.instructions.md`     | Layer classes, config, types, schema files |
| `ui-style-a11y.instructions.md`     | `.tsx`, `*-style.ts`, `ui/`, locales       |
| `test-suite.instructions.md`        | `packages/geoview-test-suite/**`           |

Each file points to its matching specialist doc for the full details.

## Specialist Reference Docs

`.github/ai/*.md` routes agents to canonical public sections and retains focused AI-specific navigation, workflows, and implementation notes without a public counterpart. Agents read these references on demand; the index in `copilot-instructions.md` tells them which one to open.

| Doc                     | Area                                                                                   |
| ----------------------- | -------------------------------------------------------------------------------------- |
| `code-map.md`           | Where things live in the monorepo                                                      |
| `map-architecture.md`   | Map/geo runtime: viewer, projections, rotation, swiper                                 |
| `layers.md`             | Layer tiers, proxy, opacity, visibility, filters, time                                 |
| `config-schema.md`      | Schema, default sources, GeoCore, config order                                         |
| `controllers-store.md`  | Controllers, domains, Zustand store, events                                            |
| `typescript-react.md`   | TypeScript and React conventions                                                       |
| `jsdoc-logging.md`      | JSDoc, comments and logging                                                            |
| `ui-style-a11y-i18n.md` | Styling, UI library, accessibility, translations                                       |
| `test-suite.md`         | Writing `geoview-test-suite` tests                                                     |
| `release-testing.md`    | Manual release-testing plan, sync rules, issue process                                 |
| `build-deploy.md`       | Build, gh-pages, dependency auditing                                                   |
| `packages.md`           | Package schema/defaults, lifecycle, translations, and package-specific runtime routing |

The deeper human-oriented docs in `docs/programming/` (this folder) remain the source for architecture explanations; the AI docs link to them rather than duplicate them.

## Custom Agents

Custom agents live in `.github/agents/` and appear in the Copilot Chat **agent picker**. Each description starts with a role tag so you can see its purpose at a glance:

- **[Workflow]** — Runs a whole task end-to-end and produces a result. Usually picked by a developer.
- **[Specialist]** — Domain expert for one area of the code. Usually called by the main agent as a subagent for a focused task, but you can also chat with it directly.

| Agent                   | Role       | Use it to...                                                                                     |
| ----------------------- | ---------- | ------------------------------------------------------------------------------------------------ |
| `BranchReview`          | Workflow   | Audit changed code and domain/controller/store ownership; say "full" for entire changed files    |
| `TestCreator`           | Workflow   | Create test-suite tests, find missing coverage, maintain release-testing docs                    |
| `DocUpdate`             | Workflow   | Audit named or branch-affected docs; say "guide" for EN/FR viewer guides or "full" for every doc |
| `DepUpdate`             | Workflow   | Audit dependencies and Node.js/Rush/pnpm compatibility, plan upgrades, review vulnerabilities    |
| `IssueCreator`          | Workflow   | Draft a ready-to-paste GitHub issue                                                              |
| `IssueReview`           | Workflow   | Compare a PR branch with its linked issue and capture lessons                                    |
| `LayerExpert`           | Specialist | Layer classes, config validation, GeoCore, WMS/ESRI/OGC metadata                                 |
| `MapGeoExpert`          | Specialist | MapViewer, projections, zoom/rotation, OpenLayers interactions, swiper                           |
| `ControllerStoreExpert` | Specialist | Controllers, domains, store slices, events, batch store sync                                     |
| `GeoViewArchitect`      | Specialist | Cross-package architecture, abstractions, refactoring strategy, API design                       |
| `UIA11yReviewer`        | Specialist | React components, styling, accessibility, translations; "browser" for interactive viewer checks  |
| `CodeExplorer`          | Specialist | Read-only questions: where code lives, how a flow works                                          |

**Delegation policy (summary):** the main agent handles small, known-file work itself and delegates only work that needs separate context, one agent per objective, with a bounded goal. See `AGENTS.md` → Delegation policy.

## Interactive Browser UI Checking

Use `@UIA11yReviewer browser` with the viewer URL or demo page, the interaction to test, and its expected result. Static source review remains the default. Browser mode checks runtime behavior without editing source unless fixes are explicitly requested.

For example:

```text
@UIA11yReviewer browser — check keyboard navigation in the Layers panel
on http://localhost:8080/<page>. Verify focus returns after closing settings.
```

You receive a report of the requested mouse/keyboard interactions, focus behavior, accessible labels,
and relevant visual states, including failures or checks that could not run. Specify languages or
themes when they matter to your scenario. Browser tools must be available in your AI client; these
checks support accessibility review but do not certify WCAG compliance or screen-reader behavior.

## Skills (Workflows)

Skills are reusable recipes in `.github/skills/<name>/SKILL.md`. Copilot picks one automatically when your request matches its description, or you can run it explicitly by typing `/name` in chat. Most skills hand off larger work to the matching custom agent.

| Skill                       | What it does                                                                                |
| --------------------------- | ------------------------------------------------------------------------------------------- |
| `/review-branch`            | Reviews the current branch against GeoView conventions                                      |
| `/add-component`            | Creates a React component following GeoView conventions                                     |
| `/add-translation`          | Adds or changes UI text in both `en` and `fr`                                               |
| `/new-layer`                | Adds a new layer type or layer test end to end                                              |
| `/add-geoview-test`         | Adds a test to `geoview-test-suite` (three-callback pattern, count syncing)                 |
| `/sync-test-counts`         | Audits all suites so `getTestsTotalFinal`, the test catalog and the checklist agree         |
| `/update-defaults`          | Updates config defaults in all three default-value sources                                  |
| `/add-display-theme`        | Adds or renames a display theme across every surface                                        |
| `/capture-lesson`           | Records a verified lesson in the right AI doc or memory                                     |
| `/optimize-prompt`          | Reviews or rewrites prompts for concision while preserving intent and constraints           |
| `/update-release-candidate` | Updates the active release tracker with verified branch/PR changes for PR and release notes |
| `/draft-pr`                 | Drafts a concise branch summary or full PR body using verified changes and the PR template  |

> **Skills vs prompts:** older `.prompt.md` files are not used. The agent-host harness (Copilot CLI) ignores them, so every workflow is a skill. Do not add `.prompt.md` files.

## Drafting PR Descriptions

Use `/draft-pr summary` for a concise description to paste into the PR template's Description section, or `/draft-pr full` for a complete PR body. An unspecified PR description defaults to full mode. This describes implemented changes; use IssueCreator for proposed changes.

For example:

```text
/draft-pr summary — summarize the fixes on this branch.
/draft-pr full — prepare the PR body for issue #1234 against upstream/develop.
```

The draft describes verified branch changes, their motivation, and relevant impact. Full mode follows
the repository template and includes available validation results and outstanding items. The default
comparison base is `upstream/develop`; specify another base or inclusion of uncommitted work when needed.

Drafting is read-only by default: it does not edit files, update the release tracker, publish a PR,
or commit. The result is ready to review and paste, not a certification that the branch is ready to
merge. This skill does not replace BranchReview, DocUpdate, or IssueReview.

## Repo Memory

`.github/memories/repo/gotchas.md` holds short, stable facts (one to three lines each) that are easy to get wrong — for example, path conventions or surprising behaviors. Longer rules go into the matching specialist doc instead.

## Knowledge Upkeep

Every agent is expected to keep the AI docs current. When an agent learns something new **and verified** in its area (a root cause, pitfall, non-obvious pattern or convention), it records it before finishing:

| Kind of lesson                                   | Where it goes                                           |
| ------------------------------------------------ | ------------------------------------------------------- |
| Shared domain rule or pattern                    | Matching public doc; section link from the AI reference |
| AI-only routing or workflow                      | Matching `.github/ai/*.md`                              |
| Internal implementation-maintenance details      | Owning AI reference, cross-linked with public behavior  |
| Short, stable gotcha                             | `.github/memories/repo/gotchas.md`                      |
| Rule that must apply on every edit of some files | Matching `.github/instructions/*.instructions.md`       |
| Public behavior or API devs/users rely on        | `docs/programming/` or `docs/app/`                      |

Lessons must be factual, concise and deduplicated, and should cite the issue or PR. Agents list the docs they changed in their final report. Read-only agents (`CodeExplorer`) propose the update instead of editing. You can trigger the process yourself with `/capture-lesson`.

Review AI doc changes in pull requests like any other change: they shape every future AI answer.

## Using the Copilot CLI

The Copilot CLI (`copilot` command) reads the same files: `AGENTS.md`, `.github/copilot-instructions.md`, scoped instructions, custom agents and skills.

- Start it from the repository root so it picks up the repo configuration.
- Type `/` to list the available commands and skills; use `/agent` to choose a custom agent.
- The CLI ignores `.prompt.md` files, which is why GeoView uses skills only.
- The repo hard rules still apply: use `rush update` (never `npm install` or `npm audit fix`) and run format/lint from `packages/`.

## Adding or Changing AI Customizations

| To add...          | Do this                                                                                                                                                                                             |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A rule for an area | Add shared detail to the matching public doc and link its section from `.github/ai/*.md`; add a brief scoped reminder only if it must apply on every edit                                           |
| A specialist doc   | Create `.github/ai/<topic>.md` and add it to the index table in `copilot-instructions.md`                                                                                                           |
| A custom agent     | Create `.github/agents/<PascalName>.agent.md` (flat, no subfolders) with `name:` equal to the file name and `description: "[Workflow\|Specialist] Use when: ..."`, plus a **Knowledge upkeep** line |
| A skill            | Create `.github/skills/<kebab-name>/SKILL.md` with `name` and `description` frontmatter (start with "Use when ...") and list it in `AGENTS.md`                                                      |
| A gotcha           | Append a short entry to `.github/memories/repo/gotchas.md`                                                                                                                                          |

**Agent naming convention:** names ending in `Expert`, `Explorer` or `Reviewer` are specialists; names ending in `Creator`, `Review` or `Update` are workflows.

**Agent frontmatter options worth knowing:**

```yaml
---
name: MyExpert
description: '[Specialist] Use when: ...'
tools: [read, search, edit]
user-invocable: false # hide from the picker; only the main agent can delegate to it
disable-model-invocation: true # the main agent never delegates to it; developers pick it manually
---
```

Keep `copilot-instructions.md` an overview — never paste detailed rules into it.

## Health Check

`scripts/ai-health-check.cjs` validates the AI setup. Run it from `packages/`:

```bash
npm run ai:check
```

It checks:

- Size budgets for `copilot-instructions.md`, `AGENTS.md`, the scoped instruction files and agent files
- Broken relative links **and heading anchors** in all AI markdown files, so renaming a public heading that an AI file links to fails the check (anchors use GitHub-style heading slugs; links inside code samples are ignored)
- Garbled characters from files re-saved with the wrong encoding
- Agent frontmatter: `name` matches the file name, description starts with `[Workflow]` or `[Specialist]`, and the Knowledge upkeep line is present
- Known agent-name suffixes agree with the declared role (`*Expert`/`*Explorer`/`*Reviewer`/`*Architect` for specialists; `*Creator`/`*Review`/`*Update` for workflows)
- Skill frontmatter: `name` matches the folder (lowercase-hyphenated, at most 64 characters), description starts with "Use when" and is at most 1,024 characters, and the skill is listed in `AGENTS.md` and in this guide's skills table
- Scoped-instruction frontmatter: `description` and `applyTo` are present, and `applyTo` is not `**` (which would load the file on every request). A glob that matches no files is reported as a warning, because that instruction can never load
- Translation key parity between `en` and `fr`

Warnings are printed but do not fail the check.

Run it after editing any AI file and before opening a pull request.

## Debugging AI Customizations

The shared `.vscode/settings.json` enables agent debug logging (`github.copilot.chat.agentDebugLog.fileLogging.enabled` and `chat.agentHost.agentDebugLog.enabled`).

1. If you open the repository through a `.code-workspace` file, VS Code may ignore the folder settings. Add the same two keys to the workspace file's `settings` block (or to your User settings).
2. Reload the window and start a **new** chat session.
3. Run **Developer: Open Agent Debug Logs** (or Chat `...` → **Show Agent Debug Logs**).
4. Check the **Discovery** events to see which instructions, skills and agents were loaded or skipped. The `/troubleshoot` skill can analyze the logs for you.

The shared settings also exclude `packages/geoview-core/public/builds/` (stale bundles) and `common/temp/` from search, so the AI does not read outdated code.

## Tips and Good Practices

- **Review base:** branch and PR comparisons default to `upstream/develop` unless you explicitly request another base. Agents use a merge-base diff, report the base and any refresh limitations, and distinguish committed changes from working-tree changes.

- **Be specific:** name the file, layer type, issue number or expected behavior. Specific requests let the right instructions and agents load.
- **Pick the right agent:** a [Workflow] agent for a whole task, a [Specialist] for deep work in one area, the default agent for everything else.
- **Review everything:** AI output follows the repo conventions but can still be wrong. Build, lint and test as usual (`rush build`, `npm run format`, `npm run fix`).
- **Teach it:** when you correct the AI on something non-obvious, run `/capture-lesson` so the next session knows.
- **Keep secrets out:** never paste credentials or private data into a chat.

## See Also

- [Best Practices](best-practices.md) — Coding standards and conventions
- [Controller Architecture](controller-architecture.md) — Controller and domain design
- [Troubleshooting](troubleshooting.md) — Service-specific fixes and known issues
