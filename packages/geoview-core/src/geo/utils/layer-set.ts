/* eslint-disable @typescript-eslint/no-explicit-any */
import { EVENT_NAMES } from '@/api/events/event-types';
import {
  LayerSetPayload,
  payloadIsLayerRegistration,
  payloadIsLayerSetChangeLayerStatus,
  payloadIsLayerSetChangeLayerPhase,
  TypeResultSets,
  PayloadBaseClass,
} from '@/api/events/payloads';
import { api } from '@/app';

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
  resultSets: TypeResultSets = {};

  /** Function used to determine if the layerPath can be added to the layer set. */
  registrationConditionFunction: (layerPath: string) => boolean;

  /** ***************************************************************************************************************************
   * The class constructor that instanciate a set of layer.
   *
   * @param {string} mapId The map identifier the layer set belongs to.
   * @param {string} layerSetIdentifier The layer set identifier.
   * @param {TypeResultSets} resultSets An object that will contain the result sets indexed using the layer path.
   * @param {(layerPath: string) => boolean} registrationConditionFunction A function to decide if the layer can be added.
   */
  constructor(
    mapId: string,
    layerSetIdentifier: string,
    resultSets: TypeResultSets,
    registrationConditionFunction: (layerPath: string) => boolean
  ) {
    this.mapId = mapId;
    this.layerSetId = layerSetIdentifier;
    this.resultSets = resultSets;
    this.registrationConditionFunction = registrationConditionFunction;

    const changeLayerStatusListenerFunctions = (payload: PayloadBaseClass) => {
      if (payloadIsLayerSetChangeLayerStatus(payload)) {
        const { layerPath, layerStatus } = payload;
        if (this.resultSets[layerPath]) {
          this.resultSets[layerPath].layerStatus = layerStatus;
          if (layerStatus === 'processed' || layerStatus === 'loaded') this.resultSets[layerPath].layerPhase = 'processed';
          api.event.emit(
            LayerSetPayload.createLayerSetUpdatedPayload(`${this.layerSetId}/${layerPath}/status`, this.resultSets, layerPath)
          );
          api.event.emit(LayerSetPayload.createLayerSetUpdatedPayload(this.layerSetId, this.resultSets, layerPath));
        }
      }
    };
    api.event.on(EVENT_NAMES.LAYER_SET.CHANGE_LAYER_STATUS, changeLayerStatusListenerFunctions, this.mapId);

    const changeLayerPhaseListenerFunctions = (payload: PayloadBaseClass) => {
      if (payloadIsLayerSetChangeLayerPhase(payload)) {
        const { layerPath, layerPhase } = payload;
        if (this.resultSets[layerPath] && this.resultSets[layerPath].layerStatus !== 'error') {
          this.resultSets[layerPath].layerPhase = layerPhase;
          api.event.emit(LayerSetPayload.createLayerSetUpdatedPayload(`${this.layerSetId}/${layerPath}/phase`, this.resultSets, layerPath));
          api.event.emit(LayerSetPayload.createLayerSetUpdatedPayload(this.layerSetId, this.resultSets, layerPath));
        } else {
          Object.keys(this.resultSets).forEach((aLayerPath) => {
            if (aLayerPath.startsWith(layerPath) && this.resultSets[aLayerPath].layerStatus !== 'error') {
              this.resultSets[aLayerPath].layerPhase = layerPhase;
              api.event.emit(
                LayerSetPayload.createLayerSetUpdatedPayload(`${this.layerSetId}/${aLayerPath}/phase`, this.resultSets, layerPath)
              );
              api.event.emit(LayerSetPayload.createLayerSetUpdatedPayload(this.layerSetId, this.resultSets, layerPath));
            }
          });
        }
      }
    };
    api.event.on(EVENT_NAMES.LAYER_SET.CHANGE_LAYER_PHASE, changeLayerPhaseListenerFunctions, this.mapId);

    // Register a layer to the layer set or unregister the layer when it is deleted from the map.
    api.event.on(
      EVENT_NAMES.LAYER_SET.LAYER_REGISTRATION,
      (payload) => {
        if (payloadIsLayerRegistration(payload)) {
          const { action, layerPath, layerSetId } = payload;
          // update the registration of all layer sets if !payload.layerSetId or update only the specified layer set
          if (!layerSetId || layerSetId === this.layerSetId) {
            if (action === 'add' && this.registrationConditionFunction(layerPath) && !(layerPath in this.resultSets)) {
              this.resultSets[layerPath] = {
                data: undefined,
                layerStatus: 'newInstance',
                layerPhase: 'newInstance',
                layerName: api.maps[this.mapId].layer.registeredLayers[layerPath].layerName,
              };
              api.event.emit(LayerSetPayload.createLayerSetUpdatedPayload(this.layerSetId, this.resultSets, layerPath));
            } else if (action === 'remove' && layerPath in this.resultSets) {
              delete this.resultSets[layerPath];
              api.event.emit(LayerSetPayload.createLayerSetUpdatedPayload(this.layerSetId, this.resultSets, layerPath));
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
   * @param {TypeResultSets} resultSets An object that will contain the result sets indexed using the layer path.
   * @param {(layerPath: string) => boolean} registrationConditionFunction A function to decide if the layer can be added.
   *
   * @returns {LayerSet} the LayerSet object created
   */
  static create(
    mapId: string,
    layerSetId: string,
    resultSets: TypeResultSets,
    registrationConditionFunction: (layerPath: string) => boolean
  ): LayerSet {
    return new LayerSet(mapId, layerSetId, resultSets, registrationConditionFunction);
  }
}
