import { logger } from '@/core/utils/logger';
import type { TypeMapMouseInfo } from '@/geo/map/map-viewer';
import { Projection } from '@/geo/utils/projection';

import type { BatchedPropagationLayerDataArrayByMap } from '@/api/event-processors/abstract-event-processor';
import { AbstractEventProcessor } from '@/api/event-processors/abstract-event-processor';
import { UIEventProcessor } from './ui-event-processor';
import type {
  TypeFeatureInfoEntry,
  TypeResultSetEntry,
  TypeUtmZoneResponse,
  TypeAltitudeResponse,
  TypeNtsResponse,
} from '@/api/types/map-schema-types';
import type { IFeatureInfoState, TypeFeatureInfoResultSetEntry } from '@/core/stores/store-interface-and-intial-values/feature-info-state';
import type { GeoviewStoreType } from '@/core/stores/geoview-store';
import { MapEventProcessor } from './map-event-processor';
import { doUntil } from '@/core/utils/utilities';

// GV Important: See notes in header of MapEventProcessor file for information on the paradigm to apply when working with UIEventProcessor vs UIState

/**
 * Event processor focusing on interacting with the feature info state in the store (currently called detailsState).
 */
export class FeatureInfoEventProcessor extends AbstractEventProcessor {
  // **********************************************************
  // Static functions for Typescript files to access store actions
  // **********************************************************
  // GV Typescript MUST always use the defined store actions below to modify store - NEVER use setState!
  // GV Some action does state modifications AND map actions.
  // GV ALWAYS use map event processor when an action modify store and IS NOT trap by map state event handler

  // Holds the list of layer data arrays being buffered in the propagation process for the batch
  static #batchedPropagationLayerDataArray: BatchedPropagationLayerDataArrayByMap<TypeFeatureInfoResultSetEntry> = {};

  // The time delay between propagations in the batch layer data array.
  // The longer the delay, the more the layers will have a chance to get in a loaded state before changing the layerDataArray.
  // The longer the delay, the longer it'll take to update the UI. The delay can be bypassed using the layer path bypass method.
  static TIME_DELAY_BETWEEN_PROPAGATION_FOR_BATCH = 1000;

  // #region OVERRIDES

  /**
   * Initializes the Feature Info Event Processor and sets up store subscriptions.
   * Subscribes to layer data array changes, click coordinates, and coordinate info enabled state.
   * Creates coordinate info layer if enabled on initialization.
   * @param {GeoviewStoreType} store - The store associated with the Feature Info Event Processor
   * @returns {Array<() => void> | void} Array of unsubscribe functions for cleanup
   * @protected
   * @override
   */
  protected override onInitialize(store: GeoviewStoreType): Array<() => void> | void {
    // Checks for updated layers in layer data array and update the batched array consequently
    const layerDataArrayUpdateBatch = store.subscribe(
      (state) => state.detailsState.layerDataArray,
      (cur) => {
        // Log
        logger.logTraceCoreStoreSubscription('FEATURE-INFO EVENT PROCESSOR - layerDataArray', cur);

        // Also propagate in the batched array
        FeatureInfoEventProcessor.#propagateFeatureInfoToStoreBatch(store.getState().mapId, cur).catch((error: unknown) => {
          // Log
          logger.logPromiseFailed(
            'propagateFeatureInfoToStoreBatch in layerDataArrayUpdateBatch subscribe in feature-info-event-processor',
            error
          );
        });
      }
    );

    const { mapId } = store.getState();

    const clickCoordinates = store.subscribe(
      (state) => state.mapState.clickCoordinates,
      (coords) => {
        if (!coords) return;
        // Log
        logger.logTraceCoreStoreSubscription('FEATURE-INFO EVENT PROCESSOR - clickCoordinates', coords);

        FeatureInfoEventProcessor.getCoordinateInfo(mapId, coords);
      }
    );

    const coordinateInfoEnabledSubscription = store.subscribe(
      (state) => state.detailsState.coordinateInfoEnabled,
      (enabled) => {
        if (enabled) {
          // Create empty coordinate info layer when enabled
          FeatureInfoEventProcessor.createCoordinateInfoLayer(mapId);
        } else {
          // Remove coordinate info layer when disabled
          FeatureInfoEventProcessor.deleteFeatureInfo(mapId, 'coordinate-info');
        }
      }
    );

    // Check initial state and create coordinate info layer if neeeded
    if (store.getState().detailsState.coordinateInfoEnabled) {
      doUntil(() => {
        if (mapId) {
          FeatureInfoEventProcessor.createCoordinateInfoLayer(mapId);
          return true;
        }
        return false;
      }, 1000);
    }

    return [layerDataArrayUpdateBatch, clickCoordinates, coordinateInfoEnabledSubscription];
  }

  // #endregion OVERRIDES

  // #region STATIC METHODS

  /**
   * Gets the feature info state slice from the store for the specified map.
   * Provides access to layer data arrays, selected layer path, and query status information.
   * @param {string} mapId - The map identifier
   * @returns {IFeatureInfoState} The feature info state slice
   * @static
   * @protected
   */
  protected static getFeatureInfoState(mapId: string): IFeatureInfoState {
    // Return the feature info state
    return super.getState(mapId).detailsState;
  }

  /**
   * Gets the currently selected layer path in the feature info panel.
   * @param {string} mapId - The map identifier
   * @returns {string} The selected layer path
   * @static
   */
  static getSelectedLayerPath(mapId: string): string {
    return this.getFeatureInfoState(mapId).selectedLayerPath;
  }

  /**
   * Sets the selected layer path in the feature info panel.
   * Logs a warning if the specified layer path is not found in the layer data array.
   * @param {string} mapId - The map identifier
   * @param {string} layerPath - The layer path to select
   * @returns {void}
   * @static
   */
  static setSelectedLayerPath(mapId: string, layerPath: string): void {
    // The feature info state
    const featureInfoState = this.getFeatureInfoState(mapId);

    if (FeatureInfoEventProcessor.findLayerDataFromLayerDataArray(mapId, layerPath) === undefined) {
      logger.logWarning(`Trying to set selected layer path to '${layerPath}' which is not in the layer data array for mapId '${mapId}'`);
    }

    // Set the selected layer path
    featureInfoState.setterActions.setSelectedLayerPath(layerPath);
  }

  /**
   * Finds layer data entry from the layer data array by its path.
   * Optionally searches in a custom layer data array instead of the store's array.
   * @param {string} mapId - The map identifier
   * @param {string} layerPath - The path of the layer to find
   * @param {TypeFeatureInfoResultSetEntry[]} [layerDataArray] - Optional custom layer data array to search (defaults to store's array)
   * @returns {TypeFeatureInfoResultSetEntry | undefined} The layer data entry if found, undefined otherwise
   * @static
   */
  static findLayerDataFromLayerDataArray(
    mapId: string,
    layerPath: string,
    layerDataArray: TypeFeatureInfoResultSetEntry[] = this.getFeatureInfoState(mapId).layerDataArray
  ): TypeFeatureInfoResultSetEntry | undefined {
    return layerDataArray.find((layer) => layer.layerPath === layerPath);
  }

  /**
   * Resets the feature query result set for a specific layer path.
   * Clears features array and removes highlights/marker if the layer is currently selected.
   * @param {string} mapId - The map identifier
   * @param {string} layerPath - The layer path to reset features for
   * @returns {void}
   * @static
   */
  static resetResultSet(mapId: string, layerPath: string): void {
    const { resultSet } = MapEventProcessor.getMapViewerLayerAPI(mapId).featureInfoLayerSet;
    if (resultSet[layerPath]) {
      resultSet[layerPath].features = [];
      this.propagateFeatureInfoNameToStore(mapId, resultSet[layerPath]);
    }

    // Remove highlighted features and marker if it is the selected layer path
    if (FeatureInfoEventProcessor.getSelectedLayerPath(mapId) === layerPath) {
      MapEventProcessor.removeHighlightedFeature(mapId, 'all');
      MapEventProcessor.clickMarkerIconHide(mapId);
    }
  }

  /**
   * Deletes the specified layer path from the feature info layer sets in the store.
   * Clears selected layer path and batch bypass if they match the deleted path.
   * The array update triggers batched propagation automatically.
   * @param {string} mapId - The map identifier
   * @param {string} layerPath - The layer path to delete
   * @returns {void}
   * @static
   */
  static deleteFeatureInfo(mapId: string, layerPath: string): void {
    // The feature info state
    const featureInfoState = this.getFeatureInfoState(mapId);

    // Clear selected layer path and layer data array patch layer path bypass if they are the current path
    if (layerPath === featureInfoState.selectedLayerPath) {
      featureInfoState.setterActions.setSelectedLayerPath('');
    }

    if (layerPath === featureInfoState.layerDataArrayBatchLayerPathBypass) {
      featureInfoState.setterActions.setLayerDataArrayBatchLayerPathBypass('');
    }

    // Redirect to helper function
    this.#deleteFromArray(featureInfoState.layerDataArray, layerPath, (layerArrayResult) => {
      // Update the layer data array in the store
      featureInfoState.setterActions.setLayerDataArray(layerArrayResult);

      // Log
      logger.logInfo('Removed Feature Info in stores for layer path:', layerPath);
    });
  }

  /**
   * Helper function to remove a layer from an array by its path and execute a callback.
   * Finds the layer by path, removes it from the array, and calls the provided callback with updated array.
   * @param {T[]} layerArray - The layer array to search and modify
   * @param {string} layerPath - The layer path to delete
   * @param {(layerArray: T[]) => void} onDeleteCallback - Callback executed with the updated array
   * @returns {void}
   * @static
   * @private
   */
  static #deleteFromArray<T extends TypeResultSetEntry>(
    layerArray: T[],
    layerPath: string,
    onDeleteCallback: (layerArray: T[]) => void
  ): void {
    // Find the layer data info to delete from the array
    const layerDataInfoToDelIndex = layerArray.findIndex((layerInfo) => layerInfo.layerPath === layerPath);

    // If found
    if (layerDataInfoToDelIndex >= 0) {
      // Remove from the array
      layerArray.splice(layerDataInfoToDelIndex, 1);

      // Callback with updated array
      onDeleteCallback(layerArray);
    }
  }

  /**
   * Propagates feature info result to the store on map click and opens the details panel.
   * Adds result set entry to layer data array and switches to details tab if not already on details or geochart.
   * Also opens the details appbar tab if available.
   * @param {string} mapId - The map identifier
   * @param {TypeFeatureInfoResultSetEntry} resultSetEntry - The result set entry to propagate
   * @returns {void}
   * @static
   */
  static propagateFeatureInfoClickToStore(mapId: string, resultSetEntry: TypeFeatureInfoResultSetEntry): void {
    // The feature info state
    const featureInfoState = this.getFeatureInfoState(mapId);

    // Create a details object for each layer which is then used to render layers in details panel.
    const layerDataArray = [...featureInfoState.layerDataArray];
    if (!layerDataArray.find((layerEntry) => layerEntry.layerPath === resultSetEntry.layerPath)) layerDataArray.push(resultSetEntry);

    // Show details panel as soon as there is a click on the map
    // If the current tab is not 'details' nor 'geochart', switch to details
    if (
      UIEventProcessor.getActiveFooterBarTab(mapId) === undefined ||
      (!['details', 'geochart'].includes(UIEventProcessor.getActiveFooterBarTab(mapId)!) &&
        UIEventProcessor.getFooterBarComponents(mapId).includes('details'))
    ) {
      UIEventProcessor.setActiveFooterBarTab(mapId, 'details');
    }
    // Open details appbar tab when user clicked on map layer.
    if (UIEventProcessor.getAppBarComponents(mapId).includes('details')) {
      UIEventProcessor.setActiveAppBarTab(mapId, 'details', true, true);
    }

    // Update the layer data array in the store, all the time, for all statuses
    featureInfoState.setterActions.setLayerDataArray(layerDataArray);
  }

  /**
   * Propagates feature info result to the store without opening panels.
   * Adds result set entry to layer data array for updates like layer name changes.
   * @param {string} mapId - The map identifier
   * @param {TypeFeatureInfoResultSetEntry} resultSetEntry - The result set entry to propagate
   * @returns {void}
   * @static
   */
  static propagateFeatureInfoNameToStore(mapId: string, resultSetEntry: TypeFeatureInfoResultSetEntry): void {
    // The feature info state
    const featureInfoState = this.getFeatureInfoState(mapId);

    // Create a details object for each layer which is then used to render layers in details panel.
    const layerDataArray = [...featureInfoState.layerDataArray];
    if (!layerDataArray.find((layerEntry) => layerEntry.layerPath === resultSetEntry.layerPath)) layerDataArray.push(resultSetEntry);

    // Update the layer data array in the store, all the time, for all statuses
    featureInfoState.setterActions.setLayerDataArray(layerDataArray);
  }

  /**
   * Propagates layer data to the store in a batched manner with time delay between updates.
   * Reduces UI update frequency by batching multiple rapid changes into fewer store updates.
   * Supports bypass mechanism via layerDataArrayBatchLayerPathBypass for immediate propagation when needed.
   * @param {string} mapId - The map identifier
   * @param {TypeFeatureInfoResultSetEntry[]} layerDataArray - The layer data array to batch
   * @returns {Promise<void>} Promise that resolves when batch propagation completes
   * @static
   * @private
   */
  static #propagateFeatureInfoToStoreBatch(mapId: string, layerDataArray: TypeFeatureInfoResultSetEntry[]): Promise<void> {
    // The feature info state
    const featureInfoState = this.getFeatureInfoState(mapId);

    // TODO: Fix 'details propagation' when some layers have been loaded in the UI, but their queries fail (very specific case that happened during a weekend)
    // TO.DOCONT: Putting the TODO here, but not sure where the fix should be.
    // TO.DOCONT: When layers have spotty query happening (but are loaded with their legends fine in the ui) the Details panel has trouble maitaining the
    // TO.DOCONT: currently selected layer, selected, in the ui when clicking on various features on the map.

    // Redirect to batch propagate
    return this.helperPropagateArrayStoreBatch(
      mapId,
      layerDataArray,
      this.#batchedPropagationLayerDataArray,
      this.TIME_DELAY_BETWEEN_PROPAGATION_FOR_BATCH,
      featureInfoState.setterActions.setLayerDataArrayBatch,
      'feature-info-processor',
      featureInfoState.layerDataArrayBatchLayerPathBypass,
      featureInfoState.setterActions.setLayerDataArrayBatchLayerPathBypass
    );
  }

  /**
   * Creates or updates the coordinate information layer in the feature info panel.
   * Adds a special layer entry containing coordinate details for the clicked location.
   * @param {string} mapId - The map identifier
   * @param {TypeFeatureInfoEntry[]} features - Array of coordinate information features (defaults to empty)
   * @returns {void}
   * @static
   */
  static createCoordinateInfoLayer(mapId: string, features: TypeFeatureInfoEntry[] = []): void {
    const coordinateInfoLayer = {
      layerPath: 'coordinate-info',
      layerName: 'Coordinate Information',
      eventListenerEnabled: false,
      queryStatus: 'processed',
      layerStatus: 'processed',
      numOffeature: 1,
      features,
    } as unknown as TypeFeatureInfoResultSetEntry & { numOffeatures: number };

    // Get layer array, minus the coordinate-info layer
    const featureInfoState = this.getFeatureInfoState(mapId);
    const currentLayerDataArray = [...featureInfoState.layerDataArray].filter((layer) => layer.layerPath !== 'coordinate-info');

    // Add the new coordinate info layer
    currentLayerDataArray.push(coordinateInfoLayer);

    // Update the store directly
    featureInfoState.setterActions.setLayerDataArray(currentLayerDataArray);
  }

  /**
   * Queries coordinate information from multiple web services and updates the coordinate info layer.
   * Fetches UTM zone, NTS mapsheet, and elevation data for the clicked location.
   * Creates a coordinate info feature with all retrieved information and adds it to the feature info panel.
   * @param {string} mapId - The map identifier
   * @param {TypeMapMouseInfo} coordinates - The map mouse information containing lonlat coordinates
   * @returns {void}
   * @static
   */
  static getCoordinateInfo(mapId: string, coordinates: TypeMapMouseInfo): void {
    // If the coordinate info is not enabled, clear any existing info
    const state = this.getFeatureInfoState(mapId);
    if (!state.coordinateInfoEnabled) {
      this.deleteFeatureInfo(mapId, 'coordinate-info');
      return;
    }

    const [lng, lat] = coordinates.lonlat;

    const serviceUrls = this.getState(mapId).mapConfig?.serviceUrls;
    if (!serviceUrls) return;
    const { utmZoneUrl, ntsSheetUrl, altitudeUrl } = serviceUrls;
    Promise.allSettled([
      fetch(`${utmZoneUrl}?bbox=${lng}%2C${lat}%2C${lng}%2C${lat}`).then((r) => r.json()) as Promise<TypeUtmZoneResponse>,
      fetch(`${ntsSheetUrl}?bbox=${lng}%2C${lat}%2C${lng}%2C${lat}`).then((r) => r.json()) as Promise<TypeNtsResponse>,
      fetch(`${altitudeUrl}?lat=${lat}&lon=${lng}`).then((r) => r.json()) as Promise<TypeAltitudeResponse>,
    ])
      .then(([utmResult, ntsResult, elevationResult]) => {
        const utmData = utmResult.status === 'fulfilled' ? utmResult.value : undefined;
        const ntsData = ntsResult.status === 'fulfilled' ? ntsResult.value : undefined;
        const elevationData = elevationResult.status === 'fulfilled' ? elevationResult.value : undefined;

        const utmIdentifier = utmData?.features[0].properties.identifier;
        const [easting, northing] = utmIdentifier
          ? Projection.transformToUTMNorthingEasting(coordinates.lonlat, utmIdentifier)
          : [undefined, undefined];

        // Create coordinate info layer entry
        const coordinateFeature: TypeFeatureInfoEntry[] = [
          {
            uid: 'coordinate-info-feature',
            fieldInfo: {
              latitude: { value: lat.toFixed(6), fieldKey: 0, dataType: 'number', alias: 'Latitude', domain: null },
              longitude: { value: lng.toFixed(6), fieldKey: 1, dataType: 'number', alias: 'Longitude', domain: null },
              utmZone: { value: utmIdentifier, fieldKey: 2, dataType: 'string', alias: 'UTM Identifier', domain: null },
              easting: { value: easting?.toFixed(2), fieldKey: 3, dataType: 'number', alias: 'Easting', domain: null },
              northing: { value: northing?.toFixed(2), fieldKey: 4, dataType: 'number', alias: 'Northing', domain: null },
              ntsMapsheet: {
                value: ntsData?.features
                  .filter((f) => f.properties.name !== '')
                  .sort((f) => f.properties.scale)
                  .map((f) => {
                    const scale = `${f.properties.scale / 1000}K`;
                    return `${f.properties.identifier} - ${f.properties.name} - ${scale}`;
                  })
                  .join('\n'),
                fieldKey: 5,
                dataType: 'string',
                alias: 'NTS Mapsheets',
                domain: null,
              },
              elevation: {
                value: elevationData?.altitude ? `${elevationData.altitude} m` : undefined,
                fieldKey: 6,
                dataType: 'string',
                alias: 'Elevation',
                domain: null,
              },
            },
            extent: undefined,
            geometry: undefined,
            featureKey: 0,
            nameField: null,
            geoviewLayerType: 'CSV',
            supportZoomTo: true,
            layerPath: 'coordinate-info',
          },
        ];
        this.createCoordinateInfoLayer(mapId, coordinateFeature);
      })
      .catch((error: unknown) => {
        // Log
        logger.logPromiseFailed('Failed to get coordinate info', error);
      });
  }

  // #endregion

  // **********************************************************
  // Static functions for Store Map State to action on API
  // **********************************************************
  // GV NEVER add a store action who does set state AND map action at a same time.
  // GV Review the action in store state to make sure
}
