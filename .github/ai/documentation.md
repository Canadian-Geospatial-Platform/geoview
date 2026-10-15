# Documentation ownership and AI summaries

## Choosing the owner

- AI-only execution, routing, approval, and reporting procedures belong in `.github/instructions/`,
  `.github/ai/`, `.github/agents/`, or `.github/skills/`, not public documentation.
- Guidance useful to developers/users, including shared architecture, conventions, behavior, and
  examples, belongs in public documentation. AI files link to its specific section.
- Write public guidance for human readers: use descriptive headings, coherent explanations, and
  consistent numbering/navigation. Do not paste agent imperatives into a public guide unchanged.
- When moving material, preserve unique knowledge, remove the old detailed copy, and update all
  incoming links and named-section references. Keep short safeguards only where necessary.

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

DocUpdate includes these checks in the selected audit scope, reports drift with both locations,
and applies related public/reference edits together after approval. Explicit read-only requests
report proposed changes without editing. Report anything not checked as pending.

The markers identify summaries; they do not automatically enforce semantic synchronization.
Run `npm run ai:check` from `packages/` and targeted Markdown formatting checks after edits.
