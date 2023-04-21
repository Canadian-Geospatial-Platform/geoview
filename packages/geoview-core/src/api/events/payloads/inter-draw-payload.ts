import { DrawEvent as OLDrawEvent } from 'ol/interaction/Draw';

import { PayloadBaseClass } from './payload-base-class';

import { EventStringId, EVENT_NAMES } from '../event-types';

/** Valid events that can create DrawPayload */
const validEvents: EventStringId[] = [
  EVENT_NAMES.INTERACTION.EVENT_DRAW_STARTED,
  EVENT_NAMES.INTERACTION.EVENT_DRAW_ENDED,
  EVENT_NAMES.INTERACTION.EVENT_DRAW_ABORTED,
];

/**
 * type guard function that redefines a PayloadBaseClass as a DrawPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export const payloadIsADraw = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is DrawPayload => {
  return validEvents.includes(verifyIfPayload?.event);
};

/**
 * Class definition for DrawPayload
 *
 * @exports
 * @class DrawPayload
 */
export class DrawPayload extends PayloadBaseClass {
  drawInfo: OLDrawEvent;

  /**
   * Constructor for the class
   *
   * @param {EventStringId} event the event identifier for which the payload is constructed
   * @param {string | null} handlerName the handler Name
   * @param {OLDrawEvent} drawInfo the boolean value carried by the payload
   *
   */
  constructor(event: EventStringId, handlerName: string | null, drawInfo: OLDrawEvent) {
    if (!validEvents.includes(event)) throw new Error(`DrawPayload can't be instanciated for event of type ${event}`);
    super(event, handlerName);
    this.drawInfo = drawInfo;
  }
}

/**
 * Helper function used to instanciate a DrawPayload object. This function
 * avoids the "new DrawPayload" syntax.
 *
 * @param {EventStringId} event the event identifier for which the payload is constructed
 * @param {string | null} handlerName the handler Name
 * @param {OLDrawEvent} draw the drawing information carried by the payload
 *
 * @returns {DrawPayload} the DrawPayload object created
 */
export const drawPayload = (event: EventStringId, handlerName: string | null, draw: OLDrawEvent): DrawPayload => {
  return new DrawPayload(event, handlerName, draw);
};
