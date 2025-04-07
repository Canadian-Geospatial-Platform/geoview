import { Options as SourceOptions } from 'ol/source/Vector';
import { GeoJSON as FormatGeoJSON } from 'ol/format';
import { ReadOptions } from 'ol/format/Feature';
import { Vector as VectorSource } from 'ol/source';
import Feature from 'ol/Feature';

// import { layerEntryIsGroupLayer } from '@config/types/type-guards';

import { Cast, TypeJsonObject } from '@config/types/config-types';
import { AbstractGeoViewLayer, CONST_LAYER_TYPES } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { AbstractGeoViewVector } from '@/geo/layer/geoview-layers/vector/abstract-geoview-vector';
import {
  TypeLayerEntryConfig,
  TypeVectorSourceInitialConfig,
  TypeGeoviewLayerConfig,
  TypeBaseSourceVectorInitialConfig,
  layerEntryIsGroupLayer,
} from '@/geo/map/map-schema-types';
import { CsvLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-validation-classes/csv-layer-entry-config';
import { VectorLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-layer-entry-config';
import { AbstractBaseLayerEntryConfig } from '@/core/utils/config/validation-classes/abstract-base-layer-entry-config';

// GV: CONFIG EXTRACTION
// GV: This section of code was extracted and copied to the geoview config section
// GV: |||||
// GV: vvvvv

export interface TypeSourceCSVInitialConfig extends Omit<TypeVectorSourceInitialConfig, 'format'> {
  format: 'CSV';
  separator?: ',';
}

export interface TypeCSVLayerConfig extends Omit<TypeGeoviewLayerConfig, 'listOfLayerEntryConfig'> {
  geoviewLayerType: typeof CONST_LAYER_TYPES.CSV;
  listOfLayerEntryConfig: CsvLayerEntryConfig[];
}

/** *****************************************************************************************************************************
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

// GV: ^^^^^
// GV: |||||

/** *****************************************************************************************************************************
 * type guard function that redefines an AbstractGeoViewLayer as a CSV if the type attribute of the verifyIfGeoViewLayer
 * parameter is CSV. The type ascention applies only to the true block of the if clause that use this function.
 *
 * @param {AbstractGeoViewLayer} verifyIfGeoViewLayer Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const geoviewLayerIsCSV = (verifyIfGeoViewLayer: AbstractGeoViewLayer): verifyIfGeoViewLayer is CSV => {
  return verifyIfGeoViewLayer?.type === CONST_LAYER_TYPES.CSV;
};

/** *****************************************************************************************************************************
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

/** *****************************************************************************************************************************
 * Class used to add CSV layer to the map
 *
 * @exports
 * @class CSV
 */
export class CSV extends AbstractGeoViewVector {
  /** ***************************************************************************************************************************
   * Initialize layer
   *
   * @param {string} mapId the id of the map
   * @param {TypeCSVLayerConfig} layerConfig the layer configuration
   */
  constructor(mapId: string, layerConfig: TypeCSVLayerConfig) {
    super(CONST_LAYER_TYPES.CSV, layerConfig, mapId);
  }

  /** ***************************************************************************************************************************
   * CSV has no metadata.
   *
   * @returns {Promise<void>} A promise that the execution is completed.
   */
  protected override fetchServiceMetadata(): Promise<void> {
    // Return resolved promise
    return Promise.resolve();
  }

  /** ***************************************************************************************************************************
   * This method recursively validates the layer configuration entries by filtering and reporting invalid layers. If needed,
   * extra configuration may be done here.
   *
   * @param {TypeLayerEntryConfig[]} listOfLayerEntryConfig The list of layer entries configuration to validate.
   */
  protected validateListOfLayerEntryConfig(listOfLayerEntryConfig: TypeLayerEntryConfig[]): void {
    listOfLayerEntryConfig.forEach((layerConfig: TypeLayerEntryConfig) => {
      const { layerPath } = layerConfig;
      if (layerEntryIsGroupLayer(layerConfig)) {
        this.validateListOfLayerEntryConfig(layerConfig.listOfLayerEntryConfig!);
        if (!layerConfig.listOfLayerEntryConfig.length) {
          // Add a layer load error
          this.addLayerLoadError(layerConfig, `Empty layer group (mapId:  ${this.mapId}, layerPath: ${layerPath})`);
        }
        return;
      }

      // When no metadata are provided, all layers are considered valid.
      if (!this.metadata) return;

      throw new Error(
        `Invalid CSV metadata (listOfLayerEntryConfig) prevent loading of layer (mapId:  ${this.mapId}, layerPath: ${layerPath})`
      );
    });
  }

  /** ***************************************************************************************************************************
   * Metadata is processed when parsing the file.
   *
   * @param {AbstractBaseLayerEntryConfig} layerConfig The layer entry configuration to process.
   *
   * @returns {Promise<AbstractBaseLayerEntryConfig>} A promise that the vector layer configuration has its metadata processed.
   */
  protected override onProcessLayerMetadata(layerConfig: AbstractBaseLayerEntryConfig): Promise<AbstractBaseLayerEntryConfig> {
    // Instance check
    if (!(layerConfig instanceof VectorLayerEntryConfig)) throw new Error('Invalid layer configuration type provided');

    // process the feature info configuration and attach the config to the instance for access by parent class
    this.setLayerMetadata(layerConfig.layerPath, Cast<TypeJsonObject>(layerConfig));
    return Promise.resolve(layerConfig);
  }

  /** ***************************************************************************************************************************
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
    readOptions.dataProjection = (layerConfig.source as TypeBaseSourceVectorInitialConfig).dataProjection;
    // eslint-disable-next-line no-param-reassign
    sourceOptions.url = layerConfig.source!.dataAccessPath;
    // eslint-disable-next-line no-param-reassign
    sourceOptions.format = new FormatGeoJSON();
    const vectorSource = super.createVectorSource(layerConfig, sourceOptions, readOptions);
    return vectorSource;
  }
}
