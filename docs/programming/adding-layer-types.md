# Adding New Layer Types

> **👥 Audience:** Core developers extending GeoView functionality
>
> **For API Users:** See [GeoView Layers Guide](../app/doc-new/layers.md) for using existing layer types

This guide explains how to add support for new layer types to GeoView.

## Overview

GeoView layers are divided into two categories:

- **Raster** - Image-based layers (managed by `AbstractGeoViewRaster`)
- **Vector** - Geometry-based layers (managed by `AbstractGeoViewVector`)

Both categories extend the parent abstract class `AbstractGeoViewLayers`.

## Architecture

```
AbstractGeoViewLayers (parent)
├── AbstractGeoViewRaster
│   ├── EsriDynamic
│   ├── EsriImage
│   ├── ImageStatic
│   ├── OgcWms
│   └── XyzTiles
└── AbstractGeoViewVector
    ├── EsriFeature
    ├── GeoJSON
    ├── GeoPackage
    ├── OgcFeature
    └── OgcWfs
```

## Step 1: Determine Layer Category

First, determine if your new layer type is **raster** or **vector** based on the OpenLayers source:

**Raster Sources:**

- `ImageStatic`, `ImageWMS`, `ImageArcGISRest`
- `TileWMS`, `XYZ`, `OSM`
- Extends `ImageSource` or `TileSource`

**Vector Sources:**

- `Vector`, `VectorTile`
- `GeoJSON`, `KML`, `GPX`
- Extends `VectorSource`

## Step 2: Create Layer Class

Create your new layer class in the appropriate category folder:

### Location

- Raster: `packages/geoview-core/src/geo/layer/geoview-layers/raster/`
- Vector: `packages/geoview-core/src/geo/layer/geoview-layers/vector/`

### Example: Adding Image Static Layer

```typescript
// packages/geoview-core/src/geo/layer/geoview-layers/raster/image-static.ts

import { AbstractGeoViewRaster } from "./abstract-geoview-raster";
import type {
  TypeImageStaticLayerConfig,
  TypeImageStaticLayerEntryConfig,
} from "@/geo/map/map-schema-types";

/**
 * A class to add image static layer.
 *
 * @exports
 * @class ImageStatic
 */
export class ImageStatic extends AbstractGeoViewRaster {
  // Implementation here
}
```

## Step 3: Create Type Guards

Create type guard functions to validate layer types:

```typescript
export const layerConfigIsImageStatic = (
  verifyIfLayer: TypeGeoviewLayerConfig
): verifyIfLayer is TypeImageStaticLayerConfig => {
  return verifyIfLayer?.geoviewLayerType === CONST_LAYER_TYPES.IMAGE_STATIC;
};

export const geoviewLayerIsImageStatic = (
  verifyIfGeoViewLayer: AbstractGeoViewLayer
): verifyIfGeoViewLayer is ImageStatic => {
  return verifyIfGeoViewLayer?.type === CONST_LAYER_TYPES.IMAGE_STATIC;
};

export const geoviewEntryIsImageStatic = (
  verifyIfGeoViewEntry: TypeLayerEntryConfig
): verifyIfGeoViewEntry is TypeImageStaticLayerEntryConfig => {
  return (
    verifyIfGeoViewEntry?.geoviewRootLayer?.geoviewLayerType ===
    CONST_LAYER_TYPES.IMAGE_STATIC
  );
};
```

## Step 4: Define TypeScript Types

Create configuration types for your layer:

```typescript
export interface TypeImageStaticLayerEntryConfig
  extends Omit<TypeImageLayerEntryConfig, "source"> {
  source: TypeSourceImageStaticInitialConfig;
}

export interface TypeImageStaticLayerConfig
  extends Omit<TypeGeoviewLayerConfig, "listOfLayerEntryConfig"> {
  geoviewLayerType: "imageStatic";
  listOfLayerEntryConfig: TypeImageStaticLayerEntryConfig[];
}
```

## Step 5: Add Source Type

Add your source type to `packages/geoview-core/src/geo/map/map-schema-types.ts`:

```typescript
/**
 * Initial settings for image sources.
 */
export type TypeSourceImageInitialConfig =
  | TypeSourceImageWmsInitialConfig
  | TypeSourceImageEsriInitialConfig
  | TypeSourceImageStaticInitialConfig; // Add your new type

/**
 * Initial settings for static image sources.
 */
export interface TypeSourceImageStaticInitialConfig
  extends TypeBaseSourceImageInitialConfig {
  /** Image extent */
  extent: Extent;
}
```

## Step 6: Register Layer Type

Update `packages/geoview-core/src/geo/layer/geoview-layers/abstract-geoview-layers.ts`:

### Add to DEFAULT_LAYER_NAMES

```typescript
export const DEFAULT_LAYER_NAMES: Record<string, TypeLocalizedString> = {
  // ... existing entries
  imageStatic: { en: "Static Image", fr: "Image statique" },
};
```

### Add to LayerTypeKey

```typescript
export type LayerTypeKey =
  | "esriDynamic"
  | "esriFeature"
  | "imageStatic" // Add here
  | "GeoJSON";
// ... other types
```

### Add to TypeGeoviewLayerType

```typescript
export type TypeGeoviewLayerType =
  | "esriDynamic"
  | "esriFeature"
  | "imageStatic" // Add here
  | "GeoJSON";
// ... other types
```

### Add to CONST_LAYER_TYPES

```typescript
export const CONST_LAYER_TYPES: {
  [key in LayerTypeKey]: TypeGeoviewLayerType;
} = {
  // ... existing entries
  IMAGE_STATIC: "imageStatic",
};
```

## Step 7: Implement Abstract Methods

Implement all required abstract methods from parent classes:

### From AbstractGeoViewLayers

```typescript
protected abstract fetchServiceMetadata(): Promise<void>;
protected abstract validateListOfLayerEntryConfig(
  listOfLayerEntryConfig: TypeListOfLayerEntryConfig
): TypeListOfLayerEntryConfig;
protected abstract processLayerMetadata(layerConfig: TypeLayerEntryConfig): Promise<void>;
protected abstract processOneLayerEntry(layerConfig: AbstractBaseLayerEntryConfig): Promise<BaseLayer | null>;
protected abstract getFeatureInfoAtPixel(location: Pixel, layerPath: string): Promise<TypeArrayOfFeatureInfoEntries>;
protected abstract getFeatureInfoAtCoordinate(location: Coordinate, layerPath: string): Promise<TypeArrayOfFeatureInfoEntries>;
protected abstract getFeatureInfoAtLonLat(location: Coordinate, layerPath: string): Promise<TypeArrayOfFeatureInfoEntries>;
protected abstract getFeatureInfoUsingBBox(location: Coordinate[], layerPath: string): Promise<TypeArrayOfFeatureInfoEntries>;
protected abstract getFeatureInfoUsingPolygon(location: Coordinate[], layerPath: string): Promise<TypeArrayOfFeatureInfoEntries>;
protected abstract getFieldDomain(fieldName: string, layerConfig: TypeLayerEntryConfig): null | codedValueType | rangeDomainType;
protected abstract getFieldType(fieldName: string, layerConfig: TypeLayerEntryConfig): 'string' | 'date' | 'number';
```

### Example Implementation

```typescript
export class ImageStatic extends AbstractGeoViewRaster {
  /**
   * Fetch service metadata (not needed for static images)
   */
  protected async fetchServiceMetadata(): Promise<void> {
    // Static images don't have service metadata
    return Promise.resolve();
  }

  /**
   * Validate layer entry configuration
   */
  protected validateListOfLayerEntryConfig(
    listOfLayerEntryConfig: TypeListOfLayerEntryConfig
  ): TypeListOfLayerEntryConfig {
    // Validate and return config
    return listOfLayerEntryConfig;
  }

  /**
   * Process layer metadata
   */
  protected async processLayerMetadata(
    layerConfig: TypeLayerEntryConfig
  ): Promise<void> {
    // Process metadata for this layer entry
  }

  /**
   * Create OpenLayers layer
   */
  protected async processOneLayerEntry(
    layerConfig: AbstractBaseLayerEntryConfig
  ): Promise<BaseLayer | null> {
    const olLayer = new ImageLayer({
      source: new Static({
        url: layerConfig.source.dataAccessPath,
        projection: layerConfig.source.projection,
        imageExtent: layerConfig.source.extent,
      }),
    });

    return olLayer;
  }

  // Implement other required methods...
}
```

## Step 8: Add to Layer Loading

Add your layer type to the loading process in `packages/geoview-core/src/geo/layer/layer.ts`:

```typescript
import {
  ImageStatic,
  layerConfigIsImageStatic,
} from "./geoview-layers/raster/image-static";

// In the EVENT_ADD_LAYER handler:
if (layerConfigIsImageStatic(layerConfig)) {
  const imageStatic = new ImageStatic(this.mapId, layerConfig);
  imageStatic.createGeoViewLayers().then(() => {
    this.addToMap(imageStatic);
  });
}
```

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
export * from "./image-static";
```

### In `packages/geoview-core/src/geo/map/map-schema-types.ts`

```typescript
export type { TypeImageStaticLayerConfig, TypeImageStaticLayerEntryConfig };
export type { TypeSourceImageStaticInitialConfig };
```

## Testing Your New Layer Type

### Unit Tests

Create unit tests in `__tests__` folder:

```typescript
import {
  ImageStatic,
  layerConfigIsImageStatic,
} from "@/geo/layer/geoview-layers/raster/image-static";

describe("ImageStatic Layer", () => {
  it("should validate layer config correctly", () => {
    const config = {
      geoviewLayerId: "test",
      geoviewLayerType: "imageStatic",
      // ... other config
    };

    expect(layerConfigIsImageStatic(config)).toBe(true);
  });

  it("should create layer successfully", async () => {
    const imageStatic = new ImageStatic("mapId", validConfig);
    await imageStatic.createGeoViewLayers();

    expect(imageStatic.olLayers.length).toBeGreaterThan(0);
  });
});
```

### Integration Tests

Test in a real map:

```typescript
const mapViewer = cgpv.api.createMapFromConfig("mapId", {
  map: {
    // ... map config
  },
  layers: [
    {
      geoviewLayerId: "testImageStatic",
      geoviewLayerType: "imageStatic",
      metadataAccessPath: { en: "https://example.com/image.png" },
      listOfLayerEntryConfig: [
        {
          layerId: "image",
          source: {
            extent: [-180, -90, 180, 90],
            projection: "EPSG:4326",
          },
        },
      ],
    },
  ],
});

mapViewer.layer.onLayerFirstLoaded((sender, payload) => {
  console.log("Layer loaded successfully:", payload.layer.getLayerPath());
});
```

## Common Patterns

### Pattern 1: Layer with Metadata Service

```typescript
protected async fetchServiceMetadata(): Promise<void> {
  const metadataUrl = this.metadata.metadataAccessPath[this.mapId];

  try {
    const response = await fetch(metadataUrl);
    const metadata = await response.json();

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

1. Verify all types are exported from `map-schema-types.ts`
2. Check type guard function signatures
3. Ensure source type is added to union type

### Schema Validation Failing

1. Verify `schema.json` includes your layer type
2. Check all required properties are defined
3. Test configuration against schema

## See Also

- **[GeoView Layers Guide](../app/doc-new/layers.md)** - User-facing layer documentation
- **[Layer API Reference](../app/doc-new/layer-api.md)** - API methods
- **[TypeScript Patterns](./using-type.md)** - TypeScript conventions
- **[Best Practices](./best-practices.md)** - General coding standards
- **[Testing Guide](./testing.md)** - Testing patterns

## Example: Complete Layer Implementation

See existing layer implementations for complete examples:

- **Raster:** `packages/geoview-core/src/geo/layer/geoview-layers/raster/ogc-wms.ts`
- **Vector:** `packages/geoview-core/src/geo/layer/geoview-layers/vector/geojson.ts`
