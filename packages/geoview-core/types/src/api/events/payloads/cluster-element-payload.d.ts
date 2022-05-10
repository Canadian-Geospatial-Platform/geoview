import L from 'leaflet';
import { PayloadBaseClass } from './payload-base-class';
import { EventStringId } from '../event';
export declare const payloadIsAClusterElement: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is ClusterElementPayload;
export declare class ClusterElementPayload extends PayloadBaseClass {
    clusterElement: L.MarkerClusterElement;
    constructor(event: EventStringId, handlerName: string | null, clusterElement: L.MarkerClusterElement);
}
export declare const clusterElementPayload: (event: EventStringId, handlerName: string | null, clusterElement: L.MarkerClusterElement) => ClusterElementPayload;
