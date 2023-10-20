/* eslint-disable no-param-reassign */
import BaseLayer from 'ol/layer/Base';
import Collection from 'ol/Collection';
import { Coordinate } from 'ol/coordinate';
import { Pixel } from 'ol/pixel';
import { Extent } from 'ol/extent';
import LayerGroup, { Options as LayerGroupOptions } from 'ol/layer/Group';
import { transformExtent } from 'ol/proj';
import Feature from 'ol/Feature';
import Geometry from 'ol/geom/Geometry';

import cloneDeep from 'lodash/cloneDeep';

import i18n from 'i18next';

import { generateId, getLocalizedValue, getXMLHttpRequest, showError, replaceParams } from '@/core/utils/utilities';
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
} from '../../map/map-schema-types';
import {
  codedValueType,
  GetFeatureInfoPayload,
  payloadIsQueryLayer,
  rangeDomainType,
  TypeArrayOfFeatureInfoEntries,
  TypeFeatureInfoEntry,
  TypeQueryType,
  LayerSetPayload,
  payloadIsRequestLayerInventory,
  GetLegendsPayload,
  payloadIsQueryLegend,
  TypeLocation,
} from '@/api/events/payloads';
import { api } from '@/app';
import { EVENT_NAMES } from '@/api/events/event-types';
import { TypeJsonObject, toJsonObject } from '@/core/types/global-types';
import { Layer } from '../layer';
import { TimeDimension, TypeDateFragments } from '@/core/utils/date-mgt';
import { TypeEventHandlerFunction } from '@/api/events/event';

export type TypeLegend = {
  layerPath: string;
  layerName?: TypeLocalizedString;
  type: TypeGeoviewLayerType;
  styleConfig?: TypeStyleConfig;
  legend: TypeLayerStyles | HTMLCanvasElement | null;
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
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {TypeLegend} verifyIfLegend object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export const isImageStaticLegend = (verifyIfLegend: TypeLegend): verifyIfLegend is TypeImageStaticLegend => {
  return verifyIfLegend?.type === 'imageStatic';
};

export interface TypeImageStaticLegend extends Omit<TypeLegend, 'styleConfig'> {
  legend: HTMLCanvasElement;
}

const validEvents: TypeGeoviewLayerType[] = ['GeoJSON', 'esriDynamic', 'esriFeature', 'ogcFeature', 'ogcWfs', 'GeoPackage'];
/**
 * type guard function that redefines a TypeLegend as a TypeVectorLegend
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {TypeLegend} verifyIfLegend object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export const isVectorLegend = (verifyIfLegend: TypeLegend): verifyIfLegend is TypeVectorLegend => {
  return validEvents.includes(verifyIfLegend?.type);
};

export interface TypeVectorLegend extends TypeLegend {
  legend: TypeLayerStyles;
}

export type TypeStyleRepresentation = {
  /** The defaultCanvas property is used by WMS legends, Simple styles and default styles when defined in unique value and class
   * break styles.
   */
  defaultCanvas?: HTMLCanvasElement | null;
  /** The clusterCanvas property is used when the layer clustering is active (layerConfig.source.cluster.enable = true). */
  clusterCanvas?: HTMLCanvasElement | null;
  /** The arrayOfCanvas property is used by unique value and class break styles. */
  arrayOfCanvas?: (HTMLCanvasElement | null)[];
};
export type TypeLayerStyles = { Point?: TypeStyleRepresentation; LineString?: TypeStyleRepresentation; Polygon?: TypeStyleRepresentation };

/** ******************************************************************************************************************************
 * GeoViewAbstractLayers types
 */

// Constant used to define the default layer names
const DEFAULT_LAYER_NAMES: Record<TypeGeoviewLayerType, string> = {
  esriDynamic: 'Esri Dynamic Layer',
  esriFeature: 'Esri Feature Layer',
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
  /** Flag used to indicate the layer's phase */
  layerPhase = 'newInstance';

  /** The unique identifier of the map on which the GeoView layer will be drawn. */
  mapId: string;

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

  // order to load layers
  layerOrder: string[];

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
   * The vector or raster layer structure to be displayed for this GeoView class. Initial value is null indicating that the layers
   * have not been created.
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
    this.layerOrder = [];
    this.geoviewLayerId = mapLayerConfig.geoviewLayerId || generateId('');
    this.geoviewLayerName.en = mapLayerConfig?.geoviewLayerName?.en ? mapLayerConfig.geoviewLayerName.en : DEFAULT_LAYER_NAMES[type];
    this.geoviewLayerName.fr = mapLayerConfig?.geoviewLayerName?.fr ? mapLayerConfig.geoviewLayerName.fr : DEFAULT_LAYER_NAMES[type];
    if (mapLayerConfig.metadataAccessPath?.en) this.metadataAccessPath.en = mapLayerConfig.metadataAccessPath.en.trim();
    if (mapLayerConfig.metadataAccessPath?.fr) this.metadataAccessPath.fr = mapLayerConfig.metadataAccessPath.fr.trim();
    if (mapLayerConfig.listOfLayerEntryConfig) this.listOfLayerEntryConfig = mapLayerConfig.listOfLayerEntryConfig;
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
   * @param {TypeLayerEntryConfig} layerEntryConfig The layer configuration affected by the change.
   */
  changeLayerPhase(layerPhase: string, layerEntryConfig?: TypeLayerEntryConfig) {
    if (layerEntryConfig) {
      (layerEntryConfig as TypeBaseLayerEntryConfig).layerPhase = layerPhase;
      api.event.emit(LayerSetPayload.createLayerSetChangeLayerPhasePayload(this.mapId, layerEntryConfig, layerPhase));
    } else {
      this.layerPhase = layerPhase;
      this.listOfLayerEntryConfig.forEach((layerConfig) => {
        api.event.emit(LayerSetPayload.createLayerSetChangeLayerPhasePayload(this.mapId, layerConfig, layerPhase));
      });
    }
  }

  /** ***************************************************************************************************************************
   * Change the layer status property and emit an event to update existing layer sets.
   *
   * @param {TypeLayerStatus} layerStatus The value to assign to the layer status property.
   * @param {TypeLayerEntryConfig} layerEntryConfig The layer configuration affected by the change.
   */
  changeLayerStatus(layerStatus: TypeLayerStatus, layerEntryConfig: TypeLayerEntryConfig) {
    (layerEntryConfig as TypeBaseLayerEntryConfig).layerStatus = layerStatus;
    api.event.emit(LayerSetPayload.createLayerSetChangeLayerStatusPayload(this.mapId, layerEntryConfig, layerStatus!));
    if (layerStatus === 'processed') this.changeLayerPhase(layerStatus, layerEntryConfig);
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
    return !listOfLayerEntryConfig.find((layerEntryConfig: TypeLayerEntryConfig) => {
      if (layerEntryIsGroupLayer(layerEntryConfig)) return !this.allLayerEntryConfigProcessed(layerEntryConfig.listOfLayerEntryConfig);
      return !['processed', 'error', 'loaded'].includes((layerEntryConfig as TypeBaseLayerEntryConfig).layerStatus || '');
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
    return !listOfLayerEntryConfig.find((layerEntryConfig: TypeLayerEntryConfig) => {
      if (layerEntryIsGroupLayer(layerEntryConfig)) return !this.allLayerEntryConfigAreInError(layerEntryConfig.listOfLayerEntryConfig);
      return (layerEntryConfig as TypeBaseLayerEntryConfig).layerStatus !== 'error';
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
    return listOfLayerEntryConfig.reduce((counter: number, layerEntryConfig: TypeLayerEntryConfig) => {
      if (layerEntryIsGroupLayer(layerEntryConfig)) return counter + this.countErrorStatus(layerEntryConfig.listOfLayerEntryConfig);
      if ((layerEntryConfig as TypeBaseLayerEntryConfig).layerStatus === 'error') return counter + 1;
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
    listOfLayerEntryConfig.forEach((layerEntryConfig: TypeLayerEntryConfig, i) => {
      if (layer.isRegistered(layerEntryConfig)) {
        this.layerLoadError.push({
          layer: Layer.getLayerPath(layerEntryConfig),
          consoleMessage: `Duplicate layerPath (mapId:  ${this.mapId}, layerPath: ${Layer.getLayerPath(layerEntryConfig)})`,
        });
        // Duplicat layer can't be kept because it has the same layer path than the first encontered layer.
        delete listOfLayerEntryConfig[i];
      } else layer.registerLayerConfig(layerEntryConfig);
      if (layerEntryIsGroupLayer(layerEntryConfig)) this.initRegisteredLayers(layerEntryConfig.listOfLayerEntryConfig);
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
      listOfLayerEntryConfig.forEach((layerEntryConfig) => {
        if (layerEntryIsGroupLayer(layerEntryConfig)) this.registerAllLayersToLayerSets(layerEntryConfig.listOfLayerEntryConfig!);
        else {
          this.registerToLayerSets(layerEntryConfig as TypeBaseLayerEntryConfig);
          this.changeLayerPhase('newInstance', layerEntryConfig);
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
  createGeoViewLayers(): Promise<void> {
    const promisedExecution = new Promise<void>((resolve) => {
      this.changeLayerPhase('createGeoViewLayers');
      if (this.olLayers === null) {
        this.getAdditionalServiceDefinition()
          .then(() => {
            this.processListOfLayerEntryConfig(this.listOfLayerEntryConfig).then((layersCreated) => {
              this.olLayers = layersCreated;
              resolve();
            });
          })
          .catch((reason) => {
            // eslint-disable-next-line no-console
            console.log(reason);
            resolve();
          });
      } else {
        const trans = i18n.getFixedT(api.maps[this.mapId].displayLanguage);
        const message = replaceParams([this.mapId], trans('validation.layer.createtwice'));
        showError(this.mapId, message);

        // eslint-disable-next-line no-console
        console.log(`Can not execute twice the createGeoViewLayers method for the map ${this.mapId}`);
        resolve();
      }
    });
    return promisedExecution;
  }

  /** ***************************************************************************************************************************
   * This method reads from the metadataAccessPath additional information to complete the GeoView layer configuration.
   * If the GeoView layer does not have a service definition, this method does nothing.
   */
  protected getAdditionalServiceDefinition(): Promise<void> {
    this.changeLayerPhase('getAdditionalServiceDefinition');
    const promisedExecution = new Promise<void>((resolve) => {
      this.getServiceMetadata().then(() => {
        if (this.listOfLayerEntryConfig.length) {
          // Recursively process the configuration tree of layer entries by removing layers in error and processing valid layers.
          this.validateListOfLayerEntryConfig(this.listOfLayerEntryConfig);
          this.processListOfLayerEntryMetadata(this.listOfLayerEntryConfig).then(() => resolve());
        } else resolve(); // no layer entry.
      });
    });
    return promisedExecution;
  }

  /** ***************************************************************************************************************************
   * This method reads the service metadata from the metadataAccessPath.
   *
   * @returns {Promise<void>} A promise that the execution is completed.
   */
  protected getServiceMetadata(): Promise<void> {
    this.changeLayerPhase('getServiceMetadata');
    const promisedExecution = new Promise<void>((resolve) => {
      const metadataUrl = getLocalizedValue(this.metadataAccessPath, this.mapId);
      if (metadataUrl) {
        getXMLHttpRequest(`${metadataUrl}?f=json`)
          .then((metadataString) => {
            if (metadataString === '{}') {
              api.geoUtilities.setAllLayerStatusToError(this, this.listOfLayerEntryConfig, 'Unable to read metadata');
            } else {
              this.metadata = toJsonObject(JSON.parse(metadataString));
              const { copyrightText } = this.metadata;
              if (copyrightText) this.attributions.push(copyrightText as string);
              resolve();
            }
          })
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          .catch((reason) => {
            api.geoUtilities.setAllLayerStatusToError(this, this.listOfLayerEntryConfig, 'Unable to read metadata');
          });
      } else resolve();
    });
    return promisedExecution;
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
  protected processListOfLayerEntryMetadata(
    listOfLayerEntryConfig: TypeListOfLayerEntryConfig = this.listOfLayerEntryConfig
  ): Promise<void> {
    this.changeLayerPhase('processListOfLayerEntryMetadata');
    const promisedListOfLayerEntryProcessed = new Promise<void>((resolve) => {
      const promisedAllLayerDone: Promise<void>[] = [];
      listOfLayerEntryConfig.forEach((layerEntryConfig: TypeLayerEntryConfig) => {
        if (layerEntryIsGroupLayer(layerEntryConfig))
          if (layerEntryConfig.isMetadataLayerGroup) promisedAllLayerDone.push(this.processMetadataGroupLayer(layerEntryConfig));
          else promisedAllLayerDone.push(this.processListOfLayerEntryMetadata(layerEntryConfig.listOfLayerEntryConfig));
        else promisedAllLayerDone.push(this.processLayerMetadata(layerEntryConfig));
      });
      Promise.all(promisedAllLayerDone).then(() => resolve());
    });
    return promisedListOfLayerEntryProcessed;
  }

  /** ***************************************************************************************************************************
   * This method is used to process metadata group layer entries. These layers behave as a GeoView group layer and also as a data
   * layer (i.e. they have extent, visibility and query flag definition). Metadata group layers can be identified by
   * the presence of an isMetadataLayerGroup attribute set to true.
   *
   * @param {TypeLayerGroupEntryConfig} layerEntryConfig The layer entry configuration to process.
   *
   * @returns {Promise<void>} A promise that the vector layer configuration has its metadata and group layers processed.
   */
  private processMetadataGroupLayer(layerEntryConfig: TypeLayerGroupEntryConfig): Promise<void> {
    const promisedListOfLayerEntryProcessed = new Promise<void>((resolve) => {
      this.processLayerMetadata(layerEntryConfig).then(() => {
        this.processListOfLayerEntryMetadata(layerEntryConfig.listOfLayerEntryConfig!).then(() => resolve());
      });
    });
    return promisedListOfLayerEntryProcessed;
  }

  /** ***************************************************************************************************************************
   * This method is used to process the layer's metadata. It will fill the empty outfields and aliasFields properties of the
   * layer's configuration when applicable.
   *
   * @param {TypeLayerEntryConfig} layerEntryConfig The layer entry configuration to process.
   *
   * @returns {Promise<void>} A promise that the vector layer configuration has its metadata processed.
   */
  protected processLayerMetadata(layerEntryConfig: TypeLayerEntryConfig): Promise<void> {
    const promiseOfExecution = new Promise<void>((resolve) => {
      if (!layerEntryConfig.source) layerEntryConfig.source = {};
      if (!layerEntryConfig.source.featureInfo) layerEntryConfig.source.featureInfo = { queryable: true };
      resolve();
    });
    return promiseOfExecution;
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
  protected processListOfLayerEntryConfig(
    listOfLayerEntryConfig: TypeListOfLayerEntryConfig,
    layerGroup?: LayerGroup
  ): Promise<BaseLayer | null> {
    this.changeLayerPhase('processListOfLayerEntryConfig');
    const promisedListOfLayerEntryProcessed = new Promise<BaseLayer | null>((resolve) => {
      if (listOfLayerEntryConfig.length === 1) {
        if (layerEntryIsGroupLayer(listOfLayerEntryConfig[0])) {
          const newLayerGroup = this.createLayerGroup(listOfLayerEntryConfig[0]);
          this.processListOfLayerEntryConfig(listOfLayerEntryConfig[0].listOfLayerEntryConfig!, newLayerGroup).then((groupReturned) => {
            if (groupReturned) {
              if (layerGroup) layerGroup.getLayers().push(groupReturned);
              resolve(groupReturned);
            } else {
              this.layerLoadError.push({
                layer: Layer.getLayerPath(listOfLayerEntryConfig[0]),
                consoleMessage: `Unable to create group layer ${Layer.getLayerPath(listOfLayerEntryConfig[0])} on map ${this.mapId}`,
              });
              resolve(null);
            }
          });
        } else if ((listOfLayerEntryConfig[0] as TypeBaseLayerEntryConfig).layerStatus === 'error') resolve(null);
        else {
          if (
            listOfLayerEntryConfig[0].entryType === 'vector' &&
            (listOfLayerEntryConfig[0].source as TypeBaseSourceVectorInitialConfig)?.cluster?.enable
          ) {
            const unclusteredLayerConfig = cloneDeep(listOfLayerEntryConfig[0]) as TypeVectorLayerEntryConfig;
            unclusteredLayerConfig.layerId = `${listOfLayerEntryConfig[0].layerId}-unclustered`;
            unclusteredLayerConfig.source!.cluster!.enable = false;
            this.processOneLayerEntry(unclusteredLayerConfig as TypeBaseLayerEntryConfig).then((baseLayer) => {
              if (baseLayer) {
                baseLayer.setVisible(false);
                api.maps[this.mapId].layer.registerLayerConfig(unclusteredLayerConfig);
                this.registerToLayerSets(unclusteredLayerConfig as TypeBaseLayerEntryConfig);
                if (!layerGroup) layerGroup = this.createLayerGroup(unclusteredLayerConfig.parentLayerConfig as TypeLayerEntryConfig);
                layerGroup.getLayers().push(baseLayer);
              }
            });
            (listOfLayerEntryConfig[0].source as TypeBaseSourceVectorInitialConfig)!.cluster!.settings =
              unclusteredLayerConfig.source!.cluster!.settings;
          }
          this.processOneLayerEntry(listOfLayerEntryConfig[0] as TypeBaseLayerEntryConfig).then((baseLayer) => {
            if (baseLayer) {
              baseLayer.setVisible(listOfLayerEntryConfig[0].initialSettings?.visible !== 'no');
              this.registerToLayerSets(listOfLayerEntryConfig[0] as TypeBaseLayerEntryConfig);
              if (layerGroup) layerGroup.getLayers().push(baseLayer);
              this.changeLayerStatus('processed', listOfLayerEntryConfig[0]);
              resolve(layerGroup || baseLayer);
            } else {
              this.layerLoadError.push({
                layer: Layer.getLayerPath(listOfLayerEntryConfig[0]),
                consoleMessage: `Unable to create layer ${Layer.getLayerPath(listOfLayerEntryConfig[0])} on map ${this.mapId}`,
              });
              this.changeLayerStatus('error', listOfLayerEntryConfig[0]);
              resolve(null);
            }
          });
        }
      } else {
        if (!layerGroup && listOfLayerEntryConfig.length > 0) {
          // All children of this level in the tree have the same parent, so we use the first element of the array to retrieve the parent node.
          layerGroup = this.createLayerGroup(listOfLayerEntryConfig[0].parentLayerConfig as TypeLayerEntryConfig);
        }
        const promiseOfLayerCreated: Promise<BaseLayer | LayerGroup | null>[] = [];
        listOfLayerEntryConfig.forEach((layerEntryConfig, i) => {
          if (layerEntryIsGroupLayer(layerEntryConfig)) {
            const newLayerGroup = this.createLayerGroup(listOfLayerEntryConfig[i]);
            promiseOfLayerCreated.push(this.processListOfLayerEntryConfig(layerEntryConfig.listOfLayerEntryConfig!, newLayerGroup));
          } else if ((listOfLayerEntryConfig[i] as TypeBaseLayerEntryConfig).layerStatus === 'error')
            promiseOfLayerCreated.push(Promise.resolve(null));
          else {
            if (
              layerEntryConfig.entryType === 'vector' &&
              (layerEntryConfig.source as TypeBaseSourceVectorInitialConfig)?.cluster?.enable
            ) {
              const unclusteredLayerConfig = cloneDeep(layerEntryConfig) as TypeVectorLayerEntryConfig;
              unclusteredLayerConfig.layerId = `${layerEntryConfig.layerId}-unclustered`;
              unclusteredLayerConfig.source!.cluster!.enable = false;
              api.maps[this.mapId].layer.registerLayerConfig(unclusteredLayerConfig);
              promiseOfLayerCreated.push(this.processOneLayerEntry(unclusteredLayerConfig as TypeBaseLayerEntryConfig));
              (layerEntryConfig.source as TypeBaseSourceVectorInitialConfig)!.cluster!.settings =
                unclusteredLayerConfig.source!.cluster!.settings;
            }
            promiseOfLayerCreated.push(this.processOneLayerEntry(layerEntryConfig as TypeBaseLayerEntryConfig));
          }
        });
        Promise.all(promiseOfLayerCreated)
          .then((listOfLayerCreated) => {
            listOfLayerCreated.forEach((baseLayer, i) => {
              if (baseLayer) {
                const layerEntryConfig = baseLayer?.get('layerEntryConfig') as TypeBaseLayerEntryConfig;
                if (layerEntryConfig) {
                  if (layerEntryConfig.layerId.endsWith('-unclustered')) {
                    this.registerToLayerSets(layerEntryConfig);
                    baseLayer.setVisible(false);
                  } else
                    baseLayer.setVisible(
                      layerEntryConfig.initialSettings?.visible === 'yes' ||
                        layerEntryConfig.initialSettings?.visible === 'always' ||
                        layerEntryConfig.initialSettings?.visible === undefined
                    );

                  if (!layerEntryIsGroupLayer(listOfLayerEntryConfig[i])) {
                    this.registerToLayerSets(baseLayer.get('layerEntryConfig') as TypeBaseLayerEntryConfig);
                    this.changeLayerStatus('processed', listOfLayerEntryConfig[i]);
                  }
                  layerGroup!.getLayers().push(baseLayer);
                }
              } else {
                this.layerLoadError.push({
                  layer: Layer.getLayerPath(listOfLayerEntryConfig[i]),
                  consoleMessage: `Unable to create ${
                    layerEntryIsGroupLayer(listOfLayerEntryConfig[i]) ? 'group' : ''
                  } layer ${Layer.getLayerPath(listOfLayerEntryConfig[i])} on map ${this.mapId}`,
                });
                this.changeLayerStatus('error', listOfLayerEntryConfig[i]);
              }
            });
            resolve(layerGroup!);
          })
          .catch((reason) => {
            // eslint-disable-next-line no-console
            console.log(reason);
            resolve(null);
          });
      }
    });
    return promisedListOfLayerEntryProcessed;
  }

  /** ***************************************************************************************************************************
   * This method creates a GeoView layer using the definition provided in the layerEntryConfig parameter.
   *
   * @param {TypeLayerEntryConfig} layerEntryConfig Information needed to create the GeoView layer.
   *
   * @returns {Promise<BaseLayer | null>} The GeoView layer that has been created.
   */
  protected abstract processOneLayerEntry(layerEntryConfig: TypeBaseLayerEntryConfig): Promise<BaseLayer | null>;

  /** ***************************************************************************************************************************
   * Return feature information for the layer specified.
   *
   * @param {TypeQueryType} queryType  The type of query to perform.
   * @param {string | TypeLayerEntryConfig | null} layerPathOrConfig Optional layer path or configuration.
   * @param {TypeLocation} location An optionsl pixel, coordinate or polygon that will be used by the query.
   *
   * @returns {Promise<TypeFeatureInfoResult>} The feature info table.
   */
  getFeatureInfo(
    queryType: TypeQueryType,
    layerPathOrConfig: string | TypeLayerEntryConfig,
    location: TypeLocation = null
  ): Promise<TypeArrayOfFeatureInfoEntries> {
    const queryResult = new Promise<TypeArrayOfFeatureInfoEntries>((resolve) => {
      const layerConfig = (
        typeof layerPathOrConfig === 'string' ? this.getLayerConfig(layerPathOrConfig) : layerPathOrConfig
      ) as TypeLayerEntryConfig | null;
      if (!layerConfig || !layerConfig.source?.featureInfo?.queryable) resolve([]);

      switch (queryType) {
        case 'all':
          this.getAllFeatureInfo(layerConfig!).then((featureInfoResult) => resolve(featureInfoResult));
          break;
        case 'at_pixel':
          this.getFeatureInfoAtPixel(location as Pixel, layerConfig!).then((featureInfoResult) => resolve(featureInfoResult));
          break;
        case 'at_coordinate':
          this.getFeatureInfoAtCoordinate(location as Coordinate, layerConfig!).then((featureInfoResult) => resolve(featureInfoResult));
          break;
        case 'at_long_lat':
          this.getFeatureInfoAtLongLat(location as Coordinate, layerConfig!).then((featureInfoResult) => resolve(featureInfoResult));
          break;
        case 'using_a_bounding_box':
          this.getFeatureInfoUsingBBox(location as Coordinate[], layerConfig!).then((featureInfoResult) => resolve(featureInfoResult));
          break;
        case 'using_a_polygon':
          this.getFeatureInfoUsingPolygon(location as Coordinate[], layerConfig!).then((featureInfoResult) => resolve(featureInfoResult));
          break;
        default:
          // eslint-disable-next-line no-console
          console.log(`Queries using ${queryType} are invalid.`);
          resolve([]);
      }
    });
    return queryResult;
  }

  /** ***************************************************************************************************************************
   * Return feature information for all the features on a layer. Returns an empty array [] when the layer is
   * not queryable.
   *
   * @param {TypeLayerEntryConfig} layerConfig The layer configuration.
   *
   * @returns {Promise<TypeArrayOfFeatureInfoEntries>} The feature info table.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected getAllFeatureInfo(layerConfig: TypeLayerEntryConfig): Promise<TypeArrayOfFeatureInfoEntries> {
    const promisedQueryResult = new Promise<TypeArrayOfFeatureInfoEntries>((resolve) => {
      resolve([]);
    });
    return promisedQueryResult;
  }

  /** ***************************************************************************************************************************
   * Return feature information for all the features around the provided Pixel. Returns an empty array [] when the layer is
   * not queryable.
   *
   * @param {Coordinate} location The pixel coordinate that will be used by the query.
   * @param {TypeLayerEntryConfig} layerConfig The layer configuration.
   *
   * @returns {Promise<TypeArrayOfFeatureInfoEntries>} The feature info table.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected getFeatureInfoAtPixel(location: Pixel, layerConfig: TypeLayerEntryConfig): Promise<TypeArrayOfFeatureInfoEntries> {
    const promisedQueryResult = new Promise<TypeArrayOfFeatureInfoEntries>((resolve) => {
      resolve([]);
    });
    return promisedQueryResult;
  }

  /** ***************************************************************************************************************************
   * Return feature information for all the features around the provided coordinate. Returns an empty array [] when the layer is
   * not queryable.
   *
   * @param {Coordinate} location The coordinate that will be used by the query.
   * @param {TypeLayerEntryConfig} layerConfig The layer configuration.
   *
   * @returns {Promise<TypeArrayOfFeatureInfoEntries>} The feature info table.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected getFeatureInfoAtCoordinate(location: Coordinate, layerConfig: TypeLayerEntryConfig): Promise<TypeArrayOfFeatureInfoEntries> {
    const promisedQueryResult = new Promise<TypeArrayOfFeatureInfoEntries>((resolve) => {
      resolve([]);
    });
    return promisedQueryResult;
  }

  /** ***************************************************************************************************************************
   * Return feature information for all the features around the provided longitude latitude. Returns an empty array [] when the
   * layer is not queryable.
   *
   * @param {Coordinate} location The coordinate that will be used by the query.
   * @param {TypeLayerEntryConfig} layerConfig The layer configuration.
   *
   * @returns {Promise<TypeArrayOfFeatureInfoEntries>} The feature info table.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected getFeatureInfoAtLongLat(location: Coordinate, layerConfig: TypeLayerEntryConfig): Promise<TypeArrayOfFeatureInfoEntries> {
    const promisedQueryResult = new Promise<TypeArrayOfFeatureInfoEntries>((resolve) => {
      resolve([]);
    });
    return promisedQueryResult;
  }

  /** ***************************************************************************************************************************
   * Return feature information for all the features in the provided bounding box. Returns an empty array [] when the layer is
   * not queryable.
   *
   * @param {Coordinate} location The coordinate that will be used by the query.
   * @param {TypeLayerEntryConfig} layerConfig The layer configuration.
   *
   * @returns {Promise<TypeArrayOfFeatureInfoEntries>} The feature info table.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected getFeatureInfoUsingBBox(location: Coordinate[], layerConfig: TypeLayerEntryConfig): Promise<TypeArrayOfFeatureInfoEntries> {
    const promisedQueryResult = new Promise<TypeArrayOfFeatureInfoEntries>((resolve) => {
      resolve([]);
    });
    return promisedQueryResult;
  }

  /** ***************************************************************************************************************************
   * Return feature information for all the features in the provided polygon. Returns an empty array [] when the layer is
   * not queryable.
   *
   * @param {Coordinate} location The coordinate that will be used by the query.
   * @param {TypeLayerEntryConfig} layerConfig The layer configuration.
   *
   * @returns {Promise<TypeArrayOfFeatureInfoEntries>} The feature info table.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected getFeatureInfoUsingPolygon(location: Coordinate[], layerConfig: TypeLayerEntryConfig): Promise<TypeArrayOfFeatureInfoEntries> {
    const promisedQueryResult = new Promise<TypeArrayOfFeatureInfoEntries>((resolve) => {
      resolve([]);
    });
    return promisedQueryResult;
  }

  /** ***************************************************************************************************************************
   * This method register the layer entry to layer sets. Nothing is done if the registration is already done.
   *
   * @param {TypeBaseLayerEntryConfig} layerEntryConfig The layer entry to register.
   */
  protected registerToLayerSets(layerEntryConfig: TypeBaseLayerEntryConfig) {
    const layerPath = Layer.getLayerPath(layerEntryConfig);
    if (!this.registerToLayerSetListenerFunctions[layerPath]) this.registerToLayerSetListenerFunctions[layerPath] = {};

    if (!this.registerToLayerSetListenerFunctions[layerPath].requestLayerInventory) {
      // Listen to events that request a layer inventory and emit a register payload event.
      // This will register all existing layers to a newly created layer set.
      this.registerToLayerSetListenerFunctions[layerPath].requestLayerInventory = (payload) => {
        if (payloadIsRequestLayerInventory(payload)) {
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
      if ('featureInfo' in layerEntryConfig.source! && layerEntryConfig.source.featureInfo?.queryable) {
        // Listen to events that request to query a layer and return the resultset to the requester.
        this.registerToLayerSetListenerFunctions[layerPath].queryLayer = (payload) => {
          if (payloadIsQueryLayer(payload)) {
            const { queryType, location, isHover } = payload;
            this.getFeatureInfo(queryType, layerPath, location).then((queryResult) => {
              api.event.emit(GetFeatureInfoPayload.createQueryResultPayload(this.mapId, layerPath, queryType, queryResult, isHover));
            });
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
   * @param {TypeBaseLayerEntryConfig} layerEntryConfig The layer entry to register.
   */
  unregisterFromLayerSets(layerEntryConfig: TypeBaseLayerEntryConfig) {
    const layerPath = Layer.getLayerPath(layerEntryConfig);
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
   * @param {TypeLayerEntryConfig | TypeGeoviewLayerConfig} layerEntryConfig The layer configuration.
   * @returns {LayerGroup} A new layer group.
   */
  createLayerGroup(layerEntryConfig: TypeLayerEntryConfig | TypeGeoviewLayerConfig): LayerGroup {
    const layerGroupOptions: LayerGroupOptions = {
      layers: new Collection(),
      properties: { layerEntryConfig },
    };
    if (layerEntryConfig.initialSettings?.extent !== undefined) layerGroupOptions.extent = layerEntryConfig.initialSettings?.extent;
    if (layerEntryConfig.initialSettings?.maxZoom !== undefined) layerGroupOptions.maxZoom = layerEntryConfig.initialSettings?.maxZoom;
    if (layerEntryConfig.initialSettings?.minZoom !== undefined) layerGroupOptions.minZoom = layerEntryConfig.initialSettings?.minZoom;
    if (layerEntryConfig.initialSettings?.opacity !== undefined) layerGroupOptions.opacity = layerEntryConfig.initialSettings?.opacity;
    if (layerEntryConfig.initialSettings?.visible !== undefined)
      layerGroupOptions.visible =
        layerEntryConfig.initialSettings?.visible === 'yes' || layerEntryConfig.initialSettings?.visible === 'always';
    layerEntryConfig.olLayer = new LayerGroup(layerGroupOptions);
    return layerEntryConfig.olLayer as LayerGroup;
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

  /** ***************************************************************************************************************************
   * Returns the layer bounds or undefined if not defined in the layer configuration or the metadata. If projectionCode is
   * defined, returns the bounds in the specified projection otherwise use the map projection. The bounds are different from the
   * extent. They are mainly used for display purposes to show the bounding box in which the data resides and to zoom in on the
   * entire layer data. It is not used by openlayer to limit the display of data on the map.
   *
   * @param {string | TypeLayerEntryConfig | TypeListOfLayerEntryConfig} layerPathOrConfig Layer path or configuration.
   * @param {string | number | undefined} projectionCode Optional projection code to use for the returned bounds.
   *
   * @returns {Extent} The layer bounding box.
   */
  getMetadataBounds(
    layerPathOrConfig: string | TypeLayerEntryConfig | TypeListOfLayerEntryConfig,
    projectionCode: string | number | undefined = undefined
  ): Extent | undefined {
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
    const layerConfig = typeof layerPathOrConfig === 'string' ? this.getLayerConfig(layerPathOrConfig) : layerPathOrConfig;
    if (layerConfig) {
      if (Array.isArray(layerConfig)) processGroupLayerBounds(layerConfig);
      else processGroupLayerBounds([layerConfig]);
      if (projectionCode && bounds) return transformExtent(bounds, `EPSG:4326`, `EPSG:${projectionCode}`);
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected getFieldType(fieldName: string, layerConfig: TypeLayerEntryConfig): 'string' | 'date' | 'number' {
    return 'string';
  }

  /** ***************************************************************************************************************************
   * Return the extent of the layer or undefined if it will be visible regardless of extent. The layer extent is an array of
   * numbers representing an extent: [minx, miny, maxx, maxy]. This routine return undefined when the layer path can't be found.
   * The extent is used to clip the data displayed on the map.
   *
   * @param {string | TypeLayerEntryConfig} layerPathOrConfig Layer path or configuration.
   *
   * @returns {Extent} The layer extent.
   */
  getExtent(layerPathOrConfig: string | TypeLayerEntryConfig): Extent | undefined {
    const olLayer = typeof layerPathOrConfig === 'string' ? this.getLayerConfig(layerPathOrConfig)?.olLayer : layerPathOrConfig?.olLayer;
    return olLayer ? olLayer.getExtent() : undefined;
  }

  /** ***************************************************************************************************************************
   * set the extent of the layer. Use undefined if it will be visible regardless of extent. The layer extent is an array of
   * numbers representing an extent: [minx, miny, maxx, maxy]. This routine does nothing when the layerPath specified is not
   * found.
   *
   * @param {Extent} layerExtent The extent to assign to the layer.
   * @param {string | TypeLayerEntryConfig} layerPathOrConfig Layer path or configuration.
   */
  setExtent(layerExtent: Extent, layerPathOrConfig: string | TypeLayerEntryConfig) {
    const olLayer = typeof layerPathOrConfig === 'string' ? this.getLayerConfig(layerPathOrConfig)?.olLayer : layerPathOrConfig?.olLayer;
    if (olLayer) olLayer.setExtent(layerExtent);
  }

  /** ***************************************************************************************************************************
   * Return the opacity of the layer (between 0 and 1). This routine return undefined when the layerPath specified is not found.
   *
   * @param {string | TypeLayerEntryConfig} layerPathOrConfig Layer path or configuration.
   *
   * @returns {number} The opacity of the layer.
   */
  getOpacity(layerPathOrConfig: string | TypeLayerEntryConfig): number | undefined {
    const olLayer = typeof layerPathOrConfig === 'string' ? this.getLayerConfig(layerPathOrConfig)?.olLayer : layerPathOrConfig?.olLayer;
    return olLayer ? olLayer.getOpacity() : undefined;
  }

  /** ***************************************************************************************************************************
   * Set the opacity of the layer (between 0 and 1). This routine does nothing when the layerPath specified is not found.
   *
   * @param {number} layerOpacity The opacity of the layer.
   * @param {string | TypeLayerEntryConfig} layerPathOrConfig Layer path or configuration.
   *
   */
  setOpacity(layerOpacity: number, layerPathOrConfig: string | TypeLayerEntryConfig) {
    const olLayer = typeof layerPathOrConfig === 'string' ? this.getLayerConfig(layerPathOrConfig)?.olLayer : layerPathOrConfig?.olLayer;
    if (olLayer) olLayer.setOpacity(layerOpacity);
  }

  /** ***************************************************************************************************************************
   * Return the visibility of the layer (true or false). This routine return undefined when the layerPath specified is not found.
   *
   * @param {string | TypeLayerEntryConfig} layerPathOrConfig Layer path or configuration.
   *
   * @returns {boolean} The visibility of the layer.
   */
  getVisible(layerPathOrConfig: string | TypeLayerEntryConfig): boolean | undefined {
    const olLayer = typeof layerPathOrConfig === 'string' ? this.getLayerConfig(layerPathOrConfig)?.olLayer : layerPathOrConfig?.olLayer;
    return olLayer ? olLayer.getVisible() : undefined;
  }

  /** ***************************************************************************************************************************
   * Set the visibility of the layer (true or false). This routine does nothing when the layerPath specified is not found.
   *
   * @param {boolean} layerVisibility The visibility of the layer.
   * @param {string | TypeLayerEntryConfig} layerPathOrConfig Layer path or configuration.
   */
  setVisible(layerVisibility: boolean, layerPathOrConfig: string | TypeLayerEntryConfig) {
    const olLayer = typeof layerPathOrConfig === 'string' ? this.getLayerConfig(layerPathOrConfig)?.olLayer : layerPathOrConfig?.olLayer;
    if (olLayer) {
      olLayer.setVisible(layerVisibility);
      olLayer.changed();
    }
  }

  /** ***************************************************************************************************************************
   * Return the min zoom of the layer. This routine return undefined when the layerPath specified is not found.
   *
   * @param {string | TypeLayerEntryConfig} layerPathOrConfig Layer path or configuration.
   *
   * @returns {boolean} The visibility of the layer.
   */
  getMinZoom(layerPathOrConfig: string | TypeLayerEntryConfig): number | undefined {
    const olLayer = typeof layerPathOrConfig === 'string' ? this.getLayerConfig(layerPathOrConfig)?.olLayer : layerPathOrConfig?.olLayer;
    return olLayer ? olLayer.getMinZoom() : undefined;
  }

  /** ***************************************************************************************************************************
   * Set the min zoom of the layer. This routine does nothing when the layerPath specified is not found.
   *
   * @param {boolean} layerVisibility The visibility of the layer.
   * @param {string | TypeLayerEntryConfig} layerPathOrConfig Layer path or configuration.
   */
  setMinZoom(minZoom: number, layerPathOrConfig: string | TypeLayerEntryConfig) {
    const olLayer = typeof layerPathOrConfig === 'string' ? this.getLayerConfig(layerPathOrConfig)?.olLayer : layerPathOrConfig?.olLayer;
    if (olLayer) olLayer.setMinZoom(minZoom);
  }

  /** ***************************************************************************************************************************
   * Return the max zoom of the layer. This routine return undefined when the layerPath specified is not found.
   *
   * @param {string | TypeLayerEntryConfig} layerPathOrConfig Layer path or configuration.
   *
   * @returns {boolean} The visibility of the layer.
   */
  getMaxZoom(layerPathOrConfig: string | TypeLayerEntryConfig): number | undefined {
    const olLayer = typeof layerPathOrConfig === 'string' ? this.getLayerConfig(layerPathOrConfig)?.olLayer : layerPathOrConfig?.olLayer;
    return olLayer ? olLayer.getMaxZoom() : undefined;
  }

  /** ***************************************************************************************************************************
   * Set the max zoom of the layer. This routine does nothing when the layerPath specified is not found.
   *
   * @param {boolean} layerVisibility The visibility of the layer.
   * @param {string | TypeLayerEntryConfig} layerPathOrConfig Layer path or configuration.
   */
  setMaxZoom(maxZoom: number, layerPathOrConfig: string | TypeLayerEntryConfig) {
    const olLayer = typeof layerPathOrConfig === 'string' ? this.getLayerConfig(layerPathOrConfig)?.olLayer : layerPathOrConfig?.olLayer;
    if (olLayer) olLayer.setMaxZoom(maxZoom);
  }

  /** ***************************************************************************************************************************
   * Return the legend of the layer. This routine returns null when the layerPath specified is not found. If the style property
   * of the layerConfig object is undefined, the legend property of the object returned will be null.
   *
   * @param {string | TypeLayerEntryConfig} layerPathOrConfig Layer path or configuration.
   *
   * @returns {Promise<TypeLegend | null>} The legend of the layer.
   */
  getLegend(layerPathOrConfig: string | TypeLayerEntryConfig): Promise<TypeLegend | null> {
    const promisedLegend = new Promise<TypeLegend | null>((resolve) => {
      const layerConfig = (
        typeof layerPathOrConfig === 'string' ? this.getLayerConfig(layerPathOrConfig) : layerPathOrConfig
      ) as TypeBaseLayerEntryConfig & {
        style: TypeStyleConfig;
      };

      if (!layerConfig) resolve(null);
      else if (!layerConfig.style)
        resolve({
          type: this.type,
          layerPath: Layer.getLayerPath(layerConfig),
          layerName: layerConfig.layerName!,
          styleConfig: layerConfig.style,
          legend: null,
        } as TypeLegend);
      else {
        const { geoviewRenderer } = api.maps[this.mapId];
        geoviewRenderer.getLegendStyles(layerConfig).then((legendStyle) => {
          const legend: TypeLegend = {
            type: this.type,
            layerPath: Layer.getLayerPath(layerConfig),
            layerName: layerConfig.layerName!,
            styleConfig: layerConfig?.style,
            legend: legendStyle,
          };
          resolve(legend);
        });
      }
    });
    return promisedLegend;
  }

  /** ***************************************************************************************************************************
   * Get and format the value of the field with the name passed in parameter. Vector GeoView layers convert dates to milliseconds
   * since the base date. Vector feature dates must be in ISO format.
   *
   * @param {Feature<Geometry>} features The features that hold the field values.
   * @param {string} fieldName The field name.
   * @param {'number' | 'string' | 'date'} fieldType The field type.
   *
   * @returns {string | number | Date} The formatted value of the field.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected getFieldValue(feature: Feature<Geometry>, fieldName: string, fieldType: 'number' | 'string' | 'date'): string | number | Date {
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
   * @param {Feature<Geometry>[]} features The array of features to convert.
   * @param {TypeImageLayerEntryConfig | TypeVectorLayerEntryConfig} layerEntryConfig The layer configuration.
   *
   * @returns {TypeArrayOfFeatureInfoEntries} The Array of feature information.
   */
  protected formatFeatureInfoResult(
    features: Feature<Geometry>[],
    layerEntryConfig: TypeOgcWmsLayerEntryConfig | TypeEsriDynamicLayerEntryConfig | TypeVectorLayerEntryConfig
  ): Promise<TypeArrayOfFeatureInfoEntries> {
    const promisedArrayOfFeatureInfo = new Promise<TypeArrayOfFeatureInfoEntries>((resolve) => {
      if (!features.length) resolve([]);
      else {
        const featureInfo = layerEntryConfig?.source?.featureInfo;
        const fieldTypes = featureInfo?.fieldTypes?.split(',') as ('string' | 'number' | 'date')[];
        const outfields = getLocalizedValue(featureInfo?.outfields, this.mapId)?.split(',');
        const aliasFields = getLocalizedValue(featureInfo?.aliasFields, this.mapId)?.split(',');
        const queryResult: TypeArrayOfFeatureInfoEntries = [];
        let featureKeyCounter = 0;
        let fieldKeyCounter = 0;
        const promisedAllCanvasFound: Promise<{ feature: Feature<Geometry>; canvas: HTMLCanvasElement | undefined }>[] = [];
        features.forEach((featureNeedingItsCanvas) => {
          promisedAllCanvasFound.push(
            new Promise<{ feature: Feature<Geometry>; canvas: HTMLCanvasElement | undefined }>((resolveCanvas) => {
              api.maps[this.mapId].geoviewRenderer
                .getFeatureCanvas(featureNeedingItsCanvas, layerEntryConfig as TypeVectorLayerEntryConfig)
                .then((canvas) => {
                  resolveCanvas({ feature: featureNeedingItsCanvas, canvas });
                });
            })
          );
        });
        Promise.all(promisedAllCanvasFound).then((arrayOfFeatureInfo) => {
          arrayOfFeatureInfo.forEach(({ canvas, feature }) => {
            if (canvas) {
              const extent =
                layerEntryIsVector(layerEntryConfig) && layerEntryConfig.source?.cluster?.enable
                  ? (feature.get('features') as Array<Feature<Geometry>>).reduce((resultingExtent, featureToProcess) => {
                      const newExtent = featureToProcess.getGeometry()!.getExtent();
                      return [
                        Math.min(resultingExtent[0], newExtent[0]),
                        Math.min(resultingExtent[1], newExtent[1]),
                        Math.max(resultingExtent[2], newExtent[2]),
                        Math.max(resultingExtent[3], newExtent[3]),
                      ];
                    }, feature.getGeometry()!.getExtent())
                  : feature.getGeometry()!.getExtent();

              const featureInfoEntry: TypeFeatureInfoEntry = {
                // feature key for building the data-grid
                featureKey: featureKeyCounter++,
                geoviewLayerType: this.type,
                extent,
                geometry: feature,
                featureIcon: canvas,
                fieldInfo: {},
                nameField: getLocalizedValue(layerEntryConfig?.source?.featureInfo?.nameField, this.mapId) || null,
              };

              const featureFields = feature.getKeys();
              featureFields.forEach((fieldName) => {
                if (fieldName !== 'geometry') {
                  if (outfields?.includes(fieldName)) {
                    const fieldIndex = outfields.indexOf(fieldName);
                    featureInfoEntry.fieldInfo[fieldName] = {
                      fieldKey: fieldKeyCounter++,
                      value: this.getFieldValue(feature, fieldName, fieldTypes![fieldIndex]),
                      dataType: fieldTypes![fieldIndex] as 'string' | 'date' | 'number',
                      alias: aliasFields![fieldIndex],
                      domain: this.getFieldDomain(fieldName, layerEntryConfig!),
                    };
                  } else if (!outfields) {
                    featureInfoEntry.fieldInfo[fieldName] = {
                      fieldKey: fieldKeyCounter++,
                      value: this.getFieldValue(feature, fieldName, this.getFieldType(fieldName, layerEntryConfig!)),
                      dataType: this.getFieldType(fieldName, layerEntryConfig!),
                      alias: fieldName,
                      domain: this.getFieldDomain(fieldName, layerEntryConfig!),
                    };
                  }
                }
              });
              queryResult.push(featureInfoEntry);
            }
          });
          resolve(queryResult);
        });
      }
    });
    return promisedArrayOfFeatureInfo;
  }

  /** ***************************************************************************************************************************
   * Get the layerFilter that is associated to the layer. Returns undefined when the layer config can't be found using the layer
   * path.
   *
   * @param {string | TypeLayerEntryConfig} layerPathOrConfig Layer path or configuration.
   *
   * @returns {string | undefined} The filter associated to the layer or undefined.
   */
  getLayerFilter(layerPathOrConfig: string | TypeLayerEntryConfig): string | undefined {
    const layerEntryConfig = (
      typeof layerPathOrConfig === 'string' ? this.getLayerConfig(layerPathOrConfig) : layerPathOrConfig
    ) as TypeLayerEntryConfig;
    if (layerEntryConfig) return layerEntryConfig.olLayer?.get('layerFilter');
    return undefined;
  }

  /** ***************************************************************************************************************************
   * Get the bounds of the layer represented in the layerConfig, returns updated bounds
   *
   * @param {TypeLayerEntryConfig} layerConfig Layer config to get bounds from.
   * @param {Extent | undefined} bounds The current bounding box to be adjusted.
   *
   * @returns {Extent} The layer bounding box.
   */
  protected abstract getBounds(layerConfig: TypeLayerEntryConfig, bounds: Extent | undefined): Extent | undefined;

  /** ***************************************************************************************************************************
   * Compute the layer bounds or undefined if the result can not be obtained from the feature extents that compose the layer. If
   * projectionCode is defined, returns the bounds in the specified projection otherwise use the map projection. The bounds are
   * different from the extent. They are mainly used for display purposes to show the bounding box in which the data resides and
   * to zoom in on the entire layer data. It is not used by openlayer to limit the display of data on the map.
   *
   * @param {string | TypeLayerEntryConfig | TypeListOfLayerEntryConfig} layerPathOrConfig Layer path or configuration.
   * @param {string | number | undefined} projectionCode Optional projection code to use for the returned bounds. Default to
   * current projection.
   *
   * @returns {Extent} The layer bounding box.
   */
  calculateBounds(
    layerPathOrConfig: string | TypeLayerEntryConfig,
    projectionCode: string | number = api.maps[this.mapId].currentProjection
  ): Extent | undefined {
    let bounds: Extent | undefined;
    const processGroupLayerBounds = (listOfLayerEntryConfig: TypeListOfLayerEntryConfig) => {
      listOfLayerEntryConfig.forEach((layerConfig) => {
        if (layerEntryIsGroupLayer(layerConfig)) processGroupLayerBounds(layerConfig.listOfLayerEntryConfig);
        else {
          bounds = this.getBounds(layerConfig, bounds);
        }
      });
    };

    const rootLayerConfig = typeof layerPathOrConfig === 'string' ? this.getLayerConfig(layerPathOrConfig) : layerPathOrConfig;
    if (rootLayerConfig) {
      if (Array.isArray(rootLayerConfig)) processGroupLayerBounds(rootLayerConfig);
      else processGroupLayerBounds([rootLayerConfig]);
    }

    if (bounds) {
      bounds = transformExtent(bounds, `EPSG:4326`, `EPSG:${projectionCode}`);
    }

    return bounds;
  }
}
