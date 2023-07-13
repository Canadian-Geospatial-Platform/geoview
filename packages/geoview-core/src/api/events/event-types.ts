import { APPBAR } from './constants/app-bar';
import { ATTRIBUTION } from './constants/attribution';
import { BASEMAP } from './constants/basemap';
import { DRAWER } from './constants/drawer';
import { FOOTERBAR } from './constants/footer-bar';
import { FOOTER_TABS } from './constants/footer-tabs';
import { GET_FEATURE_INFO } from './constants/get-feature-info';
import { GET_LEGENDS } from './constants/get-legends';
import { INTERACTION } from './constants/interaction';
import { LAYER_SET } from './constants/layer-set';
import { LAYER } from './constants/layer';
import { MAP } from './constants/map';
import { MARKER_ICON } from './constants/marker-icon';
import { FEATURE_HIGHLIGHT } from './constants/feature-highlight';
import { MODAL } from './constants/modal';
import { NAVBAR } from './constants/nav-bar';
import { OVERVIEW_MAP } from './constants/overview-map';
import { PANEL } from './constants/panel';
import { SLIDER } from './constants/slider';
import { SNACKBAR } from './constants/snackbar';
import { VECTOR } from './constants/vector';

/**
 * constant contains event names
 */
export const EVENT_NAMES = {
  APPBAR,
  ATTRIBUTION,
  BASEMAP,
  DRAWER,
  FOOTERBAR,
  FOOTER_TABS,
  GET_FEATURE_INFO,
  GET_LEGENDS,
  INTERACTION,
  LAYER_SET,
  LAYER,
  MAP,
  MARKER_ICON,
  FEATURE_HIGHLIGHT,
  MODAL,
  NAVBAR,
  OVERVIEW_MAP,
  PANEL,
  SLIDER,
  SNACKBAR,
  VECTOR,
};

/**
 * Event names
 */
export type EventStringId =
  | 'appbar/panel_create'
  | 'appbar/panel_remove'
  | 'attribution/update'
  | 'basemap/layers_update'
  | 'details_panel/crosshair_enter'
  | 'drawer/open_close'
  | 'feature_highlight/highlight'
  | 'feature_highlight/clear'
  | 'footerbar/expand_collapse'
  | 'footer_tabs/tab_create'
  | 'footer_tabs/tab_remove'
  | 'footer_tabs/tab_select'
  | 'get_feature_info/all_queries_done'
  | 'get_feature_info/hover_query_done'
  | 'get_feature_info/query_layer'
  | 'get_feature_info/query_result'
  | 'get_legends/all_legends_done'
  | 'get_legends/legend_info'
  | 'get_legends/query_legends'
  | 'get_legends/trigger'
  | 'interaction/draw_started'
  | 'interaction/draw_ended'
  | 'interaction/draw_aborted'
  | 'interaction/modify_started'
  | 'interaction/modify_ended'
  | 'interaction/select_selected'
  | 'interaction/translate_started'
  | 'interaction/translate_ended'
  | 'layer_set/layer_registration'
  | 'layer_set/request_layer_inventory'
  | 'layer_set/updated'
  | 'layer/add'
  | 'layer/added'
  | 'layer/get_layers'
  | 'layer/remove'
  | 'layer/if_condition'
  | 'map/add_component'
  | 'map/crosshair_enable_disable'
  | 'map/crosshair_enter'
  | 'map/fix_north'
  | 'map/inkeyfocus'
  | 'map/loaded'
  | 'map/moveend'
  | 'map/reload'
  | 'map/remove_component'
  | 'map/singleclick'
  | 'map/pointermove'
  | 'map/view_projection_change'
  | 'map/zoomend'
  | 'marker_icon/hide'
  | 'marker_icon/show'
  | 'modal/close'
  | 'modal/create'
  | 'modal/open'
  | 'modal/update'
  | 'navbar/button_panel_create'
  | 'navbar/button_panel_remove'
  | 'navbar/toggle_controls'
  | 'overview_map/toggle'
  | 'panel/add_action'
  | 'panel/change_content'
  | 'panel/close'
  | 'panel/close_all'
  | 'panel/open'
  | 'panel/remove_action'
  | 'slider/on_change_value'
  | 'slider/set_min_max'
  | 'slider/set_values'
  | 'snackbar/open'
  | 'vector/add'
  | 'vector/added'
  | 'vector/off'
  | 'vector/on'
  | 'vector/remove';
