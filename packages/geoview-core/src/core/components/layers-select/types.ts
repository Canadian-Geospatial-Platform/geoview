import { TypeLayerEntryConfig } from '@/geo/map/map-schema-types';

import { AbstractGeoViewLayer } from '@/geo/layer/geoview-layers/abstract-geoview-layers';

export interface LayersSelectProps {
  mapId: string;
  layerIds: string[];
  isRemoveable: false;
  canSetOpacity?: boolean;
  expandAll?: boolean;
  hideAll?: boolean;
  canZoomTo?: boolean;
  canSort?: boolean;
  onOpenDetails?: (layerId: string, layerConfigEntry: TypeLayerEntryConfig | undefined) => void;
}

export interface LayerSelectItemProps {
  layerId: string;
  geoviewLayerInstance: AbstractGeoViewLayer;
  subLayerId?: string;
  layerConfigEntry?: TypeLayerEntryConfig;
  isRemoveable?: boolean;
  canSetOpacity?: boolean;
  isParentVisible?: boolean;
  canSort?: boolean;
  toggleParentVisible?: () => void;
  expandAll?: boolean;
  hideAll?: boolean;
  canZoomTo?: boolean;
  onOpenDetails?: (layerId: string, layerConfigEntry: TypeLayerEntryConfig | undefined) => void;
}
