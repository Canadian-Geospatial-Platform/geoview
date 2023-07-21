/* eslint-disable @typescript-eslint/no-explicit-any */
import { EVENT_NAMES } from '@/api/events/event-types';
import { LayerSetPayload, payloadIsLayerRegistration, TypeResultSets } from '@/api/events/payloads/layer-set-payload';
import { api } from '../../app';

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

    // Register a layer to the layer set or unregister the layer when it is deleted from the map.
    api.event.on(
      EVENT_NAMES.LAYER_SET.LAYER_REGISTRATION,
      (payload) => {
        if (payloadIsLayerRegistration(payload)) {
          const { action, layerPath, layerSetId } = payload;
          // update the registration of all layer sets if !payload.layerSetId or update only the specified layer set
          if (!layerSetId || layerSetId === this.layerSetId) {
            if (this.registrationConditionFunction(layerPath) && action === 'add') {
              const layerInterval = setInterval(() => {
                if (api.maps[this.mapId].mapIsReady()) {
                  this.resultSets[layerPath] = undefined;
                  clearInterval(layerInterval);
                  api.event.emit(LayerSetPayload.createLayerSetUpdatedPayload(this.mapId, this.layerSetId));
                }
              }, 250);
            } else {
              delete this.resultSets[layerPath];
              api.event.emit(LayerSetPayload.createLayerSetUpdatedPayload(this.mapId, this.layerSetId));
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
