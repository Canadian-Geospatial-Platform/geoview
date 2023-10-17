/**
 * constant contains event names
 */
export declare const EVENT_NAMES: {
    APPBAR: Record<import("./constants/app-bar-constants").AppbarEventKey, EventStringId>;
    ATTRIBUTION: Record<"EVENT_ATTRIBUTION_UPDATE", EventStringId>;
    BASEMAP: Record<"EVENT_BASEMAP_LAYERS_UPDATE", EventStringId>;
    DRAWER: Record<"EVENT_DRAWER_OPEN_CLOSE", EventStringId>;
    FOOTERBAR: Record<"EVENT_FOOTERBAR_EXPAND_COLLAPSE", EventStringId>;
    FOOTER_TABS: Record<import("./constants/footer-tabs-constants").FooterTabsEventKey, EventStringId>;
    GET_FEATURE_INFO: Record<import("./constants/get-feature-info-constants").GetFeatureInfoEventKey, EventStringId>;
    GET_LEGENDS: Record<import("./constants/get-legends-constants").GetLegendsEventKey, EventStringId>;
    GEOLOCATOR: Record<"EVENT_GEOLOCATOR_TOGGLE", EventStringId>;
    GEOMETRY: Record<import("./constants/geometry-constants").GeometryEventKey, EventStringId>;
    INTERACTION: Record<import("./constants/interaction-constants").InteractionEventKey, EventStringId>;
    LAYER_SET: Record<import("./constants/layer-set-constants").LayerSetEventKey, EventStringId>;
    LAYER: Record<import("./constants/layer-constants").LayerEventKey, EventStringId>;
    MAP: Record<import("./constants/map-constants").MapEventKey, EventStringId>;
    MARKER_ICON: Record<import("./constants/marker-icon-constants").MarkerIconEventKey, EventStringId>;
    FEATURE_HIGHLIGHT: Record<import("./constants/feature-highlight-constants").FeatureHighlightEventKey, EventStringId>;
    MODAL: Record<import("./constants/modal-constants").ModalEventKey, EventStringId>;
    NAVBAR: Record<import("./constants/nav-bar-constants").NavbarEventKey, EventStringId>;
    NOTIFICATIONS: Record<"NOTIFICATION_ADD", EventStringId>;
    OVERVIEW_MAP: Record<"EVENT_OVERVIEW_MAP_TOGGLE", EventStringId>;
    PANEL: Record<import("./constants/panel-constants").PanelEventKey, EventStringId>;
    SLIDER: Record<import("./constants/slider-constants").SliderEventKey, EventStringId>;
    SNACKBAR: Record<"EVENT_SNACKBAR_OPEN", EventStringId>;
};
/**
 * Event names
 */
export type EventStringId = 'appbar/panel_create' | 'appbar/panel_remove' | 'attribution/update' | 'basemap/layers_update' | 'details_panel/crosshair_enter' | 'drawer/open_close' | 'feature_highlight/highlight' | 'feature_highlight/clear' | 'feature_highlight/highlightBBox' | 'footerbar/expand_collapse' | 'footer_tabs/tab_create' | 'footer_tabs/tab_remove' | 'footer_tabs/tab_select' | 'geometry/add' | 'geometry/added' | 'geometry/off' | 'geometry/on' | 'geometry/remove' | 'get_feature_info/all_queries_done' | 'get_feature_info/hover_query_done' | 'get_feature_info/query_layer' | 'get_feature_info/query_result' | 'get_legends/legends_layerset_updated' | 'get_legends/legend_info' | 'get_legends/query_legends' | 'get_legends/trigger' | 'geolocator/toggle' | 'interaction/draw_started' | 'interaction/draw_ended' | 'interaction/draw_aborted' | 'interaction/modify_started' | 'interaction/modify_ended' | 'interaction/select_selected' | 'interaction/translate_started' | 'interaction/translate_ended' | 'layer_set/layer_registration' | 'layer_set/change_layer_status' | 'layer_set/change_layer_phase' | 'layer_set/request_layer_inventory' | 'layer_set/updated' | 'layer/add' | 'layer/added' | 'layer/get_layers' | 'layer/remove' | 'layer/if_condition' | 'map/add_component' | 'map/crosshair_enable_disable' | 'map/crosshair_enter' | 'map/fix_north' | 'map/get_all_features' | 'map/inkeyfocus' | 'map/loaded' | 'map/moveend' | 'map/pointermove' | 'map/reload' | 'map/remove_component' | 'map/singleclick' | 'map/view_projection_change' | 'map/zoomend' | 'marker_icon/hide' | 'marker_icon/show' | 'modal/close' | 'modal/create' | 'modal/open' | 'modal/update' | 'navbar/button_panel_create' | 'navbar/button_panel_remove' | 'navbar/toggle_controls' | 'notification/add' | 'notification/remove' | 'overview_map/toggle' | 'panel/add_action' | 'panel/change_content' | 'panel/close' | 'panel/close_all' | 'panel/open' | 'panel/remove_action' | 'slider/on_change_value' | 'slider/set_min_max' | 'slider/set_values' | 'snackbar/open';
