/* eslint-disable no-underscore-dangle, no-param-reassign */
// We have a lot of private function with functions with dangle and many reassigns. We keep it global...
// TODO: refactor - clean the code to minimize esLint warning
import { Extent } from 'ol/extent';

import Ajv from 'ajv';
import { AnyValidateFunction } from 'ajv/dist/types';

import defaultsDeep from 'lodash/defaultsDeep';

import { TypeBasemapId, TypeBasemapOptions, VALID_BASEMAP_ID } from '@/geo/layer/basemap/basemap-types';
import { geoviewEntryIsWMS } from '@/geo/layer/geoview-layers/raster/wms';
import { geoviewEntryIsImageStatic } from '@/geo/layer/geoview-layers/raster/image-static';
import { geoviewEntryIsXYZTiles } from '@/geo/layer/geoview-layers/raster/xyz-tiles';
import { geoviewEntryIsVectorTiles } from '@/geo/layer/geoview-layers/raster/vector-tiles';
import { geoviewEntryIsEsriDynamic } from '@/geo/layer/geoview-layers/raster/esri-dynamic';
import { geoviewEntryIsEsriFeature } from '@/geo/layer/geoview-layers/vector/esri-feature';
import { geoviewEntryIsWFS } from '@/geo/layer/geoview-layers/vector/wfs';
import { geoviewEntryIsOgcFeature } from '@/geo/layer/geoview-layers/vector/ogc-feature';
import { geoviewEntryIsGeoJSON } from '@/geo/layer/geoview-layers/vector/geojson';
import { geoviewEntryIsCSV } from '@/geo/layer/geoview-layers/vector/csv';
import { geoviewEntryIsGeoPackage } from '@/geo/layer/geoview-layers/vector/geopackage';
import {
  layerEntryIsGroupLayer,
  TypeGeoviewLayerConfig,
  TypeDisplayLanguage,
  TypeLocalizedString,
  TypeValidMapProjectionCodes,
  TypeValidVersions,
  TypeListOfLayerEntryConfig,
  VALID_DISPLAY_LANGUAGE,
  VALID_PROJECTION_CODES,
  VALID_VERSIONS,
  TypeListOfGeoviewLayerConfig,
  TypeListOfLocalizedLanguages,
  MapConfigLayerEntry,
  mapConfigLayerEntryIsGeoCore,
} from '@/geo/map/map-schema-types';
import { Cast, toJsonObject, TypeJsonObject, TypeMapFeaturesConfig } from '@/core/types/global-types';
import { CONST_GEOVIEW_SCHEMA_BY_TYPE, CONST_LAYER_TYPES, TypeGeoviewLayerType } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { geoviewEntryIsEsriImage } from '@/geo/layer/geoview-layers/raster/esri-image';
import { logger } from '@/core/utils/logger';

import { generateId, replaceParams, getLocalizedMessage, showError } from '../utilities';
import schema from '../../../../schema.json';
import { WfsLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-validation-classes/wfs-layer-entry-config';
import { OgcFeatureLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-validation-classes/ogc-layer-entry-config';
import { CsvLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-validation-classes/csv-layer-entry-config';
import { VectorTilesLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/vector-tiles-layer-entry-config';
import { GeoJSONLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-validation-classes/geojson-layer-entry-config';
import { EsriFeatureLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-validation-classes/esri-feature-layer-entry-config';
import { GeoPackageLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-validation-classes/geopackage-layer-config-entry';
import { XYZTilesLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/xyz-layer-entry-config';
import { OgcWmsLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/ogc-wms-layer-entry-config';
import { ImageStaticLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/image-static-layer-entry-config';
import { EsriDynamicLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/esri-dynamic-layer-entry-config';
import { EsriImageLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/esri-image-layer-entry-config';
import { GroupLayerEntryConfig } from '@/core/utils/config/validation-classes/group-layer-entry-config';
import { ConfigBaseClass } from '@/core/utils/config/validation-classes/config-base-class';
import { CONFIG_GEOCORE_URL, CONFIG_GEOLOCATOR_URL } from '../constant';

// ******************************************************************************************************************************
// ******************************************************************************************************************************
/** *****************************************************************************************************************************
 * A class to define the default values of a GeoView map configuration and validation methods for the map config attributes.
 * @exports
 * @class DefaultConfig
 */
// ******************************************************************************************************************************
export class ConfigValidation {
  /** The map ID associated to the configuration. If it is undefined, a unique value will be generated and assign to it. */
  private _mapId: string;

  /** The triggerReadyCallback flag associated to the configuration. Default value is false. */
  private _triggerReadyCallback: boolean;

  /** The language that will be used to display the GeoView layer. */
  private _displayLanguage: TypeDisplayLanguage;

  /** default configuration if provided configuration is missing or wrong */
  #defaultMapFeaturesConfig: TypeMapFeaturesConfig = {
    mapId: '',
    map: {
      interaction: 'dynamic',
      viewSettings: {
        zoom: 4,
        center: [-100, 60],
        projection: 3978,
        enableRotation: true,
        rotation: 0,
      },
      basemapOptions: {
        basemapId: 'transport',
        shaded: true,
        labeled: true,
      },
      listOfGeoviewLayerConfig: [],
      extraOptions: {},
    },
    theme: 'dark',
    components: [],
    appBar: { tabs: { core: ['geolocator'] } },
    navBar: ['zoom', 'fullscreen', 'home'],
    corePackages: [],
    overviewMap: undefined,
    serviceUrls: {
      geocoreUrl: CONFIG_GEOCORE_URL,
      geolocator: CONFIG_GEOLOCATOR_URL,
    },
    displayLanguage: 'en',
    triggerReadyCallback: false,
    suportedLanguages: ['en', 'fr'],
    schemaVersionUsed: '1.0',
  };

  // valid basemap ids
  private _basemapId: Record<TypeValidMapProjectionCodes, TypeBasemapId[]> = {
    3857: VALID_BASEMAP_ID,
    3978: VALID_BASEMAP_ID,
  };

  // valid shaded basemap values for each projection
  private _basemapShaded: Record<TypeValidMapProjectionCodes, boolean[]> = {
    3857: [true, false],
    3978: [true, false],
  };

  // valid labeled basemap values for each projection
  private _basemaplabeled: Record<TypeValidMapProjectionCodes, boolean[]> = {
    3857: [true, false],
    3978: [true, false],
  };

  // valid center levels from each projection
  private _center: Record<TypeValidMapProjectionCodes, Record<string, number[]>> = {
    3857: { lat: [-90, 90], long: [-180, 180] },
    3978: { lat: [40, 90], long: [-140, 40] },
  };

  /** ***************************************************************************************************************************
   * The ConfigValidation class constructor used to instanciate an object of this type.
   *
   * @returns {ConfigValidation} An ConfigValidation instance.
   */
  constructor() {
    this._mapId = generateId();
    this.#defaultMapFeaturesConfig.mapId = this.mapId;
    this._displayLanguage = this.#defaultMapFeaturesConfig.displayLanguage!;
    this._triggerReadyCallback = this.#defaultMapFeaturesConfig.triggerReadyCallback!;
  }

  /** ***************************************************************************************************************************
   * Get map features configuration object.
   *
   * @returns {TypeMapFeaturesConfig} The map features configuration.
   */
  get defaultMapFeaturesConfig(): TypeMapFeaturesConfig {
    this.#defaultMapFeaturesConfig.mapId = generateId();
    return this.#defaultMapFeaturesConfig;
  }

  /** ***************************************************************************************************************************
   * Get mapId value.
   *
   * @returns {string} The ID of the Geoview map.
   */
  get mapId(): string {
    return this._mapId;
  }

  /** ***************************************************************************************************************************
   * Set mapId value.
   * @param {string} mapId The ID of the Geoview map.
   */
  set mapId(mapId: string) {
    this._mapId = mapId;
    this.#defaultMapFeaturesConfig.mapId = this.mapId;
  }

  /** ***************************************************************************************************************************
   * Get triggerReadyCallback value.
   *
   * @returns {boolean} The triggerReadyCallback flag of the Geoview map.
   */
  get triggerReadyCallback(): boolean {
    return this._triggerReadyCallback;
  }

  /** ***************************************************************************************************************************
   * Set triggerReadyCallback value.
   * @param {boolean} triggerReadyCallback The value to assign to the triggerReadyCallback flag for the Geoview map.
   */
  set triggerReadyCallback(triggerReadyCallback: boolean) {
    this._triggerReadyCallback = triggerReadyCallback;
  }

  /** ***************************************************************************************************************************
   * Get displayLanguage value.
   *
   * @returns {TypeDisplayLanguage} The display language of the Geoview map.
   */
  get displayLanguage(): TypeDisplayLanguage {
    return this._displayLanguage;
  }

  /** ***************************************************************************************************************************
   * Set displayLanguage value.
   * @param {TypeDisplayLanguage} displayLanguage The display language of the Geoview map.
   */
  set displayLanguage(displayLanguage: TypeDisplayLanguage) {
    this._displayLanguage = this.validateDisplayLanguage(displayLanguage);
  }

  /** ***************************************************************************************************************************
   * Validate basemap options.
   * @param {TypeValidMapProjectionCodes} projection The projection code of the basemap.
   * @param {TypeBasemapOptions} basemapOptions The basemap options to validate.
   *
   * @returns {TypeBasemapOptions} A valid basemap options.
   */
  validateBasemap(projection?: TypeValidMapProjectionCodes, basemapOptions?: TypeBasemapOptions): TypeBasemapOptions {
    if (projection && basemapOptions) {
      const basemapId = this._basemapId[projection].includes(basemapOptions.basemapId)
        ? basemapOptions.basemapId
        : this.#defaultMapFeaturesConfig.map.basemapOptions.basemapId;
      const shaded = this._basemapShaded[projection].includes(basemapOptions.shaded)
        ? basemapOptions.shaded
        : this.#defaultMapFeaturesConfig.map.basemapOptions.shaded;
      const labeled = this._basemaplabeled[projection].includes(basemapOptions.labeled)
        ? basemapOptions.labeled
        : this.#defaultMapFeaturesConfig.map.basemapOptions.labeled;

      return { basemapId, shaded, labeled };
    }
    return this.#defaultMapFeaturesConfig.map.basemapOptions;
  }

  /** ***************************************************************************************************************************
   * Validate map version.
   * @param {TypeValidVersions} version The version to validate.
   *
   * @returns {TypeValidVersions} A valid version.
   */
  validateVersion(version?: TypeValidVersions): TypeValidVersions {
    return version && VALID_VERSIONS.includes(version) ? version : this.#defaultMapFeaturesConfig.schemaVersionUsed!;
  }

  /** ***************************************************************************************************************************
   * Validate map config language.
   * @param {TypeDisplayLanguage} language The language to validate.
   *
   * @returns {TypeDisplayLanguage} A valid language.
   */
  validateDisplayLanguage(language?: TypeDisplayLanguage): TypeDisplayLanguage {
    if (language && VALID_DISPLAY_LANGUAGE.includes(language)) return language;

    logger.logWarning(
      `- Map: ${this.mapId} - Invalid display language code ${language} replaced by ${this.#defaultMapFeaturesConfig.displayLanguage} -`
    );
    return this.#defaultMapFeaturesConfig.displayLanguage!;
  }

  /** ***************************************************************************************************************************
   * Validate zoom level.
   * @param {number} zoom The zoom level to validate.
   *
   * @returns {number} A valid zoom level.
   */
  private validateZoom(zoom?: number): number {
    return zoom && !Number.isNaN(zoom) && zoom >= 0 && zoom <= 18 ? zoom : this.#defaultMapFeaturesConfig.map.viewSettings.zoom;
  }

  /** ***************************************************************************************************************************
   * Validate min zoom level.
   * @param {number} zoom The zoom level to validate.
   *
   * @returns {number} A valid zoom level.
   */
  private validateMinZoom(zoom?: number): number | undefined {
    return zoom && !Number.isNaN(zoom) && zoom >= 0 && zoom <= 18 ? zoom : undefined;
  }

  /** ***************************************************************************************************************************
   * Validate max zoom level.
   * @param {number} zoom The zoom level to validate.
   *
   * @returns {number} A valid zoom level.
   */
  private validateMaxZoom(zoom?: number): number | undefined {
    return zoom && !Number.isNaN(zoom) && zoom >= 0 && zoom <= 18 ? zoom : undefined;
  }

  /** ***************************************************************************************************************************
   * Validate projection.
   * @param {TypeValidMapProjectionCodes} projection The projection to validate.
   *
   * @returns {TypeValidMapProjectionCodes} A valid projection.
   */
  private validateProjection(projection?: TypeValidMapProjectionCodes): TypeValidMapProjectionCodes {
    return projection && VALID_PROJECTION_CODES.includes(projection)
      ? projection
      : this.#defaultMapFeaturesConfig.map.viewSettings.projection;
  }

  /** ***************************************************************************************************************************
   * Validate the center.
   * @param {TypeValidMapProjectionCodes} projection The projection used by the map.
   * @param {[number, number]} center The map center to validate.
   *
   * @returns {[number, number]} A valid map center.
   */
  private validateCenter(projection?: TypeValidMapProjectionCodes, center?: [number, number]): [number, number] {
    if (projection && center) {
      const xVal = Number(center[0]);
      const yVal = Number(center[1]);

      const x =
        !Number.isNaN(xVal) && xVal > this._center[projection].long[0] && xVal < this._center[projection].long[1]
          ? xVal
          : this.#defaultMapFeaturesConfig.map.viewSettings.center[0];
      const y =
        !Number.isNaN(yVal) && yVal > this._center[projection].lat[0] && yVal < this._center[projection].lat[1]
          ? yVal
          : this.#defaultMapFeaturesConfig.map.viewSettings.center[1];

      return [x, y];
    }
    return this.#defaultMapFeaturesConfig.map.viewSettings.center;
  }

  /** ***************************************************************************************************************************
   * Validate the extent.
   * @param {TypeValidMapProjectionCodes} projection The projection used by the map.
   * @param {[number, number, number, number]} extent The map extent to valdate.
   * @param {[number, number]} center The map extent to validate.
   *
   * @returns {[number, number, number, number]} A valid map extent.
   */
  private validateExtent(
    projection: TypeValidMapProjectionCodes,
    extent: [number, number, number, number],
    center: [number, number]
  ): Extent | undefined {
    if (projection && extent) {
      const [extentMinX, extentMinY, extentMaxX, extentMaxY] = extent;
      const minX = !Number.isNaN(extentMinX) && extentMinX < center[0] ? extentMinX : this._center[projection].long[0];
      const minY = !Number.isNaN(extentMinY) && extentMinY < center[1] ? extentMinY : this._center[projection].lat[0];
      const maxX = !Number.isNaN(extentMaxX) && extentMaxX > center[0] ? extentMaxX : this._center[projection].long[1];
      const maxY = !Number.isNaN(extentMaxY) && extentMaxY > center[1] ? extentMaxY : this._center[projection].lat[1];

      return [minX, minY, maxX, maxY] as Extent;
    }
    return undefined;
  }

  /** ***************************************************************************************************************************
   * Print a trace to help locate schema errors.
   * @param {AnyValidateFunction<unknown>} validate The Ajv validator.
   * @param {any} objectAffected Object that was validated.
   */
  private printSchemaError(validate: AnyValidateFunction<unknown>, objectAffected: unknown) {
    for (let i = 0; i < validate.errors!.length; i += 1) {
      const error = validate.errors![i];
      const { instancePath } = error;
      const path = instancePath.split('/');
      let node = objectAffected as TypeJsonObject;
      for (let j = 1; j < path.length; j += 1) {
        node = node[path[j]];
      }
      logger.logWarning(this.mapId, '='.repeat(200), 'Schema error: ', this.mapId, error, 'Object affected: ', this.mapId, node);
    }

    setTimeout(() => {
      showError(this.mapId, getLocalizedMessage(this.mapId, 'validation.schema.notFound'));
    }, 2000);
  }

  /** ***************************************************************************************************************************
   * Validate the configuration of the map features against the TypeMapFeaturesInstance defined in the schema.
   * @param {TypeMapFeaturesConfig} mapFeaturesConfigToValidate The map features configuration to validate.
   * @param {Ajv} validator The schema validator to use.
   *
   * @returns {TypeMapFeaturesConfig} A valid map features configuration.
   */
  private IsValidTypeMapFeaturesInstance(mapFeaturesConfigToValidate: TypeMapFeaturesConfig, validator: Ajv): boolean {
    const schemaPath = 'https://cgpv/schema#/definitions/TypeMapFeaturesInstance';
    const validate = validator.getSchema(schemaPath);

    if (!validate) {
      setTimeout(() => {
        const message = replaceParams([schemaPath], getLocalizedMessage(this.mapId, 'validation.schema.wrongPath'));
        logger.logWarning(`- Map ${this.mapId}: ${message}`);
        showError(this.mapId, message);
      }, 2000);
      return false;
    }

    // validate configuration
    const valid = validate({ ...mapFeaturesConfigToValidate });

    if (!valid) {
      this.printSchemaError(validate, mapFeaturesConfigToValidate);
      return false;
    }
    return true;
  }

  /** ***************************************************************************************************************************
   * Validate the configuration of the map features against the TypeMapFeaturesInstance defined in the schema.
   * @param {TypeGeoviewLayerType} geoviewLayerType The GeoView layer type to validate.
   * @param {TypeListOfLayerEntryConfig} listOfLayerEntryConfig The list of layer entry configurations to validate.
   * @param {Ajv} validator The schema validator to use.
   *
   * @returns {TypeMapFeaturesConfig} A valid map features configuration.
   */
  private IsValidTypeListOfLayerEntryConfig(
    geoviewLayerType: TypeGeoviewLayerType,
    listOfLayerEntryConfig: TypeListOfLayerEntryConfig,
    validator: Ajv
  ): boolean {
    const layerSchemaPath = `https://cgpv/schema#/definitions/${CONST_GEOVIEW_SCHEMA_BY_TYPE[geoviewLayerType]}`;
    const groupSchemaPath = `https://cgpv/schema#/definitions/TypeLayerGroupEntryConfig`;

    for (let i = 0; i < listOfLayerEntryConfig.length; i++) {
      const schemaPath = layerEntryIsGroupLayer(listOfLayerEntryConfig[i] as ConfigBaseClass) ? groupSchemaPath : layerSchemaPath;
      const validate = validator.getSchema(schemaPath);

      if (!validate) {
        setTimeout(() => {
          const message = replaceParams([schemaPath], getLocalizedMessage(this.mapId, 'validation.schema.wrongPath'));
          logger.logWarning(`- Map ${this.mapId}: ${message}`);
          showError(this.mapId, message);
        }, 2000);
        return false;
      }
      // validate configuration
      const valid = validate(listOfLayerEntryConfig[i]);

      if (!valid) {
        this.printSchemaError(validate, listOfLayerEntryConfig[i]);
        return false;
      }
    }

    for (let i = 0; i < listOfLayerEntryConfig.length; i++) {
      const layerEntryConfig = listOfLayerEntryConfig[i];
      if (
        layerEntryIsGroupLayer(layerEntryConfig) &&
        !this.IsValidTypeListOfLayerEntryConfig(geoviewLayerType, layerEntryConfig.listOfLayerEntryConfig!, validator)
      )
        return false;
    }
    return true;
  }

  /** ***************************************************************************************************************************
   * Validate the map features configuration.
   * @param {TypeMapFeaturesConfig} mapFeaturesConfigToValidate The map features configuration to validate.
   *
   * @returns {TypeMapFeaturesConfig} A valid map features configuration.
   */
  validateMapConfigAgainstSchema(mapFeaturesConfigToValidate?: TypeMapFeaturesConfig): TypeMapFeaturesConfig {
    let validMapFeaturesConfig: TypeMapFeaturesConfig;

    // if config has been provided by user then validate it
    if (mapFeaturesConfigToValidate) {
      // if the list of layer doesn't exist, add the key with empty array for the map to trigger
      if (mapFeaturesConfigToValidate.map.listOfGeoviewLayerConfig === undefined)
        mapFeaturesConfigToValidate.map.listOfGeoviewLayerConfig = [];

      // create a validator object
      const validator = new Ajv({
        strict: false,
        allErrors: false,
      });

      // initialize validator with schema file
      validator.compile(schema);

      let isValid = this.IsValidTypeMapFeaturesInstance(mapFeaturesConfigToValidate, validator);
      for (let i = 0; i < mapFeaturesConfigToValidate.map.listOfGeoviewLayerConfig.length && isValid; i++) {
        // If not GeoCore, validate the geoview configuration with the schema.
        // GeoCore doesn't have schema validation as part of the routine below, because they're not a TypeGeoviewLayerType anymore
        if (!mapConfigLayerEntryIsGeoCore(mapFeaturesConfigToValidate.map.listOfGeoviewLayerConfig[i])) {
          const gvLayerConfigCasted = mapFeaturesConfigToValidate.map.listOfGeoviewLayerConfig[i] as TypeGeoviewLayerConfig;
          isValid = this.IsValidTypeListOfLayerEntryConfig(
            gvLayerConfigCasted.geoviewLayerType,
            gvLayerConfigCasted.listOfLayerEntryConfig,
            validator
          );
        }
      }

      if (!isValid) {
        validMapFeaturesConfig = {
          ...this.adjustMapConfiguration(mapFeaturesConfigToValidate),
          mapId: this.mapId,
          displayLanguage: this._displayLanguage as TypeDisplayLanguage,
        };
      } else {
        validMapFeaturesConfig = {
          ...this.adjustMapConfiguration(mapFeaturesConfigToValidate),
          mapId: this.mapId,
          displayLanguage: this._displayLanguage as TypeDisplayLanguage,
        };
      }
    } else {
      validMapFeaturesConfig = {
        ...this.#defaultMapFeaturesConfig,
        mapId: this.mapId,
        displayLanguage: this._displayLanguage as TypeDisplayLanguage,
      };
    }
    this.processLocalizedString(validMapFeaturesConfig.suportedLanguages, validMapFeaturesConfig.map.listOfGeoviewLayerConfig);
    this.doExtraValidation(validMapFeaturesConfig.map.listOfGeoviewLayerConfig);

    return validMapFeaturesConfig;
  }

  /** ***************************************************************************************************************************
   * Validate and adjust the list of GeoView layer configuration.
   * @param {TypeListOfLocalizedLanguages} suportedLanguages The list of supported languages.
   * @param {TypeListOfGeoviewLayerConfig} listOfGeoviewLayerConfig The list of GeoView layer configuration to adjust and
   * validate.
   */
  validateListOfGeoviewLayerConfig(
    suportedLanguages: TypeListOfLocalizedLanguages,
    listOfGeoviewLayerConfig?: TypeListOfGeoviewLayerConfig
  ): void {
    this.processLocalizedString(suportedLanguages, listOfGeoviewLayerConfig);
    this.doExtraValidation(listOfGeoviewLayerConfig);
  }

  /** ***************************************************************************************************************************
   * Do extra validation that schema can not do.
   * @param {MapConfigLayerEntry[]} listOfMapConfigLayerEntry The list of Map Config Layer Entry configuration to adjust and
   * validate.
   */
  private doExtraValidation(listOfMapConfigLayerEntry?: MapConfigLayerEntry[]) {
    if (listOfMapConfigLayerEntry) {
      listOfMapConfigLayerEntry
        .filter((geoviewLayerConfig) => !mapConfigLayerEntryIsGeoCore(geoviewLayerConfig))
        .forEach((geoviewLayerConfig) => {
          // The default value for geoviewLayerConfig.initialSettings.visible is true.
          const geoviewLayerConfigCasted = geoviewLayerConfig as TypeGeoviewLayerConfig;
          if (!geoviewLayerConfigCasted.initialSettings) geoviewLayerConfigCasted.initialSettings = { states: { visible: true } };
          switch (geoviewLayerConfig.geoviewLayerType) {
            case CONST_LAYER_TYPES.CSV:
            case CONST_LAYER_TYPES.GEOJSON:
            case CONST_LAYER_TYPES.XYZ_TILES:
            case CONST_LAYER_TYPES.VECTOR_TILES:
            case CONST_LAYER_TYPES.GEOPACKAGE:
            case CONST_LAYER_TYPES.IMAGE_STATIC:
              this.geoviewLayerIdIsMandatory(geoviewLayerConfigCasted);
              this.processLayerEntryConfig(geoviewLayerConfigCasted, geoviewLayerConfigCasted.listOfLayerEntryConfig);
              break;
            case CONST_LAYER_TYPES.ESRI_DYNAMIC:
            case CONST_LAYER_TYPES.ESRI_FEATURE:
            case CONST_LAYER_TYPES.ESRI_IMAGE:
            case CONST_LAYER_TYPES.OGC_FEATURE:
            case CONST_LAYER_TYPES.WFS:
            case CONST_LAYER_TYPES.WMS:
              this.geoviewLayerIdIsMandatory(geoviewLayerConfigCasted);
              this.metadataAccessPathIsMandatory(geoviewLayerConfigCasted);
              this.processLayerEntryConfig(geoviewLayerConfigCasted, geoviewLayerConfigCasted.listOfLayerEntryConfig);
              break;
            default:
              throw new Error('Your not supposed to end here. There is a problem with the schema validator.');
          }
        });
    }
  }

  /** ***************************************************************************************************************************
   * Verify that the metadataAccessPath has a value.
   * @param {TypeGeoviewLayerConfig} geoviewLayerConfig The GeoView layer configuration to validate.
   */
  private metadataAccessPathIsMandatory(geoviewLayerConfig: TypeGeoviewLayerConfig) {
    if (!geoviewLayerConfig.metadataAccessPath) {
      throw new Error(
        `metadataAccessPath is mandatory for GeoView layer ${geoviewLayerConfig.geoviewLayerId} of type ${geoviewLayerConfig.geoviewLayerType}.`
      );
    }
  }

  /** ***************************************************************************************************************************
   * Verify that the geoviewLayerId has a value.
   * @param {TypeGeoviewLayerConfig} geoviewLayerConfig The GeoView layer configuration to validate.
   */
  private geoviewLayerIdIsMandatory(geoviewLayerConfig: TypeGeoviewLayerConfig) {
    if (!geoviewLayerConfig.geoviewLayerId) {
      throw new Error(`geoviewLayerId is mandatory for GeoView layer of type ${geoviewLayerConfig.geoviewLayerType}.`);
    }
  }

  /** ***************************************************************************************************************************
   * Process recursively the layer entries to create layers and layer groups.
   * @param {TypeGeoviewLayerConfig} geoviewLayerConfig The GeoView layer configuration to adjust and validate.
   * @param {TypeListOfLayerEntryConfig} listOfLayerEntryConfig The list of layer entry configurations to process.
   * @param {GroupLayerEntryConfig} parentLayerConfig The parent layer path.
   */
  private processLayerEntryConfig(
    geoviewLayerConfig: TypeGeoviewLayerConfig,
    listOfLayerEntryConfig: TypeListOfLayerEntryConfig,
    parentLayerConfig?: GroupLayerEntryConfig
  ) {
    for (let i = 0; i < listOfLayerEntryConfig.length; i++) {
      (listOfLayerEntryConfig[i] as ConfigBaseClass).geoviewLayerConfig = geoviewLayerConfig;
      // The following line sets the layerPath of the config
      const layerConfig = new ConfigBaseClass(
        listOfLayerEntryConfig[i] as ConfigBaseClass,
        parentLayerConfig?.layerPath || geoviewLayerConfig.geoviewLayerId
      );
      if (layerEntryIsGroupLayer(layerConfig)) {
        const groupLayerConfig = new GroupLayerEntryConfig(layerConfig as GroupLayerEntryConfig, layerConfig.parentLayerConfig!);
        listOfLayerEntryConfig[i] = groupLayerConfig;
        this.processLayerEntryConfig(geoviewLayerConfig, groupLayerConfig.listOfLayerEntryConfig, groupLayerConfig);
      } else if (geoviewEntryIsWMS(layerConfig)) {
        listOfLayerEntryConfig[i] = new OgcWmsLayerEntryConfig(layerConfig);
      } else if (geoviewEntryIsImageStatic(layerConfig)) {
        listOfLayerEntryConfig[i] = new ImageStaticLayerEntryConfig(layerConfig);
      } else if (geoviewEntryIsXYZTiles(layerConfig)) {
        listOfLayerEntryConfig[i] = new XYZTilesLayerEntryConfig(layerConfig);
      } else if (geoviewEntryIsVectorTiles(layerConfig)) {
        listOfLayerEntryConfig[i] = new VectorTilesLayerEntryConfig(layerConfig);
      } else if (geoviewEntryIsEsriDynamic(layerConfig)) {
        listOfLayerEntryConfig[i] = new EsriDynamicLayerEntryConfig(layerConfig as EsriDynamicLayerEntryConfig);
      } else if (geoviewEntryIsEsriFeature(layerConfig)) {
        listOfLayerEntryConfig[i] = new EsriFeatureLayerEntryConfig(layerConfig);
      } else if (geoviewEntryIsEsriImage(layerConfig)) {
        listOfLayerEntryConfig[i] = new EsriImageLayerEntryConfig(layerConfig);
      } else if (geoviewEntryIsWFS(layerConfig)) {
        listOfLayerEntryConfig[i] = new WfsLayerEntryConfig(layerConfig);
      } else if (geoviewEntryIsOgcFeature(layerConfig)) {
        listOfLayerEntryConfig[i] = new OgcFeatureLayerEntryConfig(layerConfig);
      } else if (geoviewEntryIsGeoPackage(layerConfig)) {
        listOfLayerEntryConfig[i] = new GeoPackageLayerEntryConfig(layerConfig);
      } else if (geoviewEntryIsGeoJSON(layerConfig)) {
        listOfLayerEntryConfig[i] = new GeoJSONLayerEntryConfig(layerConfig);
      } else if (geoviewEntryIsCSV(layerConfig)) {
        listOfLayerEntryConfig[i] = new CsvLayerEntryConfig(layerConfig);
      } else {
        // Unknown
        logger.logWarning('Unknown layer entry config type', layerConfig);
        return;
      }
      layerConfig.initialSettings = defaultsDeep(
        layerConfig.initialSettings,
        parentLayerConfig?.initialSettings || layerConfig.geoviewLayerConfig?.initialSettings
      );
    }
  }

  // TODO: DELETE THIS
  /*
  / ** ***************************************************************************************************************************
   * Process recursively the layer entries to set the parents of each entries.
   * @param {TypeGeoviewLayerConfig} geoviewLayerConfig The GeoView layer configuration.
   * @param {TypeListOfLayerEntryConfig} listOfLayerEntryConfig The list of layer entry configurations to process.
   * @param {GroupLayerEntryConfig} parentLayerConfig The parent layer configuration of all the
   * layer configurations found in the list of layer entries.
   * /
  private recursivelySetChildParent(
    geoviewLayerConfig: TypeGeoviewLayerConfig,
    listOfLayerEntryConfig: TypeListOfLayerEntryConfig,
    parentLayerConfig?: GroupLayerEntryConfig
  ) {
    listOfLayerEntryConfig.forEach((layerConfig) => {
      layerConfig.parentLayerConfig = parentLayerConfig;
      layerConfig.geoviewLayerConfig = geoviewLayerConfig;
      if (layerEntryIsGroupLayer(layerConfig))
        this.recursivelySetChildParent(geoviewLayerConfig, layerConfig.listOfLayerEntryConfig!, layerConfig as GroupLayerEntryConfig);
    });
  }
  */

  /** ***************************************************************************************************************************
   * Synchronize the English and French strings.
   * @param {TypeLocalizedString} localizedString The localized string to synchronize the en and fr string.
   * @param {TypeDisplayLanguage} sourceKey The source's key.
   * @param {TypeDisplayLanguage} destinationKey The destination's key.
   *
   * @returns {TypeMapFeaturesConfig} A valid JSON configuration object.
   */
  private SynchronizeLocalizedString(
    localizedString: TypeLocalizedString,
    sourceKey: TypeDisplayLanguage,
    destinationKey: TypeDisplayLanguage
  ) {
    localizedString[destinationKey] = localizedString[sourceKey];
  }

  /** ***************************************************************************************************************************
   * Adjust the map features configuration localized strings according to the suported languages array content.
   * @param {TypeListOfLocalizedLanguages} suportedLanguages The list of supported languages.
   * @param {MapConfigLayerEntry[]} listOfMapConfigLayerEntry The list of Map Config Layer Entry configuration to adjust according
   * to the suported languages array content.
   */
  private processLocalizedString(suportedLanguages: TypeListOfLocalizedLanguages, listOfMapConfigLayerEntry?: MapConfigLayerEntry[]): void {
    if (suportedLanguages.includes('en') && suportedLanguages.includes('fr') && listOfMapConfigLayerEntry) {
      const validateLocalizedString = (config: TypeJsonObject) => {
        if (typeof config === 'object') {
          Object.keys(config).forEach((key) => {
            if (!key.startsWith('_') && typeof config[key] === 'object') {
              if (config?.[key]?.en || config?.[key]?.fr) {
                // delete empty localized strings
                if (!config[key].en && !config[key].fr) delete config[key];
                else if (!config[key].en || !config[key].fr) {
                  throw new Error('When you support both languages, you must set all en and fr properties of localized strings.');
                }
              }
              // Avoid the 'geoviewLayerConfig' and 'parentLayerConfig' properties because they loop on themself and cause a
              // stack overflow error.
              else if (!['geoviewLayerConfig', 'parentLayerConfig'].includes(key)) validateLocalizedString(config[key]);
            }
          });
        }
      };
      listOfMapConfigLayerEntry.forEach((geoviewLayerConfig) => validateLocalizedString(toJsonObject(geoviewLayerConfig)));
      return;
    }

    let sourceKey: TypeDisplayLanguage;
    let destinationKey: TypeDisplayLanguage;
    if (suportedLanguages.includes('en')) {
      sourceKey = 'en';
      destinationKey = 'fr';
    } else {
      sourceKey = 'fr';
      destinationKey = 'en';
    }

    if (listOfMapConfigLayerEntry) {
      const propagateLocalizedString = (config: TypeJsonObject) => {
        if (typeof config === 'object') {
          Object.keys(config).forEach((key) => {
            if (!key.startsWith('_') && typeof config[key] === 'object') {
              // Leaving the commented line here in case a developer needs to quickly uncomment it again to troubleshoot
              // logger.logDebug(`Key=${key}`, config[key]);
              if (config?.[key]?.en || config?.[key]?.fr)
                this.SynchronizeLocalizedString(Cast<TypeLocalizedString>(config[key]), sourceKey, destinationKey);
              // Avoid the 'geoviewLayerConfig' and 'parentLayerConfig' properties because they loop on themself and cause a
              // stack overflow error.
              else if (!['geoviewLayerConfig', 'parentLayerConfig'].includes(key)) propagateLocalizedString(config[key]);
            }
          });
        }
      };
      listOfMapConfigLayerEntry.forEach((geoviewLayerConfig) => propagateLocalizedString(toJsonObject(geoviewLayerConfig)));
    }
  }

  /** ***************************************************************************************************************************
   * Adjust the map features configuration to make it valid.
   * @param {TypeMapFeaturesConfig} config The map features configuration to adjust.
   *
   * @returns {TypeMapFeaturesConfig} A valid JSON configuration object.
   */
  private adjustMapConfiguration(mapFeaturesConfigToAdjuste: TypeMapFeaturesConfig): TypeMapFeaturesConfig {
    // merge default and provided configuration in a temporary object.
    const tempMapFeaturesConfig: TypeMapFeaturesConfig = {
      ...this.#defaultMapFeaturesConfig,
      ...mapFeaturesConfigToAdjuste,
    };

    // do validation for every pieces
    const projection = this.validateProjection(tempMapFeaturesConfig?.map?.viewSettings?.projection);
    const center = this.validateCenter(projection, tempMapFeaturesConfig?.map?.viewSettings?.center);
    const zoom = this.validateZoom(tempMapFeaturesConfig?.map?.viewSettings?.zoom);
    const basemapOptions = this.validateBasemap(projection, tempMapFeaturesConfig?.map?.basemapOptions);
    const schemaVersionUsed = this.validateVersion(tempMapFeaturesConfig.schemaVersionUsed);
    const minZoom = this.validateMinZoom(tempMapFeaturesConfig?.map?.viewSettings?.minZoom);
    const maxZoom = this.validateMaxZoom(tempMapFeaturesConfig?.map?.viewSettings?.maxZoom);
    const extent = tempMapFeaturesConfig?.map?.viewSettings?.extent
      ? this.validateExtent(projection, tempMapFeaturesConfig?.map?.viewSettings?.extent as [number, number, number, number], center)
      : undefined;

    // recreate the prop object to remove unwanted items and check if same as original. Log the modifications
    const validMapFeaturesConfig: TypeMapFeaturesConfig = {
      mapId: this.mapId,
      map: {
        basemapOptions,
        viewSettings: {
          zoom,
          center,
          projection,
          minZoom,
          maxZoom,
          extent,
        },
        highlightColor: tempMapFeaturesConfig.map.highlightColor,
        interaction: tempMapFeaturesConfig.map.interaction,
        listOfGeoviewLayerConfig: tempMapFeaturesConfig.map.listOfGeoviewLayerConfig,
        extraOptions: tempMapFeaturesConfig.map.extraOptions,
      },
      theme: tempMapFeaturesConfig.theme,
      components: tempMapFeaturesConfig.components,
      corePackages: tempMapFeaturesConfig.corePackages,
      suportedLanguages: tempMapFeaturesConfig.suportedLanguages,
      triggerReadyCallback: this._triggerReadyCallback,
      displayLanguage: this._displayLanguage,
      navBar: tempMapFeaturesConfig.navBar,
      appBar: tempMapFeaturesConfig.appBar,
      footerBar: tempMapFeaturesConfig.footerBar,
      overviewMap: tempMapFeaturesConfig.overviewMap,
      externalPackages: tempMapFeaturesConfig.externalPackages,
      schemaVersionUsed,
      serviceUrls: tempMapFeaturesConfig.serviceUrls,
    };
    this.logModifs(tempMapFeaturesConfig, validMapFeaturesConfig);

    return validMapFeaturesConfig;
  }

  /** ***************************************************************************************************************************
   * Log modifications made to configuration by the validator.
   * @param {TypeMapFeaturesConfig} inputMapFeaturesConfig input config.
   * @param {TypeMapFeaturesConfig} validMapFeaturesConfig valid config.
   */
  private logModifs(inputMapFeaturesConfig: TypeMapFeaturesConfig, validMapFeaturesConfig: TypeMapFeaturesConfig): void {
    // eslint-disable-next-line array-callback-return
    Object.keys(inputMapFeaturesConfig).map((key) => {
      if (!(key in validMapFeaturesConfig)) {
        logger.logWarning(`- Map: ${this.mapId} - Key '${key}' is invalid -`);
      }
    });

    if (inputMapFeaturesConfig?.map?.viewSettings?.projection !== validMapFeaturesConfig.map.viewSettings.projection) {
      logger.logWarning(
        `- Map: ${this.mapId} - Invalid projection code ${inputMapFeaturesConfig?.map?.viewSettings?.projection} replaced by ${validMapFeaturesConfig.map.viewSettings.projection} -`
      );
    }

    if (inputMapFeaturesConfig?.map?.viewSettings?.zoom !== validMapFeaturesConfig.map.viewSettings.zoom) {
      logger.logWarning(
        `- Map: ${this.mapId} - Invalid zoom level ${inputMapFeaturesConfig?.map?.viewSettings?.zoom} replaced by ${validMapFeaturesConfig.map.viewSettings.zoom} -`
      );
    }

    if (
      JSON.stringify(inputMapFeaturesConfig?.map?.viewSettings?.center) !== JSON.stringify(validMapFeaturesConfig.map.viewSettings.center)
    ) {
      logger.logWarning(
        `- Map: ${this.mapId} - Invalid center ${inputMapFeaturesConfig?.map?.viewSettings?.center} replaced by ${validMapFeaturesConfig.map.viewSettings.center}`
      );
    }

    if (JSON.stringify(inputMapFeaturesConfig?.map?.basemapOptions) !== JSON.stringify(validMapFeaturesConfig.map.basemapOptions)) {
      logger.logWarning(
        `- Map: ${this.mapId} - Invalid basemap options ${JSON.stringify(
          inputMapFeaturesConfig?.map?.basemapOptions
        )} replaced by ${JSON.stringify(validMapFeaturesConfig.map.basemapOptions)} -`
      );
    }
  }
}
