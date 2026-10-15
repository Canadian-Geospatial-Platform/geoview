# Documentation ownership and AI summaries

## Choosing the owner

- AI-only execution, routing, approval, and reporting procedures belong in `.github/instructions/`,
  `.github/ai/`, `.github/agents/`, or `.github/skills/`, not public documentation.
- Guidance useful to developers/users, including shared architecture, conventions, behavior, and
  examples, belongs in public documentation. AI files link to its specific section.
- Separate the behavioral contract from implementation maintenance. Viewer guides explain what
  users can do in one sentence or a few lines; public developer docs explain stable concepts,
  responsibilities, and supported extension/API patterns. Neither needs an internal repair checklist.
- Keep source-specific implementation references in the owning `.github/ai/` topic: selector
  combinations, effect dependencies, ref lifecycles, exceptional branches, and regression traps.
  These notes can help human maintainers too; technical detail alone does not require a public
  advanced-concepts section. Publish deeper developer guidance only when it serves a real developer
  task, with explanation rather than copied agent imperatives.
- Write public guidance for human readers: use descriptive headings, coherent explanations, and
  consistent numbering/navigation. Do not paste agent imperatives into a public guide unchanged.
- When moving material, preserve unique knowledge, remove the old detailed copy, and update all
  incoming links and named-section references. Keep short safeguards only where necessary.

## Linking behavior and implementation

Keep one owner for each kind of information, not two complete copies of the topic.

- An AI implementation section links back to the public behavioral contract and to the relevant
  source files or source-navigation entry points. Code remains the authority for internal mechanics.
- A public developer section links to the implementation reference when useful for maintainers.
  Use a repository-hosted URL for `.github/` files, which are not published on the documentation site;
  use relative links from AI files back to public Markdown. Do not add internal maintenance links
  to the viewer guides unless users need them.
- When behavior or implementation changes, inspect both ends and affected EN/FR guide text.
  Update the contract, implementation notes, and links together where affected; remove obsolete
  notes rather than retaining historical workarounds as current requirements.
- Implementation references are not `AI-SUMMARY` blocks: they add maintenance knowledge, rather
  than repeat a public section. Use the summary convention below only for an actual condensation.

## Optional AI summaries

Prefer heading-targeted, bounded reads. Create a summary only when the relevant public section is
still too large for recurring AI tasks; do not summarize every document or create a parallel manual.
Keep the summary in the owning `.github/ai/` reference and link to its canonical public section.

Use paired HTML comment markers with a relative source path and heading anchor:

```markdown
<!-- AI-SUMMARY: source=../../docs/programming/example.md#specific-section -->

Canonical source: [Specific section](../../docs/programming/example.md#specific-section).

Brief operational summary; detailed explanations and examples remain in the source.
<!-- /AI-SUMMARY -->
```

Paths are relative to the file containing the summary. The example above is illustrative, not an
existing document. Each block has one canonical source and a normal clickable link to it. Include
essential conditions, exceptions, and limitations; a shorter summary must not change the rule.
Do not add AI-specific markers to a public section merely to provide a human-friendly introduction.

## Synchronizing documentation

When a public section changes, search AI references for its path, heading, and summary source marker.
Review affected links, named headings, and summaries. When a summary changes, read its source section
and verify every claim, including exceptions. Use current source code to resolve stale public
guidance before synchronizing the summary; never treat the summary as a second authority.

Also follow behavior/implementation cross-links in both directions, even without summary markers.
Check that internal notes still match current source, the public contract, and any guide text;
report stale mechanics, orphaned references, and contradictions with both affected locations.

DocUpdate includes these checks in the selected audit scope, reports drift with both locations,
and applies related public/reference edits together after approval. Explicit read-only requests
report proposed changes without editing. Report anything not checked as pending.

The markers identify summaries; they do not automatically enforce semantic synchronization.
Run `npm run ai:check` from `packages/` and targeted Markdown formatting checks after edits.
