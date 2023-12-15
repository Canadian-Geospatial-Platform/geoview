# Add a New Layer Type

There is many steps involed in adding a new layer type support to GeoView. This documentation file will explain step by step what needs to be done to accomplish this task.
The GeoView layers are divided in 2 different categories _Raster_ and _Vector_. Both categories are manage by abstract classes ([abstract-geoview-raster](../../packages/geoview-core/src/geo/layer/geoview-layers/raster/abstract-geoview-raster.ts) and [abstract-geoview-vector](../../packages/geoview-core/src/geo/layer/geoview-layers/vector/abstract-geoview-vector.ts)) to encapsulate their behaviours, These 2
categories are also encapsulated in the parent abstract class: [abstract-geoview-layers](../../packages/geoview-core/src/geo/layer/geoview-layers/abstract-geoview-layers.ts).

**TODO: create basic template flavor for creating a new layer type**

### First, Create new layer class

The first step when it is time to create a new layer type is to determine if it is a raster or a vector type of layer. This selection is driven by the type of OpenLayers sources you will use to
instanciate the layer.

For example, we are trying to add a new layer type based on a [static image source](https://openlayers.org/en/latest/apidoc/module-ol_source_ImageStatic-Static.html). When I read the OpenLayers
documentation, I can see this source extend the [ImageSource](https://openlayers.org/en/latest/apidoc/module-ol_source_Image-ImageSource.html). If I continue my investigation I can see
this class has raster type of source as subclasses. I now know my new layer type is **raster**.

I can create my new class, inside the raster folder of the layer structure, [image-static.ts](../../packages/geoview-core/src/geo/layer/geoview-layers/raster/image-static.ts) by extending AbstractGeoViewRaster class

```
/** *****************************************************************************************************************************
 * A class to add image static layer.
 *
 * @exports
 * @class ImageStatic
 */
// ******************************************************************************************************************************
export class ImageStatic extends AbstractGeoViewRaster {
```

To make the link between my new class and the geoview layers hierarchy I need to do the following:

- Inside [abstract-geoview-layers](../../packages/geoview-core/src/geo/layer/geoview-layers/abstract-geoview-layers.ts)
  - Add to **DEFAULT_LAYER_NAMES** _constant_
  - Add to **LayerTypeKey** _type_
  - Add to **TypeGeoviewLayerType** _type_
  - Add to **CONST_LAYER_TYPES** _constant_ based on `LayerTypeKey, TypeGeoviewLayerType`

Go back to my new class... Geoview is developed in TypeScript and uses type guard functions to validate type in order to determine if the type ascention is valid.
I uses existing functions in other raster class and adapted them to my own static image need.

```
export const layerConfigIsImageStatic = (verifyIfLayer: TypeGeoviewLayerConfig): verifyIfLayer is TypeImageStaticLayerConfig => {
  return verifyIfLayer?.geoviewLayerType === CONST_LAYER_TYPES.IMAGE_STATIC;
};

export const geoviewLayerIsImageStatic = (verifyIfGeoViewLayer: AbstractGeoViewLayer): verifyIfGeoViewLayer is ImageStatic => {
  return verifyIfGeoViewLayer?.type === CONST_LAYER_TYPES.IMAGE_STATIC;
};

export const geoviewEntryIsImageStatic = (verifyIfGeoViewEntry: TypeLayerEntryConfig): verifyIfGeoViewEntry is TypeImageStaticLayerEntryConfig => {
  return verifyIfGeoViewEntry?.geoviewRootLayer?.geoviewLayerType === CONST_LAYER_TYPES.IMAGE_STATIC;
};
```

The first function verifies if my layer is type of `TypeImageStaticLayerConfig` and the last function verifies if my layer entry is type of `TypeImageStaticLayerEntryConfig`.
These 2 types does not exist in my class yet so I have to create them.

```
export interface TypeImageStaticLayerEntryConfig extends Omit<TypeImageLayerEntryConfig, 'source'> {
  source: TypeSourceImageStaticInitialConfig;
}

export interface TypeImageStaticLayerConfig extends Omit<TypeGeoviewLayerConfig, 'listOfLayerEntryConfig'> {
  geoviewLayerType: 'imageStatic';
  listOfLayerEntryConfig: TypeImageStaticLayerEntryConfig[];
}
```

**TODO: should we reuse constant from abstract class instead of text?**

The important variable inside these 2 interfaces is the type of source my new layer class will be using. In this cases, the type does not exist so I need to create it inside [map-schema-type](../../packages/geoview-core/src/geo/map/map-schema-types.ts). Because my new source is type of sourceImage, I will add it inside `TypeSourceImageInitialConfig`

```
/** ******************************************************************************************************************************
 * Initial settings for image sources.
 */
export type TypeSourceImageInitialConfig =
  | TypeSourceImageWmsInitialConfig
  | TypeSourceImageEsriInitialConfig
  | TypeSourceImageStaticInitialConfig;
```

I will then create this new interface by extending the `TypeSourceImageInitialConfig` _type_

```
/** ******************************************************************************************************************************
 * Initial settings for static image sources.
 */
export interface TypeSourceImageStaticInitialConfig extends TypeBaseSourceImageInitialConfig {
  /** Image extent */
  extent: Extent;
}
```

For my [static image source](https://openlayers.org/en/latest/apidoc/module-ol_source_ImageStatic-Static.html), I need `projection` and `extent`. Because the projection property is already define
in parent type, I only need to create my source with the extent property.

For the moment, my class and my source type are define but I still have an error because I do not have implemented all needed fuctions define in my abstract classes.

From [abstract-geoview-layers](../../packages/geoview-core/src/geo/layer/geoview-layers/abstract-geoview-layers.ts)

```
protected abstract fetchServiceMetadata(): Promise<void>;
protected abstract validateListOfLayerEntryConfig(listOfLayerEntryConfig: TypeListOfLayerEntryConfig): TypeListOfLayerEntryConfig;
protected abstract processLayerMetadata(layerConfig: TypeLayerEntryConfig): Promise<void>;
protected abstract processOneLayerEntry(layerConfig: TypeBaseLayerEntryConfig): Promise<BaseLayer | null>;
protected abstract getFeatureInfoAtPixel(location: Pixel, layerPath: string): Promise<TypeArrayOfFeatureInfoEntries>;
protected abstract getFeatureInfoAtCoordinate(location: Coordinate, layerPath: string): Promise<TypeArrayOfFeatureInfoEntries>;
protected abstract getFeatureInfoAtLongLat(location: Coordinate, layerPath: string): Promise<TypeArrayOfFeatureInfoEntries>;
protected abstract getFeatureInfoUsingBBox(location: Coordinate[], layerPath: string): Promise<TypeArrayOfFeatureInfoEntries>;
protected abstract getFeatureInfoUsingPolygon(location: Coordinate[], layerPath: string): Promise<TypeArrayOfFeatureInfoEntries>;
protected abstract getFieldDomain(fieldName: string, layerConfig: TypeLayerEntryConfig): null | codedValueType | rangeDomainType;
protected abstract getFieldType(fieldName: string, layerConfig: TypeLayerEntryConfig): 'string' | 'date' | 'number';
```

Once done I have a valid new static image layer type!

### Second, Add my new layer class to loading process

Next step is to add my new class to the loading process inside the [layer.ts](../../packages/geoview-core/src/geo/layer/layer.ts) class. For this I need to
import my new class and add it to the `EVENT_NAMES.LAYER.EVENT_ADD_LAYER` switch like this

```
import { ImageStatic, layerConfigIsImageStatic } from './geoview-layers/raster/image-static';
...
  } else if (layerConfigIsImageStatic(layerConfig)) {
    const imageStatic = new ImageStatic(this.mapId, layerConfig);
    imageStatic.createGeoViewLayers().then(() => {
      this.addToMap(imageStatic);
    });
  } else if (layerConfigIsWFS(layerConfig)) {
...
```

My new layer will not load yet because I have validation errors when GeoView tries to validate that the configuration for my new layer is valid. To solve this issue,
I need to start ith our [schema.json](../../packages/geoview-core/schema.json) configuration file. Because we added a new type `TypeSourceImageInitialConfig` we need to
add is corresponding definition in our schema.

Add the new layer type

```
"TypeGeoviewLayerType": {
    "type": "string",
    "items": {
      "enum": ["esriDynamic", "esriFeature", "imageStatic", "GeoJSON", "geoCore", "GeoPackage", "xyzTiles", "ogcFeature", "ogcWfs", "ogcWms"]
    },
    "description": "Type of GeoView layer."
  },
```

Add the TypeSourceImageStaticInitialConfig section. This the expected configuration for the source of our new layer

```
"TypeSourceImageStaticInitialConfig": {
  "additionalProperties": false,
  "type": "object",
  "properties": {
    "dataAccessPath": {
      "$ref": "#/definitions/TypeLocalizedString",
      "description": "The path (English/French) to reach the data to display. If not specified, metadatAccessPath will be assigne to it."
    },
    "crossOrigin": {
      "type": "string",
      "description": "The crossOrigin attribute for loaded images. Note that you must provide a crossOrigin value if you want to access pixel data with the Canvas renderer."
    },
    "projection": {
      "type": "integer",
      "description": "Spatial Reference EPSG code supported (https://epsg.io/). We support Web Mercator and Lambert Conical Conform Canada."
    },
    "featureInfo": {
      "$ref": "#/definitions/TypeFeatureInfoLayerConfig"
    },
    "extent": {
      "type": "array",
      "minItems": 4,
      "maxItems": 4,
      "items": {
        "type": "number"
      },
      "description": "The extent of the static image. Called with [minX, minY, maxX, maxY] extent coordinates."
    }
  }
},
```

To finish, add our new type to `TypeSourceImageInitialConfig` defninition

```
"TypeSourceImageInitialConfig": {
  "anyOf": [
    ...
    { "$ref": "#/definitions/TypeSourceImageStaticInitialConfig" }
  ]
},
```

Finally we need to add configuration calidation our new layer type. All layer configuration are validate at load time. This is done with our
[config-validation](../../packages/geoview-core/src/core/utils/config/config-validation.ts) class.

Import the payload function from our layer class

```
import { geoviewEntryIsImageStatic } from '../../../geo/layer/geoview-layers/raster/image-static';
```

Then add extra validation

```
private doExtraValidation(listOfGeoviewLayerConfig?: TypeListOfGeoviewLayerConfig) {
...
  case 'imageStatic':
    this.geoviewLayerIdIsMandatory(geoviewLayerConfig);
    this.processLayerEntryConfig(geoviewLayerConfig, geoviewLayerConfig, geoviewLayerConfig.listOfLayerEntryConfig);
    break;
...
}
```

Lastly create the layer entry config who will be use later in the loading process

```
private processLayerEntryConfig(rootLayerConfig: TypeGeoviewLayerConfig, parentLayerConfig: TypeGeoviewLayerConfig | TypeLayerGroupEntryConfig, listOfLayerEntryConfig: TypeListOfLayerEntryConfig) {
...} else if (geoviewEntryIsImageStatic(layerConfig)) {
    // Value for layerConfig.entryType can only be raster
    if (!layerConfig.entryType) layerConfig.entryType = 'raster';
    if (!layerConfig.source.dataAccessPath) {
      throw new Error(
        `source.dataAccessPath on layer entry ${Layer.getLayerPath(layerConfig)} is mandatory for GeoView layer ${
          rootLayerConfig.geoviewLayerId
        } of type ${rootLayerConfig.geoviewLayerType}`
      );
    }
  } else if (geoviewEntryIsXYZTiles(layerConfig)) {...
}
```

### Third, Create the layer configuration

Now that everything is put in place I can create my configuration to add to one of my existing map

```
{
  'geoviewLayerId': 'staticLYR10',
  'geoviewLayerName': {
    'en': 'Static Image'
  },
  'geoviewLayerType': 'imageStatic',
  'listOfLayerEntryConfig': [
    {
      'layerId': 'thumbnail',
      'layerName': { 'en': 'DataCube' },
      'source': {
        'dataAccessPath': {
          'en': 'https://datacube-prod-data-public.s3.ca-central-1.amazonaws.com/store/imagery/aerial/napl/napl-ring-of-fire/napl-ring-of-fire-1954-08-07-60k-thumbnail.png',
          'fr': 'https://datacube-prod-data-public.s3.ca-central-1.amazonaws.com/store/imagery/aerial/napl/napl-ring-of-fire/napl-ring-of-fire-1954-08-07-60k-thumbnail.png'
        },
        'extent': [-87.77486341686723,
          51.62285357468582,
          -84.57727128084842,
          53.833354975551075
        ],
        'projection': 4326
      }
    }
  ]
}
```
