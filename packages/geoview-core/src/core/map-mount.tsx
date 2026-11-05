import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';

import type { MapFeatureConfig } from '@/api/config/map-feature-config';
import type { TypeDisplayLanguage } from '@/api/types/map-schema-types';
import type { API } from '@/api/api';
import { ConfigApi } from '@/api/config/config-api';
import { Config } from '@/api/config/config';
import AppStart from '@/core/app-start';
import { createI18nInstance } from '@/core/translation/i18n';
import type { TypeMapFeaturesConfig } from '@/core/types/global-types';
import { addGeoViewStore } from '@/core/stores/store-lifecycle';
import { logger } from '@/core/utils/logger';
import { removeCommentsFromJSON } from '@/core/utils/utilities';
import type { GeoViewError } from '@/core/exceptions/geoview-exceptions';
import { InitMapWrongCallError } from '@/core/exceptions/geoview-exceptions';
import { Fetch } from '@/core/utils/fetch-helper';
import { DomHelper } from '@/core/utils/dom-helper';
import { MapViewer } from '@/geo/map/map-viewer';

/** React roots of the mounted maps, keyed by map id. */
const reactRoots: Record<string, Root> = {};

/**
 * Checks if a root is mounted for a given map ID.
 *
 * @param mapId - The map identifier
 * @returns True if the root exists and is mounted
 */
const isRootMounted = (mapId: string): boolean => {
  return !!reactRoots[mapId];
};

/**
 * Safely unmounts a map and cleans up its resources.
 *
 * @param mapId - The map identifier to unmount
 * @param mapContainer - Optional, the html element where the map was mounted
 */
export function unmountMap(mapId: string, mapContainer?: HTMLElement): void {
  if (isRootMounted(mapId)) {
    try {
      reactRoots[mapId].unmount();
      logger.logInfo(`Map ${mapId} is unmounted...`);
    } catch (error: unknown) {
      logger.logError(`Error unmounting map ${mapId}:`, error);
    } finally {
      // Remove React-specific attributes
      mapContainer?.removeAttribute('data-react-root');
      mapContainer?.removeAttribute('data-zustand-devtools');
      delete reactRoots[mapId];
    }
  }
}

/**
 * Gets a configuration from a div element who contains attributes to read from.
 *
 * If the div has one of the following atttributes data-config, data-config-url or data-shared,
 * it will try to get a valid configuration from the attribute content. If there is no such attributes,
 * it will return a default config. If the data-geocore is present, it will inject the layer in the
 * configuration automatically.
 *
 * @param mapElement - Div map element with attributes
 * @returns A promise that contains the configuration to use
 */
async function getMapConfig(mapElement: Element): Promise<TypeMapFeaturesConfig> {
  // get language in wich we need to have the config file (if not provided, default to English)
  const lang = mapElement.hasAttribute('data-lang') ? (mapElement.getAttribute('data-lang')! as TypeDisplayLanguage) : 'en';

  // create a new config object and apply default
  let mapConfig: MapFeatureConfig = ConfigApi.getDefaultMapFeatureConfig();

  // check what type of config is provided (data-config, data-config-url or data-shared)
  // Priority: data-config or data-config-url over data-shared...
  if (mapElement.hasAttribute('data-config')) {
    // configurations from inline div is provided
    let mapConfigStr = mapElement.getAttribute('data-config');
    // Erase comments in the config file then process
    mapConfigStr = removeCommentsFromJSON(mapConfigStr!);
    mapConfig = ConfigApi.validateMapConfig(mapConfigStr);
  } else if (mapElement.hasAttribute('data-config-url')) {
    // configurations file url is provided, fetch then process
    const configUrl = mapElement.getAttribute('data-config-url');
    const configObj = await Fetch.fetchJson<MapFeatureConfig>(configUrl!);
    mapConfig = ConfigApi.validateMapConfig(configObj);
  } else if (mapElement.hasAttribute('data-shared')) {
    // configurations from the URL parameters is provided, extract then process (replace HTLM characters , && :)
    const urlParam = new URLSearchParams(window.location.search).toString().replace(/%2C/g, ',').replace(/%3A/g, ':') || '';
    mapConfig = ConfigApi.getConfigFromUrl(urlParam);
    mapConfig = ConfigApi.validateMapConfig(mapConfig);
  }

  // If data-shared is present along with data-config or data-config-url, apply URL parameters to override specific config values
  if (mapElement.hasAttribute('data-shared') && (mapElement.hasAttribute('data-config') || mapElement.hasAttribute('data-config-url'))) {
    // Get URL parameters and merge them into the existing config
    const urlParam = new URLSearchParams(window.location.search).toString().replace(/%2C/g, ',').replace(/%3A/g, ':') || '';
    const existingUuids = mapConfig.map.listOfGeoviewLayerConfig
      .filter((layer) => layer.geoviewLayerType === 'geoCore')
      .map((layer) => layer.geoviewLayerId);
    const urlConfig = ConfigApi.getConfigFromUrl(urlParam, existingUuids);

    // Selectively merge URL parameters into the base config, preserving the base config structure
    // Update only the properties that are defined in the URL parameters
    if (urlConfig.map) {
      if (urlConfig.map.viewSettings) {
        if (urlConfig.map.viewSettings.projection) {
          mapConfig.map.viewSettings.projection = urlConfig.map.viewSettings.projection;
        }
        if (urlConfig.map.viewSettings.initialView?.zoomAndCenter) {
          mapConfig.map.viewSettings.initialView = mapConfig.map.viewSettings.initialView || {};
          mapConfig.map.viewSettings.initialView.zoomAndCenter = urlConfig.map.viewSettings.initialView.zoomAndCenter;
        }
      }
      if (urlConfig.map.basemapOptions) {
        mapConfig.map.basemapOptions = urlConfig.map.basemapOptions;
      }
      if (urlConfig.map.listOfGeoviewLayerConfig && urlConfig.map.listOfGeoviewLayerConfig.length > 0) {
        // Append URL layers to existing config layers instead of replacing them
        mapConfig.map.listOfGeoviewLayerConfig.push(...urlConfig.map.listOfGeoviewLayerConfig);
      }
    }

    // Validate the merged config
    mapConfig = ConfigApi.validateMapConfig(mapConfig);
  }

  // inject 'data-geocore-keys' inside the config for later processing by the ConfigApi
  if (mapElement.hasAttribute('data-geocore-keys')) {
    const geocoreKeys = mapElement.getAttribute('data-geocore-keys')?.split(',');
    geocoreKeys?.forEach((key: string) => {
      // Create the geocore snippet as any because at this point it does not contain all the attributes for the type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const layer: any = {
        geoviewLayerType: 'geoCore',
        geoviewLayerId: key,
      };

      mapConfig.map.listOfGeoviewLayerConfig.push(layer);
    });
  }

  // add the map display language and the map id to config (extend the MapFeatureConfig)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapConfigExtend: any = mapConfig;
  const id = mapElement.getAttribute('id')!;
  mapConfigExtend.mapId = id;
  mapConfigExtend.displayLanguage = lang;
  mapConfigExtend.sharedMode = mapElement.hasAttribute('data-shared');

  return mapConfigExtend;
}

/**
 * Renders the map for inline map and map create from a function call.
 *
 * @param api - The API instance that registers the created MapViewer
 * @param mapElement - The html element div who will contain the map
 * @returns A Promise containing the MapViewer
 */
export async function renderMap(api: API, mapElement: HTMLElement): Promise<MapViewer> {
  // if a config is provided from either inline div, url params or json file, validate it with against the schema
  // otherwise return the default config
  const configuration = await getMapConfig(mapElement);

  // Read the map id
  const { mapId } = configuration;

  // TODO: ? refactor - remove this config once we get layers from the new one
  // create a new config for this map element
  const lang = mapElement.hasAttribute('data-lang') ? (mapElement.getAttribute('data-lang')! as TypeDisplayLanguage) : 'en';

  const configObj = Config.initializeMapConfig(mapId, configuration.map.listOfGeoviewLayerConfig, (gvError: GeoViewError) => {
    // Wait for the map viewer to get loaded in the api
    api
      .getMapViewerAsync(mapId)
      .then(() => {
        // Get the message for the logger
        const message = gvError.translateMessage(lang);

        // Log it
        logger.logError(`- Map ${mapId}: ${message}`);

        // Show the error using its key (which will get translated)
        api.getMapViewer(mapId).notifications.showError(gvError.messageKey, gvError.messageParams);
      })
      .catch((error: unknown) => {
        // Log promise failed
        logger.logPromiseFailed('Promise failed in getMapViewerAsync in config.initializeMapConfig in app.renderMap', error);
      });
  });
  configuration.map.listOfGeoviewLayerConfig = configObj!;

  // Create i18n istance for the map
  const i18n = await createI18nInstance(lang);

  // render the map with the config
  reactRoots[mapId] = createRoot(mapElement);

  // add config to store
  addGeoViewStore(configuration, mapElement);

  // create a new map viewer instance and add it to the api
  const mapViewer = new MapViewer(configuration, i18n, mapElement.getAttribute('data-config-url') ?? undefined);
  api.setMapViewer(mapId, mapViewer);

  // If schema validation errors were detected, notify the user
  if (configuration.hasSchemaErrors) {
    mapViewer.notifications.showWarning('warning.schema.validationIssues');
  }

  // If panels were declared in both bars, notify the user they were removed from the footer bar
  if (configuration.duplicatedPanelsRemovedFromFooter?.length) {
    mapViewer.notifications.showWarning('warning.config.duplicatedPanels', {
      panels: configuration.duplicatedPanelsRemovedFromFooter.join(', '),
    });
  }

  // Create a promise to be resolved when the MapViewer is initialized via the AppStart component
  reactRoots[mapId].render(<AppStart mapViewer={mapViewer} i18nLang={i18n} />);

  // Set up MutationObserver to watch for removal of the map div where our MapViewer is mounted
  DomHelper.watchHtmlElementRemoval(mapId, mapElement, (removedMapId: string): void => {
    // If the MapViewer is still present
    if (api.hasMapViewer(removedMapId)) {
      // Delete the MapViewer to clean up, sending 'false', because the div is already gone.
      api.deleteMapViewer(removedMapId, false).catch((error: unknown) => {
        // Log
        logger.logPromiseFailed('in deleteMapViewer in handleMapDivRemoved', error);
      });
    }
  });

  // Return the map viewer
  return mapViewer;
}

/**
 * Initializes a basic div from a function call.
 *
 * GV The div MUST NOT have a geoview-map class or a warning will be shown.
 * If is present, the div will be created with a default config
 *
 * @param api - The API instance that registers the created MapViewer
 * @param mapDiv - The basic div to initialize
 * @param mapConfig - The new config passed in from the function call
 * @returns A Promise containing the MapViewer
 */
export function initMapDivFromFunctionCall(api: API, mapDiv: HTMLElement, mapConfig: string): Promise<MapViewer> {
  // If the div has a geoview-map class (therefore is supposed to be loaded via init())
  if (mapDiv.classList.contains('geoview-map')) throw new InitMapWrongCallError(mapDiv.id);

  // Check if it is a url for a config file or a config string
  const url = mapConfig.match('.json$') !== null;

  // Create a data-config attribute and set config value on the div
  const att = document.createAttribute(url ? 'data-config-url' : 'data-config');
  // Clean apostrophes in the config if not escaped already
  att.value = mapConfig.replaceAll(/(?<!\\)'/g, "\\'");
  mapDiv.setAttributeNode(att);

  // Set the geoview-map class on the div so that this class name is standard for all maps (either created via init or via func call)
  mapDiv.classList.add('geoview-map');

  // Add a compatibility flag on the div so that when a map is loaded via function call, it's subsequently ignored in eventual init() calls.
  // This is useful in case that a html first calls for example `cgpv.api.createMapFromConfigFast('LNG1', config, divHeight);` and then
  // calls `cgpv.init()` (let's say for other maps on the page), the map LNG1 isn't being initialized twice.
  // Remember that init() grabs all maps with geoview-map class and we just added that class manually above, so we need that flag.
  mapDiv.classList.add('geoview-map-func-call');

  // Render the map
  return renderMap(api, mapDiv);
}
