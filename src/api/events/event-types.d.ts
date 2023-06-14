/**
 * constant contains event names
 */
export declare const EVENT_NAMES: {
    APPBAR: Record<import("./constants/app-bar").AppbarEventKey, EventStringId>;
    ATTRIBUTION: Record<"EVENT_ATTRIBUTION_UPDATE", EventStringId>;
    BASEMAP: Record<"EVENT_BASEMAP_LAYERS_UPDATE", EventStringId>;
    DRAWER: Record<"EVENT_DRAWER_OPEN_CLOSE", EventStringId>;
    FOOTERBAR: Record<"EVENT_FOOTERBAR_EXPAND_COLLAPSE", EventStringId>;
    FOOTER_TABS: Record<import("./constants/footer-tabs").FooterTabsEventKey, EventStringId>;
    GET_FEATURE_INFO: Record<import("./constants/get-feature-info").GetFeatureInfoEventKey, EventStringId>;
    GET_LEGENDS: Record<import("./constants/get-legends").GetLegendsEventKey, EventStringId>;
    INTERACTION: Record<import("./constants/interaction").InteractionEventKey, EventStringId>;
    LAYER_SET: Record<import("./constants/layer-set").LayerSetEventKey, EventStringId>;
    LAYER: Record<import("./constants/layer").LayerEventKey, EventStringId>;
    MAP: Record<import("./constants/map").MapEventKey, EventStringId>;
    MARKER_ICON: Record<import("./constants/marker-icon").MarkerIconEventKey, EventStringId>;
    MODAL: Record<import("./constants/modal").ModalEventKey, EventStringId>;
    NAVBAR: Record<import("./constants/nav-bar").NavbarEventKey, EventStringId>;
    OVERVIEW_MAP: Record<"EVENT_OVERVIEW_MAP_TOGGLE", EventStringId>;
    PANEL: Record<import("./constants/panel").PanelEventKey, EventStringId>;
    SLIDER: Record<import("./constants/slider").SliderEventKey, EventStringId>;
    SNACKBAR: Record<"EVENT_SNACKBAR_OPEN", EventStringId>;
    VECTOR: Record<import("./constants/vector").VectorEventKey, EventStringId>;
};
/**
 * Event names
 */
export type EventStringId = 'appbar/panel_create' | 'appbar/panel_remove' | 'attribution/update' | 'basemap/layers_update' | 'details_panel/crosshair_enter' | 'drawer/open_close' | 'footerbar/expand_collapse' | 'footer_tabs/tab_create' | 'footer_tabs/tab_remove' | 'footer_tabs/tab_select' | 'get_feature_info/all_queries_done' | 'get_feature_info/hover_query_done' | 'get_feature_info/query_layer' | 'get_feature_info/query_result' | 'get_legends/all_legends_done' | 'get_legends/legend_info' | 'get_legends/query_legends' | 'get_legends/trigger' | 'interaction/draw_started' | 'interaction/draw_ended' | 'interaction/draw_aborted' | 'interaction/modify_started' | 'interaction/modify_ended' | 'interaction/select_selected' | 'interaction/translate_started' | 'interaction/translate_ended' | 'layer_set/layer_registration' | 'layer_set/request_layer_inventory' | 'layer_set/updated' | 'layer/add' | 'layer/added' | 'layer/get_layers' | 'layer/remove' | 'layer/if_condition' | 'map/add_component' | 'map/crosshair_enable_disable' | 'map/crosshair_enter' | 'map/fix_north' | 'map/inkeyfocus' | 'map/loaded' | 'map/moveend' | 'map/reload' | 'map/remove_component' | 'map/singleclick' | 'map/pointermove' | 'map/view_projection_change' | 'map/zoomend' | 'marker_icon/hide' | 'marker_icon/show' | 'modal/close' | 'modal/create' | 'modal/open' | 'modal/update' | 'navbar/button_panel_create' | 'navbar/button_panel_remove' | 'navbar/toggle_controls' | 'overview_map/toggle' | 'panel/add_action' | 'panel/change_content' | 'panel/close' | 'panel/close_all' | 'panel/open' | 'panel/remove_action' | 'slider/on_change_value' | 'slider/set_min_max' | 'slider/set_values' | 'snackbar/open' | 'vector/add' | 'vector/added' | 'vector/off' | 'vector/on' | 'vector/remove';
