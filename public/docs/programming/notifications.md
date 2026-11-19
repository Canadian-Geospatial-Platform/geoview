# Notifications & Snackbar Messages

GeoView communicates transient and persistent feedback to the user through a single per-map class, `Notifications`, that drives **two independent channels**: an ephemeral **snackbar** popup and a persistent **notifications panel**.

> Source: [`packages/geoview-core/src/core/utils/notifications.ts`](https://github.com/Canadian-Geospatial-Platform/geoview/blob/develop/packages/geoview-core/src/core/utils/notifications.ts)

## Where else notifications are documented

This file is the developer-facing architecture reference. Notifications are also covered from other angles:

- [Troubleshooting (user-facing)](../app/ui/troubleshooting.md#notifications--snackbar-messages-for-you) — what a user sees and how to act on messages.
- [WCAG Review Explanations — §011 Notifications Panel](../app/wcag-review-explanations.md#_011-notifications-panel) — accessibility rationale (snackbar auto-hide of 5000 ms, panel as the accessible alternative).
- [Release Testing — 01 Global › Notifications Panel](release-testing/01-global.md#notifications-panel) — manual test steps for message vs. notification behavior.
- [Controller Architecture — UIController](controller-architecture.md) — the `UIController` owns the panel state that notifications write to.

## The two channels

| Channel                 | Persistence                          | Destination                              | Internal emit path                                      |
| ----------------------- | ------------------------------------ | ---------------------------------------- | ------------------------------------------------------- |
| **Notifications panel** | Persistent (bell icon + badge)       | Zustand store, via `UIController`        | `#addNotification()` → `uiController.addNotification()` |
| **Snackbar**            | Transient (auto-hides after 5000 ms) | `onSnackbarOpen` event → the snackbar UI | `#addSnackbarMessage()` → queue → `#emitSnackbarOpen()` |

The snackbar UI lives in [`packages/geoview-core/src/ui/snackbar/snackbar.tsx`](https://github.com/Canadian-Geospatial-Platform/geoview/blob/develop/packages/geoview-core/src/ui/snackbar/snackbar.tsx) and subscribes to the `onSnackbarOpen` event.

## The two public method families

The class exposes two families, reached through `mapViewer.notifications`:

| Family                 | Effect                                     | Methods                                                                                                                             |
| ---------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| **`addNotification*`** | Notifications panel **only** (no snackbar) | `addNotificationMessage`, `addNotificationSuccess`, `addNotificationWarning`, `addNotificationError`                                |
| **`show*`**            | Snackbar **and** panel                     | `showMessage`, `showSuccess`, `showWarning`, `showError`, `showInfoDetailedSnackbar`, plus `showErrorFromError`, `showErrorGeneric` |

Each `show*` internally calls its matching `addNotification*`, so **a snackbar message is always also recorded as a panel notification**. The reverse is not true — an `addNotification*` call adds a panel entry with no snackbar.

```ts
// Snackbar + panel
mapViewer.notifications.showWarning("warning.layer.kmlLayerWarning");

// Panel only (non-urgent)
mapViewer.notifications.addNotificationSuccess("layers.layerReloaded", {
  layerName: "Roads",
});
```

### The governing WCAG rule

Every message displayed in the snackbar **must** also be added to the notifications panel. Snackbar messages are transient and auto-dismiss; the panel provides a persistent, reviewable history for users relying on assistive technology or who look away. Consequences enforced by the API design:

- `show*` always adds both a snackbar and a notification — there is **no opt-out parameter**.
- Use `addNotification*` for non-urgent messages that don't warrant a snackbar.
- **Do not** add interactive elements (buttons, links, actions) to snackbar messages — they auto-dismiss and are not accessible to assistive-technology users.

## Detailed snackbar with a grouped notification

High-frequency progress updates (e.g. a large ESRI Dynamic fetch, or a GeoJSON table export) would otherwise flood the panel with one entry per update and inflate the unread badge. `showInfoDetailedSnackbar()` (reached from a controller via `uiController.addInfoDetailedSnackbar()`) splits the two channels:

- the **snackbar** shows a detailed, live message (with a running count);
- the **panel** gets a separate, generic message that stays a single grouped entry.

```ts
// snackbar: "Downloading GeoJSON for 'Roads'... 300 of 1200 element(s)"
// panel:    "Downloading GeoJSON for 'Roads'..."  (one entry, count not inflated)
uiController.addInfoDetailedSnackbar(
  "dataTable.downloadAsGeoJSONProcessing",
  { count, total, layerName },
  "dataTable.downloadAsGeoJSONProgress",
  { layerName },
);
```

The panel notification is flagged **`groupSingleCount`** on `NotificationDetailsType`: when an identical message already exists, `addStoreAppNotification` keeps the single entry **without** incrementing its `count`, so the unread bell badge (which sums every entry's `count`) is not inflated by hundreds of progress ticks.

> **Info progress only — enforced by the API.** Because the grouped panel entry suppresses the unread-badge increment, this path is reserved for **info-level** progress updates. The method hardcodes the `info` severity (no `type` parameter) and its name carries `Info`, so it **cannot** be used for warnings or errors — those must stay ungrouped via `showWarning`/`showError` (or `addMessage('warning'/'error', …)`) so each one is individually surfaced and counted.

Layer classes reach this path through `emitMessage(messageKey, params, type, notificationMessageKey?, notificationMessageParams?)`: when a separate `notificationMessageKey` is provided **and the message `type` is `info`**, `LayerController.#handleDomainLayerMessage()` routes to `showInfoDetailedSnackbar()` instead of the plain `show*` (e.g. the ESRI Dynamic fetch emits a detailed `layers.fetchProgress` snackbar with a generic `layers.fetchStart` panel entry). A non-info message falls through to the ungrouped `show*` path.

## Message keys and localization

Every method takes a **message key** (i18n key) plus optional interpolation params. The key is resolved via `getLocalizedMessage(displayLanguage, messageKey, params)` against the translation files (e.g. [`public/locales/en/translation.json`](https://github.com/Canadian-Geospatial-Platform/geoview/blob/develop/packages/geoview-core/public/locales/en/translation.json)).

**Raw text is also accepted.** A GeoView key is dot-namespaced with no spaces (e.g. `warning.layer.slowRender`). If the provided value doesn't match that shape, `getLocalizedMessage` treats it as already-final raw text and returns it verbatim — so external/plugin authors who don't know the internal keys can pass literal strings without triggering a misleading missing-key error. Values that _do_ look like a key are still validated, logging `MISSING MESSAGE KEY` when absent so genuine typos surface.

```ts
// Internal: a real key, translated
mapViewer.notifications.showWarning("warning.layer.kmlLayerWarning");

// External/plugin: raw text, shown verbatim, no missing-key error
mapViewer.notifications.addNotificationSuccess(`Layer ${layerId} added`);
```

## Snackbar queue behavior

`#addSnackbarMessage()` maintains a queue:

- The queue holds **at most 5** pending messages; extras are dropped.
- Only the first queued message displays; `displayNextSnackbarMessage()` advances the queue.
- **De-duplication:** repeated per-layer warnings are collapsed into a single generic message —
  - `warning.layer.slowRender` → `warning.layer.slowRenders`
  - `warning.layer.metadataTakingLongTime` → `warning.layer.metadatasTakingLongTime`
- **Progress messages** never stack: high-frequency keys (`layers.fetchProgress`, `dataTable.downloadAsGeoJSONProcessing`) are skipped when one is already queued, so only a single in-progress snackbar shows at a time (the running count refreshes as the queue advances).

## Logging side-effects

**Every notification is logged to the console**, by severity. Because a snackbar never exists without a panel notification, logging is centralized in the private `#addNotification()` choke point that both families funnel through — so `show*` and panel-only `addNotification*` calls are logged exactly once (no double-logging):

| Severity (`type`) | Logger              |
| ----------------- | ------------------- |
| `error`           | `logger.logError`   |
| `warning`         | `logger.logWarning` |
| `info`, `success` | `logger.logInfo`    |

`showErrorFromError()` additionally logs the raw underlying error (for developers) before falling through to the generic message.

## How layer-originated messages flow

Layer classes never call `notifications` directly. They emit a message event that is relayed:

```
GV/GeoView layer.emitMessage(key, params, type)
   → LayerMessageEvent
      → LayerDomain relays as a domain event
         → LayerController.#handleDomainLayerMessage()  (or LayerCreatorController.#handleLayerMessage())
            → notifications.show{Message|Success|Warning|Error}()   // type maps 1:1
```

Because the relay always calls `show*`, **every layer-originated message appears in both the snackbar and the panel**. The `messageType` string (`'info' | 'success' | 'warning' | 'error'`) maps one-to-one to `showMessage` / `showSuccess` / `showWarning` / `showError`.

Example emit site:

```ts
// packages/geoview-core/src/geo/layer/geoview-layers/raster/wms.ts
this.emitMessage(
  "warning.layer.projectionNotValid",
  { layerName, definedCRS },
  "warning",
);
```

## The generic error message (last-resort failover)

The message **"An error happened, contact us or view console for details."** (`error.generic`) is a **last-resort failover**. It is intentionally vague and **misleading for end users** — it tells them nothing actionable and points them at a developer console. **It should almost never be reached.** Every time it is, treat it as a bug and fix the root cause (see below), not as an acceptable outcome.

It is produced by two methods:

- **`showErrorGeneric()`** — emits `error.generic` directly (snackbar + panel).
- **`showErrorFromError(error)`** — if the error is a `GeoViewError`, it shows that error's specific translated `messageKey`; **otherwise** (a plain `Error` or unknown value) it logs the error and falls through to `showErrorGeneric()`.

So the generic message would appear **whenever a non-`GeoViewError` reaches `showErrorFromError`**. The only source caller is `LayerCreatorController.showLayerError()`, the funnel for the entire layer-add pipeline (see the wrapping described in [Net effect](#net-effect) below). It is invoked from:

| Add path                                             | Method           |
| ---------------------------------------------------- | ---------------- |
| `loadListOfGeoviewLayer` (config → layer conversion) | `showLayerError` |
| `addGeoviewLayer`                                    | `showLayerError` |
| `addGeoviewLayerByGeoCoreUUID`                       | `showLayerError` |
| `#addToMap` failure                                  | `showLayerError` |
| `AggregateError` unwrap (recursive)                  | `showLayerError` |

**Net effect:** `showLayerError()` now guarantees a specific, translated message. If the error is already a `GeoViewError`, its own message is shown. If it is an **un-typed `Error`**, `showLayerError()` logs the raw error for developers and wraps it in a `LayerFailedToLoadError` (message `layers.errorNotLoaded` — "An error occurred with the layer 'X'."), so the layer-add pipeline **no longer reaches the generic `error.generic` failover**. The raw error is preserved as the `cause` of the wrapping error.

Vector/raster **source loaders** go one step further and throw a typed `LayerSourceFailedToLoadError` (message `error.layer.sourceNotLoaded`) when the data source itself can't be fetched (unreachable/404) — via the shared `AbstractGeoViewVector.fetchSourceForLayer()` helper (CSV, GeoJSON, KML, OGC Feature, WKB), the GeoPackage and Shapefile readers, and `GVGeoTIFF` — so those failures surface a specific message naming the layer instead of the wrapped generic fallback.

To further improve messages, keep converting thrown errors into more specific `GeoViewError`s at their source (e.g. a network vs. parse vs. metadata failure) so the wrapped `layers.errorNotLoaded` fallback is used less often.

### Rule: never rely on the generic failover

`error.generic` exists only so the app never crashes silently on a truly unexpected error. **It is not an acceptable user-facing message.** With the layer-add funnel now wrapping un-typed errors, `showErrorGeneric()` should effectively never be reached. When you find code that can reach it — or you see it appear at runtime:

1. **Trace the originating error** to where it is thrown.
2. **Throw a typed `GeoViewError`** with a specific, translated `messageKey` (add the key to the translation files if needed), so the user gets an actionable message.
3. If the error comes from a third-party/system source that can't be typed, **map it to a specific message key** at the boundary instead of letting it fall through.

Treat every appearance of the generic message as a bug to be fixed, not a state to be tolerated.

## Message inventory by severity

The tables below list the primary message keys and their emit sites. Keys live in the translation files; call sites are in `packages/geoview-core/src`.

### Info

| Key                                           | Origin                                          |
| --------------------------------------------- | ----------------------------------------------- |
| ESRI download progress (`{processed, total}`) | `geo/layer/gv-layers/raster/gv-esri-dynamic.ts` |

### Success

| Key                    | Origin                                                              |
| ---------------------- | ------------------------------------------------------------------- |
| `layers.layerReloaded` | `core/controllers/layer-creator-controller.ts`                      |
| add-layer success      | `core/components/layers/left-panel/add-new-layer/add-new-layer.tsx` |

### Warning

| Key                                                                | Origin                                                |
| ------------------------------------------------------------------ | ----------------------------------------------------- |
| `warning.layer.slowRender` / `slowRenders`                         | `geo/layer/gv-layers/abstract-gv-layer.ts`            |
| `warning.layer.metadataTakingLongTime` / `metadatasTakingLongTime` | `geo/layer/geoview-layers/abstract-geoview-layers.ts` |
| `warning.layer.vectorTileUnsupportedProjection`                    | `core/controllers/map-controller.ts`                  |
| `warning.layer.kmlLayerWarning`                                    | `core/controllers/layer-controller.ts`                |
| `warning.layer.styleUrlNotApplied`                                 | `geo/layer/geoview-layers/raster/vector-tiles.ts`     |
| `warning.layer.layerCRSNotSupported`                               | `core/controllers/layer-controller.ts`                |
| `warning.layer.projectionNotValid`                                 | `geo/layer/geoview-layers/raster/wms.ts`              |
| `warning.layer.invalidGeometry`                                    | `geo/layer/geoview-layers/vector/esri-feature.ts`     |
| `warning.layer.geometryTooComplexToHighlight`                      | `geo/map/feature-highlight.ts`                        |
| `warning.layer.slowCoordinateInfo`                                 | `core/controllers/map-controller.ts`                  |
| `warning.schema.validationIssues`                                  | `app.tsx`                                             |
| `warning.map.invalidZoomExtent`                                    | `geo/map/map-viewer.ts`                               |
| `warning.layer.basemapTakingLongTime`, `basemapLayerCreationError` | basemap creation                                      |

### Error (snackbar + panel)

| Key                                        | Origin                                                                |
| ------------------------------------------ | --------------------------------------------------------------------- |
| `error.generic`                            | `showErrorGeneric` / `showErrorFromError`                             |
| `error.layer.*` (~16 keys)                 | `GeoViewError` keys via `emitMessage('error')` / `showErrorFromError` |
| `error.layer.notAbleToQuery`               | `geo/layer/gv-layers/raster/gv-esri-dynamic.ts`                       |
| `layers.errorNonreloadableLayer`           | `core/controllers/layer-creator-controller.ts`                        |
| `validation.layer.usedtwice`               | `core/controllers/layer-creator-controller.ts`                        |
| init `GeoViewError` (`gvError.messageKey`) | `app.tsx`                                                             |
| basemap error (`event.error.messageKey`)   | `geo/map/map-viewer.ts`                                               |

### Error (panel only — `addNotificationError`)

| Key                                  | Origin                                         |
| ------------------------------------ | ---------------------------------------------- |
| `validation.changeDisplayLanguage`   | `geo/map/map-viewer.ts`                        |
| `validation.changeDisplayTheme`      | `geo/map/map-viewer.ts`                        |
| `validation.changeDisplayProjection` | `geo/map/map-viewer.ts`                        |
| geochart error                       | `packages/geoview-geochart/src/geochart.tsx`   |
| location (nav bar)                   | `core/components/nav-bar/buttons/location.tsx` |

## Known inconsistencies

These are documented here so contributors are aware; they are candidates for cleanup:

1. **Source-level error typing (incremental)** — the layer-add funnel no longer reaches `error.generic` (it wraps un-typed errors in `LayerFailedToLoadError`, see [Net effect](#net-effect)), but the wrapped fallback message `layers.errorNotLoaded` is still generic-ish. Continue typing errors at their source (network vs. parse vs. metadata) into more specific `GeoViewError`s so users get precise messages.
