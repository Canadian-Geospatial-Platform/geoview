/* eslint-disable no-console, no-underscore-dangle, no-param-reassign */
import { Extent } from 'ol/extent';

import Ajv from 'ajv';
import { AnyValidateFunction } from 'ajv/dist/types';

import i18n from 'i18next';
import defaultsDeep from 'lodash/defaultsDeep';
import { api } from '@/app';

import { generateId, replaceParams, showError } from '../utilities';

import schema from '../../../../schema.json';
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
import { geoviewEntryIsGeoPackage } from '@/geo/layer/geoview-layers/vector/geopackage';
import {
  layerEntryIsGroupLayer,
  TypeGeoviewLayerConfig,
  TypeDisplayLanguage,
  TypeLayerEntryConfig,
  TypeLocalizedString,
  TypeValidMapProjectionCodes,
  TypeValidVersions,
  TypeListOfLayerEntryConfig,
  TypeLayerGroupEntryConfig,
  VALID_DISPLAY_LANGUAGE,
  VALID_PROJECTION_CODES,
  VALID_VERSIONS,
  TypeListOfGeoviewLayerConfig,
  TypeListOfLocalizedLanguages,
  layerEntryIsVector,
} from '@/geo/map/map-schema-types';
import { Cast, toJsonObject, TypeJsonObject, TypeMapFeaturesConfig } from '../../types/global-types';

import { Layer } from '@/geo/layer/layer';
import { CONST_GEOVIEW_SCHEMA_BY_TYPE, TypeGeoviewLayerType } from '@/geo/layer/geoview-layers/abstract-geoview-layers';

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
  private _defaultMapFeaturesConfig: TypeMapFeaturesConfig = {
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
    appBar: ['geolocator'],
    navBar: ['zoom', 'fullscreen', 'home'],
    corePackages: [],
    overviewMap: undefined,
    serviceUrls: {
      keys: 'https://geocore.api.geo.ca',
      geolocator: 'https://geolocator.api.geo.ca?keys=geonames,nominatim,locate',
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
    this._defaultMapFeaturesConfig.mapId = this.mapId;
    this._displayLanguage = this._defaultMapFeaturesConfig.displayLanguage!;
    this._triggerReadyCallback = this._defaultMapFeaturesConfig.triggerReadyCallback!;
  }

  /** ***************************************************************************************************************************
   * Get map features configuration object.
   *
   * @returns {TypeMapFeaturesConfig} The map features configuration.
   */
  get defaultMapFeaturesConfig(): TypeMapFeaturesConfig {
    return this._defaultMapFeaturesConfig;
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
    this._defaultMapFeaturesConfig.mapId = this.mapId;
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
        : this._defaultMapFeaturesConfig.map.basemapOptions.basemapId;
      const shaded = this._basemapShaded[projection].includes(basemapOptions.shaded)
        ? basemapOptions.shaded
        : this._defaultMapFeaturesConfig.map.basemapOptions.shaded;
      const labeled = this._basemaplabeled[projection].includes(basemapOptions.labeled)
        ? basemapOptions.labeled
        : this._defaultMapFeaturesConfig.map.basemapOptions.labeled;

      return { basemapId, shaded, labeled };
    }
    return this._defaultMapFeaturesConfig.map.basemapOptions;
  }

  /** ***************************************************************************************************************************
   * Validate map version.
   * @param {TypeValidVersions} version The version to validate.
   *
   * @returns {TypeValidVersions} A valid version.
   */
  validateVersion(version?: TypeValidVersions): TypeValidVersions {
    return version && VALID_VERSIONS.includes(version) ? version : this._defaultMapFeaturesConfig.schemaVersionUsed!;
  }

  /** ***************************************************************************************************************************
   * Validate map config language.
   * @param {TypeDisplayLanguage} language The language to validate.
   *
   * @returns {TypeDisplayLanguage} A valid language.
   */
  validateDisplayLanguage(language?: TypeDisplayLanguage): TypeDisplayLanguage {
    if (language && VALID_DISPLAY_LANGUAGE.includes(language)) return language;

    console.log(
      `- Map: ${this.mapId} - Invalid display language code ${language} replaced by ${this._defaultMapFeaturesConfig.displayLanguage} -`
    );
    return this._defaultMapFeaturesConfig.displayLanguage!;
  }

  /** ***************************************************************************************************************************
   * Validate zoom level.
   * @param {number} zoom The zoom level to validate.
   *
   * @returns {number} A valid zoom level.
   */
  private validateZoom(zoom?: number): number {
    return zoom && !Number.isNaN(zoom) && zoom >= 0 && zoom <= 18 ? zoom : this._defaultMapFeaturesConfig.map.viewSettings.zoom;
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
      : this._defaultMapFeaturesConfig.map.viewSettings.projection;
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
          : this._defaultMapFeaturesConfig.map.viewSettings.center[0];
      const y =
        !Number.isNaN(yVal) && yVal > this._center[projection].lat[0] && yVal < this._center[projection].lat[1]
          ? yVal
          : this._defaultMapFeaturesConfig.map.viewSettings.center[1];

      return [x, y];
    }
    return this._defaultMapFeaturesConfig.map.viewSettings.center;
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private printSchemaError(validate: AnyValidateFunction<unknown>, objectAffected: any) {
    for (let i = 0; i < validate.errors!.length; i += 1) {
      const error = validate.errors![i];
      const { instancePath } = error;
      const path = instancePath.split('/');
      let node = objectAffected;
      for (let j = 1; j < path.length; j += 1) {
        node = node[path[j]];
      }
      console.log(this.mapId, '='.repeat(200));
      console.log('Schema error: ', this.mapId, error);
      console.log('Object affected: ', this.mapId, node);
    }

    setTimeout(() => {
      const trans = i18n.getFixedT(api.maps[this.mapId].displayLanguage);
      showError(this.mapId, trans('validation.schema.notFound'));
    }, 2000);
  }

  /** ***************************************************************************************************************************
   * Validate the configuration of the map features against the TypeMapFeaturesInstance defined in the schema..
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
        const trans = i18n.getFixedT(api.maps[this.mapId].displayLanguage);
        const message = replaceParams([schemaPath], trans('validation.schema.wrongPath'));
        console.log(`- Map ${this.mapId}: ${message}`);
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
      const schemaPath = layerEntryIsGroupLayer(listOfLayerEntryConfig[i]) ? groupSchemaPath : layerSchemaPath;
      const validate = validator.getSchema(schemaPath);

      if (!validate) {
        setTimeout(() => {
          const trans = i18n.getFixedT(api.maps[this.mapId].displayLanguage);
          const message = replaceParams([schemaPath], trans('validation.schema.wrongPath'));
          console.log(`- Map ${this.mapId}: ${message}`);
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
      if (
        layerEntryIsGroupLayer(listOfLayerEntryConfig[i]) &&
        !this.IsValidTypeListOfLayerEntryConfig(geoviewLayerType, listOfLayerEntryConfig[i].listOfLayerEntryConfig!, validator)
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
        isValid = this.IsValidTypeListOfLayerEntryConfig(
          mapFeaturesConfigToValidate.map.listOfGeoviewLayerConfig[i].geoviewLayerType,
          mapFeaturesConfigToValidate.map.listOfGeoviewLayerConfig[i].listOfLayerEntryConfig,
          validator
        );
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
        ...this._defaultMapFeaturesConfig,
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
   * @param {TypeListOfGeoviewLayerConfig} listOfGeoviewLayerConfig The list of GeoView layer configuration to adjust and
   * validate.
   */
  private doExtraValidation(listOfGeoviewLayerConfig?: TypeListOfGeoviewLayerConfig) {
    if (listOfGeoviewLayerConfig) {
      listOfGeoviewLayerConfig.forEach((geoviewLayerConfig) => {
        // The default value for geoviewLayerConfig.initialSettings.visible is true.
        if (!geoviewLayerConfig.initialSettings) geoviewLayerConfig.initialSettings = { visible: 'yes' };
        switch (geoviewLayerConfig.geoviewLayerType) {
          case 'GeoJSON':
          case 'xyzTiles':
          case 'vectorTiles':
          case 'GeoPackage':
          case 'imageStatic':
            this.geoviewLayerIdIsMandatory(geoviewLayerConfig);
            this.processLayerEntryConfig(geoviewLayerConfig, geoviewLayerConfig, geoviewLayerConfig.listOfLayerEntryConfig);
            break;
          case 'esriDynamic':
          case 'esriFeature':
          case 'ogcFeature':
          case 'ogcWfs':
          case 'ogcWms':
            this.geoviewLayerIdIsMandatory(geoviewLayerConfig);
            this.metadataAccessPathIsMandatory(geoviewLayerConfig);
            this.processLayerEntryConfig(geoviewLayerConfig, geoviewLayerConfig, geoviewLayerConfig.listOfLayerEntryConfig);
            break;
          case 'geoCore':
            this.processLayerEntryConfig(geoviewLayerConfig, geoviewLayerConfig, geoviewLayerConfig.listOfLayerEntryConfig);
            break;
          default:
            throw new Error('Your not supposed to end here. There is a problem with the schema validator.');
            break;
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
   * @param {TypeGeoviewLayerConfig} rootLayerConfig The GeoView layer configuration to adjust and validate.
   * @param {TypeGeoviewLayerConfig | TypeLayerGroupEntryConfig} parentLayerConfig The parent layer configuration of all the
   * layer entry configurations found in the list of layer entries.
   * @param {TypeListOfLayerEntryConfig} listOfLayerEntryConfig The list of layer entry configurations to process.
   */
  private processLayerEntryConfig(
    rootLayerConfig: TypeGeoviewLayerConfig,
    parentLayerConfig: TypeGeoviewLayerConfig | TypeLayerGroupEntryConfig,
    listOfLayerEntryConfig: TypeListOfLayerEntryConfig
  ) {
    listOfLayerEntryConfig.forEach((layerEntryConfig: TypeLayerEntryConfig) => {
      // links the entry to its root GeoView layer.
      layerEntryConfig.geoviewRootLayer = rootLayerConfig;
      // links the entry to its parent layer configuration.
      layerEntryConfig.parentLayerConfig = parentLayerConfig;
      // layerEntryConfig.initialSettings attributes that are not defined inherits parent layer settings that are defined.
      layerEntryConfig.initialSettings = defaultsDeep(layerEntryConfig.initialSettings, layerEntryConfig.parentLayerConfig.initialSettings);
      if (layerEntryIsGroupLayer(layerEntryConfig))
        this.processLayerEntryConfig(rootLayerConfig, layerEntryConfig, layerEntryConfig.listOfLayerEntryConfig);
      else if (geoviewEntryIsWMS(layerEntryConfig)) {
        // if layerEntryConfig.source.dataAccessPath is undefined, the metadataAccessPath defined on the root is used.
        if (!layerEntryConfig.source) layerEntryConfig.source = {};
        if (!layerEntryConfig.source.dataAccessPath) {
          // When the dataAccessPath is undefined and the metadataAccessPath ends with ".xml", the dataAccessPath is temporarilly
          // set to '' and will be filled in the getServiceMetadata method of the class WMS. So, we begin with the assumption
          // that both en and fr end with ".xml". Be aware that in metadataAccessPath, one language can ends with ".xml" and the
          // other not.
          layerEntryConfig.source.dataAccessPath = { en: '', fr: '' };
          // When the dataAccessPath is undefined and the metadataAccessPath does not end with ".xml", the dataAccessPath is set
          // to the same value of the corresponding metadataAccessPath.
          if (rootLayerConfig.metadataAccessPath!.en!.slice(-4).toLowerCase() !== '.xml')
            layerEntryConfig.source.dataAccessPath.en = rootLayerConfig.metadataAccessPath!.en;
          if (rootLayerConfig.metadataAccessPath!.fr!.slice(-4).toLowerCase() !== '.xml')
            layerEntryConfig.source.dataAccessPath.fr = rootLayerConfig.metadataAccessPath!.fr;
        }
        // Default value for layerEntryConfig.source.serverType is 'mapserver'.
        if (!layerEntryConfig.source.serverType) layerEntryConfig.source.serverType = 'mapserver';
      } else if (geoviewEntryIsImageStatic(layerEntryConfig)) {
        // Value for layerEntryConfig.entryType can only be raster
        if (!layerEntryConfig.entryType) layerEntryConfig.entryType = 'raster-image';

        if (!layerEntryConfig.source.dataAccessPath) {
          throw new Error(
            `source.dataAccessPath on layer entry ${Layer.getLayerPath(layerEntryConfig)} is mandatory for GeoView layer ${
              rootLayerConfig.geoviewLayerId
            } of type ${rootLayerConfig.geoviewLayerType}`
          );
        }
      } else if (geoviewEntryIsXYZTiles(layerEntryConfig)) {
        /** layerEntryConfig.source.dataAccessPath is mandatory. */
        if (!layerEntryConfig.source.dataAccessPath) {
          throw new Error(
            `source.dataAccessPath on layer entry ${Layer.getLayerPath(layerEntryConfig)} is mandatory for GeoView layer ${
              rootLayerConfig.geoviewLayerId
            } of type ${rootLayerConfig.geoviewLayerType}`
          );
        }
      } else if (geoviewEntryIsVectorTiles(layerEntryConfig)) {
        /** layerEntryConfig.source.dataAccessPath is mandatory. */
        if (!layerEntryConfig.source!.dataAccessPath) {
          throw new Error(
            `source.dataAccessPath on layer entry ${Layer.getLayerPath(layerEntryConfig)} is mandatory for GeoView layer ${
              rootLayerConfig.geoviewLayerId
            } of type ${rootLayerConfig.geoviewLayerType}`
          );
        }
      } else if (geoviewEntryIsEsriDynamic(layerEntryConfig)) {
        if (Number.isNaN(layerEntryConfig.layerId)) {
          throw new Error(`The layer entry with layerId equal to ${Layer.getLayerPath(layerEntryConfig)} must be an integer string`);
        }
        // if layerEntryConfig.source.dataAccessPath is undefined, we assign the metadataAccessPath of the GeoView layer to it.
        if (!layerEntryConfig.source) layerEntryConfig.source = {};
        if (!layerEntryConfig.source.dataAccessPath)
          layerEntryConfig.source.dataAccessPath = { ...rootLayerConfig.metadataAccessPath } as TypeLocalizedString;
      } else if (geoviewEntryIsEsriFeature(layerEntryConfig)) {
        if (Number.isNaN(layerEntryConfig.layerId)) {
          throw new Error(`The layer entry with layerId equal to ${Layer.getLayerPath(layerEntryConfig)} must be an integer string`);
        }
        // Attribute 'style' must exist in layerEntryConfig even if it is undefined
        if (!('style' in layerEntryConfig)) layerEntryConfig.style = undefined;
        // if layerEntryConfig.source.dataAccessPath is undefined, we assign the metadataAccessPath of the GeoView layer to it
        // and place the layerId at the end of it.
        // Value for layerEntryConfig.source.format can only be EsriJSON.
        if (!layerEntryConfig.source) layerEntryConfig.source = { format: 'EsriJSON' };
        if (!layerEntryConfig?.source?.format) layerEntryConfig.source.format = 'EsriJSON';
        if (!layerEntryConfig.source.dataAccessPath)
          layerEntryConfig.source.dataAccessPath = { ...rootLayerConfig.metadataAccessPath } as TypeLocalizedString;
      } else if (geoviewEntryIsWFS(layerEntryConfig)) {
        // Attribute 'style' must exist in layerEntryConfig even if it is undefined
        if (!('style' in layerEntryConfig)) layerEntryConfig.style = undefined;
        // if layerEntryConfig.source.dataAccessPath is undefined, we assign the metadataAccessPath of the GeoView layer to it.
        // Value for layerEntryConfig.source.format can only be WFS.
        if (!layerEntryConfig.source) layerEntryConfig.source = { format: 'WFS' };
        if (!layerEntryConfig?.source?.format) layerEntryConfig.source.format = 'WFS';
        if (!layerEntryConfig.source.dataAccessPath)
          layerEntryConfig.source.dataAccessPath = { ...rootLayerConfig.metadataAccessPath } as TypeLocalizedString;
        if (!layerEntryConfig?.source?.dataProjection) layerEntryConfig.source.dataProjection = 'EPSG:4326';
      } else if (geoviewEntryIsOgcFeature(layerEntryConfig)) {
        // Attribute 'style' must exist in layerEntryConfig even if it is undefined
        if (!('style' in layerEntryConfig)) layerEntryConfig.style = undefined;
        // if layerEntryConfig.source.dataAccessPath is undefined, we assign the metadataAccessPath of the GeoView layer to it.
        // Value for layerEntryConfig.source.format can only be WFS.
        if (!layerEntryConfig.source) layerEntryConfig.source = { format: 'featureAPI' };
        if (!layerEntryConfig?.source?.format) layerEntryConfig.source.format = 'featureAPI';
        if (!layerEntryConfig.source.dataAccessPath)
          layerEntryConfig.source.dataAccessPath = { ...rootLayerConfig.metadataAccessPath } as TypeLocalizedString;
        if (!layerEntryConfig?.source?.dataProjection) layerEntryConfig.source.dataProjection = 'EPSG:4326';
      } else if (geoviewEntryIsGeoPackage(layerEntryConfig)) {
        // Attribute 'style' must exist in layerEntryConfig even if it is undefined
        if (!('style' in layerEntryConfig)) layerEntryConfig.style = undefined;
        // if layerEntryConfig.source.dataAccessPath is undefined, we assign the metadataAccessPath of the GeoView layer to it.
        // Value for layerEntryConfig.source.format can only be GeoPackage.
        if (!layerEntryConfig.source) layerEntryConfig.source = { format: 'GeoPackage' };
        if (!layerEntryConfig?.source?.format) layerEntryConfig.source.format = 'GeoPackage';
        if (!layerEntryConfig.source.dataAccessPath) {
          let { en, fr } = rootLayerConfig.metadataAccessPath!;
          en = en!.split('/').length > 1 ? en!.split('/').slice(0, -1).join('/') : './';
          fr = fr!.split('/').length > 1 ? fr!.split('/').slice(0, -1).join('/') : './';
          layerEntryConfig.source.dataAccessPath = { en, fr } as TypeLocalizedString;
        }
        if (
          !(layerEntryConfig.source.dataAccessPath!.en?.startsWith('blob') && !layerEntryConfig.source.dataAccessPath!.en?.endsWith('/')) &&
          !layerEntryConfig.source.dataAccessPath!.en?.toLowerCase().endsWith('.gpkg')
        ) {
          layerEntryConfig.source.dataAccessPath!.en = layerEntryConfig.source.dataAccessPath!.en!.endsWith('/')
            ? `${layerEntryConfig.source.dataAccessPath!.en}${layerEntryConfig.layerId}`
            : `${layerEntryConfig.source.dataAccessPath!.en}/${layerEntryConfig.layerId}`;
          layerEntryConfig.source.dataAccessPath!.fr = layerEntryConfig.source.dataAccessPath!.fr!.endsWith('/')
            ? `${layerEntryConfig.source.dataAccessPath!.fr}${layerEntryConfig.layerId}`
            : `${layerEntryConfig.source.dataAccessPath!.fr}/${layerEntryConfig.layerId}`;
        }
        if (!layerEntryConfig?.source?.dataProjection) layerEntryConfig.source.dataProjection = 'EPSG:4326';
      } else if (geoviewEntryIsGeoJSON(layerEntryConfig)) {
        if (!layerEntryConfig.geoviewRootLayer.metadataAccessPath && !layerEntryConfig.source?.dataAccessPath) {
          throw new Error(
            `dataAccessPath is mandatory for GeoView layer ${rootLayerConfig.geoviewLayerId} of type GeoJSON when the metadataAccessPath is undefined.`
          );
        }
        // Default value for layerEntryConfig.entryType is vector
        if (!layerEntryConfig.entryType) layerEntryConfig.entryType = 'vector';
        // Attribute 'style' must exist in layerEntryConfig even if it is undefined
        if (!('style' in layerEntryConfig)) layerEntryConfig.style = undefined;
        // if layerEntryConfig.source.dataAccessPath is undefined, we assign the metadataAccessPath of the GeoView layer to it
        // and place the layerId at the end of it.
        // Value for layerEntryConfig.source.format can only be EsriJSON.
        if (!layerEntryConfig.source) layerEntryConfig.source = { format: 'GeoJSON' };
        if (!layerEntryConfig?.source?.format) layerEntryConfig.source.format = 'GeoJSON';
        if (!layerEntryConfig.source.dataAccessPath) {
          let { en, fr } = rootLayerConfig.metadataAccessPath!;
          en = en!.split('/').length > 1 ? en!.split('/').slice(0, -1).join('/') : './';
          fr = fr!.split('/').length > 1 ? fr!.split('/').slice(0, -1).join('/') : './';
          layerEntryConfig.source.dataAccessPath = { en, fr } as TypeLocalizedString;
        }
        if (
          !(layerEntryConfig.source.dataAccessPath!.en?.startsWith('blob') && !layerEntryConfig.source.dataAccessPath!.en?.endsWith('/')) &&
          !layerEntryConfig.source.dataAccessPath!.en?.endsWith('.json' || '.geojson' || '.JSON' || '.geoJSON' || '.GEOJSON')
        ) {
          layerEntryConfig.source.dataAccessPath!.en = layerEntryConfig.source.dataAccessPath!.en!.endsWith('/')
            ? `${layerEntryConfig.source.dataAccessPath!.en}${layerEntryConfig.layerId}`
            : `${layerEntryConfig.source.dataAccessPath!.en}/${layerEntryConfig.layerId}`;
          layerEntryConfig.source.dataAccessPath!.fr = layerEntryConfig.source.dataAccessPath!.fr!.endsWith('/')
            ? `${layerEntryConfig.source.dataAccessPath!.fr}${layerEntryConfig.layerId}`
            : `${layerEntryConfig.source.dataAccessPath!.fr}/${layerEntryConfig.layerId}`;
        }
        if (!layerEntryConfig?.source?.dataProjection) layerEntryConfig.source.dataProjection = 'EPSG:4326';
      }
      // Set default value for clusters on vector layers
      if (layerEntryIsVector(layerEntryConfig) && layerEntryConfig.source!.cluster?.enable) {
        if (!layerEntryConfig.source!.cluster.settings)
          layerEntryConfig.source!.cluster.settings = {
            type: 'simpleSymbol',
            symbol: 'circle',
            stroke: { lineStyle: 'solid', width: 1 },
          };
        if (!layerEntryConfig.source!.cluster.settings.type) layerEntryConfig.source!.cluster.settings.type = 'simpleSymbol';
        if (!layerEntryConfig.source!.cluster.settings.symbol) layerEntryConfig.source!.cluster.settings.symbol = 'circle';
        if (!layerEntryConfig.source!.cluster.settings.stroke) layerEntryConfig.source!.cluster.settings.stroke = {};
        if (!layerEntryConfig.source!.cluster.settings.stroke.lineStyle)
          layerEntryConfig.source!.cluster.settings.stroke.lineStyle = 'solid';
        if (!layerEntryConfig.source!.cluster.settings.stroke.width) layerEntryConfig.source!.cluster.settings.stroke.width = 1;
      }
    });
  }

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
   * @param {TypeListOfGeoviewLayerConfig} listOfGeoviewLayerConfig The list of GeoView layer configuration to adjust according
   * to the suported languages array content.
   */
  private processLocalizedString(
    suportedLanguages: TypeListOfLocalizedLanguages,
    listOfGeoviewLayerConfig?: TypeListOfGeoviewLayerConfig
  ): void {
    if (suportedLanguages.includes('en') && suportedLanguages.includes('fr') && listOfGeoviewLayerConfig) {
      const validateLocalizedString = (config: TypeJsonObject) => {
        if (typeof config === 'object') {
          Object.keys(config).forEach((key) => {
            if (typeof config[key] === 'object') {
              if ('en' in config[key] || 'fr' in config[key]) {
                // delete empty localized strings
                if (!config[key].en && !config[key].fr) delete config[key];
                else if (!config[key].en || !config[key].fr) {
                  throw new Error('When you support both languages, you must set all en and fr properties of localized strings.');
                }
              }
              // Avoid the 'geoviewRootLayer' and 'parentLayerConfig' properties because they loop on themself and cause a
              // stack overflow error.
              else if (!['geoviewRootLayer', 'parentLayerConfig'].includes(key)) validateLocalizedString(config[key]);
            }
          });
        }
      };
      listOfGeoviewLayerConfig.forEach((geoviewLayerConfig) => validateLocalizedString(toJsonObject(geoviewLayerConfig)));
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

    if (listOfGeoviewLayerConfig) {
      const propagateLocalizedString = (config: TypeJsonObject) => {
        if (typeof config === 'object') {
          Object.keys(config).forEach((key) => {
            if (typeof config[key] === 'object') {
              if ('en' in config[key] || 'fr' in config[key])
                this.SynchronizeLocalizedString(Cast<TypeLocalizedString>(config[key]), sourceKey, destinationKey);
              // Avoid the 'geoviewRootLayer' and 'parentLayerConfig' properties because they loop on themself and cause a
              // stack overflow error.
              else if (!['geoviewRootLayer', 'parentLayerConfig'].includes(key)) propagateLocalizedString(config[key]);
            }
          });
        }
      };
      listOfGeoviewLayerConfig.forEach((geoviewLayerConfig) => propagateLocalizedString(toJsonObject(geoviewLayerConfig)));
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
      ...this._defaultMapFeaturesConfig,
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
      appBar: tempMapFeaturesConfig.appBar,
      navBar: tempMapFeaturesConfig.navBar,
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
        console.log(`- Map: ${this.mapId} - Key '${key}' is invalid -`);
      }
    });

    if (inputMapFeaturesConfig?.map?.viewSettings?.projection !== validMapFeaturesConfig.map.viewSettings.projection) {
      console.log(
        `- Map: ${this.mapId} - Invalid projection code ${inputMapFeaturesConfig?.map?.viewSettings?.projection} replaced by ${validMapFeaturesConfig.map.viewSettings.projection} -`
      );
    }

    if (inputMapFeaturesConfig?.map?.viewSettings?.zoom !== validMapFeaturesConfig.map.viewSettings.zoom) {
      console.log(
        `- Map: ${this.mapId} - Invalid zoom level ${inputMapFeaturesConfig?.map?.viewSettings?.zoom} replaced by ${validMapFeaturesConfig.map.viewSettings.zoom} -`
      );
    }

    if (
      JSON.stringify(inputMapFeaturesConfig?.map?.viewSettings?.center) !== JSON.stringify(validMapFeaturesConfig.map.viewSettings.center)
    ) {
      console.log(
        `- Map: ${this.mapId} - Invalid center ${inputMapFeaturesConfig?.map?.viewSettings?.center} replaced by ${validMapFeaturesConfig.map.viewSettings.center}`
      );
    }

    if (JSON.stringify(inputMapFeaturesConfig?.map?.basemapOptions) !== JSON.stringify(validMapFeaturesConfig.map.basemapOptions)) {
      console.log(
        `- Map: ${this.mapId} - Invalid basemap options ${JSON.stringify(
          inputMapFeaturesConfig?.map?.basemapOptions
        )} replaced by ${JSON.stringify(validMapFeaturesConfig.map.basemapOptions)} -`
      );
    }
  }
}
