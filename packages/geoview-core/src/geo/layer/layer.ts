import BaseLayer from 'ol/layer/Base';
import LayerGroup from 'ol/layer/Group';
import { GeoCore } from '@/geo/layer/other/geocore';
import { GeometryApi } from '@/geo/layer/geometry/geometry';
import { FeatureHighlight } from '@/geo/utils/feature-highlight';

import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';

import { Config } from '@/core/utils/config/config';
import { generateId, showError, replaceParams, getLocalizedMessage, whenThisThen } from '@/core/utils/utilities';
import { MapConfigLayerEntry, MapViewer, TypeListOfGeoviewLayerConfig, TypeOrderedLayerInfo } from '@/core/types/cgpv-types';
import { ConfigBaseClass, LayerStatusChangedEvent } from '@/core/utils/config/validation-classes/config-base-class';
import { logger } from '@/core/utils/logger';
import { AbstractGeoViewLayer, GeoViewLayerRegistrationEvent } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import {
  TypeGeoviewLayerConfig,
  TypeLayerEntryConfig,
  TypeListOfLocalizedLanguages,
  layerEntryIsGroupLayer,
  mapConfigLayerEntryIsGeoCore,
} from '@/geo/map/map-schema-types';
import { GeoJSON, layerConfigIsGeoJSON } from '@/geo/layer/geoview-layers/vector/geojson';
import { GeoPackage, layerConfigIsGeoPackage } from '@/geo/layer/geoview-layers/vector/geopackage';
import { layerConfigIsWMS, WMS } from '@/geo/layer/geoview-layers/raster/wms';
import { EsriDynamic, layerConfigIsEsriDynamic } from '@/geo/layer/geoview-layers/raster/esri-dynamic';
import { EsriFeature, layerConfigIsEsriFeature } from '@/geo/layer/geoview-layers/vector/esri-feature';
import { EsriImage, layerConfigIsEsriImage } from '@/geo/layer/geoview-layers/raster/esri-image';
import { ImageStatic, layerConfigIsImageStatic } from '@/geo/layer/geoview-layers/raster/image-static';
import { layerConfigIsWFS, WFS } from '@/geo/layer/geoview-layers/vector/wfs';
import { layerConfigIsOgcFeature, OgcFeature } from '@/geo/layer/geoview-layers/vector/ogc-feature';
import { layerConfigIsXYZTiles, XYZTiles } from '@/geo/layer/geoview-layers/raster/xyz-tiles';
import { layerConfigIsVectorTiles, VectorTiles } from '@/geo/layer/geoview-layers/raster/vector-tiles';
import { CSV, layerConfigIsCSV } from '@/geo/layer/geoview-layers/vector/csv';

import { HoverFeatureInfoLayerSet } from '../utils/hover-feature-info-layer-set';
import { AllFeatureInfoLayerSet } from '../utils/all-feature-info-layer-set';
import { LegendsLayerSet } from '../utils/legends-layer-set';
import { FeatureInfoLayerSet } from '../utils/feature-info-layer-set';
import { LayerSet } from '../utils/layer-set';
import EventHelper, { EventDelegateBase } from '@/api/events/event-helper';
import { AbstractBaseLayerEntryConfig } from '@/core/utils/config/validation-classes/abstract-base-layer-entry-config';
import { GroupLayerEntryConfig } from '@/core/utils/config/validation-classes/group-layer-entry-config';

export type TypeRegisteredLayers = { [layerPath: string]: TypeLayerEntryConfig };

export type GeoViewLayerAddedResult = {
  layer: AbstractGeoViewLayer;
  promiseLayer: Promise<void>;
};

/**
 * A class to get the layer from layer type. Layer type can be esriFeature, esriDynamic and ogcWMS
 *
 * @exports
 * @class LayerApi
 */
export class LayerApi {
  /** Layers with valid configuration for this map. */
  registeredLayers: TypeRegisteredLayers = {};

  // variable used to store all added geoview layers
  geoviewLayers: { [geoviewLayerId: string]: AbstractGeoViewLayer } = {};

  // used to access geometry API to create and manage geometries
  geometry: GeometryApi;

  // order to load layers
  initialLayerOrder: Array<TypeOrderedLayerInfo> = [];

  /** used to reference the map viewer */
  mapViewer: MapViewer;

  get mapId(): string {
    return this.mapViewer.mapId;
  }

  /** used to keep a reference of highlighted layer */
  private highlightedLayer: { layerPath?: string; originalOpacity?: number } = {
    layerPath: undefined,
    originalOpacity: undefined,
  };

  // used to access feature and bounding box highlighting
  featureHighlight: FeatureHighlight;

  // Legends layer set associated to the map
  legendsLayerSet: LegendsLayerSet;

  // Hover feature info layer set associated to the map
  hoverFeatureInfoLayerSet: HoverFeatureInfoLayerSet;

  // All feature info layer set associated to the map
  allFeatureInfoLayerSet: AllFeatureInfoLayerSet;

  // Feature info layer set associated to the map
  featureInfoLayerSet: FeatureInfoLayerSet;

  // Keep all callback delegates references
  #onLayerAddedHandlers: LayerAddedDelegate[] = [];

  /**
   * Initializes layer types and listen to add/remove layer events from outside
   * @param {MapViewer} mapViewer a reference to the map viewer
   */
  constructor(mapViewer: MapViewer) {
    this.mapViewer = mapViewer;
    this.legendsLayerSet = new LegendsLayerSet(this);
    this.hoverFeatureInfoLayerSet = new HoverFeatureInfoLayerSet(this);
    this.allFeatureInfoLayerSet = new AllFeatureInfoLayerSet(this);
    this.featureInfoLayerSet = new FeatureInfoLayerSet(this);

    this.geometry = new GeometryApi(this.mapId);
    this.featureHighlight = new FeatureHighlight(this.mapId);
  }

  /**
   * Generate an array of layer info for the orderedLayerList.
   * @param {TypeGeoviewLayerConfig} geoviewLayerConfig The config to get the info from.
   * @returns {TypeOrderedLayerInfo[]} The array of ordered layer info.
   */
  generateArrayOfLayerOrderInfo(geoviewLayerConfig: TypeGeoviewLayerConfig | TypeLayerEntryConfig): TypeOrderedLayerInfo[] {
    const newOrderedLayerInfos: TypeOrderedLayerInfo[] = [];

    const addSubLayerPathToLayerOrder = (layerConfig: AbstractBaseLayerEntryConfig | TypeGeoviewLayerConfig, layerPath: string): void => {
      // GV: In very rare cases (~ 0.0001%), the complete layerPath ends with layerId.layerIdExtension and
      // GV: TypeGeoviewLayerConfig doesn't have a layerPath.
      let subLayerPath: string;
      if ('geoviewLayerId' in layerConfig) subLayerPath = layerPath;
      else {
        const layerEntryConfig = layerConfig as AbstractBaseLayerEntryConfig;
        const completeLayerId = layerEntryConfig.layerIdExtension
          ? `${layerEntryConfig.layerId}.${layerEntryConfig.layerIdExtension}`
          : layerEntryConfig.layerId;
        subLayerPath = layerPath.endsWith(completeLayerId) ? layerPath : `${layerPath}/${completeLayerId}`;
      }
      const layerInfo: TypeOrderedLayerInfo = {
        layerPath: subLayerPath,
        visible: layerConfig.initialSettings?.states?.visible !== false,
        queryable:
          (layerConfig as AbstractBaseLayerEntryConfig).source?.featureInfo?.queryable !== undefined
            ? (layerConfig as AbstractBaseLayerEntryConfig).source?.featureInfo?.queryable
            : true,
        hoverable: layerConfig.initialSettings?.states?.hoverable !== undefined ? layerConfig.initialSettings?.states?.hoverable : true,
      };
      newOrderedLayerInfos.push(layerInfo);
      if (layerEntryIsGroupLayer(layerConfig as AbstractBaseLayerEntryConfig)) {
        (layerConfig as GroupLayerEntryConfig).listOfLayerEntryConfig?.forEach((subLayerEntryConfig) => {
          addSubLayerPathToLayerOrder(subLayerEntryConfig as AbstractBaseLayerEntryConfig, subLayerPath);
        });
      }
    };

    if ('geoviewLayerId' in geoviewLayerConfig) {
      const castedGeoviewLayerConfig = geoviewLayerConfig as TypeGeoviewLayerConfig;
      if (castedGeoviewLayerConfig.listOfLayerEntryConfig.length > 1) {
        const layerPath = `${castedGeoviewLayerConfig.geoviewLayerId}/${castedGeoviewLayerConfig.geoviewLayerId}`;
        const layerInfo: TypeOrderedLayerInfo = {
          layerPath,
          visible: castedGeoviewLayerConfig.initialSettings?.states?.visible !== false,
        };
        newOrderedLayerInfos.push(layerInfo);
        castedGeoviewLayerConfig.listOfLayerEntryConfig.forEach((layerEntryConfig) => {
          addSubLayerPathToLayerOrder(layerEntryConfig as AbstractBaseLayerEntryConfig, layerPath);
        });
      } else {
        const layerEntryConfig = geoviewLayerConfig.listOfLayerEntryConfig[0];
        addSubLayerPathToLayerOrder(layerEntryConfig as AbstractBaseLayerEntryConfig, layerEntryConfig.layerPath);
      }
    } else addSubLayerPathToLayerOrder(geoviewLayerConfig as AbstractBaseLayerEntryConfig, geoviewLayerConfig.layerPath);

    return newOrderedLayerInfos;
  }

  /**
   * Load layers that was passed in with the map config
   * @param {MapConfigLayerEntry[]} mapConfigLayerEntries an optional array containing layers passed within the map config
   */
  loadListOfGeoviewLayer(mapConfigLayerEntries?: MapConfigLayerEntry[]): void {
    const validGeoviewLayerConfigs = this.deleteDuplicatAndMultipleUuidGeoviewLayerConfig(mapConfigLayerEntries);

    // set order for layers to appear on the map according to config
    const promisesOfGeoCoreGeoviewLayers: Promise<TypeListOfGeoviewLayerConfig>[] = [];
    for (let i = 0; i < validGeoviewLayerConfigs.length; i++) {
      const geoviewLayerConfig = validGeoviewLayerConfigs[i];

      // If the layer is GeoCore add it via the core function
      if (mapConfigLayerEntryIsGeoCore(geoviewLayerConfig)) {
        // Prep the GeoCore
        const geoCore = new GeoCore(this.mapId, this.mapViewer.getDisplayLanguage());

        // Create the layers from the UUID
        promisesOfGeoCoreGeoviewLayers.push(geoCore.createLayersFromUUID(geoviewLayerConfig.geoviewLayerId));
      } else {
        // Add a resolved promise for a regular Geoview Layer Config
        promisesOfGeoCoreGeoviewLayers.push(Promise.resolve([geoviewLayerConfig as TypeGeoviewLayerConfig]));
      }
    }

    // Wait for all GeoCore to process
    // The reason for the Promise.allSettled is because of synch issues with the 'setMapOrderedLayerInfo' which happens below and the
    // other setMapOrderedLayerInfos that happen in parallel via the ADD_LAYER events ping/pong'ing, making the setMapOrdered below fail
    // if we don't stage the promises. If we don't stage the promises, sometimes I have 4 layers loaded in 'Details' and sometimes
    // I have 3 layers loaded in Details - for example.
    // To fix this, we'll have to synch the ADD_LAYER events and make sure those 'know' what order they should be in when they
    // propagate the mapOrderedLayerInfo in their processes. For now at least, this is repeating the same behavior until the events are fixed.
    const orderedLayerInfos: TypeOrderedLayerInfo[] = [];
    Promise.allSettled(promisesOfGeoCoreGeoviewLayers).then((promisedLayers) => {
      // For each layers in the fulfilled promises only
      promisedLayers
        .filter((promise) => promise.status === 'fulfilled')
        .map((promise) => promise as PromiseFulfilledResult<TypeListOfGeoviewLayerConfig>)
        .forEach((promise) => {
          // For each layer
          promise.value.forEach((geocoreGVLayer) => {
            // Generate array of layer order information
            const layerInfos = this.generateArrayOfLayerOrderInfo(geocoreGVLayer);
            orderedLayerInfos.push(...layerInfos);

            // Add it
            this.addGeoviewLayer(geocoreGVLayer);
          });
        });
      MapEventProcessor.setMapOrderedLayerInfo(this.mapId, orderedLayerInfos);
    });
  }

  /**
   * Validates the geoview layer configuration array to eliminate duplicate entries and inform the user.
   * @param {MapConfigLayerEntry[]} mapConfigLayerEntries The Map Config Layer Entries to validate.
   * @returns {MapConfigLayerEntry[]} The new configuration with duplicate entries eliminated.
   */
  private deleteDuplicatAndMultipleUuidGeoviewLayerConfig(mapConfigLayerEntries?: MapConfigLayerEntry[]): MapConfigLayerEntry[] {
    if (mapConfigLayerEntries && mapConfigLayerEntries.length > 0) {
      const validGeoviewLayerConfigs = mapConfigLayerEntries.filter((geoviewLayerConfigToCreate, configToCreateIndex) => {
        for (let configToTestIndex = 0; configToTestIndex < mapConfigLayerEntries.length; configToTestIndex++) {
          if (
            geoviewLayerConfigToCreate.geoviewLayerId === mapConfigLayerEntries[configToTestIndex].geoviewLayerId &&
            // We keep the first instance of the duplicate entry.
            configToCreateIndex > configToTestIndex
          ) {
            this.printDuplicateGeoviewLayerConfigError(geoviewLayerConfigToCreate);
            return false;
          }
        }
        return true;
      });
      return validGeoviewLayerConfigs;
    }
    return [];
  }

  /**
   * Prints an error message for the duplicate geoview layer configuration.
   * @param {MapConfigLayerEntry} geoviewLayerConfig The Map Config Layer Entry in error.
   */
  private printDuplicateGeoviewLayerConfigError(mapConfigLayerEntry: MapConfigLayerEntry) {
    const message = replaceParams(
      [mapConfigLayerEntry.geoviewLayerId, this.mapId],
      getLocalizedMessage(this.mapId, 'validation.layer.usedtwice')
    );
    showError(this.mapId, message);
    // Log
    logger.logError(`Duplicate use of geoview layer identifier ${mapConfigLayerEntry.geoviewLayerId} on map ${this.mapId}`);
  }

  /**
   * Returns the GeoView instance associated to a specific layer path. The first element of the layerPath
   * is the geoviewLayerId.
   * @param {string} layerPath The layer path to the layer's configuration.
   *
   * @returns {AbstractGeoViewLayer} Returns the geoview instance associated to the layer path.
   */
  geoviewLayer(layerPath: string): AbstractGeoViewLayer {
    // TODO: Refactor - Move this method next to the getGeoviewLayerByLayerPath equivalent. And then rename it?
    // The first element of the layerPath is the geoviewLayerId
    const geoviewLayerInstance = this.geoviewLayers[layerPath.split('/')[0]];

    // TODO: Check #1857 - Why set the `layerPathAssociatedToTheGeoviewLayer` property on the fly? Should likely set this somewhere else than in this function that looks more like a getter.
    // TO.DOCONT: It seems `layerPathAssociatedToTheGeoviewLayer` is indeed used many places, notably in applyFilters logic.
    // TO.DOCONT: If all those places rely on the `layerPathAssociatedToTheGeoviewLayer` to be set, that logic using layerPathAssociatedToTheGeoviewLayer should be moved over there.
    // TO.DOCONT: If there's more other places relying on the `layerPathAssociatedToTheGeoviewLayer`, then it's not ideal,
    // TO.DOCONT: because it's assuming/relying on the fact that all those other places use this specific geoviewLayer() prior to do their work.
    // TO.DOCONT: There's likely some separation of logic to apply here. Make this function more evident that it 'sets' something, not just 'gets' a GeoViewLayer.
    geoviewLayerInstance.layerPathAssociatedToTheGeoviewLayer = layerPath;
    return geoviewLayerInstance;
  }

  /**
   * Verifies if a layer is registered. Returns true if registered.
   * @param {TypeLayerEntryConfig} layerConfig The layer configuration to test.
   * @returns {boolean} Returns true if the layer configuration is registered.
   */
  isRegistered(layerConfig: TypeLayerEntryConfig): boolean {
    const { layerPath } = layerConfig;
    return this.registeredLayers[layerPath] !== undefined;
  }

  /**
   * Adds a Geoview Layer by GeoCore UUID.
   * @param mapId The map id to add to
   * @param uuid The GeoCore UUID
   */
  addGeoviewLayerByGeoCoreUUID = async (uuid: string): Promise<void> => {
    const geoCoreGeoviewLayerInstance = new GeoCore(this.mapId, this.mapViewer.getDisplayLanguage());
    const layers = await geoCoreGeoviewLayerInstance.createLayersFromUUID(uuid);
    layers.forEach((geoviewLayerConfig) => {
      // Redirect
      this.addGeoviewLayer(geoviewLayerConfig);
    });
  };

  /**
   * Adds a layer to the map. This is the main method to add a GeoView Layer on the map.
   * It handles all the processing, including the validations, and makes sure to inform the layer sets about the layer.
   * @param {TypeGeoviewLayerConfig} geoviewLayerConfig The geoview layer configuration to add
   * @param {TypeListOfLocalizedLanguages} optionalSuportedLanguages An optional list of supported language
   * @returns {GeoViewLayerAddedResult | undefined} The result of the addition of the geoview layer.
   * The result contains the instanciated GeoViewLayer along with a promise that will resolve when the layer will be officially on the map.
   */
  addGeoviewLayer = (
    geoviewLayerConfig: TypeGeoviewLayerConfig,
    optionalSuportedLanguages?: TypeListOfLocalizedLanguages
  ): GeoViewLayerAddedResult | undefined => {
    // eslint-disable-next-line no-param-reassign
    geoviewLayerConfig.geoviewLayerId = generateId(geoviewLayerConfig.geoviewLayerId);
    // TODO: Refactor - We should not create a new config here.
    // TO.DOCONT: The layer class should receive an instance of configuration in is constructor.
    // TO.DOCONT: Here the function sends the config to this class to get the structure to use to generate layers.
    // TO.DOCONT: We should not have link to config anymore...
    // create a new config object for this map element
    const config = new Config(this.mapViewer.map.getTargetElement());

    const suportedLanguages = optionalSuportedLanguages || config.configValidation.defaultMapFeaturesConfig.suportedLanguages;

    // TODO: Refactor - This should be deal with the config classes and this class pushes the structure ready for consumption by layer orchestrator
    config.configValidation.validateListOfGeoviewLayerConfig(suportedLanguages, [geoviewLayerConfig]);

    if (geoviewLayerConfig.geoviewLayerId in this.geoviewLayers) this.printDuplicateGeoviewLayerConfigError(geoviewLayerConfig);
    else {
      // Adds the configuration to the list in map
      // TODO: Refactor - Figure out why doing this - and then not do this
      // TO.DOCONT: 2024-03-20 as part of the layers refactoring, this has been commented out, leave it commented for a bit
      // TO.DOCONT: until things are confirmed to be still working
      // this.mapViewer.mapFeaturesConfig.map.listOfGeoviewLayerConfig!.push(geoviewLayerConfig);

      // Process the addition of the layer
      return this.#addGeoviewLayerStep2(geoviewLayerConfig);
    }

    // Not added
    return undefined;
  };

  /**
   * Continues the addition of the geoview layer.
   * @param {TypeGeoviewLayerConfig} geoviewLayerConfig The geoview layer configuration to add
   * @returns {GeoViewLayerAddedResult | undefined} The result of the addition of the geoview layer.
   * The result contains the instanciated GeoViewLayer along with a promise that will resolve when the layer will be officially on the map.
   */
  #addGeoviewLayerStep2 = (geoviewLayerConfig: TypeGeoviewLayerConfig): GeoViewLayerAddedResult | undefined => {
    // TODO: Refactor - Here the function should use the structure created by validation config with the metadata fetch and no need to pass the validation.
    let layerBeingAdded: AbstractGeoViewLayer | undefined;
    if (layerConfigIsGeoJSON(geoviewLayerConfig)) {
      layerBeingAdded = new GeoJSON(this.mapId, geoviewLayerConfig);
    } else if (layerConfigIsGeoPackage(geoviewLayerConfig)) {
      layerBeingAdded = new GeoPackage(this.mapId, geoviewLayerConfig);
    } else if (layerConfigIsCSV(geoviewLayerConfig)) {
      layerBeingAdded = new CSV(this.mapId, geoviewLayerConfig);
    } else if (layerConfigIsWMS(geoviewLayerConfig)) {
      layerBeingAdded = new WMS(this.mapId, geoviewLayerConfig);
    } else if (layerConfigIsEsriDynamic(geoviewLayerConfig)) {
      layerBeingAdded = new EsriDynamic(this.mapId, geoviewLayerConfig);
    } else if (layerConfigIsEsriFeature(geoviewLayerConfig)) {
      layerBeingAdded = new EsriFeature(this.mapId, geoviewLayerConfig);
    } else if (layerConfigIsEsriImage(geoviewLayerConfig)) {
      layerBeingAdded = new EsriImage(this.mapId, geoviewLayerConfig);
    } else if (layerConfigIsImageStatic(geoviewLayerConfig)) {
      layerBeingAdded = new ImageStatic(this.mapId, geoviewLayerConfig);
    } else if (layerConfigIsWFS(geoviewLayerConfig)) {
      layerBeingAdded = new WFS(this.mapId, geoviewLayerConfig);
    } else if (layerConfigIsOgcFeature(geoviewLayerConfig)) {
      layerBeingAdded = new OgcFeature(this.mapId, geoviewLayerConfig);
    } else if (layerConfigIsXYZTiles(geoviewLayerConfig)) {
      layerBeingAdded = new XYZTiles(this.mapId, geoviewLayerConfig);
    } else if (layerConfigIsVectorTiles(geoviewLayerConfig)) {
      layerBeingAdded = new VectorTiles(this.mapId, geoviewLayerConfig);
    } else {
      // TODO: Refactor - Throw an Error when falling in this else and change return type to AbstractGeoViewLayer without undefined
    }

    // If created
    if (layerBeingAdded) {
      // Add in the geoviewLayers set
      this.geoviewLayers[layerBeingAdded.geoviewLayerId] = layerBeingAdded;

      // Wire a handle when the layer wants to register
      layerBeingAdded.onGeoViewLayerRegistration(this.#handleLayerRegistration.bind(this));

      // Prepare mandatory registrations
      // TODO: Refactor - this shouldn't have to be mandatory! And not a function of the layer.
      layerBeingAdded.initRegisteredLayers(this);

      // Create a promise about the layer will be on the map
      const promiseLayer = new Promise<void>((resolve, reject) => {
        // Continue the addition process
        layerBeingAdded!
          .createGeoViewLayers()
          .then(() => {
            // Add the layer on the map
            this.#addToMap(layerBeingAdded!);

            // Resolve, done
            resolve();

            // Emit about it
            this.emitLayerAdded({ layer: layerBeingAdded! });
          })
          .catch((error) => {
            // Reject
            reject(error);
          });
      });

      // Return the layer with the promise it'll be on the map
      return { layer: layerBeingAdded, promiseLayer };
    }

    // Not added
    return undefined;
  };

  /**
   * Continues the addition of the geoview layer.
   * Adds the layer to the map if valid. If not (is a string) emits an error.
   * @param {any} geoviewLayer the layer config
   */
  #addToMap = (geoviewLayer: AbstractGeoViewLayer): void => {
    // if the returned layer object has something in the layerLoadError, it is because an error was detected
    // do not add the layer to the map
    if (geoviewLayer.layerLoadError.length !== 0) {
      geoviewLayer.layerLoadError.forEach((loadError) => {
        const { layer, loggerMessage } = loadError;

        // Log the details in the console
        logger.logError(loggerMessage);

        const message = replaceParams([layer, this.mapId], getLocalizedMessage(this.mapId, 'validation.layer.loadfailed'));
        showError(this.mapId, message);
      });
    }

    // If all layer status are good
    if (!geoviewLayer.allLayerStatusAreGreaterThanOrEqualTo('error')) {
      // Add the OpenLayers layer to the map officially
      this.mapViewer.map.addLayer(geoviewLayer.olLayers!);
    }

    // Log
    logger.logInfo(`GeoView Layer ${geoviewLayer.geoviewLayerId} added to map ${this.mapId}`, geoviewLayer);

    // Set the layer z indices
    MapEventProcessor.setLayerZIndices(this.mapId);
  };

  /**
   * Handles the registration of a geoview layer as part of its addition on the map.
   * This handle is called when the geoview layer is ready to be registered in the layer set.
   * @param {AbstractGeoViewLayer} geoviewLayer The Geoview layer to register
   * @param {GeoViewLayerRegistrationEvent} registrationEvent The registration event
   */
  #handleLayerRegistration = (geoviewLayer: AbstractGeoViewLayer, registrationEvent: GeoViewLayerRegistrationEvent): void => {
    // The layer is ready to be registered, take care of it

    // Log - leaving the line in comment as it can be pretty useful to uncomment it sometimes
    // logger.logDebug('REGISTERING LAYER', registrationEvent.action, registrationEvent.layerPath, registrationEvent.layerConfig);

    // Wire handler on the layer config to track the status changed
    registrationEvent.layerConfig.onLayerStatusChanged(this.#handleLayerStatusChanged.bind(this));

    // Tell the layer sets about it
    [this.legendsLayerSet, this.hoverFeatureInfoLayerSet, this.allFeatureInfoLayerSet, this.featureInfoLayerSet].forEach(
      (layerSet: LayerSet) => {
        // Register or Unregister the layer
        layerSet.registerOrUnregisterLayer(geoviewLayer, registrationEvent.layerPath, registrationEvent.action);
      }
    );
  };

  /**
   * Handles when the layer status changes on a given layer/configuration as part of its addition on the map.
   * This handle is called when the geoview layer is being added.
   * @param {AbstractGeoViewLayer} geoviewLayer The Geoview layer to register
   * @param {GeoViewLayerRegistrationEvent} registrationEvent The registration event
   */
  #handleLayerStatusChanged = (config: ConfigBaseClass, layerStatusEvent: LayerStatusChangedEvent) => {
    // The layer status has changed for the given config/layer, take care of it

    // Log - leaving the line in comment as it can be pretty useful to uncomment it sometimes
    // logger.logDebug('LAYER STATUS CHANGED', layerStatusEvent.layerPath, layerStatusEvent.layerStatus, config);

    // Tell the layer sets about it
    [this.legendsLayerSet, this.hoverFeatureInfoLayerSet, this.allFeatureInfoLayerSet, this.featureInfoLayerSet].forEach(
      (layerSet: LayerSet) => {
        // Process the layer status change
        layerSet.processLayerStatusChanged(config, layerStatusEvent.layerPath, layerStatusEvent.layerStatus);
      }
    );
  };

  /**
   * Emits an event to all handlers.
   * @param {LayerAddedEvent} event The event to emit
   */
  emitLayerAdded = (event: LayerAddedEvent) => {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerAddedHandlers, event);
  };

  /**
   * Wires an event handler.
   * @param {LayerAddedDelegate} callback The callback to be executed whenever the event is emitted
   */
  onLayerAdded = (callback: LayerAddedDelegate): void => {
    // Wire the event handler
    EventHelper.onEvent(this.#onLayerAddedHandlers, callback);
  };

  /**
   * Unwires an event handler.
   * @param {LayerAddedDelegate} callback The callback to stop being called whenever the event is emitted
   */
  offLayerAdded = (callback: LayerAddedDelegate): void => {
    // Unwire the event handler
    EventHelper.offEvent(this.#onLayerAddedHandlers, callback);
  };

  /**
   * Removes all geoview layers from the map
   */
  removeAllGeoviewLayers = (): void => {
    // For each Geoview layers
    Object.values(this.geoviewLayers).forEach((layer: AbstractGeoViewLayer) => {
      // Remove it
      this.removeGeoviewLayer(layer.geoviewLayerId);
    });
  };

  /**
   * Removes a geoview layer from the map
   *
   * @param {TypeGeoviewLayerConfig} geoviewLayer the layer configuration to remove
   */
  removeGeoviewLayer = (geoviewLayerId: string): void => {
    // Redirect (weird, but at the time of writing for this refactor - this was what it was doing)
    this.removeLayersUsingPath(geoviewLayerId);
  };

  /**
   * Removes a layer from the map using its layer path. The path may point to the root geoview layer
   * or a sub layer.
   *
   * @param {string} partialLayerPath the path of the layer to be removed
   */
  removeLayersUsingPath = (partialLayerPath: string): void => {
    // A layer path is a slash seperated string made of the GeoView layer Id followed by the layer Ids
    const partialLayerPathNodes = partialLayerPath.split('/');

    // initialize these two constant now because we will delete the information used to get their values.
    const indexToDelete = this.registeredLayers[partialLayerPath]
      ? this.registeredLayers[partialLayerPath].geoviewLayerInstance
          ?.getParentConfig(partialLayerPath)
          ?.listOfLayerEntryConfig.findIndex((layerConfig) => layerConfig === this.registeredLayers?.[partialLayerPath])
      : undefined;
    const listOfLayerEntryConfigAffected =
      this.registeredLayers[partialLayerPath]?.geoviewLayerInstance?.getParentConfig(partialLayerPath)?.listOfLayerEntryConfig;

    Object.keys(this.registeredLayers).forEach((completeLayerPath) => {
      const completeLayerPathNodes = completeLayerPath.split('/');
      const pathBeginningAreEqual = partialLayerPathNodes.reduce<boolean>((areEqual, partialLayerPathNode, nodeIndex) => {
        return areEqual && partialLayerPathNode === completeLayerPathNodes[nodeIndex];
      }, true);
      if (pathBeginningAreEqual) this.geoviewLayer(completeLayerPath).removeConfig();
    });
    if (listOfLayerEntryConfigAffected) listOfLayerEntryConfigAffected.splice(indexToDelete!, 1);

    if (this.geoviewLayers[partialLayerPath]) {
      this.geoviewLayers[partialLayerPath].olLayers!.dispose();
      delete this.geoviewLayers[partialLayerPath];
      const { mapFeaturesConfig } = this.mapViewer;
      if (mapFeaturesConfig.map.listOfGeoviewLayerConfig)
        mapFeaturesConfig.map.listOfGeoviewLayerConfig = mapFeaturesConfig.map.listOfGeoviewLayerConfig.filter(
          (geoviewLayerConfig) => geoviewLayerConfig.geoviewLayerId !== partialLayerPath
        );
    }

    // Log
    logger.logInfo(`Layer removed for ${partialLayerPath}`);
  };

  /**
   * Searches for a layer using its id and return the layer data
   *
   * @param {string} geoviewLayerId the layer id to look for
   * @returns the found layer data object
   */
  getGeoviewLayerById = (geoviewLayerId: string): AbstractGeoViewLayer | null => {
    return this.geoviewLayers?.[geoviewLayerId] || null;
  };

  /**
   * Asynchronously gets a layer using its id and return the layer data.
   * If the layer we're searching for has to be processed, set mustBeProcessed to true when awaiting on this method.
   * This function waits the timeout period before abandonning (or uses the default timeout when not provided).
   * Note this function uses the 'Async' suffix to differentiate it from 'getGeoviewLayerById'.
   *
   * @param {string} layerID the layer id to look for
   * @param {string} mustBeProcessed indicate if the layer we're searching for must be found only once processed
   * @param {string} timeout optionally indicate the timeout after which time to abandon the promise
   * @param {string} checkFrequency optionally indicate the frequency at which to check for the condition on the layer
   * @returns a promise with the AbstractGeoViewLayer
   * @throws an exception when the layer for the layer id couldn't be found, or waiting time expired
   */
  getGeoviewLayerByIdAsync = async (
    geoviewLayerId: string,
    mustBeProcessed: boolean,
    timeout?: number,
    checkFrequency?: number
  ): Promise<AbstractGeoViewLayer> => {
    // Redirects
    const layer = this.getGeoviewLayerById(geoviewLayerId);

    // If layer was found
    if (layer) {
      // Check if not waiting and returning immediately
      if (!mustBeProcessed) return Promise.resolve(layer);

      try {
        // Waiting for the processed phase, possibly throwing exception if that's not happening
        await this.waitForAllLayerStatusAreGreaterThanOrEqualTo(layer, timeout, checkFrequency);
        return layer;
      } catch (error) {
        // Throw
        throw new Error(`Took too long for layer ${geoviewLayerId} to get in 'processed' phase`);
      }
    }

    // Throw
    throw new Error(`Layer ${geoviewLayerId} not found.`);
  };

  /**
   * Returns the OpenLayer layer associated to a specific layer path.
   * @param {string} layerPath The layer path to the layer's configuration.
   *
   * @returns {BaseLayer | LayerGroup} Returns the OpenLayer layer associated to the layer path.
   */
  getOLLayerByLayerPath = (layerPath: string): BaseLayer | LayerGroup => {
    // Return the olLayer object from the registered layers
    const olLayer = (this.registeredLayers[layerPath] as AbstractBaseLayerEntryConfig)?.olLayer;
    if (olLayer) return olLayer;
    throw new Error(`Layer at path ${layerPath} not found.`);
  };

  /**
   * Asynchronously returns the OpenLayer layer associated to a specific layer path.
   * This function waits the timeout period before abandonning (or uses the default timeout when not provided).
   * Note this function uses the 'Async' suffix to differentiate it from 'getOLLayerByLayerPath'.
   * @param {string} layerPath The layer path to the layer's configuration.
   *
   * @returns {BaseLayer | LayerGroup} Returns the OpenLayer layer associated to the layer path.
   */
  getOLLayerByLayerPathAsync = async (layerPath: string, timeout?: number, checkFrequency?: number): Promise<BaseLayer | LayerGroup> => {
    // Make sure the open layer has been created, sometimes it can still be in the process of being created
    const promisedLayer = await whenThisThen(
      () => {
        return (this.registeredLayers[layerPath] as AbstractBaseLayerEntryConfig)?.olLayer;
      },
      timeout,
      checkFrequency
    );
    // Here, the layer resolved
    return promisedLayer!;
  };

  /**
   * Returns a Promise that will be resolved once the given layer is in a processed phase.
   * This function waits the timeout period before abandonning (or uses the default timeout when not provided).
   *
   * @param {string} layer the layer object
   * @param {string} timeout optionally indicate the timeout after which time to abandon the promise
   * @param {string} checkFrequency optionally indicate the frequency at which to check for the condition on the layer
   * @throws an exception when the layer failed to become in processed phase before the timeout expired
   */
  waitForAllLayerStatusAreGreaterThanOrEqualTo = async (
    geoviewLayerConfig: AbstractGeoViewLayer,
    timeout?: number,
    checkFrequency?: number
  ): Promise<void> => {
    // Wait for the processed phase
    await whenThisThen(
      () => {
        return geoviewLayerConfig.allLayerStatusAreGreaterThanOrEqualTo('processed');
      },
      timeout,
      checkFrequency
    );

    // Resolve successfully, otherwise an exception has been thrown already
    return Promise.resolve();
  };

  /**
   * Highlights layer or sublayer on map
   *
   * @param {string} layerPath ID of layer to highlight
   */
  highlightLayer(layerPath: string): void {
    this.removeHighlightLayer();
    this.highlightedLayer = { layerPath, originalOpacity: this.geoviewLayer(layerPath).getOpacity() };
    this.geoviewLayer(layerPath).setOpacity(1);
    // If it is a group layer, highlight sublayers
    if (layerEntryIsGroupLayer(this.registeredLayers[layerPath] as TypeLayerEntryConfig)) {
      Object.keys(this.registeredLayers).forEach((registeredLayerPath) => {
        if (
          !registeredLayerPath.startsWith(layerPath) &&
          !layerEntryIsGroupLayer(this.registeredLayers[registeredLayerPath] as TypeLayerEntryConfig)
        ) {
          const otherOpacity = this.geoviewLayer(registeredLayerPath).getOpacity();
          this.geoviewLayer(registeredLayerPath).setOpacity((otherOpacity || 1) * 0.25);
        } else (this.registeredLayers[registeredLayerPath] as AbstractBaseLayerEntryConfig).olLayer!.setZIndex(999);
      });
    } else {
      Object.keys(this.registeredLayers).forEach((registeredLayerPath) => {
        // check for otherOlLayer is undefined. It would be undefined if a layer status is error
        if (
          registeredLayerPath !== layerPath &&
          !layerEntryIsGroupLayer(this.registeredLayers[registeredLayerPath] as TypeLayerEntryConfig)
        ) {
          const otherOpacity = this.geoviewLayer(registeredLayerPath).getOpacity();
          this.geoviewLayer(registeredLayerPath).setOpacity((otherOpacity || 1) * 0.25);
        }
      });
      (this.registeredLayers[layerPath] as AbstractBaseLayerEntryConfig).olLayer!.setZIndex(999);
    }
  }

  /**
   * Removes layer or sublayer highlight
   */
  removeHighlightLayer(): void {
    this.featureHighlight.removeBBoxHighlight();
    if (this.highlightedLayer.layerPath !== undefined) {
      const { layerPath, originalOpacity } = this.highlightedLayer;
      if (layerEntryIsGroupLayer(this.registeredLayers[layerPath])) {
        Object.keys(this.registeredLayers).forEach((registeredLayerPath) => {
          if (
            !registeredLayerPath.startsWith(layerPath) &&
            !layerEntryIsGroupLayer(this.registeredLayers[registeredLayerPath] as TypeLayerEntryConfig)
          ) {
            const otherOpacity = this.geoviewLayer(registeredLayerPath).getOpacity();
            this.geoviewLayer(registeredLayerPath).setOpacity(otherOpacity ? otherOpacity * 4 : 1);
          } else this.geoviewLayer(registeredLayerPath).setOpacity(originalOpacity || 1);
        });
      } else {
        Object.keys(this.registeredLayers).forEach((registeredLayerPath) => {
          // check for otherOlLayer is undefined. It would be undefined if a layer status is error
          if (
            registeredLayerPath !== layerPath &&
            !layerEntryIsGroupLayer(this.registeredLayers[registeredLayerPath] as TypeLayerEntryConfig)
          ) {
            const otherOpacity = this.geoviewLayer(registeredLayerPath).getOpacity();
            this.geoviewLayer(registeredLayerPath).setOpacity(otherOpacity ? otherOpacity * 4 : 1);
          } else this.geoviewLayer(registeredLayerPath).setOpacity(originalOpacity || 1);
        });
      }
      MapEventProcessor.setLayerZIndices(this.mapId);
      this.highlightedLayer.layerPath = undefined;
      this.highlightedLayer.originalOpacity = undefined;
    }
  }
}

/**
 * Define a delegate for the event handler function signature
 */
type LayerAddedDelegate = EventDelegateBase<LayerApi, LayerAddedEvent>;

/**
 * Define an event for the delegate
 */
export type LayerAddedEvent = {
  // The added layer
  layer: AbstractGeoViewLayer;
};
