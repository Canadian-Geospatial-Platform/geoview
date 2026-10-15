# Layers: tiers, proxy, opacity, visibility, filters, scale, time

Public documentation is canonical.

Read only the linked section of each doc: search for its heading and read to the next heading of the same level; expand only if needed (`AGENTS.md` → Reading linked docs).

| Topic                                                                                        | Canonical section                                                                                                                                                                                                                  |
| -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Config/runtime tiers and layer creation                                                      | [Layer architecture](../../docs/programming/adding-layer-types.md#architecture), [Pipeline](../../docs/programming/adding-layer-types.md#layer-creation-pipeline)                                                                  |
| Layer sets                                                                                   | [Layer-set architecture](../../docs/programming/layerset-architecture.md#overview)                                                                                                                                                 |
| Display names, groups, proxy, opacity, visibility, scale, partial success, GeoPackage fields | [Runtime invariants](../../docs/programming/adding-layer-types.md#runtime-invariants)                                                                                                                                              |
| Repeated WMS names and path-aware resolution (#3521)                                         | [WMS duplicate names](../../docs/programming/troubleshooting.md#duplicate-names-in-nested-groups)                                                                                                                                  |
| Style/time/config/table AND filters                                                          | [Filter sources](../../docs/programming/layer-filters.md#overview)                                                                                                                                                                 |
| Simple geometry visibility limitation, item identity                                         | [Style-based filters](../../docs/programming/layer-filters.md#filter-source-1-class-filter-style-based)                                                                                                                            |
| Batched filter updates                                                                       | [Batch synchronization](../../docs/programming/layer-filters.md#batch-operations-and-filter-synchronization)                                                                                                                       |
| Time ranges, handle count, service-specific filters                                          | [Range types](../../docs/programming/time-dimension.md#range-types), [Handle modes](../../docs/programming/time-dimension.md#slider-handle-modes), [Filter generation](../../docs/programming/time-dimension.md#filter-generation) |
| VCS time overlay                                                                             | [Plugin overrides](../../docs/programming/time-dimension.md#plugin-config-override), [GeoCore resolution](../../docs/app/config/configuration-reference.md#error-handling)                                                         |
| Raster defaults                                                                              | [Raster sources](../../docs/app/config/configuration-reference.md#raster-sources-wms-esri-image-xyz)                                                                                                                               |

## Enforcement reminders

- Both layer tiers are required; display names use `getLayerNameCascade`; groups specify entryType.
- Proxy is per-instance; group opacity changes affect siblings and restore needs all groups/leaves.
- Effective visibility includes parents; range checks use the current resolution API, not old zoom-only calls.
- Full-path WMS lookup must preserve duplicate segments and cycle protection without breaking ordinary service lookup.
- GeoPackage inference is separate: source-only GeoJSON/CSV fixes do not cover its blank columns.

## Source navigation

- GeoPackage: `api/config/reader/geopackage-reader.ts` → WKB `setProperties` → table `memoColumns`.
  Inspect both inference and consumers; explicitly nest the table entry for deterministic test paths.
- WMS: `ogc-wms.ts` metadata-path helpers; `add-layer-utils.ts` path lookup; tree walkers and ordered paths.
- Opacity: `abstract-base-layer.ts` cap, `GVGroupLayer` cascade/addLayer reapplication, LayerController snapshot.
- Panel presentation of hidden layers belongs to controller/store and UI logic, not the layer domain:
  see [controller/store routing](controllers-store.md#source-navigation) and [UI routing](ui-style-a11y-i18n.md#source-navigation-and-translation-workflow). Runtime visibility rules remain in the linked runtime invariants.
- Scale: `MapViewer.computeEffectiveLayerScales` → `LayerController.updateLayerInVisibleRange` →
  `AbstractBaseGVLayer.isInVisibleRange(currentResolution)`; inspect signatures before copying old recipes.
- Time: DateMgt OGC parser, ESRI normalization, TimeSliderController filter generation and registration.

### Scale Limits & Visibility Range

Routing alias retained for MapGeoExpert: read [runtime invariants](../../docs/programming/adding-layer-types.md#runtime-invariants).
The current source's buffer is 0.11; UI/query gates use OL resolution limits, not the obsolete
three-argument `isInVisibleRange` recipe.
