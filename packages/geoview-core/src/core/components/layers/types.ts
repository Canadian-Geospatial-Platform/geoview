import { Extent } from 'ol/extent';

import { TypeGeoviewLayerType, TypeStyleConfig, TypeStyleGeometry, TypeVisibilityFlags } from '@/geo';
import { TypeLayerStatus } from '@/geo/map/map-schema-types';

export type TypeLayersViewDisplayState = 'remove' | 'add' | 'order' | 'view';

export type TypeLegendLayerIcons = TypeLegendLayerItem[];

export type TypeLegendLayerItem = {
  geometryType?: TypeStyleGeometry;
  iconType?: 'simple' | 'list';
  name?: string;
  iconImage?: string | null;
  iconImageStacked?: string | null;
  iconList?: TypeLegendItem[];
};

export interface TypeLegendItem {
  geometryType: TypeStyleGeometry;
  name: string;
  isVisible: TypeVisibilityFlags;
  icon: string | null;
  default: boolean;
}

export interface TypeLegendLayer {
  bounds: Extent | undefined;
  layerId: string;
  layerPath: string;
  layerAttribution?: string[];
  metadataAccessPath?: string;
  order?: number; // useful for ordering layers
  layerName: string;
  type?: TypeGeoviewLayerType;
  styleConfig?: TypeStyleConfig | null;
  layerStatus?: TypeLayerStatus;
  layerPhase?: string;
  querySent?: boolean;

  isVisible: TypeVisibilityFlags; // is layer is visible

  icons?: TypeLegendLayerIcons;
  // data: TypeLegend | undefined | null;
  allItemsChecked?: boolean; // if all items in this layer are visible
  items: TypeLegendItem[];
  children: TypeLegendLayer[];

  opacity?: number;
  zoom?: number;

  isRemovable?: boolean;
  canSetOpacity?: boolean;
}
