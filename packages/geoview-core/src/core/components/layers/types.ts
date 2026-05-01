import type { Extent } from 'ol/extent';
import type { TypeLayerStyleConfig, TypeStyleGeometry } from '@/api/types/map-schema-types';
import type {
  TypeGeoviewLayerType,
  TypeLayerControls,
  TypeLayerEntryType,
  TypeLayerStatus,
  TypeMetadataEsriRasterFunctionInfos,
  TypeMetadataWMSCapabilityLayerStyle,
  TypeMosaicMethod,
  TypeMosaicRule,
} from '@/api/types/layer-schema-types';
import type { LegendQueryStatus } from '@/core/stores/store-interface-and-intial-values/layer-state';
import type { TemporalMode, TimeDimension, TimeIANA, TypeDisplayDateFormat } from '@/core/utils/date-mgt';

export type TypeLayersViewDisplayState = 'add' | 'view';

/** Represents a single legend layer item (icon/symbol entry). */
export type TypeLegendLayerItem = {
  /** Geometry type for the symbol. */
  geometryType?: TypeStyleGeometry;
  /** Display name of the item. */
  name?: string;
  /** Base64 icon image. */
  iconImage?: string | null;
  /** Base64 stacked icon image. */
  iconImageStacked?: string | null;
  /** Nested legend items. */
  iconList?: TypeLegendItem[];
};

/** Represents a single legend item entry. */
export interface TypeLegendItem {
  /** Geometry type for the item. */
  geometryType: TypeStyleGeometry;
  /** Display name of the item. */
  name: string;
  /** Whether the item is currently visible. */
  isVisible: boolean;
  /** Base64 icon image, or null if none. */
  icon: string | null;
}

/** Represents the full legend state for a layer in the store. */
export interface TypeLegendLayer {
  /** Bounding extent of the layer in map projection. */
  bounds?: Extent;
  /** Bounding extent of the layer in EPSG:4326. */
  bounds4326?: Extent;
  /** Layer UI controls configuration. */
  controls?: TypeLayerControls;
  /** Timestamp when layer deletion was started. */
  deletionStartTime?: number;
  /** The layer entry id. */
  layerId: string;
  /** The unique layer path. */
  layerPath: string;
  /** Attribution strings for the layer. */
  layerAttribution?: string[];
  /** Display name of the layer. */
  layerName: string;
  /** Current legend query status. */
  legendQueryStatus: LegendQueryStatus;
  /** GeoView layer type tag from the legend schema. */
  legendSchemaTag?: TypeGeoviewLayerType;
  /** GeoView layer type tag from the config schema. */
  schemaTag: TypeGeoviewLayerType;
  /** Layer entry type (vector, raster, group, etc.). */
  entryType: TypeLayerEntryType;
  /** Active style configuration for the layer. */
  styleConfig?: TypeLayerStyleConfig;
  /** Current load/error status of the layer. */
  layerStatus?: TypeLayerStatus;
  /** Active attribute/time filter string. */
  layerFilter?: string;
  /** Active class filter string. */
  layerFilterClass?: string;
  /** Temporal mode controlling how dates are interpreted. */
  dateTemporalMode?: TemporalMode;
  /** Date format for displaying date values. */
  displayDateFormat?: TypeDisplayDateFormat;
  /** Short date format for compact display. */
  displayDateFormatShort?: TypeDisplayDateFormat;
  /** IANA timezone for date display. */
  displayDateTimezone?: TimeIANA;
  /** Whether a legend query has been sent. */
  querySent?: boolean;
  /** Whether sublayer visibility can be toggled. */
  canToggle?: boolean;
  /** Service URL for the layer. */
  url?: string;
  /** Whether the layer supports hover interaction. */
  hoverable?: boolean;
  /** Whether the layer supports feature queries. */
  queryable?: boolean;

  /** Whether the layer is visible. */
  visible: boolean;

  /** Whether the layer is visible at the current map zoom. */
  inVisibleRange: boolean;

  /** Whether the layer legend is collapsed. */
  legendCollapsed: boolean;

  /** Whether the layer has text symbols. */
  hasText?: boolean;
  /** Whether text symbols are visible. */
  textVisible?: boolean;

  /** Array of legend icon items. */
  icons: TypeLegendLayerItem[];
  // data: TypeLegend | undefined | null;
  /** Array of legend items. */
  items: TypeLegendItem[];
  /** Child layers (for group layers). */
  children: TypeLegendLayer[];

  /** Active raster function for ESRI Image layers. */
  rasterFunction?: string;
  /** Available raster functions metadata from ESRI Image service. */
  rasterFunctionInfos?: TypeMetadataEsriRasterFunctionInfos[];
  /** Allowed mosaic methods from ESRI Image service metadata. */
  allowedMosaicMethods?: TypeMosaicMethod[];
  /** Active mosaic rule for ESRI Image layers. */
  mosaicRule?: TypeMosaicRule;
  /** Temporal dimension metadata for time-aware layers. */
  timeDimension?: TimeDimension;
  /** Active style for WMS layers. */
  wmsStyle?: string;
  /** Available WMS styles metadata from WMS capabilities. */
  wmsStyles?: TypeMetadataWMSCapabilityLayerStyle[];
  /** Current opacity value (0–1). */
  opacity?: number;
  /** Maximum opacity allowed by the parent layer. */
  opacityMaxFromParent?: number;
  /** Current map zoom level. */
  zoom?: number;
}
