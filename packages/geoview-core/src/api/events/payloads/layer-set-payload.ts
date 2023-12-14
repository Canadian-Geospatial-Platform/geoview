import { PayloadBaseClass } from './payload-base-class';

import { EventStringId, EVENT_NAMES } from '../event-types';
import { TypeLayerStatus, TypeLocalizedString } from '@/geo/map/map-schema-types';

/** Valid events that can create LayerSetPayload */
const validEvents: EventStringId[] = [
  EVENT_NAMES.LAYER_SET.LAYER_REGISTRATION,
  EVENT_NAMES.LAYER_SET.REQUEST_LAYER_INVENTORY,
  EVENT_NAMES.LAYER_SET.CHANGE_LAYER_STATUS,
  EVENT_NAMES.LAYER_SET.CHANGE_LAYER_PHASE,
  EVENT_NAMES.LAYER_SET.UPDATED,
];

export type TypeResultSets = {
  [layerPath: string]: {
    layerName?: TypeLocalizedString;
    layerStatus: TypeLayerStatus;
    layerPhase: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any | null;
  };
};

/**
 * type guard function that redefines a PayloadBaseClass as a TypeLayerRegistrationPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export const payloadIsLayerRegistration = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is TypeLayerRegistrationPayload => {
  return verifyIfPayload?.event === EVENT_NAMES.LAYER_SET.LAYER_REGISTRATION;
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
 * type guard function that redefines a PayloadBaseClass as a TypeRequestLayerInventoryPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export const payloadIsRequestLayerInventory = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is TypeRequestLayerInventoryPayload => {
  return verifyIfPayload?.event === EVENT_NAMES.LAYER_SET.REQUEST_LAYER_INVENTORY;
};

/**
 * Additional attribute needed to define a TypeRequestLayerInventoryPayload
 */
export interface TypeRequestLayerInventoryPayload extends LayerSetPayload {
  // The layer set identifier that will receive the inventory
  layerSetId: string;
}

/**
 * type guard function that redefines a PayloadBaseClass as a TypelayerSetUpdatedPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export const payloadIsLayerSetUpdated = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is TypelayerSetUpdatedPayload => {
  return verifyIfPayload?.event === EVENT_NAMES.LAYER_SET.UPDATED;
};

/**
 * Additional attribute needed to define a TypelayerSetUpdatedPayload
 */
export interface TypelayerSetUpdatedPayload extends LayerSetPayload {
  /** An object containing the result sets indexed using the layer path */
  resultSets: TypeResultSets;
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
 * type guard function that redefines a PayloadBaseClass as a TypeLayerSetChangeLayerPhasePayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export const payloadIsLayerSetChangeLayerPhase = (
  verifyIfPayload: PayloadBaseClass
): verifyIfPayload is TypeLayerSetChangeLayerPhasePayload => {
  return verifyIfPayload?.event === EVENT_NAMES.LAYER_SET.CHANGE_LAYER_PHASE;
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
 * Additional attributes needed to define a TypeLayerSetChangeLayerPhasePayload
 */
export interface TypeLayerSetChangeLayerPhasePayload extends LayerSetPayload {
  // the layer path affected.
  layerPath: string;
  // The new layer phase to assign to the layer path.
  layerPhase: string;
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
   * Static method used to create a layer set payload that will register a new layer in the layer set inventory
   *
   * @param {string | null} handlerName the handler Name
   * @param {string} layerPath the layer path to add to the inventory
   * @param {'add' | 'remove'} action the kind of layer registration (default: add)
   * @param {string | undefined} layerSetId the layer set identifier that will register the layer
   *
   * @returns {TypeLayerRegistrationPayload} the registerLayerPayload object created
   */
  static createLayerRegistrationPayload = (
    handlerName: string,
    layerPath: string,
    action: 'add' | 'remove' = 'add',
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
   * Static method used to create a layer set payload when we need to change a layer status
   *
   * @param {string} handlerName the handler Name
   * @param {string} layerPath the layer path affected by the change
   * @param {TypeLayerStatus} layerStatus the value to assign to the layerStatus property
   *
   * @returns {TypelayerSetUpdatedPayload} the requestLayerInventoryPayload object created
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
   * Static method used to create a layer set payload when we need to change a layer phase
   *
   * @param {string} handlerName the handler Name
   * @param {string} layerPath the layer path affected by the change
   * @param {string} layerPhase the value to assign to the layerPhase property
   *
   * @returns {TypelayerSetUpdatedPayload} the requestLayerInventoryPayload object created
   */
  static createLayerSetChangeLayerPhasePayload = (
    handlerName: string,
    layerPath: string,
    layerPhase: string
  ): TypeLayerSetChangeLayerPhasePayload => {
    const layerSetChangeLayerPhasePayload = new LayerSetPayload(
      EVENT_NAMES.LAYER_SET.CHANGE_LAYER_PHASE,
      handlerName
    ) as TypeLayerSetChangeLayerPhasePayload;
    layerSetChangeLayerPhasePayload.layerPath = layerPath;
    layerSetChangeLayerPhasePayload.layerPhase = layerPhase;
    return layerSetChangeLayerPhasePayload;
  };

  /**
   * Static method used to create a layer set payload sent when a layer is updated
   *
   * @param {string | null} handlerName the handler Name
   * @param {string} LayerSetId the layer set identifier that has changed
   *
   * @returns {TypelayerSetUpdatedPayload} the requestLayerInventoryPayload object created
   */
  static createLayerSetUpdatedPayload = (
    handlerName: string,
    resultSets: TypeResultSets,
    layerPath: string
  ): TypelayerSetUpdatedPayload => {
    const layerSetUpdatedPayload = new LayerSetPayload(EVENT_NAMES.LAYER_SET.UPDATED, handlerName) as TypelayerSetUpdatedPayload;
    layerSetUpdatedPayload.resultSets = resultSets;
    layerSetUpdatedPayload.layerPath = layerPath;
    return layerSetUpdatedPayload;
  };
}
