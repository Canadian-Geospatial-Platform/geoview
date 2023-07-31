import { Event } from './events/event';
import { Projection } from '@/geo/projection/projection';
import { MapViewer } from '@/geo/map/map';
import { Plugin } from './plugin/plugin';
import { GeoUtilities } from '@/geo/utils/utilities';
import { DateMgt } from '@/core/utils/date-mgt';
import * as MarkerDefinitions from '../core/types/marker-definitions';
import * as Utilities from '../core/utils/utilities';
import { FeatureInfoLayerSet } from '@/geo/utils/feature-info-layer-set';
import { LegendsLayerSet } from '@/geo/utils/legends-layer-set';
import { createMapFromConfig } from '@/core/utils/create-map-from-config';
/**
 * Class used to handle api calls (events, functions etc...)
 *
 * @exports
 * @class API
 */
export declare class API {
    event: Event;
    eventNames: {
        APPBAR: Record<import("./events").AppbarEventKey, import("./events/event-types").EventStringId>;
        ATTRIBUTION: Record<"EVENT_ATTRIBUTION_UPDATE", import("./events/event-types").EventStringId>;
        BASEMAP: Record<"EVENT_BASEMAP_LAYERS_UPDATE", import("./events/event-types").EventStringId>;
        DRAWER: Record<"EVENT_DRAWER_OPEN_CLOSE", import("./events/event-types").EventStringId>;
        FOOTERBAR: Record<"EVENT_FOOTERBAR_EXPAND_COLLAPSE", import("./events/event-types").EventStringId>;
        FOOTER_TABS: Record<import("./events").FooterTabsEventKey, import("./events/event-types").EventStringId>;
        GET_FEATURE_INFO: Record<import("./events").GetFeatureInfoEventKey, import("./events/event-types").EventStringId>;
        GET_LEGENDS: Record<import("./events").GetLegendsEventKey, import("./events/event-types").EventStringId>;
        GEOLOCATOR: Record<"EVENT_GEOLOCATOR_TOGGLE", import("./events/event-types").EventStringId>;
        INTERACTION: Record<import("./events/constants/interaction").InteractionEventKey, import("./events/event-types").EventStringId>;
        LAYER_SET: Record<import("./events").LayerSetEventKey, import("./events/event-types").EventStringId>;
        LAYER: Record<import("./events").LayerEventKey, import("./events/event-types").EventStringId>;
        MAP: Record<import("./events").MapEventKey, import("./events/event-types").EventStringId>;
        MARKER_ICON: Record<import("./events").MarkerIconEventKey, import("./events/event-types").EventStringId>;
        FEATURE_HIGHLIGHT: Record<import("./events/constants/feature-highlight").FeatureHighlightEventKey, import("./events/event-types").EventStringId>;
        MODAL: Record<import("./events").ModalEventKey, import("./events/event-types").EventStringId>;
        NAVBAR: Record<import("./events").NavbarEventKey, import("./events/event-types").EventStringId>;
        OVERVIEW_MAP: Record<"EVENT_OVERVIEW_MAP_TOGGLE", import("./events/event-types").EventStringId>;
        PANEL: Record<import("./events").PanelEventKey, import("./events/event-types").EventStringId>;
        SLIDER: Record<import("./events").SliderEventKey, import("./events/event-types").EventStringId>;
        SNACKBAR: Record<"EVENT_SNACKBAR_OPEN", import("./events/event-types").EventStringId>;
        VECTOR: Record<import("./events").VectorEventKey, import("./events/event-types").EventStringId>;
        NOTIFICATIONS: Record<import("./events/constants/notifications").NotificationsEventKey, import("./events/event-types").EventStringId>;
    };
    projection: Projection;
    projectNames: {
        LCC: string;
        WM: string;
        LNGLAT: string;
    };
    layerTypes: Record<"ESRI_DYNAMIC" | "ESRI_FEATURE" | "IMAGE_STATIC" | "GEOJSON" | "GEOCORE" | "GEOPACKAGE" | "XYZ_TILES" | "VECTOR_TILES" | "OGC_FEATURE" | "WFS" | "WMS", import("@/geo/layer/geoview-layers/abstract-geoview-layers").TypeGeoviewLayerType>;
    maps: Record<string, MapViewer>;
    isReady: number;
    readyCallback?: (mapId?: string) => void;
    plugin: Plugin;
    utilities: typeof Utilities;
    geoUtilities: GeoUtilities;
    dateUtilities: DateMgt;
    markerDefinitions: typeof MarkerDefinitions;
    generateId: typeof Utilities.generateId;
    createMapFromConfig: typeof createMapFromConfig;
    addUiComponent: typeof Utilities.addUiComponent;
    showMessage: typeof Utilities.showMessage;
    getFeatureInfoLayerSet: typeof FeatureInfoLayerSet.get;
    getLegendsLayerSet: typeof LegendsLayerSet.get;
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
     * @param {string} mapId the map id
     *
     * @returns map api functions
     */
    map: (mapId: string) => MapViewer;
}
