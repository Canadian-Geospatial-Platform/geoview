import EventEmitter from 'eventemitter3';

import { EVENT_NAMES, EventStringId } from './event-types';
import { PayloadBaseClass } from './payloads/payload-base-class';
import {
  ButtonPanelPayload,
  buttonPanelPayload,
  payloadIsAButtonPanel,
  footerBarPayload,
  FooterBarPayload,
  payloadIsAFooterBar,
  inKeyfocusPayload,
  payloadIsAInKeyfocus,
  SnackbarType,
  SnackbarMessagePayload,
} from './payloads';
import { logger } from '@/core/utils/logger';
import { TypeButtonPanel, TypeJsonObject, TypeTabs, payloadIsASnackbarMessage, snackbarMessagePayload } from '@/core/types/global-types';

export type TypeEventHandlerFunction = (payload: PayloadBaseClass) => void;

type TypeEventNode = {
  context: EventEmitter;
  fn: TypeEventHandlerFunction;
  once: boolean;
};

interface IEventEmitter extends EventEmitter {
  _events: Record<string, TypeEventNode | TypeEventNode[]>;
  _eventsCount: number;
}

/**
 * Class used to handle event emitting and subscribing for the API
 *
 * @exports
 * @class Event
 */
export class Event {
  // event emitter object, used to handle emitting/subscribing to events
  eventEmitter: IEventEmitter;

  /**
   * Initiate the event emitter
   */
  constructor() {
    this.eventEmitter = new EventEmitter() as IEventEmitter;
  }

  /**
   * Listen to emitted events
   *
   * @param {string} eventName the event name to listen to
   * @param {function} listener the callback function
   * @param {string} [handlerName] the handler name to return data from
   *
   * @returns {TypeEventHandlerFunction} The event handler listener function associated to the event created.
   */
  on = (eventName: EventStringId, listener: TypeEventHandlerFunction, handlerName?: string): TypeEventHandlerFunction => {
    const eventNameId = `${handlerName ? `${handlerName}/` : ''}${eventName}`;

    this.eventEmitter.on(eventNameId, listener);
    return listener;
  };

  /**
   * Listen to emitted events once
   *
   * @param {string} eventName the event name to listen to
   * @param {function} listener the callback function
   * @param {string} [handlerName] the handler name to return data from
   *
   * @returns {TypeEventHandlerFunction} The event handler listener function associated to the event created.
   */
  once = (eventName: EventStringId, listener: TypeEventHandlerFunction, handlerName?: string): TypeEventHandlerFunction => {
    const eventNameId = `${handlerName ? `${handlerName}/` : ''}${eventName}`;

    this.eventEmitter.once(eventNameId, listener);
    return listener;
  };

  /**
   * Will remove the specified @listener from @eventname list
   *
   * @param {string} eventName the event name of the event to be removed
   * @param {string} handlerName the name of the handler an event needs to be removed from
   * @param {TypeEventHandlerFunction} listener The event handler listener function associated to the event created.
   */
  off = (eventName: EventStringId, handlerName?: string, listener?: TypeEventHandlerFunction): void => {
    const eventNameId = `${handlerName ? `${handlerName}/` : ''}${eventName}`;

    this.eventEmitter.off(eventNameId, listener);
  };

  /**
   * Unregister all events whose handler names start with the string passed in parameter.
   *
   * @param {string} handlerNamePrefix the handler name prefix for which you need to unregister from the event
   * @param {string} eventTypeToKeep the handler name prefix composed of handlerNamePrefix/eventTypeToKeep to keep
   */
  offAll = (handlerNamePrefix: string, eventTypeToKeep?: string): void => {
    // eslint-disable-next-line no-underscore-dangle
    (Object.keys(this.eventEmitter._events) as EventStringId[]).forEach((eventNameId) => {
      if (eventNameId.startsWith(handlerNamePrefix)) {
        if (eventTypeToKeep) {
          if (Array.isArray(eventTypeToKeep)) {
            if (
              !eventTypeToKeep.find((eventType: string) => {
                return eventNameId.startsWith(`${handlerNamePrefix}/${eventType}`);
              })
            )
              this.off(eventNameId);
          } else if (!eventNameId.startsWith(`${handlerNamePrefix}/${eventTypeToKeep}`)) this.off(eventNameId);
        } else this.off(eventNameId);
      }
    });
  };

  /**
   * Will emit the event on the event name with the @payload
   *
   * @param {object} payload a payload (data) to be emitted for the event
   */
  emit = (payload: PayloadBaseClass): void => {
    const { handlerName, event } = payload;
    const eventName = `${handlerName ? `${handlerName}/` : ''}${event}`;
    this.eventEmitter.emit(eventName, { ...payload, handlerName }, handlerName);
  };

  // #region SPECIALIZED EVENTS - IMPORTANT

  // #region EVENT_APPBAR_PANEL_CREATE --------------------------------------------------------------------------------

  emitCreateAppBarPanel = (mapId: string, buttonId: string, group: string, buttonPanel: TypeButtonPanel) => {
    // Emit
    this.emit(buttonPanelPayload(EVENT_NAMES.APPBAR.EVENT_APPBAR_PANEL_CREATE, mapId, buttonId, group, buttonPanel));
  };

  onCreateAppBarPanel = (mapId: string, callback: (buttonPanel: ButtonPanelPayload) => void) => {
    // Wire
    this.on(
      EVENT_NAMES.APPBAR.EVENT_APPBAR_PANEL_CREATE,
      (payload: PayloadBaseClass<EventStringId>) => {
        // Log
        logger.logTraceCoreAPIEvent('APPBAR.EVENT_APPBAR_PANEL_CREATE', payload);

        // Payload check, likely unecessary, check later..
        if (payloadIsAButtonPanel(payload)) {
          // Sure callback
          callback(payload as ButtonPanelPayload);
        }
      },
      mapId
    );
  };

  offCreateAppBarPanel = (mapId: string, callback: (buttonPanel: ButtonPanelPayload) => void) => {
    // Unwire
    this.off(EVENT_NAMES.APPBAR.EVENT_APPBAR_PANEL_CREATE, mapId, callback as TypeEventHandlerFunction);
  };

  // #endregion

  // #region EVENT_APPBAR_PANEL_REMOVE --------------------------------------------------------------------------------

  emitRemoveAppBarPanel = (mapId: string, buttonId: string, group: string, buttonPanel: TypeButtonPanel) => {
    // Emit
    this.emit(buttonPanelPayload(EVENT_NAMES.APPBAR.EVENT_APPBAR_PANEL_REMOVE, mapId, buttonId, group, buttonPanel));
  };

  onRemoveAppBarPanel = (mapId: string, callback: (buttonPanel: ButtonPanelPayload) => void) => {
    // Wire
    this.on(
      EVENT_NAMES.APPBAR.EVENT_APPBAR_PANEL_REMOVE,
      (payload: PayloadBaseClass<EventStringId>) => {
        // Log
        logger.logTraceCoreAPIEvent('APPBAR.EVENT_APPBAR_PANEL_REMOVE', payload);

        // Payload check, likely unecessary, check later..
        if (payloadIsAButtonPanel(payload)) {
          // Sure callback
          callback(payload as ButtonPanelPayload);
        }
      },
      mapId
    );
  };

  offRemoveAppBarPanel = (mapId: string, callback: (buttonPanel: ButtonPanelPayload) => void) => {
    // Unwire
    this.off(EVENT_NAMES.APPBAR.EVENT_APPBAR_PANEL_REMOVE, mapId, callback as TypeEventHandlerFunction);
  };

  // #endregion

  // #region EVENT_NAVBAR_BUTTON_PANEL_CREATE -------------------------------------------------------------------------

  emitCreateNavBarPanel = (mapId: string, buttonId: string, group: string, buttonPanel: TypeButtonPanel) => {
    // Emit
    this.emit(buttonPanelPayload(EVENT_NAMES.NAVBAR.EVENT_NAVBAR_BUTTON_PANEL_CREATE, mapId, buttonId, group, buttonPanel));
  };

  onCreateNavBarPanel = (mapId: string, callback: (buttonPanel: ButtonPanelPayload) => void) => {
    // Wire
    this.on(
      EVENT_NAMES.NAVBAR.EVENT_NAVBAR_BUTTON_PANEL_CREATE,
      (payload: PayloadBaseClass<EventStringId>) => {
        // Log
        logger.logTraceCoreAPIEvent('NAVBAR.EVENT_NAVBAR_BUTTON_PANEL_CREATE', payload);

        // Payload check, likely unecessary, check later..
        if (payloadIsAButtonPanel(payload)) {
          // Sure callback
          callback(payload as ButtonPanelPayload);
        }
      },
      mapId
    );
  };

  offCreateNavBarPanel = (mapId: string, callback: (buttonPanel: ButtonPanelPayload) => void) => {
    // Unwire
    this.off(EVENT_NAMES.NAVBAR.EVENT_NAVBAR_BUTTON_PANEL_CREATE, mapId, callback as TypeEventHandlerFunction);
  };

  // #endregion

  // #region EVENT_NAVBAR_BUTTON_PANEL_REMOVE -------------------------------------------------------------------------

  emitRemoveNavBarPanel = (mapId: string, buttonId: string, group: string, buttonPanel: TypeButtonPanel) => {
    // Emit
    this.emit(buttonPanelPayload(EVENT_NAMES.NAVBAR.EVENT_NAVBAR_BUTTON_PANEL_REMOVE, mapId, buttonId, group, buttonPanel));
  };

  onRemoveNavBarPanel = (mapId: string, callback: (buttonPanel: ButtonPanelPayload) => void) => {
    // Wire
    this.on(
      EVENT_NAMES.NAVBAR.EVENT_NAVBAR_BUTTON_PANEL_REMOVE,
      (payload: PayloadBaseClass<EventStringId>) => {
        // Log
        logger.logTraceCoreAPIEvent('NAVBAR.EVENT_NAVBAR_BUTTON_PANEL_REMOVE', payload);

        // Payload check, likely unecessary, check later..
        if (payloadIsAButtonPanel(payload)) {
          // Sure callback
          callback(payload as ButtonPanelPayload);
        }
      },
      mapId
    );
  };

  offRemoveNavBarPanel = (mapId: string, callback: (buttonPanel: ButtonPanelPayload) => void) => {
    // Unwire
    this.off(EVENT_NAMES.NAVBAR.EVENT_NAVBAR_BUTTON_PANEL_REMOVE, mapId, callback as TypeEventHandlerFunction);
  };

  // #endregion

  // #region EVENT_FOOTERBAR_TAB_CREATE -------------------------------------------------------------------------------

  emitCreateFooterBarPanel = (mapId: string, tabProps: TypeTabs) => {
    // Emit
    this.emit(footerBarPayload(EVENT_NAMES.FOOTERBAR.EVENT_FOOTERBAR_TAB_CREATE, mapId, tabProps));
  };

  onCreateFooterBarPanel = (mapId: string, callback: (footerBarPayload: FooterBarPayload) => void) => {
    // Wire
    this.on(
      EVENT_NAMES.FOOTERBAR.EVENT_FOOTERBAR_TAB_CREATE,
      (payload: PayloadBaseClass<EventStringId>) => {
        // Log
        logger.logTraceCoreAPIEvent('FOOTERBAR.EVENT_FOOTERBAR_TAB_CREATE', payload);

        // Payload check, likely unecessary, check later..
        if (payloadIsAFooterBar(payload)) {
          // Sure callback
          callback(payload as FooterBarPayload);
        }
      },
      mapId
    );
  };

  offCreateFooterBarPanel = (mapId: string, callback: (footerBarPayload: FooterBarPayload) => void) => {
    // Unwire
    this.off(EVENT_NAMES.FOOTERBAR.EVENT_FOOTERBAR_TAB_CREATE, mapId, callback as TypeEventHandlerFunction);
  };

  // #endregion

  // #region EVENT_FOOTERBAR_TAB_REMOVE -------------------------------------------------------------------------------

  emitRemoveFooterBarPanel = (mapId: string, tabToRemove: TypeTabs) => {
    // Emit
    this.emit(footerBarPayload(EVENT_NAMES.FOOTERBAR.EVENT_FOOTERBAR_TAB_REMOVE, mapId, tabToRemove));
  };

  onRemoveFooterBarPanel = (mapId: string, callback: (footerBarPayload: FooterBarPayload) => void) => {
    // Wire
    this.on(
      EVENT_NAMES.FOOTERBAR.EVENT_FOOTERBAR_TAB_REMOVE,
      (payload: PayloadBaseClass<EventStringId>) => {
        // Log
        logger.logTraceCoreAPIEvent('FOOTERBAR.EVENT_FOOTERBAR_TAB_REMOVE', payload);

        // Payload check, likely unecessary, check later..
        if (payloadIsAFooterBar(payload)) {
          // Sure callback
          callback(payload as FooterBarPayload);
        }
      },
      mapId
    );
  };

  offRemoveFooterBarPanel = (mapId: string, callback: (footerBarPayload: FooterBarPayload) => void) => {
    // Unwire
    this.off(EVENT_NAMES.FOOTERBAR.EVENT_FOOTERBAR_TAB_REMOVE, mapId, callback as TypeEventHandlerFunction);
  };

  // #endregion

  // #region EVENT_SNACKBAR_OPEN --------------------------------------------------------------------------------------

  emitSnackbarOpen = (mapId: string, type: SnackbarType, message: string, button?: TypeJsonObject) => {
    // Emit
    this.emit(snackbarMessagePayload(EVENT_NAMES.SNACKBAR.EVENT_SNACKBAR_OPEN, mapId, type, message, button));
  };

  onSnackbarOpen = (mapId: string, callback: (snackbarPayload: SnackbarMessagePayload) => void) => {
    // Wire
    this.on(
      EVENT_NAMES.SNACKBAR.EVENT_SNACKBAR_OPEN,
      (payload: PayloadBaseClass<EventStringId>) => {
        // Log
        logger.logTraceCoreAPIEvent('SNACKBAR.EVENT_SNACKBAR_OPEN', payload);

        // Payload check, likely unecessary, check later..
        if (payloadIsASnackbarMessage(payload)) {
          // Sure callback
          callback(payload as SnackbarMessagePayload);
        }
      },
      mapId
    );
  };

  offSnackbarOpen = (mapId: string, callback: (snackbarPayload: SnackbarMessagePayload) => void) => {
    // Unwire
    this.off(EVENT_NAMES.SNACKBAR.EVENT_SNACKBAR_OPEN, mapId, callback as TypeEventHandlerFunction);
  };

  // #endregion

  // #endregion

  // #region SPECIALIZED EVENTS - UNSURE

  // #region EVENT_MAP_IN_KEYFOCUS ------------------------------------------------------------------------------------

  emitMapInKeyFocus = (mapId: string) => {
    // Emit
    this.emit(inKeyfocusPayload(EVENT_NAMES.MAP.EVENT_MAP_IN_KEYFOCUS, `map-${mapId}`));
  };

  onMapInKeyFocus = (mapId: string, callback: () => void) => {
    // Wire
    this.on(
      EVENT_NAMES.MAP.EVENT_MAP_IN_KEYFOCUS,
      (payload: PayloadBaseClass<EventStringId>) => {
        // Log
        logger.logTraceCoreAPIEvent('MAP.EVENT_MAP_IN_KEYFOCUS', payload);

        // Payload check, likely unecessary, check later..
        if (payloadIsAInKeyfocus(payload)) {
          // Sure callback
          callback();
        }
      },
      mapId
    );
  };

  offMapInKeyFocus = (mapId: string, callback: () => void) => {
    // Unwire
    this.off(EVENT_NAMES.MAP.EVENT_MAP_IN_KEYFOCUS, mapId, callback as TypeEventHandlerFunction);
  };

  // #endregion

  // #endregion

  // #region SPECIALIZED EVENTS - OBSOLETE

  // TODO: Move some that are hard to refactor here temporarily

  // #endregion
}
