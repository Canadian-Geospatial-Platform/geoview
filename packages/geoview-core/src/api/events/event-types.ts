import { MAP, MapEventKey } from './constants/map';
import { LAYER, LayerEventKey } from './constants/layer';
import { ATTRIBUTION, AttributionEventKey } from './constants/attribution';
import { APPBAR, AppbarEventKey } from './constants/appbar';
import { FOOTERBAR, FooterbarEventKey } from './constants/footerbar';
import { NAVBAR, NavbarEventKey } from './constants/navbar';
import { SNACKBAR, SnackbarEventKey } from './constants/snackbar';
import { BASEMAP, BasmapEventKey } from './constants/basemap';
import { OVERVIEW_MAP, OverviewEventKey } from './constants/overview-map';
import { DETAILS_PANEL, DetailPanelEventKey } from './constants/details-panel';
import { MARKER_ICON, MarkerIconEventKey } from './constants/marker-icon';
import { DRAWER, DrawerEventKey } from './constants/drawer';
import { MODAL, ModalEventKey } from './constants/modal';
import { PANEL, PanelEventKey } from './constants/panel';
import { SLIDER, SliderEventKey } from './constants/slider';
import { VECTOR, VectorEventKey } from './constants/vector';

/**
 * constant contains event names
 */
export const EVENT_NAMES = {
  MAP,
  LAYER,
  APPBAR,
  FOOTERBAR,
  NAVBAR,
  SNACKBAR,
  BASEMAP,
  OVERVIEW_MAP,
  DETAILS_PANEL,
  MARKER_ICON,
  DRAWER,
  MODAL,
  PANEL,
  SLIDER,
  VECTOR,
  ATTRIBUTION,
};

/**
 * Event categories
 */
export type EventCategories =
  | 'MAP'
  | 'LAYER'
  | 'APPBAR'
  | 'FOOTERBAR'
  | 'NAVBAR'
  | 'SNACKBAR'
  | 'BASEMAP'
  | 'OVERVIEW_MAP'
  | 'DETAILS_PANEL'
  | 'MARKER_ICON'
  | 'DRAWER'
  | 'MODAL'
  | 'PANEL'
  | 'SLIDER'
  | 'VECTOR'
  | 'ATTRIBUTION';

/**
 * Event keys
 */
export type EventKey =
  | MapEventKey
  | LayerEventKey
  | AppbarEventKey
  | FooterbarEventKey
  | NavbarEventKey
  | SnackbarEventKey
  | BasmapEventKey
  | OverviewEventKey
  | DetailPanelEventKey
  | MarkerIconEventKey
  | DrawerEventKey
  | ModalEventKey
  | PanelEventKey
  | SliderEventKey
  | VectorEventKey
  | AttributionEventKey;

/**
 * Event names
 */
export type EventStringId =
  | 'map/loaded'
  | 'map/reload'
  | 'map/moveend'
  | 'map/zoomend'
  | 'map/add_component'
  | 'map/remove_component'
  | 'map/inkeyfocus'
  | 'map/crosshair_enable_disable'
  | 'map/view_projection_change'
  | 'map/fix_north'
  | 'layer/add'
  | 'layer/added'
  | 'layer/remove'
  | 'layer/get_layers'
  | 'appbar/panel_create'
  | 'appbar/panel_remove'
  | 'footerbar/expand_collapse'
  | 'navbar/button_panel_create'
  | 'navbar/button_panel_remove'
  | 'navbar/toggle_controls'
  | 'snackbar/open'
  | 'basemap/layers_update'
  | 'overview_map/toggle'
  | 'details_panel/crosshair_enter'
  | 'marker_icon/show'
  | 'marker_icon/hide'
  | 'drawer/open_close'
  | 'modal/create'
  | 'modal/open'
  | 'modal/close'
  | 'modal/update'
  | 'panel/open'
  | 'panel/close'
  | 'panel/add_action'
  | 'panel/remove_action'
  | 'panel/change_content'
  | 'slider/on_change_value'
  | 'slider/set_values'
  | 'slider/set_min_max'
  | 'vector/add'
  | 'vector/remove'
  | 'vector/added'
  | 'vector/off'
  | 'vector/on'
  | 'attribution/update';
