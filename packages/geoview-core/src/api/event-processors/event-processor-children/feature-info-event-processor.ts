import { logger } from '@/core/utils/logger';
import { EventType } from '@/geo/layer/layer-sets/abstract-layer-set';
import { TypeMapMouseInfo } from '@/geo/map/map-viewer';
import { Projection } from '@/geo/utils/projection';

import { AbstractEventProcessor, BatchedPropagationLayerDataArrayByMap } from '@/api/event-processors/abstract-event-processor';
import { UIEventProcessor } from './ui-event-processor';
import { TypeFeatureInfoEntry, TypeResultSetEntry } from '@/api/config/types/map-schema-types';
import { IFeatureInfoState, TypeFeatureInfoResultSetEntry } from '@/core/stores/store-interface-and-intial-values/feature-info-state';
import { GeoviewStoreType } from '@/core/stores/geoview-store';
import { MapEventProcessor } from './map-event-processor';
import { doUntil } from '@/app';

// GV Important: See notes in header of MapEventProcessor file for information on the paradigm to apply when working with UIEventProcessor vs UIState

/**
 * Event processor focusing on interacting with the feature info state in the store (currently called detailsState).
 */
export class FeatureInfoEventProcessor extends AbstractEventProcessor {
  /**
   * Overrides initialization of the GeoChart Event Processor
   * @param {GeoviewStoreType} store The store associated with the GeoChart Event Processor
   * @returns An array of the subscriptions callbacks which were created
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

        FeatureInfoEventProcessor.#getCoordinateInfo(mapId, coords);
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

  // **********************************************************
  // Static functions for Typescript files to access store actions
  // **********************************************************
  // GV Typescript MUST always use the defined store actions below to modify store - NEVER use setState!
  // GV Some action does state modifications AND map actions.
  // GV ALWAYS use map event processor when an action modify store and IS NOT trap by map state event handler

  // #region
  // Holds the list of layer data arrays being buffered in the propagation process for the batch
  static #batchedPropagationLayerDataArray: BatchedPropagationLayerDataArrayByMap<TypeFeatureInfoResultSetEntry> = {};

  // The time delay between propagations in the batch layer data array.
  // The longer the delay, the more the layers will have a chance to get in a loaded state before changing the layerDataArray.
  // The longer the delay, the longer it'll take to update the UI. The delay can be bypassed using the layer path bypass method.
  static #timeDelayBetweenPropagationsForBatch = 1000;

  /**
   * Shortcut to get the Feature Info state for a given map id
   * @param {string} mapId - The mapId
   * @returns {IFeatureInfoState} The Feature Info state
   */
  protected static getFeatureInfoState(mapId: string): IFeatureInfoState {
    // Return the feature info state
    return super.getState(mapId).detailsState;
  }

  /**
   * Get the selectedLayerPath value
   * @param {string} mapId - The map identifier
   * @returns {string} the selected layer path
   */
  static getSelectedLayerPath(mapId: string): string {
    return this.getFeatureInfoState(mapId).selectedLayerPath;
  }

  /**
   * Gets the layer data array for one layer.
   * @param {string} mapId - The map id.
   * @param {string} layerPath - The path of the layer to get.
   * @returns {TypeOrderedLayerInfo | undefined} The ordered layer info.
   */
  static findLayerDataFromLayerDataArray(
    mapId: string,
    layerPath: string,
    layerDataArray: TypeFeatureInfoResultSetEntry[] = this.getFeatureInfoState(mapId).layerDataArray
  ): TypeFeatureInfoResultSetEntry | undefined {
    return layerDataArray.find((layer) => layer.layerPath === layerPath);
  }

  /**
   * Deletes the feature from a resultSet for a specific layerPath. At the same time it check for
   * removing the higlight and the click marker if selected layer path is the reset path
   * @param {string} mapId - The map identifier
   * @param {string} layerPath - The layer path to delete features from resultSet
   * @param {EventType} eventType - The event that triggered the reset.
   */
  static resetResultSet(mapId: string, layerPath: string, eventType: EventType = 'click'): void {
    const { resultSet } = MapEventProcessor.getMapViewerLayerAPI(mapId).featureInfoLayerSet;
    if (resultSet[layerPath]) {
      resultSet[layerPath].features = [];
      this.propagateFeatureInfoToStore(mapId, eventType, resultSet[layerPath]).catch((error: unknown) =>
        // Log error
        logger.logPromiseFailed('Not able to reset resultSet', error, layerPath)
      );
    }

    // Remove highlighted features and marker if it is the selected layer path
    if (FeatureInfoEventProcessor.getSelectedLayerPath(mapId) === layerPath) {
      MapEventProcessor.removeHighlightedFeature(mapId, 'all');
      MapEventProcessor.clickMarkerIconHide(mapId);
    }
  }

  /**
   * Deletes the specified layer path from the layer sets in the store. The update of the array will also trigger an update in a batched manner.
   * @param {string} mapId - The map identifier
   * @param {string} layerPath - The layer path to delete
   * @returns {void}
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
   * Helper function to delete a layer information from an array when found
   * @param {T[]} layerArray - The layer array to work with
   * @param {string} layerPath - The layer path to delete
   * @param {(layerArray: T[]) => void} onDeleteCallback - The callback executed when the array is updated
   * @returns {void}
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
   * Propagates feature info layer sets to the store. The update of the array will also trigger an update in a batched manner.
   *
   * @param {string} mapId - The map identifier of the modified result set.
   * @param {EventType} eventType - The event type that triggered the layer set update.
   * @param {TypeFeatureInfoResultSetEntry} resultSetEntry - The result set entry being propagated.
   * @returns {Promise<void>}
   */
  static propagateFeatureInfoToStore(mapId: string, eventType: EventType, resultSetEntry: TypeFeatureInfoResultSetEntry): Promise<void> {
    // The feature info state
    const featureInfoState = this.getFeatureInfoState(mapId);

    // Create a details object for each layer which is then used to render layers in details panel.
    const layerDataArray = [...featureInfoState.layerDataArray];
    if (!layerDataArray.find((layerEntry) => layerEntry.layerPath === resultSetEntry.layerPath)) layerDataArray.push(resultSetEntry);

    // Depending on the event type
    if (eventType === 'click') {
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
    } else if (eventType === 'name') {
      // Update the layer data array in the store, all the time, for all statuses
      featureInfoState.setterActions.setLayerDataArray(layerDataArray);
    }

    // Nothing to do
    return Promise.resolve();
  }

  /**
   * Propagates feature info layer sets to the store in a batched manner, every 'timeDelayBetweenPropagationsForBatch' millisecond.
   * This is used to provide another 'layerDataArray', in the store, which updates less often so that we save a couple 'layerDataArray'
   * update triggers in the components that are listening to the store array.
   * The propagation can be bypassed using the store 'layerDataArrayBatchLayerPathBypass' state which tells the process to
   * immediately batch out the array in the store for faster triggering of the state, for faster updating of the UI.
   * @param {string} mapId - The map id
   * @param {TypeFeatureInfoResultSetEntry[]} layerDataArray - The layer data array to batch on
   * @returns {Promise<void>} Promise upon completion
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
      this.#timeDelayBetweenPropagationsForBatch,
      featureInfoState.setterActions.setLayerDataArrayBatch,
      'feature-info-processor',
      featureInfoState.layerDataArrayBatchLayerPathBypass,
      featureInfoState.setterActions.setLayerDataArrayBatchLayerPathBypass
    );
  }

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

    const featureInfoState = this.getFeatureInfoState(mapId);
    const currentLayerDataArray = [...featureInfoState.layerDataArray];

    // Remove existing coordinate info layer if it exists
    const existingIndex = currentLayerDataArray.findIndex((layer) => layer.layerPath === 'coordinate-info');
    if (existingIndex >= 0) {
      currentLayerDataArray.splice(existingIndex, 1);
    }

    // Add the new coordinate info layer
    currentLayerDataArray.push(coordinateInfoLayer);

    // Update the store directly
    featureInfoState.setterActions.setLayerDataArray(currentLayerDataArray);
  }

  /**
   * Queries coordinate information from endpoints
   * @param {string} mapId - The map ID
   * @param {[number, number]} coordinates - The lng/lat coordinates
   * @returns {Promise<TypeCoordinateInfo>} Promise of coordinate information
   */
  static #getCoordinateInfo(mapId: string, coordinates: TypeMapMouseInfo): void {
    // If the coordinate info is not enabled, clear any existing info
    const state = this.getFeatureInfoState(mapId);
    if (!state.coordinateInfoEnabled) {
      this.deleteFeatureInfo(mapId, 'coordinate-info');
      return;
    }

    const [lng, lat] = coordinates.lonlat;

    Promise.allSettled([
      fetch(`https://geogratis.gc.ca/services/delimitation/en/utmzone?bbox=${lng}%2C${lat}%2C${lng}%2C${lat}`).then((r) =>
        r.json()
      ) as Promise<TypeUtmZoneResponse>,
      fetch(`https://geogratis.gc.ca/services/delimitation/en/nts?bbox=${lng}%2C${lat}%2C${lng}%2C${lat}`).then((r) =>
        r.json()
      ) as Promise<TypeNtsResponse>,
      fetch(`https://geogratis.gc.ca/services/elevation/cdem/altitude?lat=${lat}&lon=${lng}`).then((r) =>
        r.json()
      ) as Promise<TypeAltitudeResponse>,
      // fetch(`https://ngdc.noaa.gov/geomag-web/calculators/calculateDeclination?lat1=${lat}&lon1=${lng}&key=zNEw7&resultFormat=json`, {
      //   mode: 'cors',
      // }).then((r) => r.json()) as Promise<TypeDeclinationResponse>,
    ])
      .then(([utmResult, ntsResult, elevationResult]) => {
        const utmData = utmResult.status === 'fulfilled' ? utmResult.value : undefined;
        const ntsData = ntsResult.status === 'fulfilled' ? ntsResult.value : undefined;
        const elevationData = elevationResult.status === 'fulfilled' ? elevationResult.value : undefined;
        // const declinationData = declinationResult.status === 'fulfilled' ? declinationResult.value : undefined;

        const utmIdentifier = utmData?.features[0].properties.identifier;
        const [easting, northing] = utmIdentifier
          ? Projection.transformToUTMNorthingEasting(coordinates.lonlat, utmIdentifier)
          : [undefined, undefined];

        // Create coordinate info layer entry
        const coordinateFeature: TypeFeatureInfoEntry[] = [
          {
            uid: 'coordinate-info-feature',
            fieldInfo: {
              Latitude: { value: lat.toFixed(6), fieldKey: 0, dataType: 'number', alias: 'Latitude', domain: null },
              Longitude: { value: lng.toFixed(6), fieldKey: 1, dataType: 'number', alias: 'Longitude', domain: null },
              'UTM Zone': { value: utmIdentifier, fieldKey: 2, dataType: 'string', alias: 'UTM Identifier', domain: null },
              Easting: { value: easting?.toFixed(2), fieldKey: 3, dataType: 'number', alias: 'Easting', domain: null },
              Northing: { value: northing?.toFixed(2), fieldKey: 4, dataType: 'number', alias: 'Northing', domain: null },
              'NTS Mapsheet': {
                value: ntsData?.features.map((f) => f.properties.name).join(', '),
                fieldKey: 5,
                dataType: 'string',
                alias: 'NTS Mapsheets',
                domain: null,
              },
              Elevation: {
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

// Request Schemas for Coordinate Info requests

// type TypeDeclinationResult = {
//   date: number;
//   elevation: number;
//   declination: number;
//   alt_info: string;
//   latitude: number;
//   declination_sv: number;
//   declination_uncertainty: number;
//   longitude: number;
// };

// type TypeDeclinationUnits = {
//   elevation: string;
//   declination: string;
//   declination_sv: string;
//   latitude: string;
//   declination_uncertainty: string;
//   longitude: string;
// };

// type TypeDeclinationResponse = {
//   result: TypeDeclinationResult[];
//   model: string;
//   units: TypeDeclinationUnits;
//   version: string;
// };

type TypeUtmZoneFeature = {
  type: 'Feature';
  properties: {
    identifier: string;
    centralMeridian: number;
  };
  bbox: [number, number, number, number];
  geometry: {
    type: 'Polygon';
    coordinates: number[][][];
  };
};

type TypeUtmZoneResponse = {
  type: 'FeatureCollection';
  count: number;
  features: TypeUtmZoneFeature[];
};

type TypeNtsFeature = {
  type: 'Feature';
  properties: {
    identifier: string;
    name: string;
    scale: number;
  };
  bbox: [number, number, number, number];
  geometry: {
    type: 'Polygon';
    coordinates: number[][][];
  };
};

type TypeNtsResponse = {
  type: 'FeatureCollection';
  count: number;
  features: TypeNtsFeature[];
};

type TypeAltitudeResponse = {
  altitude: number;
  vertex: boolean;
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
};
