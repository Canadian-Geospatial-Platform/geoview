import { EventStringId } from '../event';

/**
 * Cluster element event types
 */

type ClusterEventKey =
  | 'EVENT_CLUSTER_ELEMENT_ADD'
  | 'EVENT_CLUSTER_ELEMENT_REMOVE'
  | 'EVENT_CLUSTER_ELEMENT_ADDED'
  | 'EVENT_CLUSTER_ELEMENT_START_BLINKING'
  | 'EVENT_CLUSTER_ELEMENT_SELECTION_HAS_CHANGED'
  | 'EVENT_CLUSTER_ELEMENT_STOP_BLINKING'
  | 'EVENT_BOX_SELECT_END';

export const CLUSTER_ELEMENT: Record<ClusterEventKey, EventStringId> = {
  /**
   * Event triggered when a request is made to add a cluster element
   */
  EVENT_CLUSTER_ELEMENT_ADD: 'cluster_element/add',

  /**
   * Event triggered when a request is made to remove a cluster element
   */
  EVENT_CLUSTER_ELEMENT_REMOVE: 'cluster_element/remove',

  /**
   * Event is triggered when a cluster element has been added
   */
  EVENT_CLUSTER_ELEMENT_ADDED: 'cluster_element/added',

  /**
   * Event is triggered when a cluster element start blinking
   */
  EVENT_CLUSTER_ELEMENT_START_BLINKING: 'cluster_element/start_blinking',

  /**
   * Event is triggered when a cluster element stop blinking
   */
  EVENT_CLUSTER_ELEMENT_STOP_BLINKING: 'cluster_element/stop_blinking',

  /**
   * Event is triggered when a cluster element selection indicator changes
   */
  EVENT_CLUSTER_ELEMENT_SELECTION_HAS_CHANGED: 'cluster_element/selection_has_changed',

  /**
   * Event triggered when a user end a select box
   */
  EVENT_BOX_SELECT_END: 'box/zoom_or_select_end',
};
