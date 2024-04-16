import { CONST_LAYER_TYPES } from '../../../config-constants';
import { AbstractGeoviewLayerConfig } from '../abstract-geoview-layer-config';
import { EsriDynamicLayerEntryConfig } from '../../layer-tree-config/raster-leaf/esri-dynamic-layer-entry-config';
import { ConfigBaseClass } from '../../layer-tree-config/config-base-class';
import { GroupLayerEntryConfig } from '../../layer-tree-config/group-layer-entry-config';
import { AbstractBaseLayerEntryConfig } from '../../layer-tree-config/abstract-base-layer-entry-config';
import { logger } from '../../../../../logger';
import { TypeJsonObject } from '../../../config-types';
import { TypeLayerInitialSettings } from '../../../map-schema-types';
import { MapFeaturesConfig } from '../../map-features-config';

export type TypeEsriDynamicLayerNode =
  | (ConfigBaseClass & GroupLayerEntryConfig)
  | (ConfigBaseClass & AbstractBaseLayerEntryConfig & EsriDynamicLayerEntryConfig);

export class EsriDynamicLayerConfig extends AbstractGeoviewLayerConfig {
  /** Type of GeoView layer. */
  geoviewLayerType = CONST_LAYER_TYPES.ESRI_DYNAMIC;

  /** The layer entries to use from the GeoView layer. */
  declare listOfLayerEntryConfig: TypeEsriDynamicLayerNode[];

  /**
   * The class constructor.
   * @param {TypeJsonObject} layerConfig The layer configuration we want to instanciate.
   */
  constructor(layerConfig: TypeJsonObject, mapFeaturesConfig?: MapFeaturesConfig) {
    super(layerConfig, mapFeaturesConfig);

    if (!this.metadataAccessPath)
      logger.logError(
        `Property metadataAccessPath is mandatory for GeoView layer ${this.geoviewLayerId} of type ${this.geoviewLayerType}.`
      );
  }

  createLeafNode(
    layerConfig: TypeJsonObject,
    initialSettings: TypeLayerInitialSettings,
    geoviewConfig: AbstractGeoviewLayerConfig
  ): ConfigBaseClass {
    return new EsriDynamicLayerEntryConfig(layerConfig, initialSettings, geoviewConfig);
  }
}
