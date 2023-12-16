/* eslint-disable @typescript-eslint/no-explicit-any */
import { EVENT_NAMES } from '@/api/events/event-types';
import {
  GetLegendsPayload,
  payloadIsLegendInfo,
  TypeLegendResultSets,
  payloadIsLayerSetUpdated,
  TypeFeatureInfoResultSets,
} from '@/api/events/payloads';
import { api } from '@/app';
import { LayerSet } from './layer-set';
import { LegendEventProcessor } from '@/api/event-processors/event-processor-children/legend-event-processor';
import { FeatureInfoEventProcessor } from '@/api/event-processors/event-processor-children/feature-info-event-processor';

/** *****************************************************************************************************************************
 * A class to hold a set of layers associated with an array of TypeLegend. When this class is instantiated, all layers already
 * loaded on the specified map will be added to the set. Layers added afterwards will be added to the set and deleted layers
 * will be removed from the set.
 *
 * @class LegendsLayerSet
 */
export class LegendsLayerSet {
  /** Private static variable to keep the single instance that can be created by this class for a mapIId (see singleton design pattern) */
  private static legendsLayerSetInstance: Record<string, LegendsLayerSet> = {};

  /** The map identifier the layer set belongs to. */
  mapId: string;

  /** The layer set object. */
  layerSet: LayerSet;

  /** An object containing the result sets indexed using the layer path */
  resultSets: TypeLegendResultSets = {};

  /** ***************************************************************************************************************************
   * The class constructor that instanciate a set of layer.
   *
   * @param {string} mapId The map identifier the layer set belongs to.
   *
   */
  private constructor(mapId: string) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const registrationConditionFunction = (layerPath: string): boolean => {
      return true;
    };

    // This function is used to initialise the date property of the layer path entry.
    const registrationUserDataInitialisation = (layerPath: string) => {
      this.resultSets[layerPath].querySent = false;
      this.resultSets[layerPath].data = undefined;
    };

    this.mapId = mapId;
    this.layerSet = new LayerSet(
      mapId,
      `${mapId}/LegendsLayerSet`,
      this.resultSets,
      registrationConditionFunction,
      registrationUserDataInitialisation
    );

    api.event.on(
      EVENT_NAMES.LAYER_SET.UPDATED,
      (layerUpdatedPayload) => {
        if (payloadIsLayerSetUpdated(layerUpdatedPayload)) {
          const { layerPath, resultSets } = layerUpdatedPayload;
          api.event.emit(GetLegendsPayload.createLegendsLayersetUpdatedPayload(`${this.mapId}/LegendsLayerSet`, layerPath, resultSets));
        }
      },
      `${mapId}/LegendsLayerSetStatusOrPhaseChanged`
    );

    // This listener receives the legend information returned by the layer's getLegend call and store it in the resultSets.
    // Every time a registered layer changes, an EVENT_NAMES.GET_LEGENDS.LEGENDS_LAYERSET_UPDATED event is triggered.
    api.event.on(
      EVENT_NAMES.GET_LEGENDS.LEGEND_INFO,
      (payload) => {
        if (payloadIsLegendInfo(payload)) {
          const { layerPath, legendInfo } = payload;
          if (layerPath in this.resultSets) {
            this.resultSets[layerPath].data = legendInfo;
            LegendEventProcessor.propagateLegendToStore(this.mapId, layerPath, this.resultSets[layerPath]);
            // Update feature info store to display list of layers when details tab is opened.
            FeatureInfoEventProcessor.propagateFeatureInfoToStore(
              this.mapId,
              layerPath,
              'click',
              this.resultSets as TypeFeatureInfoResultSets,
              true
            );
            api.event.emit(
              GetLegendsPayload.createLegendsLayersetUpdatedPayload(`${this.mapId}/LegendsLayerSet`, layerPath, this.resultSets)
            );
          }
        }
      },
      this.mapId
    );

    api.event.on(
      EVENT_NAMES.LAYER_SET.UPDATED,
      (layerUpdatedPayload) => {
        if (payloadIsLayerSetUpdated(layerUpdatedPayload)) {
          const { layerPath, resultSets } = layerUpdatedPayload;
          if (resultSets[layerPath]?.layerStatus === 'processed' && !(resultSets as TypeLegendResultSets)[layerPath].querySent) {
            api.event.emit(GetLegendsPayload.createQueryLegendPayload(`${this.mapId}/${layerPath}`, layerPath));
            this.resultSets[layerPath].querySent = true;
          }
        }
      },
      `${mapId}/LegendsLayerSet`
    );
  }

  /**
   * Helper function used to instanciate a LegendsLayerSet object. This function
   * avoids the "new LegendsLayerSet" syntax.
   *
   * @param {string} mapId The map identifier the layer set belongs to.
   *
   * @returns {LegendsLayerSet} the LegendsLayerSet object created
   */
  static get(mapId: string): LegendsLayerSet {
    if (!LegendsLayerSet.legendsLayerSetInstance[mapId]) LegendsLayerSet.legendsLayerSetInstance[mapId] = new LegendsLayerSet(mapId);
    return LegendsLayerSet.legendsLayerSetInstance[mapId];
  }

  /**
   * Function used to delete a LegendsLayerSet object associated to a mapId.
   *
   * @param {string} mapId The map identifier the layer set belongs to.
   */
  static delete(mapId: string) {
    if (LegendsLayerSet.legendsLayerSetInstance[mapId]) delete LegendsLayerSet.legendsLayerSetInstance[mapId];
  }
}
