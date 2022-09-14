/* eslint-disable no-param-reassign */
import Feature from 'ol/Feature';
import { Vector as VectorSource } from 'ol/source';
import { Options as SourceOptions } from 'ol/source/Vector';
import { VectorImage as VectorLayer } from 'ol/layer';
import { Options as VectorLayerOptions } from 'ol/layer/VectorImage';
import { Geometry } from 'ol/geom';
import { all } from 'ol/loadingstrategy';
import { EsriJSON, GeoJSON, KML } from 'ol/format';
import { ReadOptions } from 'ol/format/Feature';
import BaseLayer from 'ol/layer/Base';
import { Coordinate } from 'ol/coordinate';
import LayerGroup from 'ol/layer/Group';
import { Extent } from 'ol/extent';

import { Pixel } from 'ol/pixel';
import { AbstractGeoViewLayer } from '../abstract-geoview-layers';
import {
  TypeBaseVectorLayerEntryConfig,
  TypeFeatureInfoLayerConfig,
  TypeLayerEntryConfig,
  TypeListOfLayerEntryConfig,
  TypeLocalizedString,
  TypeStyleConfig,
  TypeVectorLayerEntryConfig,
  TypeVectorTileLayerEntryConfig,
} from '../../../map/map-schema-types';
import { api } from '../../../../app';
import { snackbarMessagePayload } from '../../../../api/events/payloads/snackbar-message-payload';
import { EVENT_NAMES } from '../../../../api/events/event-types';
import { getLocalizedValue, showMessage } from '../../../../core/utils/utilities';
import {
  getFeatureInfoPayload,
  payloadIsGetFeatureInfo,
  TypeFeatureInfoEntry,
  TypeFeatureInfoQuery,
  TypeFeatureInfoRegister,
  TypeFeatureInfoResult,
  TypeQueryType,
} from '../../../../api/events/payloads/get-feature-info-payload';
import { TypeJsonObject } from '../../../../core/types/global-types';

/* *******************************************************************************************************************************
 * AbstractGeoViewVector types
 */

// Base type used to keep the layer's hierarchical structure. It is similar to ol/layer/Base~BaseLayer.
export type TypeVectorLayerGroup = LayerGroup;
export type TypeVectorLayer = VectorSource<Geometry>;
export type TypeBaseVectorLayer = BaseLayer | TypeVectorLayerGroup | TypeVectorLayer;
export type TypeVectorLegend = {
  layerId: string;
  layerName: TypeLocalizedString;
  legend: TypeStyleConfig;
};

// ******************************************************************************************************************************
// ******************************************************************************************************************************
/** ******************************************************************************************************************************
 * The AbstractGeoViewVector class is a direct descendant of AbstractGeoViewLayer. As its name indicates, it is used to
 * instanciate GeoView vector layers. It inherits from its parent class an attribute named gvLayers where the vector elements
 * of the class will be kept.
 *
 * The gvLayers attribute has a hierarchical structure. Its data type is TypetBaseVectorLayer. Subclasses of this type
 * are TypeVectorLayerGroup and TypeVectorLayer. The TypeVectorLayerGroup is a collection of TypetBaseVectorLayer. It is
 * important to note that a TypetBaseVectorLayer attribute can polymorphically refer to a TypeVectorLayerGroup or a
 * TypeVectorLayer. Here, we must not confuse instantiation and declaration of a polymorphic attribute.
 *
 * All leaves of the tree structure stored in the gvLayers attribute must be of type TypeVectorLayer. This is where the
 * features are placed and can be considered as a feature group.
 */
// ******************************************************************************************************************************
export abstract class AbstractGeoViewVector extends AbstractGeoViewLayer {
  // The service metadata.
  metadata: TypeJsonObject | null = null;

  /** Attribution used in the OpenLayer source. */
  attributions: string[] = [];

  /** ***************************************************************************************************************************
   * This method is used to create the layers specified in the listOfLayerEntryConfig attribute inherited from its parent.
   * Normally, it is the second method called in the life cycle of a GeoView layer, the first one being the constructor.
   * Its code is the same for all child classes. It must first validate that the gvLayers attribute is null indicating
   * that the method has never been called before. If this is not the case, an error message must be sent. Then, it calls the
   * abstract method getAdditionalServiceDefinition. For example, when the child is a WFS service, this method executes the
   * GetCapabilities request and saves the result in the metadata attribute of the class. It also process the layer's metadata
   * for each layer in the listOfLayerEntryConfig tree in order to define the missing pieces of the layer's configuration.
   * Layer's configuration can come from the configuration of the GeoView layer or from the information saved by the method
   * processListOfLayerEntryMetadata, priority being given to the first of the two. When the GeoView layer does not have a
   * service definition, the getAdditionalServiceDefinition method does nothing.
   *
   * Finally, the processListOfLayerEntryConfig is called to instantiate each layer identified by the listOfLayerEntryConfig
   * attribute. This method will also register the layers to all panels that offer this possibility. For example, if a layer is
   * queryable, it will subscribe to the details-panel and every time the user clicks on the map, the panel will ask the layer
   * to return the descriptive information of all the features in a tolerance radius. This information will be used to populate
   * the details-panel.
   */
  createGeoViewVectorLayers(): Promise<void> {
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
        console.log(`Can not execute twice the createGeoViewvectorLayers method for the map ${this.mapId}`);
        resolve();
      }
    });
    return promisedExecution;
  }

  /** ***************************************************************************************************************************
   * This method reads from the metadataAccessPath additional information to complete the GeoView layer configuration.
   * If the GeoView layer does not have a service definition, this method does nothing.
   */
  private getAdditionalServiceDefinition(): Promise<void> {
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
   * @returns {Promise<void>} A promise that the execution is completed.
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
   * This method processes recursively the metadata of each layer in the list of layer configuration.
   *
   *  @param {TypeListOfLayerEntryConfig} listOfLayerEntryConfig The list of layers to process.
   *
   * @returns {Promise<void>} A promise that the execution is completed.
   */
  protected abstract processListOfLayerEntryMetadata(listOfLayerEntryConfig: TypeListOfLayerEntryConfig): Promise<void>;

  /** ***************************************************************************************************************************
   * Process recursively the list of layer Entries to create the layers and the layer groups.
   *
   * @param {TypeListOfLayerEntryConfig} listOfLayerEntryConfig The list of layer entries to process.
   *
   * @returns {Promise<TypeBaseVectorLayer | null>} The promise that the layers were created.
   */
  private processListOfLayerEntryConfig(listOfLayerEntryConfig: TypeListOfLayerEntryConfig): Promise<TypeBaseVectorLayer | null> {
    const promisedListOfLayerEntryProcessed = new Promise<TypeBaseVectorLayer | null>((resolve) => {
      if (listOfLayerEntryConfig.length === 1) {
        if (listOfLayerEntryConfig[0].entryType === 'group') {
          this.processListOfLayerEntryConfig(listOfLayerEntryConfig[0].listOfLayerEntryConfig).then((groupCreated) => {
            if (groupCreated) {
              resolve(groupCreated);
            } else {
              this.layerLoadError.push(listOfLayerEntryConfig[0].layerId);
              resolve(null);
            }
          });
        } else {
          this.processOneLayerEntry(listOfLayerEntryConfig[0] as TypeBaseVectorLayerEntryConfig).then((vectorLayer) => {
            if (vectorLayer) {
              this.registerToPanels(listOfLayerEntryConfig[0] as TypeBaseVectorLayerEntryConfig);
              resolve(vectorLayer);
            } else {
              this.layerLoadError.push(listOfLayerEntryConfig[0].layerId);
              resolve(null);
            }
          });
        }
      } else {
        const promiseOfLayerCreated: Promise<TypeBaseVectorLayer | null>[] = [];
        listOfLayerEntryConfig.forEach((layerEntryConfig: TypeLayerEntryConfig) => {
          if (layerEntryConfig.entryType === 'group') {
            promiseOfLayerCreated.push(this.processListOfLayerEntryConfig(layerEntryConfig.listOfLayerEntryConfig));
          } else promiseOfLayerCreated.push(this.processOneLayerEntry(layerEntryConfig as TypeBaseVectorLayerEntryConfig));
        });
        Promise.all(promiseOfLayerCreated)
          .then((listOfLayerCreated) => {
            if (listOfLayerCreated?.length) {
              // All child of this level in the tree have the same parent, so we use the first element of the array to retrieve the parent node.
              const layerGroup = this.createLayerGroup(listOfLayerEntryConfig[0].parentLayerConfig as TypeLayerEntryConfig);

              listOfLayerCreated.forEach((vectorLayer, i) => {
                if (vectorLayer) {
                  this.registerToPanels(listOfLayerEntryConfig[i] as TypeBaseVectorLayerEntryConfig);
                  layerGroup.getLayers().push(vectorLayer as BaseLayer);
                } else {
                  this.layerLoadError.push(listOfLayerEntryConfig[i].layerId);
                }
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
   * @returns {TypeBaseVectorLayer} The GeoView vector layer that has been created.
   */
  processOneLayerEntry(layerEntryConfig: TypeBaseVectorLayerEntryConfig): Promise<TypeBaseVectorLayer | null> {
    const promisedVectorLayer = new Promise<TypeBaseVectorLayer | null>((resolve) => {
      const vectorSource = this.createVectorSource(layerEntryConfig);
      const vectorLayer = this.createVectorLayer(layerEntryConfig, vectorSource);
      resolve(vectorLayer);
    });
    return promisedVectorLayer;
  }

  /** ***************************************************************************************************************************
   * Create a source configuration for the vector layer.
   *
   * @param {TypeBaseVectorLayerEntryConfig} layerEntryConfig The layer entry configuration.
   *
   * @returns {VectorSource<Geometry>} The source configuration that will be used to create the vector layer.
   */
  private createVectorSource(layerEntryConfig: TypeBaseVectorLayerEntryConfig): VectorSource<Geometry> {
    // eslint-disable-next-line no-var
    var vectorSource: VectorSource<Geometry>;
    let readOptions: ReadOptions = {};
    const sourceOptions: SourceOptions = { strategy: all };
    if (this.attributions.length !== 0) sourceOptions.attributions = this.attributions;
    sourceOptions.url = getLocalizedValue(layerEntryConfig.source!.dataAccessPath!, this.mapId);

    if (layerEntryConfig.source!.format) {
      switch (layerEntryConfig.source!.format) {
        case 'EsriJSON': {
          sourceOptions.url = `${sourceOptions.url}/query?f=pjson&outfields=*&where=1%3D1`;
          sourceOptions.format = new EsriJSON();
          break;
        }
        case 'GeoJSON': {
          readOptions = { dataProjection: layerEntryConfig.source!.dataProjection };
          sourceOptions.format = new GeoJSON();
          break;
        }
        case 'featureAPI': {
          readOptions = { dataProjection: layerEntryConfig.source!.dataProjection };
          sourceOptions.url = `${sourceOptions.url}/collections/${layerEntryConfig.layerId}/items?f=json`;
          sourceOptions.format = new GeoJSON();
          break;
        }
        case 'KML': {
          sourceOptions.format = new KML();
          break;
        }
        case 'WFS': {
          readOptions = { dataProjection: layerEntryConfig.source!.dataProjection };
          sourceOptions.format = new GeoJSON();
          sourceOptions.url = `${sourceOptions.url}?service=WFS&request=getFeature&outputFormat=application/json&version=2.0.0&srsname=${
            layerEntryConfig.source!.dataProjection
          }&typeName=${layerEntryConfig.layerId}`;
          break;
        }
        default: {
          showMessage(this.mapId, `createVectorSource error using ${layerEntryConfig.source!.format} format.`);
          break;
        }
      }
    }

    sourceOptions.loader = (extent, resolution, projection, success, failure) => {
      const url = vectorSource.getUrl();
      const xhr = new XMLHttpRequest();
      xhr.open('GET', url as string);
      const onError = () => {
        vectorSource.removeLoadedExtent(extent);
        if (failure) failure();
      };
      xhr.onerror = onError;
      xhr.onload = () => {
        if (xhr.status === 200) {
          const features = vectorSource.getFormat()!.readFeatures(xhr.responseText, {
            ...readOptions,
            featureProjection: projection,
            extent,
          }) as Feature<Geometry>[];
          vectorSource.addFeatures(features);
          if (success) success(features);
        } else {
          onError();
        }
      };
      xhr.send();
    };

    vectorSource = new VectorSource(sourceOptions);
    return vectorSource;
  }

  /** ***************************************************************************************************************************
   * Create a vector layer. The layer has in its properties a reference to the layer entry configuration used at creation time.
   * The layer entry configuration keeps a reference to the layer in the gvLayer attribute.
   *
   * @param {TypeBaseVectorLayerEntryConfig} layerEntryConfig The layer entry configuration used by the source.
   * @param {VectorSource<Geometry>} vectorSource The source configuration for the vector layer.
   *
   * @returns {VectorLayer<VectorSource>} The vector layer created.
   */
  private createVectorLayer(
    layerEntryConfig: TypeBaseVectorLayerEntryConfig,
    vectorSource: VectorSource<Geometry>
  ): VectorLayer<VectorSource> {
    const layerOptions: VectorLayerOptions<VectorSource> = {
      properties: { layerEntryConfig },
      source: vectorSource,
      style: (feature) => {
        if ('style' in layerEntryConfig) {
          const { geoviewRenderer } = api.map(this.mapId);
          return geoviewRenderer.getStyle(feature, layerEntryConfig);
        }
        return undefined;
      },
    };

    // eslint-disable-next-line no-param-reassign
    layerEntryConfig.gvlayer = new VectorLayer(layerOptions);
    return layerEntryConfig.gvlayer as VectorLayer<VectorSource>;
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
    if (layerId) {
      const baseLayer = this.getBaseLayer(layerId);
      return baseLayer ? baseLayer.getExtent() : undefined;
    }
    return this.activeLayer ? this.activeLayer.getExtent() : undefined;
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
    if (layerId) {
      const baseLayer = this.getBaseLayer(layerId);
      if (baseLayer) baseLayer.setExtent(layerExtent);
    } else if (this.activeLayer) this.activeLayer.setExtent(layerExtent);
  }

  /** ***************************************************************************************************************************
   * Return the opacity of the layer (between 0 and 1). If no layer identifier is specified, the activeLayer of the class
   * will be used. This routine return undefined when the layerId specified is not found or when the layerId is undefined and
   * the active layer is null.
   *
   * @param {string} layerId Optional layer identifier.
   *
   * @returns {number} The opacity of the layer.
   */
  getOpacity(layerId?: string): number | undefined {
    if (layerId) {
      const baseLayer = this.getBaseLayer(layerId);
      return baseLayer ? baseLayer.getOpacity() : undefined;
    }
    return this.activeLayer ? this.activeLayer.getOpacity() : undefined;
  }

  /** ***************************************************************************************************************************
   * Set the opacity of the layer (between 0 and 1). If no layer identifier is specified, the activeLayer of the class
   * will be used. This routine does nothing when the layerId specified is not found or when the layerId is undefined and the
   * active layer is null.
   *
   * @param {number} layerOpacity The opacity of the layer.
   * @param {string} layerId Optional layer identifier.
   *
   */
  setOpacity(layerOpacity: number, layerId?: string) {
    if (layerId) {
      const baseLayer = this.getBaseLayer(layerId);
      if (baseLayer) baseLayer.setOpacity(layerOpacity);
    } else if (this.activeLayer) this.activeLayer.setOpacity(layerOpacity);
  }

  /** ***************************************************************************************************************************
   * Return the visibility of the layer (true or false). If no layer identifier is specified, the activeLayer of the class
   * will be used. This routine return undefined when the layerId specified is not found or when the layerId is undefined and
   * the active layer is null.
   *
   * @param {string} layerId Optional layer identifier.
   *
   * @returns {boolean} The visibility of the layer.
   */
  getVisible(layerId?: string): boolean | undefined {
    if (layerId) {
      const baseLayer = this.getBaseLayer(layerId);
      return baseLayer ? baseLayer.getVisible() : undefined;
    }
    return this.activeLayer ? this.activeLayer.getVisible() : undefined;
  }

  /** ***************************************************************************************************************************
   * Set the visibility of the layer (true or false). If no layer identifier is specified, the activeLayer of the class
   * will be used. This routine does nothing when the layerId specified is not found or when the layerId is undefined and the
   * active layer is null.
   *
   * @param {boolean} layerVisibility The visibility of the layer.
   * @param {string} layerId Optional layer identifier.
   */
  setVisible(layerVisibility: boolean, layerId?: string) {
    if (layerId) {
      const baseLayer = this.getBaseLayer(layerId);
      if (baseLayer) baseLayer.setVisible(layerVisibility);
    } else if (this.activeLayer) this.activeLayer.setVisible(layerVisibility);
  }

  /** ***************************************************************************************************************************
   * Return the legend of the layer. If no layer identifier is specified, the activeLayer of the class will be used. This routine
   * returns null when the layerId specified is not found or when the layerId is undefined and the active layer is null or the
   * configuration's style is undefined.
   *
   * @param {string} layerId Optional layer identifier.
   *
   * @returns {TypeVectorLegend | null} The legend of the layer.
   */
  getLegend(layerId?: string): TypeVectorLegend | null {
    let layerConfig: TypeVectorLayerEntryConfig | TypeVectorTileLayerEntryConfig | undefined;
    if (layerId) {
      const baseLayer = this.getBaseLayer(layerId);
      layerConfig = baseLayer ? baseLayer.get('layerEntryConfig') : undefined;
    } else layerConfig = this.activeLayer ? this.activeLayer.get('layerEntryConfig') : undefined;
    if (layerConfig?.style) {
      const legend: TypeVectorLegend = {
        layerId: layerConfig.layerId,
        layerName: layerConfig.layerName!,
        legend: layerConfig?.style,
      };
      return legend;
    }
    return null;
  }

  private formatFeatureInfoResult(features: Feature<Geometry>[], featureInfo?: TypeFeatureInfoLayerConfig): TypeFeatureInfoResult {
    if (!features.length) return null;
    const outfields = getLocalizedValue(featureInfo?.outfields, this.mapId)?.split(',');
    const queryResult: TypeFeatureInfoResult = [];
    features.forEach((feature) => {
      const featureFields = feature.getKeys();
      const featureInfoEntry: TypeFeatureInfoEntry = {};
      featureFields.forEach((fieldName) => {
        if (!outfields || outfields.includes(fieldName)) featureInfoEntry[fieldName] = feature.get(fieldName);
      });
      queryResult.push(featureInfoEntry);
    });
    return queryResult;
  }

  /** ***************************************************************************************************************************
   * Return feature information for all the features stored in the layer.
   *
   * @param {string} layerId Optional layer identifier. If undefined, this.activeLayer is used.
   *
   * @returns {TypeFeatureInfoResult} The feature info table.
   */
  getAllFeatureInfo(layerId?: string): TypeFeatureInfoResult {
    const layer = (layerId ? this.getBaseLayer(layerId) : this.activeLayer) as VectorLayer<VectorSource>;
    if (!layer) return null;
    return this.formatFeatureInfoResult(
      layer.getSource()!.getFeatures(),
      (layer?.get('layerEntryConfig') as TypeBaseVectorLayerEntryConfig).source?.featureInfo
    );
  }

  /** ***************************************************************************************************************************
   * Return feature information for all the features stored in the layer.
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
      let layer: BaseLayer | null = null;
      switch (queryType) {
        case 'at pixel':
          layer = layerId ? this.getBaseLayer(layerId) : this.activeLayer;
          if (!layer) resolve(null);
          (layer as VectorLayer<VectorSource>).getFeatures(location as Pixel).then((features) => {
            resolve(
              this.formatFeatureInfoResult(features, (layer?.get('layerEntryConfig') as TypeBaseVectorLayerEntryConfig).source?.featureInfo)
            );
          });
          break;
        case 'at coordinate':
          layer = layerId ? this.getBaseLayer(layerId) : this.activeLayer;
          if (!layer) resolve(null);
          (layer as VectorLayer<VectorSource>)
            .getFeatures(api.map(this.mapId).map.getPixelFromCoordinate(location as Coordinate))
            .then((features) => {
              resolve(
                this.formatFeatureInfoResult(
                  features,
                  (layer?.get('layerEntryConfig') as TypeBaseVectorLayerEntryConfig).source?.featureInfo
                )
              );
            });
          break;
        case 'using a bounding box':
          // eslint-disable-next-line no-console
          console.log('Queries using bounding box are not implemented.');
          resolve(null);
          break;
        case 'using a polygon':
          // eslint-disable-next-line no-console
          console.log('Queries using polygon are not implemented.');
          resolve(null);
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
   * This method register the GeoView layer to panels that offer this possibility.
   *
   * @param {TypeBaseVectorLayerEntryConfig} layerEntryConfig The layer entry to register.
   */
  protected registerToPanels(layerEntryConfig: TypeBaseVectorLayerEntryConfig) {
    if (layerEntryConfig.source?.featureInfo?.queryable) {
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
   * Utility method use to add an entry to the outfields or aliasFields attribute of the layerEntryConfig.source.featureInfo.
   *
   * @param {TypeVectorLayerEntryConfig} layerEntryConfig The layer entry configuration that contains the source.featureInfo.
   * @param {outfields' | 'aliasFields} fieldName The field name to update.
   * @param {string} fieldValue The value to append to the field name.
   * @param {number} prefixEntryWithComa flag (0 = false) indicating that we must prefix the entry with a ','
   */
  protected addFieldEntryToSourceFeatureInfo = (
    layerEntryConfig: TypeVectorLayerEntryConfig,
    fieldName: 'outfields' | 'aliasFields',
    fieldValue: string,
    prefixEntryWithComa: number
  ) => {
    if (prefixEntryWithComa) {
      layerEntryConfig.source!.featureInfo![fieldName]!.en = `${layerEntryConfig.source!.featureInfo![fieldName]!.en},`;
    }
    layerEntryConfig.source!.featureInfo![fieldName]!.en = `${layerEntryConfig.source!.featureInfo![fieldName]!.en}${fieldValue}`;
  };
}
