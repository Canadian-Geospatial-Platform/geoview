import { APPBAR } from './constants/app-bar-constants';
import { FOOTERBAR } from './constants/footer-bar-constants';
import { GET_LEGENDS } from './constants/get-legends-constants';
import { LAYER_SET } from './constants/layer-set-constants';
import { LAYER } from './constants/layer-constants';
import { MAP } from './constants/map-constants';
import { FEATURE_HIGHLIGHT } from './constants/feature-highlight-constants';
import { MODAL } from './constants/modal-constants';
import { NAVBAR } from './constants/nav-bar-constants';
import { SLIDER } from './constants/slider-constants';
import { SNACKBAR } from './constants/snackbar-constants';

/**
 * constant contains event names
 */
export const EVENT_NAMES = {
  APPBAR,
  FOOTERBAR,
  GET_LEGENDS,
  LAYER_SET,
  LAYER,
  MAP,
  FEATURE_HIGHLIGHT,
  MODAL,
  NAVBAR,
  SLIDER,
  SNACKBAR,
};

/**
 * Event names
 */
export type EventStringId =
  | 'appbar/panel_create'
  | 'appbar/panel_remove'
  | 'details_panel/crosshair_enter'
  | 'feature_highlight/highlight'
  | 'feature_highlight/clear'
  | 'feature_highlight/highlightBBox'
  | 'footerbar/tab_create'
  | 'footerbar/tab_remove'
  | 'get_legends/legend_info'
  | 'get_legends/query_legends'
  | 'get_legends/trigger'
  | 'layer_set/layer_registration'
  | 'layer_set/change_layer_status'
  | 'layer_set/request_layer_inventory'
  | 'layer_set/updated'
  | 'layer/add'
  | 'layer/added'
  | 'layer/get_layers'
  | 'layer/remove'
  | 'layer/if_condition'
  | 'map/add_component'
  | 'map/crosshair_enter'
  | 'map/get_all_features'
  | 'map/inkeyfocus'
  | 'map/loaded'
  | 'map/moveend'
  | 'map/pointermove'
  | 'map/reload'
  | 'map/remove_component'
  | 'map/singleclick'
  | 'map/view_projection_change'
  | 'map/zoomend'
  | 'modal/close'
  | 'modal/create'
  | 'modal/open'
  | 'modal/update'
  | 'navbar/button_panel_create'
  | 'navbar/button_panel_remove'
  | 'slider/on_change_value'
  | 'slider/set_min_max'
  | 'slider/set_values'
  | 'snackbar/open';
