import { AbstractGeoViewLayer, TypeLayerEntryConfig } from '@/geo';

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
