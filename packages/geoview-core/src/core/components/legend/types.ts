import { TypeLayerEntryConfig } from '@/geo/map/map-schema-types';

import { AbstractGeoViewLayer } from '@/geo/layer/geoview-layers/abstract-geoview-layers';

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
  canZoomTo?: boolean;
  onOpenDetails?: (layerId: string, layerConfigEntry: TypeLayerEntryConfig | undefined) => void;
}
