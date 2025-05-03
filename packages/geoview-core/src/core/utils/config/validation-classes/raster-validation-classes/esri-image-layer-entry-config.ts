import { CONST_LAYER_TYPES } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { CONST_LAYER_ENTRY_TYPES, TypeSourceImageEsriInitialConfig } from '@/api/config/types/map-schema-types';
import { AbstractBaseLayerEntryConfig } from '@/core/utils/config/validation-classes/abstract-base-layer-entry-config';
import { LayerDataAccessPathMandatoryError } from '@/core/exceptions/layer-exceptions';

/**
 * Type used to define a GeoView image layer to display on the map.
 */
export class EsriImageLayerEntryConfig extends AbstractBaseLayerEntryConfig {
  /** Tag used to link the entry to a specific schema. */
  override schemaTag = CONST_LAYER_TYPES.ESRI_IMAGE;

  /** Layer entry data type. */
  override entryType = CONST_LAYER_ENTRY_TYPES.RASTER_IMAGE;

  /** Filter to apply on feature of this layer. */
  layerFilter?: string;

  /** Source settings to apply to the GeoView image layer source at creation time. */
  declare source: TypeSourceImageEsriInitialConfig;

  /** Max number of records for query - NOT USE FOR IMAGE SERVER */
  maxRecordCount?: number;

  /**
   * The class constructor.
   * @param {EsriImageLayerEntryConfig} layerConfig - The layer configuration we want to instanciate.
   */
  constructor(layerConfig: EsriImageLayerEntryConfig) {
    super(layerConfig);
    Object.assign(this, layerConfig);

    // Validate the dataAccessPath exists when metadataAccessPath is empty
    if (!this.geoviewLayerConfig.metadataAccessPath && !this.source?.dataAccessPath) {
      // Throw error missing dataAccessPath
      throw new LayerDataAccessPathMandatoryError(this.geoviewLayerConfig.geoviewLayerId);
    }

    if (!this.source) this.source = {};

    // If layerConfig.source.dataAccessPath is undefined, we assign the metadataAccessPath of the GeoView layer to it.
    if (!this.source.dataAccessPath) this.source.dataAccessPath = this.geoviewLayerConfig.metadataAccessPath;
    if (!this.source.dataAccessPath!.endsWith('/')) this.source.dataAccessPath += '/';
  }
}
