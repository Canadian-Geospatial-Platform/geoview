import EventEmitter from 'eventemitter3';

import { logger } from '@/core/utils/logger';
import { TypeButtonPanel, TypeTabs, TypeMapFeaturesConfig } from '@/core/types/global-types';

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
  payloadIsASnackbarMessage,
  snackbarMessagePayload,
  SnackbarType,
  SnackbarMessagePayload,
  ISnackbarButton,
  ModalPayload,
  modalPayload,
  payloadIsAModal,
  mapComponentPayload,
  payloadIsAMapComponent,
  MapComponentPayload,
  payloadIsAmapFeaturesConfig,
  MapFeaturesPayload,
  mapConfigPayload,
  LayerSetPayload,
  payloadIsLayerRegistration,
  TypeLayerRegistrationPayload,
  GetLegendsPayload,
  TypeLegendInfoPayload,
  payloadIsLegendInfo,
  payloadIsQueryLegend,
  TypeQueryLegendPayload,
  payloadIsRequestLayerInventory,
  TypeRequestLayerInventoryPayload,
  payloadIsLayerSetChangeLayerStatus,
  TypeLayerSetChangeLayerStatusPayload,
  payloadIsLayerSetUpdated,
  TypeLayerSetUpdatedPayload,
  TypeResultSet,
} from './payloads';
import { TypeLegend } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { TypeLayerStatus } from '@/geo/map/map-schema-types';

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
    // TODO: Refactor - Turn the event.on private scope once all events have been specialized
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
    // TODO: Refactor - Turn the event.once private scope once all events have been specialized
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
    // TODO: Refactor - Turn the event.off private scope once all events have been specialized
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
    // TODO: Refactor - Turn the event.offAll private scope once all events have been specialized
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
    // TODO: Refactor - Turn the event.emit private scope once all events have been specialized
    const { handlerName, event } = payload;
    const eventName = `${handlerName ? `${handlerName}/` : ''}${event}`;
    this.eventEmitter.emit(eventName, { ...payload, handlerName }, handlerName);
  };

  /**
   * Helper function to wire an EventStringId and check the payload on response before calling back.
   * @param mapId The map Id
   * @param eventStringId The Event String Id
   * @param checkCallback The callback executed when validating the payload
   * @param callback The callback executed when the event is raised and the payload has been validated
   */
  private onMapHelperHandler = <T = PayloadBaseClass<EventStringId>>(
    mapId: string,
    eventStringId: EventStringId,
    checkCallback: (payload: PayloadBaseClass<EventStringId>) => boolean,
    callback: (typedPayload: T) => void
  ) => {
    // Wire
    this.on(
      eventStringId,
      (payload: PayloadBaseClass<EventStringId>) => {
        // Log
        logger.logTraceCoreAPIEvent(eventStringId, payload);

        // Payload check, likely unecessary, check later in another eventual refactor..
        if (checkCallback(payload)) {
          // Sure callback
          callback(payload as T);
        } else {
          // Log an error as that shouldn't be possible
          logger.logError('THIS CALLBACK PAYLOAD IS WRONG!!', eventStringId, payload);
        }
      },
      mapId
    );
  };

  // #region SPECIALIZED EVENTS - IMPORTANT
  // ! These events exists to communicate between the Shell/MapViewer and the App-Bar/Nav-Bar/Footer-Bar components.
  // ! The laters are mounted and then 'autonomous'. They rely on events to self-manage their rendering.
  // ! Ideally, we should get rid of those events and use props inside App-Bar/Nav-Bar/Footer-Bar and have the management
  // ! higher in the call stack. At the time of writing this, having them explicit here was sufficient as a first step
  // ! in cleaning generic api.event calls and payloads.

  // #region EVENT_APPBAR_PANEL_CREATE --------------------------------------------------------------------------------

  emitCreateAppBarPanel = (mapId: string, buttonId: string, group: string, buttonPanel: TypeButtonPanel) => {
    // Emit
    this.emit(buttonPanelPayload(EVENT_NAMES.APPBAR.EVENT_APPBAR_PANEL_CREATE, mapId, buttonId, group, buttonPanel));
  };

  onCreateAppBarPanel = (mapId: string, callback: (buttonPanel: ButtonPanelPayload) => void) => {
    // Wire
    this.onMapHelperHandler(mapId, EVENT_NAMES.APPBAR.EVENT_APPBAR_PANEL_CREATE, payloadIsAButtonPanel, callback);
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
    this.onMapHelperHandler(mapId, EVENT_NAMES.APPBAR.EVENT_APPBAR_PANEL_REMOVE, payloadIsAButtonPanel, callback);
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
    this.onMapHelperHandler(mapId, EVENT_NAMES.NAVBAR.EVENT_NAVBAR_BUTTON_PANEL_CREATE, payloadIsAButtonPanel, callback);
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
    this.onMapHelperHandler(mapId, EVENT_NAMES.NAVBAR.EVENT_NAVBAR_BUTTON_PANEL_REMOVE, payloadIsAButtonPanel, callback);
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
    this.onMapHelperHandler(mapId, EVENT_NAMES.FOOTERBAR.EVENT_FOOTERBAR_TAB_CREATE, payloadIsAFooterBar, callback);
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
    this.onMapHelperHandler(mapId, EVENT_NAMES.FOOTERBAR.EVENT_FOOTERBAR_TAB_REMOVE, payloadIsAFooterBar, callback);
  };

  offRemoveFooterBarPanel = (mapId: string, callback: (footerBarPayload: FooterBarPayload) => void) => {
    // Unwire
    this.off(EVENT_NAMES.FOOTERBAR.EVENT_FOOTERBAR_TAB_REMOVE, mapId, callback as TypeEventHandlerFunction);
  };

  // #endregion

  // #region EVENT_SNACKBAR_OPEN --------------------------------------------------------------------------------------

  emitSnackbarOpen = (mapId: string, type: SnackbarType, message: string, button?: ISnackbarButton) => {
    // Emit
    this.emit(snackbarMessagePayload(EVENT_NAMES.SNACKBAR.EVENT_SNACKBAR_OPEN, mapId, type, message, button));
  };

  onSnackbarOpen = (mapId: string, callback: (snackbarPayload: SnackbarMessagePayload) => void) => {
    // Wire
    this.onMapHelperHandler(mapId, EVENT_NAMES.SNACKBAR.EVENT_SNACKBAR_OPEN, payloadIsASnackbarMessage, callback);
  };

  offSnackbarOpen = (mapId: string, callback: (snackbarPayload: SnackbarMessagePayload) => void) => {
    // Unwire
    this.off(EVENT_NAMES.SNACKBAR.EVENT_SNACKBAR_OPEN, mapId, callback as TypeEventHandlerFunction);
  };

  // #endregion

  // #region EVENT_MAP_ADD_COMPONENT ----------------------------------------------------------------------------------

  emitCreateComponent = (mapId: string, mapComponentId: string, component: JSX.Element) => {
    // Emit
    this.emit(mapComponentPayload(EVENT_NAMES.MAP.EVENT_MAP_ADD_COMPONENT, mapId, mapComponentId, component));
  };

  onCreateComponent = (mapId: string, callback: (mapComponentPayload: MapComponentPayload) => void) => {
    // Wire
    this.onMapHelperHandler(mapId, EVENT_NAMES.MAP.EVENT_MAP_ADD_COMPONENT, payloadIsAMapComponent, callback);
  };

  offCreateComponent = (mapId: string, callback: (mapComponentPayload: MapComponentPayload) => void) => {
    // Unwire
    this.off(EVENT_NAMES.MAP.EVENT_MAP_ADD_COMPONENT, mapId, callback as TypeEventHandlerFunction);
  };

  // #endregion

  // #region EVENT_MAP_REMOVE_COMPONENT -------------------------------------------------------------------------------

  emitRemoveComponent = (mapId: string, mapComponentId: string) => {
    // Emit
    this.emit(mapComponentPayload(EVENT_NAMES.MAP.EVENT_MAP_REMOVE_COMPONENT, mapId, mapComponentId));
  };

  onRemoveComponent = (mapId: string, callback: (mapComponentPayload: MapComponentPayload) => void) => {
    // Wire
    this.onMapHelperHandler(mapId, EVENT_NAMES.MAP.EVENT_MAP_REMOVE_COMPONENT, payloadIsAMapComponent, callback);
  };

  offRemoveComponent = (mapId: string, callback: (mapComponentPayload: MapComponentPayload) => void) => {
    // Unwire
    this.off(EVENT_NAMES.MAP.EVENT_MAP_REMOVE_COMPONENT, mapId, callback as TypeEventHandlerFunction);
  };

  // #endregion

  // #endregion

  // #region SPECIALIZED EVENTS - UNSURE
  // ! These events exists to communicate between different application code and components.
  // ! They are annoying to have, but unsure if worth spending time to refactor. They have less reason to exist than the
  // ! 'IMPORTANT' ones above. However, at the time of writing this having them here was sufficient
  // ! as a first step in cleaning generic api.event calls and payloads.

  // #region EVENT_MODAL_OPEN -----------------------------------------------------------------------------------------

  emitModalOpen = (mapId: string, modalId: string) => {
    // Emit
    this.emit(modalPayload(EVENT_NAMES.MODAL.EVENT_MODAL_OPEN, mapId, modalId, true));
  };

  onModalOpen = (mapId: string, callback: (modalPayload: ModalPayload) => void) => {
    // Wire
    this.onMapHelperHandler(mapId, EVENT_NAMES.MODAL.EVENT_MODAL_OPEN, payloadIsAModal, callback);
  };

  offModalOpen = (mapId: string, callback: (modalPayload: ModalPayload) => void) => {
    // Unwire
    this.off(EVENT_NAMES.MODAL.EVENT_MODAL_OPEN, mapId, callback as TypeEventHandlerFunction);
  };

  // #endregion

  // #region EVENT_MODAL_CLOSE ----------------------------------------------------------------------------------------

  emitModalClose = (mapId: string, modalId: string) => {
    // Emit
    this.emit(modalPayload(EVENT_NAMES.MODAL.EVENT_MODAL_CLOSE, mapId, modalId, false));
  };

  onModalClose = (mapId: string, callback: (modalPayload: ModalPayload) => void) => {
    // Wire
    this.onMapHelperHandler(mapId, EVENT_NAMES.MODAL.EVENT_MODAL_CLOSE, payloadIsAModal, callback);
  };

  offModalClose = (mapId: string, callback: (modalPayload: ModalPayload) => void) => {
    // Unwire
    this.off(EVENT_NAMES.MODAL.EVENT_MODAL_CLOSE, mapId, callback as TypeEventHandlerFunction);
  };

  // #endregion

  // #region EVENT_MAP_IN_KEYFOCUS ------------------------------------------------------------------------------------

  emitMapInKeyFocus = (mapId: string) => {
    // Emit
    this.emit(inKeyfocusPayload(EVENT_NAMES.MAP.EVENT_MAP_IN_KEYFOCUS, `map-${mapId}`));
  };

  onMapInKeyFocus = (mapId: string, callback: () => void) => {
    // Wire
    this.onMapHelperHandler(mapId, EVENT_NAMES.MAP.EVENT_MAP_IN_KEYFOCUS, payloadIsAInKeyfocus, callback);
  };

  offMapInKeyFocus = (mapId: string, callback: () => void) => {
    // Unwire
    this.off(EVENT_NAMES.MAP.EVENT_MAP_IN_KEYFOCUS, mapId, callback as TypeEventHandlerFunction);
  };

  // #endregion

  // #region EVENT_MAP_RELOAD -----------------------------------------------------------------------------------------

  emitMapReload = (mapId: string, mapFeaturesConfig: TypeMapFeaturesConfig) => {
    // TODO: Refactor - The payload requires a TypeMapFeaturesConfig, but the onMapReload callback currently implement doesn't use it.
    // TO.DOCONT: Suggestion to remove the mapFeaturesConfig from the payload altogether if the listeners don't use it.
    // Emit
    this.emit(mapConfigPayload(EVENT_NAMES.MAP.EVENT_MAP_RELOAD, mapId, mapFeaturesConfig));
  };

  onMapReload = (mapId: string, callback: (mapFeaturesPayload: MapFeaturesPayload) => void) => {
    // Wire
    this.onMapHelperHandler(mapId, EVENT_NAMES.MAP.EVENT_MAP_RELOAD, payloadIsAmapFeaturesConfig, callback);
  };

  offMapReload = (mapId: string, callback: (mapFeaturesPayload: MapFeaturesPayload) => void) => {
    // Unwire
    this.off(EVENT_NAMES.MAP.EVENT_MAP_RELOAD, mapId, callback as TypeEventHandlerFunction);
  };

  // #endregion

  // #region EVENT_MAP_RELOAD (remove) --------------------------------------------------------------------------------

  emitMapReloadRemove = (mapId: string, mapFeaturesConfig: TypeMapFeaturesConfig) => {
    // Emit
    this.emit(mapConfigPayload(EVENT_NAMES.MAP.EVENT_MAP_RELOAD, `${mapId}/delete_old_map`, mapFeaturesConfig));
  };

  onMapReloadRemove = (mapId: string, callback: (mapFeaturesPayload: MapFeaturesPayload) => void) => {
    // Wire
    this.onMapHelperHandler(`${mapId}/delete_old_map`, EVENT_NAMES.MAP.EVENT_MAP_RELOAD, payloadIsAmapFeaturesConfig, callback);
  };

  offMapReloadRemove = (mapId: string, callback: (mapFeaturesPayload: MapFeaturesPayload) => void) => {
    // Unwire
    this.off(EVENT_NAMES.MAP.EVENT_MAP_RELOAD, `${mapId}/delete_old_map`, callback as TypeEventHandlerFunction);
  };

  // #endregion

  // #endregion

  // #region SPECIALIZED EVENTS - OBSOLETE
  // ! These events exists to communicate between different application code and components.
  // ! They should be fixed/removed altogether as they don't have a 'valid' reason to exist or their refactoring would be beneficial.
  // ! At the time writing this, having them here was sufficient as a first step in cleaning generic api.event calls and payloads.

  // #region REQUEST_LAYER_INVENTORY ----------------------------------------------------------------------------------

  emitLayerInventoryQuery = (mapId: string, layerSetId: string) => {
    // Emit
    this.emit(LayerSetPayload.createRequestLayerInventoryPayload(mapId, layerSetId));
  };

  onLayerInventoryQuery = (mapId: string, callback: (layerInventory: TypeRequestLayerInventoryPayload) => void) => {
    // Wire
    this.onMapHelperHandler(mapId, EVENT_NAMES.LAYER_SET.REQUEST_LAYER_INVENTORY, payloadIsRequestLayerInventory, callback);
  };

  offLayerInventoryQuery = (mapId: string, callback: (layerRegistration: TypeRequestLayerInventoryPayload) => void) => {
    // Unwire
    this.off(EVENT_NAMES.LAYER_SET.REQUEST_LAYER_INVENTORY, mapId, callback as TypeEventHandlerFunction);
  };

  // #endregion

  // #region LAYER_REGISTRATION ---------------------------------------------------------------------------------------

  emitLayerRegistration = (mapId: string, layerPath: string, action: 'add' | 'remove', layerSetId?: string) => {
    // Emit
    this.emit(LayerSetPayload.createLayerRegistrationPayload(mapId, layerPath, action, layerSetId));
  };

  onLayerRegistration = (mapId: string, callback: (layerRegistration: TypeLayerRegistrationPayload) => void) => {
    // Wire
    this.onMapHelperHandler(mapId, EVENT_NAMES.LAYER_SET.LAYER_REGISTRATION, payloadIsLayerRegistration, callback);
  };

  offLayerRegistration = (mapId: string, callback: (layerRegistration: TypeLayerRegistrationPayload) => void) => {
    // Unwire
    this.off(EVENT_NAMES.LAYER_SET.LAYER_REGISTRATION, mapId, callback as TypeEventHandlerFunction);
  };

  // #endregion

  // #region LAYER_SET.UPDATED ----------------------------------------------------------------------------------------

  emitLayerSetUpdated = (layerSetId: string, layerPath: string, resultSet: TypeResultSet) => {
    // Emit
    this.emit(LayerSetPayload.createLayerSetUpdatedPayload(layerSetId, resultSet, layerPath));
  };

  onLayerSetUpdated = (layerSetId: string, callback: (layerSetUpdated: TypeLayerSetUpdatedPayload) => void) => {
    // Wire
    this.onMapHelperHandler(layerSetId, EVENT_NAMES.LAYER_SET.UPDATED, payloadIsLayerSetUpdated, callback);
  };

  offLayerSetUpdated = (layerSetId: string, callback: (layerSetUpdated: TypeLayerSetUpdatedPayload) => void) => {
    // Unwire
    this.off(EVENT_NAMES.LAYER_SET.UPDATED, layerSetId, callback as TypeEventHandlerFunction);
  };

  // #endregion

  // #region CHANGE_LAYER_STATUS --------------------------------------------------------------------------------------

  emitLayerStatusChanged = (mapId: string, layerPath: string, status: TypeLayerStatus) => {
    // Emit
    this.emit(LayerSetPayload.createLayerSetChangeLayerStatusPayload(mapId, layerPath, status));
  };

  onLayerStatusChanged = (mapId: string, callback: (layerStatusChanged: TypeLayerSetChangeLayerStatusPayload) => void) => {
    // Wire
    this.onMapHelperHandler(mapId, EVENT_NAMES.LAYER_SET.CHANGE_LAYER_STATUS, payloadIsLayerSetChangeLayerStatus, callback);
  };

  offLayerStatusChanged = (mapId: string, callback: (layerStatusChanged: TypeLayerSetChangeLayerStatusPayload) => void) => {
    // Unwire
    this.off(EVENT_NAMES.LAYER_SET.CHANGE_LAYER_STATUS, mapId, callback as TypeEventHandlerFunction);
  };

  // #endregion

  // #region QUERY_LEGEND ---------------------------------------------------------------------------------------------

  emitLayerLegendQuery = (mapId: string, layerPath: string) => {
    // Emit
    this.emit(GetLegendsPayload.createQueryLegendPayload(`${mapId}/${layerPath}`, layerPath));
  };

  onLayerLegendQuery = (mapId: string, layerPath: string, callback: (legendInfo: TypeQueryLegendPayload) => void) => {
    // Wire
    this.onMapHelperHandler(`${mapId}/${layerPath}`, EVENT_NAMES.GET_LEGENDS.QUERY_LEGEND, payloadIsQueryLegend, callback);
  };

  offLayerLegendQuery = (mapId: string, layerPath: string, callback: (legendInfo: TypeQueryLegendPayload) => void) => {
    // Unwire
    this.off(EVENT_NAMES.GET_LEGENDS.QUERY_LEGEND, `${mapId}/${layerPath}`, callback as TypeEventHandlerFunction);
  };

  // #endregion

  // #region LEGEND_INFO ----------------------------------------------------------------------------------------------

  emitLayerLegendInfo = (mapId: string, layerPath: string, queryResult: TypeLegend | null) => {
    // Emit
    this.emit(GetLegendsPayload.createLegendInfoPayload(mapId, layerPath, queryResult));
  };

  onLayerLegendInfo = (mapId: string, callback: (legendInfo: TypeLegendInfoPayload) => void) => {
    // Wire
    this.onMapHelperHandler(mapId, EVENT_NAMES.GET_LEGENDS.LEGEND_INFO, payloadIsLegendInfo, callback);
  };

  offLayerLegendInfo = (mapId: string, callback: (legendInfo: TypeLegendInfoPayload) => void) => {
    // Unwire
    this.off(EVENT_NAMES.GET_LEGENDS.LEGEND_INFO, mapId, callback as TypeEventHandlerFunction);
  };

  // #endregion

  // #endregion
}
