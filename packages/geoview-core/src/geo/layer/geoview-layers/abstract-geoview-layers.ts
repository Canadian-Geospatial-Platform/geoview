/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-param-reassign */
import BaseLayer from 'ol/layer/Base';
import Collection from 'ol/Collection';
import { Coordinate } from 'ol/coordinate';
import { Pixel } from 'ol/pixel';
import { Extent } from 'ol/extent';
import LayerGroup, { Options as LayerGroupOptions } from 'ol/layer/Group';
import Feature from 'ol/Feature';

import cloneDeep from 'lodash/cloneDeep';

import {
  generateId,
  getLocalizedValue,
  getXMLHttpRequest,
  showError,
  replaceParams,
  getLocalizedMessage,
  whenThisThen,
} from '@/core/utils/utilities';
import {
  TypeGeoviewLayerConfig,
  TypeListOfLayerEntryConfig,
  TypeLocalizedString,
  TypeLayerEntryConfig,
  TypeBaseLayerEntryConfig,
  layerEntryIsGroupLayer,
  TypeStyleConfig,
  TypeLayerGroupEntryConfig,
  TypeVectorLayerEntryConfig,
  layerEntryIsVector,
  TypeLayerEntryType,
  TypeOgcWmsLayerEntryConfig,
  TypeEsriDynamicLayerEntryConfig,
  TypeBaseSourceVectorInitialConfig,
  TypeLayerInitialSettings,
  TypeLayerStatus,
  TypeStyleGeometry,
} from '@/geo/map/map-schema-types';
import {
  codedValueType,
  GetFeatureInfoPayload,
  payloadIsQueryLayer,
  rangeDomainType,
  TypeArrayOfFeatureInfoEntries,
  TypeFeatureInfoEntry,
  QueryType,
  LayerSetPayload,
  payloadIsRequestLayerInventory,
  GetLegendsPayload,
  payloadIsQueryLegend,
  TypeLocation,
} from '@/api/events/payloads';
import { api } from '@/app';
import { EVENT_NAMES } from '@/api/events/event-types';
import { TypeJsonObject, toJsonObject } from '@/core/types/global-types';
import { Layer } from '@/geo/layer/layer';
import { TimeDimension, TypeDateFragments } from '@/core/utils/date-mgt';
import { TypeEventHandlerFunction } from '@/api/events/event';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import { logger } from '@/core/utils/logger';

export type TypeLegend = {
  layerPath: string;
  layerName?: TypeLocalizedString;
  type: TypeGeoviewLayerType;
  styleConfig?: TypeStyleConfig | null;
  // Layers other than vector layers use the HTMLCanvasElement type for their legend.
  legend: TypeVectorLayerStyles | HTMLCanvasElement | null;
};

/**
 * type guard function that redefines a TypeLegend as a TypeWmsLegend
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {TypeLegend} verifyIfLegend object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export const isWmsLegend = (verifyIfLegend: TypeLegend): verifyIfLegend is TypeWmsLegend => {
  return verifyIfLegend?.type === 'ogcWms';
};

export interface TypeWmsLegendStyle {
  name: string;
  legend: HTMLCanvasElement | null;
}

export interface TypeWmsLegend extends Omit<TypeLegend, 'styleConfig'> {
  legend: HTMLCanvasElement | null;
  styles?: TypeWmsLegendStyle[];
}

/**
 * type guard function that redefines a TypeLegend as a TypeImageStaticLegend
 * if the type attribute of the verifyIfLegend parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {TypeLegend} verifyIfLegend object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export const isImageStaticLegend = (verifyIfLegend: TypeLegend): verifyIfLegend is TypeImageStaticLegend => {
  return verifyIfLegend?.type === 'imageStatic';
};

export interface TypeImageStaticLegend extends Omit<TypeLegend, 'styleConfig'> {
  legend: HTMLCanvasElement | null;
}

const validVectorLayerLegendTypes: TypeGeoviewLayerType[] = [
  'GeoJSON',
  'esriDynamic',
  'esriFeature',
  'esriImage',
  'ogcFeature',
  'ogcWfs',
  'GeoPackage',
];
/**
 * type guard function that redefines a TypeLegend as a TypeVectorLegend
 * if the type attribute of the verifyIfLegend parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {TypeLegend} verifyIfLegend object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export const isVectorLegend = (verifyIfLegend: TypeLegend): verifyIfLegend is TypeVectorLegend => {
  return validVectorLayerLegendTypes.includes(verifyIfLegend?.type);
};

export interface TypeVectorLegend extends TypeLegend {
  legend: TypeVectorLayerStyles;
}

export type TypeStyleRepresentation = {
  /** The defaultCanvas property is used by Simple styles and default styles when defined in unique value and class
   * break styles.
   */
  defaultCanvas?: HTMLCanvasElement | null;
  /** The arrayOfCanvas property is used by unique value and class break styles. */
  arrayOfCanvas?: (HTMLCanvasElement | null)[];
};
export type TypeVectorLayerStyles = Partial<Record<TypeStyleGeometry, TypeStyleRepresentation>>;

/** ******************************************************************************************************************************
 * GeoViewAbstractLayers types
 */

// Constant used to define the default layer names
const DEFAULT_LAYER_NAMES: Record<TypeGeoviewLayerType, string> = {
  esriDynamic: 'Esri Dynamic Layer',
  esriFeature: 'Esri Feature Layer',
  esriImage: 'Esri Image Layer',
  imageStatic: 'Static Image Layer',
  GeoJSON: 'GeoJson Layer',
  geoCore: 'GeoCore Layer',
  GeoPackage: 'GeoPackage Layer',
  xyzTiles: 'XYZ Tiles',
  vectorTiles: 'Vector Tiles',
  ogcFeature: 'OGC Feature Layer',
  ogcWfs: 'WFS Layer',
  ogcWms: 'WMS Layer',
};

// Definition of the keys used to create the constants of the GeoView layer
type LayerTypesKey =
  | 'ESRI_DYNAMIC'
  | 'ESRI_FEATURE'
  | 'ESRI_IMAGE'
  | 'IMAGE_STATIC'
  | 'GEOJSON'
  | 'GEOCORE'
  | 'GEOPACKAGE'
  | 'XYZ_TILES'
  | 'VECTOR_TILES'
  | 'OGC_FEATURE'
  | 'WFS'
  | 'WMS';

/**
 * Type of GeoView layers
 */
export type TypeGeoviewLayerType =
  | 'esriDynamic'
  | 'esriFeature'
  | 'esriImage'
  | 'imageStatic'
  | 'GeoJSON'
  | 'geoCore'
  | 'GeoPackage'
  | 'xyzTiles'
  | 'vectorTiles'
  | 'ogcFeature'
  | 'ogcWfs'
  | 'ogcWms';

/**
 * Definition of the GeoView layer constants
 */
export const CONST_LAYER_TYPES: Record<LayerTypesKey, TypeGeoviewLayerType> = {
  ESRI_DYNAMIC: 'esriDynamic',
  ESRI_FEATURE: 'esriFeature',
  ESRI_IMAGE: 'esriImage',
  IMAGE_STATIC: 'imageStatic',
  GEOJSON: 'GeoJSON',
  GEOCORE: 'geoCore',
  GEOPACKAGE: 'GeoPackage',
  XYZ_TILES: 'xyzTiles',
  VECTOR_TILES: 'vectorTiles',
  OGC_FEATURE: 'ogcFeature',
  WFS: 'ogcWfs',
  WMS: 'ogcWms',
};

/**
 * Definition of the GeoView layer entry types for each type of Geoview layer
 */
export const CONST_LAYER_ENTRY_TYPE: Record<TypeGeoviewLayerType, TypeLayerEntryType> = {
  imageStatic: 'raster-image',
  esriDynamic: 'raster-image',
  esriFeature: 'vector',
  esriImage: 'raster-image',
  GeoJSON: 'vector',
  geoCore: 'geoCore',
  GeoPackage: 'vector',
  xyzTiles: 'raster-tile',
  vectorTiles: 'raster-tile',
  ogcFeature: 'vector',
  ogcWfs: 'vector',
  ogcWms: 'raster-image',
};

/**
 * Definition of the sub schema to use for each type of Geoview layer
 */
export const CONST_GEOVIEW_SCHEMA_BY_TYPE: Record<TypeGeoviewLayerType, string> = {
  imageStatic: 'TypeImageStaticLayerEntryConfig',
  esriDynamic: 'TypeEsriDynamicLayerEntryConfig',
  esriFeature: 'TypeVectorLayerEntryConfig',
  esriImage: 'TypeEsriImageLayerEntryConfig',
  GeoJSON: 'TypeVectorLayerEntryConfig',
  geoCore: 'TypeGeocoreLayerEntryConfig',
  GeoPackage: 'TypeVectorLayerEntryConfig',
  xyzTiles: 'TypeTileLayerEntryConfig',
  vectorTiles: 'TypeTileLayerEntryConfig',
  ogcFeature: 'TypeVectorLayerEntryConfig',
  ogcWfs: 'TypeVectorLayerEntryConfig',
  ogcWms: 'TypeOgcWmsLayerEntryConfig',
};

type TypeLayerSetHandlerFunctions = {
  requestLayerInventory?: TypeEventHandlerFunction;
  queryLegend?: TypeEventHandlerFunction;
  queryLayer?: TypeEventHandlerFunction;
  updateLayerStatus?: TypeEventHandlerFunction;
  updateLayerPhase?: TypeEventHandlerFunction;
};

// ******************************************************************************************************************************
// ******************************************************************************************************************************
/** ******************************************************************************************************************************
 * The AbstractGeoViewLayer class is normally used for creating subclasses and is not instantiated (using the new operator) in the
 * app. It registers the configuration options and defines the methods shared by all its descendant. The class constructor has
 * three parameters: mapId, type and mapLayerConfig. Its role is to save in attributes the mapId, type and elements of the
 * mapLayerConfig that are common to all GeoView layers. The main characteristic of a GeoView layer is the presence of an
 * metadataAccessPath attribute whose value is passed as an attribute of the mapLayerConfig object.
 */
// ******************************************************************************************************************************
export abstract class AbstractGeoViewLayer {
  /** The unique identifier of the map on which the GeoView layer will be drawn. */
  mapId: string;

  /** Flag used to indicate the layer's phase */
  layerPhase = '';

  /** The type of GeoView layer that is instantiated. */
  type: TypeGeoviewLayerType;

  /** The unique identifier for the GeoView layer. The value of this attribute is extracted from the mapLayerConfig parameter.
   * If its value is undefined, a unique value is generated.
   */
  geoviewLayerId: string;

  /** The GeoView layer name. The value of this attribute is extracted from the mapLayerConfig parameter. If its value is
   * undefined, a default value is generated.
   */
  geoviewLayerName: TypeLocalizedString = { en: '', fr: '' };

  /** The GeoView layer metadataAccessPath. The name attribute is optional */
  metadataAccessPath: TypeLocalizedString = { en: '', fr: '' };

  /**
   * An array of layer settings. In the schema, this attribute is optional. However, we define it as mandatory and if the
   * configuration does not provide a value, we use an empty array instead of an undefined attribute.
   */
  listOfLayerEntryConfig: TypeListOfLayerEntryConfig = [];

  /**
   * Initial settings to apply to the GeoView layer at creation time. This attribute is allowed only if listOfLayerEntryConfig.length > 1.
   */
  initialSettings?: TypeLayerInitialSettings;

  /** layers of listOfLayerEntryConfig that did not load. */
  layerLoadError: { layer: string; consoleMessage: string }[] = [];

  /**
   * The structure of the vector or raster layers to be displayed for this GeoView class. This property points to the root of the layer tree,
   * unlike the olLayer (singular) property stored in the layer configuration entries list, which points to a node or leaf in the tree.
   * The initial value of olLayers is null, indicating that the layer tree has not been created.
   */
  olLayers: BaseLayer | null = null;

  // The service metadata.
  metadata: TypeJsonObject | null = null;

  /** Layer metadata */
  layerMetadata: Record<string, TypeJsonObject> = {};

  /** Layer temporal dimension indexed by layerPath. */
  layerTemporalDimension: Record<string, TimeDimension> = {};

  /** Attribution used in the OpenLayer source. */
  attributions: string[] = [];

  /** LayerSet handler functions indexed by layerPath. This property is used to deactivate (off) events attached to a layer. */
  registerToLayerSetListenerFunctions: Record<string, TypeLayerSetHandlerFunctions> = {};

  /** Date format object used to translate server to ISO format and ISO to server format */
  serverDateFragmentsOrder?: TypeDateFragments;

  /** Date format object used to translate internal UTC ISO format to the external format, the one used by the user */
  externalFragmentsOrder: TypeDateFragments;

  // LayerPath to use when we want to call a GeoView layer's method using the following syntaxe:
  // api.maps[mapId].layer.geoviewLayer(layerPath).getVisible()
  layerPathAssociatedToTheGeoviewLayer = '';

  /** ***************************************************************************************************************************
   * The class constructor saves parameters and common configuration parameters in attributes.
   *
   * @param {TypeGeoviewLayerType} type The type of GeoView layer that is instantiated.
   * @param {TypeGeoviewLayer} mapLayerConfig The GeoView layer configuration options.
   * @param {string} mapId The unique identifier of the map on which the GeoView layer will be drawn.
   */
  constructor(type: TypeGeoviewLayerType, mapLayerConfig: TypeGeoviewLayerConfig, mapId: string) {
    this.mapId = mapId;
    this.type = type;
    this.geoviewLayerId = mapLayerConfig.geoviewLayerId || generateId('');
    this.geoviewLayerName.en = mapLayerConfig?.geoviewLayerName?.en ? mapLayerConfig.geoviewLayerName.en : DEFAULT_LAYER_NAMES[type];
    this.geoviewLayerName.fr = mapLayerConfig?.geoviewLayerName?.fr ? mapLayerConfig.geoviewLayerName.fr : DEFAULT_LAYER_NAMES[type];
    if (mapLayerConfig.metadataAccessPath?.en) this.metadataAccessPath.en = mapLayerConfig.metadataAccessPath.en.trim();
    if (mapLayerConfig.metadataAccessPath?.fr) this.metadataAccessPath.fr = mapLayerConfig.metadataAccessPath.fr.trim();
    if (mapLayerConfig.listOfLayerEntryConfig.length === 1) this.listOfLayerEntryConfig = mapLayerConfig.listOfLayerEntryConfig;
    else {
      const layerGroup = new TypeLayerGroupEntryConfig({
        geoviewLayerConfig: mapLayerConfig.listOfLayerEntryConfig[0].geoviewLayerConfig,
        layerId: this.geoviewLayerId,
        layerName: this.geoviewLayerName,
        isMetadataLayerGroup: false,
        initialSettings: mapLayerConfig.initialSettings,
        listOfLayerEntryConfig: mapLayerConfig.listOfLayerEntryConfig,
      } as TypeLayerGroupEntryConfig);
      this.listOfLayerEntryConfig = [layerGroup];
      layerGroup.listOfLayerEntryConfig.forEach((layerConfig, i) => {
        layerGroup.listOfLayerEntryConfig[i].parentLayerConfig = layerGroup;
      });
    }
    this.initialSettings = mapLayerConfig.initialSettings;
    this.serverDateFragmentsOrder = mapLayerConfig.serviceDateFormat
      ? api.dateUtilities.getDateFragmentsOrder(mapLayerConfig.serviceDateFormat)
      : undefined;
    this.externalFragmentsOrder = api.dateUtilities.getDateFragmentsOrder(mapLayerConfig.externalDateFormat);
    const { layer } = api.maps[mapId];
    layer.geoviewLayers[this.geoviewLayerId] = this;
    this.initRegisteredLayers();
    this.registerAllLayersToLayerSets();
  }

  /** ***************************************************************************************************************************
   * Change the layer phase property and emit an event to update existing layer sets.
   *
   * @param {string} layerPhase The value to assign to the layer phase property.
   * @param {string} layerPath The layer path to the layer's configuration affected by the change.
   */
  setLayerPhase(layerPhase: string, layerPath?: string) {
    if (layerPath) {
      this.layerPhase = layerPhase;
      const layerConfig = this.getLayerConfig(layerPath) as TypeBaseLayerEntryConfig;
      layerConfig.layerPhase = layerPhase;
      api.event.emit(LayerSetPayload.createLayerSetChangeLayerPhasePayload(this.mapId, layerPath, layerPhase));
    } else {
      this.layerPhase = layerPhase;
      const changeAllSublayerPhase = (listOfLayerEntryConfig = this.listOfLayerEntryConfig) => {
        listOfLayerEntryConfig.forEach((subLayerConfig) => {
          if (layerEntryIsGroupLayer(subLayerConfig)) changeAllSublayerPhase(subLayerConfig.listOfLayerEntryConfig);
          else {
            (subLayerConfig as TypeBaseLayerEntryConfig).layerPhase = layerPhase;
            api.event.emit(LayerSetPayload.createLayerSetChangeLayerPhasePayload(this.mapId, subLayerConfig.layerPath, layerPhase));
          }
        });
      };
      changeAllSublayerPhase();
    }
  }

  /** ***************************************************************************************************************************
   * Change the layer status property and emit an event to update existing layer sets.
   *
   * @param {TypeLayerStatus} layerStatus The value to assign to the layer status property.
   * @param {string} layerPath The layer path to the layer's configuration affected by the change.
   */
  setLayerStatus(layerStatus: TypeLayerStatus, layerPath?: string) {
    layerPath = layerPath || this.layerPathAssociatedToTheGeoviewLayer;
    const layerConfig = this.getLayerConfig(layerPath) as TypeBaseLayerEntryConfig;
    layerConfig.layerStatus = layerStatus;
    api.event.emit(LayerSetPayload.createLayerSetChangeLayerStatusPayload(this.mapId, layerPath, layerStatus!));
    if (layerStatus === 'processed') this.setLayerPhase('processed', layerPath);
  }

  /** ***************************************************************************************************************************
   * Process recursively the list of layer entries to see if all of them are processed.
   *
   * @param {TypeListOfLayerEntryConfig} listOfLayerEntryConfig The list of layer's configuration
   *                                                            (default: this.listOfLayerEntryConfig).
   *
   * @returns {boolean} true when all layers are processed.
   */
  allLayerEntryConfigProcessed(listOfLayerEntryConfig: TypeListOfLayerEntryConfig = this.listOfLayerEntryConfig): boolean {
    // Try to find an unprocessed layer. If you can, return false
    return !listOfLayerEntryConfig.find((layerConfig: TypeLayerEntryConfig) => {
      if (layerEntryIsGroupLayer(layerConfig)) return !this.allLayerEntryConfigProcessed(layerConfig.listOfLayerEntryConfig);
      return !['processed', 'error', 'loaded'].includes((layerConfig as TypeBaseLayerEntryConfig).layerStatus || '');
    });
  }

  /** ***************************************************************************************************************************
   * Process recursively the list of layer entries to see if all of them are in error.
   *
   * @param {TypeListOfLayerEntryConfig} listOfLayerEntryConfig The list of layer's configuration
   *                                                            (default: this.listOfLayerEntryConfig).
   *
   * @returns {boolean} true when all layers are in error.
   */
  allLayerEntryConfigAreInError(listOfLayerEntryConfig: TypeListOfLayerEntryConfig = this.listOfLayerEntryConfig): boolean {
    // Try to find a layer not in error. If you can, return false
    return !listOfLayerEntryConfig.find((layerConfig: TypeLayerEntryConfig) => {
      if (layerEntryIsGroupLayer(layerConfig)) return !this.allLayerEntryConfigAreInError(layerConfig.listOfLayerEntryConfig);
      return (layerConfig as TypeBaseLayerEntryConfig).layerStatus !== 'error';
    });
  }

  /** ***************************************************************************************************************************
   * Recursively process the list of layer entries to count all layers in error.
   *
   * @param {TypeListOfLayerEntryConfig} listOfLayerEntryConfig The list of layer's configuration
   *                                                            (default: this.listOfLayerEntryConfig).
   *
   * @returns {number} The number of layers in error.
   */
  countErrorStatus(listOfLayerEntryConfig: TypeListOfLayerEntryConfig = this.listOfLayerEntryConfig): number {
    return listOfLayerEntryConfig.reduce((counter: number, layerConfig: TypeLayerEntryConfig) => {
      if (layerEntryIsGroupLayer(layerConfig)) return counter + this.countErrorStatus(layerConfig.listOfLayerEntryConfig);
      if ((layerConfig as TypeBaseLayerEntryConfig).layerStatus === 'error') return counter + 1;
      return counter;
    }, 0);
  }

  /** ***************************************************************************************************************************
   * Process recursively the list of layer entries to initialize the registeredLayers object.
   *
   * @param {TypeListOfLayerEntryConfig} listOfLayerEntryConfig The list of layer entries to process.
   */
  private initRegisteredLayers(listOfLayerEntryConfig: TypeListOfLayerEntryConfig = this.listOfLayerEntryConfig) {
    const { layer } = api.maps[this.mapId];
    listOfLayerEntryConfig.forEach((layerConfig: TypeLayerEntryConfig, i) => {
      if (layer.isRegistered(layerConfig)) {
        this.layerLoadError.push({
          layer: layerConfig.layerPath,
          consoleMessage: `Duplicate layerPath (mapId:  ${this.mapId}, layerPath: ${layerConfig.layerPath})`,
        });
        // Duplicat layer can't be kept because it has the same layer path than the first encontered layer.
        delete listOfLayerEntryConfig[i];
      } else {
        layerConfig.layerPath = layerConfig.getLayerPath(layerConfig);
        layerConfig.geoviewLayerInstance = this;
        layer.registerLayerConfig(layerConfig);
      }
      if (layerEntryIsGroupLayer(layerConfig)) this.initRegisteredLayers(layerConfig.listOfLayerEntryConfig);
    });
  }

  /** ***************************************************************************************************************************
   * Process recursively the list of layer Entries to register all layers to the layerSets.
   *
   * @param {TypeListOfLayerEntryConfig} listOfLayerEntryConfig The list of layer entries to process.
   */
  private registerAllLayersToLayerSets(listOfLayerEntryConfig: TypeListOfLayerEntryConfig = this.listOfLayerEntryConfig) {
    if (listOfLayerEntryConfig.length === 1)
      if (layerEntryIsGroupLayer(listOfLayerEntryConfig[0]))
        this.registerAllLayersToLayerSets(listOfLayerEntryConfig[0].listOfLayerEntryConfig!);
      else this.registerToLayerSets(listOfLayerEntryConfig[0] as TypeBaseLayerEntryConfig);
    else if (listOfLayerEntryConfig.length > 0)
      listOfLayerEntryConfig.forEach((layerConfig) => {
        if (layerEntryIsGroupLayer(layerConfig)) this.registerAllLayersToLayerSets(layerConfig.listOfLayerEntryConfig!);
        else {
          this.registerToLayerSets(layerConfig as TypeBaseLayerEntryConfig);
          this.setLayerPhase('newInstance', layerConfig.layerPath);
        }
      });
  }

  /** ***************************************************************************************************************************
   * This method is used to create the layers specified in the listOfLayerEntryConfig attribute inherited from its parent.
   * Normally, it is the second method called in the life cycle of a GeoView layer, the first one being the constructor.
   * Its code is the same for all child classes. It must first validate that the olLayers attribute is null indicating
   * that the method has never been called before for this layer. If this is not the case, an error message must be sent.
   * Then, it calls the abstract method getAdditionalServiceDefinition. For example, when the child is a WFS service, this
   * method executes the GetCapabilities request and saves the result in the metadata attribute of the class. It also process
   * the layer's metadata for each layer in the listOfLayerEntryConfig tree in order to define the missing pieces of the layer's
   * configuration. Layer's configuration can come from the configuration of the GeoView layer or from the information saved by
   * the method processListOfLayerEntryMetadata, priority being given to the first of the two. When the GeoView layer does not
   * have a service definition, the getAdditionalServiceDefinition method does nothing.
   *
   * Finally, the processListOfLayerEntryConfig is called to instantiate each layer identified by the listOfLayerEntryConfig
   * attribute. This method will also register the layers to all layer sets that offer this possibility. For example, if a layer
   * is queryable, it will subscribe to the details-panel and every time the user clicks on the map, the panel will ask the layer
   * to return the descriptive information of all the features in a tolerance radius. This information will be used to populate
   * the details-panel.
   */
  async createGeoViewLayers(): Promise<void> {
    if (this.olLayers === null) {
      try {
        // Log
        logger.logTraceCore('createGeoViewLayers', this.listOfLayerEntryConfig);

        // Try to get a key for logging timings
        let logTimingsKey;
        if (this.listOfLayerEntryConfig.length > 0) logTimingsKey = `${this.mapId} | ${this.listOfLayerEntryConfig[0].layerPath}`;

        // Log
        if (logTimingsKey) logger.logMarkerStart(logTimingsKey);

        // Set the phase
        this.setLayerPhase('createGeoViewLayers');

        // Get additional service and await
        await this.getAdditionalServiceDefinition();

        // Log the time it took thus far
        if (logTimingsKey) logger.logMarkerCheck(logTimingsKey, 'to get additional service definition (since creating the geoview layer)');

        // Process list of layers and await
        this.olLayers = await this.processListOfLayerEntryConfig(this.listOfLayerEntryConfig);

        // Log the time it took thus far
        if (logTimingsKey) logger.logMarkerCheck(logTimingsKey, 'to process list of layer entry config (since creating the geoview layer)');
      } catch (error) {
        // Log error
        logger.logError(error);
      }
    } else {
      const message = replaceParams([this.mapId], getLocalizedMessage(this.mapId, 'validation.layer.createtwice'));
      showError(this.mapId, message);
      // Log
      logger.logError(`Can not execute twice the createGeoViewLayers method for the map ${this.mapId}`);
    }
  }

  /** ***************************************************************************************************************************
   * This method reads from the metadataAccessPath additional information to complete the GeoView layer configuration.
   * If the GeoView layer does not have a service definition, this method does nothing.
   */
  protected async getAdditionalServiceDefinition(): Promise<void> {
    this.setLayerPhase('getAdditionalServiceDefinition');
    try {
      await this.fetchServiceMetadata();
      if (this.listOfLayerEntryConfig.length) {
        // Recursively process the configuration tree of layer entries by removing layers in error and processing valid layers.
        this.validateListOfLayerEntryConfig(this.listOfLayerEntryConfig);
        await this.processListOfLayerEntryMetadata(this.listOfLayerEntryConfig);
      }
    } catch (error) {
      // Log
      logger.logError(error);
    }
  }

  /** ***************************************************************************************************************************
   * This method reads the service metadata from the metadataAccessPath.
   *
   * @returns {Promise<void>} A promise that the execution is completed.
   */
  protected async fetchServiceMetadata(): Promise<void> {
    this.setLayerPhase('fetchServiceMetadata');
    const metadataUrl = getLocalizedValue(this.metadataAccessPath, this.mapId);
    if (metadataUrl) {
      try {
        const metadataString = await getXMLHttpRequest(`${metadataUrl}?f=json`);
        if (metadataString === '{}') {
          this.setAllLayerStatusToError(this.listOfLayerEntryConfig, 'Unable to read metadata');
        } else {
          this.metadata = toJsonObject(JSON.parse(metadataString));
          const { copyrightText } = this.metadata;
          if (copyrightText) this.attributions.push(copyrightText as string);
        }
      } catch (error) {
        // Log
        logger.logError(error);
        this.setAllLayerStatusToError(this.listOfLayerEntryConfig, 'Unable to read metadata');
      }
    }
  }

  /** ***************************************************************************************************************************
   * This method recursively validates the configuration of the layer entries to ensure that each layer is correctly defined. If
   * necessary, additional code can be executed in the child method to complete the layer configuration.
   *
   * @param {TypeListOfLayerEntryConfig} listOfLayerEntryConfig The list of layer entries configuration to validate.
   */
  protected abstract validateListOfLayerEntryConfig(listOfLayerEntryConfig: TypeListOfLayerEntryConfig): void;

  /** ***************************************************************************************************************************
   * This method processes recursively the metadata of each layer in the "layer list" configuration.
   *
   * @param {TypeListOfLayerEntryConfig} listOfLayerEntryConfig The list of layers to process.
   *
   * @returns {Promise<void>} A promise that the execution is completed.
   */
  protected async processListOfLayerEntryMetadata(listOfLayerEntryConfig: TypeListOfLayerEntryConfig): Promise<void> {
    this.setLayerPhase('processListOfLayerEntryMetadata');
    try {
      const promisedAllLayerDone: Promise<void>[] = [];
      listOfLayerEntryConfig.forEach((layerConfig: TypeLayerEntryConfig) => {
        if (layerEntryIsGroupLayer(layerConfig))
          if (layerConfig.isMetadataLayerGroup) promisedAllLayerDone.push(this.processMetadataGroupLayer(layerConfig));
          else promisedAllLayerDone.push(this.processListOfLayerEntryMetadata(layerConfig.listOfLayerEntryConfig));
        else promisedAllLayerDone.push(this.processLayerMetadata(layerConfig));
      });
      await Promise.all(promisedAllLayerDone);
    } catch (error) {
      // Log
      logger.logError(error);
    }
  }

  /** ***************************************************************************************************************************
   * This method is used to process metadata group layer entries. These layers behave as a GeoView group layer and also as a data
   * layer (i.e. they have extent, visibility and query flag definition). Metadata group layers can be identified by
   * the presence of an isMetadataLayerGroup attribute set to true.
   *
   * @param {TypeLayerGroupEntryConfig} layerConfig The layer entry configuration to process.
   *
   * @returns {Promise<void>} A promise that the vector layer configuration has its metadata and group layers processed.
   */
  private async processMetadataGroupLayer(layerConfig: TypeLayerGroupEntryConfig): Promise<void> {
    try {
      await this.processLayerMetadata(layerConfig);
      await this.processListOfLayerEntryMetadata(layerConfig.listOfLayerEntryConfig!);
    } catch (error) {
      // Log
      logger.logError(error);
    }
  }

  /** ***************************************************************************************************************************
   * This method is used to process the layer's metadata. It will fill the empty outfields and aliasFields properties of the
   * layer's configuration when applicable.
   *
   * @param {TypeLayerEntryConfig} layerConfig The layer entry configuration to process.
   *
   * @returns {Promise<void>} A promise that the vector layer configuration has its metadata processed.
   */
  protected processLayerMetadata(layerConfig: TypeLayerEntryConfig): Promise<void> {
    if (!layerConfig.source) layerConfig.source = {};
    if (!layerConfig.source.featureInfo) layerConfig.source.featureInfo = { queryable: true };
    return Promise.resolve();
  }

  /** ***************************************************************************************************************************
   * Process recursively the list of layer Entries to create the layers and the layer groups.
   *
   * @param {TypeListOfLayerEntryConfig} listOfLayerEntryConfig The list of layer entries to process.
   * @param {LayerGroup} layerGroup Optional layer group to use when we have many layers. The very first call to
   *  processListOfLayerEntryConfig must not provide a value for this parameter. It is defined for internal use.
   *
   * @returns {Promise<BaseLayer | null>} The promise that the layers were processed.
   */
  protected async processListOfLayerEntryConfig(
    listOfLayerEntryConfig: TypeListOfLayerEntryConfig,
    layerGroup?: LayerGroup
  ): Promise<BaseLayer | null> {
    // Log
    logger.logTraceCore('processListOfLayerEntryConfig', listOfLayerEntryConfig);

    this.setLayerPhase('processListOfLayerEntryConfig');
    try {
      if (listOfLayerEntryConfig.length === 1) {
        if (layerEntryIsGroupLayer(listOfLayerEntryConfig[0])) {
          const newLayerGroup = this.createLayerGroup(listOfLayerEntryConfig[0]);
          const groupReturned = await this.processListOfLayerEntryConfig(listOfLayerEntryConfig[0].listOfLayerEntryConfig!, newLayerGroup);
          if (groupReturned) {
            if (layerGroup) layerGroup.getLayers().push(groupReturned);
            return groupReturned;
          }
          this.layerLoadError.push({
            layer: listOfLayerEntryConfig[0].layerPath,
            consoleMessage: `Unable to create group layer ${listOfLayerEntryConfig[0].layerPath} on map ${this.mapId}`,
          });
          return null;
        }

        if ((listOfLayerEntryConfig[0] as TypeBaseLayerEntryConfig).layerStatus === 'error') return null;
        const { layerPath } = listOfLayerEntryConfig[0];
        const baseLayer = await this.processOneLayerEntry(listOfLayerEntryConfig[0] as TypeBaseLayerEntryConfig);
        if (baseLayer) {
          baseLayer.setVisible(listOfLayerEntryConfig[0].initialSettings?.visible !== 'no');
          this.registerToLayerSets(listOfLayerEntryConfig[0] as TypeBaseLayerEntryConfig);
          if (layerGroup) layerGroup!.getLayers().push(baseLayer!);
          this.setLayerStatus('processed', layerPath);
          return layerGroup || baseLayer;
        }
        this.layerLoadError.push({
          layer: listOfLayerEntryConfig[0].layerPath,
          consoleMessage: `Unable to create layer ${listOfLayerEntryConfig[0].layerPath} on map ${this.mapId}`,
        });
        this.setLayerStatus('error', layerPath);
        return null;
      }

      if (!layerGroup) {
        // All children of this level in the tree have the same parent, so we use the first element of the array to retrieve the parent node.
        layerGroup = this.createLayerGroup(listOfLayerEntryConfig[0].parentLayerConfig as TypeLayerEntryConfig);
      }
      const promiseOfLayerCreated: Promise<BaseLayer | LayerGroup | null>[] = [];
      listOfLayerEntryConfig.forEach((layerConfig, i) => {
        if (layerEntryIsGroupLayer(layerConfig)) {
          const newLayerGroup = this.createLayerGroup(listOfLayerEntryConfig[i]);
          promiseOfLayerCreated.push(this.processListOfLayerEntryConfig(layerConfig.listOfLayerEntryConfig!, newLayerGroup));
        } else if ((listOfLayerEntryConfig[i] as TypeBaseLayerEntryConfig).layerStatus === 'error')
          promiseOfLayerCreated.push(Promise.resolve(null));
        else {
          promiseOfLayerCreated.push(this.processOneLayerEntry(layerConfig as TypeBaseLayerEntryConfig));
        }
      });
      const listOfLayerCreated = await Promise.all(promiseOfLayerCreated);
      listOfLayerCreated.forEach((baseLayer, i) => {
        const { layerPath } = listOfLayerEntryConfig[i];
        if (baseLayer) {
          const layerConfig = baseLayer?.get('layerConfig') as TypeBaseLayerEntryConfig;
          if (layerConfig) {
            baseLayer.setVisible(layerConfig.initialSettings?.visible !== 'no');

            if (!layerEntryIsGroupLayer(listOfLayerEntryConfig[i])) {
              this.registerToLayerSets(baseLayer.get('layerConfig') as TypeBaseLayerEntryConfig);
              this.setLayerStatus('processed', layerPath);
            }
            layerGroup!.getLayers().push(baseLayer);
          }
        } else {
          this.layerLoadError.push({
            layer: listOfLayerEntryConfig[i].layerPath,
            consoleMessage: `Unable to create ${layerEntryIsGroupLayer(listOfLayerEntryConfig[i]) ? 'group' : ''} layer ${
              listOfLayerEntryConfig[i].layerPath
            } on map ${this.mapId}`,
          });
          this.setLayerStatus('error', layerPath);
        }
      });

      return layerGroup!;
    } catch (error) {
      // Log
      logger.logError(error);
      return null;
    }
  }

  /** ***************************************************************************************************************************
   * This method creates a GeoView layer using the definition provided in the layerConfig parameter.
   *
   * @param {TypeLayerEntryConfig} layerConfig Information needed to create the GeoView layer.
   *
   * @returns {Promise<BaseLayer | null>} The GeoView layer that has been created.
   */
  protected abstract processOneLayerEntry(layerConfig: TypeBaseLayerEntryConfig): Promise<BaseLayer | null>;

  /** ***************************************************************************************************************************
   * Return feature information for the layer specified.
   *
   * @param {QueryType} queryType  The type of query to perform.
   * @param {string} layerPath The layer path to the layer's configuration.
   * @param {TypeLocation} location An optionsl pixel, coordinate or polygon that will be used by the query.
   *
   * @returns {Promise<TypeFeatureInfoResult>} The feature info table.
   */
  async getFeatureInfo(queryType: QueryType, layerPath: string, location: TypeLocation = null): Promise<TypeArrayOfFeatureInfoEntries> {
    try {
      // Get the layer config
      const layerConfig = this.getLayerConfig(layerPath);

      if (!layerConfig || !layerConfig.source?.featureInfo?.queryable) return [];

      // Log
      logger.logTraceCore('abstract-geoview-layers.getFeatureInfo', queryType, layerPath);
      const logMarkerKey = `${queryType} | ${layerPath}`;
      logger.logMarkerStart(logMarkerKey);

      let promiseGetFeature: Promise<TypeArrayOfFeatureInfoEntries>;
      switch (queryType) {
        case 'all':
          promiseGetFeature = this.getAllFeatureInfo(layerPath);
          break;
        case 'at_pixel':
          promiseGetFeature = this.getFeatureInfoAtPixel(location as Pixel, layerPath);
          break;
        case 'at_coordinate':
          promiseGetFeature = this.getFeatureInfoAtCoordinate(location as Coordinate, layerPath);
          break;
        case 'at_long_lat':
          promiseGetFeature = this.getFeatureInfoAtLongLat(location as Coordinate, layerPath);
          break;
        case 'using_a_bounding_box':
          promiseGetFeature = this.getFeatureInfoUsingBBox(location as Coordinate[], layerPath);
          break;
        case 'using_a_polygon':
          promiseGetFeature = this.getFeatureInfoUsingPolygon(location as Coordinate[], layerPath);
          break;
        default:
          // Default is empty array
          promiseGetFeature = Promise.resolve([]);

          // Log
          logger.logWarning(`Queries using ${queryType} are invalid.`);
          break;
      }

      // Wait for results
      const arrayOfFeatureInfoEntries = await promiseGetFeature;

      // Log
      logger.logMarkerCheck(logMarkerKey, 'to getFeatureInfo', arrayOfFeatureInfoEntries);

      // Return the result
      return arrayOfFeatureInfoEntries;
    } catch (error) {
      // Log
      logger.logError(error);
      return [];
    }
  }

  /** ***************************************************************************************************************************
   * Return feature information for all the features on a layer. Returns an empty array [] when the layer is
   * not queryable.
   *
   * @param {string} layerPath The layer path to the layer's configuration.
   *
   * @returns {Promise<TypeArrayOfFeatureInfoEntries>} The feature info table.
   */

  protected getAllFeatureInfo(layerPath: string): Promise<TypeArrayOfFeatureInfoEntries> {
    // Log
    logger.logWarning('getAllFeatureInfo is not implemented!');
    return Promise.resolve([]);
  }

  /** ***************************************************************************************************************************
   * Return feature information for all the features around the provided Pixel. Returns an empty array [] when the layer is
   * not queryable.
   *
   * @param {Coordinate} location The pixel coordinate that will be used by the query.
   * @param {string} layerPath The layer path to the layer's configuration.
   *
   * @returns {Promise<TypeArrayOfFeatureInfoEntries>} The feature info table.
   */

  protected getFeatureInfoAtPixel(location: Pixel, layerPath: string): Promise<TypeArrayOfFeatureInfoEntries> {
    // Log
    logger.logWarning('getFeatureInfoAtPixel is not implemented!');
    return Promise.resolve([]);
  }

  /** ***************************************************************************************************************************
   * Return feature information for all the features around the provided coordinate. Returns an empty array [] when the layer is
   * not queryable.
   *
   * @param {Coordinate} location The coordinate that will be used by the query.
   * @param {string} layerPath The layer path to the layer's configuration.
   *
   * @returns {Promise<TypeArrayOfFeatureInfoEntries>} The feature info table.
   */

  protected getFeatureInfoAtCoordinate(location: Coordinate, layerPath: string): Promise<TypeArrayOfFeatureInfoEntries> {
    // Log
    logger.logWarning('getFeatureInfoAtCoordinate is not implemented!');
    return Promise.resolve([]);
  }

  /** ***************************************************************************************************************************
   * Return feature information for all the features around the provided longitude latitude. Returns an empty array [] when the
   * layer is not queryable.
   *
   * @param {Coordinate} location The coordinate that will be used by the query.
   * @param {string} layerPath The layer path to the layer's configuration.
   *
   * @returns {Promise<TypeArrayOfFeatureInfoEntries>} The feature info table.
   */

  protected getFeatureInfoAtLongLat(location: Coordinate, layerPath: string): Promise<TypeArrayOfFeatureInfoEntries> {
    // Log
    logger.logWarning('getFeatureInfoAtLongLat is not implemented!');
    return Promise.resolve([]);
  }

  /** ***************************************************************************************************************************
   * Return feature information for all the features in the provided bounding box. Returns an empty array [] when the layer is
   * not queryable.
   *
   * @param {Coordinate} location The coordinate that will be used by the query.
   * @param {string} layerPath The layer path to the layer's configuration.
   *
   * @returns {Promise<TypeArrayOfFeatureInfoEntries>} The feature info table.
   */

  protected getFeatureInfoUsingBBox(location: Coordinate[], layerPath: string): Promise<TypeArrayOfFeatureInfoEntries> {
    // Log
    logger.logWarning('getFeatureInfoUsingBBox is not implemented!');
    return Promise.resolve([]);
  }

  /** ***************************************************************************************************************************
   * Return feature information for all the features in the provided polygon. Returns an empty array [] when the layer is
   * not queryable.
   *
   * @param {Coordinate} location The coordinate that will be used by the query.
   * @param {string} layerPath The layer path to the layer's configuration.
   *
   * @returns {Promise<TypeArrayOfFeatureInfoEntries>} The feature info table.
   */

  protected getFeatureInfoUsingPolygon(location: Coordinate[], layerPath: string): Promise<TypeArrayOfFeatureInfoEntries> {
    // Log
    logger.logWarning('getFeatureInfoUsingPolygon is not implemented!');
    return Promise.resolve([]);
  }

  /** ***************************************************************************************************************************
   * This method register the layer entry to layer sets. Nothing is done if the registration is already done.
   *
   * @param {TypeBaseLayerEntryConfig} layerConfig The layer config to register.
   */
  protected registerToLayerSets(layerConfig: TypeBaseLayerEntryConfig) {
    const { layerPath } = layerConfig;
    if (!this.registerToLayerSetListenerFunctions[layerPath]) this.registerToLayerSetListenerFunctions[layerPath] = {};

    if (!this.registerToLayerSetListenerFunctions[layerPath].requestLayerInventory) {
      // Listen to events that request a layer inventory and emit a register payload event.
      // This will register all existing layers to a newly created layer set.
      this.registerToLayerSetListenerFunctions[layerPath].requestLayerInventory = (payload) => {
        if (payloadIsRequestLayerInventory(payload)) {
          // Log
          logger.logTraceDetailed('abstract-geoview-layers on requestLayerInventory', this.mapId, payload);

          const { layerSetId } = payload;
          api.event.emit(LayerSetPayload.createLayerRegistrationPayload(this.mapId, layerPath, 'add', layerSetId));
        }
      };

      api.event.on(
        EVENT_NAMES.LAYER_SET.REQUEST_LAYER_INVENTORY,
        this.registerToLayerSetListenerFunctions[layerPath].requestLayerInventory!,
        this.mapId
      );
    }

    if (!this.registerToLayerSetListenerFunctions[layerPath].queryLegend) {
      this.registerToLayerSetListenerFunctions[layerPath].queryLegend = (payload) => {
        if (payloadIsQueryLegend(payload)) {
          // Log
          logger.logTraceDetailed('abstract-geoview-layers on queryLegend', this.mapId, payload);

          this.getLegend(layerPath).then((queryResult) => {
            api.event.emit(GetLegendsPayload.createLegendInfoPayload(this.mapId, layerPath, queryResult));
          });
        }
      };

      api.event.on(
        EVENT_NAMES.GET_LEGENDS.QUERY_LEGEND,
        this.registerToLayerSetListenerFunctions[layerPath].queryLegend!,
        `${this.mapId}/${layerPath}`
      );
    }

    if (!this.registerToLayerSetListenerFunctions[layerPath].queryLayer) {
      if ('featureInfo' in layerConfig.source! && layerConfig.source.featureInfo?.queryable) {
        // Listen to events that request to query a layer and return the resultset to the requester.
        this.registerToLayerSetListenerFunctions[layerPath].queryLayer = async (payload) => {
          if (payloadIsQueryLayer(payload)) {
            // Log
            logger.logTraceDetailed('abstract-geoview-layers on queryLayer', this.mapId, payload);

            const { queryType, location, eventType, disabledLayers } = payload;
            if (disabledLayers[layerPath]) return;

            // Get Feature Info
            const queryResult = await this.getFeatureInfo(queryType, layerPath, location);
            api.event.emit(GetFeatureInfoPayload.createQueryResultPayload(this.mapId, layerPath, queryType, queryResult, eventType));
          }
        };

        api.event.on(EVENT_NAMES.GET_FEATURE_INFO.QUERY_LAYER, this.registerToLayerSetListenerFunctions[layerPath].queryLayer!, this.mapId);
      }
    }

    // Register to layer sets that are already created.
    api.event.emit(LayerSetPayload.createLayerRegistrationPayload(this.mapId, layerPath, 'add'));
  }

  /** ***************************************************************************************************************************
   * This method unregisters the layer from the layer sets.
   *
   * @param {TypeBaseLayerEntryConfig} layerConfig The layer entry to register.
   */
  unregisterFromLayerSets(layerConfig: TypeBaseLayerEntryConfig) {
    const { layerPath } = layerConfig;
    api.event.emit(LayerSetPayload.createLayerRegistrationPayload(this.mapId, layerPath, 'remove'));

    if (this.registerToLayerSetListenerFunctions[layerPath].requestLayerInventory) {
      api.event.off(
        EVENT_NAMES.LAYER_SET.REQUEST_LAYER_INVENTORY,
        this.mapId,
        this.registerToLayerSetListenerFunctions[layerPath].requestLayerInventory
      );
      delete this.registerToLayerSetListenerFunctions[layerPath].requestLayerInventory;
    }

    if (this.registerToLayerSetListenerFunctions[layerPath].queryLegend) {
      api.event.off(
        EVENT_NAMES.GET_LEGENDS.QUERY_LEGEND,
        `${this.mapId}/${layerPath}`,
        this.registerToLayerSetListenerFunctions[layerPath].queryLegend
      );
      delete this.registerToLayerSetListenerFunctions[layerPath].queryLegend;
    }

    if (this.registerToLayerSetListenerFunctions[layerPath].queryLayer) {
      api.event.off(EVENT_NAMES.GET_FEATURE_INFO.QUERY_LAYER, this.mapId, this.registerToLayerSetListenerFunctions[layerPath].queryLayer);
      delete this.registerToLayerSetListenerFunctions[layerPath].queryLayer;
    }
  }

  /** ***************************************************************************************************************************
   * This method create a layer group.
   * @param {TypeLayerEntryConfig} layerConfig The layer configuration.
   * @returns {LayerGroup} A new layer group.
   */
  protected createLayerGroup(layerConfig: TypeLayerEntryConfig): LayerGroup {
    const layerGroupOptions: LayerGroupOptions = {
      layers: new Collection(),
      properties: { layerConfig },
    };
    if (layerConfig.initialSettings?.extent !== undefined) layerGroupOptions.extent = layerConfig.initialSettings?.extent;
    if (layerConfig.initialSettings?.maxZoom !== undefined) layerGroupOptions.maxZoom = layerConfig.initialSettings?.maxZoom;
    if (layerConfig.initialSettings?.minZoom !== undefined) layerGroupOptions.minZoom = layerConfig.initialSettings?.minZoom;
    if (layerConfig.initialSettings?.opacity !== undefined) layerGroupOptions.opacity = layerConfig.initialSettings?.opacity;
    if (layerConfig.initialSettings?.visible !== undefined)
      layerGroupOptions.visible = layerConfig.initialSettings?.visible === 'yes' || layerConfig.initialSettings?.visible === 'always';
    layerConfig.olLayer = new LayerGroup(layerGroupOptions);
    return layerConfig.olLayer as LayerGroup;
  }

  /** ***************************************************************************************************************************
   * Get the layer configuration of the specified layer path.
   *
   * @param {string} layerPath The layer path.
   *
   * @returns {TypeLayerEntryConfig | undefined} The layer configuration or undefined if not found.
   */
  getLayerConfig(layerPath: string): TypeLayerEntryConfig | undefined {
    return api.maps?.[this.mapId]?.layer?.registeredLayers?.[layerPath];
  }

  /**
   * Asynchronously gets the layer configuration of the specified layerPath.
   * If the layer configuration we're searching for has to be loaded, set mustBeLoaded to true when awaiting on this method.
   * This function waits the timeout period before abandonning (or uses the default timeout when not provided).
   * Note this function uses the 'Async' suffix to differentiate it from 'getLayerConfig'.
   *
   * @param {string} layerPath the layer path to look for
   * @param {string} mustBeLoaded indicate if the layer we're searching for must be found only once loaded
   * @param {string} timeout optionally indicate the timeout after which time to abandon the promise
   * @param {string} checkFrequency optionally indicate the frequency at which to check for the condition on the layer
   * @returns a promise with the TypeLayerEntryConfig or null when layer config was not found
   * @throws an exception when the layer config for the layer path was found, but failed to become in loaded status before the timeout expired
   */
  async getLayerConfigAsync(
    layerPath: string,
    mustBeLoaded: boolean,
    timeout?: number,
    checkFrequency?: number
  ): Promise<TypeLayerEntryConfig> {
    // Redirects
    const layer = this.getLayerConfig(layerPath);

    // If layer was found
    if (layer) {
      // Check if not waiting and returning immediately
      if (!mustBeLoaded) return Promise.resolve(layer);

      try {
        // Waiting for the loaded or error status, possibly throwing exception if timing out
        await this.waitForLoadedOrErrorStatus(layer as TypeBaseLayerEntryConfig, timeout, checkFrequency);
      } catch (error) {
        // Throw
        throw new Error(`Layer ${layerPath} has failed to respond for the layer config.`);
      }

      // At this point, the layer has a status of either 'loaded' or 'error'
      // Check the layer status
      if (layer.layerStatus === 'loaded') return Promise.resolve(layer);
      throw new Error(`Layer ${layerPath} has resolved in an error status for the layer config; failed to load.`);
    }

    // Throw
    throw new Error(`Layer ${layerPath} doesn't exist. Couldn't get its layer config.`);
  }

  /**
   * Returns a Promise that will be resolved once the given layer config is in a loaded or error status.
   * This function waits the timeout period before abandonning (or uses the default timeout when not provided).
   *
   * @param {string} layerConfig the layer config
   * @param {string} timeout optionally indicate the timeout after which time to abandon the promise
   * @param {string} checkFrequency optionally indicate the frequency at which to check for the condition on the layer config
   * @throws an exception when the layer failed to become in loaded or error status before the timeout expired
   */
  async waitForLoadedOrErrorStatus(layerConfig: TypeBaseLayerEntryConfig, timeout?: number, checkFrequency?: number): Promise<void> {
    // Wait for the loaded state
    await whenThisThen(
      () => {
        return layerConfig.layerStatus === 'loaded' || layerConfig.layerStatus === 'error';
      },
      timeout,
      checkFrequency
    );

    // Resolve successfully, otherwise an exception has been thrown already
    return Promise.resolve();
  }

  /** ***************************************************************************************************************************
   * Returns the layer bounds or undefined if not defined in the layer configuration or the metadata. If projectionCode is
   * defined, returns the bounds in the specified projection otherwise use the map projection. The bounds are different from the
   * extent. They are mainly used for display purposes to show the bounding box in which the data resides and to zoom in on the
   * entire layer data. It is not used by openlayer to limit the display of data on the map.
   *
   * @param {string} layerPath The layer path to the layer's configuration.
   * @param {string | number | undefined} projectionCode Optional projection code to use for the returned bounds.
   *
   * @returns {Extent} The layer bounding box.
   */
  getMetadataBounds(layerPath: string, projectionCode: string | number | undefined = undefined): Extent | undefined {
    let bounds: Extent | undefined;
    const processGroupLayerBounds = (listOfLayerEntryConfig: TypeListOfLayerEntryConfig) => {
      listOfLayerEntryConfig.forEach((layerConfig) => {
        if (layerEntryIsGroupLayer(layerConfig)) processGroupLayerBounds(layerConfig.listOfLayerEntryConfig);
        else if (layerConfig.initialSettings?.bounds) {
          if (!bounds)
            bounds = [
              layerConfig.initialSettings.bounds[0],
              layerConfig.initialSettings.bounds[1],
              layerConfig.initialSettings.bounds[2],
              layerConfig.initialSettings.bounds[3],
            ];
          else
            bounds = [
              Math.min(layerConfig.initialSettings.bounds[0], bounds[0]),
              Math.min(layerConfig.initialSettings.bounds[1], bounds[1]),
              Math.max(layerConfig.initialSettings.bounds[2], bounds[2]),
              Math.max(layerConfig.initialSettings.bounds[3], bounds[3]),
            ];
        }
      });
    };
    // ! The following code will need to be modified when the topmost layer of a GeoView
    // ! layer creates dynamicaly a group out of a list of layers.
    const layerConfig: TypeLayerEntryConfig | TypeListOfLayerEntryConfig | undefined = layerPath.includes('/')
      ? this.getLayerConfig(layerPath)
      : this.listOfLayerEntryConfig;
    if (layerConfig) {
      if (Array.isArray(layerConfig)) processGroupLayerBounds(layerConfig);
      else processGroupLayerBounds([layerConfig]);
      if (projectionCode && bounds) return api.projection.transformExtent(bounds, `EPSG:4326`, `EPSG:${projectionCode}`);
    }
    return bounds;
  }

  /** ***************************************************************************************************************************
   * Returns the domaine of the specified field or null if the field has no domain.
   *
   * @param {string} fieldName field name for which we want to get the domaine.
   * @param {TypeLayerEntryConfig} layerConfig layer configuration.
   *
   * @returns {null | codedValueType | rangeDomainType} The domain of the field.
   */

  protected getFieldDomain(fieldName: string, layerConfig: TypeLayerEntryConfig): null | codedValueType | rangeDomainType {
    return null;
  }

  /** ***************************************************************************************************************************
   * Extract the type of the specified field from the metadata. If the type can not be found, return 'string'.
   *
   * @param {string} fieldName field name for which we want to get the type.
   * @param {TypeLayerEntryConfig} layerConfig layer configuration.
   *
   * @returns {'string' | 'date' | 'number'} The type of the field.
   */

  protected getFieldType(fieldName: string, layerConfig: TypeLayerEntryConfig): 'string' | 'date' | 'number' {
    return 'string';
  }

  /** ***************************************************************************************************************************
   * Return the extent of the layer or undefined if it will be visible regardless of extent. The layer extent is an array of
   * numbers representing an extent: [minx, miny, maxx, maxy]. This routine return undefined when the layer path can't be found.
   * The extent is used to clip the data displayed on the map.
   *
   * @param {string} layerPath Layer path to the layer's configuration.
   *
   * @returns {Extent} The layer extent.
   */
  getExtent(layerPath?: string): Extent | undefined {
    layerPath = layerPath || this.layerPathAssociatedToTheGeoviewLayer;
    const olLayer = this.getLayerConfig(layerPath)?.olLayer;
    return olLayer?.getExtent();
  }

  /** ***************************************************************************************************************************
   * set the extent of the layer. Use undefined if it will be visible regardless of extent. The layer extent is an array of
   * numbers representing an extent: [minx, miny, maxx, maxy]. This routine does nothing when the layerPath specified is not
   * found.
   *
   * @param {Extent} layerExtent The extent to assign to the layer.
   * @param {string} layerPath The layer path to the layer's configuration.
   */
  setExtent(layerExtent: Extent, layerPath?: string) {
    layerPath = layerPath || this.layerPathAssociatedToTheGeoviewLayer;
    const olLayer = this.getLayerConfig(layerPath)?.olLayer;
    if (olLayer) olLayer.setExtent(layerExtent);
  }

  /** ***************************************************************************************************************************
   * Return the opacity of the layer (between 0 and 1). This routine return undefined when the layerPath specified is not found.
   *
   * @param {string} layerPath The layer path to the layer's configuration.
   *
   * @returns {number} The opacity of the layer.
   */
  getOpacity(layerPath?: string): number | undefined {
    layerPath = layerPath || this.layerPathAssociatedToTheGeoviewLayer;
    const olLayer = this.getLayerConfig(layerPath)?.olLayer;
    return olLayer?.getOpacity();
  }

  /** ***************************************************************************************************************************
   * Set the opacity of the layer (between 0 and 1). This routine does nothing when the layerPath specified is not found.
   *
   * @param {number} layerOpacity The opacity of the layer.
   * @param {string} layerPath The layer path to the layer's configuration.
   *
   */
  setOpacity(layerOpacity: number, layerPath?: string) {
    layerPath = layerPath || this.layerPathAssociatedToTheGeoviewLayer;
    const olLayer = this.getLayerConfig(layerPath)?.olLayer;
    if (olLayer) olLayer.setOpacity(layerOpacity);
  }

  /** ***************************************************************************************************************************
   * Return the visibility of the layer (true or false). This routine return undefined when the layerPath specified is not found.
   *
   * @param {string} layerPath The layer path to the layer's configuration.
   *
   * @returns {boolean} The visibility of the layer.
   */
  getVisible(layerPath?: string): boolean | undefined {
    layerPath = layerPath || this.layerPathAssociatedToTheGeoviewLayer;
    const olLayer = this.getLayerConfig(layerPath)?.olLayer;
    return olLayer?.getVisible();
  }

  /** ***************************************************************************************************************************
   * Set the visibility of the layer (true or false). This routine does nothing when the layerPath specified is not found.
   *
   * @param {boolean} layerVisibility The visibility of the layer.
   * @param {string} layerPath The layer path to the layer's configuration.
   */
  setVisible(layerVisibility: boolean, layerPath?: string) {
    layerPath = layerPath || this.layerPathAssociatedToTheGeoviewLayer;
    const olLayer = this.getLayerConfig(layerPath)?.olLayer;
    if (olLayer) {
      olLayer.setVisible(layerVisibility);
      olLayer.changed();
    }
  }

  /** ***************************************************************************************************************************
   * Return the min zoom of the layer. This routine return undefined when the layerPath specified is not found.
   *
   * @param {string} layerPath The layer path to the layer's configuration.
   *
   * @returns {boolean} The visibility of the layer.
   */
  getMinZoom(layerPath?: string): number | undefined {
    layerPath = layerPath || this.layerPathAssociatedToTheGeoviewLayer;
    const olLayer = this.getLayerConfig(layerPath)?.olLayer;
    return olLayer?.getMinZoom();
  }

  /** ***************************************************************************************************************************
   * Set the min zoom of the layer. This routine does nothing when the layerPath specified is not found.
   *
   * @param {boolean} layerVisibility The visibility of the layer.
   * @param {string} layerPath The layer path to the layer's configuration.
   */
  setMinZoom(minZoom: number, layerPath?: string) {
    layerPath = layerPath || this.layerPathAssociatedToTheGeoviewLayer;
    const olLayer = this.getLayerConfig(layerPath)?.olLayer;
    if (olLayer) olLayer.setMinZoom(minZoom);
  }

  /** ***************************************************************************************************************************
   * Return the max zoom of the layer. This routine return undefined when the layerPath specified is not found.
   *
   * @param {string} layerPath The layer path to the layer's configuration.
   *
   * @returns {boolean} The visibility of the layer.
   */
  getMaxZoom(layerPath?: string): number | undefined {
    layerPath = layerPath || this.layerPathAssociatedToTheGeoviewLayer;
    const olLayer = this.getLayerConfig(layerPath)?.olLayer;
    return olLayer?.getMaxZoom();
  }

  /** ***************************************************************************************************************************
   * Set the max zoom of the layer. This routine does nothing when the layerPath specified is not found.
   *
   * @param {boolean} layerVisibility The visibility of the layer.
   * @param {string} layerPath The layer path to the layer's configuration.
   */
  setMaxZoom(maxZoom: number, layerPath?: string) {
    layerPath = layerPath || this.layerPathAssociatedToTheGeoviewLayer;
    const olLayer = this.getLayerConfig(layerPath)?.olLayer;
    if (olLayer) olLayer.setMaxZoom(maxZoom);
  }

  /** ***************************************************************************************************************************
   * Return the legend of the layer. This routine returns null when the layerPath specified is not found. If the style property
   * of the layerConfig object is undefined, the legend property of the object returned will be null.
   *
   * @param {string} layerPath The layer path to the layer's configuration.
   *
   * @returns {Promise<TypeLegend | null>} The legend of the layer.
   */
  async getLegend(layerPath?: string): Promise<TypeLegend | null> {
    try {
      layerPath = layerPath || this.layerPathAssociatedToTheGeoviewLayer;
      const layerConfig = this.getLayerConfig(layerPath) as
        | (TypeBaseLayerEntryConfig & {
            style: TypeStyleConfig;
          })
        | undefined;

      if (!layerConfig) {
        const legend: TypeLegend = {
          type: this.type,
          layerPath: `error - layerPath = ${layerPath}`,
          layerName: { en: 'config not found', fr: 'config inexistante' } as TypeLocalizedString,
          styleConfig: null,
          legend: null,
        };
        return legend;
      }

      if (!layerConfig.style) {
        const legend: TypeLegend = {
          type: this.type,
          layerPath,
          layerName: layerConfig.layerName!,
          styleConfig: layerConfig.style,
          legend: null,
        };
        return legend;
      }

      const legend: TypeLegend = {
        type: this.type,
        layerPath,
        layerName: layerConfig?.layerName,
        styleConfig: layerConfig?.style,
        legend: await api.maps[this.mapId].geoviewRenderer.getLegendStyles(layerConfig),
      };
      return legend;
    } catch (error) {
      // Log
      logger.logError(error);
      return null;
    }
  }

  /** ***************************************************************************************************************************
   * Get and format the value of the field with the name passed in parameter. Vector GeoView layers convert dates to milliseconds
   * since the base date. Vector feature dates must be in ISO format.
   *
   * @param {Feature} features The features that hold the field values.
   * @param {string} fieldName The field name.
   * @param {'number' | 'string' | 'date'} fieldType The field type.
   *
   * @returns {string | number | Date} The formatted value of the field.
   */
  protected getFieldValue(feature: Feature, fieldName: string, fieldType: 'number' | 'string' | 'date'): string | number | Date {
    const fieldValue = feature.get(fieldName);
    let returnValue: string | number | Date;
    if (fieldType === 'date') {
      if (typeof fieldValue === 'string') {
        if (!this.serverDateFragmentsOrder)
          this.serverDateFragmentsOrder = api.dateUtilities.getDateFragmentsOrder(api.dateUtilities.deduceDateFormat(fieldValue));
        returnValue = api.dateUtilities.applyInputDateFormat(fieldValue, this.serverDateFragmentsOrder);
      } else {
        // All vector dates are kept internally in UTC.
        returnValue = api.dateUtilities.convertToUTC(`${api.dateUtilities.convertMilisecondsToDate(fieldValue)}Z`);
      }
      const reverseTimeZone = true;
      if (this.externalFragmentsOrder)
        returnValue = api.dateUtilities.applyOutputDateFormat(returnValue, this.externalFragmentsOrder, reverseTimeZone);
      return returnValue;
    }
    return fieldValue;
  }

  /** ***************************************************************************************************************************
   * Convert the feature information to an array of TypeArrayOfFeatureInfoEntries.
   *
   * @param {Feature[]} features The array of features to convert.
   * @param {TypeImageLayerEntryConfig | TypeVectorLayerEntryConfig} layerConfig The layer configuration.
   *
   * @returns {TypeArrayOfFeatureInfoEntries} The Array of feature information.
   */
  protected async formatFeatureInfoResult(
    features: Feature[],
    layerConfig: TypeOgcWmsLayerEntryConfig | TypeEsriDynamicLayerEntryConfig | TypeVectorLayerEntryConfig
  ): Promise<TypeArrayOfFeatureInfoEntries> {
    try {
      if (!features.length) return [];

      const featureInfo = layerConfig?.source?.featureInfo;
      const fieldTypes = featureInfo?.fieldTypes?.split(',') as ('string' | 'number' | 'date')[];
      const outfields = getLocalizedValue(featureInfo?.outfields, this.mapId)?.split(',');
      const aliasFields = getLocalizedValue(featureInfo?.aliasFields, this.mapId)?.split(',');
      const queryResult: TypeArrayOfFeatureInfoEntries = [];
      let featureKeyCounter = 0;
      let fieldKeyCounter = 0;
      const promisedAllCanvasFound: Promise<{ feature: Feature; canvas: HTMLCanvasElement | undefined }>[] = [];
      features.forEach((featureNeedingItsCanvas) => {
        promisedAllCanvasFound.push(
          new Promise<{ feature: Feature; canvas: HTMLCanvasElement | undefined }>((resolveCanvas) => {
            api.maps[this.mapId].geoviewRenderer
              .getFeatureCanvas(featureNeedingItsCanvas, layerConfig as TypeVectorLayerEntryConfig)
              .then((canvas) => {
                resolveCanvas({ feature: featureNeedingItsCanvas, canvas });
              });
          })
        );
      });
      const arrayOfFeatureInfo = await Promise.all(promisedAllCanvasFound);
      arrayOfFeatureInfo.forEach(({ canvas, feature }) => {
        if (canvas) {
          const extent = feature.getGeometry()!.getExtent();

          const featureInfoEntry: TypeFeatureInfoEntry = {
            // feature key for building the data-grid
            featureKey: featureKeyCounter++,
            geoviewLayerType: this.type,
            extent,
            geometry: feature,
            featureIcon: canvas,
            fieldInfo: {},
            nameField: getLocalizedValue(layerConfig?.source?.featureInfo?.nameField, this.mapId) || null,
          };

          const featureFields = (feature as Feature).getKeys();
          featureFields.forEach((fieldName) => {
            if (fieldName !== 'geometry') {
              if (outfields?.includes(fieldName)) {
                const fieldIndex = outfields.indexOf(fieldName);
                featureInfoEntry.fieldInfo[fieldName] = {
                  fieldKey: fieldKeyCounter++,
                  value: this.getFieldValue(feature, fieldName, fieldTypes![fieldIndex]),
                  dataType: fieldTypes![fieldIndex] as 'string' | 'date' | 'number',
                  alias: aliasFields![fieldIndex],
                  domain: this.getFieldDomain(fieldName, layerConfig),
                };
              } else if (!outfields) {
                featureInfoEntry.fieldInfo[fieldName] = {
                  fieldKey: fieldKeyCounter++,
                  value: this.getFieldValue(feature, fieldName, this.getFieldType(fieldName, layerConfig)),
                  dataType: this.getFieldType(fieldName, layerConfig),
                  alias: fieldName,
                  domain: this.getFieldDomain(fieldName, layerConfig),
                };
              }
            }
          });
          queryResult.push(featureInfoEntry);
        }
      });
      return queryResult;
    } catch (error) {
      // Log
      logger.logError(error);
      return [];
    }
  }

  /** ***************************************************************************************************************************
   * Get the layerFilter that is associated to the layer. Returns undefined when the layer config can't be found using the layer
   * path.
   *
   * @param {string} layerPath The layer path to the layer's configuration.
   *
   * @returns {string | undefined} The filter associated to the layer or undefined.
   */
  getLayerFilter(layerPath?: string): string | undefined {
    layerPath = layerPath || this.layerPathAssociatedToTheGeoviewLayer;
    const layerConfig = this.getLayerConfig(layerPath);
    return layerConfig?.olLayer?.get('layerFilter');
  }

  /** ***************************************************************************************************************************
   * Get the layerFilter that is associated to the layer. Returns undefined when the layer config can't be found using the layer
   * path.
   *
   * @param {string} layerPath The layer path to the layer's configuration.
   *
   * @returns {TimeDimension} The temporal dimension associated to the layer or undefined.
   */
  getTemporalDimension(layerPath?: string): TimeDimension {
    layerPath = layerPath || this.layerPathAssociatedToTheGeoviewLayer;
    return this.layerTemporalDimension[layerPath];
  }

  /** ***************************************************************************************************************************
   * Get the bounds of the layer represented in the layerConfig pointed to by the cached layerPath, returns updated bounds
   *
   * @param {Extent | undefined} bounds The current bounding box to be adjusted.
   * @param {never} notUsed This parameter must not be provided. It is there to allow overloading of the method signature.
   *
   * @returns {Extent} The new layer bounding box.
   */
  protected abstract getBounds(bounds: Extent, notUsed?: never): Extent | undefined;

  /** ***************************************************************************************************************************
   * Get the bounds of the layer represented in the layerConfig pointed to by the layerPath, returns updated bounds
   *
   * @param {string} layerPath The Layer path to the layer's configuration.
   * @param {Extent | undefined} bounds The current bounding box to be adjusted.
   *
   * @returns {Extent} The new layer bounding box.
   */
  protected abstract getBounds(layerPath: string, bounds?: Extent): Extent | undefined;

  /** ***************************************************************************************************************************
   * Compute the layer bounds or undefined if the result can not be obtained from the feature extents that compose the layer. If
   * projectionCode is defined, returns the bounds in the specified projection otherwise use the map projection. The bounds are
   * different from the extent. They are mainly used for display purposes to show the bounding box in which the data resides and
   * to zoom in on the entire layer data. It is not used by openlayer to limit the display of data on the map.
   *
   * @param {string} layerPath The Layer path to the layer's configuration.
   * @param {string | number | undefined} projectionCode Optional projection code to use for the returned bounds. Default to
   * current projection.
   *
   * @returns {Extent} The layer bounding box.
   */
  calculateBounds(layerPath?: string): Extent | undefined {
    layerPath = layerPath || this.layerPathAssociatedToTheGeoviewLayer;
    let bounds: Extent | undefined;
    const processGroupLayerBounds = (listOfLayerEntryConfig: TypeListOfLayerEntryConfig) => {
      listOfLayerEntryConfig.forEach((layerConfig) => {
        if (layerEntryIsGroupLayer(layerConfig)) processGroupLayerBounds(layerConfig.listOfLayerEntryConfig);
        else {
          bounds = this.getBounds(layerConfig.layerPath, bounds);
        }
      });
    };

    const initialLayerConfig = this.getLayerConfig(layerPath);
    if (initialLayerConfig) {
      if (Array.isArray(initialLayerConfig)) processGroupLayerBounds(initialLayerConfig);
      else processGroupLayerBounds([initialLayerConfig]);
    }

    return bounds;
  }

  /** ***************************************************************************************************************************
   * Set the layerStatus code of all layers in the listOfLayerEntryConfig.
   *
   * @param {TypeListOfLayerEntryConfig} listOfLayerEntryConfig The list of layer's configuration.
   * @param {string} errorMessage The error message.
   */
  setAllLayerStatusToError(listOfLayerEntryConfig: TypeListOfLayerEntryConfig, errorMessage: string) {
    listOfLayerEntryConfig.forEach((layerConfig: TypeLayerEntryConfig) => {
      if (layerEntryIsGroupLayer(layerConfig)) this.setAllLayerStatusToError(layerConfig.listOfLayerEntryConfig, errorMessage);
      else {
        const { layerPath } = layerConfig;
        this.setLayerStatus('error', layerPath);
        this.layerLoadError.push({
          layer: layerPath,
          consoleMessage: `${errorMessage} for layer ${layerPath} of map ${this.mapId}`,
        });
      }
    });
  }

  /** ***************************************************************************************************************************
   * remove a layer configuration.
   *
   * @param {string} layerPath The layerpath to the node we want to delete.
   */
  removeConfig(layerPath?: string) {
    layerPath = layerPath || this.layerPathAssociatedToTheGeoviewLayer;
    const layerConfigToRemove = this.getLayerConfig(layerPath) as TypeBaseLayerEntryConfig;
    if (layerConfigToRemove.entryType !== 'group') this.unregisterFromLayerSets(layerConfigToRemove);
    delete api.maps[this.mapId].layer.registeredLayers[layerPath];
  }
}
