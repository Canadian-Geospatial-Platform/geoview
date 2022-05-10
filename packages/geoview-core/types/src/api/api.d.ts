import { Map } from 'leaflet';
import { Event } from './events/event';
import { Projection } from '../geo/projection/projection';
import { MapViewer } from '../geo/map/map';
import { Plugin } from './plugin';
import { GeoUtilities } from '../geo/utils/utilities';
import { DateMgt } from '../core/utils/date-mgt';
import * as MarkerDefinitions from '../core/types/marker-definitions';
import { generateId } from '../core/utils/utilities';
import { addUiComponent } from '../core/utils/utilities';
/**
 * Class used to handle api calls (events, functions etc...)
 *
 * @export
 * @class API
 */
export declare class API {
    event: Event;
    eventNames: {
        MAP: Record<import("./events/constants/map").MapEventKey, import("./events/event").EventStringId>;
        LAYER: Record<import("./events/constants/layer").LayerEventKey, import("./events/event").EventStringId>;
        APPBAR: Record<import("./events/constants/appbar").AppbarEventKey, import("./events/event").EventStringId>;
        NAVBAR: Record<import("./events/constants/navbar").NavbarEventKey, import("./events/event").EventStringId>;
        SNACKBAR: Record<"EVENT_SNACKBAR_OPEN", import("./events/event").EventStringId>;
        BASEMAP: Record<"EVENT_BASEMAP_LAYERS_UPDATE", import("./events/event").EventStringId>;
        OVERVIEW_MAP: Record<"EVENT_OVERVIEW_MAP_TOGGLE", import("./events/event").EventStringId>;
        DETAILS_PANEL: Record<"EVENT_DETAILS_PANEL_CROSSHAIR_ENTER", import("./events/event").EventStringId>;
        MARKER_ICON: Record<import("./events/constants/marker-icon").MarkerIconEventKey, import("./events/event").EventStringId>;
        CLUSTER_ELEMENT: Record<import("./events/constants/cluster-element").ClusterEventKey, import("./events/event").EventStringId>;
        DRAWER: Record<"EVENT_DRAWER_OPEN_CLOSE", import("./events/event").EventStringId>;
        MODAL: Record<import("./events/constants/modal").ModalEventKey, import("./events/event").EventStringId>;
        PANEL: Record<import("./events/constants/panel").PanelEventKey, import("./events/event").EventStringId>;
        SLIDER: Record<import("./events/constants/slider").SliderEventKey, import("./events/event").EventStringId>;
        VECTOR: Record<import("./events/constants/vector").VectorEventKey, import("./events/event").EventStringId>;
    };
    projection: Projection;
    projectNames: {
        LCC: string;
        WM: string;
        LATLNG: string;
    };
    layerTypes: Record<import("../core/types/cgpv-types").LayerTypesKey, import("../core/types/cgpv-types").TypeWebLayers>;
    maps: Record<string, MapViewer>;
    isReady: number;
    readyCallback: () => void;
    plugin: Plugin;
    geoUtilities: GeoUtilities;
    dateUtilities: DateMgt;
    markerDefinitions: typeof MarkerDefinitions;
    generateId: typeof generateId;
    addUiComponent: typeof addUiComponent;
    /**
     * Initiate the event and projection objects
     */
    constructor();
    /**
     */
    /**
     * Check if map rendering / drawing is ready then run the callback function
     * Timeout does not effect rendering speed, each map will cancel the previous timer after it renders
     * so timing of rendering will be based on device specs.
     *
     * @param callback a callback to make once the map has rendered
     */
    ready: (callback: () => void) => void;
    /**
     * Get the instance of a map by it's ID to access API functions
     *
     * @param {string} id the map id
     *
     * @returns map api functions
     */
    map: (id: string) => MapViewer;
    /**
     * Get the instance of a map by a leaflet instance to access API functions
     *
     * @param {Map} map the leaflet map instance
     *
     * @returns {MapViewer | undefined} the map instance
     */
    mapInstance: (map: Map) => MapViewer | undefined;
}
