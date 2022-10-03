/**
 * constant contains event names
 */
export declare const EVENT_NAMES: {
    APPBAR: Record<import("./constants/app-bar").AppbarEventKey, EventStringId>;
    ATTRIBUTION: Record<"EVENT_ATTRIBUTION_UPDATE", EventStringId>;
    BASEMAP: Record<"EVENT_BASEMAP_LAYERS_UPDATE", EventStringId>;
    DETAILS_PANEL: Record<"EVENT_DETAILS_PANEL_CROSSHAIR_ENTER", EventStringId>;
    DRAWER: Record<"EVENT_DRAWER_OPEN_CLOSE", EventStringId>;
    FOOTERBAR: Record<"EVENT_FOOTERBAR_EXPAND_COLLAPSE", EventStringId>;
    FOOTER_TABS: Record<import("./constants/footer-tabs").FooterTabsEventKey, EventStringId>;
    GET_FEATURE_INFO: Record<import("./constants/get-feature-info").GetFeatureInfoEventKey, EventStringId>;
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
export declare type EventStringId = 'appbar/panel_create' | 'appbar/panel_remove' | 'attribution/update' | 'basemap/layers_update' | 'details_panel/crosshair_enter' | 'drawer/open_close' | 'footerbar/expand_collapse' | 'footer_tabs/tab_create' | 'footer_tabs/tab_remove' | 'get_feature_info/register' | 'get_feature_info/query_layer' | 'get_feature_info/query_result' | 'layer/add' | 'layer/added' | 'layer/get_layers' | 'layer/remove' | 'map/add_component' | 'map/crosshair_enable_disable' | 'map/fix_north' | 'map/inkeyfocus' | 'map/loaded' | 'map/moveend' | 'map/reload' | 'map/remove_component' | 'map/view_projection_change' | 'map/zoomend' | 'marker_icon/hide' | 'marker_icon/show' | 'modal/close' | 'modal/create' | 'modal/open' | 'modal/update' | 'navbar/button_panel_create' | 'navbar/button_panel_remove' | 'navbar/toggle_controls' | 'overview_map/toggle' | 'panel/add_action' | 'panel/change_content' | 'panel/close' | 'panel/open' | 'panel/remove_action' | 'slider/on_change_value' | 'slider/set_min_max' | 'slider/set_values' | 'snackbar/open' | 'vector/add' | 'vector/added' | 'vector/off' | 'vector/on' | 'vector/remove';
