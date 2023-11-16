import {
  AbstractGeoViewLayer,
  TypeGeoviewLayerType,
  TypeLayerEntryConfig,
  TypeStyleConfig,
  TypeStyleGeometry,
  TypeVisibilityFlags,
} from '@/geo';
import { TypeLayerStatus } from '@/geo/map/map-schema-types';

export interface TypeLegendProps {
  layerIds: string[];
  isRemoveable?: boolean;
  canSetOpacity?: boolean;
  expandAll?: boolean;
  hideAll?: boolean;
  canZoomTo?: boolean;
}

export interface LegendItemsProps extends TypeLegendProps {
  mapId: string;
}

export interface LegendProps extends TypeLegendProps {
  mapId: string;
}

export interface LegendItemsDetailsProps extends TypeLegendProps {
  mapId: string;
  // subLayerId: string[];
}

export interface TypeLegendItemProps {
  layerId: string;
  geoviewLayerInstance: AbstractGeoViewLayer;
  subLayerId?: string;
  layerConfigEntry?: TypeLayerEntryConfig;
  isRemoveable?: boolean;
  canSetOpacity?: boolean;
  isParentVisible?: boolean;
  toggleParentVisible?: () => void;
  expandAll?: boolean;
  hideAll?: boolean;
}

export interface TypeLegendItemDetailsProps {
  layerId: string;
  geoviewLayerInstance: AbstractGeoViewLayer;
  subLayerId?: string;
  layerConfigEntry?: TypeLayerEntryConfig;
  isRemoveable?: boolean;
  canSetOpacity?: boolean;
  isParentVisible?: boolean;
  expandAll?: boolean;
  hideAll?: boolean;
}

/// //////////////////////////////////////////////////

<<<<<<< HEAD
export type TypeLayersViewDisplayState = 'remove' | 'add' | 'order' | 'view';

export type TypeLegendLayerIcon = {
  iconType?: string;
  iconImg?: string;
=======
export type TypeLegendLayerIcons = TypeLegendLayerItem[];

export type TypeLegendLayerItem = {
  geometryType?: TypeStyleGeometry;
  iconType?: 'simple' | 'list';
  name?: string;
  iconImage?: string;
>>>>>>> b450ce2d8 (Add-legend-to-store)
  iconImgStacked?: string;
  iconList?: TypeLegendLayerListItem[];
};

export interface TypeLegendLayerListItem {
  name: string;
  isVisible: TypeVisibilityFlags;
  icon: string;
  default: boolean;
}

export interface TypeLegendLayer {
  layerId: string;
  layerPath: string;
  order?: number; // useful for ordering layers
  layerName: string;
  type: TypeGeoviewLayerType;
  styleConfig?: TypeStyleConfig;
  layerStatus?: TypeLayerStatus;
  layerPhase?: string;
  querySent?: boolean;

  isVisible: TypeVisibilityFlags; // is layer is visible

  icons?: TypeLegendLayerIcons;
  // data: TypeLegend | undefined | null;
  allItemsChecked?: boolean; // if all items in this layer are visible
  items: TypeLegendLayerListItem[];
  children: TypeLegendLayer[];

  opacity?: number;
  zoom?: number;

  isRemovable?: boolean;
  canSetOpacity?: boolean;
}
