import EventEmitter from 'eventemitter3';
import { MapEventKey } from './constants/map';
import { LayerEventKey } from './constants/layer';
import { AppbarEventKey } from './constants/appbar';
import { NavbarEventKey } from './constants/navbar';
import { SnackbarEventKey } from './constants/snackbar';
import { BasmapEventKey } from './constants/basemap';
import { OverviewEventKey } from './constants/overview-map';
import { DetailPanelEventKey } from './constants/details-panel';
import { MarkerIconEventKey } from './constants/marker-icon';
import { ClusterEventKey } from './constants/cluster-element';
import { DrawerEventKey } from './constants/drawer';
import { ModalEventKey } from './constants/modal';
import { PanelEventKey } from './constants/panel';
import { SliderEventKey } from './constants/slider';
import { VectorEventKey } from './constants/vector';
import { PayloadBaseClass } from './payloads/payload-base-class';
/**
 * constant contains event names
 */
export declare const EVENT_NAMES: {
    MAP: Record<MapEventKey, EventStringId>;
    LAYER: Record<LayerEventKey, EventStringId>;
    APPBAR: Record<AppbarEventKey, EventStringId>;
    NAVBAR: Record<NavbarEventKey, EventStringId>;
    SNACKBAR: Record<"EVENT_SNACKBAR_OPEN", EventStringId>;
    BASEMAP: Record<"EVENT_BASEMAP_LAYERS_UPDATE", EventStringId>;
    OVERVIEW_MAP: Record<"EVENT_OVERVIEW_MAP_TOGGLE", EventStringId>;
    DETAILS_PANEL: Record<"EVENT_DETAILS_PANEL_CROSSHAIR_ENTER", EventStringId>;
    MARKER_ICON: Record<MarkerIconEventKey, EventStringId>;
    CLUSTER_ELEMENT: Record<ClusterEventKey, EventStringId>;
    DRAWER: Record<"EVENT_DRAWER_OPEN_CLOSE", EventStringId>;
    MODAL: Record<ModalEventKey, EventStringId>;
    PANEL: Record<PanelEventKey, EventStringId>;
    SLIDER: Record<SliderEventKey, EventStringId>;
    VECTOR: Record<VectorEventKey, EventStringId>;
};
export declare type EventCategories = 'MAP' | 'LAYER' | 'APPBAR' | 'NAVBAR' | 'SNACKBAR' | 'BASEMAP' | 'OVERVIEW_MAP' | 'DETAILS_PANEL' | 'MARKER_ICON' | 'CLUSTER_ELEMENT' | 'DRAWER' | 'MODAL' | 'PANEL' | 'SLIDER' | 'VECTOR';
export declare type EventKey = MapEventKey | LayerEventKey | AppbarEventKey | NavbarEventKey | SnackbarEventKey | BasmapEventKey | OverviewEventKey | DetailPanelEventKey | MarkerIconEventKey | ClusterEventKey | DrawerEventKey | ModalEventKey | PanelEventKey | SliderEventKey | VectorEventKey;
export declare type EventStringId = 'map/loaded' | 'map/reload' | 'map/moveend' | 'map/zoomend' | 'map/add_component' | 'map/remove_component' | 'map/inkeyfocus' | 'map/crosshair_enable_disable' | 'layer/add' | 'layer/added' | 'layer/remove' | 'layer/get_layers' | 'appbar/panel_create' | 'appbar/panel_remove' | 'navbar/button_panel_create' | 'navbar/button_panel_remove' | 'navbar/toggle_controls' | 'snackbar/open' | 'basemap/layers_update' | 'overview_map/toggle' | 'details_panel/crosshair_enter' | 'marker_icon/show' | 'marker_icon/hide' | 'cluster_element/add' | 'cluster_element/remove' | 'cluster_element/added' | 'cluster_element/start_blinking' | 'cluster_element/stop_blinking' | 'cluster_element/selection_has_changed' | 'box/zoom_or_select_end' | 'drawer/open_close' | 'modal/create' | 'modal/open' | 'modal/close' | 'modal/update' | 'panel/open' | 'panel/close' | 'panel/add_action' | 'panel/remove_action' | 'panel/change_content' | 'slider/on_change_value' | 'slider/set_values' | 'slider/set_min_max' | 'vector/add' | 'vector/remove' | 'vector/added' | 'vector/off' | 'vector/on';
/**
 * Class used to handle event emitting and subscribing for the API
 *
 * @export
 * @class Event
 */
export declare class Event {
    eventEmitter: EventEmitter;
    events: Record<string, Record<string, PayloadBaseClass>>;
    /**
     * Initiate the event emitter
     */
    constructor();
    /**
     * Listen to emitted events
     *
     * @param {string} eventName the event name to listen to
     * @param {function} listener the callback function
     * @param {string} [handlerName] the handler name to return data from
     * @param {string[]} args optional additional arguments
     */
    on: (eventName: EventStringId, listener: (payload: PayloadBaseClass) => void, handlerName?: string | undefined, ...args: string[]) => void;
    /**
     * Listen to emitted events once
     *
     * @param {string} eventName the event name to listen to
     * @param {function} listener the callback function
     * @param {string} [handlerName] the handler name to return data from
     * @param {string[]} args optional additional arguments
     */
    once: (eventName: EventStringId, listener: (payload: PayloadBaseClass) => void, handlerName?: string | undefined, ...args: string[]) => void;
    /**
     * Will remove the specified @listener from @eventname list
     *
     * @param {string} eventName the event name of the event to be removed
     * @param {string} handlerName the name of the handler an event needs to be removed from
     * @param {string[]} args optional additional arguments
     */
    off: (eventName: EventStringId, handlerName?: string | undefined, ...args: string[]) => void;
    /**
     * Unsubscribe from all events on the map
     *
     * @param {string} handlerName the id of the map to turn unsubscribe the event from
     */
    offAll: (handlerName: string) => void;
    /**
     * Will emit the event on the event name with the @payload
     *
     * @param {object} payload a payload (data) to be emitted for the event
     * @param {string[]} args optional additional arguments
     */
    emit: (payload: PayloadBaseClass, ...args: string[]) => void;
    /**
     * Get all the event handler names on a specified event
     * @param eventName the event name to get all it's handler names
     * @returns an array of all the event handler names
     */
    getHandlerNames: (eventName: string) => Array<string>;
    /**
     * Get all events with their data and event handler names
     * @returns all the events with their data and handler names
     */
    getEvents: () => Record<string, Record<string, PayloadBaseClass>>;
}
