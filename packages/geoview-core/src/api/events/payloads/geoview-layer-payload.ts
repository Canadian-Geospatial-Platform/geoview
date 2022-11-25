import { PayloadBaseClass } from './payload-base-class';

import { EventStringId, EVENT_NAMES } from '../event-types';
import { AbstractGeoViewLayer } from '../../../geo/layer/geoview-layers/abstract-geoview-layers';

/** Valid events that can create GeoViewLayerPayload */
const validEvents: EventStringId[] = [
  EVENT_NAMES.LAYER.EVENT_LAYER_ADDED,
  EVENT_NAMES.LAYER.EVENT_REMOVE_LAYER,
  EVENT_NAMES.LAYER.EVENT_IF_CONDITION,
];

/**
 * type guard function that redefines a PayloadBaseClass as a TypeGeoviewLayerAddedPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 *
 * @returns {boolean} returns true if the payload is valid
 */
export const payloadIsGeoViewLayerAdded = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is TypeGeoviewLayerAddedPayload => {
  return validEvents.includes(verifyIfPayload?.event);
};

/**
 * Additional attributes needed to define a TypeGeoviewLayerAddedPayload
 */
export interface TypeGeoviewLayerAddedPayload extends GeoViewLayerPayload {
  // The geoview layer instance associated to the payload.
  geoviewLayer: AbstractGeoViewLayer;
}

/**
 * type guard function that redefines a PayloadBaseClass as a TypeRemoveGeoviewLayerPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 *
 * @returns {boolean} returns true if the payload is valid
 */
export const payloadIsRemoveGeoViewLayer = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is TypeRemoveGeoviewLayerPayload => {
  return validEvents.includes(verifyIfPayload?.event);
};

/**
 * Additional attributes needed to define a TypeGeoviewLayerRemovedPayload
 */
export interface TypeRemoveGeoviewLayerPayload extends GeoViewLayerPayload {
  // The geoview layer instance associated to the payload.
  geoviewLayer: AbstractGeoViewLayer;
}

/**
 * type guard function that redefines a PayloadBaseClass as a TypeTestGeoviewLayersPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 *
 * @returns {boolean} returns true if the payload is valid
 */
export const payloadIsTestGeoViewLayers = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is TypeTestGeoviewLayersPayload => {
  return validEvents.includes(verifyIfPayload?.event);
};

/**
 * Additional attributes needed to define a TypeGeoviewLayerRemovedPayload
 */
export type TypeTestGeoviewLayersPayload = GeoViewLayerPayload;

/**
 * Class definition for GeoViewLayerPayload
 *
 * @exports
 * @class GeoViewLayerPayload
 */
export class GeoViewLayerPayload extends PayloadBaseClass {
  geoviewLayer: AbstractGeoViewLayer | undefined;

  /**
   * Constructor for the class
   *
   * @param {EventStringId} event the event identifier for which the payload is constructed
   * @param {string} handlerName the handler Name
   * @param {AbstractGeoViewLayer} geoviewLayer the GeoView layer payload
   */
  constructor(event: EventStringId, handlerName: string, geoviewLayer?: AbstractGeoViewLayer) {
    if (!validEvents.includes(event)) throw new Error(`GeoViewLayerPayload can't be instanciated for event of type ${event}`);
    super(event, handlerName);
    this.geoviewLayer = geoviewLayer;
  }

  /**
   * Static method used to create a layer added payload.
   *
   * @param {string} handlerName the handler Name
   * @param {AbstractGeoViewLayer} geoviewLayer the GeoView layer to assign to the payload
   *
   * @returns {TypeGeoviewLayerAddedPayload} the GeoViewLayerPayload object created
   */
  static createGeoviewLayerAddedPayload = (handlerName: string, geoviewLayer: AbstractGeoViewLayer): TypeGeoviewLayerAddedPayload => {
    const layerAddedPayload = new GeoViewLayerPayload(EVENT_NAMES.LAYER.EVENT_LAYER_ADDED, handlerName) as TypeGeoviewLayerAddedPayload;
    layerAddedPayload.geoviewLayer = geoviewLayer;
    return layerAddedPayload;
  };

  /**
   * Static method used to create a layer removed payload.
   *
   * @param {string} handlerName the handler Name
   * @param {AbstractGeoViewLayer} geoviewLayer the GeoView layer to assign to the payload
   *
   * @returns {TypeRemoveGeoviewLayerPayload} the GeoViewLayerPayload object created
   */
  static createRemoveGeoviewLayerPayload = (handlerName: string, geoviewLayer: AbstractGeoViewLayer): TypeRemoveGeoviewLayerPayload => {
    const layerRemovedPayload = new GeoViewLayerPayload(EVENT_NAMES.LAYER.EVENT_REMOVE_LAYER, handlerName) as TypeRemoveGeoviewLayerPayload;
    layerRemovedPayload.geoviewLayer = geoviewLayer;
    return layerRemovedPayload;
  };

  /**
   * Static method used to create a test geoview layers payload.
   *
   * @param {string} handlerName the handler Name
   *
   * @returns {TypeTestGeoviewLayersPayload} the GeoViewLayerPayload object created
   */
  static createTestGeoviewLayersPayload = (handlerName: string): TypeTestGeoviewLayersPayload => {
    return new GeoViewLayerPayload(EVENT_NAMES.LAYER.EVENT_IF_CONDITION, handlerName) as TypeTestGeoviewLayersPayload;
  };
}
