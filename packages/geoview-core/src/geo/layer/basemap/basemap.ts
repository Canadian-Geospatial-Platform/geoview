import axios, { AxiosResponse } from 'axios';

import { Extent } from 'ol/extent';
import { XYZ, OSM } from 'ol/source';
import TileGrid from 'ol/tilegrid/TileGrid';
import TileLayer from 'ol/layer/Tile';

import { TypeBasemapOptions, TypeValidMapProjectionCodes, TypeDisplayLanguage } from '@config/types/map-schema-types';
import { EventDelegateBase, api } from '@/app';
import { TypeJsonObject, toJsonObject, TypeJsonArray } from '@/core/types/global-types';
import { getLocalizedMessage } from '@/core/utils/utilities';
import { TypeBasemapProps, TypeBasemapLayer } from '@/geo/layer/basemap/basemap-types';
import { Projection } from '@/geo/utils/projection';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import { AppEventProcessor } from '@/api/event-processors/event-processor-children/app-event-processor';
import { logger } from '@/core/utils/logger';
import EventHelper from '@/api/events/event-helper';

/**
 * A class to get a Basemap for a define projection and language. For the moment, a list maps are available and
 * can be filtered by projection (currently only WM and LCC projections are listed,
 * in case other projections needed, they need to be added to the list)
 *
 * @exports
 * @class Basemap
 */
export class Basemap {
  // The maximum delay to wait before we abandon(?) a basemap
  static REQUEST_DELAY_MAX = 3000;

  // Active basemap
  activeBasemap?: TypeBasemapProps;

  // Default origin
  defaultOrigin?: number[];

  // Default resolution
  defaultResolutions?: number[];

  // Default extent
  defaultExtent?: Extent;

  // Default overview map layer
  overviewMap?: TypeBasemapProps;

  // The basemap options passed from the map config
  basemapOptions: TypeBasemapOptions;

  // The map id to be used in events
  mapId: string;

  /**
   * Initialize basemap.
   * @param {TypeBasemapOptions} basemapOptions - Optional basemap option properties, passed in from map config.
   * @param {string} mapId - The map id.
   */
  constructor(basemapOptions: TypeBasemapOptions, mapId: string) {
    this.mapId = mapId;

    this.basemapOptions = basemapOptions;

    // Create the overview default basemap (no label, no shaded)
    this.setOverviewMap().catch((error) => {
      // Log
      logger.logPromiseFailed('setOverviewMap in constructor of layer/basemap', error);
    });
  }

  /**
   * Basemap list
   */
  basemapsList: TypeJsonObject = toJsonObject({
    3978: {
      transport: {
        url: 'https://maps-cartes.services.geo.ca/server2_serveur2/rest/services/BaseMaps/CBMT_CBCT_GEOM_3978/MapServer/WMTS/tile/1.0.0/CBMT_CBCT_GEOM_3978/default/default028mm/{z}/{y}/{x}.jpg',
        jsonUrl: 'https://maps-cartes.services.geo.ca/server2_serveur2/rest/services/BaseMaps/CBMT_CBCT_GEOM_3978/MapServer?f=json',
      },
      simple: {
        url: 'https://maps-cartes.services.geo.ca/server2_serveur2/rest/services/BaseMaps/Simple/MapServer/WMTS/tile/1.0.0/Simple/default/default028mm/{z}/{y}/{x}.jpg',
        jsonUrl: 'https://maps-cartes.services.geo.ca/server2_serveur2/rest/services/BaseMaps/Simple/MapServer?f=json',
      },
      shaded: {
        url: 'https://maps-cartes.services.geo.ca/server2_serveur2/rest/services/BaseMaps/CBME_CBCE_HS_RO_3978/MapServer/WMTS/tile/1.0.0/CBMT_CBCT_GEOM_3978/default/default028mm/{z}/{y}/{x}.jpg',
        jsonUrl: 'https://maps-cartes.services.geo.ca/server2_serveur2/rest/services/BaseMaps/CBME_CBCE_HS_RO_3978/MapServer?f=json',
      },
      label: {
        url: 'https://maps-cartes.services.geo.ca/server2_serveur2/rest/services/BaseMaps/xxxx_TXT_3978/MapServer/WMTS/tile/1.0.0/xxxx_TXT_3978/default/default028mm/{z}/{y}/{x}.jpg',
        jsonUrl: 'https://maps-cartes.services.geo.ca/server2_serveur2/rest/services/BaseMaps/xxxx_TXT_3978/MapServer?f=json',
      },
      imagery: {
        url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        jsonUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/?f=json',
      },
    },
    3857: {
      transport: {
        url: 'https://maps-cartes.services.geo.ca/server2_serveur2/rest/services/BaseMaps/CBMT_CBCT_GEOM_3857/MapServer/WMTS/tile/1.0.0/BaseMaps_CBMT_CBCT_GEOM_3857/default/default028mm/{z}/{y}/{x}.jpg',
        jsonUrl: 'https://maps-cartes.services.geo.ca/server2_serveur2/rest/services/BaseMaps/CBMT_CBCT_GEOM_3857/MapServer?f=json',
      },
      simple: {
        url: 'https://maps-cartes.services.geo.ca/server2_serveur2/rest/services/BaseMaps/Simple/MapServer/WMTS/tile/1.0.0/Simple/default/default028mm/{z}/{y}/{x}.jpg',
        jsonUrl: 'https://maps-cartes.services.geo.ca/server2_serveur2/rest/services/BaseMaps/Simple/MapServer?f=json',
      },
      shaded: {
        url: 'https://maps-cartes.services.geo.ca/server2_serveur2/rest/services/BaseMaps/CBME_CBCE_HS_RO_3978/MapServer/WMTS/tile/1.0.0/CBMT_CBCT_GEOM_3978/default/default028mm/{z}/{y}/{x}.jpg',
        jsonUrl: 'https://maps-cartes.services.geo.ca/server2_serveur2/rest/services/BaseMaps/CBME_CBCE_HS_RO_3978/MapServer?f=json',
      },
      label: {
        url: 'https://maps-cartes.services.geo.ca/server2_serveur2/rest/services/BaseMaps/xxxx_TXT_3857/MapServer/WMTS/tile/1.0.0/xxxx_TXT_3857/default/default028mm/{z}/{y}/{x}.jpg',
        jsonUrl: 'https://maps-cartes.services.geo.ca/server2_serveur2/rest/services/BaseMaps/xxxx_TXT_3857/MapServer?f=json',
      },
      imagery: {
        url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        jsonUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/?f=json',
      },
    },
  });

  // Keep all callback delegates references
  #onBasemapChangedHandlers: BasemapChangedDelegate[] = [];

  // #region PRIVATE UTILITY FUNCTIONS

  /**
   * Get projection from basemap url
   * Because OpenLayers can reproject on the fly raster, some like Shaded and Simple even if only available in 3978
   * can be use in 3857. For this we need to make a difference between map projection and url use for the basemap
   * @param {string} url - Basemap url
   * @returns {number} Projection code
   * @private
   */
  static #getProjectionFromUrl(url: string): number {
    let code = 0;
    const index = url.indexOf('/MapServer');

    if (url.substring(index - 6, index) === 'Simple') code = 3978;
    else code = Number(url.substring(index - 4, index));

    return code;
  }
  // #endregion

  // #region OVERVIEW MAP
  async setOverviewMap(): Promise<void> {
    const overviewMap = await this.createCoreBasemap({ basemapId: 'transport', shaded: false, labeled: false });

    if (overviewMap) this.overviewMap = overviewMap;
    else {
      // TODO: find a more centralized way to trap error and display message
      api.maps[this.mapId].notifications.showError('mapctrl.overviewmap.error');
    }
  }

  getOverviewMap(): TypeBasemapProps | undefined {
    return this.overviewMap;
  }
  // #endregion

  // #region CREATE BASEMAPS

  /**
   * Create a basemap layer.
   * @param {string} basemapId - The id of the layer.
   * @param {TypeJsonObject} basemapLayer - The basemap layer url and json url.
   * @param {number} opacity - The opacity to use for this layer.
   * @param {boolean} rest - Should we do a get request to get the info from the server.
   * @returns {TypeBasemapLayer} The created basemap layer.
   * @private
   */
  async #createBasemapLayer(
    basemapId: string,
    basemapLayer: TypeJsonObject,
    opacity: number,
    rest: boolean,
  ): Promise<null | TypeBasemapLayer> {
    const resolutions: number[] = [];
    let minZoom = 0;
    let maxZoom = 17;
    let extent: Extent = [0, 0, 0, 0];
    let origin: number[] = [];
    let urlProj = 0;

    // ? The actual response expected by AxiosResponse is `any`
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function requestBasemap(url: string, timeout: number): Promise<AxiosResponse<any, any>> {
      return new Promise((resolve, reject) => {
        axios.get(url).then(resolve, reject);
        setTimeout(reject, timeout);
      });
    }

    // Should we do a get request to get the layer information from the server?
    if (rest && (basemapLayer.jsonUrl as string)) {
      try {
        // Get info from server
        // TODO: Check/Refactor - Document the necessity to explicitely reject after Basemap.REQUEST_DELAY_MAX
        const request = await requestBasemap(basemapLayer.jsonUrl as string, Basemap.REQUEST_DELAY_MAX);

        if (request) {
          const result = toJsonObject(request.data);

          // Get minimum scale
          const minScale = result.minScale as number;

          // Get maximum scale
          const maxScale = result.maxScale as number;

          // Get extent
          const fullExtent = toJsonObject(result.fullExtent);

          // Get the tile grid info
          const tileInfo = toJsonObject(result.tileInfo);

          const lods: TypeJsonObject = {};

          // Get resolutions and scale from tile grid info
          (tileInfo.lods as TypeJsonArray)?.forEach((lod) => {
            const scale = lod.scale as number;
            const resolution = lod.resolution as number;

            resolutions.push(resolution);

            lods[scale] = lod;
          });

          // Set layer origin
          origin = [tileInfo?.origin?.x || 0, tileInfo?.origin?.y || 0] as number[];

          // set minimum zoom for this layer
          minZoom = lods[minScale] ? (lods[minScale].level as number) : 0;

          // Set max zoom for this layer
          maxZoom = lods[maxScale] ? (lods[maxScale].level as number) : 23;

          // Set extent for this layer
          extent = [fullExtent.xmin as number, fullExtent.ymin as number, fullExtent.xmax as number, fullExtent.ymax as number];

          // Because OpenLayers can reproject on the fly raster, some like Shaded and Simple even if only available in 3978
          // can be use in 3857. For this we need to make a difference between map projection and url use for the basemap
          urlProj = Basemap.#getProjectionFromUrl(basemapLayer.url as string);

          // Return a basemap layer
          return {
            basemapId,
            type: basemapId,
            url: basemapLayer.url as string,
            jsonUrl: basemapLayer.jsonUrl as string,
            source: new XYZ({
              attributions: getLocalizedMessage('mapctrl.attribution.defaultnrcan', AppEventProcessor.getDisplayLanguage(this.mapId)),
              projection: Projection.PROJECTIONS[urlProj],
              url: basemapLayer.url as string,
              crossOrigin: 'Anonymous',
              tileGrid: new TileGrid({
                extent,
                origin,
                resolutions,
              }),
            }),
            opacity,
            origin,
            extent,
            resolutions, // ? is this use somewhere, modifying values has no effect. Issue 643
            minScale: minZoom, // ? is this use somewhere, modifying values has no effect. Issue 643
            maxScale: maxZoom, // ? is this use somewhere, modifying values has no effect. Issue 643
          };
        }
      } catch (error) {
        return null;
      }
    }
    return null;
  }

  /**
   * Create the core basemap and add the layers to it.
   * @param {TypeBasemapOptions} basemapOptions - Basemap options.
   * @param {TypeValidMapProjectionCodes} projection - Optional projection code.
   * @param {TypeDisplayLanguage} language - Optional language.
   * @return {Promise<TypeBasemapProps | undefined>} The core basemap.
   */
  async createCoreBasemap(
    basemapOptions: TypeBasemapOptions,
    projection?: TypeValidMapProjectionCodes,
    language?: TypeDisplayLanguage,
  ): Promise<TypeBasemapProps | undefined> {
    const basemapLayers: TypeBasemapLayer[] = [];
    const basemaplayerTypes: string[] = [];
    const defaultOpacity = 1;

    let defaultOrigin: number[] | undefined;
    let defaultExtent: Extent | undefined;
    let defaultResolutions: number[] | undefined;
    let minZoom = 0;
    let maxZoom = 17;

    // Check if projection is provided for the basemap creation
    const projectionCode = projection === undefined ? MapEventProcessor.getMapState(this.mapId).currentProjection : projection;

    // Check if language is provided for the basemap creation
    const languageCode = language === undefined ? AppEventProcessor.getDisplayLanguage(this.mapId) : language;

    // Check if basemap options are provided for the basemap creation
    const coreBasemapOptions = basemapOptions === undefined ? this.basemapOptions : basemapOptions;

    if (coreBasemapOptions) {
      // Create shaded layer
      if (coreBasemapOptions.shaded && this.basemapsList[projectionCode].shaded) {
        const shadedLayer = await this.#createBasemapLayer('shaded', this.basemapsList[projectionCode].shaded, defaultOpacity, true);
        if (shadedLayer) {
          basemapLayers.push(shadedLayer);
          basemaplayerTypes.push('shaded');
        }
      }

      // Create transport layer
      if (coreBasemapOptions.basemapId === 'transport' && this.basemapsList[projectionCode].transport) {
        const transportLayer = await this.#createBasemapLayer(
          'transport',
          this.basemapsList[projectionCode].transport,
          coreBasemapOptions.shaded ? 0.75 : defaultOpacity,
          true,
        );
        if (transportLayer) {
          basemapLayers.push(transportLayer);
          basemaplayerTypes.push('transport');

          // Set default origin,extent,resolutions from layer
          defaultOrigin = transportLayer.origin;
          defaultExtent = transportLayer.extent;
          defaultResolutions = transportLayer.resolutions;
          minZoom = transportLayer.minScale;
          maxZoom = transportLayer.maxScale;
        }
      }

      // Create simple layer
      if (coreBasemapOptions.basemapId === 'simple' && this.basemapsList[projectionCode].simple) {
        const simpleLayer = await this.#createBasemapLayer(
          'simple',
          this.basemapsList[projectionCode].simple,
          coreBasemapOptions.shaded ? 0.75 : defaultOpacity,
          true,
        );

        if (simpleLayer) {
          basemapLayers.push(simpleLayer);
          basemaplayerTypes.push('simple');

          // Set default origin,extent,resolutions from layer
          defaultOrigin = simpleLayer.origin;
          defaultExtent = simpleLayer.extent;
          defaultResolutions = simpleLayer.resolutions;
          minZoom = simpleLayer.minScale;
          maxZoom = simpleLayer.maxScale;
        }
      }

      // Create open street maps layer
      if (coreBasemapOptions.basemapId === 'osm') {
        basemapLayers.push({
          basemapId: 'osm',
          type: 'osm',
          source: new OSM({ crossOrigin: 'Anonymous' }),
          opacity: coreBasemapOptions.shaded ? 0.75 : defaultOpacity,
          origin: [],
          extent: [],
          resolutions: [],
          minScale: minZoom,
          maxScale: maxZoom,
        });
        basemaplayerTypes.push('osm');
      }

      // No geometry basemap layer
      if (coreBasemapOptions.basemapId === 'nogeom') {
        basemaplayerTypes.push('nogeom');
      }

      // Create imagery layer
      if (coreBasemapOptions.basemapId === 'imagery' && this.basemapsList[projectionCode].imagery) {
        const imageryLayer = await this.#createBasemapLayer(
          'imagery',
          this.basemapsList[projectionCode].imagery,
          coreBasemapOptions.shaded ? 0.75 : defaultOpacity,
          true,
        );
        if (imageryLayer) {
          basemapLayers.push(imageryLayer);
          basemaplayerTypes.push('imagery');

          // Set default origin,extent,resolutions from layer
          defaultOrigin = imageryLayer.origin;
          defaultExtent = imageryLayer.extent;
          defaultResolutions = imageryLayer.resolutions;
          minZoom = imageryLayer.minScale;
          maxZoom = imageryLayer.maxScale;
        }
      }

      if (basemapLayers.length && coreBasemapOptions.labeled) {
        const labelLayer = await this.#createBasemapLayer(
          'label',
          toJsonObject({
            url: (this.basemapsList[projectionCode].label.url as string)?.replaceAll('xxxx', languageCode === 'en' ? 'CBMT' : 'CBCT'),
            jsonUrl: (this.basemapsList[projectionCode].label.jsonUrl as string)?.replaceAll(
              'xxxx',
              languageCode === 'en' ? 'CBMT' : 'CBCT',
            ),
          }),
          0.8,
          true,
        );
        if (labelLayer) {
          basemapLayers.push(labelLayer);
          basemaplayerTypes.push('label');
        }
      }
    }

    if (basemapLayers.length > 0 || (basemapLayers.length === 0 && coreBasemapOptions.basemapId === 'nogeom')) {
      // Id and type are derived from the basemap type composition (shaded, label, transport, simple)
      const basemap = {
        basemapId: basemaplayerTypes.join(''),
        layers: basemapLayers,
        type: basemaplayerTypes.join('-'),
        basemapOptions: coreBasemapOptions,
        attribution:
          coreBasemapOptions.basemapId === 'osm'
            ? [
                '© OpenStreetMap',
                getLocalizedMessage('mapctrl.attribution.defaultnrcan', AppEventProcessor.getDisplayLanguage(this.mapId)),
              ]
            : [getLocalizedMessage('mapctrl.attribution.defaultnrcan', AppEventProcessor.getDisplayLanguage(this.mapId))],
        zoomLevels: {
          min: minZoom,
          max: maxZoom,
        },
        defaultExtent,
        defaultOrigin,
        defaultResolutions,
        name: '',
        description: '',
        descSummary: '',
        altText: '',
        thumbnailUrl: '',
      };

      return basemap;
    }

    // No basemap set
    return undefined;
  }

  /**
   * Create a custom basemap.
   * @param {TypeBasemapProps} basemapProps - Basemap properties.
   * @param {TypeValidMapProjectionCodes} projection - Projection code.
   * @param {TypeDisplayLanguage} language - Optional language.
   * @returns {TypeBasemapProps} The created custom basemap.
   */
  createCustomBasemap(
    basemapProps: TypeBasemapProps,
    projection: TypeValidMapProjectionCodes,
    language?: TypeDisplayLanguage,
  ): TypeBasemapProps {
    interface bilingual {
      en: string;
      fr: string;
    }

    // Extract bilangual sections
    const name: bilingual = basemapProps.name as unknown as bilingual;
    const description: bilingual = basemapProps.description as unknown as bilingual;
    const thumbnailUrl: bilingual = basemapProps.thumbnailUrl as unknown as bilingual;
    const attribution: bilingual = basemapProps.attribution as unknown as bilingual;

    // Check if language is provided for the basemap creation
    const languageCode = language === undefined ? AppEventProcessor.getDisplayLanguage(this.mapId) : language;

    // Create the basemap properties
    const formatProps: TypeBasemapProps = { ...basemapProps };
    formatProps.name = languageCode === 'en' ? name.en : name.fr;
    formatProps.layers = basemapProps.layers.map((layer) => {
      return {
        ...layer,
        url: languageCode === 'en' ? (layer.url as unknown as bilingual).en : (layer.url as unknown as bilingual).fr,
        source: new XYZ({
          attributions: attribution[languageCode],
          projection: Projection.PROJECTIONS[projection],
          url: languageCode === 'en' ? (layer.url as unknown as bilingual).en : (layer.url as unknown as bilingual).fr,
          crossOrigin: 'Anonymous',
          tileGrid: new TileGrid({
            extent: this.defaultExtent,
            origin: this.defaultOrigin,
            resolutions: this.defaultResolutions!,
          }),
        }),
      };
    });
    formatProps.type = 'test';
    formatProps.description = languageCode === 'en' ? description.en : description.fr;
    formatProps.altText = languageCode === 'en' ? description.en : description.fr;
    formatProps.thumbnailUrl = languageCode === 'en' ? thumbnailUrl.en : thumbnailUrl.fr;
    formatProps.attribution = languageCode === 'en' ? [attribution.en] : [attribution.fr];

    return formatProps;
  }
  // #endregion

  /**
   * Load the default basemap that was passed in the map config.
   * @param {TypeValidMapProjectionCodes} projection - Optional projection code.
   * @param {TypeDisplayLanguage} language - Optional language.
   */
  async loadDefaultBasemaps(projection?: TypeValidMapProjectionCodes, language?: TypeDisplayLanguage): Promise<void> {
    const basemap = await this.createCoreBasemap(MapEventProcessor.getBasemapOptions(this.mapId), projection, language);

    if (basemap) {
      // Info used by create custom basemap
      this.defaultOrigin = basemap?.defaultOrigin;
      this.defaultResolutions = basemap?.defaultResolutions;
      this.defaultExtent = basemap?.defaultExtent;

      this.setBasemap(basemap);
    }
  }

  /**
   * Set the current basemap and update the basemap layers on the map.
   * @param {TypeBasemapProps} basemap - The basemap.
   */
  setBasemap(basemap: TypeBasemapProps): void {
    // Set active basemap
    this.activeBasemap = basemap;

    // Set store attribution for the selected basemap or empty string if not provided
    MapEventProcessor.setMapAttribution(this.mapId, basemap ? basemap.attribution : ['']);

    // Update the basemap layers on the map
    if (basemap?.layers) {
      // Remove previous basemaps
      const layers = MapEventProcessor.getMapViewer(this.mapId).map.getAllLayers();

      // Loop through all layers on the map
      for (let layerIndex = 0; layerIndex < layers.length; layerIndex++) {
        const layer = layers[layerIndex];

        // Get group id that this layer belongs to
        const layerId = layer.get('mapId');

        // Check if the group id matches basemap
        if (layerId && layerId === 'basemap') {
          // Remove the basemap layer
          MapEventProcessor.getMapViewer(this.mapId).map.removeLayer(layer);
        }
      }

      // Add basemap layers
      basemap.layers.forEach((layer, index) => {
        const basemapLayer = new TileLayer({
          opacity: layer.opacity,
          source: layer.source,
        });

        // Set this basemap's group id to basemap
        basemapLayer.set('mapId', 'basemap');

        // Add the basemap layer
        MapEventProcessor.getMapViewer(this.mapId).map.getLayers().insertAt(index, basemapLayer);

        // Render the layer
        basemapLayer.changed();
      });

      // Emit basemap changed event
      this.#emitBasemapChanged({ basemap });
    }
  }

  /**
   * Emits a component removed event to all handlers.
   * @private
   */
  #emitBasemapChanged(event: BasemapChangedEvent): void {
    // Emit the component removed event for all handlers
    EventHelper.emitEvent(this, this.#onBasemapChangedHandlers, event);
  }

  /**
   * Registers a component removed event callback.
   * @param {MapComponentRemovedDelegate} callback - The callback to be executed whenever the event is emitted
   */
  onBasemapChanged(callback: BasemapChangedDelegate): void {
    // Register the component removed event handler
    EventHelper.onEvent(this.#onBasemapChangedHandlers, callback);
  }

  /**
   * Unregisters a component removed event callback.
   * @param {MapComponentRemovedDelegate} callback - The callback to stop being called whenever the event is emitted
   */
  offMapLanguageChanged(callback: BasemapChangedDelegate): void {
    // Unregister the component removed event handler
    EventHelper.offEvent(this.#onBasemapChangedHandlers, callback);
  }
}

/**
 * Define an event for the delegate.
 */
export type BasemapChangedEvent = {
  basemap: TypeBasemapProps;
};

/**
 * Define a delegate for the event handler function signature.
 */
type BasemapChangedDelegate = EventDelegateBase<Basemap, BasemapChangedEvent, void>;
