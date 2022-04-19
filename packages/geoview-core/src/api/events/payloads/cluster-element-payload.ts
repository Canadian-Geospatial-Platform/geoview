import L from 'leaflet';
import { PayloadBaseClass } from './payload-base-class';
import { EventStringId, EVENT_NAMES } from '../event';

const validEvents: EventStringId[] = [
  EVENT_NAMES.CLUSTER_ELEMENT.EVENT_CLUSTER_ELEMENT_REMOVE,
  EVENT_NAMES.CLUSTER_ELEMENT.EVENT_CLUSTER_ELEMENT_ADDED,
  EVENT_NAMES.CLUSTER_ELEMENT.EVENT_CLUSTER_ELEMENT_START_BLINKING,
  EVENT_NAMES.CLUSTER_ELEMENT.EVENT_CLUSTER_ELEMENT_STOP_BLINKING,
  EVENT_NAMES.CLUSTER_ELEMENT.EVENT_CLUSTER_ELEMENT_SELECTION_HAS_CHANGED,
];

export const payloadIsAClusterElement = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is ClusterElementPayload => {
  return validEvents.includes(verifyIfPayload.event);
};

export class ClusterElementPayload extends PayloadBaseClass {
  clusterElement: L.MarkerClusterElement;

  constructor(event: EventStringId, handlerName: string | null, clusterElement: L.MarkerClusterElement) {
    if (!validEvents.includes(event)) throw new Error(`ClusterElementPayload can't be instanciated for event of type ${event}`);
    super(event, handlerName);
    this.clusterElement = clusterElement;
  }
}

export const clusterElementPayload = (
  event: EventStringId,
  handlerName: string | null,
  clusterElement: L.MarkerClusterElement
): ClusterElementPayload => {
  return new ClusterElementPayload(event, handlerName, clusterElement);
};
