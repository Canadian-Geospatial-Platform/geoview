import type { Extent } from 'ol/extent';
import type { TypeLayerStyleConfig, TypeStyleGeometry } from '@/api/types/map-schema-types';
import type { TypeGeoviewLayerType, TypeLayerControls, TypeLayerEntryType, TypeLayerStatus } from '@/api/types/layer-schema-types';
import type { LegendQueryStatus } from '@/core/stores/store-interface-and-intial-values/layer-state';
import type { TemporalMode, TimeIANA, TypeDisplayDateFormat } from '@/core/utils/date-mgt';

export type TypeLayersViewDisplayState = 'add' | 'view';

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
  bounds?: Extent;
  bounds4326?: Extent;
  controls?: TypeLayerControls;
  layerId: string;
  layerPath: string;
  layerAttribution?: string[];
  layerName: string;
  legendQueryStatus: LegendQueryStatus;
  schemaTag: TypeGeoviewLayerType;
  entryType: TypeLayerEntryType;
  styleConfig?: TypeLayerStyleConfig;
  layerStatus?: TypeLayerStatus;
  layerFilter?: string;
  layerFilterClass?: string;
  dateTemporalMode?: TemporalMode;
  displayDateFormat?: TypeDisplayDateFormat;
  displayDateFormatShort?: TypeDisplayDateFormat;
  displayDateTimezone?: TimeIANA;
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
  opacityMaxFromParent?: number;
  zoom?: number;
}
