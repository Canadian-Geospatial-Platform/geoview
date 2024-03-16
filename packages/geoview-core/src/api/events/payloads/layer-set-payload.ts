import { PayloadBaseClass } from './payload-base-class';

import { EventStringId, EVENT_NAMES } from '../event-types';
import { TypeLayerStatus } from '@/geo/map/map-schema-types';

/** Valid events that can create LayerSetPayload */
const validEvents: EventStringId[] = [EVENT_NAMES.LAYER_SET.CHANGE_LAYER_STATUS, EVENT_NAMES.LAYER_SET.UPDATED];

export type TypeResultSetEntry = {
  layerName?: string;
  layerStatus: TypeLayerStatus;
  data: unknown;
};

export type TypeResultSet = {
  [layerPath: string]: TypeResultSetEntry;
};

/**
 * type guard function that redefines a PayloadBaseClass as a TypeLayerSetUpdatedPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export const payloadIsLayerSetUpdated = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is TypeLayerSetUpdatedPayload => {
  return verifyIfPayload?.event === EVENT_NAMES.LAYER_SET.UPDATED;
};

/**
 * Additional attribute needed to define a TypeLayerSetUpdatedPayload
 */
export interface TypeLayerSetUpdatedPayload extends LayerSetPayload {
  /** An object containing the result sets indexed using the layer path */
  resultSet: TypeResultSet;
  // The layerPath affected
  layerPath: string;
}

/**
 * type guard function that redefines a PayloadBaseClass as a TypeLayerSetChangeLayerStatusPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export const payloadIsLayerSetChangeLayerStatus = (
  verifyIfPayload: PayloadBaseClass
): verifyIfPayload is TypeLayerSetChangeLayerStatusPayload => {
  return verifyIfPayload?.event === EVENT_NAMES.LAYER_SET.CHANGE_LAYER_STATUS;
};

/**
 * Additional attributes needed to define a TypeLayerSetChangeLayerStatusPayload
 */
export interface TypeLayerSetChangeLayerStatusPayload extends LayerSetPayload {
  // the layer path affected.
  layerPath: string;
  // The new layer status to assign to the layer path.
  layerStatus: TypeLayerStatus;
}

/**
 * type guard function that redefines a PayloadBaseClass as a LayerSetPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export const payloadIsLayerSet = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is LayerSetPayload => {
  return validEvents.includes(verifyIfPayload?.event);
};

/**
 * Class definition for LayerSetPayload
 *
 * @exports
 * @class LayerSetPayload
 */
export class LayerSetPayload extends PayloadBaseClass {
  /**
   * Constructor for the class
   *
   * @param {EventStringId} event the event identifier for which the payload is constructed
   * @param {string | null} handlerName the handler Name (mapId/layerPath)
   */
  constructor(event: EventStringId, handlerName: string) {
    if (!validEvents.includes(event)) throw new Error(`LayerSetPayload can't be instanciated for event of type ${event}`);
    super(event, handlerName);
  }

  /**
   * Static method used to create a layer set payload when we need to change a layer status
   *
   * @param {string} handlerName the handler Name
   * @param {string} layerPath the layer path affected by the change
   * @param {TypeLayerStatus} layerStatus the value to assign to the layerStatus property
   *
   * @returns {TypeLayerSetUpdatedPayload} the requestLayerInventoryPayload object created
   */
  static createLayerSetChangeLayerStatusPayload = (
    handlerName: string,
    layerPath: string,
    layerStatus: TypeLayerStatus
  ): TypeLayerSetChangeLayerStatusPayload => {
    const layerSetChangeLayerStatusPayload = new LayerSetPayload(
      EVENT_NAMES.LAYER_SET.CHANGE_LAYER_STATUS,
      handlerName
    ) as TypeLayerSetChangeLayerStatusPayload;
    layerSetChangeLayerStatusPayload.layerPath = layerPath;
    layerSetChangeLayerStatusPayload.layerStatus = layerStatus;
    return layerSetChangeLayerStatusPayload;
  };

  /**
   * Static method used to create a layer set payload sent when a layer is updated
   *
   * @param {string | null} handlerName the handler Name
   * @param {string} LayerSetId the layer set identifier that has changed
   *
   * @returns {TypeLayerSetUpdatedPayload} the requestLayerInventoryPayload object created
   */
  static createLayerSetUpdatedPayload = (handlerName: string, resultSet: TypeResultSet, layerPath: string): TypeLayerSetUpdatedPayload => {
    const layerSetUpdatedPayload = new LayerSetPayload(EVENT_NAMES.LAYER_SET.UPDATED, handlerName) as TypeLayerSetUpdatedPayload;
    layerSetUpdatedPayload.resultSet = resultSet;
    layerSetUpdatedPayload.layerPath = layerPath;
    return layerSetUpdatedPayload;
  };
}
