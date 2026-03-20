import type { Extent } from 'ol/extent';
import type { TypeLayersViewDisplayState, TypeLegendItem, TypeLegendLayer } from '@/core/components/layers/types';
import type { TypeMapFeaturesConfig } from '@/core/types/global-types';
import { type TypeGetStore, type TypeSetStore } from '@/core/stores/geoview-store';
import type { TypeFeatureInfoEntryPartial, TypeLayerStyleConfig, TypeResultSet, TypeResultSetEntry } from '@/api/types/map-schema-types';
import { type TemporalMode, type TimeDimension, type TimeIANA, type TypeDisplayDateFormat } from '@/core/utils/date-mgt';
import type { TypeGeoviewLayerType, TypeLayerStatus, TypeMetadataEsriRasterFunctionInfos, TypeMetadataWMSCapabilityLayerStyle, TypeMosaicMethod, TypeMosaicOperation, TypeMosaicRule } from '@/api/types/layer-schema-types';
import type { TypeVectorLayerStyles } from '@/geo/utils/renderer/geoview-renderer';
type LayerActions = ILayerState['actions'];
export interface ILayerState {
    highlightedLayer: string;
    selectedLayer: TypeLegendLayer;
    selectedLayerPath?: string;
    legendLayers: TypeLegendLayer[];
    displayState: TypeLayersViewDisplayState;
    layersAreLoading: boolean;
    setDefaultConfigValues: (geoviewConfig: TypeMapFeaturesConfig) => void;
    actions: {
        deleteLayer: (layerPath: string, undoWindowDuration: number) => Promise<boolean>;
        deleteLayerAbort: (layerPath: string) => void;
        getExtentFromFeatures: (layerPath: string, featureIds: number[], outfield?: string) => Promise<Extent>;
        queryLayerEsriDynamic: (layerPath: string, objectIDs: number[]) => Promise<TypeFeatureInfoEntryPartial[]>;
        getLayerServiceProjection: (layerPath: string) => string | undefined;
        getLayerRasterFunctionInfos: (layerPath: string) => TypeMetadataEsriRasterFunctionInfos[] | undefined;
        getLayerRasterFunction: (layerPath: string) => string | undefined;
        getLayerRasterFunctionPreviews: (layerPath: string) => Map<string, Promise<string>>;
        getLayerAllowedMosaicMethods: (layerPath: string) => TypeMosaicMethod[] | undefined;
        getLayerWmsStyle: (layerPath: string) => string | undefined;
        getLayerWmsAvailableStyles: (layerPath: string) => TypeMetadataWMSCapabilityLayerStyle[] | undefined;
        getLayerSettings: (layerPath: string) => string[];
        getLayerHasText: (layerPath: string) => boolean;
        getLayerTextVisibility: (layerPath: string) => boolean;
        refreshLayer: (layerPath: string) => Promise<void>;
        reloadLayer: (layerPath: string) => void;
        toggleItemVisibility: (layerPath: string, item: TypeLegendItem) => void;
        toggleItemVisibilityAndWait: (layerPath: string, item: TypeLegendItem) => Promise<void>;
        setLayerTextVisibility: (layerPath: string, visible: boolean) => void;
        setAllItemsVisibility: (layerPath: string, visibility: boolean) => void;
        setAllItemsVisibilityAndWait: (layerPath: string, visibility: boolean) => Promise<void>;
        setDisplayState: (newDisplayState: TypeLayersViewDisplayState) => void;
        setHighlightLayer: (layerPath: string) => void;
        setLayerOpacity: (layerPath: string, opacity: number, updateLegendLayers?: boolean) => void;
        setLayerHoverable: (layerPath: string, enable: boolean) => void;
        setLayerQueryable: (layerPath: string, enable: boolean) => void;
        setLayerRasterFunction: (layerPath: string, rasterFunctionId: string) => void;
        setLayerMosaicRule: (layerPath: string, mosaicRule: TypeMosaicRule | undefined) => void;
        setLayerMosaicRuleAscending: (layerPath: string, value: boolean) => void;
        setLayerMosaicRuleMethod: (layerPath: string, value: TypeMosaicMethod) => void;
        setLayerMosaicRuleOperation: (layerPath: string, value: TypeMosaicOperation) => void;
        setLayerWmsStyle: (layerPath: string, wmsStyleName: string) => void;
        setSelectedLayerPath: (layerPath: string | undefined) => void;
        zoomToLayerExtent: (layerPath: string) => Promise<void>;
        zoomToLayerVisibleScale: (layerPath: string) => void;
    };
    setterActions: {
        setDisplayState: (newDisplayState: TypeLayersViewDisplayState) => void;
        setHighlightLayer: (layerPath: string) => void;
        setLegendLayers: (legendLayers: TypeLegendLayer[]) => void;
        setSelectedLayerPath: (layerPath: string | undefined) => void;
        setLayersAreLoading: (areLoading: boolean) => void;
        setLayerDeletionStartTime: (layerPath: string, startTime: number | undefined) => void;
    };
}
/**
 * Initializes a Layer State and provide functions which use the get/set Zustand mechanisms.
 *
 * @param {TypeSetStore} set - The setter callback to be used by this state
 * @param {TypeGetStore} get - The getter callback to be used by this state
 * @returns The initialized Layer State
 */
export declare function initializeLayerState(set: TypeSetStore, get: TypeGetStore): ILayerState;
export type TypeLegendResultInfo = {
    layerStatus: TypeLayerStatus;
    legendQueryStatus: LegendQueryStatus;
    data: TypeLegend | undefined;
};
export type LegendQueryStatus = 'init' | 'querying' | 'queried' | 'error';
export type TypeLegend = {
    type: TypeGeoviewLayerType;
    legend: TypeVectorLayerStyles | HTMLCanvasElement | null;
    styleConfig?: TypeLayerStyleConfig;
};
export type TypeLegendResultSetEntry = TypeResultSetEntry & TypeLegendResultInfo;
export type TypeLegendResultSet = TypeResultSet<TypeLegendResultSetEntry>;
export declare const useLayerHighlightedLayer: () => string;
export declare const useLayerLegendLayers: () => TypeLegendLayer[];
export declare const useLayerSelectedLayer: () => TypeLegendLayer;
export declare const useLayerSelectedLayerPath: () => string | null | undefined;
export declare const useLayerDisplayState: () => TypeLayersViewDisplayState;
export declare const useLayerAreLayersLoading: () => boolean;
export declare const useSelectedLayer: () => TypeLegendLayer | undefined;
export declare const useLayerIconLayerSet: (layerPath: string) => string[];
/**
 * React hook that returns if the time dimension for a layer.
 * @returns {TimeDimension | undefined} - The time dimension for the layer if any.
 */
export declare const useLayerTimeDimension: (layerPath: string) => TimeDimension | undefined;
/**
 * React hook that returns if the temporal modes for the layers.
 * @returns {Record<string, TemporalMode>} - The temporal mode of the dates for the layer.
 */
export declare const useLayerDateTemporalModes: () => Record<string, TemporalMode>;
/**
 * React hook that returns if the temporal mode of the dates for the layer.
 * @param {string} layerPath - Unique path identifying the layer in the legend state.
 * @returns {TemporalMode} - The temporal mode of the dates for the layer. Default: DateMgt.DEFAULT_TEMPORAL_MODE.
 */
export declare const useLayerDateTemporalMode: (layerPath: string) => TemporalMode;
/**
 * React hook that returns if the display date formats for the layers.
 * @returns {Record<string, TypeDisplayDateFormat>} - The display date format of the dates for the layer.
 */
export declare const useLayerDisplayDateFormats: () => Record<string, TypeDisplayDateFormat>;
/**
 * React hook that returns the display date format for a specific layer.
 * The hook first attempts to resolve a layer-specific display date format
 * using the provided layer path. If the layer does not define its own
 * display date format (or cannot be found), the application-wide display
 * date format for the current map is returned as a fallback.
 * @param {string} layerPath - Unique path identifying the layer in the legend state.
 * @returns {TypeDisplayDateFormat} - The display date format to use for the layer, falling back to the
 * application's default display date format when none is defined.
 */
export declare const useLayerDisplayDateFormat: (layerPath: string) => TypeDisplayDateFormat;
/**
 * React hook that returns the display date format for a specific layer.
 * The hook first attempts to resolve a layer-specific display date format
 * using the provided layer path. If the layer does not define its own
 * display date format (or cannot be found), the application-wide display
 * date format for the current map is returned as a fallback.
 * @param {string} layerPath - Unique path identifying the layer in the legend state.
 * @returns {TypeDisplayDateFormat} - The display date format to use for the layer, falling back to the
 * application's default display date format when none is defined.
 */
export declare const useLayerDisplayDateFormatShort: (layerPath: string) => TypeDisplayDateFormat;
/**
 * React hook that returns if the display date timezones for the layers.
 * @returns {Record<string, TimeIANA>} - The display date timezone of the dates for the layer.
 */
export declare const useLayerDisplayDateTimezones: () => Record<string, TimeIANA>;
/**
 * React hook that returns the display date timezone for a specific layer.
 * The hook first attempts to resolve a layer-specific display date timezone
 * using the provided layer path. If the layer does not define its own
 * display date timezone (or cannot be found), the application-wide display
 * date timezone for the current map is returned as a fallback.
 * @param {string} layerPath - Unique path identifying the layer in the legend state.
 * @returns {TimeIANA} - The display date timezone to use for the layer, falling back to the
 * application's default display date timezone when none is defined.
 */
export declare const useLayerDisplayDateTimezone: (layerPath: string) => TimeIANA;
/**
 * React hook that returns the raster function infos for a specific layer.
 * @param layerPath The layer path
 * @returns The raster function infos for the layer or undefined
 */
export declare const useLayerSelectorRasterFunctionInfos: (layerPath: string) => TypeMetadataEsriRasterFunctionInfos[] | undefined;
/**
 * React hook that returns the allowed mosaic methods for a specific layer.
 * @param layerPath The layer path
 * @returns The allowed mosaic methods for the layer or undefined
 */
export declare const useLayerSelectorAllowedMosaicMethods: (layerPath: string) => TypeMosaicMethod[] | undefined;
export declare const useLayerSelectorId: (layerPath: string) => string | undefined;
export declare const useLayerSelectorName: (layerPath: string) => string | undefined;
export declare const useLayerNames: () => Record<string, string>;
export declare const useLayerSelectorStatus: (layerPath: string) => TypeLayerStatus | undefined;
export declare const useLayerStatuses: () => Record<string, TypeLayerStatus>;
export declare const useLayerSelectorDeletionStartTime: (layerPath: string) => number | undefined;
export declare const useLayerSelectorFilter: (layerPath: string) => string | undefined;
export declare const useLayerSelectorFilterClass: (layerPath: string) => string | undefined;
export declare const useLayerSelectorSchemaTag: (layerPath: string) => TypeGeoviewLayerType | undefined;
export declare const useLayerSelectorEntryType: (layerPath: string) => import("@/api/types/layer-schema-types").TypeLayerEntryType | undefined;
export declare const useLayerSelectorBounds: (layerPath: string) => Extent | undefined;
export declare const useLayerSelectorBounds4326: (layerPath: string) => Extent | undefined;
export declare const useLayerSelectorControls: (layerPath: string) => import("@/api/types/layer-schema-types").TypeLayerControls | undefined;
export declare const useLayerSelectorChildren: (layerPath: string) => TypeLegendLayer[] | undefined;
export declare const useLayerSelectorItems: (layerPath: string) => TypeLegendItem[] | undefined;
export declare const useLayerSelectorIcons: (layerPath: string) => import("@/core/components/layers/types").TypeLegendLayerItem[] | undefined;
export declare const useLayerSelectorLegendQueryStatus: (layerPath: string) => LegendQueryStatus | undefined;
export declare const useLayerSelectorCanToggle: (layerPath: string) => boolean | undefined;
export declare const useLayerSelectorStyleConfig: (layerPath: string) => Partial<Record<"Point" | "MultiPoint" | "LineString" | "MultiLineString" | "Polygon" | "MultiPolygon", import("@/api/types/map-schema-types").TypeLayerStyleSettings>> | undefined;
export declare const useLayerSelectorRasterFunction: (layerPath: string) => string | undefined;
export declare const useLayerSelectorMosaicRule: (layerPath: string) => TypeMosaicRule | undefined;
export declare const useLayerSelectorWmsStyle: (layerPath: string) => string | undefined;
export declare const useLayerSelectorHasText: (layerPath: string) => boolean | undefined;
export declare const useLayerSelectorTextVisibility: (layerPath: string) => boolean | undefined;
export declare const useLayerStoreActions: () => LayerActions;
export {};
//# sourceMappingURL=layer-state.d.ts.map