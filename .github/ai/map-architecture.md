# Map, geo and OpenLayers runtime

Owner: MapGeoExpert. Public documentation is canonical.

Read only the linked section of each doc: search for its heading and read to the next heading of the same level; expand only if needed (`AGENTS.md` → Reading linked docs).

| Topic                                                                     | Canonical section                                                                                                                                                                          |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Initialization and typed map events                                       | [MapViewer events](../../docs/programming/event-helper.md#mapviewer-events)                                                                                                                |
| Viewer/map DOM distinction, static/dynamic, crosshair/keyboard            | [Keyboard navigation](../../docs/app/accessibility.md#keyboard-navigation-mode)                                                                                                            |
| Fixed collapsed viewer sizing and info bar                                | [MapController runtime](../../docs/programming/controller-architecture.md#mapcontroller)                                                                                                   |
| North-pole coordinate order, rotated pixel containment, hidden transforms | [MapController runtime](../../docs/programming/controller-architecture.md#mapcontroller)                                                                                                   |
| Effective scale/visibility                                                | [Layer runtime invariants](../../docs/programming/adding-layer-types.md#runtime-invariants)                                                                                                |
| Config view shape and plugin loading                                      | [View settings](../../docs/app/config/configuration-reference.md#viewsettings-required), [Package loading](../../docs/app/config/configuration-reference.md#package-configuration-methods) |
| Controller/store synchronization                                          | [Store access](../../docs/programming/using-store.md#store-access-patterns)                                                                                                                |
| Awaitable test zoom versus immediate MapViewer call                       | [Test zoom gotcha](../../docs/app/testing/test-templates.md#controllers-vs-mapviewer-for-zoom)                                                                                             |

## Source navigation and guardrails

- Register init/ready listeners before `cgpv.init`; init can fire before layer loading finishes.
- Trace sizing through Shell → `useMapResize`, not just OL canvas dimensions.
- `NORTH_POLE_POSITION_LONLAT` uniquely stores lat/lon: swap at projection boundaries.
- Use pixel-space direction/containment; do not replace it with singular geographic bearings.
- MapViewer/OL access stays in controllers/plugin lifecycle, never rendered React components.

For Swiper render clipping and drag isolation, follow [package-specific runtime routing](packages.md#swiper-runtime).
