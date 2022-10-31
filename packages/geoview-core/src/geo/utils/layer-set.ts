/* eslint-disable @typescript-eslint/no-explicit-any */
import { EVENT_NAMES } from '../../api/events/event-types';
import { LayerSetPayload, payloadIsLayerRegistration, TypeResultSets } from '../../api/events/payloads/layer-set-payload';
import { api } from '../../app';

/** ***************************************************************************************************************************
 * A class to hold a set of layers associated with an array of TypeArrayOfRecords. When this class is instantiated, all layers
 * already loaded on the specified map that are queryable will be added to the set. Layers added afterwards will be added to
 * the set if they are queryable. Deleted layers will be removed from the set.
 *
 * @class FeatureInfoLayerSet
 */
export class LayerSet {
  /** The map identifier the layer set belongs to. */
  mapId: string;

  /** The layer set identifier. */
  layerSetId: string;

  /** An object containing the result sets indexed using the layer path */
  resultSets: TypeResultSets = {};

  /** Function used to determine if the layerPath can be added to the layer set. */
  registrationConditionFonction: (layerPath: string) => boolean;

  /** ***************************************************************************************************************************
   * The class constructor that instanciate a set of layer.
   *
   * @param {string} mapId The map identifier the layer set belongs to.
   * @param {string} layerSetId The layer set identifier.
   * @param {TypeResultSets} resultSets An object that will contain the result sets indexed using the layer path.
   * @param {(layerPath: string) => boolean} registrationConditionFonction A function to decide if the layer can be added.
   */
  constructor(
    mapId: string,
    layerSetId: string,
    resultSets: TypeResultSets,
    registrationConditionFonction: (layerPath: string) => boolean
  ) {
    this.mapId = mapId;
    this.layerSetId = layerSetId;
    this.resultSets = resultSets;
    this.registrationConditionFonction = registrationConditionFonction;

    // Register a layer to the layer set or unregister the layer when it is deleted from the map.
    api.event.on(
      EVENT_NAMES.LAYER_SET.LAYER_REGISTRATION,
      (payload) => {
        if (payloadIsLayerRegistration(payload)) {
          const { action, layerPath } = payload;
          // update the registration of all layer sets if !payload.layerSetId or only the specified layer set
          if (!payload.layerSetId || payload.layerSetId === this.layerSetId) {
            if (this.registrationConditionFonction(layerPath) && action === 'add') this.resultSets[layerPath] = undefined;
            else delete this.resultSets[layerPath];
          }
        }
      },
      this.mapId
    );

    // Send a request layer inventory signal to all existing layers of the map. These layers will return a layer registration event.
    api.event.emit(LayerSetPayload.createRequestLayerInventoryPayload(this.mapId, this.layerSetId));
  }

  /**
   * Helper function used to instanciate a FeatureInfoLayerSet object. This function
   * avoids the "new FeatureInfoLayerSet" syntax.
   *
   * @param {string} mapId The map identifier the layer set belongs to.
   * @param {string} layerSetId The layer set identifier.
   * @param {TypeResultSets} resultSets An object that will contain the result sets indexed using the layer path.
   * @param {(layerPath: string) => boolean} registrationConditionFonction A function to decide if the layer can be added.
   *
   * @returns {FeatureInfoLayerSet} the FeatureInfoLayerSet object created
   */
  static create(
    mapId: string,
    layerSetId: string,
    resultSets: TypeResultSets,
    registrationConditionFonction: (layerPath: string) => boolean
  ): LayerSet {
    return new LayerSet(mapId, layerSetId, resultSets, registrationConditionFonction);
  }
}
