/**
 * Panel event types
 */
export const PANEL = {
  /**
   * Event triggered when a request is made to open a panel
   */
  EVENT_PANEL_OPEN: 'panel/open',

  /**
   * Event triggered when a request is made to close a panel
   */
  EVENT_PANEL_CLOSE: 'panel/close',

  /**
   * Event triggered when a request is made to add an action button
   */
  EVENT_PANEL_ADD_ACTION: 'panel/add_action',

  /**
   * Event triggered when a request is made to remove an action button
   */
  EVENT_PANEL_REMOVE_ACTION: 'panel/remove_action',

  /**
   * Event triggered when a request is made to change panel content
   */
  EVENT_PANEL_CHANGE_CONTENT: 'panel/change_content',
};
