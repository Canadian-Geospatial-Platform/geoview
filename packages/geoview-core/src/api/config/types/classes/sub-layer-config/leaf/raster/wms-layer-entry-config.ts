import { CV_CONST_SUB_LAYER_TYPES, CV_CONST_LEAF_LAYER_SCHEMA_PATH } from '@config/types/config-constants';
import { TypeJsonArray, TypeJsonObject } from '@config/types/config-types';
import { TypeStyleConfig, TypeLayerEntryType, TypeSourceWmsInitialConfig, Extent } from '@config/types/map-schema-types';
import { AbstractBaseLayerEntryConfig } from '@config/types/classes/sub-layer-config/leaf/abstract-base-layer-entry-config';
import { WmsLayerConfig } from '@config/types/classes/geoview-config/raster-config/wms-config';
import { logger } from '@/core/utils/logger';
import { DateMgt } from '@/core/utils/date-mgt';

/**
 * The ESRI dynamic geoview sublayer class.
 */
export class WmsLayerEntryConfig extends AbstractBaseLayerEntryConfig {
  /** Source settings to apply to the GeoView image layer source at creation time. */
  declare source: TypeSourceWmsInitialConfig;

  /** Style to apply to the raster layer. */
  style?: TypeStyleConfig;

  /**
   * The getter method that returns the schemaPath property. Each geoview sublayer type knows what section of the schema must be
   * used to do its validation.
   *
   * @returns {string} The schemaPath associated to the sublayer.
   * @protected
   */
  protected override getSchemaPath(): string {
    return CV_CONST_LEAF_LAYER_SCHEMA_PATH.WMS;
  }

  /**
   * A method that returns the entryType property. Each sublayer knows what entry type is associated to it.
   *
   * @returns {TypeLayerEntryType} The entryType associated to the sublayer.
   * @protected
   */
  protected override getEntryType(): TypeLayerEntryType {
    return CV_CONST_SUB_LAYER_TYPES.RASTER_IMAGE;
  }

  /**
   * This method is used to fetch, parse and extract the relevant information from the metadata of the leaf node.
   * The same method signature is used by layer group nodes and leaf nodes (layers).
   * @override
   */
  override async fetchLayerMetadata(): Promise<void> {
    // If an error has already been detected, then the layer is unusable.
    if (this.getErrorDetectedFlag()) return Promise.resolve();

    // WMS service metadata contains the layer's metadata.
    const layerMetadata = WmsLayerConfig.getLayerMetadataEntry(
      this.layerId,
      this.getGeoviewLayerConfig().getServiceMetadata().Capability.Layer
    );
    if (layerMetadata) {
      this.setLayerMetadata(layerMetadata);
      // Parse the raw layer metadata and build the geoview configuration.
      this.parseLayerMetadata();
      return Promise.resolve();
    }

    logger.logError(`Can't find layer's metadata for layerPath ${this.getLayerPath()}.`);
    this.setErrorDetectedFlag();
    return Promise.resolve();
  }

  /** ***************************************************************************************************************************
   * This method is used to parse the layer metadata and extract the source information and other properties.
   * @protected
   */
  protected parseLayerMetadata(): void {
    const layerMetadata = this.getLayerMetadata();

    if (layerMetadata?.Attribution?.Title) this.attributions.push(layerMetadata.Attribution.Title as string);

    this.bounds = layerMetadata.EX_GeographicBoundingBox as Extent;

    this.source = {
      // layerFilter?: is optional,
      featureInfo: {
        queryable: layerMetadata.queryable as boolean,
        nameField: '',
        outfields: [],
      },
      projection: this.source.projection,
    };

    this.processTemporalDimension(layerMetadata.Dimension);
  }

  /** ***************************************************************************************************************************
   * This method will create a Geoview temporal dimension if it existds in the service metadata
   * @param {TypeJsonObject} wmsDimension The WMS time dimension object
   */
  protected processTemporalDimension(wmsDimension: TypeJsonObject): void {
    if (wmsDimension) {
      const temporalDimension: TypeJsonObject | undefined = (wmsDimension as TypeJsonArray).find((dimension) => dimension.name === 'time');
      if (temporalDimension) this.temporalDimension = DateMgt.createDimensionFromOGC(temporalDimension);
    }
  }

  /**
   * Apply default values. The default values will be overwritten by the values in the metadata when they are analyzed.
   * The resulting config will then be overwritten by the values provided in the user config.
   */
  override applyDefaultValues(): void {
    super.applyDefaultValues();
    this.source = {
      crossOrigin: 'Anonymous',
      serverType: 'mapserver',
      style: '',
      projection: 3978,
      featureInfo: {
        queryable: false,
        nameField: '',
        outfields: [],
      },
    };
  }
}
