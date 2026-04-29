import { GeoCore } from '@/api/config/geocore';
import { GeoPackageReader } from '@/api/config/reader/geopackage-reader';
import { ShapefileReader } from '@/api/config/reader/shapefile-reader';
import { AbstractBaseLayerEntryConfig } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import type { ConfigBaseClass } from '@/api/config/validation-classes/config-base-class';
import EventHelper, { type EventDelegateBase } from '@/api/events/event-helper';
import {
  CONST_LAYER_TYPES,
  mapConfigLayerEntryIsGeoCore,
  mapConfigLayerEntryIsGeoPackage,
  mapConfigLayerEntryIsRCS,
  mapConfigLayerEntryIsShapefile,
  type GeoCoreLayerConfig,
  type MapConfigLayerEntry,
  type TypeGeoviewLayerConfig,
} from '@/api/types/layer-schema-types';
import type { TypeDisplayLanguage } from '@/api/types/map-schema-types';
import type { GeoViewGeoChartConfig } from '@/api/config/reader/uuid-config-reader';
import type { GroupLayerEntryConfig } from '@/api/config/validation-classes/group-layer-entry-config';
import { EsriDynamicLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/esri-dynamic-layer-entry-config';
import { CsvLayerEntryConfig } from '@/api/config/validation-classes/vector-validation-classes/csv-layer-entry-config';
import { EsriFeatureLayerEntryConfig } from '@/api/config/validation-classes/vector-validation-classes/esri-feature-layer-entry-config';
import { EsriImageLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/esri-image-layer-entry-config';
import { GeoJSONLayerEntryConfig } from '@/api/config/validation-classes/vector-validation-classes/geojson-layer-entry-config';
import { GeoTIFFLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/geotiff-layer-entry-config';
import { ImageStaticLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/image-static-layer-entry-config';
import { KmlLayerEntryConfig } from '@/api/config/validation-classes/vector-validation-classes/kml-layer-entry-config';
import { OgcFeatureLayerEntryConfig } from '@/api/config/validation-classes/vector-validation-classes/ogc-layer-entry-config';
import { OgcWfsLayerEntryConfig } from '@/api/config/validation-classes/vector-validation-classes/wfs-layer-entry-config';
import { WkbLayerEntryConfig } from '@/api/config/validation-classes/vector-validation-classes/wkb-layer-entry-config';
import { OgcWmsLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/ogc-wms-layer-entry-config';
import { OgcWmtsLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/ogc-wmts-layer-entry-config';
import { XYZTilesLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/xyz-layer-entry-config';
import { VectorTilesLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/vector-tiles-layer-entry-config';
import { AbstractMapViewerController } from '@/core/controllers/base/abstract-map-viewer-controller';
import type { ControllerRegistry } from '@/core/controllers/base/controller-registry';
import type { DomainLayerBaseEvent, LayerDomain } from '@/core/domains/layer-domain';
import { formatError, NotSupportedError } from '@/core/exceptions/core-exceptions';
import { GeoViewError } from '@/core/exceptions/geoview-exceptions';
import { LayerEntryConfigError } from '@/core/exceptions/layer-entry-config-exceptions';
import { LayerCreatedTwiceError } from '@/core/exceptions/layer-exceptions';
import { getStoreAppDisplayDateMode } from '@/core/stores/store-interface-and-intial-values/app-state';
import {
  getStoreLayerLegendLayers,
  getStoreLayerSelectedLayerPath,
  setStoreLayerSelectedLayersTabLayer,
  getStoreLayerOrderedLayerPaths,
  addStoreLayerInitialFilter,
} from '@/core/stores/store-interface-and-intial-values/layer-state';
import { isStoreGeochartInitialized } from '@/core/stores/store-interface-and-intial-values/geochart-state';
import { isStoreSwiperInitialized } from '@/core/stores/store-interface-and-intial-values/swiper-state';
import {
  isStoreTimeSliderInitialized,
  removeStoreTimeSliderLayer,
} from '@/core/stores/store-interface-and-intial-values/time-slider-state';
import { logger } from '@/core/utils/logger';
import type {
  AbstractGeoViewLayer,
  LayerEntryRegisterInitEvent,
  LayerGroupCreatedEvent,
  LayerGVCreatedEvent,
} from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import type { AbstractGVLayer, LayerMessageEvent } from '@/geo/layer/gv-layers/abstract-gv-layer';
import type { MapViewer } from '@/geo/map/map-viewer';
import { AbstractGVVector } from '@/geo/layer/gv-layers/vector/abstract-gv-vector';
import { GeoJSON } from '@/geo/layer/geoview-layers/vector/geojson';
import { WMS } from '@/geo/layer/geoview-layers/raster/wms';
import { WMTS } from '@/geo/layer/geoview-layers/raster/wmts';
import { EsriDynamic } from '@/geo/layer/geoview-layers/raster/esri-dynamic';
import { EsriFeature } from '@/geo/layer/geoview-layers/vector/esri-feature';
import { EsriImage } from '@/geo/layer/geoview-layers/raster/esri-image';
import { GeoTIFF } from '@/geo/layer/geoview-layers/raster/geotiff';
import { ImageStatic } from '@/geo/layer/geoview-layers/raster/image-static';
import { KML } from '@/geo/layer/geoview-layers/vector/kml';
import { WFS } from '@/geo/layer/geoview-layers/vector/wfs';
import { OgcFeature } from '@/geo/layer/geoview-layers/vector/ogc-feature';
import { XYZTiles } from '@/geo/layer/geoview-layers/raster/xyz-tiles';
import { VectorTiles } from '@/geo/layer/geoview-layers/raster/vector-tiles';
import { CSV } from '@/geo/layer/geoview-layers/vector/csv';
import { WKB } from '@/geo/layer/geoview-layers/vector/wkb';
import { ConfigValidation } from '@/api/config/config-validation';
import { generateId, isValidUUID } from '@/core/utils/utilities';
import { LayerGeoCoreError } from '@/core/exceptions/geocore-exceptions';
import { GVGroupLayer } from '@/geo/layer/gv-layers/gv-group-layer';

export class LayerCreatorController extends AbstractMapViewerController {
  /** Reference on the layer domain. */
  #layerDomain: LayerDomain;

  /** Dictionary holding all the geoview layers used for processing layer entry configs */
  #geoviewLayers: { [geoviewLayerId: string]: AbstractGeoViewLayer } = {};

  /** Callback delegates for the layer config added event */
  #onLayerConfigAddedHandlers: LayerBuilderDelegate[] = [];

  /** Callback delegates for the layer config error event */
  #onLayerConfigErrorHandlers: LayerConfigErrorDelegate[] = [];

  /** Callback delegates for the layer config removed event */
  #onLayerConfigRemovedHandlers: LayerPathDelegate[] = [];

  /** Callback delegates for the layer created event */
  #onLayerCreatedHandlers: LayerDelegate[] = [];

  /**
   * Creates an instance of the LayerCreator class.
   *
   * @param mapViewer - The map viewer instance to associate with this controller
   * @param controllerRegistry - The controller registry for accessing sibling controllers
   * @param layerDomain - The layer domain to be used by the LayerCreator
   */
  constructor(mapViewer: MapViewer, controllerRegistry: ControllerRegistry, layerDomain: LayerDomain) {
    super(mapViewer, controllerRegistry);
    this.#layerDomain = layerDomain;
  }

  /**
   * Loads layers that were passed in with the map config.
   *
   * @param mapConfigLayerEntries - An optional array containing layers passed within the map config
   * @returns A promise that resolves when everything is done
   */
  async loadListOfGeoviewLayer(mapConfigLayerEntries: MapConfigLayerEntry[]): Promise<void> {
    const validGeoviewLayerConfigs = this.#deleteDuplicateAndMultipleUuidGeoviewLayerConfig(mapConfigLayerEntries);

    // Make sure to convert all map config layer entry into a GeoviewLayerConfig
    const promisesOfGeoviewLayers = LayerCreatorController.convertMapConfigsToGeoviewLayerConfig(
      this.getMapId(),
      this.getControllersRegistry().layerController.getGeoviewLayerIds(),
      this.getMapViewer().getDisplayLanguage(),
      mapConfigLayerEntries,
      (layerPath: string, geochartConfig: GeoViewGeoChartConfig) => {
        // Add the chart to the store
        this.getControllersRegistry().geoChartController?.addChart(layerPath, geochartConfig);

        // Make sure geochart tab is shown
        this.getControllersRegistry().uiController.showTabButton('geochart');

        // Log
        logger.logInfo('Added GeoChart configs for layer path:', layerPath);
      },
      (mapConfigLayerEntry: MapConfigLayerEntry, error: unknown) => {
        // Show the error(s)
        this.showLayerError(error, mapConfigLayerEntry.geoviewLayerId);
      }
    );

    // Wait for all promises (GeoCore ones) to process
    // The reason for the Promise.allSettled is because of synch issues with the 'setMapOrderedLayers' which happens below and the
    // other setMapOrderedLayers that happen in parallel via the ADD_LAYER events ping/pong'ing, making the setMapOrdered below fail
    // if we don't stage the promises. If we don't stage the promises, sometimes I have 4 layers loaded in 'Details' and sometimes
    // I have 3 layers loaded in Details - for example.
    // To fix this, we'll have to synch the ADD_LAYER events and make sure those 'know' what order they should be in when they
    // propagate the mapOrderedLayers in their processes. For now at least, this is repeating the same behavior until the events are fixed.
    const orderedLayers: string[] = getStoreLayerOrderedLayerPaths(this.getMapId()).length
      ? [...getStoreLayerOrderedLayerPaths(this.getMapId())]
      : [];
    const promisedLayers = await Promise.allSettled(promisesOfGeoviewLayers);

    // For each layers in the fulfilled promises only
    promisedLayers.forEach((promise) => {
      // If fullfilled
      if (promise.status === 'fulfilled') {
        // Get the geoview layer config
        const geoviewLayerConfig = promise.value;

        try {
          // Generate array of layer paths for non-basemap layers
          if (geoviewLayerConfig.useAsBasemap !== true) {
            const layerPaths = AbstractMapViewerController.generateOrderedLayerPaths(geoviewLayerConfig);
            orderedLayers.push(...layerPaths);
          }

          // Add it
          this.addGeoviewLayer(geoviewLayerConfig);
        } catch (error: unknown) {
          // An error happening here likely means a particular, trivial, config error.
          // The majority of typicaly errors happen in the addGeoviewLayer promise catcher, not here.

          // Show the error(s)
          this.showLayerError(error, geoviewLayerConfig.geoviewLayerId);
        }
      } else {
        // Depending on the error
        let uuids;
        if (promise.reason instanceof LayerGeoCoreError) {
          ({ uuids } = promise.reason);
        }

        // For each uuid that failed
        uuids?.forEach((uuid: string) => {
          // Get the index at which the TypeGeoviewLayerConfig happened
          const index = validGeoviewLayerConfigs.findIndex((mapLayerEntry) => mapLayerEntry.geoviewLayerId === uuid);

          // If found
          if (index >= 0) {
            // Remove the entry
            validGeoviewLayerConfigs.splice(index, 1);
          }
        });
      }
    });

    // At this point, we've removed the duplicated geocore (DuplicateAndMultipleUuidGeoviewLayerConfig) and the
    // geocore that were failing were removed from the validGeoviewLayerConfigs variable.
    // Time to update the list we received in param so that the rest of the application works with that list.
    // This is notably so that the map loads even if no geocore layers were valid

    // Replace the array received in param
    mapConfigLayerEntries.splice(0, mapConfigLayerEntries.length, ...validGeoviewLayerConfigs);

    // Init ordered layers
    this.getControllersRegistry().layerController.setMapOrderedLayersDirectly(orderedLayers);
  }

  /**
   * Adds a Geoview Layer by GeoCore UUID.
   *
   * @param uuid - The GeoCore UUID to add to the map
   * @param layerEntryConfig - The optional layer configuration
   * @returns A promise that resolves with the added layer result or undefined when an error occurs
   */
  async addGeoviewLayerByGeoCoreUUID(uuid: string, layerEntryConfig?: string): Promise<GeoViewLayerAddedResult | undefined> {
    // Get the current geoview layer ids
    const currentGeoviewLayerIds = this.getControllersRegistry().layerController.getGeoviewLayerIds();

    if (currentGeoviewLayerIds.includes(uuid)) {
      // eslint-disable-next-line no-param-reassign
      uuid = `${uuid}:${generateId(8)}`;
    }

    try {
      // GV: This is here as a placeholder so that the layers will appear in the proper order,
      // GV: regardless of how quickly we get the response. It is removed, in the catch below, if the layer fails.
      this.getControllersRegistry().layerController.addOrderedLayerPath(uuid);

      const parsedLayerEntryConfig = layerEntryConfig ? JSON.parse(layerEntryConfig) : undefined;
      if (parsedLayerEntryConfig && !parsedLayerEntryConfig[0].layerId) parsedLayerEntryConfig[0].layerId = 'base-group';

      let optionalConfig: GeoCoreLayerConfig | undefined =
        parsedLayerEntryConfig && (parsedLayerEntryConfig[0].listOfLayerEntryConfig || parsedLayerEntryConfig[0].initialSettings)
          ? {
              geoviewLayerType: 'geoCore',
              geoviewLayerId: uuid,
              geoviewLayerName: parsedLayerEntryConfig[0].geoviewLayerName,
              listOfLayerEntryConfig: parsedLayerEntryConfig[0].geoviewLayerName
                ? parsedLayerEntryConfig[0].listOfLayerEntryConfig
                : parsedLayerEntryConfig,
              initialSettings: parsedLayerEntryConfig[0].initialSettings,
            }
          : undefined;

      // If a simplified config is provided, build a config with the layerName provided
      if (!optionalConfig && parsedLayerEntryConfig && (parsedLayerEntryConfig[0].layerName || parsedLayerEntryConfig[0].geoviewLayerName))
        optionalConfig = {
          geoviewLayerType: 'geoCore',
          geoviewLayerId: uuid,
          geoviewLayerName: parsedLayerEntryConfig[0].geoviewLayerName || parsedLayerEntryConfig[0].layerName,
        };

      // Create the layers from the UUID
      const response = await GeoCore.createLayerConfigFromUUID(
        uuid,
        currentGeoviewLayerIds,
        this.getMapViewer().getDisplayLanguage(),
        this.getMapId(),
        optionalConfig
      );
      const geoviewLayerConfig = response.config;

      // If a Geochart is initialized
      if (isStoreGeochartInitialized(this.getMapId())) {
        // For each geocharts configuration
        Object.entries(response.geocharts).forEach(([layerPath, geochartConfig]) => {
          // Add a GeoChart configuration on-the-fly
          this.getControllersRegistry().geoChartController?.addChart(layerPath, geochartConfig);

          // Make sure geochart tab is shown
          this.getControllersRegistry().uiController.showTabButton('geochart');
        });
      }

      if (geoviewLayerConfig.useAsBasemap === true) {
        // If a basemap, remove the ordered layer placeholder as basemap are not part of the ordered layers.
        this.getControllersRegistry().layerController.removeOrderedLayerPath(geoviewLayerConfig.geoviewLayerId, true);
      }

      // Add the geoview layer
      return this.addGeoviewLayer(geoviewLayerConfig);
    } catch (error: unknown) {
      // An error happening here likely means an issue with the UUID or a trivial config error.
      // The majority of typicaly errors happen in the addGeoviewLayer promise catcher, not here.

      // Remove geoCore ordered layer placeholder
      this.getControllersRegistry().layerController.removeOrderedLayerPath(uuid, false);

      // Show the error(s)
      this.showLayerError(error, uuid);
    }

    // None
    return undefined;
  }

  /**
   * Adds a layer to the map.
   *
   * This is the main method to add a GeoView Layer on the map. It handles all the processing, including the validations,
   * and makes sure to inform the layer sets about the layer. The result contains the instanciated GeoViewLayer along
   * with a promise that will resolve when the layer will be officially on the map.
   *
   * @param geoviewLayerConfig - The geoview layer configuration to add
   * @param abortSignal - Optional {@link AbortSignal} used to cancel the layer creation process
   * @returns The result of the addition of the geoview layer
   * @throws {LayerCreatedTwiceError} When there already is a layer on the map with the provided geoviewLayerId
   */
  addGeoviewLayer(geoviewLayerConfig: TypeGeoviewLayerConfig, abortSignal?: AbortSignal): GeoViewLayerAddedResult {
    // TODO: REFACTOR listOfLayerEntryConfig types - This should be dealt with the config classes and this line commented out.
    // TO.DOCONT: Right now, this function is called when the configuration is first read and schema checked and everything and then again here when we're adding a geoviewLayerConfig.
    // TO.DOCONT: Commenting the function from here would remove an redundancy call and it seems to be working in our templates when the line is commented. However, commenting it would
    // TO.DOCONT: probably cause issues when this 'addGeoviewLayer' function is called by external?
    // TO.DOCONT: PS: GeoCore also calls this 'validateListOfGeoviewLayerConfig' function from within 'createLayerConfigFromUUID'.
    ConfigValidation.validateListOfGeoviewLayerConfig([geoviewLayerConfig]);

    // If the geoviewlayerid already exists, throw
    if (this.getControllersRegistry().layerController.getGeoviewLayerIds().includes(geoviewLayerConfig.geoviewLayerId)) {
      // Throw that the geoview layer id was already created
      throw new LayerCreatedTwiceError(geoviewLayerConfig.geoviewLayerId, geoviewLayerConfig.geoviewLayerName);
    }

    // Process the addition of the layer
    const result: GeoViewLayerAddedResult = this.#addGeoviewLayerStep2(geoviewLayerConfig, abortSignal);

    // If any errors happened during the processing, we want to show them in the notifications
    result.promiseLayer.catch((error: unknown) => {
      // GV This is the major catcher of many possible layer processing issues

      // Show the error(s).
      this.showLayerError(error, geoviewLayerConfig.geoviewLayerId);
    });

    // Return the result
    return result;
  }

  /**
   * Refreshes all GeoCore layers by removing and re-adding them, then restoring the original layer order and visibility.
   *
   * Uses Promise.allSettled so that ordered layer paths include all children before restoring state.
   */
  reloadGeocoreLayers(): void {
    const { layerController } = this.getControllersRegistry();
    const originalOrderedLayers = [...getStoreLayerOrderedLayerPaths(this.getMapId())];
    const originalLegendLayersInfo = getStoreLayerLegendLayers(this.getMapId());

    // Collect root-level GeoCore configs, remove each layer, and start re-adding — capturing both paths and promises
    const parentPaths: string[] = [];
    const reloadPromises = layerController
      .getLayerEntryConfigs()
      .filter((config) => isValidUUID(config.getGeoviewLayerId()) && !config.getParentLayerConfig())
      .map((config) => {
        parentPaths.push(config.layerPath);
        this.removeLayerUsingPath(config.layerPath);
        return this.addGeoviewLayerByGeoCoreUUID(config.getGeoviewLayerId());
      });

    // Have to do the Promise allSettled so the new ordered layers have all the children layerPaths
    Promise.allSettled(reloadPromises)
      .then(() => {
        // After each GeoCore layer loads, remove any new child paths that weren't in the original order
        parentPaths.forEach((parentPath) => {
          const removeChildLayers = (sender: LayerCreatorController): void => {
            sender
              .#getAllChildPaths(parentPath)
              .filter((childPath) => !originalOrderedLayers.includes(childPath))
              .forEach((childPath) => sender.removeLayerUsingPath(childPath));
            sender.offLayerConfigAdded(removeChildLayers);
          };
          this.onLayerConfigAdded(removeChildLayers);
        });

        // Restore original layer order
        layerController.setMapOrderedLayersDirectly(originalOrderedLayers);

        // Restore original visibility for each layer when it first loads
        originalOrderedLayers.forEach((layerPath) => {
          const setLayerVisibility = (sender: LayerDomain, event: DomainLayerBaseEvent): void => {
            const eventLayerPath = event.layer.getLayerPath();
            if (layerPath === eventLayerPath) {
              const { visible } = originalLegendLayersInfo.find((info) => info.layerPath === eventLayerPath) ?? {};
              event.layer?.setVisible(visible ?? true);
              sender.offLayerFirstLoaded(setLayerVisibility);
            }
          };
          // TODO: REFACTOR - Instead of attaching on the domain, attach it on the layer itself
          this.#layerDomain.onLayerFirstLoaded(setLayerVisibility);
        });
      })
      .catch((error: unknown) => {
        // Log
        logger.logError(error);
      });
  }

  /**
   * Attempts to reload a layer.
   *
   * @param layerPath - The path to the layer to reload
   */
  reloadLayer(layerPath: string): void {
    // Get the layer controller
    const { layerController } = this.getControllersRegistry();

    const layerEntryConfig = layerController.getLayerEntryConfig(layerPath);
    const geoviewLayer = layerEntryConfig ? this.#geoviewLayers[layerEntryConfig.getGeoviewLayerId()] : undefined;
    const gvLayer = layerController.getGeoviewLayerIfExists(layerPath);

    if (geoviewLayer) {
      if (gvLayer instanceof GVGroupLayer) {
        // Reload each sub layers that are in error
        (layerEntryConfig as GroupLayerEntryConfig).listOfLayerEntryConfig.forEach((sublayerEntryConfig) => {
          if (sublayerEntryConfig.layerStatus === 'error') this.reloadLayer(sublayerEntryConfig.layerPath);
        });
      } else {
        // For each layer paths, check each starting with the given layerPath
        layerController.getLayerEntryLayerPaths().forEach((registeredLayerPath) => {
          if (registeredLayerPath.startsWith(`${layerPath}/`) || registeredLayerPath === layerPath) {
            // Get the geoview layer if exists
            const innerGVLayer = layerController.getGeoviewLayerIfExists(registeredLayerPath);

            // If found
            if (innerGVLayer) {
              // Remove actual OL layer from the map
              const layer = innerGVLayer.getOLLayer();
              if (layer) this.getMapViewer().map.removeLayer(layer);

              // Remove from registered layers
              this.#layerDomain.deleteGVLayer(innerGVLayer);
            }
          }
        });

        // Create and register new layer
        const layer = geoviewLayer.createGVLayer(layerEntryConfig as AbstractBaseLayerEntryConfig);

        // Re-register in the domain
        this.#layerDomain.registerGVLayer(layer);

        // Re-add on the map
        this.getMapViewer().map.addLayer(layer.getOLLayer());
      }
    }
  }

  /**
   * Removes all geoview layers from the map.
   */
  removeAllGeoviewLayers(): void {
    this.getControllersRegistry()
      .layerController.getLayerEntryLayerPaths()
      .forEach((layerEntryConfigId) => {
        // Remove it
        this.removeLayerUsingPath(layerEntryConfigId);
      });
  }

  /**
   * Removes a layer from the map using its layer path. The path may point to the root geoview layer
   * or a sub layer.
   *
   * @param layerPath - The path or ID of the layer to be removed
   */
  removeLayerUsingPath(layerPath: string): void {
    // Get the layer controller
    const { layerController } = this.getControllersRegistry();

    // Remove any highlights associated with the layer
    layerController.removeLayerHighlights(layerPath);

    // A layer path is a slash seperated string made of the GeoView layer Id followed by the layer Ids
    const layerPathNodes = layerPath.split('/');

    // Get the layer entry config to remove
    const layerEntryConfig = layerController.getLayerEntryConfigIfExists(layerPath);

    // If the layer config was found
    if (layerEntryConfig) {
      // initialize these two constant now because we will delete the information used to get their values.
      const indexToDelete = layerEntryConfig
        ? layerEntryConfig.getParentLayerConfig()?.listOfLayerEntryConfig.findIndex((layerConfig) => layerConfig === layerEntryConfig)
        : undefined;
      const listOfLayerEntryConfigAffected = layerController
        .getLayerEntryConfigIfExists(layerPath)
        ?.getParentLayerConfig()?.listOfLayerEntryConfig;

      // Remove layer info from registered layers
      layerController.getLayerEntryLayerPaths().forEach((registeredLayerPath) => {
        if (registeredLayerPath.startsWith(`${layerPath}/`) || registeredLayerPath === layerPath) {
          // Get the geoview layer if exists
          const innerGVLayer = layerController.getGeoviewLayerIfExists(registeredLayerPath);

          // Remove actual OL layer from the map
          const layer = innerGVLayer?.getOLLayer();
          if (layer) this.getMapViewer().map.removeLayer(layer);

          // Unregister layer config from the application
          this.#unregisterLayerConfig(layerController.getLayerEntryConfig(registeredLayerPath));

          // Remove the text layer if it is a vector layer
          if (innerGVLayer instanceof AbstractGVVector) {
            const textLayer = innerGVLayer.getTextOLLayer();
            if (textLayer) this.getMapViewer().map.removeLayer(textLayer);
          }

          // Unregister from the domain
          if (innerGVLayer) this.#layerDomain.deleteGVLayer(innerGVLayer);

          // Remove from registered geoviewLayers
          delete this.#geoviewLayers[registeredLayerPath];
        }
      });

      // Now that some layers have been removed, check if they are all effectively loaded/error and update store if so
      layerController.checkIfAllLayersLoadedAndUpdateStore();

      // Remove from parents listOfLayerEntryConfig
      if (listOfLayerEntryConfigAffected) listOfLayerEntryConfigAffected.splice(indexToDelete!, 1);

      // Remove layer from geoview layers
      if (this.#geoviewLayers[layerPathNodes[0]]) {
        const geoviewLayer = this.#geoviewLayers[layerPathNodes[0]];

        // If it is a single layer, remove geoview layer
        if (layerPathNodes.length === 1 || (layerPathNodes.length === 2 && geoviewLayer.listOfLayerEntryConfig.length === 1)) {
          geoviewLayer.olRootLayer?.dispose();
          if (geoviewLayer.olRootLayer) delete geoviewLayer.olRootLayer;

          delete this.#geoviewLayers[layerPathNodes[0]];
          const { mapFeaturesConfig } = this.getMapViewer();

          if (mapFeaturesConfig.map.listOfGeoviewLayerConfig)
            mapFeaturesConfig.map.listOfGeoviewLayerConfig = mapFeaturesConfig.map.listOfGeoviewLayerConfig.filter(
              (geoviewLayerConfig) => geoviewLayerConfig.geoviewLayerId !== layerPath
            );
        } else if (layerPathNodes.length === 2) {
          const updatedListOfLayerEntryConfig = geoviewLayer.listOfLayerEntryConfig.filter(
            (entryConfig) => entryConfig.layerId !== layerPathNodes[1]
          );
          geoviewLayer.listOfLayerEntryConfig = updatedListOfLayerEntryConfig;
        } else {
          // For layer paths more than two deep, drill down through listOfLayerEntryConfigs to layer entry config to remove
          let layerEntryConfig2 = geoviewLayer.listOfLayerEntryConfig.find((entryConfig) => entryConfig.layerId === layerPathNodes[1]);

          for (let i = 1; i < layerPathNodes.length; i++) {
            if (i === layerPathNodes.length - 1 && layerEntryConfig2) {
              // When we get to the top level, remove the layer entry config
              const updatedListOfLayerEntryConfig = layerEntryConfig2.listOfLayerEntryConfig.filter(
                (entryConfig) => entryConfig.layerId !== layerPathNodes[i]
              );
              geoviewLayer.listOfLayerEntryConfig = updatedListOfLayerEntryConfig;
            } else if (layerEntryConfig2) {
              // Not on the top level, so update to the latest
              layerEntryConfig2 = layerEntryConfig2.listOfLayerEntryConfig.find((entryConfig) => entryConfig.layerId === layerPathNodes[i]);
            }
          }
        }
      }

      // Emit about it
      this.#emitLayerConfigRemoved({ layerPath, layerName: layerEntryConfig.getLayerNameCascade() });

      // Log
      logger.logInfo(`Layer removed for ${layerPath}`);

      // Clear the selected path if it was set to it
      const currentlySelectedLayerPath = getStoreLayerSelectedLayerPath(this.getMapId());
      if (layerPath === currentlySelectedLayerPath) {
        // Clear it
        setStoreLayerSelectedLayersTabLayer(this.getMapId(), '');
      }

      // Redirect to feature info delete
      this.getControllersRegistry().detailsController.deleteFeatureInfo(layerPath);
    }
  }

  /**
   * Show the errors that happened during layers loading.
   *
   * If it's an aggregate error, log and show all of them.
   * If it's a regular error, log and show only that error.
   *
   * @param error - The error to log and show
   * @param geoviewLayerId - The Geoview layer id for which the error happened
   */
  showLayerError(error: unknown, geoviewLayerId: string): void {
    // If an aggregation error
    if (error instanceof AggregateError) {
      // For each errors
      error.errors.forEach((layerError) => {
        // Recursive call
        this.showLayerError(layerError, geoviewLayerId);
      });
    } else {
      // Cast the error
      const theError = formatError(error);

      // Read the layer path if possible, more precise
      let layerPathOrId = geoviewLayerId;
      if (theError instanceof LayerEntryConfigError) {
        layerPathOrId = theError.layerConfig.layerPath;
      }

      // Show error
      this.getMapViewer().notifications.showErrorFromError(theError, true);

      // If the Error is GeoViewError, it has a translation
      let { message } = theError;
      if (theError instanceof GeoViewError) {
        message = theError.translateMessage(this.getMapViewer().getDisplayLanguage());
      }

      // Emit about it
      this.#emitLayerConfigError({ layerPath: layerPathOrId, error: message });
    }
  }

  // #region PRIVATE METHODS

  /**
   * Continues the addition of the geoview layer.
   *
   * @param geoviewLayerConfig - The geoview layer configuration to add
   * @param abortSignal - Optional {@link AbortSignal} used to cancel the layer creation process
   * @returns The result of the addition of the geoview layer
   * The result contains the instanciated GeoViewLayer along with a promise that will resolve when the layer will be officially on the map.
   */
  #addGeoviewLayerStep2(geoviewLayerConfig: TypeGeoviewLayerConfig, abortSignal?: AbortSignal): GeoViewLayerAddedResult {
    // Create the layer for the processing
    const layerBeingAdded = LayerCreatorController.createLayerConfigFromType(geoviewLayerConfig);

    // Add in the geoviewLayers set
    this.#geoviewLayers[layerBeingAdded.getGeoviewLayerId()] = layerBeingAdded;

    // For each layer entry config in the geoview layer
    layerBeingAdded.getAllLayerEntryConfigs().forEach((layerConfig) => {
      // Log
      logger.logTraceCore(`LAYERS - 1 - Registering layer entry config ${layerConfig.layerPath} on map ${this.getMapId()}`, layerConfig);

      // Register it
      this.#registerLayerConfigInit(layerConfig);

      // Add filters to map initial filters, if they exist
      this.#addInitialFilters(layerConfig);
    });

    // Register a callback when the layer entry config wants to register extra configs
    layerBeingAdded.onLayerEntryRegisterInit(this.#handleLayerEntryRegisterInit.bind(this));

    // Register a callback when layer wants to send a message
    layerBeingAdded.onLayerMessage(this.#handleLayerMessage.bind(this));

    // Register a callback when a Group Layer has been created
    layerBeingAdded.onLayerGroupCreated(this.#handleLayerGroupCreated.bind(this));

    // Register a callback when a GV Layer has been created
    layerBeingAdded.onLayerGVCreated(this.#handleLayerGVCreated.bind(this));

    // Create a promise that the layer will be added on the map
    const promiseLayer = new Promise<void>((resolve, reject) => {
      // Continue the addition process
      layerBeingAdded
        .createGeoViewLayers(getStoreAppDisplayDateMode(this.getMapId()), this.getMapViewer().getProjection(), abortSignal)
        .then(() => {
          // Add the layer on the map
          this.#addToMap(layerBeingAdded, geoviewLayerConfig);

          // Resolve, done
          resolve();

          // Emit
          this.#emitLayerConfigAdded({ layer: layerBeingAdded });
        })
        .catch((error: unknown) => {
          // Reject it higher, because that's not where we want to handle the promise failure, we're returning the promise higher
          reject(formatError(error));
        });
    });

    // Return the layer with the promise it'll be on the map
    return { layer: layerBeingAdded, promiseLayer };
  }

  /**
   * Registers the layer identifier.
   *
   * @param layerConfig - The layer entry config to register
   */
  #registerLayerConfigInit(layerConfig: ConfigBaseClass): void {
    // Register it in the domain
    this.#layerDomain.registerLayerEntryConfig(layerConfig);
  }

  /**
   * Unregisters the layer in the Domain to stop managing it.
   *
   * @param layerConfig - The layer entry config to unregister
   * @param unregisterOrderedLayer - Should it be unregistered from orderedLayers
   */
  #unregisterLayerConfig(layerConfig: ConfigBaseClass, unregisterOrderedLayer: boolean = true): void {
    // Unregister from ordered layers
    if (unregisterOrderedLayer) {
      // Remove from ordered layers
      this.getControllersRegistry().layerController.removeOrderedLayerPath(layerConfig.layerPath);
    }

    // If the TimeSlider plugin is initialized
    if (isStoreTimeSliderInitialized(this.getMapId())) {
      // Remove from the TimeSlider
      removeStoreTimeSliderLayer(this.getMapId(), layerConfig.layerPath, () => {
        // Remove the tab
        this.getControllersRegistry().uiController.hideTabButton('time-slider');
      });
    }

    // If the geochart plugin is initialized
    if (isStoreGeochartInitialized(this.getMapId())) {
      // Remove from the GeoChart Charts
      this.getControllersRegistry().geoChartController?.removeChart(layerConfig.layerPath, () => {
        // Remove the tab
        this.getControllersRegistry().uiController.hideTabButton('geochart');
      });
    }

    // If the swiper plugin is initialized
    if (isStoreSwiperInitialized(this.getMapId())) {
      // Remove it from the Swiper
      this.getControllersRegistry().swiperController?.removeLayerPathIfExists(layerConfig.layerPath);
    }

    // Unregister from the domain
    this.#layerDomain.unregisterLayerEntryConfig(layerConfig);
  }

  /**
   * Gets all child paths from a parent path.
   *
   * @param parentPath - The parent path
   * @returns Child layer paths
   * @throws {LayerConfigNotFoundError} When the layer configuration couldn't be found at the given layer path
   * @throws {LayerWrongTypeError} When the layer configuration is of the wrong type at the given layer path
   */
  #getAllChildPaths(parentPath: string): string[] {
    // Get the group layer
    const parentLayerEntryConfig = this.getControllersRegistry().layerController.getLayerEntryConfigGroup(parentPath);

    // Return all the layer paths inside that group
    return parentLayerEntryConfig.getLayerPathsAll();
  }

  /**
   * Handles the initialization of a layer-entry registration event.
   *
   * This method is triggered when an additional layer-entry configuration
   * (typically created dynamically) needs to be registered in the map's
   * layer configuration system.
   *
   * Behavior:
   *  1. Checks whether a configuration for the given `layerPath` already exists.
   *  2. If it exists, unregisters the old configuration (without triggering
   *     cleanup actions tied to removal).
   *  3. Registers the new layer-entry configuration using `registerLayerConfigInit`.
   *
   * @param geoviewLayer - The GeoView layer associated with this registration event
   * @param event - The event containing the layer-entry configuration to be registered
   */
  #handleLayerEntryRegisterInit(geoviewLayer: AbstractGeoViewLayer, event: LayerEntryRegisterInitEvent): void {
    // Log
    logger.logTraceCore(
      `LAYERS - 1.5 - Registering an extra layer entry config ${event.config.layerPath} on map ${this.getMapId()}`,
      event.config
    );

    // If already existing
    const alreadyExisting = this.getControllersRegistry().layerController.getLayerEntryConfigIfExists(event.config.layerPath);
    if (alreadyExisting) {
      // Unregister the old one
      this.#unregisterLayerConfig(alreadyExisting, false);
    }

    // Register it
    this.#registerLayerConfigInit(event.config);
  }

  /**
   * Handles the creation of a GeoView layer (`GVLayer`) after its underlying
   * OL layer and configuration have been fully initialized.
   *
   * This method is triggered once a layer has completed its construction,
   * allowing the system to register it, attach handlers, and notify any
   * listeners that the layer is now ready for interaction.
   *
   * Behavior:
   *  1. Stores references to the GV layer and the underlying OL layer,
   *     indexed by their `layerPath`.
   *  2. Registers internal event handlers for the new layer.
   *  3. Emits a "layer created" event so external code can bind to it immediately.
   *  4. Calls the layer's `init()` method to finalize initialization.
   *
   * @param geoviewLayer - The parent or context GeoView layer associated with this creation event
   * @param event - The event containing the newly created GV layer instance and its configuration
   */
  #handleLayerGVCreated(geoviewLayer: AbstractGeoViewLayer, event: LayerGVCreatedEvent): void {
    // Get the GV Layer and the config
    const gvLayer = event.layer;
    const layerConfig = gvLayer.getLayerConfig();

    // Log
    logger.logTraceCore(
      `LAYERS - 9 - GV Layer created for ${layerConfig.layerPath} on map ${this.getMapId()}`,
      layerConfig.layerStatus,
      layerConfig
    );

    // Register in the domain
    this.#layerDomain.registerGVLayer(gvLayer);

    // Handle text layer for vector layers
    if (gvLayer instanceof AbstractGVVector) {
      const textLayer = gvLayer.getTextOLLayer();
      if (textLayer) {
        this.getMapViewer().map.addLayer(textLayer);
      }
    }

    // Emit about its creation so that one can attach events on it right away if necessary
    this.#emitLayerCreated({ layer: gvLayer });
  }

  /**
   * Handles the creation of a GeoView group layer (`GVGroupLayer`).
   *
   * This method is invoked once a group layer has been fully instantiated,
   * allowing the system to register it, attach handlers, and initialize its
   * visibility constraints.
   *
   * Behavior:
   *  1. Stores references to the GV group layer and its corresponding
   *     OpenLayers layer, indexed by `layerPath`.
   *  2. Registers internal event handlers specific to group layers.
   *  3. Computes and stores the layer's initial "in visible range" state.
   *
   * @param geoviewLayer - The parent or context layer
   *   associated with this creation event.
   * @param event - The event containing the newly
   *   created group layer instance and its configuration.
   */
  #handleLayerGroupCreated(geoviewLayer: AbstractGeoViewLayer, event: LayerGroupCreatedEvent): void {
    // Get the Group Layer and the config
    const groupLayer = event.layer;
    const layerConfig = groupLayer.getLayerConfig();

    // Log
    logger.logTraceCore(
      `LAYERS - 7 - Group Layer created for ${layerConfig.layerPath} on map ${this.getMapId()}`,
      layerConfig.layerStatus,
      layerConfig
    );

    // Register in the domain
    this.#layerDomain.registerGVLayer(groupLayer);

    // TODO: REFACTOR - Think about moving this call somewhere else
    // Set in visible range property for all newly added layers
    this.getControllersRegistry().layerController.updateLayerInVisibleRange(groupLayer);
  }

  /**
   * Handles layer-specific messages and displays them through the map viewer's notification system.
   *
   * @param layer - The layer instance that triggered the message
   * @param layerMessageEvent - The message event containing notification details
   *
   * @example
   * handleLayerMessage(myLayer, {
   *   messageKey: 'layers.fetchProgress',
   *   messageParams: [50, 100],
   *   messageType: 'error',
   *   notification: true
   * });
   */
  #handleLayerMessage(layer: AbstractGeoViewLayer, layerMessageEvent: LayerMessageEvent): void {
    // Read event params for clarity
    const { messageType } = layerMessageEvent;
    const { messageKey } = layerMessageEvent;
    const { messageParams } = layerMessageEvent;
    const { notification } = layerMessageEvent;

    if (messageType === 'info') {
      this.getMapViewer().notifications.showMessage(messageKey, messageParams, notification);
    } else if (messageType === 'warning') {
      this.getMapViewer().notifications.showWarning(messageKey, messageParams, notification);
    } else if (messageType === 'error') {
      this.getMapViewer().notifications.showError(messageKey, messageParams, notification);
    } else if (messageType === 'success') {
      this.getMapViewer().notifications.showSuccess(messageKey, messageParams, notification);
    }
  }

  /**
   * Continues the addition of the geoview layer.
   * Adds the layer to the map if valid. If not (is a string) emits an error.
   *
   * @param geoviewLayer - The layer
   */
  #addToMap(geoviewLayer: AbstractGeoViewLayer, geoviewLayerConfig: TypeGeoviewLayerConfig): void {
    // If no root layer is set, forget about it
    if (!geoviewLayer.olRootLayer) return;

    // If all layer status are good
    if (!geoviewLayer.allLayerStatusAreGreaterThanOrEqualTo('error')) {
      // Add the OpenLayers layer to the map officially
      this.getMapViewer().map.addLayer(geoviewLayer.olRootLayer);

      // Log
      logger.logInfo(`GeoView Layer ${geoviewLayer.getGeoviewLayerId()} added to map ${this.getMapId()}`, geoviewLayer);

      // GV: KML currently has no style or symbology associated with it, so we warn the user
      if (geoviewLayerConfig.geoviewLayerType === CONST_LAYER_TYPES.KML)
        this.getMapViewer().notifications.showWarning('warning.layer.kmlLayerWarning', [], true);

      // Set the layer z indices
      this.getControllersRegistry().layerController.setLayerZIndices();
    }
  }

  /**
   * Adds initial filters to layers, if provided.
   *
   * @param layerConfig - The layer config being processed
   */
  #addInitialFilters(layerConfig: ConfigBaseClass): void {
    // If correct subclass, otherwise skip
    if (layerConfig instanceof AbstractBaseLayerEntryConfig) {
      // Get the layer filter
      const layerFilter = layerConfig.getLayerFilter();

      // If any layer filter
      if (layerFilter) {
        // Save to the store
        addStoreLayerInitialFilter(this.getMapId(), layerConfig.layerPath, layerFilter);
      }
    }
  }

  /**
   * Validates the geoview layer configuration array to eliminate duplicate entries and inform the user.
   *
   * @param mapConfigLayerEntries - The Map Config Layer Entries to validate
   * @returns The new configuration with duplicate entries eliminated
   */
  #deleteDuplicateAndMultipleUuidGeoviewLayerConfig(mapConfigLayerEntries?: MapConfigLayerEntry[]): MapConfigLayerEntry[] {
    if (mapConfigLayerEntries && mapConfigLayerEntries.length > 0) {
      const validGeoviewLayerConfigs = mapConfigLayerEntries.filter((geoviewLayerConfigToCreate, configToCreateIndex) => {
        for (let configToTestIndex = 0; configToTestIndex < mapConfigLayerEntries.length; configToTestIndex++) {
          if (
            geoviewLayerConfigToCreate.geoviewLayerId === mapConfigLayerEntries[configToTestIndex].geoviewLayerId &&
            // We keep the first instance of the duplicate entry.
            configToCreateIndex > configToTestIndex
          ) {
            this.#printDuplicateGeoviewLayerConfigError(geoviewLayerConfigToCreate);

            // Remove geoCore ordered layer placeholder
            this.getControllersRegistry().layerController.removeOrderedLayerPath(geoviewLayerConfigToCreate.geoviewLayerId, false);

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
   *
   * @param mapConfigLayerEntry - The Map Config Layer Entry in error
   */
  #printDuplicateGeoviewLayerConfigError(mapConfigLayerEntry: MapConfigLayerEntry): void {
    // Log
    logger.logError(`Duplicate use of geoview layer identifier ${mapConfigLayerEntry.geoviewLayerId} on map ${this.getMapId()}`);

    // Show the error
    this.getMapViewer().notifications.showError('validation.layer.usedtwice', [mapConfigLayerEntry.geoviewLayerId]);
  }

  // #endregion PRIVATE METHODS

  // #region STATIC METHODS

  /**
   * Creates an instance of a specific `AbstractGeoViewLayer` subclass based on the given GeoView layer configuration.
   *
   * This function determines the correct layer type from the configuration and instantiates it accordingly.
   * Supports GeoJSON, CSV, WMS, Esri Dynamic, Esri Feature, Esri Image, GeoTIFF, ImageStatic, KML, WFS, WKB,
   * OGC Feature, XYZ Tiles, and Vector Tiles. Throws if the layer type is unsupported.
   *
   * TODO: Refactor to use the validated configuration with metadata already fetched.
   *
   * @param geoviewLayerConfig - The configuration object for the GeoView layer
   * @returns An instance of the corresponding `AbstractGeoViewLayer` subclass
   * @throws {NotSupportedError} When the configuration does not match any supported layer type
   */
  static createLayerConfigFromType(geoviewLayerConfig: TypeGeoviewLayerConfig): AbstractGeoViewLayer {
    // Depending on the layer type of config
    if (CsvLayerEntryConfig.isClassOrTypeCSV(geoviewLayerConfig)) {
      return new CSV(geoviewLayerConfig);
    }
    if (EsriDynamicLayerEntryConfig.isClassOrTypeEsriDynamic(geoviewLayerConfig)) {
      return new EsriDynamic(geoviewLayerConfig);
    }
    if (EsriFeatureLayerEntryConfig.isClassOrTypeEsriFeature(geoviewLayerConfig)) {
      return new EsriFeature(geoviewLayerConfig);
    }
    if (EsriImageLayerEntryConfig.isClassOrTypeEsriImage(geoviewLayerConfig)) {
      return new EsriImage(geoviewLayerConfig);
    }
    if (GeoJSONLayerEntryConfig.isClassOrTypeGeoJSON(geoviewLayerConfig)) {
      return new GeoJSON(geoviewLayerConfig);
    }
    if (GeoTIFFLayerEntryConfig.isClassOrTypeGeoTIFF(geoviewLayerConfig)) {
      return new GeoTIFF(geoviewLayerConfig);
    }
    if (ImageStaticLayerEntryConfig.isClassOrTypeImageStatic(geoviewLayerConfig)) {
      return new ImageStatic(geoviewLayerConfig);
    }
    if (KmlLayerEntryConfig.isClassOrTypeKMLLayer(geoviewLayerConfig)) {
      return new KML(geoviewLayerConfig);
    }
    if (OgcFeatureLayerEntryConfig.isClassOrTypeOGCLayer(geoviewLayerConfig)) {
      return new OgcFeature(geoviewLayerConfig);
    }
    if (VectorTilesLayerEntryConfig.isClassOrTypeVectorTiles(geoviewLayerConfig)) {
      return new VectorTiles(geoviewLayerConfig);
    }
    if (OgcWfsLayerEntryConfig.isClassOrTypeWFSLayer(geoviewLayerConfig)) {
      return new WFS(geoviewLayerConfig);
    }
    if (WkbLayerEntryConfig.isClassOrTypeWKBLayer(geoviewLayerConfig)) {
      return new WKB(geoviewLayerConfig);
    }
    if (OgcWmsLayerEntryConfig.isClassOrTypeWMS(geoviewLayerConfig)) {
      return new WMS(geoviewLayerConfig);
    }
    if (OgcWmtsLayerEntryConfig.isClassOrTypeWMTS(geoviewLayerConfig)) {
      return new WMTS(geoviewLayerConfig);
    }
    if (XYZTilesLayerEntryConfig.isClassOrTypeXYZTiles(geoviewLayerConfig)) {
      return new XYZTiles(geoviewLayerConfig);
    }

    // Not implemented
    throw new NotSupportedError('Unsupported layer class type in createLayerConfigFromType');
  }

  /**
   * Converts a list of map configuration layer entries into an array of promises,
   * each resolving to one or more GeoView layer configuration objects.
   *
   * @param mapId - The unique identifier of the map instance this configuration applies to
   * @param language - The language setting used for layer labels and metadata
   * @param mapConfigLayerEntries - The array of layer entries to convert
   * @param addGeoChartCallback - Callback invoked when a geochart configuration is initialized during layer processing
   * @param errorCallback - Callback invoked when an error occurs during layer processing
   * @returns An array of promises, each resolving to a TypeGeoviewLayerConfig object
   */
  static convertMapConfigsToGeoviewLayerConfig(
    mapId: string,
    currentLayerIds: string[],
    language: TypeDisplayLanguage,
    mapConfigLayerEntries: MapConfigLayerEntry[],
    addGeoChartCallback: (layerPath: string, geochartConfig: GeoViewGeoChartConfig) => void,
    errorCallback: (mapConfigLayerEntry: MapConfigLayerEntry, error: unknown) => void
  ): Promise<TypeGeoviewLayerConfig>[] {
    // For each layer entry
    return mapConfigLayerEntries.map((entry) => {
      // Redirect
      return this.convertMapConfigToGeoviewLayerConfig(mapId, currentLayerIds, language, entry, addGeoChartCallback, errorCallback);
    });
  }

  /**
   * Converts a map configuration layer entry into a promise of a GeoView layer configuration.
   *
   * Depending on the type of the layer entry (e.g., GeoCore, GeoPackage, Shapefile, RCS, or standard GeoView),
   * this function processes each entry accordingly and wraps the result in a `Promise`.
   * Errors encountered during asynchronous operations are handled via a provided callback.
   *
   * @param mapId - The unique identifier of the map instance this configuration applies to
   * @param language - The language setting used for layer labels and metadata
   * @param entry - The array of layer entry to convert
   * @param addGeoChartCallback - Callback invoked when a geochart configuration is initialized during layer processing
   * @param errorCallback - Callback invoked when an error occurs during layer processing
   * @returns A promise that resolves to a TypeGeoviewLayerConfig object
   */
  static convertMapConfigToGeoviewLayerConfig(
    mapId: string,
    currentLayerIds: string[],
    language: TypeDisplayLanguage,
    entry: MapConfigLayerEntry,
    addGeoChartCallback: (layerPath: string, geochartConfig: GeoViewGeoChartConfig) => void,
    errorCallback: (mapConfigLayerEntry: MapConfigLayerEntry, error: unknown) => void
  ): Promise<TypeGeoviewLayerConfig> {
    // Depending on the map config layer entry type
    let promise: Promise<TypeGeoviewLayerConfig>;
    if (mapConfigLayerEntryIsGeoCore(entry)) {
      // Working with a GeoCore layer
      promise = GeoCore.createLayerConfigFromUUID(entry.geoviewLayerId, currentLayerIds, language, mapId, entry).then((response) => {
        // If a Geochart is initialized
        if (isStoreGeochartInitialized(mapId)) {
          // For each geocharts configuration
          Object.entries(response.geocharts).forEach(([layerPath, geochartConfig]) => {
            // Callback
            addGeoChartCallback(layerPath, geochartConfig);
          });
        }
        return response.config;
      });
    } else if (mapConfigLayerEntryIsGeoPackage(entry)) {
      // Working with a geopackage layer
      promise = GeoPackageReader.createLayerConfigFromGeoPackage(entry);
    } else if (mapConfigLayerEntryIsShapefile(entry)) {
      // Working with a shapefile layer
      promise = ShapefileReader.convertShapefileConfigToGeoJson(entry);
    } else if (mapConfigLayerEntryIsRCS(entry)) {
      // Working with a RCS (Geocore subset) layer
      promise = GeoCore.createLayerConfigFromRCSUUID(entry.geoviewLayerId, language, mapId);
    } else {
      // Working with a standard GeoView layer
      promise = Promise.resolve(entry);
    }

    // Prepare to catch errors
    promise.catch((error) => {
      // Callback
      errorCallback?.(entry, error);
    });

    return promise;
  }

  // #endregion STATIC METHODS

  // #region EVENTS

  /**
   * Emits an event to all handlers when a layer config has been added.
   *
   * @param event - The event to emit
   */
  #emitLayerConfigAdded(event: LayerBuilderEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerConfigAddedHandlers, event);
  }

  /**
   * Registers a layer config added event handler.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onLayerConfigAdded(callback: LayerBuilderDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLayerConfigAddedHandlers, callback);
  }

  /**
   * Unregisters a layer config added event handler.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offLayerConfigAdded(callback: LayerBuilderDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerConfigAddedHandlers, callback);
  }

  /**
   * Emits an event to all handlers when a layer config has been flag as error.
   *
   * @param event - The event to emit
   */
  #emitLayerConfigError(event: LayerConfigErrorEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerConfigErrorHandlers, event);
  }

  /**
   * Registers a layer config error event handler.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onLayerConfigError(callback: LayerConfigErrorDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLayerConfigErrorHandlers, callback);
  }

  /**
   * Unregisters a layer config error event handler.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offLayerConfigError(callback: LayerConfigErrorDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerConfigErrorHandlers, callback);
  }

  /**
   * Emits an event to all handlers.
   *
   * @param event - The event to emit
   */
  #emitLayerConfigRemoved(event: LayerPathEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerConfigRemovedHandlers, event);
  }

  /**
   * Registers a layer removed event handler.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onLayerConfigRemoved(callback: LayerPathDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLayerConfigRemovedHandlers, callback);
  }

  /**
   * Unregisters a layer removed event handler.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offLayerConfigRemoved(callback: LayerPathDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerConfigRemovedHandlers, callback);
  }

  /**
   * Emits an event to all handlers.
   *
   * @param event - The event to emit
   */
  #emitLayerCreated(event: LayerEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerCreatedHandlers, event);
  }

  /**
   * Registers a layer created event handler.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onLayerCreated(callback: LayerDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLayerCreatedHandlers, callback);
  }

  /**
   * Unregisters a layer created event handler.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offLayerCreated(callback: LayerDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerCreatedHandlers, callback);
  }

  // #endregion EVENTS
}

/** Represents the result of adding a GeoView layer. */
export type GeoViewLayerAddedResult = {
  /** The created GeoView layer instance. */
  layer: AbstractGeoViewLayer;
  /** A promise that resolves when the layer is fully loaded. */
  promiseLayer: Promise<void>;
};

/** Defines the event payload for the layer loaded delegate. */
export type LayerEvent = {
  /** The loaded layer. */
  layer: AbstractGVLayer;
};

/** Defines a delegate for the layer loaded event handler function signature. */
export type LayerDelegate = EventDelegateBase<LayerCreatorController, LayerEvent, void>;

/** Defines the event payload for the layer path delegate. */
export type LayerPathEvent = {
  /** The layer path. */
  layerPath: string;

  /** The layer name. */
  layerName: string;
};

/** Defines a delegate for the layer path event handler function signature. */
export type LayerPathDelegate = EventDelegateBase<LayerCreatorController, LayerPathEvent, void>;

/** Defines the event payload for the layer builder delegate. */
export type LayerBuilderEvent = {
  /** The built layer. */
  layer: AbstractGeoViewLayer;
};

/** Defines a delegate for the layer builder event handler function signature. */
export type LayerBuilderDelegate = EventDelegateBase<LayerCreatorController, LayerBuilderEvent, void>;

/** Defines the event payload for the layer config error delegate. */
export type LayerConfigErrorEvent = {
  /** The layer path (or the geoview layer id) depending when the error occurs in the process. */
  layerPath: string;

  /** The error message. */
  error: string;
};

/** Defines a delegate for the layer config error event handler function signature. */
export type LayerConfigErrorDelegate = EventDelegateBase<LayerCreatorController, LayerConfigErrorEvent, void>;
