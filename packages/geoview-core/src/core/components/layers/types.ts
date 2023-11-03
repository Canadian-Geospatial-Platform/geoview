import { AbstractGeoViewLayer, TypeGeoviewLayerType, TypeLayerEntryConfig, TypeStyleConfig } from '@/geo';
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

export type TypeLegendLayerIcon = {
  iconType?: string;
  iconImg?: string;
  iconImgStacked?: string;
  iconList?: string[];
};

export interface TypeLegendLayerItem {
  name: string;
  isChecked?: boolean;
  icon: string;
}

export interface TypeLegendLayer {
  layerId: string;
  layerPath: string;
  order?: number; // useful for ordering layers
  layerName: string;
  type: TypeGeoviewLayerType;
  styleConfig?: TypeStyleConfig;
  layerStatus: TypeLayerStatus;
  layerPhase: string;
  querySent: boolean;

  isVisible: boolean; // is layer is visible

  icon?: TypeLegendLayerIcon;
  // data: TypeLegend | undefined | null;
  allItemsChecked?: boolean; // if all items in this layer are visible
  items: TypeLegendLayerItem[];
  children: TypeLegendLayer[];

  opacity?: number; // Does every layer have opacity?
  zoom?: number;

  isRemovable?: boolean;
  canSetOpacity?: boolean;
}
