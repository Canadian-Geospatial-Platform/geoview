/* eslint-disable no-param-reassign */
import { EventTypes } from 'ol/Observable';
import { indexOf } from 'lodash';
import { GeoCore, layerConfigIsGeoCore } from './other/geocore';
import { Vector } from './vector/vector';

import { api } from '@/app';
import { EVENT_NAMES } from '@/api/events/event-types';

import { Config } from '@/core/utils/config/config';
import { generateId } from '@/core/utils/utilities';
import {
  layerConfigPayload,
  payloadIsALayerConfig,
  GeoViewLayerPayload,
  payloadIsRemoveGeoViewLayer,
  snackbarMessagePayload,
  PayloadBaseClass,
  PayloadBaseClass,
} from '@/api/events/payloads';
import { AbstractGeoViewLayer } from './geoview-layers/abstract-geoview-layers';
import {
  TypeBaseLayerEntryConfig,
  TypeGeoviewLayerConfig,
  TypeLayerEntryConfig,
  TypeLayerGroupEntryConfig,
  TypeListOfLayerEntryConfig,
  TypeListOfLocalizedLanguages,
} from '../map/map-schema-types';
import { GeoJSON, layerConfigIsGeoJSON } from './geoview-layers/vector/geojson';
import { GeoPackage, layerConfigIsGeoPackage } from './geoview-layers/vector/geopackage';
import { layerConfigIsWMS, WMS } from './geoview-layers/raster/wms';
import { EsriDynamic, layerConfigIsEsriDynamic } from './geoview-layers/raster/esri-dynamic';
import { EsriFeature, layerConfigIsEsriFeature } from './geoview-layers/vector/esri-feature';
import { ImageStatic, layerConfigIsImageStatic } from './geoview-layers/raster/image-static';
import { layerConfigIsWFS, WFS } from './geoview-layers/vector/wfs';
import { layerConfigIsOgcFeature, OgcFeature } from './geoview-layers/vector/ogc-feature';
import { layerConfigIsXYZTiles, XYZTiles } from './geoview-layers/raster/xyz-tiles';
import { layerConfigIsVectorTiles, VectorTiles } from './geoview-layers/raster/vector-tiles';

type TypeEventHandlerFunctions = {
  addLayer: (payload: PayloadBaseClass) => void;
  removeLayer: (payload: PayloadBaseClass) => void;
};

/**
 * A class to get the layer from layer type. Layer type can be esriFeature, esriDynamic and ogcWMS
 *
 * @exports
 * @class Layer
 */
export class Layer {
  /** Layers with valid configuration for this map. */
  registeredLayers: { [layerEntryConfigId: string]: TypeLayerEntryConfig } = {};

  // variable used to store all added geoview layers
  geoviewLayers: { [geoviewLayerId: string]: AbstractGeoViewLayer } = {};

  // used to access vector API to create and manage geometries
  vector: Vector | undefined;

  // order to load layers
  layerOrder: string[] = [];

  /** used to reference the map id */
  private mapId: string;

  /** used to keep a reference the Layer's event handler functions */
  private eventHandlerFunctions: TypeEventHandlerFunctions;

  /**
   * Initialize layer types and listen to add/remove layer events from outside
   *
   * @param {string} mapId a reference to the map
   */
  constructor(mapId: string) {
    this.mapId = mapId;

    this.vector = new Vector(this.mapId);

    this.eventHandlerFunctions = {
      addLayer: (payload: PayloadBaseClass) => {
        if (payloadIsALayerConfig(payload)) {
          const { layerConfig } = payload;

          if (layerConfigIsGeoCore(layerConfig)) {
            const geoCore = new GeoCore(this.mapId);
            geoCore.createLayers(layerConfig).then((arrayOfListOfGeoviewLayerConfig) => {
              arrayOfListOfGeoviewLayerConfig.forEach((listOfGeoviewLayerConfig) => {
                listOfGeoviewLayerConfig.forEach((geoviewLayerConfig) => {
                  this.addGeoviewLayer(geoviewLayerConfig);
                });
              });
            });
          } else if (layerConfigIsGeoJSON(layerConfig)) {
            const geoJSON = new GeoJSON(this.mapId, layerConfig);
            geoJSON.createGeoViewLayers().then(() => {
              this.addToMap(geoJSON);
            });
          } else if (layerConfigIsGeoPackage(layerConfig)) {
            const geoPackage = new GeoPackage(this.mapId, layerConfig);
            geoPackage.createGeoViewLayers().then(() => {
              this.addToMap(geoPackage);
            });
          } else if (layerConfigIsWMS(layerConfig)) {
            const wmsLayer = new WMS(this.mapId, layerConfig);
            wmsLayer.createGeoViewLayers().then(() => {
              this.addToMap(wmsLayer);
            });
          } else if (layerConfigIsEsriDynamic(layerConfig)) {
            const esriDynamic = new EsriDynamic(this.mapId, layerConfig);
            esriDynamic.createGeoViewLayers().then(() => {
              this.addToMap(esriDynamic);
            });
          } else if (layerConfigIsEsriFeature(layerConfig)) {
            const esriFeature = new EsriFeature(this.mapId, layerConfig);
            esriFeature.createGeoViewLayers().then(() => {
              this.addToMap(esriFeature);
            });
          } else if (layerConfigIsImageStatic(layerConfig)) {
            const imageStatic = new ImageStatic(this.mapId, layerConfig);
            imageStatic.createGeoViewLayers().then(() => {
              this.addToMap(imageStatic);
            });
          } else if (layerConfigIsWFS(layerConfig)) {
            const wfsLayer = new WFS(this.mapId, layerConfig);
            wfsLayer.createGeoViewLayers().then(() => {
              this.addToMap(wfsLayer);
            });
          } else if (layerConfigIsOgcFeature(layerConfig)) {
            const ogcFeatureLayer = new OgcFeature(this.mapId, layerConfig);
            ogcFeatureLayer.createGeoViewLayers().then(() => {
              this.addToMap(ogcFeatureLayer);
            });
          } else if (layerConfigIsXYZTiles(layerConfig)) {
            const xyzTiles = new XYZTiles(this.mapId, layerConfig);
            xyzTiles.createGeoViewLayers().then(() => {
              this.addToMap(xyzTiles);
            });
          } else if (layerConfigIsVectorTiles(layerConfig)) {
            const vectorTiles = new VectorTiles(this.mapId, layerConfig);
            vectorTiles.createGeoViewLayers().then(() => {
              this.addToMap(vectorTiles);
            });
          }
        }
      },
      removeLayer: (payload: PayloadBaseClass) => {
        if (payloadIsRemoveGeoViewLayer(payload)) {
          // remove layer from outside
          this.removeLayersUsingPath(payload.geoviewLayer!.geoviewLayerId);
        }
      },
    };

    // listen to outside events to add layers
    api.event.on(EVENT_NAMES.LAYER.EVENT_ADD_LAYER, this.eventHandlerFunctions.addLayer, this.mapId);

    // listen to outside events to remove layers
    api.event.on(EVENT_NAMES.LAYER.EVENT_REMOVE_LAYER, this.eventHandlerFunctions.removeLayer, this.mapId);
  }

  /**
   * Delete the event handler functions associated to the Layer instance.
   */
  deleteEventHandlerFunctionsOfThisLayerInstance() {
    api.event.off(EVENT_NAMES.LAYER.EVENT_ADD_LAYER, this.mapId, this.eventHandlerFunctions!.addLayer);
    api.event.off(EVENT_NAMES.LAYER.EVENT_REMOVE_LAYER, this.mapId, this.eventHandlerFunctions.removeLayer);
  }

  /**
   * Load layers that was passed in with the map config
   *
   * @param {TypeGeoviewLayerConfig[]} geoviewLayerConfigs an optional array containing layers passed within the map config
   */
  loadListOfGeoviewLayer(geoviewLayerConfigs?: TypeGeoviewLayerConfig[]) {
    const validGeoviewLayerConfigs = this.deleteDuplicatGeoviewLayerConfig(geoviewLayerConfigs);

    // set order for layers to appear on the map according to config
    this.layerOrder = [];
    validGeoviewLayerConfigs.forEach((geoviewLayerConfig) => {
      if (geoviewLayerConfig.geoviewLayerId) {
        // layer order reversed so highest index is top layer
        this.layerOrder.unshift(geoviewLayerConfig.geoviewLayerId);
        // layers without id uses sublayer ids
      } else if (geoviewLayerConfig.listOfLayerEntryConfig !== undefined) {
        geoviewLayerConfig.listOfLayerEntryConfig.forEach((subLayer) => {
          if (subLayer.layerId) this.layerOrder.unshift(subLayer.layerId);
        });
      }
      api.event.emit(layerConfigPayload(EVENT_NAMES.LAYER.EVENT_ADD_LAYER, this.mapId, geoviewLayerConfig));
    });
  }

  /**
   * Validate the geoview layer configuration array to eliminate duplicate entries and inform the user.
   * @param {TypeGeoviewLayerConfig[]} geoviewLayerConfigs The geoview layer configurations to validate.
   *
   * @returns {TypeGeoviewLayerConfig} The new configuration with duplicate entries eliminated.
   */
  private deleteDuplicatGeoviewLayerConfig(geoviewLayerConfigs?: TypeGeoviewLayerConfig[]): TypeGeoviewLayerConfig[] {
    if (geoviewLayerConfigs && geoviewLayerConfigs.length > 0) {
      const validGeoviewLayerConfigs = geoviewLayerConfigs.filter((geoviewLayerConfigToCreate, configToCreateIndex) => {
        for (let configToTestIndex = 0; configToTestIndex < geoviewLayerConfigs.length; configToTestIndex++)
          if (
            geoviewLayerConfigToCreate.geoviewLayerId === geoviewLayerConfigs[configToTestIndex].geoviewLayerId &&
            // We keep the first instance of the duplicat entry.
            configToCreateIndex > configToTestIndex
          ) {
            this.printDuplicateGeoviewLayerConfigError(geoviewLayerConfigToCreate);
            return false;
          }
        return true;
      });
      return validGeoviewLayerConfigs;
    }
    return [];
  }

  /**
   * Print an error message for the duplicate geoview layer configuration.
   * @param {TypeGeoviewLayerConfig} geoviewLayerConfig The geoview layer configuration in error.
   */
  private printDuplicateGeoviewLayerConfigError(geoviewLayerConfig: TypeGeoviewLayerConfig) {
    api.event.emit(
      snackbarMessagePayload(EVENT_NAMES.SNACKBAR.EVENT_SNACKBAR_OPEN, this.mapId, {
        type: 'key',
        value: 'validation.layer.usedtwice',
        params: [geoviewLayerConfig.geoviewLayerId, this.mapId],
      })
    );
    // eslint-disable-next-line no-console
    console.log(`Duplicate use of geoview layer identifier ${geoviewLayerConfig.geoviewLayerId} on map ${this.mapId}`);
  }

  /**
   * Get the layer Path of the layer configuration parameter.
   * @param {TypeLayerEntryConfig} layerEntryConfig The layer configuration for wich we want to get the layer path.
   * @param {string} layerPath Internal parameter used to build the layer path (should not be used by the user).
   *
   * @returns {string} Returns the layer path.
   */
  static getLayerPath(layerEntryConfig: TypeLayerEntryConfig, layerPath?: string): string {
    let pathEnding = layerPath;
    if (pathEnding === undefined)
      pathEnding =
        layerEntryConfig.layerPathEnding === undefined
          ? layerEntryConfig.layerId
          : `${layerEntryConfig.layerId}.${layerEntryConfig.layerPathEnding}`;
    if (layerEntryConfig.geoviewRootLayer === layerEntryConfig.parentLayerConfig)
      return `${layerEntryConfig.geoviewRootLayer!.geoviewLayerId!}/${pathEnding}`;
    return this.getLayerPath(
      layerEntryConfig.parentLayerConfig as TypeLayerGroupEntryConfig,
      `${(layerEntryConfig.parentLayerConfig as TypeLayerGroupEntryConfig).layerId}/${pathEnding}`
    );
  }

  /**
   * Register the layer identifier. Duplicate identifier are not allowed.
   * @param {TypeLayerEntryConfig} layerEntryConfig The layer configuration to register.
   *
   * @returns {boolean} Returns false if the layer configuration can't be registered.
   */
  registerLayerConfig(layerEntryConfig: TypeLayerEntryConfig): boolean {
    const layerPath = Layer.getLayerPath(layerEntryConfig);
    if (this.registeredLayers[layerPath]) return false;
    this.registeredLayers[layerPath] = layerEntryConfig;
    (this.registeredLayers[layerPath] as TypeBaseLayerEntryConfig).layerStatus = 'newInstance';
    return true;
  }

  /**
   * Method used to verify if a layer is registered. Returns true if registered.
   * @param {TypeLayerEntryConfig} layerEntryConfig The layer configuration to test.
   *
   * @returns {boolean} Returns true if the layer configuration is registered.
   */
  isRegistered(layerEntryConfig: TypeLayerEntryConfig): boolean {
    const layerPath = Layer.getLayerPath(layerEntryConfig);
    return this.registeredLayers[layerPath] !== undefined;
  }

  /**
   * Add the layer to the map if valid. If not (is a string) emit an error
   * @param {any} geoviewLayer the layer config
   */
  private addToMap(geoviewLayer: AbstractGeoViewLayer): void {
    // if the returned layer object has something in the layerLoadError, it is because an error was detected
    // do not add the layer to the map
    if (geoviewLayer.layerLoadError.length !== 0) {
      geoviewLayer.layerLoadError.forEach((loadError) => {
        const { layer, consoleMessage } = loadError;
        api.event.emit(
          snackbarMessagePayload(EVENT_NAMES.SNACKBAR.EVENT_SNACKBAR_OPEN, this.mapId, {
            type: 'key',
            value: 'validation.layer.loadfailed',
            params: [layer, this.mapId],
          })
        );
        // eslint-disable-next-line no-console
        console.log(consoleMessage);
      });
    }

    if (geoviewLayer.allLayerEntryConfigAreInError())
      // an empty geoview layer is created
      api.event.emit(GeoViewLayerPayload.createGeoviewLayerAddedPayload(`${this.mapId}/${geoviewLayer.geoviewLayerId}`, geoviewLayer));
    else {
      geoviewLayer.gvLayers?.once('prerender' as EventTypes, () => {
        if (geoviewLayer.layerPhase !== 'processed') {
          geoviewLayer.layerPhase = 'processed';
          api.event.emit(GeoViewLayerPayload.createGeoviewLayerAddedPayload(`${this.mapId}/${geoviewLayer.geoviewLayerId}`, geoviewLayer));
        }
      });
      geoviewLayer.gvLayers?.once('change' as EventTypes, () => {
        if (geoviewLayer.layerPhase !== 'processed') {
          geoviewLayer.layerPhase = 'processed';
          api.event.emit(GeoViewLayerPayload.createGeoviewLayerAddedPayload(`${this.mapId}/${geoviewLayer.geoviewLayerId}`, geoviewLayer));
        }
      });
      api.maps[this.mapId].map.addLayer(geoviewLayer.gvLayers!);
    }
  }

  /**
   * Remove a layer from the map using its layer path. The path may point to the root geoview layer
   * or a sub layer.
   *
   * @param {string} partialLayerPath the path of the layer to be removed
   */
  removeLayersUsingPath = (partialLayerPath: string): void => {
    // A layer path is a slash seperated string made of the GeoView layer Id followed by the layer Ids
    const partialLayerPathNodes = partialLayerPath.split('/');

    // initialize these two constant now because we will delete the information use to get their values.
    const indexToDelete = this.registeredLayers[partialLayerPath]
      ? this.registeredLayers[partialLayerPath].parentLayerConfig?.listOfLayerEntryConfig.findIndex(
          (layerEntryConfig) => layerEntryConfig === this.registeredLayers?.[partialLayerPath]
        )
      : undefined;
    const listOfLayerEntryConfigAffected = this.registeredLayers[partialLayerPath]?.parentLayerConfig?.listOfLayerEntryConfig;

    Object.keys(this.registeredLayers).forEach((completeLayerPath) => {
      const completeLayerPathNodes = completeLayerPath.split('/');
      const pathBeginningAreEqual = partialLayerPathNodes.reduce<boolean>((areEqual, partialLayerPathNode, nodeIndex) => {
        return areEqual && partialLayerPathNode === completeLayerPathNodes[nodeIndex];
      }, true);
      if (pathBeginningAreEqual) {
        const layerEntryConfigToRemove = this.registeredLayers[completeLayerPath];
        layerEntryConfigToRemove.gvLayer?.dispose();
        if (layerEntryConfigToRemove.entryType !== 'group')
          this.geoviewLayers[partialLayerPathNodes[0]].unregisterFromLayerSets(layerEntryConfigToRemove as TypeBaseLayerEntryConfig);
        delete this.registeredLayers[completeLayerPath];
      }
    });
    if (listOfLayerEntryConfigAffected) listOfLayerEntryConfigAffected.splice(indexToDelete!, 1);

    if (this.geoviewLayers[partialLayerPath]) {
      this.geoviewLayers[partialLayerPath].gvLayers!.dispose();
      delete this.geoviewLayers[partialLayerPath];
      const { mapFeaturesConfig } = api.maps[this.mapId];
      if (mapFeaturesConfig.map.listOfGeoviewLayerConfig)
        mapFeaturesConfig.map.listOfGeoviewLayerConfig = mapFeaturesConfig.map.listOfGeoviewLayerConfig.filter(
          (geoviewLayerConfig) => geoviewLayerConfig.geoviewLayerId !== partialLayerPath
        );
    }
  };

  /**
   * Add a layer to the map
   *
   * @param {TypeGeoviewLayerConfig} geoviewLayerConfig the geoview layer configuration to add
   * @param {TypeListOfLocalizedLanguages} optionalSuportedLanguages an optional list of supported language
   */
  addGeoviewLayer = (geoviewLayerConfig: TypeGeoviewLayerConfig, optionalSuportedLanguages?: TypeListOfLocalizedLanguages): string => {
    // eslint-disable-next-line no-param-reassign
    geoviewLayerConfig.geoviewLayerId = generateId(geoviewLayerConfig.geoviewLayerId);
    // create a new config object for this map element
    const config = new Config(api.maps[this.mapId].map.getTargetElement());

    const suportedLanguages = optionalSuportedLanguages || config.configValidation.defaultMapFeaturesConfig.suportedLanguages;
    config.configValidation.validateListOfGeoviewLayerConfig(suportedLanguages, [geoviewLayerConfig]);

    if (geoviewLayerConfig.geoviewLayerId in api.maps[this.mapId].layer.geoviewLayers)
      this.printDuplicateGeoviewLayerConfigError(geoviewLayerConfig);
    else {
      api.maps[this.mapId].mapFeaturesConfig.map.listOfGeoviewLayerConfig!.push(geoviewLayerConfig);
      api.maps[this.mapId].setLayerAddedListener4ThisListOfLayer([geoviewLayerConfig]);
      api.event.emit(layerConfigPayload(EVENT_NAMES.LAYER.EVENT_ADD_LAYER, this.mapId, geoviewLayerConfig));
    }

    return geoviewLayerConfig.geoviewLayerId;
  };

  /**
   * Remove a geoview layer from the map
   *
   * @param {TypeGeoviewLayerConfig} geoviewLayer the layer configuration to remove
   */
  removeGeoviewLayer = (geoviewLayer: AbstractGeoViewLayer): string => {
    this.layerOrder.splice(indexOf(api.maps[this.mapId].layer.layerOrder, geoviewLayer.geoviewLayerId), 1);
    api.event.emit(GeoViewLayerPayload.createRemoveGeoviewLayerPayload(this.mapId, geoviewLayer));

    return geoviewLayer.geoviewLayerId;
  };

  /**
   * Remove all geoview layers from the map
   */
  removeAllGeoviewLayers = () => {
    Object.keys(this.geoviewLayers).forEach((geoviewLayerId: string) => {
      this.removeGeoviewLayer(this.geoviewLayers[geoviewLayerId]);
    });

    return this.mapId;
  };

  /**
   * Search for a layer using it's id and return the layer data
   *
   * @param {string} geoviewLayerId the layer id to look for
   * @returns the found layer data object
   */
  getGeoviewLayerById = (geoviewLayerId: string): AbstractGeoViewLayer | null => {
    return this.geoviewLayers?.[geoviewLayerId] || null;
  };

  /**
   * Function used to order the sublayers based on their position in the config.
   *
   * @param {TypeListOfLayerEntryConfig} listOfLayerConfig List of layer configs to order
   */
  orderSubLayers(listOfLayerConfig: TypeListOfLayerEntryConfig): string[] {
    const layers: string[] = [];
    listOfLayerConfig.forEach((layer) => {
      if (layer.layerId) {
        layers.unshift(layer.layerId);
      } else if (layer.listOfLayerEntryConfig !== undefined) {
        layers.unshift(...this.orderSubLayers(layer.listOfLayerEntryConfig));
      }
    });
    return layers;
  }

  /**
   * Set Z index for layer and it's sublayers
   *
   * @param {AbstractGeoViewLayer} geoviewLayer layer to set Z index for
   */
  setLayerZIndices = (geoviewLayer: AbstractGeoViewLayer) => {
    const zIndex =
      this.layerOrder.indexOf(geoviewLayer.geoviewLayerId) !== -1 ? this.layerOrder.indexOf(geoviewLayer.geoviewLayerId) * 100 : 0;
    geoviewLayer.gvLayers!.setZIndex(zIndex);
    geoviewLayer.listOfLayerEntryConfig.forEach((subLayer) => {
      const subLayerZIndex =
        geoviewLayer.layerOrder.indexOf(subLayer.layerId) !== -1 ? geoviewLayer.layerOrder.indexOf(subLayer.layerId) : 0;
      subLayer.gvLayer?.setZIndex(subLayerZIndex + zIndex);
      const unclusteredLayer =
        api.maps[this.mapId].layer.registeredLayers[`${geoviewLayer.geoviewLayerId}/${subLayer.layerId}-unclustered`];
      if (unclusteredLayer) {
        unclusteredLayer.gvLayer?.setZIndex(subLayerZIndex + zIndex);
      }
    });
  };

  /**
   * Move layer to new spot.
   *
   * @param {string} layerId ID of layer to be moved
   * @param {number} destination index that layer is to move to
   * @param {string} parentLayerId ID of parent layer if layer is a sublayer
   */
  moveLayer = (layerId: string, destination: number, parentLayerId?: string) => {
    const orderOfLayers: string[] = parentLayerId
      ? api.maps[this.mapId].layer.getGeoviewLayerById(parentLayerId)!.layerOrder
      : this.layerOrder;
    orderOfLayers.reverse(); // layer order in legend is reversed from layerOrder
    const location = orderOfLayers.indexOf(layerId);
    const [removed] = orderOfLayers.splice(location, 1);
    orderOfLayers.splice(destination, 0, removed);
    orderOfLayers.reverse();

    if (!parentLayerId) {
      orderOfLayers.forEach((movedLayerId) => {
        const movedLayer = api.maps[this.mapId].layer.getGeoviewLayerById(movedLayerId);
        if (movedLayer) this.setLayerZIndices(movedLayer);
      });
    } else {
      const parentLayer = api.maps[this.mapId].layer.getGeoviewLayerById(parentLayerId);
      if (parentLayer) this.setLayerZIndices(parentLayer);
    }
  };
}
