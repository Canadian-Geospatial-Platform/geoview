import BaseLayer from 'ol/layer/Base';
import Collection from 'ol/Collection';
import { Coordinate } from 'ol/coordinate';
import { Pixel } from 'ol/pixel';
import { Extent } from 'ol/extent';
import LayerGroup, { Options as LayerGroupOptions } from 'ol/layer/Group';

import { cloneDeep } from 'lodash';
import { generateId } from '../../../core/utils/utilities';
import {
  TypeGeoviewLayerConfig,
  TypeListOfLayerEntryConfig,
  TypeLocalizedString,
  TypeLayerEntryConfig,
  TypeBaseLayerEntryConfig,
  TypeBaseSourceImageInitialConfig,
  TypeBaseSourceVectorInitialConfig,
  layerEntryIsGroupLayer,
  TypeStyleConfig,
  TypeLayerGroupEntryConfig,
  TypeVectorLayerEntryConfig,
  TypeImageLayerEntryConfig,
} from '../../map/map-schema-types';
import {
  getFeatureInfoPayload,
  payloadIsGetFeatureInfo,
  TypeFeatureInfoQuery,
  TypeFeatureInfoRegister,
  TypeFeatureInfoResult,
  TypeQueryType,
} from '../../../api/events/payloads/get-feature-info-payload';
import { snackbarMessagePayload } from '../../../api/events/payloads/snackbar-message-payload';
import { api } from '../../../app';
import { EVENT_NAMES } from '../../../api/events/event-types';
import { TypeJsonObject } from '../../../core/types/global-types';

export type TypeLegend = {
  layerId: string;
  layerName?: TypeLocalizedString;
  type: TypeGeoviewLayerType;
  legend: TypeStyleConfig | string | ArrayBuffer;
};

/** ******************************************************************************************************************************
 * GeoViewAbstractLayers types
 */

// Constant used to define the default layer names
const DEFAULT_LAYER_NAMES: Record<TypeGeoviewLayerType, string> = {
  esriDynamic: 'Esri Dynamic Layer',
  esriFeature: 'Esri Feature Layer',
  GeoJSON: 'GeoJson Layer',
  geoCore: 'GeoCore Layer',
  xyzTiles: 'XYZ Tiles',
  ogcFeature: 'OGC Feature Layer',
  ogcWfs: 'WFS Layer',
  ogcWms: 'WMS Layer',
};

// Definition of the keys used to create the constants of the GeoView layer
type LayerTypesKey = 'ESRI_DYNAMIC' | 'ESRI_FEATURE' | 'GEOJSON' | 'GEOCORE' | 'XYZ_TILES' | 'OGC_FEATURE' | 'WFS' | 'WMS';

/**
 * Type of GeoView layers
 */
export type TypeGeoviewLayerType = 'esriDynamic' | 'esriFeature' | 'GeoJSON' | 'geoCore' | 'xyzTiles' | 'ogcFeature' | 'ogcWfs' | 'ogcWms';

/**
 * Definition of the GeoView layer constants
 */
export const CONST_LAYER_TYPES: Record<LayerTypesKey, TypeGeoviewLayerType> = {
  ESRI_DYNAMIC: 'esriDynamic',
  ESRI_FEATURE: 'esriFeature',
  GEOJSON: 'GeoJSON',
  GEOCORE: 'geoCore',
  XYZ_TILES: 'xyzTiles',
  OGC_FEATURE: 'ogcFeature',
  WFS: 'ogcWfs',
  WMS: 'ogcWms',
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

  /** The type of GeoView layer that is instantiated. */
  type: TypeGeoviewLayerType;

  /** The unique identifier for the GeoView layer. The value of this attribute is extracted from the mapLayerConfig parameter.
   * If its value is undefined, a unique value is generated.
   */
  layerId: string;

  /** The GeoView layer name. The value of this attribute is extracted from the mapLayerConfig parameter. If its value is
   * undefined, a default value is generated.
   */
  layerName: TypeLocalizedString = { en: '', fr: '' };

  /** The GeoView layer metadataAccessPath. The name attribute is optional */
  metadataAccessPath: TypeLocalizedString = { en: '', fr: '' };

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

  /** Attribution used in the OpenLayer source. */
  attributions: string[] = [];

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
    this.layerId = mapLayerConfig.layerId || generateId('');
    this.layerName.en = mapLayerConfig?.layerName?.en ? mapLayerConfig.layerName.en : DEFAULT_LAYER_NAMES[type];
    this.layerName.fr = mapLayerConfig?.layerName?.fr ? mapLayerConfig.layerName.fr : DEFAULT_LAYER_NAMES[type];
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
   * attribute. This method will also register the layers to all panels that offer this possibility. For example, if a layer is
   * queryable, it will subscribe to the details-panel and every time the user clicks on the map, the panel will ask the layer
   * to return the descriptive information of all the features in a tolerance radius. This information will be used to populate
   * the details-panel.
   */
  createGeoViewLayers(): Promise<void> {
    const promisedExecution = new Promise<void>((resolve) => {
      if (this.gvLayers === null) {
        this.getAdditionalServiceDefinition().then(() => {
          this.processListOfLayerEntryConfig(this.listOfLayerEntryConfig).then((layersCreated) => {
            this.gvLayers = layersCreated as BaseLayer;
            if (this.listOfLayerEntryConfig.length) this.setActiveLayer(this.listOfLayerEntryConfig[0].layerId);
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
        if (this.metadata) {
          if (this.listOfLayerEntryConfig.length) {
            // Recursively process the configuration tree of layer entries by removing layers in error and processing valid layers.
            this.listOfLayerEntryConfig = this.validateListOfLayerEntryConfig(this.listOfLayerEntryConfig);
            this.processListOfLayerEntryMetadata(this.listOfLayerEntryConfig).then(() => resolve());
          } else resolve(); // no layer entry.
        } else resolve(); // no metadata was read.
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
          if (layerEntryConfig.isDynamicLayerGroup) promisedAllLayerDone.push(this.processDynamicGroupLayer(layerEntryConfig));
          else promisedAllLayerDone.push(this.processListOfLayerEntryMetadata(layerEntryConfig.listOfLayerEntryConfig));
        else promisedAllLayerDone.push(this.processLayerMetadata(layerEntryConfig));
      });
      Promise.all(promisedAllLayerDone).then(() => resolve());
    });
    return promisedListOfLayerEntryProcessed;
  }

  /** ***************************************************************************************************************************
   * This method is used to process dynamic group layer entries. These layers behave as a GeoView group layer and also as a data
   * layer (i.e. they have extent, visibility and query flag definition). Dynamic group layers can be identified by
   * the presence of an isDynamicLayerGroup attribute set to true.
   *
   * @param {TypeLayerGroupEntryConfig} layerEntryConfig The layer entry configuration to process.
   *
   * @returns {Promise<void>} A promise that the vector layer configuration has its metadata and group layers processed.
   */
  private processDynamicGroupLayer(layerEntryConfig: TypeLayerGroupEntryConfig): Promise<void> {
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
   *
   * @returns {Promise<BaseLayer | null>} The promise that the layers were processed.
   */
  protected processListOfLayerEntryConfig(listOfLayerEntryConfig: TypeListOfLayerEntryConfig): Promise<BaseLayer | null> {
    const promisedListOfLayerEntryProcessed = new Promise<BaseLayer | null>((resolve) => {
      if (listOfLayerEntryConfig.length === 1) {
        if (layerEntryIsGroupLayer(listOfLayerEntryConfig[0])) {
          this.processListOfLayerEntryConfig(listOfLayerEntryConfig[0].listOfLayerEntryConfig!).then((groupCreated) => {
            if (groupCreated) {
              resolve(groupCreated);
            } else {
              this.layerLoadError.push({
                layer: listOfLayerEntryConfig[0].layerId,
                consoleMessage: `Unable to create group layer ${listOfLayerEntryConfig[0].layerId} on map ${this.mapId}`,
              });
              resolve(null);
            }
          });
        } else {
          this.processOneLayerEntry(listOfLayerEntryConfig[0] as TypeBaseLayerEntryConfig).then((baseLayer) => {
            if (baseLayer) {
              this.registerToPanels(listOfLayerEntryConfig[0] as TypeBaseLayerEntryConfig);
              resolve(baseLayer);
            } else {
              this.layerLoadError.push({
                layer: listOfLayerEntryConfig[0].layerId,
                consoleMessage: `Unable to create layer ${listOfLayerEntryConfig[0].layerId} on map ${this.mapId}`,
              });
              resolve(null);
            }
          });
        }
      } else {
        const promiseOfLayerCreated: Promise<BaseLayer | LayerGroup | null>[] = [];
        listOfLayerEntryConfig.forEach((layerEntryConfig) => {
          if (layerEntryIsGroupLayer(layerEntryConfig)) {
            promiseOfLayerCreated.push(this.processListOfLayerEntryConfig(layerEntryConfig.listOfLayerEntryConfig!));
          } else promiseOfLayerCreated.push(this.processOneLayerEntry(layerEntryConfig as TypeBaseLayerEntryConfig));
        });
        Promise.all(promiseOfLayerCreated)
          .then((listOfLayerCreated) => {
            if (listOfLayerCreated?.length) {
              // All child of this level in the tree have the same parent, so we use the first element of the array to retrieve the parent node.
              const layerGroup = this.createLayerGroup(listOfLayerEntryConfig[0].parentLayerConfig as TypeLayerEntryConfig);

              listOfLayerCreated.forEach((baseLayer, i) => {
                if (baseLayer) {
                  if (!layerEntryIsGroupLayer(listOfLayerEntryConfig[i]))
                    this.registerToPanels(listOfLayerEntryConfig[i] as TypeBaseLayerEntryConfig);
                  layerGroup.getLayers().push(baseLayer);
                } else if (layerEntryIsGroupLayer(listOfLayerEntryConfig[i]))
                  this.layerLoadError.push({
                    layer: listOfLayerEntryConfig[i].layerId,
                    consoleMessage: `Unable to create group layer ${listOfLayerEntryConfig[i].layerId} on map ${this.mapId}`,
                  });
                else
                  this.layerLoadError.push({
                    layer: listOfLayerEntryConfig[i].layerId,
                    consoleMessage: `Unable to create layer ${listOfLayerEntryConfig[i].layerId} on map ${this.mapId}`,
                  });
              });
              resolve(layerGroup);
            } else resolve(null);
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
   * Return feature information for the layer specified. If layerId is undefined, this.activeLayer is used.
   *
   * @param {Pixel | Coordinate | Coordinate[]} location A pixel, a coordinate or a polygon that will be used by the query.
   * @param {string} layerId Optional layer identifier. If undefined, this.activeLayer is used.
   * @param {TypeQueryType} queryType Optional query type, default value is 'at pixel'.
   *
   * @returns {Promise<TypeFeatureInfoResult>} The feature info table.
   */
  getFeatureInfo(
    location: Pixel | Coordinate | Coordinate[],
    layerId?: string,
    queryType: TypeQueryType = 'at pixel'
  ): Promise<TypeFeatureInfoResult> {
    const queryResult = new Promise<TypeFeatureInfoResult>((resolve) => {
      const layerConfig = this.getLayerConfig(layerId) as TypeVectorLayerEntryConfig | TypeImageLayerEntryConfig | null;
      if (!layerConfig || !layerConfig.source?.featureInfo?.queryable) resolve(null);

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
          resolve(null);
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
  protected abstract getFeatureInfoAtPixel(location: Pixel, layerConfig: TypeLayerEntryConfig): Promise<TypeFeatureInfoResult>;

  /** ***************************************************************************************************************************
   * Return feature information for all the features around the provided coordinate.
   *
   * @param {Coordinate} location The coordinate that will be used by the query.
   * @param {TypeLayerEntryConfig} layerConfig The layer configuration.
   *
   * @returns {Promise<TypeFeatureInfoResult>} The feature info table.
   */
  protected abstract getFeatureInfoAtCoordinate(location: Coordinate, layerConfig: TypeLayerEntryConfig): Promise<TypeFeatureInfoResult>;

  /** ***************************************************************************************************************************
   * Return feature information for all the features around the provided longitude latitude.
   *
   * @param {Coordinate} location The coordinate that will be used by the query.
   * @param {TypeLayerEntryConfig} layerConfig The layer configuration.
   *
   * @returns {Promise<TypeFeatureInfoResult>} The feature info table.
   */
  protected abstract getFeatureInfoAtLongLat(location: Coordinate, layerConfig: TypeLayerEntryConfig): Promise<TypeFeatureInfoResult>;

  /** ***************************************************************************************************************************
   * Return feature information for all the features in the provided bounding box.
   *
   * @param {Coordinate} location The coordinate that will be used by the query.
   * @param {TypeLayerEntryConfig} layerConfig The layer configuration.
   *
   * @returns {Promise<TypeFeatureInfoResult>} The feature info table.
   */
  protected abstract getFeatureInfoUsingBBox(location: Coordinate[], layerConfig: TypeLayerEntryConfig): Promise<TypeFeatureInfoResult>;

  /** ***************************************************************************************************************************
   * Return feature information for all the features in the provided polygon.
   *
   * @param {Coordinate} location The coordinate that will be used by the query.
   * @param {TypeLayerEntryConfig} layerConfig The layer configuration.
   *
   * @returns {Promise<TypeFeatureInfoResult>} The feature info table.
   */
  protected abstract getFeatureInfoUsingPolygon(location: Coordinate[], layerConfig: TypeLayerEntryConfig): Promise<TypeFeatureInfoResult>;

  /** ***************************************************************************************************************************
   * This method register the GeoView layer to panels that offer this possibility.
   *
   * @param {TypeBaseLayerEntryConfig} layerEntryConfig The layer entry to register.
   */
  protected registerToPanels(layerEntryConfig: TypeBaseLayerEntryConfig) {
    if ('featureInfo' in layerEntryConfig.source! && layerEntryConfig.source.featureInfo?.queryable) {
      // Register to panels that are already created.
      api.event.emit(
        getFeatureInfoPayload(EVENT_NAMES.GET_FEATURE_INFO.REGISTER, `${this.mapId}/${layerEntryConfig.layerId}`, { origin: 'layer' })
      );
      // Listen to events that request to register to panels created after the layer is created.
      api.event.on(EVENT_NAMES.GET_FEATURE_INFO.REGISTER, (payload) => {
        if (payloadIsGetFeatureInfo(payload)) {
          if ((payload.data as TypeFeatureInfoRegister).origin === 'panel')
            api.event.emit(
              getFeatureInfoPayload(EVENT_NAMES.GET_FEATURE_INFO.REGISTER, `${this.mapId}/${layerEntryConfig.layerId}`, { origin: 'layer' })
            );
        }
      });
      api.event.on(
        EVENT_NAMES.GET_FEATURE_INFO.QUERY_LAYER,
        (payload) => {
          if (payloadIsGetFeatureInfo(payload)) {
            const handlerName = payload.handlerName?.split('/');
            if (handlerName && handlerName[0] === this.mapId) {
              const { location, queryType } = payload.data as TypeFeatureInfoQuery;
              this.getFeatureInfo(location, handlerName[1], queryType).then((queryResult) => {
                api.event.emit(
                  getFeatureInfoPayload(EVENT_NAMES.GET_FEATURE_INFO.QUERY_RESULT, `${this.mapId}/${layerEntryConfig.layerId}`, queryResult)
                );
              });
            }
          }
        },
        `${this.mapId}/${layerEntryConfig.layerId}`
      );
    }
  }

  /** ***************************************************************************************************************************
   * This method create a layer group. it uses the layer initial settings of the GeoView layer configuration.
   *
   * @returns {LayerGroup} A new layer group.
   */
  private createLayerGroup(layerEntryConfig: TypeLayerEntryConfig): LayerGroup {
    const layerGroupOptions: LayerGroupOptions = {
      layers: new Collection(),
      properties: { layerEntryConfig },
    };
    if (layerEntryConfig.initialSettings?.extent !== undefined) layerGroupOptions.extent = layerEntryConfig.initialSettings?.extent;
    if (layerEntryConfig.initialSettings?.maxZoom !== undefined) layerGroupOptions.maxZoom = layerEntryConfig.initialSettings?.maxZoom;
    if (layerEntryConfig.initialSettings?.minZoom !== undefined) layerGroupOptions.minZoom = layerEntryConfig.initialSettings?.minZoom;
    if (layerEntryConfig.initialSettings?.opacity !== undefined) layerGroupOptions.opacity = layerEntryConfig.initialSettings?.opacity;
    if (layerEntryConfig.initialSettings?.visible !== undefined) layerGroupOptions.visible = layerEntryConfig.initialSettings?.visible;
    // eslint-disable-next-line no-param-reassign
    layerEntryConfig.gvLayer = new LayerGroup(layerGroupOptions);
    return layerEntryConfig.gvLayer as LayerGroup;
  }

  /** ***************************************************************************************************************************
   * Set the active layer. It is the layer that will be used in some functions when the optional layerId is undefined.
   * The parameter can be a layer identifier (string) or a layer configuration. When the parameter is a layer identifier that
   * can not be found, the active layer remain unchanged.
   *
   * @param {string | TypeLayerEntryConfig} layerId The layer identifier.
   */
  setActiveLayer(layer: string | TypeLayerEntryConfig) {
    if (typeof layer === 'string') {
      const layerConfig = this.getLayerConfig(layer);
      if (layerConfig) this.activeLayer = layerConfig;
    } else this.activeLayer = layer;
  }

  /** ***************************************************************************************************************************
   * Get the layer configuration of the specified layerId.
   *
   * @param {string} layerId The layer identifier.
   */
  getLayerConfig(layerId?: string, listOfLayerEntryConfig = this.listOfLayerEntryConfig): TypeLayerEntryConfig | null {
    if (layerId === undefined) return this.activeLayer;
    for (let i = 0; i < listOfLayerEntryConfig.length; i++) {
      if (listOfLayerEntryConfig[i].layerId === layerId) return listOfLayerEntryConfig[i];
      if (layerEntryIsGroupLayer(listOfLayerEntryConfig[i])) {
        const layerConfig = this.getLayerConfig(layerId, listOfLayerEntryConfig[i].listOfLayerEntryConfig);
        if (layerConfig) return layerConfig;
      }
    }
    return null;
  }

  /** ***************************************************************************************************************************
   * Return the extent of the layer or undefined if it will be visible regardless of extent. The layer extent is an array of
   * numbers representing an extent: [minx, miny, maxx, maxy]. If no layer identifier is specified, the activeLayer of the class
   * will be used. This routine return undefined when the layerId specified is not found or when the layerId is undefined and
   * the active layer is null.
   *
   * @param {string} layerId Optional layer identifier.
   *
   * @returns {Extent} The layer extent.
   */
  getBounds(layerId?: string): Extent | undefined {
    const layerConfig = layerId ? this.getLayerConfig(layerId) : this.activeLayer;
    return layerConfig?.gvLayer ? layerConfig.gvLayer.getExtent() : undefined;
  }

  /** ***************************************************************************************************************************
   * set the extent of the layer. Use undefined if it will be visible regardless of extent. The layer extent is an array of
   * numbers representing an extent: [minx, miny, maxx, maxy]. If no layer identifier is specified, the activeLayer of the class
   * will be used. This routine does nothing when the layerId specified is not found or when the layerId is undefined and the
   * active layer is null.
   *
   * @param {Extent} layerExtent The extent to assign to the layer.
   * @param {string} layerId Optional layer identifier.
   */
  setBounds(layerExtent: Extent, layerId?: string) {
    const layerConfig = layerId ? this.getLayerConfig(layerId) : this.activeLayer;
    if (layerConfig?.gvLayer) layerConfig.gvLayer.setExtent(layerExtent);
  }

  /** ***************************************************************************************************************************
   * Return the opacity of the layer (between 0 and 1). When no layer identifier is specified, the activeLayer of the class is
   * used. This routine return undefined when the layerId specified is not found or when the layerId is undefined and the active
   * layer is null.
   *
   * @param {string} layerId Optional layer identifier.
   *
   * @returns {number} The opacity of the layer.
   */
  getOpacity(layerId?: string): number | undefined {
    const layerConfig = layerId ? this.getLayerConfig(layerId) : this.activeLayer;
    return layerConfig?.gvLayer ? layerConfig.gvLayer.getOpacity() : undefined;
  }

  /** ***************************************************************************************************************************
   * Set the opacity of the layer (between 0 and 1). When no layer identifier is specified, the activeLayer of the class is used.
   * This routine does nothing when the layerId specified is not found or when the layerId is undefined and the active layer is
   * null.
   *
   * @param {number} layerOpacity The opacity of the layer.
   * @param {string} layerId Optional layer identifier.
   *
   */
  setOpacity(layerOpacity: number, layerId?: string) {
    const layerConfig = layerId ? this.getLayerConfig(layerId) : this.activeLayer;
    if (layerConfig?.gvLayer) layerConfig.gvLayer.setOpacity(layerOpacity);
  }

  /** ***************************************************************************************************************************
   * Return the visibility of the layer (true or false). When no layer identifier is specified, the activeLayer of the class is
   * used. This routine return undefined when the layerId specified is not found or when the layerId is undefined and the active
   * layer is null.
   *
   * @param {string} layerId Optional layer identifier.
   *
   * @returns {boolean} The visibility of the layer.
   */
  getVisible(layerId?: string): boolean | undefined {
    const layerConfig = layerId ? this.getLayerConfig(layerId) : this.activeLayer;
    return layerConfig?.gvLayer ? layerConfig.gvLayer.getVisible() : undefined;
  }

  /** ***************************************************************************************************************************
   * Set the visibility of the layer (true or false). When no layer identifier is specified, the activeLayer of the class is
   * used. This routine does nothing when the layerId specified is not found or when the layerId is undefined and the active
   * layer is null.
   *
   * @param {boolean} layerVisibility The visibility of the layer.
   * @param {string} layerId Optional layer identifier.
   */
  setVisible(layerVisibility: boolean, layerId?: string) {
    const layerConfig = layerId ? this.getLayerConfig(layerId) : this.activeLayer;
    if (layerConfig?.gvLayer) layerConfig.gvLayer.setVisible(layerVisibility);
  }

  /** ***************************************************************************************************************************
   * Return the min zoom of the layer. When no layer identifier is specified, the activeLayer of the class is used. This routine
   * return undefined when the layerId specified is not found or when the layerId is undefined and the active layer is null.
   *
   * @param {string} layerId Optional layer identifier.
   *
   * @returns {boolean} The visibility of the layer.
   */
  getMinZoom(layerId?: string): number | undefined {
    const layerConfig = layerId ? this.getLayerConfig(layerId) : this.activeLayer;
    return layerConfig?.gvLayer ? layerConfig.gvLayer.getMinZoom() : undefined;
  }

  /** ***************************************************************************************************************************
   * Set the min zoom of the layer. When no layer identifier is specified, the activeLayer of the class is used. This routine
   * does nothing when the layerId specified is not found or when the layerId is undefined and the active layer is null.
   *
   * @param {boolean} layerVisibility The visibility of the layer.
   * @param {string} layerId Optional layer identifier.
   */
  setMinZoom(minZoom: number, layerId?: string) {
    const layerConfig = layerId ? this.getLayerConfig(layerId) : this.activeLayer;
    if (layerConfig?.gvLayer) layerConfig.gvLayer.setMinZoom(minZoom);
  }

  /** ***************************************************************************************************************************
   * Return the max zoom of the layer. When no layer identifier is specified, the activeLayer of the class is used. This routine
   * return undefined when the layerId specified is not found or when the layerId is undefined and the active layer is null.
   *
   * @param {string} layerId Optional layer identifier.
   *
   * @returns {boolean} The visibility of the layer.
   */
  getMaxZoom(layerId?: string): number | undefined {
    const layerConfig = layerId ? this.getLayerConfig(layerId) : this.activeLayer;
    return layerConfig?.gvLayer ? layerConfig.gvLayer.getMaxZoom() : undefined;
  }

  /** ***************************************************************************************************************************
   * Set the max zoom of the layer. When no layer identifier is specified, the activeLayer of the class is used. This routine
   * does nothing when the layerId specified is not found or when the layerId is undefined and the active layer is null.
   *
   * @param {boolean} layerVisibility The visibility of the layer.
   * @param {string} layerId Optional layer identifier.
   */
  setMaxZoom(maxZoom: number, layerId?: string) {
    const layerConfig = layerId ? this.getLayerConfig(layerId) : this.activeLayer;
    if (layerConfig?.gvLayer) layerConfig.gvLayer.setMaxZoom(maxZoom);
  }

  /** ***************************************************************************************************************************
   * Return the legend of the layer. If no layer identifier is specified, the activeLayer of the class will be used. This routine
   * returns null when the layerId specified is not found or when the layerId is undefined and the active layer is null or the
   * configuration's style is undefined.
   *
   * @param {string} layerId Optional layer identifier.
   *
   * @returns {Promise<TypeLegend | null>} The legend of the layer.
   */
  getLegend(layerId?: string): Promise<TypeLegend | null> {
    const promisedLegend = new Promise<TypeLegend | null>((resolve) => {
      const layerConfig = (layerId ? this.getLayerConfig(layerId) : this.activeLayer) as TypeBaseLayerEntryConfig & {
        style: TypeStyleConfig;
      };
      if (!layerConfig?.style) resolve(null);
      const legend: TypeLegend = {
        type: layerConfig.geoviewRootLayer!.geoviewLayerType,
        layerId: layerConfig.layerId,
        layerName: layerConfig.layerName!,
        legend: cloneDeep(layerConfig.style),
      };
      resolve(legend);
    });
    return promisedLegend;
  }

  /** ***************************************************************************************************************************
   * Utility method use to add an entry to the outfields or aliasFields attribute of the layerEntryConfig.source.featureInfo.
   *
   * @param {TypeLayerEntryConfig} layerEntryConfig The layer entry configuration that contains the source.featureInfo.
   * @param {outfields' | 'aliasFields} fieldName The field name to update.
   * @param {string} fieldValue The value to append to the field name.
   * @param {number} prefixEntryWithComa flag (0 = false) indicating that we must prefix the entry with a ','
   */
  protected addFieldEntryToSourceFeatureInfo = (
    layerEntryConfig: TypeLayerEntryConfig,
    fieldName: 'outfields' | 'aliasFields',
    fieldValue: string,
    prefixEntryWithComa: number
  ) => {
    const layerEntrySourceConfig = layerEntryConfig.source as TypeBaseSourceVectorInitialConfig | TypeBaseSourceImageInitialConfig;
    if (prefixEntryWithComa) {
      layerEntrySourceConfig.featureInfo![fieldName]!.en = `${layerEntrySourceConfig.featureInfo![fieldName]!.en},`;
    }
    layerEntrySourceConfig.featureInfo![fieldName]!.en = `${layerEntrySourceConfig.featureInfo![fieldName]!.en}${fieldValue}`;
  };
}
