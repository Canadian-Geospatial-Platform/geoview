import { EventStringId } from '../event';
/**
 * This file defines the constants of the CLUSTER_ELEMENT category. The constants are placed
 * in a record that associates an event key with its event string id for each event.
 */
export declare type ClusterEventKey = 'EVENT_CLUSTER_ELEMENT_ADD' | 'EVENT_CLUSTER_ELEMENT_REMOVE' | 'EVENT_CLUSTER_ELEMENT_ADDED' | 'EVENT_CLUSTER_ELEMENT_START_BLINKING' | 'EVENT_CLUSTER_ELEMENT_SELECTION_HAS_CHANGED' | 'EVENT_CLUSTER_ELEMENT_STOP_BLINKING' | 'EVENT_BOX_SELECT_END';
export declare const CLUSTER_ELEMENT: Record<ClusterEventKey, EventStringId>;
