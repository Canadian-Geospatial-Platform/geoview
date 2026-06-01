import type { Coordinate } from 'ol/coordinate';
import type { Extent } from 'ol/extent';
import type { Size } from 'ol/size';
import type { TypeBasemapOptions, TypeHighlightColors, TypeInteraction, TypeMapViewSettings, TypeValidMapProjectionCodes, TypeZoomAndCenter, TypeFeatureInfoEntry, TypePointMarker, TypeMapMouseInfo, TypeMapState, TypeCorePackagesConfig, TypeGlobalSettings, TypeViewSettings, TypeValidNavBarProps, TypeFooterBarProps, TypeAppBarProps, TypeOverviewMapProps, TypeValidMapComponentProps, TypeValidMapCorePackageProps, TypeExternalPackagesProps, TypeServiceUrls, TypeValidVersions } from '@/api/types/map-schema-types';
import type { MapConfigLayerEntry } from '@/api/types/layer-schema-types';
import type { TypeSetStore, TypeGetStore } from '@/core/stores/geoview-store';
import type { TypeMapFeaturesConfig } from '@/core/types/global-types';
import type { TypeClickMarker } from '@/core/components/click-marker/click-marker';
import type { TypeHoverFeatureInfo } from './feature-info-state';
import type { TypeMapStateForExportLayout } from '@/core/components/export/utilities';
/**
 * Represents the Map Zustand store slice.
 *
 * Manages state for the map including center coordinates, zoom level,
 * basemap options, feature highlights, and various map interactions.
 */
export interface IMapState {
    attribution: string[];
    basemapOptions: TypeBasemapOptions;
    centerCoordinates: Coordinate;
    clickCoordinates?: TypeMapMouseInfo;
    clickMarker: TypeClickMarker | undefined;
    currentBasemapOptions: TypeBasemapOptions;
    currentProjection: TypeValidMapProjectionCodes;
    featureHighlightColor: TypeHighlightColors;
    fixNorth: boolean;
    geolocatorSearchArea: {
        searchItem: string;
        coords: Coordinate;
        bbox?: Extent;
    } | undefined;
    hasGeoviewBasemapLayer: boolean;
    highlightedFeatures: TypeFeatureInfoEntry[];
    homeView: TypeMapViewSettings | undefined;
    hoverFeatureInfo: TypeHoverFeatureInfo | undefined | null;
    isMouseInsideMap: boolean;
    initialView: TypeMapViewSettings;
    interaction: TypeInteraction;
    mapExtent: Extent | undefined;
    mapLoaded: boolean;
    mapDisplayed: boolean;
    northArrow: boolean;
    northArrowElement: TypeNorthArrow;
    overviewMap: boolean;
    overviewMapHideZoom: number;
    pointerPosition?: TypeMapMouseInfo;
    pointMarkers: Record<string, TypePointMarker[]>;
    rotation: number;
    scale: TypeScaleInfo;
    size: Size;
    zoom: number;
    setDefaultConfigValues: (config: TypeMapFeaturesConfig) => void;
    actions: {
        setMapSize: (size: Size) => void;
        setMapScale: (scale: TypeScaleInfo) => void;
        setMapLoaded: (mapLoaded: boolean) => void;
        setMapDisplayed: () => void;
        setAttribution: (attribution: string[]) => void;
        setInitialView: (view: TypeZoomAndCenter | Extent) => void;
        setGeolocatorSearchArea: (area: {
            searchItem: string;
            coords: Coordinate;
            bbox?: Extent;
        } | undefined) => void;
        setHomeView: (view: TypeMapViewSettings) => void;
        setInteraction: (interaction: TypeInteraction) => void;
        setIsMouseInsideMap: (isMouseInsideMap: boolean) => void;
        setZoom: (zoom: number) => void;
        setRotation: (rotation: number) => void;
        setProjection: (projectionCode: TypeValidMapProjectionCodes) => void;
        setMapMoveEnd: (centerCoordinates: Coordinate, pointerPosition: TypeMapMouseInfo, degreeRotation: string, isNorthVisible: boolean, mapExtent: Extent, scale: TypeScaleInfo) => void;
        setPointerPosition: (pointerPosition: TypeMapMouseInfo) => void;
        setPointMarkers: (pointMarkers: Record<string, TypePointMarker[]>) => void;
        setClickCoordinates: (clickCoordinates: TypeMapMouseInfo) => void;
        setCurrentBasemapOptions: (basemapOptions: TypeBasemapOptions) => void;
        setFixNorth: (ifFix: boolean) => void;
        setHighlightedFeatures: (highlightedFeatures: TypeFeatureInfoEntry[]) => void;
        setClickMarker: (coord: number[] | undefined) => void;
        setHoverFeatureInfo: (hoverFeatureInfo: TypeHoverFeatureInfo) => void;
    };
}
/**
 * Initializes a Map State and provide functions which use the get/set Zustand mechanisms.
 *
 * @param set - The setter callback to be used by this state
 * @param get - The getter callback to be used by this state
 * @returns The initialized Map State
 */
export declare function initializeMapState(set: TypeSetStore, get: TypeGetStore): IMapState;
/**
 * Returns the map state as a serializable JSON object.
 *
 * @param mapId - The map identifier
 * @returns The map state as a plain object
 */
export declare const getStoreMapStateJson: (mapId: string) => TypeMapState;
/**
 * Returns the map state properties needed for the export layout.
 *
 * @param mapId - The map identifier
 * @returns The map state subset for export layout rendering
 */
export declare const getStoreMapStateForExportLayout: (mapId: string) => TypeMapStateForExportLayout;
/** Returns the current map projection code. */
export declare const getStoreMapCurrentProjection: (mapId: string) => TypeValidMapProjectionCodes;
/** Selects the current map projection code from the store. */
export declare const useStoreMapCurrentProjection: () => TypeValidMapProjectionCodes;
/** Returns the current map projection as an EPSG string. */
export declare const getStoreMapCurrentProjectionEPSG: (mapId: string) => string;
/** Selects the current map projection as an EPSG string from the store. */
export declare const useStoreMapCurrentProjectionEPSG: () => string;
/** Returns the current pointer position, or undefined if unavailable. */
export declare const getStoreMapPointerPosition: (mapId: string) => TypeMapMouseInfo | undefined;
/** Selects the current pointer position from the store. */
export declare const useStoreMapPointerPosition: () => TypeMapMouseInfo | undefined;
/** Returns the current pointer position, or undefined if unavailable. */
export declare const getStoreMapClickCoordinates: (mapId: string) => TypeMapMouseInfo | undefined;
/** Selects the click coordinates from the store. */
export declare const useStoreMapClickCoordinates: () => TypeMapMouseInfo | undefined;
/** Returns the current basemap options. */
export declare const getStoreMapCurrentBasemapOptions: (mapId: string) => TypeBasemapOptions;
/** Selects the current basemap options from the store. */
export declare const useStoreMapCurrentBasemapOptions: () => TypeBasemapOptions;
/** Returns the initial basemap options from the store. */
export declare const getStoreMapBasemapOptions: (mapId: string) => TypeBasemapOptions;
/** Selects the initial basemap options from the store. */
export declare const useStoreMapBasemapOptions: () => TypeBasemapOptions;
/** Returns the basemap options, falling back to initial options if current are not set. */
export declare const getStoreMapCurrentBasemapOptionsOrInitial: (mapId: string) => TypeBasemapOptions;
/** Returns the home view settings for the map. */
export declare const getStoreMapHomeView: (mapId: string) => TypeMapViewSettings;
/** Returns the initial view settings for the map, or undefined if not set. */
export declare const getStoreMapInitialView: (mapId: string) => TypeMapViewSettings | undefined;
/** Selects the initial view settings from the store. */
export declare const useStoreMapInitialView: () => TypeMapViewSettings;
/** Returns the current map rotation angle in radians. */
export declare const getStoreMapRotation: (mapId: string) => number;
/** Selects the map rotation angle from the store. */
export declare const useStoreMapRotation: () => number;
/** Returns the geolocator search area with coordinates and optional bounding box. */
export declare const getStoreMapGeolocatorSearchArea: (mapId: string) => {
    coords: Coordinate;
    bbox?: Extent;
} | undefined;
/** Returns the feature highlight color settings. */
export declare const getStoreMapFeatureHighlightColor: (mapId: string) => TypeHighlightColors;
/** Selects the feature highlight color settings from the store. */
export declare const useStoreMapFeatureHighlightColor: () => TypeHighlightColors;
/** Returns the hover feature info state. */
export declare const getStoreMapHoverFeatureInfo: (mapId: string) => TypeHoverFeatureInfo;
/** Selects the hover feature info from the store. */
export declare const useStoreMapHoverFeatureInfo: () => TypeHoverFeatureInfo;
/** Returns the point markers grouped by name. */
export declare const getStoreMapPointMarkers: (mapId: string) => Record<string, TypePointMarker[]>;
/** Selects the point markers grouped by name from the store. */
export declare const useStoreMapPointMarkers: () => Record<string, TypePointMarker[]>;
/** Returns the current map interaction mode. */
export declare const getStoreMapInteraction: (mapId: string) => TypeInteraction;
/** Selects the map interaction mode from the store. */
export declare const useStoreMapInteraction: () => TypeInteraction;
/** Returns the array of currently highlighted features. */
export declare const getStoreMapHighlightedFeatures: (mapId: string) => TypeFeatureInfoEntry[];
/** Returns highlighted features matching the given feature UID. */
export declare const getStoreMapHighlightedFeaturesByUid: (mapId: string, featureUid: string | undefined) => TypeFeatureInfoEntry[];
/** Selects the map attribution strings from the store. */
export declare const useStoreMapAttribution: () => string[];
/** Selects the map center coordinates from the store. */
export declare const useStoreMapCenterCoordinates: () => Coordinate;
/** Selects the click marker state from the store. */
export declare const useStoreMapClickMarker: () => TypeClickMarker | undefined;
/** Returns the current map extent in the map's projection, or undefined if not yet set. */
export declare const getStoreMapExtent: (mapId: string) => Extent | undefined;
/** Selects the current map extent from the store. */
export declare const useStoreMapExtent: () => Extent | undefined;
/** Selects whether the map has a geoview basemap layer from the store. */
export declare const useStoreMapHasGeoviewBasemapLayer: () => boolean;
/** Selects whether the map is fixed to north from the store. */
export declare const useStoreMapFixNorth: () => boolean;
/** Selects whether the mouse is inside the map from the store. */
export declare const useStoreMapIsMouseInsideMap: () => boolean;
/** Selects whether the map is loaded from the store. */
export declare const useStoreMapLoaded: () => boolean;
/** Selects whether the map is displayed from the store. */
export declare const useStoreMapDisplayed: () => boolean;
/** Selects whether the north arrow is enabled from the store. */
export declare const useStoreMapNorthArrow: () => boolean;
/** Selects the north arrow element state from the store. */
export declare const useStoreMapNorthArrowElement: () => TypeNorthArrow;
/** Selects the zoom level at which the overview map hides from the store. */
export declare const useStoreMapOverviewMapHideZoom: () => number;
/** Selects the map scale information from the store. */
export declare const useStoreMapScale: () => TypeScaleInfo;
/** Selects the map size from the store. */
export declare const useStoreMapSize: () => Size;
/** Selects the current zoom level from the store. */
export declare const useStoreMapZoom: () => number;
/**
 * Returns the map config state for the given map.
 *
 * Internal-only selector - not exported to avoid direct store access from outside this module.
 *
 * @param mapId - The map identifier
 * @returns The ILayerState for the given map
 * @throws {Error} When the map config state is uninitialized
 */
export declare const getStoreMapConfigState: (mapId: string) => TypeMapFeaturesConfig;
/**
 * Checks whether the map config state has been initialized for the given map.
 *
 * @param mapId - The map identifier
 * @returns True if the map config state is initialized, false otherwise
 */
export declare const isStoreMapConfigInitialized: (mapId: string) => boolean;
/** Returns the nav bar configuration from the map config. */
export declare const getStoreMapConfigNavBar: (mapId: string) => TypeValidNavBarProps[] | undefined;
/** Returns the footer bar configuration from the map config. */
export declare const getStoreMapConfigFooterBar: (mapId: string) => TypeFooterBarProps | undefined;
/** Returns the app bar configuration from the map config. */
export declare const getStoreMapConfigAppBar: (mapId: string) => TypeAppBarProps | undefined;
/** Returns the overview map configuration from the map config. */
export declare const getStoreMapConfigOverviewMap: (mapId: string) => TypeOverviewMapProps | undefined;
/** Selects whether the overview map is enabled from the store. */
export declare const useStoreMapOverviewMap: () => boolean;
/** Returns the enabled map components from the map config. */
export declare const getStoreMapConfigComponents: (mapId: string) => TypeValidMapComponentProps[] | undefined;
/** Returns the enabled core packages from the map config. */
export declare const getStoreMapConfigCorePackages: (mapId: string) => TypeValidMapCorePackageProps[] | undefined;
/** Returns the core packages configuration from the map config. */
export declare const getStoreMapConfigCorePackagesConfig: (mapId: string) => TypeCorePackagesConfig | undefined;
/** Returns the external packages configuration from the map config. */
export declare const getStoreMapConfigExternalPackages: (mapId: string) => TypeExternalPackagesProps[] | undefined;
/** Returns the global settings from the map config. */
export declare const getStoreMapConfigGlobalSettings: (mapId: string) => TypeGlobalSettings | undefined;
/** Returns the service URLs from the map config. */
export declare const getStoreMapConfigServiceUrls: (mapId: string) => TypeServiceUrls;
/** Returns the schema version used in the map config. */
export declare const getStoreMapConfigSchemaVersionUsed: (mapId: string) => TypeValidVersions | undefined;
/** Returns the view settings from the map config. */
export declare const getStoreMapConfigViewSettings: (mapId: string) => TypeViewSettings;
/**
 * Returns the current projection code from the map config state for the given map.
 *
 * @param mapId - The map identifier
 * @returns The current projection code
 * @throws {Error} When the map config state is uninitialized
 */
export declare const getStoreMapConfigViewSettingsProjection: (mapId: string) => TypeValidMapProjectionCodes;
/** Returns the highlight color setting from the map config. */
export declare const getStoreMapConfigHighlightColor: (mapId: string) => TypeHighlightColors | undefined;
/** Returns the list of geoview layer configurations from the map config. */
export declare const getStoreMapConfigListOfGeoviewLayerConfig: (mapId: string) => MapConfigLayerEntry[];
/** Sets the map loaded state in the store. */
export declare const setStoreMapLoaded: (mapId: string, mapLoaded: boolean) => void;
/** Sets the geolocator search area with coordinates and optional bounding box in the store. */
export declare const setStoreMapGeolocatorSearchArea: (mapId: string, searchItem: string, coords: Coordinate, bbox?: Extent) => void;
/** Sets the home button view settings in the store. */
export declare const setStoreMapHomeButtonView: (mapId: string, view: TypeMapViewSettings) => void;
/** Sets the current basemap options in the store. */
export declare const setStoreMapCurrentBasemapOptions: (mapId: string, basemapOptions: TypeBasemapOptions) => void;
/** Sets the click marker position in the store. */
export declare const setStoreMapClickMarker: (mapId: string, projectedCoords: number[] | undefined) => void;
/** Hides the click marker icon by clearing its position in the store. */
export declare const setStoreMapClickMarkerIconHide: (mapId: string) => void;
/** Sets the map projection code in the store. */
export declare const setStoreMapProjection: (mapId: string, projectionCode: TypeValidMapProjectionCodes) => void;
/** Sets the zoom level in the store. */
export declare const setStoreMapZoom: (mapId: string, zoom: number) => void;
/** Sets the click coordinates in the store. */
export declare const setStoreMapClickCoordinates: (mapId: string, clickCoordinates: TypeMapMouseInfo) => void;
/** Sets the point markers in the store. */
export declare const setStoreMapPointMarkers: (mapId: string, pointMarkers: Record<string, TypePointMarker[]>) => void;
/** Sets the map attribution strings in the store. */
export declare const setStoreMapAttribution: (mapId: string, attribution: string[]) => void;
/** Marks the map as displayed in the store. */
export declare const setStoreMapDisplayed: (mapId: string) => void;
/** Sets the pointer position in the store. */
export declare const setStoreMapPointerPosition: (mapId: string, pointerPosition: TypeMapMouseInfo) => void;
/** Sets the hover feature info in the store. */
export declare const setStoreMapHoverFeatureInfo: (mapId: string, hoverFeatureInfo: TypeHoverFeatureInfo) => void;
/** Sets the map interaction mode in the store. */
export declare const setStoreMapInteraction: (mapId: string, interaction: TypeInteraction) => void;
/** Sets whether the mouse is inside the map in the store. */
export declare const setStoreMapIsMouseInsideMap: (mapId: string, inside: boolean) => void;
/** Sets the map scale information in the store. */
export declare const setStoreMapScale: (mapId: string, scale: TypeScaleInfo) => void;
/** Sets the map size in the store. */
export declare const setStoreMapSize: (mapId: string, size: Size) => void;
/** Sets the map rotation angle in the store. */
export declare const setStoreMapRotation: (mapId: string, rotation: number) => void;
/** Sets the highlighted features in the store. */
export declare const setStoreMapHighlightedFeatures: (mapId: string, highlightedFeatures: TypeFeatureInfoEntry[]) => void;
/** Updates the store with map move end properties including center, rotation, extent, and scale. */
export declare const setStoreMapMoveEnd: (mapId: string, centerCoordinates: Coordinate, pointerPosition: TypeMapMouseInfo, degreeRotation: string, isNorthVisible: boolean, mapExtent: Extent, scale: TypeScaleInfo) => void;
/** Sets the fix north state in the store. */
export declare const setStoreMapFixNorth: (mapId: string, fixNorth: boolean) => void;
/** Represents the map scale display information for metric and imperial units. */
export interface TypeScaleInfo {
    /** The line width for the metric scale bar. */
    lineWidthMetric: string;
    /** The label text for the metric scale bar. */
    labelGraphicMetric: string;
    /** The line width for the imperial scale bar. */
    lineWidthImperial: string;
    /** The label text for the imperial scale bar. */
    labelGraphicImperial: string;
    /** The numeric scale label. */
    labelNumeric: string;
}
/** Represents the north arrow display state. */
export interface TypeNorthArrow {
    /** The rotation angle in degrees as a string. */
    degreeRotation: string;
    /** Whether the north direction is currently visible on the map. */
    isNorthVisible: boolean;
}
//# sourceMappingURL=map-state.d.ts.map