# Troubleshooting & Service-Specific Fixes

Known issues and fixes for specific service types. Document non-obvious errors here so the team doesn't re-investigate.

---

## How to Use This Document

Each entry has four parts: **Problem** → **Root Cause** → **Fix** → **Takeaways**.

<details>
<summary><strong>Template for New Entries</strong> (click to expand)</summary>

### [Short Title]

> [GitHub Issue #XXXX](https://github.com/Canadian-Geospatial-Platform/geoview/issues/XXXX)

**Problem:** What happens / error message.

**Root Cause:** Why it happens.

**Fix:** What was changed and where.

**Takeaways:**

- Reusable lessons.

</details>

---

## GeoTIFF

### Embedded Color Map / Palette Rendering

> [GitHub Issue #3166](https://github.com/Canadian-Geospatial-Platform/geoview/issues/3166)

**Problem:** GeoTIFF layers with embedded color palettes (e.g., land cover classification) render as a solid black square, show opaque black outside the data extent, and display color fringes at pixel boundaries when zoomed in.

**Root Cause:**

| Symptom               | Cause                                                                                               |
| --------------------- | --------------------------------------------------------------------------------------------------- |
| Solid black           | OL normalizes pixel values to `0–1`, so raw value `10` becomes `0.039` → palette index `0` (black). |
| Opaque outside pixels | Palette index `0` (nodata) has no transparency.                                                     |
| Color fringes         | Bilinear interpolation blends adjacent palette indices, producing unrelated colors.                 |

**Fix:**

1. Extract color map before layer creation — `extractGeotiffColorMap()` in `onProcessLayerMetadata()`, stored on `layerConfig.embeddedColorMap`.
2. `normalize: false` on the source so `['band', 1]` returns raw integers.
3. `interpolate: false` (nearest-neighbor) to prevent blending between class indices.
4. Palette index `0` → `rgba(0,0,0,0)` for transparent nodata.
5. Convert tuples to CSS `rgba()` strings — OL palette expressions expect color strings, not number arrays.

Files: `geotiff.ts` (`createGeoTIFFSource`, `onProcessLayerMetadata`), `gv-geotiff.ts` (`#applyColorMapStyle`), `geotiff-layer-entry-config.ts` (`embeddedColorMap`), `utilities.ts` (`extractGeotiffColorMap`).

**Takeaways:**

- Never replace an OL source at runtime if events are already bound — configure it correctly from the start.
- Use `normalize: false` when pixel values have semantic meaning (indices, classes).
- Use `interpolate: false` for categorical rasters; bilinear is only for continuous data.

---

## WMS

### Inherited TIME Dimension Breaks GetFeatureInfo

> [GitHub Issue #3234](https://github.com/Canadian-Geospatial-Platform/geoview/issues/3234)

**Problem:** `GetFeatureInfo` fails with `LayerNotDefined` when `TIME` is included for child layers that inherit a time dimension from a parent group but don't actually support it (e.g., `dsm-hillshade` under `elevation-hrdem-mosaic`). Removing `TIME` makes the request succeed.

**Root Cause:** WMS child layers inherit `<Dimension>` from parent groups per spec. But derived layers (hillshade, slope, RGB composites) are mosaics — the server doesn't support temporal slicing for them. GeoView sees time on the ancestor and appends `TIME`, which the server rejects.

**Fix:** Fixed at the **service level** — time dimensions were removed from layers that don't support them.

Recommended client-side approach for robustness:

- Treat a layer as time-enabled only if it has its **own** `<Extent>` or discrete time values (not just an inherited `<Dimension>`).
- **Fallback**: if `GetFeatureInfo` fails with `TIME`, retry without it. If retry succeeds, mark the layer as non-time-enabled.

**Takeaways:**

- WMS dimension inheritance is unreliable — inherited `<Dimension>` doesn't guarantee the child supports that dimension.
- Derived/mosaic layers (hillshade, slope, aspect) typically don't support temporal queries.
- Validate time support per-layer, not per-service.

---
