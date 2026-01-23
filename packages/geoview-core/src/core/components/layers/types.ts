import type { Extent } from 'ol/extent';
import type { TypeLayerStyleConfig, TypeStyleGeometry } from '@/api/types/map-schema-types';
import type { TypeGeoviewLayerType, TypeLayerControls, TypeLayerStatus } from '@/api/types/layer-schema-types';
import type { LegendQueryStatus } from '@/core/stores/store-interface-and-intial-values/layer-state';

export type TypeLayersViewDisplayState = 'add' | 'order' | 'view';

export type TypeLegendLayerItem = {
  geometryType?: TypeStyleGeometry;
  name?: string;
  iconImage?: string | null;
  iconImageStacked?: string | null;
  iconList?: TypeLegendItem[];
};

export interface TypeLegendItem {
  geometryType: TypeStyleGeometry;
  name: string;
  isVisible: boolean;
  icon: string | null;
}

export interface TypeLegendLayer {
  bounds: Extent | undefined;
  controls?: TypeLayerControls;
  layerId: string;
  layerPath: string;
  layerAttribution?: string[];
  layerName: string;
  legendQueryStatus: LegendQueryStatus;
  type?: TypeGeoviewLayerType;
  styleConfig?: TypeLayerStyleConfig | null;
  layerStatus?: TypeLayerStatus;
  querySent?: boolean;
  canToggle?: boolean; // can sublayer visibility be toggled
  url?: string;
  hoverable?: boolean;
  queryable?: boolean;

  icons: TypeLegendLayerItem[];
  // data: TypeLegend | undefined | null;
  items: TypeLegendItem[];
  children: TypeLegendLayer[];

  opacity?: number;
  opacityFromParent?: number;
  zoom?: number;
}
