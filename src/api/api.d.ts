import { Event } from './events/event';
import { Projection } from '@/geo/projection/projection';
import { MapViewer } from '@/geo/map/map-viewer';
import { Plugin } from './plugin/plugin';
import { GeoUtilities } from '@/geo/utils/utilities';
import { DateMgt } from '@/core/utils/date-mgt';
import * as Utilities from '../core/utils/utilities';
import { FeatureInfoLayerSet } from '@/geo/utils/feature-info-layer-set';
import { LegendsLayerSet } from '@/geo/utils/legends-layer-set';
/**
 * Class used to handle api calls (events, functions etc...)
 *
 * @exports
 * @class API
 */
export declare class API {
    event: Event;
    eventNames: {
        APPBAR: Record<import("@/app").AppbarEventKey, import("@/app").EventStringId>;
        BASEMAP: Record<"EVENT_BASEMAP_LAYERS_UPDATE", import("@/app").EventStringId>;
        FOOTERBAR: Record<import("@/app").FooterBarEventKey, import("@/app").EventStringId>;
        GET_FEATURE_INFO: Record<import("@/app").GetFeatureInfoEventKey, import("@/app").EventStringId>;
        GET_LEGENDS: Record<import("@/app").GetLegendsEventKey, import("@/app").EventStringId>;
        GEOMETRY: Record<import("@/app").GeometryEventKey, import("@/app").EventStringId>;
        INTERACTION: Record<import("@/app").InteractionEventKey, import("@/app").EventStringId>;
        LAYER_SET: Record<import("@/app").LayerSetEventKey, import("@/app").EventStringId>;
        LAYER: Record<import("@/app").LayerEventKey, import("@/app").EventStringId>;
        MAP: Record<import("@/app").MapEventKey, import("@/app").EventStringId>;
        FEATURE_HIGHLIGHT: Record<import("@/app").FeatureHighlightEventKey, import("@/app").EventStringId>;
        MODAL: Record<import("@/app").ModalEventKey, import("@/app").EventStringId>;
        NAVBAR: Record<import("@/app").NavbarEventKey, import("@/app").EventStringId>;
        PANEL: Record<import("@/app").PanelEventKey, import("@/app").EventStringId>;
        SLIDER: Record<import("@/app").SliderEventKey, import("@/app").EventStringId>;
        SNACKBAR: Record<"EVENT_SNACKBAR_OPEN", import("@/app").EventStringId>;
    };
    projection: Projection;
    projectNames: {
        LCC: string;
        WM: string;
        LNGLAT: string;
    };
    layerTypes: Record<"WFS" | "CSV" | "ESRI_DYNAMIC" | "ESRI_FEATURE" | "ESRI_IMAGE" | "IMAGE_STATIC" | "GEOJSON" | "GEOCORE" | "GEOPACKAGE" | "XYZ_TILES" | "VECTOR_TILES" | "OGC_FEATURE" | "WMS", import("@/app").TypeGeoviewLayerType>;
    maps: Record<string, MapViewer>;
    isReady: number;
    readyCallback?: (mapId?: string) => void;
    plugin: Plugin;
    utilities: typeof Utilities;
    geoUtilities: GeoUtilities;
    dateUtilities: DateMgt;
    getFeatureInfoLayerSet: typeof FeatureInfoLayerSet.get;
    getLegendsLayerSet: typeof LegendsLayerSet.get;
    /**
     * Initiate the event and projection objects
     */
    constructor();
    /**
     * Apply outline to elements when keyboard is use to navigate
     * Code from: https://github.com/MaxMaeder/keyboardFocus.js
     */
    private manageKeyboardFocus;
    /**
     * Check if map rendering / drawing is ready then run the callback function
     * Timeout does not effect rendering speed, each map will cancel the previous timer after it renders
     * so timing of rendering will be based on device specs.
     *
     * @param callback a callback to make once the map has rendered
     */
    ready: (callback: () => void) => void;
    /**
     * Create a new map in a given div id.
     * !The div MUST NOT have a geoview-map class or a warning will be shown when initMapDivFromFunctionCall is called.
     * If is present, the div will be created with a default config
     *
     * @param {string} divId the id of the div to create map in
     * @param {string} mapConfig the config passed in from the function call
     */
    createMapFromConfig: (divId: string, mapConfig: string) => void;
}
