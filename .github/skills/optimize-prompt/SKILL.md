---
name: optimize-prompt
description: "Use when explicitly asked to review a prompt, make a prompt more concise, or optimize a prompt for token efficiency. Preserve requirements and flag ambiguity; never remove useful constraints just to reduce length."
argument-hint: "Paste the prompt and say whether you want a review or a rewritten version"
---

# Prompt Review and Optimization

Use this skill only when the user asks to review or optimize a prompt. Do not rewrite unrelated user messages or proactively optimize ordinary requests.

## Procedure

1. Identify the prompt's goal, audience, required context, constraints, expected output, and acceptance criteria.
2. Find repetition, filler, irrelevant context, and instructions that can be combined without changing intent.
3. Preserve meaningful constraints, examples, terminology, safety requirements, and acceptance criteria. Do not claim a token-savings percentage without measuring both versions with the same tokenizer.
4. If the user asks only to **review** the prompt, return a compact assessment of the main opportunities and any ambiguity. Do not reproduce the full prompt unless asked to show or rewrite it.
5. If the user asks to **optimize, shorten, or rewrite** the prompt, return the revised prompt, preserving its intent and useful detail. Add a brief note only if a material assumption or unresolved ambiguity needs attention.
6. Keep the response proportional to the request. A displayed rewrite consumes output tokens; do not include the original prompt or a line-by-line diff unless requested.
