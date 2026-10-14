# Styling, UI library, accessibility, i18n

Public documentation is canonical.

Read only the linked section of each doc: search for its heading and read to the next heading of the same level; expand only if needed (`AGENTS.md` → Reading linked docs).

| Topic                                                                 | Canonical section                                                                                                                                 |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| getSxClasses, memoSxClasses, combining sx, tokens and external themes | [Style modules](../../docs/programming/styling-best-practices.md#1--spacing-themespacing-in-style-modules-no-sx-shorthand)                        |
| Radius tokens and numeric sx multiplier pitfall                       | [Border radius](../../docs/programming/styling-best-practices.md#3--border-radius-named-tokens-on-themeshape)                                     |
| Display theme registration and demo numbering                         | [Theme registration](../../docs/programming/styling-best-practices.md#1--spacing-themespacing-in-style-modules-no-sx-shorthand)                   |
| UI/icon imports                                                       | [Import order](../../docs/programming/best-practices.md#7--how-we-order-the-import-statements)                                                    |
| Keyboard/focus-indicator architecture                                 | [Keyboard navigation](../../docs/app/accessibility.md#keyboard-navigation-mode)                                                                   |
| Semantic controls, labels, toggles, focus and tooltips                | [Accessibility checklist](../../docs/app/accessibility.md#code-review-checklist), [ARIA](../../docs/app/accessibility.md#004-aria-best-practices) |
| Snackbar persistence and no interactive transient actions             | [Notifications](../../docs/programming/notifications.md#the-governing-wcag-rule)                                                                  |
| Typed actionable errors, not error.generic                            | [Generic-error failover](../../docs/programming/notifications.md#the-generic-error-message-last-resort-failover)                                  |

## Enforcement reminders

- Use translated labels and both en/fr keys. Follow canonical ARIA semantics: stable labels with
  `aria-pressed` for button toggles, or checkbox semantics for visibility controls.
- Do not invent focus outlines; reuse theme helpers. `@/ui` custom theme extension reads need `?.`.
- Use `@/ui` components/icons, not direct MUI UI imports. Standard MUI hooks/types are allowed.
- Components take mapId/ControllerRegistry, never MapViewer.
- Preserve WCAG notes and intentional interaction exceptions.

## Source navigation and translation workflow

`ui/index.ts` exports wrappers; `ui/icons/index.ts` maps domain aliases; custom SVGs live in `ui/svg/`.
IconButton requires `aria-label`, uses it as tooltip fallback and adds tooltip/ref/visibility behavior.
Verify wrapper props rather than assuming the MUI interface.

Search `public/locales/{en,fr}/translation.json` before creating keys: namespaces are case-sensitive
(`appbar`, `mapctrl`, `dataTable` differ). Use `t('domain.key')` and i18next `{{name}}` interpolation;
keep key parity and meaningful French text. Do not copy hypothetical translation keys from examples.
The public translation convention is in [component style guidance](../../docs/programming/styling-best-practices.md#1--spacing-themespacing-in-style-modules-no-sx-shorthand).
