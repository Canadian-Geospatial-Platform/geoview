# Adding New Layer Types

> ** Audience:** Core developers extending GeoView functionality
>
> **For API Users:** See [GeoView Layers Guide](app/layers/layers.md) for using existing layer types

This guide explains how to add support for new layer types to GeoView.

## Overview

GeoView uses a **two-tier layer system** to separate configuration/metadata processing from runtime map rendering:

1. **GeoView Layer classes** (`AbstractGeoViewLayer`) — Handle metadata fetching, config validation, and layer entry processing. They create GV layer instances as their final step. Located in `packages/geoview-core/src/geo/layer/geoview-layers/`.

2. **GV Layer classes** (`AbstractGVLayer`) — OpenLayers wrapper classes that hold the actual OL layer on the map. The application (controllers, domain, UI) works with GV layers at runtime. Located in `packages/geoview-core/src/geo/layer/gv-layers/`.

### Layer Creation Pipeline

```
Config JSON (TypeGeoviewLayerConfig)
        ↓
LayerCreatorController.createLayerConfigFromType()
        ↓
GeoView Layer (e.g., new EsriDynamic)
   1. onFetchServiceMetadata()
   2. onValidateListOfLayerEntryConfig()
   3. onProcessLayerMetadata()
   4. onProcessOneLayerEntry()
   5. onCreateGVLayer()  ← Creates the GV layer
        ↓
GV Layer (e.g., new GVEsriDynamic) — holds OpenLayers layer
        ↓
LayerDomain.registerGVLayer() — registered for runtime use
```

### GV Layer Categories

GV layers are divided into three categories:

- **Raster** — Image-based layers (`AbstractGVRaster`)
- **Vector** — Geometry-based layers (`AbstractGVVector`)
- **Tile** — Tile-based layers (`AbstractGVTile`)

All categories extend `AbstractGVLayer`, which extends `AbstractBaseGVLayer`.

## Architecture

For display names use `ConfigBaseClass.getLayerNameCascade()` (entry name → GeoView name → root ID → path).
`getLayerName()` is only an own-name check and may be undefined.
Groups require `entryType: 'group'`; without it nested entries are ignored by validation.

### Runtime invariants

**Proxy:** Each `AbstractBaseLayerEntryConfig` owns its proxy; there is no shared mutable static.
`setProxyUrl` snapshots the original data path. Runtime load/feature-info callbacks prepend
`${layerConfig.getProxyUrl()}?` only when `getIsUsingProxy()`.
Source construction uses `getDataAccessPathBeforeProxy()` to avoid applying the proxy twice.
`getProxyUrl` may return undefined; `getIsUsingEsriProxy` / `GeoUtilities.isEsriProxy` recognize
`executeFromProxy` and require double-encoding OGC `LAYERS`.
LayerCreatorController passes service URLs to the GeoView layer, and metadata retry assigns the
proxy actually used to each entry.

**Opacity:** `AbstractBaseGVLayer.onSetOpacity` caps at `Math.min(parentOpacity, requestedOpacity)`.
Boost ancestors top-down before a leaf. `GVGroupLayer.onSetOpacity` cascades to every child,
including siblings of a highlighted leaf. Snapshot the whole map's groups and leaves in a
`Map<string, number>` and restore exact values, rather than repeated multiplication/division.
`getLayersAllLeafs()` excludes intermediate groups; use `getLayersAll()` for snapshots.
`GVGroupLayer.addLayer` sets the parent then calls `setOpacity(getOpacity(), false)` to apply the cap
that OL constructor options bypassed, without construction-time events.

**Visibility:** `getVisible()` is the individual OL flag; `getVisibleIncludingParents()` includes
the ancestor chain. Hiding a parent preserves child flags. Turning a child back on requires
`LayerController.setLayerVisibleIncludingParents`, not just setting its own flag.

**Scale:** `MapViewer.getMapScaleFromZoom` rounds denominators. `computeEffectiveLayerScales`
combines config and zoom-derived limits using maximum maxScale and minimum minScale.
Round effective values; `EFFECTIVE_SCALE_VISIBILITY_BUFFER` (currently 0.11) generates
`round(maxScale * (1 + buffer))` and `round(minScale * (1 - buffer))` tolerance values.
Current LayerController rendering/UI limits use the effective max/min scales converted to OL
min/max resolution, excluding GVGroupLayer (children already carry their limits).
Both UI and feature queries call `isInVisibleRange(currentResolution)`, which checks inclusive OL
resolution bounds. Do not reintroduce zoom-only checks or pass obsolete scale arguments.
The helper's tolerance values are not an additional gate in this current resolution-only path.

**Partial success:** Set `olRootLayer` before checking aggregate errors in `createGeoViewLayers`.
Throw aggregate errors only when there is no root layer; otherwise record per-entry errors and report
through `getLayerLoadErrors` / `showLayerError`.
Validation failures must call `updateLayerStatusParent` themselves because no GV lifecycle hook runs.
Any loading child keeps the parent loading; all-loaded or mixed loaded/error means loaded;
all-error means error. A group with one working child is valid.
Skip error children in toggle-all, treat them as "don't care" in `utilAllChildrenVisible`, and
disable/uncheck their individual checkboxes with grey/italic labels.
`#processListOfLayerEntryConfig` skips error leaves but still processes groups: multiple-entry
recursion returns even empty groups; a single group can therefore retain an empty recursive group.
Do not infer successful child creation merely from a truthy group return.

**GeoPackage fields:** GeoPackageReader converts to WKB and independently infers outfields from the
first feature's properties. Because featureInfo is already populated, AbstractGeoViewVector inference
is skipped; fixing that branch does not fix GeoPackage.
WKB preserves blank property keys, and the reader checks falsy values, not empty keys.
For deterministic table paths specify a nested table entry (`railwaysEmptyField/carto_fer_debarcadere`),
rather than relying on the single-table file ID.
MRT crashes on `{ id: '', accessorFn }`: guard trimmed keys both in vector inference and the
data-table/data-table-modal column consumers. Consumer guards cover GeoPackage too.
Details filters `geoviewID` and blank aliases. A source-only guard is not sufficient.

### GeoView Layer Hierarchy (Config & Metadata Tier)

```
AbstractGeoViewLayer (geoview-layers/)
+-- AbstractGeoViewRaster (geoview-layers/raster/)
|   +-- EsriDynamic, EsriImage, ImageStatic, WMS, GeoTIFF, VectorTiles, WMTS, XYZTiles
+-- AbstractGeoViewVector (geoview-layers/vector/)
    +-- CSV, EsriFeature, GeoJSON, KML, OgcFeature, WFS, WKB
```

### GV Layer Hierarchy (Runtime Tier)

```
AbstractBaseGVLayer
+-- AbstractGVLayer
|   +-- AbstractGVRaster (raster/)
|   |   +-- GVEsriDynamic
|   |   +-- GVEsriImage
|   |   +-- GVImageStatic
|   |   +-- GVWMS
|   +-- AbstractGVVector (vector/)
|   |   +-- GVEsriFeature
|   |   +-- GVCSV
|   |   +-- GVGeoJSON
|   |   +-- GVKML
|   |   +-- GVOgcFeature
|   |   +-- GVWFS
|   |   +-- GVWKB
|   +-- AbstractGVVectorTile (vector/)
|   |   +-- GVVectorTiles
|   +-- AbstractGVTile (tile/)
|       +-- GVGeoTIFF
|       +-- GVWMTS
|       +-- GVXYZTiles
+-- GVGroupLayer
```

> **Note:** `GeoPackage` and `shapefile` are input file formats that are automatically converted to one of the vector types above (typically GeoJSON or WKB) during loading, so they don't have dedicated class implementations.

## Step 1: Determine Layer Category

First, determine if your new layer type is **raster** or **vector** based on the OpenLayers source:

**Raster Sources:**

- `ImageStatic`, `ImageWMS`, `ImageArcGISRest`
- `TileWMS`, `XYZ`, `OSM`
- Extends `ImageSource` or `TileSource`

**Vector Sources:**

- `Vector`, `VectorTile`
- `GeoJSON`, `KML`, `GPX`
- `WKB` (Well-Known Binary)
- `CSV` (with coordinates)
- Extends `VectorSource`

**Note on Vector Tiles:**
`VectorTiles` lives under `gv-layers/vector/` but `AbstractGVVectorTile` extends `AbstractGVLayer` directly (not `AbstractGVVector`).

## Step 2: Create Layer Classes

You need to create **both** classes — one in each tier:

### Locations

**GeoView layer** (config & metadata tier):

- Raster: `packages/geoview-core/src/geo/layer/geoview-layers/raster/`
- Vector: `packages/geoview-core/src/geo/layer/geoview-layers/vector/`

**GV layer** (runtime tier):

- Raster: `packages/geoview-core/src/geo/layer/gv-layers/raster/`
- Vector: `packages/geoview-core/src/geo/layer/gv-layers/vector/`
- Tile: `packages/geoview-core/src/geo/layer/gv-layers/tile/`

### Example: Adding Image Static Layer

**Step 2a — Create the GeoView layer class** (handles metadata fetching, config validation, and creates the GV layer):

```typescript
// packages/geoview-core/src/geo/layer/geoview-layers/raster/image-static.ts

import { AbstractGeoViewRaster } from './abstract-geoview-raster';
import { GVImageStatic } from '@/geo/layer/gv-layers/raster/gv-image-static';

/**
 * Manages metadata fetching and config validation for Image Static layers.
 */
export class ImageStatic extends AbstractGeoViewRaster {
  /**
   * Creates the GV layer instance that will be used at runtime.
   */
  protected override onCreateGVLayer(layerConfig: ImageStaticLayerEntryConfig): GVImageStatic {
    const source = ImageStatic.createImageStaticSource(layerConfig);
    return new GVImageStatic(source, layerConfig);
  }

  // Implement other abstract methods (onFetchServiceMetadata, etc.)
}
```

**Step 2b — Create the GV layer class** (OpenLayers wrapper used at runtime by controllers, domain, and UI):

```typescript
// packages/geoview-core/src/geo/layer/gv-layers/raster/gv-image-static.ts

import { AbstractGVRaster } from './abstract-gv-raster';

/**
 * GV layer wrapper for Image Static layers. Holds the OpenLayers layer on the map.
 */
export class GVImageStatic extends AbstractGVRaster {
  // Implementation here
}
```

## Step 3: Create Type Guards

Create type guard functions to validate layer types:

```typescript
export const layerConfigIsImageStatic = (verifyIfLayer: TypeGeoviewLayerConfig): verifyIfLayer is TypeImageStaticLayerConfig => {
  return verifyIfLayer?.geoviewLayerType === CONST_LAYER_TYPES.IMAGE_STATIC;
};

export const geoviewLayerIsImageStatic = (verifyIfGeoViewLayer: AbstractGeoViewLayer): verifyIfGeoViewLayer is ImageStatic => {
  return verifyIfGeoViewLayer?.type === CONST_LAYER_TYPES.IMAGE_STATIC;
};

export const geoviewEntryIsImageStatic = (
  verifyIfGeoViewEntry: TypeLayerEntryConfig
): verifyIfGeoViewEntry is TypeImageStaticLayerEntryConfig => {
  return verifyIfGeoViewEntry?.geoviewRootLayer?.geoviewLayerType === CONST_LAYER_TYPES.IMAGE_STATIC;
};
```

## Step 4: Define TypeScript Types

Create configuration types for your layer:

```typescript
export interface TypeImageStaticLayerEntryConfig extends Omit<TypeImageLayerEntryConfig, 'source'> {
  source: TypeSourceImageStaticInitialConfig;
}

export interface TypeImageStaticLayerConfig extends Omit<TypeGeoviewLayerConfig, 'listOfLayerEntryConfig'> {
  geoviewLayerType: 'imageStatic';
  listOfLayerEntryConfig: TypeImageStaticLayerEntryConfig[];
}
```

## Step 5: Add Source Type

Add your source type to `packages/geoview-core/src/api/types/layer-schema-types.ts`:

```typescript
/**
 * Initial settings for image sources.
 */
export type TypeSourceImageInitialConfig =
  TypeSourceImageWmsInitialConfig | TypeSourceImageEsriInitialConfig | TypeSourceImageStaticInitialConfig; // Add your new type

/**
 * Initial settings for static image sources.
 */
export interface TypeSourceImageStaticInitialConfig extends TypeBaseSourceImageInitialConfig {
  /** Image extent */
  extent: Extent;
}
```

## Step 6: Register Layer Type

Update `packages/geoview-core/src/api/types/layer-schema-types.ts`:

### Add to LayerTypesKey

```typescript
export type LayerTypesKey =
  | 'esriDynamic'
  | 'esriFeature'
  | 'imageStatic' // Add here
  | 'GeoJSON';
// ... other types
```

### Add to TypeGeoviewLayerType

```typescript
export type TypeGeoviewLayerType =
  | 'esriDynamic'
  | 'esriFeature'
  | 'imageStatic' // Add here
  | 'GeoJSON';
// ... other types
```

### Add to CONST_LAYER_TYPES

```typescript
export const CONST_LAYER_TYPES: Record<LayerTypesKey, TypeGeoviewLayerType> = {
  // ... existing entries
  IMAGE_STATIC: 'imageStatic',
};
```

### Add to DEFAULT_LAYER_NAMES

Update the non-exported `DEFAULT_LAYER_NAMES` constant in `packages/geoview-core/src/geo/layer/geoview-layers/abstract-geoview-layers.ts`:

```typescript
const DEFAULT_LAYER_NAMES: Record<string, string> = {
  // ... existing entries
  imageStatic: 'Static Image',
};
```

## Step 7: Implement Abstract Methods

Implement all required abstract methods from parent classes:

### From AbstractGeoViewLayer

The base class defines exactly **4 abstract methods**:

```typescript
protected abstract onFetchServiceMetadata<T>(abortSignal?: AbortSignal): Promise<T>;
protected abstract onInitLayerEntries(): Promise<TypeGeoviewLayerConfig>;
protected abstract onProcessLayerMetadata(
  layerConfig: AbstractBaseLayerEntryConfig,
  displayDateMode: DisplayDateMode,
  mapProjection?: OLProjection,
  abortSignal?: AbortSignal
): Promise<AbstractBaseLayerEntryConfig>;
protected abstract onCreateGVLayer(
  layerConfig: AbstractBaseLayerEntryConfig
): AbstractGVLayer;
```

It also defines **overridable (non-abstract) methods** that you can override when needed:

```typescript
// Override to add custom validation logic for layer entries (step 2 in processing order)
protected onValidateListOfLayerEntryConfig(listOfLayerEntryConfig: ConfigBaseClass[]): void;
```

> **Note:** Feature query methods (`getFeatureInfoAtCoordinate`, `getFeatureInfoAtLonLat`, etc.) are on the **GV layer** classes (e.g., `AbstractGVRaster`, `AbstractGVVector`), not on `AbstractGeoViewLayer`.

### Example Implementation

```typescript
export class ImageStatic extends AbstractGeoViewRaster {
  /**
   * Fetches service metadata (not needed for static images).
   */
  protected async onFetchServiceMetadata<T>(abortSignal?: AbortSignal): Promise<T> {
    // Static images don't have service metadata
    return Promise.resolve(undefined as T);
  }

  /**
   * Initializes layer entries from config.
   */
  protected async onInitLayerEntries(): Promise<TypeGeoviewLayerConfig> {
    // Validate and return config
    return this.geoviewLayerConfig;
  }

  /**
   * Processes layer metadata for a single entry.
   */
  protected async onProcessLayerMetadata(
    layerConfig: AbstractBaseLayerEntryConfig,
    displayDateMode: DisplayDateMode,
    mapProjection?: OLProjection,
    abortSignal?: AbortSignal
  ): Promise<AbstractBaseLayerEntryConfig> {
    // Process metadata for this layer entry
    return layerConfig;
  }

  /**
   * Creates the GV layer instance for runtime use.
   */
  protected onCreateGVLayer(layerConfig: AbstractBaseLayerEntryConfig): GVImageStatic {
    const source = ImageStatic.createImageStaticSource(layerConfig);
    return new GVImageStatic(source, layerConfig);
  }
}
```

## Step 8: Add to Layer Creation Flow

Register your new layer type in the layer-creation orchestration path in `packages/geoview-core/src/core/controllers/layer-creator-controller.ts`.

Specifically:

1. Update `createLayerConfigFromType(...)` (or equivalent factory branch) so your new `geoviewLayerType` resolves to the right config class.
2. Ensure your GeoView layer class is instantiated through the normal `addGeoviewLayer(...)` workflow (do not add an alternate event-specific loading path).
3. Keep creation in controller flow so layer registration and layer-set/store synchronization stay consistent.

## Step 9: Update JSON Schema

Update `packages/geoview-core/schema.json` to include your new layer type:

### Add to TypeGeoviewLayerType enum

```json
"TypeGeoviewLayerType": {
  "type": "string",
  "items": {
    "enum": [
      "esriDynamic",
      "esriFeature",
      "imageStatic",
      "GeoJSON",
      "geoCore",
      "GeoPackage",
      "xyzTiles",
      "ogcFeature",
      "ogcWfs",
      "ogcWms"
    ]
  },
  "description": "Type of GeoView layer."
}
```

### Add source configuration

```json
"TypeSourceImageStaticInitialConfig": {
  "type": "object",
  "properties": {
    "extent": {
      "type": "array",
      "items": { "type": "number" },
      "minItems": 4,
      "maxItems": 4,
      "description": "Image extent [minX, minY, maxX, maxY]"
    },
    "projection": {
      "type": "string",
      "description": "Image projection code"
    }
  },
  "required": ["extent"]
}
```

### Add layer configuration

```json
"TypeImageStaticLayerConfig": {
  "allOf": [
    { "$ref": "#/definitions/TypeGeoviewLayerConfig" },
    {
      "properties": {
        "geoviewLayerType": {
          "const": "imageStatic"
        },
        "listOfLayerEntryConfig": {
          "type": "array",
          "items": { "$ref": "#/definitions/TypeImageStaticLayerEntryConfig" }
        }
      }
    }
  ]
}
```

## Step 10: Export Types and Classes

Export your new types and classes from the appropriate index files:

### In `packages/geoview-core/src/geo/layer/geoview-layers/raster/index.ts`

```typescript
export * from './image-static';
```

### In `packages/geoview-core/src/api/types/layer-schema-types.ts`

```typescript
export type { TypeImageStaticLayerConfig, TypeImageStaticLayerEntryConfig };
export type { TypeSourceImageStaticInitialConfig };
```

## Testing Your New Layer Type

### Unit Tests

GeoView uses `geoview-test-suite`, a custom in-browser framework, not Jest/Vitest/Mocha.
Add config validation in ConfigTester and happy-path/expected-error lifecycle tests in LayerTester.
Use the [config template](../app/testing/test-templates.md#template-b--config-validation-test)
and [layer lifecycle template](../app/testing/test-templates.md#template-c--layer-lifecycle-test-happy-path);
register calls and audit suite/catalog/checklist counts using the
[suite authoring rules](../app/testing/creating-tests.md#step-2-create-a-test-suite).

### Integration Tests

Test in a real map:

```typescript
const mapViewer = cgpv.api.createMapFromConfig('mapId', {
  map: {
    // ... map config
  },
  layers: [
    {
      geoviewLayerId: 'testImageStatic',
      geoviewLayerType: 'imageStatic',
      metadataAccessPath: 'https://example.com/image.png',
      listOfLayerEntryConfig: [
        {
          layerId: 'image',
          source: {
            extent: [-180, -90, 180, 90],
            projection: 'EPSG:4326',
          },
        },
      ],
    },
  ],
});

mapViewer.layer.onLayerFirstLoaded((sender, payload) => {
  console.log('Layer loaded successfully:', payload.layer.getLayerPath());
});
```

## Common Patterns

### Pattern 1: Layer with Metadata Service

```typescript
protected async onFetchServiceMetadata(): Promise<void> {
  const metadataUrl = this.metadata.metadataAccessPath[this.mapId];

  try {
    const metadata = await Fetch.fetchJson(metadataUrl);

    // Store metadata for use in other methods
    this.serviceMetadata = metadata;
  } catch (error) {
    logger.logError('Failed to fetch metadata:', error);
    throw error;
  }
}
```

### Pattern 2: Layer with Feature Querying

```typescript
protected async getFeatureInfoAtPixel(
  location: Pixel,
  layerPath: string
): Promise<TypeArrayOfFeatureInfoEntries> {
  const coordinate = this.map.getCoordinateFromPixel(location);
  return this.getFeatureInfoAtCoordinate(coordinate, layerPath);
}

protected async getFeatureInfoAtCoordinate(
  location: Coordinate,
  layerPath: string
): Promise<TypeArrayOfFeatureInfoEntries> {
  // Implement GetFeatureInfo request
  const url = this.buildGetFeatureInfoUrl(location, layerPath);
  const response = await fetch(url);
  const data = await response.json();

  return this.parseFeatureInfo(data);
}
```

### Pattern 3: Layer with Dynamic Styling

```typescript
protected applyStyle(olLayer: BaseLayer, styleConfig: any): void {
  if (olLayer instanceof VectorLayer) {
    const style = new Style({
      fill: new Fill({ color: styleConfig.fillColor }),
      stroke: new Stroke({ color: styleConfig.strokeColor, width: styleConfig.strokeWidth }),
    });

    olLayer.setStyle(style);
  }
}
```

## Best Practices

### ✅ DO

1. **Extend the correct abstract class** (Raster vs Vector)
2. **Implement all abstract methods** completely
3. **Use type guards** for type checking
4. **Handle errors gracefully** with try/catch and logging
5. **Add comprehensive tests** for your layer type
6. **Document your layer type** in user-facing docs
7. **Follow naming conventions** (e.g., `ImageStatic`, not `StaticImage`)

### ❌ DON'T

1. **Don't modify abstract classes** unless necessary
2. **Don't bypass validation** - use schema validation
3. **Don't hardcode values** - use configuration
4. **Don't forget to export** types and classes
5. **Don't skip error handling** in async methods

## Troubleshooting

### Layer Not Loading

1. Check console for validation errors
2. Verify layer type is registered in `CONST_LAYER_TYPES`
3. Ensure type guard functions are correct
4. Check if layer is added to loading switch in `layer.ts`

### Type Errors

1. Verify all types are exported from `layer-schema-types.ts`
2. Check type guard function signatures
3. Ensure source type is added to union type

### Schema Validation Failing

1. Verify `schema.json` includes your layer type
2. Check all required properties are defined
3. Test configuration against schema

## See Also

- **[GeoView Layers Guide](app/layers/layers.md)** - User-facing layer documentation
- **[Layer API Reference](app/api/layer-api.md)** - API methods
- **[Event Helper](event-helper.md)** - Delegate event system
- **[Best Practices](best-practices.md)** - General coding standards

## Example: Complete Layer Implementation

See existing layer implementations for complete examples:

- **Raster:** `packages/geoview-core/src/geo/layer/geoview-layers/raster/ogc-wms.ts`
- **Vector:** `packages/geoview-core/src/geo/layer/geoview-layers/vector/geojson.ts`
