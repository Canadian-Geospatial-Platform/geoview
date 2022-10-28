import { PayloadBaseClass } from './payload-base-class';

import { EventStringId, EVENT_NAMES } from '../event-types';

/** Valid events that can create LayerSetPayload */
const validEvents: EventStringId[] = [
  EVENT_NAMES.LAYER_SET.LAYER_REGISTRATION,
  EVENT_NAMES.LAYER_SET.REQUEST_LAYER_INVENTORY,
  EVENT_NAMES.LAYER_SET.UPDATED,
];

export type TypeQueryType = 'at pixel' | 'at coordinate' | 'at long lat' | 'using a bounding box' | 'using a polygon';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TypeResultSets = { [layerPath: string]: any | null };

/**
 * Type Gard function that redefines a PayloadBaseClass as a TypeLayerRegistrationPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export const payloadIsLayerRegistration = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is TypeLayerRegistrationPayload => {
  return verifyIfPayload.event === EVENT_NAMES.LAYER_SET.LAYER_REGISTRATION;
};

/**
 * Additional attribute needed to define a TypeLayerRegistrationPayload
 */
export interface TypeLayerRegistrationPayload extends LayerSetPayload {
  // the layer path to add to or remove from the inventory
  layerPath: string;
  // the layer set identifier
  layerSetId?: string;
  // the action to perform
  action: 'add' | 'remove';
}

/**
 * Type Gard function that redefines a PayloadBaseClass as a TypeRequestLayerInventoryPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export const payloadIsRequestLayerInventory = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is TypeRequestLayerInventoryPayload => {
  return verifyIfPayload.event === EVENT_NAMES.LAYER_SET.REQUEST_LAYER_INVENTORY;
};

/**
 * Additional attribute needed to define a TypeRequestLayerInventoryPayload
 */
export interface TypeRequestLayerInventoryPayload extends LayerSetPayload {
  // The layer set identifier that will receive the inventory
  layerSetId: string;
}

/**
 * Type Gard function that redefines a PayloadBaseClass as a TypelayerSetUpdatedPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export const payloadIsLayerSetUpdated = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is TypelayerSetUpdatedPayload => {
  return verifyIfPayload.event === EVENT_NAMES.LAYER_SET.UPDATED;
};

/**
 * Additional attribute needed to define a TypelayerSetUpdatedPayload
 */
export interface TypelayerSetUpdatedPayload extends LayerSetPayload {
  // The layer set identifier that has changed
  layerSetId: string;
}

/**
 * Type Gard function that redefines a PayloadBaseClass as a LayerSetPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export const payloadIsLayerSet = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is LayerSetPayload => {
  return validEvents.includes(verifyIfPayload.event);
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
   * Static method used to create a layer set payload that will register a new layer in the layer set inventory
   *
   * @param {string | null} handlerName the handler Name
   * @param {string} layerPath the layer path to add to the inventory
   *
   * @returns {TypeLayerRegistrationPayload} the registerLayerPayload object created
   */
  static createLayerRegistrationPayload = (
    handlerName: string,
    layerPath: string,
    action: 'add' | 'remove' | undefined = 'add',
    layerSetId: string | undefined = undefined
  ): TypeLayerRegistrationPayload => {
    const layerRegistrationPayload = new LayerSetPayload(
      EVENT_NAMES.LAYER_SET.LAYER_REGISTRATION,
      handlerName
    ) as TypeLayerRegistrationPayload;
    layerRegistrationPayload.layerPath = layerPath;
    layerRegistrationPayload.action = action;
    layerRegistrationPayload.layerSetId = layerSetId;
    return layerRegistrationPayload;
  };

  /**
   * Static method used to create a layer set payload requesting a layer inventory
   *
   * @param {string | null} handlerName the handler Name
   * @param {string} layerSetId the layer set identifier that will receive the inventory
   *
   * @returns {TypeRequestLayerInventoryPayload} the requestLayerInventoryPayload object created
   */
  static createRequestLayerInventoryPayload = (handlerName: string, layerSetId: string): TypeRequestLayerInventoryPayload => {
    const requestLayerInventoryPayload = new LayerSetPayload(
      EVENT_NAMES.LAYER_SET.REQUEST_LAYER_INVENTORY,
      handlerName
    ) as TypeRequestLayerInventoryPayload;
    requestLayerInventoryPayload.layerSetId = layerSetId;
    return requestLayerInventoryPayload;
  };

  /**
   * Static method used to create a layer set payload sent when a layer is updated
   *
   * @param {string | null} handlerName the handler Name
   * @param {string} LayerSetId the layer set identifier that has changed
   *
   * @returns {TypelayerSetUpdatedPayload} the requestLayerInventoryPayload object created
   */
  static createLayerSetUpdatedPayload = (handlerName: string, layerSetId: string): TypelayerSetUpdatedPayload => {
    const layerSetUpdatedPayload = new LayerSetPayload(EVENT_NAMES.LAYER_SET.UPDATED, handlerName) as TypelayerSetUpdatedPayload;
    layerSetUpdatedPayload.layerSetId = layerSetId;
    return layerSetUpdatedPayload;
  };
}
