/* eslint-disable @typescript-eslint/no-explicit-any */
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import { EVENT_NAMES } from '@/api/events/event-types';
import {
  LayerSetPayload,
  payloadIsLayerRegistration,
  payloadIsLayerSetChangeLayerStatus,
  TypeResultsSet,
  GetLegendsPayload,
  PayloadBaseClass,
  GetFeatureInfoPayload,
} from '@/api/events/payloads';
import { api } from '@/app';
import { logger } from '@/core/utils/logger';
import { createLocalizedString, getLocalizedValue } from '@/core/utils/utilities';

/** ***************************************************************************************************************************
 * A class to hold a set of layers associated with an value of any type. When this class is instantiated, all layers already
 * loaded on the specified map that have a return value equal to true when the registrationConditionFunction is called using
 * the layer path as a parameter will be added to the set. Layers added afterwards will be added to the set if the
 * registrationConditionFunction returns true. Deleted layers will be removed from the set.
 *
 * @class LayerSet
 */
export class LayerSet {
  /** The map identifier the layer set belongs to. */
  mapId: string;

  /** The layer set identifier. */
  layerSetId: string;

  /** An object containing the result sets indexed using the layer path */
  resultsSet: TypeResultsSet = {};

  /** Function used to determine if the layerPath can be added to the layer set. */
  registrationConditionFunction: (layerPath: string) => boolean;

  /** Function used to initialise the data property of the layer path entry. */
  registrationUserInitialisation?: (layerPath: string) => void;

  /** Sequence number to append to the layer name when we declare a layer as anonymous. */
  anonymousSequenceNumber = 1;

  /** ***************************************************************************************************************************
   * The class constructor that instanciate a set of layer.
   *
   * @param {string} mapId The map identifier the layer set belongs to.
   * @param {string} layerSetIdentifier The layer set identifier.
   * @param {TypeResultsSet} resultsSet An object that will contain the result sets indexed using the layer path.
   * @param {(layerPath: string) => boolean} registrationConditionFunction A function to decide if the layer can be added.
   * @param {(layerPath: string) => void} registrationUserInitialisation A function to initialise the data property of the layer path entry.
   */
  constructor(
    mapId: string,
    layerSetIdentifier: string,
    resultsSet: TypeResultsSet,
    registrationConditionFunction: (layerPath: string) => boolean,
    registrationUserInitialisation?: (layerPath: string) => void
  ) {
    this.mapId = mapId;
    this.layerSetId = layerSetIdentifier;
    this.resultsSet = resultsSet;
    this.registrationConditionFunction = registrationConditionFunction;
    this.registrationUserInitialisation = registrationUserInitialisation;

    const changeLayerStatusListenerFunctions = (payload: PayloadBaseClass) => {
      // Log
      logger.logTraceCoreAPIEvent('LAYER-SET - CHANGE_LAYER_STATUS', this.mapId, payload);

      if (payloadIsLayerSetChangeLayerStatus(payload)) {
        const { layerPath, layerStatus } = payload;
        if (layerStatus === 'error' && resultsSet[layerPath]) {
          api.event.emit(LayerSetPayload.createLayerSetUpdatedPayload(`${mapId}/LegendsLayerSetStatusChanged`, this.resultsSet, layerPath));
          // eslint-disable-next-line no-param-reassign
          resultsSet[layerPath].layerStatus = 'error';
          api.event.emit(
            GetFeatureInfoPayload.createFeatureInfoLayersetUpdatedPayload(
              `${mapId}/FeatureInfoLayerSet`,
              layerPath,
              resultsSet,
              layerStatus
            )
          );
        } else if (this.resultsSet[layerPath]) {
          const layerConfig = api.maps[mapId].layer.registeredLayers[layerPath];
          if (this.resultsSet[layerPath].layerStatus !== layerStatus) {
            this.resultsSet[layerPath].layerStatus = layerStatus;
            if (!this.resultsSet[layerPath].layerName) {
              this.resultsSet[layerPath].layerName =
                getLocalizedValue(layerConfig.layerName, mapId) ||
                getLocalizedValue(
                  {
                    en: `Anonymous Layer ${this.anonymousSequenceNumber}`,
                    fr: `Couche Anonyme ${this.anonymousSequenceNumber}`,
                  },
                  mapId
                );
              this.anonymousSequenceNumber++;
            }
            // Synchronize the layer name property in the config and the layer set object when the geoview instance is ready.
            if (layerConfig.geoviewLayerInstance!.allLayerStatusAreIn(['processed', 'error'], [layerConfig]))
              if (layerConfig.layerName) this.resultsSet[layerPath].layerName = getLocalizedValue(layerConfig.layerName, mapId);
              else layerConfig.layerName = createLocalizedString(this.resultsSet[layerPath].layerName!);
            api.event.emit(LayerSetPayload.createLayerSetUpdatedPayload(this.layerSetId, this.resultsSet, layerPath));
            if (this.layerSetId === `${mapId}/LegendsLayerSet`)
              // LegendLayerSet is the absolute reference for finding out whether a layer has been loaded or is in error. Then, every
              // time we modify a layerSet in the Legend family, we have to inform the viewer that a change has occurred.
              api.event.emit(GetLegendsPayload.createLegendsLayersetUpdatedPayload(`${this.mapId}/LegendsLayerSet`, layerPath, resultsSet));
          }
        }
      }
    };
    api.event.on(EVENT_NAMES.LAYER_SET.CHANGE_LAYER_STATUS, changeLayerStatusListenerFunctions, this.mapId);

    // Register a layer to the layer set or unregister the layer when it is deleted from the map.
    api.event.on(
      EVENT_NAMES.LAYER_SET.LAYER_REGISTRATION,
      (payload) => {
        // Log
        logger.logTraceCoreAPIEvent('LAYER-SET - LAYER_REGISTRATION', this.mapId, payload);

        if (payloadIsLayerRegistration(payload)) {
          const { action, layerPath, layerSetId } = payload;
          // update the registration of all layer sets if !payload.layerSetId or update only the specified layer set
          if (!layerSetId || layerSetId === this.layerSetId) {
            if (action === 'add' && this.registrationConditionFunction(layerPath) && !(layerPath in this.resultsSet)) {
              const layerConfig = api.maps[mapId].layer.registeredLayers[layerPath];
              this.resultsSet[layerPath] = {
                data: undefined,
                layerStatus: 'newInstance',
                layerName: getLocalizedValue(layerConfig.layerName, mapId),
              };
              if (this.registrationUserInitialisation) this.registrationUserInitialisation(layerPath);
              api.event.emit(LayerSetPayload.createLayerSetUpdatedPayload(this.layerSetId, this.resultsSet, layerPath));
              if (this.layerSetId === `${mapId}/LegendsLayerSet`)
                api.event.emit(
                  LayerSetPayload.createLayerSetUpdatedPayload(`${mapId}/LegendsLayerSetStatusChanged`, this.resultsSet, layerPath)
                );
              if (MapEventProcessor.getMapIndexFromOrderedLayerInfo(this.mapId, layerPath) === -1) {
                if (layerConfig.parentLayerConfig) {
                  const parentLayerPathArray = layerPath.split('/');
                  parentLayerPathArray.pop();
                  const parentLayerPath = parentLayerPathArray.join('/');
                  const parentLayerIndex = MapEventProcessor.getMapIndexFromOrderedLayerInfo(this.mapId, parentLayerPath);
                  const numberOfLayers = MapEventProcessor.getMapOrderedLayerInfo(this.mapId).filter((layerInfo) =>
                    layerInfo.layerPath.startsWith(parentLayerPath)
                  ).length;
                  if (parentLayerIndex !== -1)
                    MapEventProcessor.addOrderedLayerInfo(this.mapId, layerConfig, parentLayerIndex + numberOfLayers);
                  else MapEventProcessor.addOrderedLayerInfo(this.mapId, layerConfig.parentLayerConfig);
                } else MapEventProcessor.addOrderedLayerInfo(this.mapId, layerConfig);
              }
            } else if (action === 'remove' && layerPath in this.resultsSet) {
              delete this.resultsSet[layerPath];
              MapEventProcessor.removeOrderedLayerInfo(this.mapId, layerPath);
              api.event.emit(LayerSetPayload.createLayerSetUpdatedPayload(this.layerSetId, this.resultsSet, layerPath));
            }
          }
        }
      },
      this.mapId
    );

    // Send a request layer inventory signal to all existing layers of the map. These layers will return a layer registration event.
    api.event.emit(LayerSetPayload.createRequestLayerInventoryPayload(this.mapId, this.layerSetId));
  }

  /**
   * Helper function used to instanciate a LayerSet object. This function
   * avoids the "new LayerSet" syntax.
   *
   * @param {string} mapId The map identifier the layer set belongs to.
   * @param {string} layerSetId The layer set identifier.
   * @param {TypeResultsSet} resultsSet An object that will contain the result sets indexed using the layer path.
   * @param {(layerPath: string) => boolean} registrationConditionFunction A function to decide if the layer can be added.
   *
   * @returns {LayerSet} the LayerSet object created
   */
  static create(
    mapId: string,
    layerSetId: string,
    resultsSet: TypeResultsSet,
    registrationConditionFunction: (layerPath: string) => boolean
  ): LayerSet {
    return new LayerSet(mapId, layerSetId, resultsSet, registrationConditionFunction);
  }
}
