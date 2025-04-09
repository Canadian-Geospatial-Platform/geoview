import Static, { Options as SourceOptions } from 'ol/source/ImageStatic';
import ImageLayer from 'ol/layer/Image';

import { Cast } from '@/core/types/global-types';
import { CONST_LAYER_TYPES } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { AbstractGeoViewRaster } from '@/geo/layer/geoview-layers/raster/abstract-geoview-raster';
import { TypeLayerEntryConfig, TypeGeoviewLayerConfig } from '@/geo/map/map-schema-types';

import { ImageStaticLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/image-static-layer-entry-config';
import { AbstractBaseLayerEntryConfig } from '@/core/utils/config/validation-classes/abstract-base-layer-entry-config';
import { GeoViewError } from '@/core/exceptions/geoview-exceptions';

export interface TypeImageStaticLayerConfig extends Omit<TypeGeoviewLayerConfig, 'listOfLayerEntryConfig'> {
  geoviewLayerType: typeof CONST_LAYER_TYPES.IMAGE_STATIC;
  listOfLayerEntryConfig: ImageStaticLayerEntryConfig[];
}

/**
 * A class to add image static layer.
 *
 * @exports
 * @class ImageStatic
 */
export class ImageStatic extends AbstractGeoViewRaster {
  /**
   * Constructs a ImageStatic Layer configuration processor.
   *
   * @param {string} mapId the id of the map
   * @param {TypeImageStaticLayerConfig} layerConfig the layer configuration
   */
  constructor(mapId: string, layerConfig: TypeImageStaticLayerConfig) {
    super(CONST_LAYER_TYPES.IMAGE_STATIC, layerConfig, mapId);
  }

  /**
   * Overrides the validation of a layer entry config.
   * @param {TypeLayerEntryConfig} layerConfig - The layer entry config to validate.
   */
  protected override onValidateLayerEntryConfig(layerConfig: TypeLayerEntryConfig): void {
    // Note that Image Static metadata as we defined it does not contains metadata layer group. If you need geojson layer group,
    // you can define them in the configuration section.
    if (Array.isArray(this.metadata?.listOfLayerEntryConfig)) {
      const metadataLayerList = Cast<TypeLayerEntryConfig[]>(this.metadata?.listOfLayerEntryConfig);
      const foundEntry = metadataLayerList.find((layerMetadata) => layerMetadata.layerId === layerConfig.layerId);
      if (!foundEntry) {
        // Add a layer load error
        this.addLayerLoadError(layerConfig, `GeoJSON layer not found (mapId:  ${this.mapId}, layerPath: ${layerConfig.layerPath})`);
        return;
      }
      return;
    }

    throw new GeoViewError(
      this.mapId,
      `Invalid GeoJSON metadata (listOfLayerEntryConfig) prevent loading of layer (mapId:  ${this.mapId}, layerPath: ${layerConfig.layerPath})`
    );
  }

  /**
   * Overrides the way the layer entry is processed to generate an Open Layer Base Layer object.
   * @param {AbstractBaseLayerEntryConfig} layerConfig - The layer entry config needed to create the Open Layer object.
   * @returns {Promise<ImageLayer<Static>>} The GeoView raster layer that has been created.
   */
  protected override onProcessOneLayerEntry(layerConfig: AbstractBaseLayerEntryConfig): Promise<ImageLayer<Static>> {
    // Instance check
    if (!(layerConfig instanceof ImageStaticLayerEntryConfig))
      throw new GeoViewError(this.mapId, 'Invalid layer configuration type provided');

    if (!layerConfig?.source?.extent)
      throw new GeoViewError(this.mapId, 'Parameter extent is not defined in source element of layerConfig.');
    const sourceOptions: SourceOptions = {
      url: layerConfig.source.dataAccessPath || '',
      imageExtent: layerConfig.source.extent,
    };

    if (layerConfig?.source?.crossOrigin) {
      sourceOptions.crossOrigin = layerConfig.source.crossOrigin;
    } else {
      sourceOptions.crossOrigin = 'Anonymous';
    }

    if (layerConfig?.source?.projection) {
      sourceOptions.projection = `EPSG:${layerConfig.source.projection}`;
    } else throw new GeoViewError(this.mapId, 'Parameter projection is not define in source element of layerConfig.');

    // Create the source
    const source = new Static(sourceOptions);

    // GV Time to request an OpenLayers layer!
    const requestResult = this.emitLayerRequesting({ config: layerConfig, source });

    // If any response
    let olLayer: ImageLayer<Static>;
    if (requestResult.length > 0) {
      // Get the OpenLayer that was created
      olLayer = requestResult[0] as ImageLayer<Static>;
    } else throw new GeoViewError(this.mapId, 'Error on layerRequesting event');

    // GV Time to emit about the layer creation!
    this.emitLayerCreation({ config: layerConfig, layer: olLayer });

    // Return the OpenLayer layer
    return Promise.resolve(olLayer);
  }
}

/** *****************************************************************************************************************************
 * type guard function that redefines a TypeGeoviewLayerConfig as a TypeImageStaticLayerConfig if the geoviewLayerType attribute of the
 * verifyIfLayer parameter is ImageStatic. The type ascention applies only to the true block of the if clause that use this function.
 *
 * @param {TypeGeoviewLayerConfig} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const layerConfigIsImageStatic = (verifyIfLayer: TypeGeoviewLayerConfig): verifyIfLayer is TypeImageStaticLayerConfig => {
  return verifyIfLayer?.geoviewLayerType === CONST_LAYER_TYPES.IMAGE_STATIC;
};

/** *****************************************************************************************************************************
 * type guard function that redefines a TypeLayerEntryConfig as a ImageStaticLayerEntryConfig if the geoviewLayerType attribute of the
 * verifyIfGeoViewEntry.geoviewLayerConfig attribute is ImageStatic. The type ascention applies only to the true block of
 * the if clause that use this function.
 *
 * @param {TypeLayerEntryConfig} verifyIfGeoViewEntry Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const geoviewEntryIsImageStatic = (
  verifyIfGeoViewEntry: TypeLayerEntryConfig
): verifyIfGeoViewEntry is ImageStaticLayerEntryConfig => {
  return verifyIfGeoViewEntry?.geoviewLayerConfig?.geoviewLayerType === CONST_LAYER_TYPES.IMAGE_STATIC;
};
