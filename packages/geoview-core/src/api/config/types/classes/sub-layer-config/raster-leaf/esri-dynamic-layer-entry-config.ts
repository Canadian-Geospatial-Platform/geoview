import { defaultsDeep } from 'lodash';

import { CV_CONST_SUB_LAYER_TYPES, CV_CONST_LEAF_LAYER_SCHEMA_PATH } from '@config/types/config-constants';
import { Cast, TypeJsonObject } from '@config/types/config-types';
import { AbstractGeoviewLayerConfig } from '@config/types/classes/geoview-config/abstract-geoview-layer-config';
import { AbstractBaseLayerEntryConfig } from '@config/types/classes/sub-layer-config/abstract-base-layer-entry-config';
import { ConfigBaseClass } from '@config/types/classes/sub-layer-config/config-base-class';
import { isvalidComparedToSchema } from '@config/utils';
import { EsriCommon } from '@config/types/classes/geoview-config/esri-common';
import {
  TypeStyleConfig,
  TypeLayerEntryType,
  TypeLayerInitialSettings,
  TypeDisplayLanguage,
  TypeEsriFormatParameter,
  TypeSourceEsriDynamicInitialConfig,
} from '@config/types/map-schema-types';
import { GeoviewLayerInvalidParameterError } from '@config/types/classes/config-exceptions';

import { logger } from '@/core/utils/logger';

/**
 * The ESRI dynamic geoview sublayer class.
 */
export class EsriDynamicLayerEntryConfig extends AbstractBaseLayerEntryConfig {
  /** Source settings to apply to the GeoView image layer source at creation time. */
  declare source: TypeSourceEsriDynamicInitialConfig;

  /** Style to apply to the raster layer. */
  style?: TypeStyleConfig;

  /**
   * The class constructor.
   * @param {TypeJsonObject} layerConfig The sublayer configuration we want to instanciate.
   * @param {TypeLayerInitialSettings} initialSettings The initial settings inherited.
   * @param {TypeDisplayLanguage} language The initial language to use when interacting with the geoview layer.
   * @param {AbstractGeoviewLayerConfig} geoviewLayerConfig The GeoView instance that owns the sublayer.
   * @param {ConfigBaseClass} parentNode The The parent node that owns this layer or undefined if it is the root layer.
   * @constructor
   */
  constructor(
    layerConfig: TypeJsonObject,
    initialSettings: TypeLayerInitialSettings,
    language: TypeDisplayLanguage,
    geoviewLayerConfig: AbstractGeoviewLayerConfig,
    parentNode?: ConfigBaseClass
  ) {
    super(layerConfig, initialSettings, language, geoviewLayerConfig, parentNode);
    // Set default values.
    this.source = defaultsDeep(this.source, { maxRecordCount: 0, format: 'png', featureInfo: { queryable: false } });
    this.style = layerConfig.style ? { ...Cast<TypeStyleConfig>(layerConfig.style) } : undefined;
    if (Number.isNaN(this.layerId)) {
      this.propagateError();
      throw new GeoviewLayerInvalidParameterError('LayerIdInvalidType', [this.layerPath]);
    }
    this.source.format = (layerConfig?.source?.format || 'png') as TypeEsriFormatParameter; // Set the source.format property
    if (!isvalidComparedToSchema(this.schemaPath, layerConfig)) this.propagateError(); // Input schema validation.
    if (!isvalidComparedToSchema(this.schemaPath, this)) this.propagateError(); // Internal schema validation.
  }

  /**
   * The getter method that returns the schemaPath property. Each geoview sublayer type knows what section of the schema must be
   * used to do its validation.
   *
   * @returns {string} The schemaPath associated to the sublayer.
   * @protected
   */
  protected override get schemaPath(): string {
    return CV_CONST_LEAF_LAYER_SCHEMA_PATH.ESRI_DYNAMIC;
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
   * Get the sub-layer metadata from the metadataAccessPath and store it in a protected property of the sub-layer.
   *
   * @returns {Promise<void>} A Promise that will resolve when the execution will be completed.
   */
  override async getLayerMetadata(): Promise<void> {
    this.metadata = await EsriCommon.fetchEsriLayerMetadata(this.geoviewContainer, this);
    logger.logInfo(this.metadata);
  }
}
