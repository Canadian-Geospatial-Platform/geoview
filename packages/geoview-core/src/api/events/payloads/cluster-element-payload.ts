import L from 'leaflet';
import { PayloadBaseClass } from './payload-base-class';
import { EventStringId, EVENT_NAMES } from '../event';

// Valid events that can create ClusterElementPayload
const validEvents: EventStringId[] = [
  EVENT_NAMES.CLUSTER_ELEMENT.EVENT_CLUSTER_ELEMENT_REMOVE,
  EVENT_NAMES.CLUSTER_ELEMENT.EVENT_CLUSTER_ELEMENT_ADDED,
  EVENT_NAMES.CLUSTER_ELEMENT.EVENT_CLUSTER_ELEMENT_START_BLINKING,
  EVENT_NAMES.CLUSTER_ELEMENT.EVENT_CLUSTER_ELEMENT_STOP_BLINKING,
  EVENT_NAMES.CLUSTER_ELEMENT.EVENT_CLUSTER_ELEMENT_SELECTION_HAS_CHANGED,
];

/* ******************************************************************************************************************************
 * Type Gard function that redefines a PayloadBaseClass as a ClusterElementPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the the true block of the if clause.
 *
 * @param {PayloadBaseClass} polymorphic object to test in order to determine if the type ascention is valid
 */
export const payloadIsAClusterElement = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is ClusterElementPayload => {
  return validEvents.includes(verifyIfPayload.event);
};

/* ******************************************************************************************************************************
 * Class definition for ClusterElementPayload
 */
export class ClusterElementPayload extends PayloadBaseClass {
  // the marker cluster element object
  clusterElement: L.MarkerClusterElement;

  /*
   * Constructor for the class
   *
   * @param {EventStringId} the event identifier for which the payload is constructed
   * @param {string | null} the handler Name
   * @param {L.MarkerClusterElement} the marker cluster element carried by the payload
   *
   * @returns {ClusterElementPayload} the ClusterElementPayload object created
   */
  constructor(event: EventStringId, handlerName: string | null, clusterElement: L.MarkerClusterElement) {
    if (!validEvents.includes(event)) throw new Error(`ClusterElementPayload can't be instanciated for event of type ${event}`);
    super(event, handlerName);
    this.clusterElement = clusterElement;
  }
}

/* ******************************************************************************************************************************
 * Helper function used to instanciate a ClusterElementPayload object. This function
 * avoids the "new ClusterElementPayload" syntax.
 *
 * @param {EventStringId} the event identifier for which the payload is constructed
 * @param {string | null} the handler Name
 * @param {L.MarkerClusterElement} the marker cluster element carried by the payload
 *
 * @returns {ClusterElementPayload} the ClusterElementPayload object created
 */
export const clusterElementPayload = (
  event: EventStringId,
  handlerName: string | null,
  clusterElement: L.MarkerClusterElement
): ClusterElementPayload => {
  return new ClusterElementPayload(event, handlerName, clusterElement);
};
