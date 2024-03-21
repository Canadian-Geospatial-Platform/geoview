import { APPBAR } from './constants/app-bar-constants';
import { FOOTERBAR } from './constants/footer-bar-constants';
import { MAP } from './constants/map-constants';
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
  MAP,
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
  | 'footerbar/tab_create'
  | 'footerbar/tab_remove'
  | 'map/add_component'
  | 'map/crosshair_enter'
  | 'map/get_all_features'
  | 'map/inkeyfocus'
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
