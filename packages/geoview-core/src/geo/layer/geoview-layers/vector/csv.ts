import { Options as SourceOptions } from 'ol/source/Vector';
import { GeoJSON as FormatGeoJSON } from 'ol/format';
import { ReadOptions } from 'ol/format/Feature';
import { Vector as VectorSource } from 'ol/source';
import Feature from 'ol/Feature';

import { Cast, TypeJsonObject } from '@/api/config/types/config-types';
import { CONST_LAYER_TYPES } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { AbstractGeoViewVector } from '@/geo/layer/geoview-layers/vector/abstract-geoview-vector';
import {
  TypeVectorSourceInitialConfig,
  TypeGeoviewLayerConfig,
  TypeBaseVectorSourceInitialConfig,
  TypeLayerEntryConfig,
} from '@/api/config/types/map-schema-types';
import { CsvLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-validation-classes/csv-layer-entry-config';
import { VectorLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-layer-entry-config';
import { AbstractBaseLayerEntryConfig } from '@/core/utils/config/validation-classes/abstract-base-layer-entry-config';
import { GeoViewError } from '@/core/exceptions/geoview-exceptions';

export interface TypeSourceCSVInitialConfig extends Omit<TypeVectorSourceInitialConfig, 'format'> {
  format: 'CSV';
  separator?: ',';
}

export interface TypeCSVLayerConfig extends Omit<TypeGeoviewLayerConfig, 'listOfLayerEntryConfig'> {
  geoviewLayerType: typeof CONST_LAYER_TYPES.CSV;
  listOfLayerEntryConfig: CsvLayerEntryConfig[];
}

/**
 * Class used to add a CSV layer to the map
 *
 * @exports
 * @class CSV
 */
export class CSV extends AbstractGeoViewVector {
  /**
   * Constructs a CSV Layer configuration processor.
   *
   * @param {string} mapId the id of the map
   * @param {TypeCSVLayerConfig} layerConfig the layer configuration
   */
  constructor(mapId: string, layerConfig: TypeCSVLayerConfig) {
    super(CONST_LAYER_TYPES.CSV, layerConfig, mapId);
  }

  /**
   * Overrides the way the layer metadata is processed.
   * @param {AbstractBaseLayerEntryConfig} layerConfig - The layer entry configuration to process.
   * @returns {Promise<AbstractBaseLayerEntryConfig>} A promise that the layer entry configuration has gotten its metadata processed.
   */
  protected override onProcessLayerMetadata(layerConfig: AbstractBaseLayerEntryConfig): Promise<AbstractBaseLayerEntryConfig> {
    // Instance check
    if (!(layerConfig instanceof VectorLayerEntryConfig)) throw new GeoViewError(this.mapId, 'Invalid layer configuration type provided');

    // process the feature info configuration and attach the config to the instance for access by parent class
    this.setLayerMetadata(layerConfig.layerPath, Cast<TypeJsonObject>(layerConfig));

    // Return the layer config
    return Promise.resolve(layerConfig);
  }

  /**
   * Create a source configuration for the vector layer.
   *
   * @param {AbstractBaseLayerEntryConfig} layerConfig The layer entry configuration.
   * @param {SourceOptions} sourceOptions The source options (default: {}).
   * @param {ReadOptions} readOptions The read options (default: {}).
   *
   * @returns {VectorSource<Geometry>} The source configuration that will be used to create the vector layer.
   */
  protected override createVectorSource(
    layerConfig: AbstractBaseLayerEntryConfig,
    sourceOptions: SourceOptions<Feature> = {},
    readOptions: ReadOptions = {}
  ): VectorSource<Feature> {
    // eslint-disable-next-line no-param-reassign
    readOptions.dataProjection = (layerConfig.source as TypeBaseVectorSourceInitialConfig).dataProjection;
    // eslint-disable-next-line no-param-reassign
    sourceOptions.url = layerConfig.source!.dataAccessPath;
    // eslint-disable-next-line no-param-reassign
    sourceOptions.format = new FormatGeoJSON();
    const vectorSource = super.createVectorSource(layerConfig, sourceOptions, readOptions);
    return vectorSource;
  }
}

/**
 * type guard function that redefines a CsvLayerEntryConfig as a TypeCSVLayerConfig if the geoviewLayerType attribute of the
 * verifyIfLayer parameter is CSV. The type ascention applies only to the true block of the if clause that use this
 * function.
 *
 * @param {TypeGeoviewLayerConfig} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const layerConfigIsCSV = (verifyIfLayer: TypeGeoviewLayerConfig): verifyIfLayer is TypeCSVLayerConfig => {
  return verifyIfLayer?.geoviewLayerType === CONST_LAYER_TYPES.CSV;
};

/**
 * type guard function that redefines a TypeLayerEntryConfig as a TypeCsvLayerEntryConfig if the geoviewLayerType attribute of
 * the verifyIfGeoViewEntry.geoviewLayerConfig attribute is CSV. The type ascention applies only to the true block of the if
 * clause that use this function.
 *
 * @param {TypeLayerEntryConfig} verifyIfGeoViewEntry Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const geoviewEntryIsCSV = (verifyIfGeoViewEntry: TypeLayerEntryConfig): verifyIfGeoViewEntry is CsvLayerEntryConfig => {
  return verifyIfGeoViewEntry?.geoviewLayerConfig?.geoviewLayerType === CONST_LAYER_TYPES.CSV;
};
