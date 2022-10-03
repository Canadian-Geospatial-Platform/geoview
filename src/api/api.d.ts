import { Event } from './events/event';
import { Projection } from '../geo/projection/projection';
import { MapViewer } from '../geo/map/map';
import { Plugin } from './plugin/plugin';
import { GeoUtilities } from '../geo/utils/utilities';
import { DateMgt } from '../core/utils/date-mgt';
import * as MarkerDefinitions from '../core/types/marker-definitions';
import { generateId, addUiComponent } from '../core/utils/utilities';
/**
 * Class used to handle api calls (events, functions etc...)
 *
 * @exports
 * @class API
 */
export declare class API {
    event: Event;
    eventNames: {
        APPBAR: Record<import("../app").AppbarEventKey, import("./events/event-types").EventStringId>;
        ATTRIBUTION: Record<"EVENT_ATTRIBUTION_UPDATE", import("./events/event-types").EventStringId>;
        BASEMAP: Record<"EVENT_BASEMAP_LAYERS_UPDATE", import("./events/event-types").EventStringId>;
        DETAILS_PANEL: Record<"EVENT_DETAILS_PANEL_CROSSHAIR_ENTER", import("./events/event-types").EventStringId>;
        DRAWER: Record<"EVENT_DRAWER_OPEN_CLOSE", import("./events/event-types").EventStringId>;
        FOOTERBAR: Record<"EVENT_FOOTERBAR_EXPAND_COLLAPSE", import("./events/event-types").EventStringId>;
        FOOTER_TABS: Record<import("../app").FooterTabsEventKey, import("./events/event-types").EventStringId>;
        GET_FEATURE_INFO: Record<import("../app").GetFeatureInfoEventKey, import("./events/event-types").EventStringId>;
        LAYER: Record<import("../app").LayerEventKey, import("./events/event-types").EventStringId>;
        MAP: Record<import("../app").MapEventKey, import("./events/event-types").EventStringId>;
        MARKER_ICON: Record<import("../app").MarkerIconEventKey, import("./events/event-types").EventStringId>;
        MODAL: Record<import("../app").ModalEventKey, import("./events/event-types").EventStringId>;
        NAVBAR: Record<import("../app").NavbarEventKey, import("./events/event-types").EventStringId>;
        OVERVIEW_MAP: Record<"EVENT_OVERVIEW_MAP_TOGGLE", import("./events/event-types").EventStringId>;
        PANEL: Record<import("../app").PanelEventKey, import("./events/event-types").EventStringId>;
        SLIDER: Record<import("../app").SliderEventKey, import("./events/event-types").EventStringId>;
        SNACKBAR: Record<"EVENT_SNACKBAR_OPEN", import("./events/event-types").EventStringId>;
        VECTOR: Record<import("../app").VectorEventKey, import("./events/event-types").EventStringId>;
    };
    projection: Projection;
    projectNames: {
        LCC: string;
        WM: string;
        LATLNG: string;
    };
    layerTypes: Record<"ESRI_DYNAMIC" | "ESRI_FEATURE" | "GEOJSON" | "GEOCORE" | "XYZ_TILES" | "OGC_FEATURE" | "WFS" | "WMS", import("../geo/layer/geoview-layers/abstract-geoview-layers").TypeGeoviewLayerType>;
    maps: Record<string, MapViewer>;
    isReady: number;
    readyCallback?: () => void;
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
     * Call map ready functions and the init callback once everything is done loading
     * including plugins
     */
    callInitCallback: () => void;
    /**
     * Get the instance of a map by it's ID to access API functions
     *
     * @param {string} id the map id
     *
     * @returns map api functions
     */
    map: (id: string) => MapViewer;
}
