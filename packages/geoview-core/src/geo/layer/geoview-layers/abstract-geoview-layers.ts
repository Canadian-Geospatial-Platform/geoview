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

import { generateId, getLocalizedValue } from '../../../core/utils/utilities';
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
} from '../../map/map-schema-types';
import {
  codedValueType,
  GetFeatureInfoPayload,
  payloadIsQueryLayer,
  rangeDomainType,
  TypeArrayOfFeatureInfoEntries,
  TypeFeatureInfoEntry,
  TypeQueryType,
} from '../../../api/events/payloads/get-feature-info-payload';
import { snackbarMessagePayload } from '../../../api/events/payloads/snackbar-message-payload';
import { api } from '../../../app';
import { EVENT_NAMES } from '../../../api/events/event-types';
import { TypeJsonObject } from '../../../core/types/global-types';
import { Layer } from '../layer';
import { LayerSetPayload, payloadIsRequestLayerInventory } from '../../../api/events/payloads/layer-set-payload';
import { GetLegendsPayload, payloadIsQueryLegend } from '../../../api/events/payloads/get-legends-payload';
import { TimeDimension } from '../../../core/utils/date-mgt';
import { TypeEventHandlerFunction } from '../../../api/events/event';

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

export interface TypeWmsLegend extends Omit<TypeLegend, 'styleConfig'> {
  legend: HTMLCanvasElement;
}

/**
 * type guard function that redefines a TypeLegend as a TypeWmsLegend
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
  ogcFeature: 'TypeVectorLayerEntryConfig',
  ogcWfs: 'TypeVectorLayerEntryConfig',
  ogcWms: 'TypeOgcWmsLayerEntryConfig',
};

type TypeLayerSetHandlerFunctions = {
  requestLayerInventory?: TypeEventHandlerFunction;
  queryLegend?: TypeEventHandlerFunction;
  queryLayer?: TypeEventHandlerFunction;
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
  /** Flag used to indicate that the layer is loaded */
  isLoaded = false;

  /** Flag used to indicate a layer load error */
  loadError = false;

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

  /** Name of listOfLayerEntryConfig that did not load. */
  layerLoadError: { layer: string; consoleMessage: string }[] = [];

  /**
   * The vector or raster layer structure to be displayed for this GeoView class. Initial value is null indicating that the layers
   * have not been created.
   */
  gvLayers: BaseLayer | null = null;

  /** The layer Identifier that is used to get and set layer's settings. */
  activeLayer: TypeLayerEntryConfig | null = null;

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
  }

  /** ***************************************************************************************************************************
   * This method is used to create the layers specified in the listOfLayerEntryConfig attribute inherited from its parent.
   * Normally, it is the second method called in the life cycle of a GeoView layer, the first one being the constructor.
   * Its code is the same for all child classes. It must first validate that the gvLayers attribute is null indicating
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
      if (this.gvLayers === null) {
        this.getAdditionalServiceDefinition().then(() => {
          this.processListOfLayerEntryConfig(this.listOfLayerEntryConfig).then((layersCreated) => {
            this.gvLayers = layersCreated as BaseLayer;
            if (this.listOfLayerEntryConfig.length) this.setActiveLayer(this.listOfLayerEntryConfig[0]);
            resolve();
          });
        });
      } else {
        api.event.emit(
          snackbarMessagePayload(EVENT_NAMES.SNACKBAR.EVENT_SNACKBAR_OPEN, this.mapId, {
            type: 'key',
            value: 'validation.layer.createtwice',
            params: [this.mapId],
          })
        );
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
    const promisedExecution = new Promise<void>((resolve) => {
      this.getServiceMetadata().then(() => {
        if (this.listOfLayerEntryConfig.length) {
          // Recursively process the configuration tree of layer entries by removing layers in error and processing valid layers.
          this.listOfLayerEntryConfig = this.validateListOfLayerEntryConfig(this.listOfLayerEntryConfig);
          this.processListOfLayerEntryMetadata(this.listOfLayerEntryConfig).then(() => resolve());
        } else resolve(); // no layer entry.
      });
    });
    return promisedExecution;
  }

  /** ***************************************************************************************************************************
   * This method reads the service metadata from the metadataAccessPath.
   *
   * @returns {Promise<void>} A promise that the execution is done.
   */
  protected abstract getServiceMetadata(): Promise<void>;

  /** ***************************************************************************************************************************
   * This method recursively validates the configuration of the layer entries to ensure that each layer is correctly defined. If
   * necessary, additional code can be executed in the child method to complete the layer configuration.
   *
   * @param {TypeListOfLayerEntryConfig} listOfLayerEntryConfig The list of layer entries configuration to validate.
   *
   * @returns {TypeListOfLayerEntryConfig} A new layer configuration list with layers in error removed.
   */
  protected abstract validateListOfLayerEntryConfig(listOfLayerEntryConfig: TypeListOfLayerEntryConfig): TypeListOfLayerEntryConfig;

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
   * This method is used to process the layer's metadata. It will fill the empty fields of the layer's configuration (renderer,
   * initial settings, fields and aliases).
   *
   * @param {TypeLayerEntryConfig} layerEntryConfig The layer entry configuration to process.
   *
   * @returns {Promise<void>} A promise that the layer configuration has its metadata processed.
   */
  protected abstract processLayerMetadata(layerEntryConfig: TypeLayerEntryConfig): Promise<void>;

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
        } else {
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
              baseLayer.setVisible(true);
              this.registerToLayerSets(listOfLayerEntryConfig[0] as TypeBaseLayerEntryConfig);
              if (layerGroup) {
                layerGroup.getLayers().push(baseLayer);
                resolve(layerGroup);
              } else resolve(baseLayer);
            } else {
              this.layerLoadError.push({
                layer: Layer.getLayerPath(listOfLayerEntryConfig[0]),
                consoleMessage: `Unable to create layer ${Layer.getLayerPath(listOfLayerEntryConfig[0])} on map ${this.mapId}`,
              });
              resolve(null);
            }
          });
        }
      } else {
        if (!layerGroup) {
          // All children of this level in the tree have the same parent, so we use the first element of the array to retrieve the parent node.
          layerGroup = this.createLayerGroup(listOfLayerEntryConfig[0].parentLayerConfig as TypeLayerEntryConfig);
        }
        const promiseOfLayerCreated: Promise<BaseLayer | LayerGroup | null>[] = [];
        listOfLayerEntryConfig.forEach((layerEntryConfig, i) => {
          if (layerEntryIsGroupLayer(layerEntryConfig)) {
            const newLayerGroup = this.createLayerGroup(listOfLayerEntryConfig[i]);
            promiseOfLayerCreated.push(this.processListOfLayerEntryConfig(layerEntryConfig.listOfLayerEntryConfig!, newLayerGroup));
          } else {
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
              if (baseLayer?.get('layerEntryConfig')?.layerId.endsWith('-unclustered')) {
                baseLayer.setVisible(false);
              } else if (baseLayer) baseLayer.setVisible(true);
              if (layerEntryIsGroupLayer(listOfLayerEntryConfig[i])) {
                if (baseLayer) {
                  layerGroup!.getLayers().push(baseLayer);
                } else if (listOfLayerEntryConfig[i]) {
                  this.layerLoadError.push({
                    layer: Layer.getLayerPath(listOfLayerEntryConfig[i]),
                    consoleMessage: `Unable to create group layer ${Layer.getLayerPath(listOfLayerEntryConfig[i])} on map ${this.mapId}`,
                  });
                } else resolve(null);
              } else if (baseLayer) {
                this.registerToLayerSets(baseLayer.get('layerEntryConfig') as TypeBaseLayerEntryConfig);
                layerGroup!.getLayers().push(baseLayer);
              } else {
                this.layerLoadError.push({
                  layer: Layer.getLayerPath(listOfLayerEntryConfig[i]),
                  consoleMessage: `Unable to create layer ${Layer.getLayerPath(listOfLayerEntryConfig[i])} on map ${this.mapId}`,
                });
                resolve(null);
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
   * Return feature information for the layer specified. If layerPathOrConfig is undefined, this.activeLayer is used.
   *
   * @param {Pixel | Coordinate | Coordinate[]} location A pixel, a coordinate or a polygon that will be used by the query.
   * @param {string | TypeLayerEntryConfig | null} layerPathOrConfig Optional layer path or configuration.
   * @param {TypeQueryType} queryType Optional query type, default value is 'at pixel'.
   *
   * @returns {Promise<TypeFeatureInfoResult>} The feature info table.
   */
  getFeatureInfo(
    location: Pixel | Coordinate | Coordinate[],
    layerPathOrConfig: string | TypeLayerEntryConfig | null = this.activeLayer,
    queryType: TypeQueryType = 'at pixel'
  ): Promise<TypeArrayOfFeatureInfoEntries> {
    const queryResult = new Promise<TypeArrayOfFeatureInfoEntries>((resolve) => {
      const layerConfig = (
        typeof layerPathOrConfig === 'string' ? this.getLayerConfig(layerPathOrConfig) : layerPathOrConfig
      ) as TypeLayerEntryConfig | null;
      if (!layerConfig || !layerConfig.source?.featureInfo?.queryable) resolve([]);

      switch (queryType) {
        case 'at pixel':
          this.getFeatureInfoAtPixel(location as Pixel, layerConfig!).then((featureInfoResult) => resolve(featureInfoResult));
          break;
        case 'at coordinate':
          this.getFeatureInfoAtCoordinate(location as Coordinate, layerConfig!).then((featureInfoResult) => resolve(featureInfoResult));
          break;
        case 'at long lat':
          this.getFeatureInfoAtLongLat(location as Coordinate, layerConfig!).then((featureInfoResult) => resolve(featureInfoResult));
          break;
        case 'using a bounding box':
          this.getFeatureInfoUsingBBox(location as Coordinate[], layerConfig!).then((featureInfoResult) => resolve(featureInfoResult));
          break;
        case 'using a polygon':
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
   * Return feature information for all the features around the provided Pixel.
   *
   * @param {Coordinate} location The pixel coordinate that will be used by the query.
   * @param {TypeLayerEntryConfig} layerConfig The layer configuration.
   *
   * @returns {Promise<TypeFeatureInfoResult>} The feature info table.
   */
  protected abstract getFeatureInfoAtPixel(location: Pixel, layerConfig: TypeLayerEntryConfig): Promise<TypeArrayOfFeatureInfoEntries>;

  /** ***************************************************************************************************************************
   * Return feature information for all the features around the provided coordinate.
   *
   * @param {Coordinate} location The coordinate that will be used by the query.
   * @param {TypeLayerEntryConfig} layerConfig The layer configuration.
   *
   * @returns {Promise<TypeFeatureInfoResult>} The feature info table.
   */
  protected abstract getFeatureInfoAtCoordinate(
    location: Coordinate,
    layerConfig: TypeLayerEntryConfig
  ): Promise<TypeArrayOfFeatureInfoEntries>;

  /** ***************************************************************************************************************************
   * Return feature information for all the features around the provided longitude latitude.
   *
   * @param {Coordinate} location The coordinate that will be used by the query.
   * @param {TypeLayerEntryConfig} layerConfig The layer configuration.
   *
   * @returns {Promise<TypeFeatureInfoResult>} The feature info table.
   */
  protected abstract getFeatureInfoAtLongLat(
    location: Coordinate,
    layerConfig: TypeLayerEntryConfig
  ): Promise<TypeArrayOfFeatureInfoEntries>;

  /** ***************************************************************************************************************************
   * Return feature information for all the features in the provided bounding box.
   *
   * @param {Coordinate} location The coordinate that will be used by the query.
   * @param {TypeLayerEntryConfig} layerConfig The layer configuration.
   *
   * @returns {Promise<TypeFeatureInfoResult>} The feature info table.
   */
  protected abstract getFeatureInfoUsingBBox(
    location: Coordinate[],
    layerConfig: TypeLayerEntryConfig
  ): Promise<TypeArrayOfFeatureInfoEntries>;

  /** ***************************************************************************************************************************
   * Return feature information for all the features in the provided polygon.
   *
   * @param {Coordinate} location The coordinate that will be used by the query.
   * @param {TypeLayerEntryConfig} layerConfig The layer configuration.
   *
   * @returns {Promise<TypeFeatureInfoResult>} The feature info table.
   */
  protected abstract getFeatureInfoUsingPolygon(
    location: Coordinate[],
    layerConfig: TypeLayerEntryConfig
  ): Promise<TypeArrayOfFeatureInfoEntries>;

  /** ***************************************************************************************************************************
   * This method register the layer entry to layer sets.
   *
   * @param {TypeBaseLayerEntryConfig} layerEntryConfig The layer entry to register.
   */
  protected registerToLayerSets(layerEntryConfig: TypeBaseLayerEntryConfig) {
    const layerPath = Layer.getLayerPath(layerEntryConfig);
    if (!this.registerToLayerSetListenerFunctions[layerPath]) this.registerToLayerSetListenerFunctions[layerPath] = {};

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

    if ('featureInfo' in layerEntryConfig.source! && layerEntryConfig.source.featureInfo?.queryable) {
      // Listen to events that request to query a layer and return the resultset to the requester.
      this.registerToLayerSetListenerFunctions[layerPath].queryLayer = (payload) => {
        if (payloadIsQueryLayer(payload)) {
          const { queryType, location } = payload;
          this.getFeatureInfo(location, layerPath, queryType).then((queryResult) => {
            api.event.emit(GetFeatureInfoPayload.createQueryResultPayload(this.mapId, layerPath, queryResult));
          });
        }
      };

      api.event.on(EVENT_NAMES.GET_FEATURE_INFO.QUERY_LAYER, this.registerToLayerSetListenerFunctions[layerPath].queryLayer!, this.mapId);
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

    api.event.off(
      EVENT_NAMES.LAYER_SET.REQUEST_LAYER_INVENTORY,
      this.mapId,
      this.registerToLayerSetListenerFunctions[layerPath].requestLayerInventory
    );

    api.event.off(
      EVENT_NAMES.GET_LEGENDS.QUERY_LEGEND,
      `${this.mapId}/${layerPath}`,
      this.registerToLayerSetListenerFunctions[layerPath].queryLegend
    );

    if ('featureInfo' in layerEntryConfig.source! && layerEntryConfig.source.featureInfo?.queryable) {
      api.event.off(EVENT_NAMES.GET_FEATURE_INFO.QUERY_LAYER, this.mapId, this.registerToLayerSetListenerFunctions[layerPath].queryLayer);
    }
  }

  /** ***************************************************************************************************************************
   * This method create a layer group.
   * @param {TypeLayerEntryConfig | TypeGeoviewLayerConfig} layerConfig
   * @returns {LayerGroup} A new layer group.
   */
  private createLayerGroup(layerConfig: TypeLayerEntryConfig | TypeGeoviewLayerConfig): LayerGroup {
    const layerGroupOptions: LayerGroupOptions = {
      layers: new Collection(),
      properties: { layerConfig },
    };
    if (layerConfig.initialSettings?.extent !== undefined) layerGroupOptions.extent = layerConfig.initialSettings?.extent;
    if (layerConfig.initialSettings?.maxZoom !== undefined) layerGroupOptions.maxZoom = layerConfig.initialSettings?.maxZoom;
    if (layerConfig.initialSettings?.minZoom !== undefined) layerGroupOptions.minZoom = layerConfig.initialSettings?.minZoom;
    if (layerConfig.initialSettings?.opacity !== undefined) layerGroupOptions.opacity = layerConfig.initialSettings?.opacity;
    if (layerConfig.initialSettings?.visible !== undefined) layerGroupOptions.visible = layerConfig.initialSettings?.visible;
    layerConfig.gvLayer = new LayerGroup(layerGroupOptions);
    return layerConfig.gvLayer as LayerGroup;
  }

  /** ***************************************************************************************************************************
   * Set the active layer. It is the layer that will be used in some functions when the optional layer path is undefined.
   * The parameter can be a layer path (string) or a layer configuration. When the parameter is a layer path that
   * can not be found, the active layer remain unchanged.
   *
   * @param {string | TypeLayerEntryConfig} layerPathOrConfig The layer identifier.
   */
  setActiveLayer(layerPathOrConfig: string | TypeLayerEntryConfig) {
    if (typeof layerPathOrConfig === 'string') {
      const activeLayer = api.map(this.mapId).layer.registeredLayers[layerPathOrConfig];
      if (activeLayer !== undefined) this.activeLayer = activeLayer;
    } else this.activeLayer = layerPathOrConfig as TypeLayerEntryConfig;
  }

  /** ***************************************************************************************************************************
   * Get the layer configuration of the specified layer path. If the layer path is undefined, the active layer is returned.
   *
   * @param {string} layerPath The layer path.
   *
   * @returns {TypeLayerEntryConfig | null} The layer configuration or null if not found.
   */
  getLayerConfig(layerPath?: string): TypeLayerEntryConfig | null | undefined {
    if (layerPath === undefined) return this.activeLayer;
    return api.map(this.mapId).layer.registeredLayers[layerPath];
  }

  /** ***************************************************************************************************************************
   * Returns the layer bounds or undefined if not defined in the layer configuration or the metadata. If layerPathOrConfig is
   * undefined, the active layer is used. If projectionCode is defined, returns the bounds in the specified projection otherwise
   * use the map projection. The bounds are different from the extent. They are mainly used for display purposes to show the
   * bounding box in which the data resides and to zoom in on the entire layer data. It is not used by openlayer to limit the
   * display of data on the map.
   *
   * @param {string | TypeLayerEntryConfig | TypeListOfLayerEntryConfig | null} layerPathOrConfig Optional layer path or
   * configuration.
   * @param {string | number | undefined} projectionCode Optional projection code to use for the returned bounds.
   *
   * @returns {Extent} The layer bounding box.
   */
  getMetadataBounds(
    layerPathOrConfig: string | TypeLayerEntryConfig | TypeListOfLayerEntryConfig | null = this.activeLayer,
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
   * Return the extent of the layer or undefined if it will be visible regardless of extent. The layer extent is an array of
   * numbers representing an extent: [minx, miny, maxx, maxy]. If layerPathOrConfig is undefined, the activeLayer of the class
   * will be used. This routine return undefined when no layerPathOrConfig is specified and the active layer is null. The extent
   * is used to clip the data displayed on the map.
   *
   * @param {string | TypeLayerEntryConfig | null} layerPathOrConfig Optional layer path or configuration.
   *
   * @returns {Extent} The layer extent.
   */
  getExtent(layerPathOrConfig: string | TypeLayerEntryConfig | null = this.activeLayer): Extent | undefined {
    const gvLayer = typeof layerPathOrConfig === 'string' ? this.getLayerConfig(layerPathOrConfig)?.gvLayer : layerPathOrConfig?.gvLayer;
    return gvLayer ? gvLayer.getExtent() : undefined;
  }

  /** ***************************************************************************************************************************
   * Return the type of the specified field.
   *
   * @param {string} fieldName field name for which we want to get the type.
   * @param {TypeLayerEntryConfig} layerConfig layer configuration.
   *
   * @returns {null | codedValueType | rangeDomainType} The domain of the field.
   */
  protected abstract getFieldDomain(fieldName: string, layerConfig: TypeLayerEntryConfig): null | codedValueType | rangeDomainType;

  /** ***************************************************************************************************************************
   * Return the domain of the specified field. If the type can not be found, return 'string'.
   *
   * @param {string} fieldName field name for which we want to get the domain.
   * @param {TypeLayerEntryConfig} layerConfig layer configuration.
   *
   * @returns {'string' | 'date' | 'number'} The type of the field.
   */
  protected abstract getFieldType(fieldName: string, layerConfig: TypeLayerEntryConfig): 'string' | 'date' | 'number';

  /** ***************************************************************************************************************************
   * set the extent of the layer. Use undefined if it will be visible regardless of extent. The layer extent is an array of
   * numbers representing an extent: [minx, miny, maxx, maxy]. If layerPathOrConfig is undefined, the activeLayer of the class
   * will be used. This routine does nothing when no layerPathOrConfig is specified and the active layer is null.
   *
   * @param {Extent} layerExtent The extent to assign to the layer.
   * @param {string | TypeLayerEntryConfig | null} layerPathOrConfig Optional layer path or configuration.
   */
  setExtent(layerExtent: Extent, layerPathOrConfig: string | TypeLayerEntryConfig | null = this.activeLayer) {
    const gvLayer = typeof layerPathOrConfig === 'string' ? this.getLayerConfig(layerPathOrConfig)?.gvLayer : layerPathOrConfig?.gvLayer;
    if (gvLayer) gvLayer.setExtent(layerExtent);
  }

  /** ***************************************************************************************************************************
   * Return the opacity of the layer (between 0 and 1). When layerPathOrConfig is undefined, the activeLayer of the class is
   * used. This routine return undefined when the layerPath specified is not found or when the layerPathOrConfig is undefined and
   * the active layer is null.
   *
   * @param {string | TypeLayerEntryConfig | null} layerPathOrConfig Optional layer path or configuration.
   *
   * @returns {number} The opacity of the layer.
   */
  getOpacity(layerPathOrConfig: string | TypeLayerEntryConfig | null = this.activeLayer): number | undefined {
    const gvLayer = typeof layerPathOrConfig === 'string' ? this.getLayerConfig(layerPathOrConfig)?.gvLayer : layerPathOrConfig?.gvLayer;
    return gvLayer ? gvLayer.getOpacity() : undefined;
  }

  /** ***************************************************************************************************************************
   * Set the opacity of the layer (between 0 and 1). When layerPathOrConfig is undefined, the activeLayer of the class is used.
   * This routine does nothing when the layerPath specified is not found or when the layerPathOrConfig is undefined and the
   * active layer is null.
   *
   * @param {number} layerOpacity The opacity of the layer.
   * @param {string | TypeLayerEntryConfig | null} layerPathOrConfig Optional layer path or configuration.
   *
   */
  setOpacity(layerOpacity: number, layerPathOrConfig: string | TypeLayerEntryConfig | null = this.activeLayer) {
    const gvLayer = typeof layerPathOrConfig === 'string' ? this.getLayerConfig(layerPathOrConfig)?.gvLayer : layerPathOrConfig?.gvLayer;
    if (gvLayer) gvLayer.setOpacity(layerOpacity);
  }

  /** ***************************************************************************************************************************
   * Return the visibility of the layer (true or false). When layerPathOrConfig is undefined, the activeLayer of the class is
   * used. This routine return undefined when the layerPath specified is not found or when the layerPathOrConfig is undefined and
   * the active layer is null.
   *
   * @param {string | TypeLayerEntryConfig | null} layerPathOrConfig Optional layer path or configuration.
   *
   * @returns {boolean} The visibility of the layer.
   */
  getVisible(layerPathOrConfig: string | TypeLayerEntryConfig | null = this.activeLayer): boolean | undefined {
    const gvLayer = typeof layerPathOrConfig === 'string' ? this.getLayerConfig(layerPathOrConfig)?.gvLayer : layerPathOrConfig?.gvLayer;
    return gvLayer ? gvLayer.getVisible() : undefined;
  }

  /** ***************************************************************************************************************************
   * Set the visibility of the layer (true or false). When layerPathOrConfig is undefined, the activeLayer of the class is
   * used. This routine does nothing when the layerPath specified is not found or when the layerPathOrConfig is undefined and the
   * active layer is null.
   *
   * @param {boolean} layerVisibility The visibility of the layer.
   * @param {string | TypeLayerEntryConfig | null} layerPathOrConfig Optional layer path or configuration.
   */
  setVisible(layerVisibility: boolean, layerPathOrConfig: string | TypeLayerEntryConfig | null = this.activeLayer) {
    const gvLayer = typeof layerPathOrConfig === 'string' ? this.getLayerConfig(layerPathOrConfig)?.gvLayer : layerPathOrConfig?.gvLayer;
    if (gvLayer) {
      gvLayer.setVisible(layerVisibility);
      gvLayer.changed();
    }
  }

  /** ***************************************************************************************************************************
   * Return the min zoom of the layer. When layerPathOrConfig is undefined, the activeLayer of the class is used. This routine
   * return undefined when the layerPath specified is not found or when the layerPathOrConfig is undefined and the active layer
   * is null.
   *
   * @param {string | TypeLayerEntryConfig | null} layerPathOrConfig Optional layer path or configuration.
   *
   * @returns {boolean} The visibility of the layer.
   */
  getMinZoom(layerPathOrConfig: string | TypeLayerEntryConfig | null = this.activeLayer): number | undefined {
    const gvLayer = typeof layerPathOrConfig === 'string' ? this.getLayerConfig(layerPathOrConfig)?.gvLayer : layerPathOrConfig?.gvLayer;
    return gvLayer ? gvLayer.getMinZoom() : undefined;
  }

  /** ***************************************************************************************************************************
   * Set the min zoom of the layer. When layerPathOrConfig is undefined, the activeLayer of the class is used. This routine
   * does nothing when the layerPath specified is not found or when the layerPathOrConfig is undefined and the active layer is
   * null.
   *
   * @param {boolean} layerVisibility The visibility of the layer.
   * @param {string | TypeLayerEntryConfig | null} layerPathOrConfig Optional layer path or configuration.
   */
  setMinZoom(minZoom: number, layerPathOrConfig: string | TypeLayerEntryConfig | null = this.activeLayer) {
    const gvLayer = typeof layerPathOrConfig === 'string' ? this.getLayerConfig(layerPathOrConfig)?.gvLayer : layerPathOrConfig?.gvLayer;
    if (gvLayer) gvLayer.setMinZoom(minZoom);
  }

  /** ***************************************************************************************************************************
   * Return the max zoom of the layer. When layerPathOrConfig is undefined, the activeLayer of the class is used. This routine
   * return undefined when the layerPath specified is not found or when the layerPathOrConfig is undefined and the active layer
   * is null.
   *
   * @param {string | TypeLayerEntryConfig | null} layerPathOrConfig Optional layer path or configuration.
   *
   * @returns {boolean} The visibility of the layer.
   */
  getMaxZoom(layerPathOrConfig: string | TypeLayerEntryConfig | null = this.activeLayer): number | undefined {
    const gvLayer = typeof layerPathOrConfig === 'string' ? this.getLayerConfig(layerPathOrConfig)?.gvLayer : layerPathOrConfig?.gvLayer;
    return gvLayer ? gvLayer.getMaxZoom() : undefined;
  }

  /** ***************************************************************************************************************************
   * Set the max zoom of the layer. When layerPathOrConfig is undefined, the activeLayer of the class is used. This routine
   * does nothing when the layerPath specified is not found or when the layerPathOrConfig is undefined and the active layer is
   * null.
   *
   * @param {boolean} layerVisibility The visibility of the layer.
   * @param {string | TypeLayerEntryConfig | null} layerPathOrConfig Optional layer path or configuration.
   */
  setMaxZoom(maxZoom: number, layerPathOrConfig: string | TypeLayerEntryConfig | null = this.activeLayer) {
    const gvLayer = typeof layerPathOrConfig === 'string' ? this.getLayerConfig(layerPathOrConfig)?.gvLayer : layerPathOrConfig?.gvLayer;
    if (gvLayer) gvLayer.setMaxZoom(maxZoom);
  }

  /** ***************************************************************************************************************************
   * Return the legend of the layer. When layerPathOrConfig is undefined, the activeLayer of the class is used. This routine
   * return null when the layerPath specified is not found or when the layerPathOrConfig is undefined and the active layer
   * is null or the layerConfig.style property is undefined.
   *
   * @param {string | TypeLayerEntryConfig | null} layerPathOrConfig Optional layer path or configuration.
   *
   * @returns {Promise<TypeLegend | null>} The legend of the layer.
   */
  getLegend(layerPathOrConfig: string | TypeLayerEntryConfig | null = this.activeLayer): Promise<TypeLegend | null> {
    const promisedLegend = new Promise<TypeLegend | null>((resolve) => {
      const layerConfig = (
        typeof layerPathOrConfig === 'string' ? this.getLayerConfig(layerPathOrConfig) : layerPathOrConfig
      ) as TypeBaseLayerEntryConfig & {
        style: TypeStyleConfig;
      };

      if (!layerConfig?.style)
        resolve({
          type: this.type,
          layerPath: Layer.getLayerPath(layerConfig),
          layerName: layerConfig.layerName!,
          styleConfig: layerConfig?.style,
          legend: null,
        } as TypeLegend);
      else {
        const { geoviewRenderer } = api.map(this.mapId);
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
        const fieldTypes = featureInfo?.fieldTypes?.split(',');
        const outfields = getLocalizedValue(featureInfo?.outfields, this.mapId)?.split(',');
        const aliasFields = getLocalizedValue(featureInfo?.aliasFields, this.mapId)?.split(',');
        const queryResult: TypeArrayOfFeatureInfoEntries = [];
        let featureKeyCounter = 0;
        let fieldKeyCounter = 0;
        const promisedAllCanvasFound: Promise<{ feature: Feature<Geometry>; canvas: HTMLCanvasElement | undefined }>[] = [];
        features.forEach((featureNeedingItsCanvas) => {
          promisedAllCanvasFound.push(
            new Promise<{ feature: Feature<Geometry>; canvas: HTMLCanvasElement | undefined }>((resolveCanvas) => {
              api
                .map(this.mapId)
                .geoviewRenderer.getFeatureCanvas(featureNeedingItsCanvas, layerEntryConfig as TypeVectorLayerEntryConfig)
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
              };

              const featureFields = feature.getKeys();
              featureFields.forEach((fieldName) => {
                if (fieldName !== 'geometry') {
                  if (outfields?.includes(fieldName)) {
                    const fieldIndex = outfields.indexOf(fieldName);
                    featureInfoEntry.fieldInfo[fieldName] = {
                      fieldKey: fieldKeyCounter++,
                      value: feature.get(fieldName),
                      dataType: fieldTypes![fieldIndex] as 'string' | 'date' | 'number',
                      alias: aliasFields![fieldIndex],
                      domain: this.getFieldDomain(fieldName, layerEntryConfig!),
                    };
                  } else if (!outfields) {
                    featureInfoEntry.fieldInfo[fieldName] = {
                      fieldKey: fieldKeyCounter++,
                      value: feature.get(fieldName),
                      dataType: this.getFieldType(fieldName, layerEntryConfig!),
                      alias: fieldName,
                      domain: this.getFieldDomain(fieldName, layerEntryConfig!),
                    };
                  }
                }
              });
              queryResult.push(featureInfoEntry);
              resolve(queryResult);
            }
          });
        });
      }
    });
    return promisedArrayOfFeatureInfo;
  }
}
