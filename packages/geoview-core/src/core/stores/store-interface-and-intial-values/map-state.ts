import { useMemo } from 'react';
import { useStore } from 'zustand';

import type { Coordinate } from 'ol/coordinate';
import type Overlay from 'ol/Overlay';
import type { Extent } from 'ol/extent';
import type { Size } from 'ol/size';

import type {
  TypeBasemapOptions,
  TypeHighlightColors,
  TypeInteraction,
  TypeMapViewSettings,
  TypeValidMapProjectionCodes,
  TypeZoomAndCenter,
  TypeFeatureInfoEntry,
  TypePointMarker,
  TypeMapMouseInfo,
  TypeMapState,
  TypeCorePackagesConfig,
  TypeGlobalSettings,
  TypeViewSettings,
  TypeValidNavBarProps,
  TypeFooterBarProps,
  TypeAppBarProps,
  TypeOverviewMapProps,
  TypeValidMapComponentProps,
  TypeValidMapCorePackageProps,
  TypeExternalPackagesProps,
  TypeServiceUrls,
  TypeValidVersions,
} from '@/api/types/map-schema-types';
import { DEFAULT_HIGHLIGHT_COLOR, MAP_CENTER, MAP_ZOOM_LEVEL } from '@/api/types/map-schema-types';
import type { MapConfigLayerEntry } from '@/api/types/layer-schema-types';
import { CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';
import { getGeoViewStore, useGeoViewStore } from '@/core/stores/stores-managers';
import type { TypeSetStore, TypeGetStore } from '@/core/stores/geoview-store';
import { useStableSelector } from '@/core/stores/geoview-store';
import type { TypeMapFeaturesConfig } from '@/core/types/global-types';
import type { TypeClickMarker } from '@/core/components/click-marker/click-marker';
import type { TypeHoverFeatureInfo } from './feature-info-state';
import { getStoreLayerStatus, getStoreLayerLegendLayerByPath } from './layer-state';
import type { TypeMapStateForExportLayout } from '@/core/components/export/utilities';

// #region INTERFACE DEFINITION

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
  geolocatorSearchArea: { searchItem: string; coords: Coordinate; bbox?: Extent } | undefined;
  hasGeoviewBasemapLayer: boolean;
  highlightedFeatures: TypeFeatureInfoEntry[];
  homeView: TypeMapViewSettings | undefined;
  hoverFeatureInfo: TypeHoverFeatureInfo | undefined | null;
  isMouseInsideMap: boolean;
  initialFilters: Record<string, string>;
  initialView: TypeMapViewSettings;
  interaction: TypeInteraction;
  mapExtent: Extent | undefined;
  mapLoaded: boolean;
  mapDisplayed: boolean;
  northArrow: boolean;
  northArrowElement: TypeNorthArrow;
  orderedLayerInfo: TypeOrderedLayerInfo[];
  orderedLayers: string[];
  overlayClickMarker?: Overlay;
  overlayNorthMarker?: Overlay;
  overviewMap: boolean;
  overviewMapHideZoom: number;
  pointerPosition?: TypeMapMouseInfo;
  pointMarkers: Record<string, TypePointMarker[]>;
  rotation: number;
  scale: TypeScaleInfo;
  size: Size;
  visibleLayers: string[];
  visibleRangeLayers: string[];
  zoom: number;

  setDefaultConfigValues: (config: TypeMapFeaturesConfig) => void;

  actions: {
    setMapSize: (size: Size) => void;
    setMapScale: (scale: TypeScaleInfo) => void;
    setMapLoaded: (mapLoaded: boolean) => void;
    setMapDisplayed: () => void;
    setAttribution: (attribution: string[]) => void;
    setInitialFilters: (filters: Record<string, string>) => void;
    setInitialView: (view: TypeZoomAndCenter | Extent) => void;
    setGeolocatorSearchArea: (area: { searchItem: string; coords: Coordinate; bbox?: Extent } | undefined) => void;
    setHomeView: (view: TypeMapViewSettings) => void;
    setInteraction: (interaction: TypeInteraction) => void;
    setIsMouseInsideMap: (isMouseInsideMap: boolean) => void;
    setZoom: (zoom: number) => void;
    setRotation: (rotation: number) => void;
    setOverlayClickMarker: (overlay: Overlay) => void;
    setOverlayNorthMarker: (overlay: Overlay) => void;
    setProjection: (projectionCode: TypeValidMapProjectionCodes) => void;
    setMapMoveEnd: (
      centerCoordinates: Coordinate,
      pointerPosition: TypeMapMouseInfo,
      degreeRotation: string,
      isNorthVisible: boolean,
      mapExtent: Extent,
      scale: TypeScaleInfo
    ) => void;
    setPointerPosition: (pointerPosition: TypeMapMouseInfo) => void;
    setPointMarkers: (pointMarkers: Record<string, TypePointMarker[]>) => void;
    setClickCoordinates: (clickCoordinates: TypeMapMouseInfo) => void;
    setCurrentBasemapOptions: (basemapOptions: TypeBasemapOptions) => void;
    setFixNorth: (ifFix: boolean) => void;
    setHighlightedFeatures: (highlightedFeatures: TypeFeatureInfoEntry[]) => void;
    setVisibleLayers: (newOrder: string[]) => void;
    setVisibleRangeLayers: (newOrder: string[]) => void;
    setOrderedLayerInfo: (newOrderedLayerInfo: TypeOrderedLayerInfo[]) => void;
    setOrderedLayers: (newOrder: string[]) => void;
    setHoverable: (layerPath: string, hoverable: boolean) => void;
    setLegendCollapsed: (layerPath: string, newValue?: boolean) => void;
    setQueryable: (layerPath: string, queryable: boolean) => void;
    updateOrderedLayerInfoByPath: (layerPath: string, updates: Partial<TypeOrderedLayerInfo>) => void;
    setClickMarker: (coord: number[] | undefined) => void;
    setHoverFeatureInfo: (hoverFeatureInfo: TypeHoverFeatureInfo) => void;
  };
}

// #endregion INTERFACE DEFINITION

/**
 * Finds a single ordered layer info entry matching the given layer path.
 *
 * @param layerPath - The layer path to search for
 * @param orderedLayerInfo - The ordered layer info array to search in
 * @returns The matching ordered layer info, or undefined if not found
 */
const utilFindMapLayerFromOrderedInfo = (layerPath: string, orderedLayerInfo: TypeOrderedLayerInfo[]): TypeOrderedLayerInfo | undefined => {
  return orderedLayerInfo.find((layer) => layer.layerPath === layerPath);
};

/**
 * Finds a layer and all its children from the ordered layer info array.
 *
 * Matches the exact layer path and any paths that start with the given path followed by a separator.
 *
 * @param layerPath - The layer path to search for
 * @param orderedLayerInfo - The ordered layer info array to search in
 * @returns The matching ordered layer info entries including the layer and its children
 */
// TODO: CHECK - Should likely not export this function if we have proper encapsulation (we didn't export the other similar functions in other states)
export const utilFindMapLayerAndChildrenFromOrderedInfo = (
  layerPath: string,
  orderedLayerInfo: TypeOrderedLayerInfo[]
): TypeOrderedLayerInfo[] => {
  return orderedLayerInfo.filter((layer) => layer.layerPath.startsWith(`${layerPath}/`) || layer.layerPath === layerPath);
};

/**
 * Checks whether any parent layer of the given layer path is hidden (not visible).
 *
 * Traverses up the layer path hierarchy and returns true as soon as any ancestor is not visible.
 *
 * @param layerPath - The layer path to check parent visibility for
 * @param orderedLayerInfo - The ordered layer info array to search in
 * @returns True if any parent layer is hidden, false otherwise
 */
const utilGetParentLayerHiddenOnMap = (layerPath: string, orderedLayerInfo: TypeOrderedLayerInfo[]): boolean => {
  // For each parent
  const parentLayerPathArray = layerPath.split('/');
  parentLayerPathArray.pop();
  let parentLayerPath = parentLayerPathArray.join('/');
  let parentLayerInfo = orderedLayerInfo.find((info: TypeOrderedLayerInfo) => info.layerPath === parentLayerPath);

  while (parentLayerInfo !== undefined) {
    // Return true as soon as any parent is not visible
    if (parentLayerInfo.visible === false) return true;

    // Prepare for next parent
    parentLayerPathArray.pop();
    parentLayerPath = parentLayerPathArray.join('/');
    // eslint-disable-next-line no-loop-func
    parentLayerInfo = orderedLayerInfo.find((info: TypeOrderedLayerInfo) => info.layerPath === parentLayerPath);
  }

  return false;
};

/**
 * Checks whether a layer is hidden on the map.
 *
 * A layer is considered hidden if any of its parent layers are hidden,
 * it is not in the visible range, or it is not visible.
 *
 * @param layerPath - The layer path to check
 * @param orderedLayerInfo - The ordered layer info array to search in
 * @returns True if the layer is hidden on the map, false otherwise
 */
const utilGetLayerHiddenOnMap = (layerPath: string, orderedLayerInfo: TypeOrderedLayerInfo[]): boolean => {
  return (
    utilGetParentLayerHiddenOnMap(layerPath, orderedLayerInfo) ||
    !utilFindMapLayerFromOrderedInfo(layerPath, orderedLayerInfo)?.inVisibleRange ||
    !utilFindMapLayerFromOrderedInfo(layerPath, orderedLayerInfo)?.visible
  );
};

/**
 * Returns the ordered layer info entries that have collapsible legends.
 *
 * A layer is considered collapsible if it has children, multiple legend items,
 * or is a WMS layer with valid icon images.
 *
 * @param mapId - The map identifier
 * @param orderedLayerInfo - The ordered layer info array to filter
 * @returns The ordered layer info entries with collapsible legends
 */
const utilGetLegendCollapsibleLayers = (mapId: string, orderedLayerInfo: TypeOrderedLayerInfo[]): TypeOrderedLayerInfo[] => {
  // TODO: CHECK - This store references another store by using getStoreLayerLegendLayerByPath below :/
  return orderedLayerInfo.filter((layer) => {
    const legendLayer = getStoreLayerLegendLayerByPath(mapId, layer.layerPath);
    return (
      (legendLayer?.children && legendLayer.children.length > 0) ||
      (legendLayer?.items && legendLayer.items.length > 1) ||
      (legendLayer?.schemaTag === CONST_LAYER_TYPES.WMS &&
        legendLayer?.icons?.some((icon) => icon.iconImage && icon.iconImage !== 'no data'))
    );
  });
};

/**
 * Immutably updates a single entry in the ordered layer info array by layer path.
 *
 * Returns a new array where only the matching entry is replaced with a shallow-merged copy.
 * Non-matching entries keep their original object references.
 *
 * @param orderedLayerInfo - The current ordered layer info array
 * @param layerPath - The layer path to update
 * @param updates - Partial properties to merge into the matching entry
 * @returns A new array with the updated entry, or the same array if the path was not found
 */
const utilUpdateOrderedLayerInfoByPath = (
  orderedLayerInfo: TypeOrderedLayerInfo[],
  layerPath: string,
  updates: Partial<TypeOrderedLayerInfo>
): TypeOrderedLayerInfo[] => {
  let found = false;
  const result = orderedLayerInfo.map((entry) => {
    if (entry.layerPath === layerPath) {
      found = true;
      return { ...entry, ...updates };
    }
    return entry;
  });
  return found ? result : orderedLayerInfo;
};

// #region STATE INITIALIZATION

/**
 * Initializes a Map State and provide functions which use the get/set Zustand mechanisms.
 *
 * @param set - The setter callback to be used by this state
 * @param get - The getter callback to be used by this state
 * @returns The initialized Map State
 */
export function initializeMapState(set: TypeSetStore, get: TypeGetStore): IMapState {
  const init = {
    attribution: [],
    basemapOptions: { basemapId: 'transport', shaded: true, labeled: true },
    centerCoordinates: [0, 0] as Coordinate,
    clickMarker: undefined,
    currentBasemapOptions: { basemapId: 'transport', shaded: true, labeled: true },
    currentProjection: 3857 as TypeValidMapProjectionCodes,
    featureHighlightColor: DEFAULT_HIGHLIGHT_COLOR,
    geolocatorSearchArea: undefined,
    fixNorth: false,
    hasGeoviewBasemapLayer: false,
    highlightedFeatures: [],
    homeView: undefined,
    hoverFeatureInfo: undefined,
    initialFilters: {},
    initialView: {
      zoomAndCenter: [MAP_ZOOM_LEVEL[3857], MAP_CENTER[3857]],
    },
    interaction: 'static',
    isMouseInsideMap: false,
    mapExtent: undefined,
    mapLoaded: false,
    mapDisplayed: false,
    northArrow: false,
    northArrowElement: { degreeRotation: '180.0', isNorthVisible: true } as TypeNorthArrow,
    orderedLayerInfo: [],
    orderedLayers: [],
    overviewMap: false,
    overviewMapHideZoom: 0,
    pointerPosition: undefined,
    pointMarkers: {},
    rotation: 0,
    scale: {
      lineWidthMetric: '',
      labelGraphicMetric: '',
      lineWidthImperial: '',
      labelGraphicImperial: '',
      labelNumeric: '',
    } as TypeScaleInfo,
    size: [0, 0] as Size,
    visibleLayers: [],
    visibleRangeLayers: [],
    zoom: 0,

    /**
     * Initializes default stores section from config information when store receive configuration file
     */
    setDefaultConfigValues: (geoviewConfig: TypeMapFeaturesConfig) => {
      set({
        mapState: {
          ...get().mapState,
          basemapOptions: geoviewConfig.map.basemapOptions,
          centerCoordinates:
            (geoviewConfig.map.viewSettings.initialView?.zoomAndCenter?.[1] as Coordinate) ??
            MAP_CENTER[geoviewConfig.map.viewSettings.projection],
          currentProjection: geoviewConfig.map.viewSettings.projection,
          currentBasemapOptions: geoviewConfig.map.basemapOptions,
          featureHighlightColor: geoviewConfig.map.highlightColor ?? DEFAULT_HIGHLIGHT_COLOR,
          geolocatorSearchArea: undefined,
          hasGeoviewBasemapLayer: geoviewConfig.map.listOfGeoviewLayerConfig.some((layer) => layer.useAsBasemap),
          homeView: geoviewConfig.map.viewSettings.homeView ??
            geoviewConfig.map.viewSettings.initialView ?? { zoomAndCenter: [MAP_ZOOM_LEVEL[3857], MAP_CENTER[3857]] },
          initialView: geoviewConfig.map.viewSettings.initialView ?? { zoomAndCenter: [MAP_ZOOM_LEVEL[3857], MAP_CENTER[3857]] },
          interaction: geoviewConfig.map.interaction ?? 'dynamic',
          mapExtent: geoviewConfig.map.viewSettings.maxExtent,
          northArrow: geoviewConfig.components!.indexOf('north-arrow') >= 0 || false, // Was defaulted so can use '!'
          overviewMap: geoviewConfig.components!.indexOf('overview-map') >= 0 || false, // Was defaulted so can use '!'
          overviewMapHideZoom: geoviewConfig.overviewMap?.hideOnZoom ?? 0,
          pointMarkers: geoviewConfig.map.overlayObjects?.pointMarkers ?? {},
          rotation: geoviewConfig.map.viewSettings.rotation ?? 0,
          zoom: geoviewConfig.map.viewSettings.initialView?.zoomAndCenter?.[0] ?? 4.5,
        },
      });
    },

    actions: {
      /**
       * Sets the map size.
       *
       * @param size - The size of the map.
       */
      setMapSize: (size: Size): void => {
        set({
          mapState: {
            ...get().mapState,
            size,
          },
        });
      },

      /**
       * Sets the map scale.
       *
       * @param scale - The scale information.
       */
      setMapScale: (scale: TypeScaleInfo): void => {
        set({
          mapState: {
            ...get().mapState,
            scale,
          },
        });
      },

      /**
       * Sets whether the map is loaded.
       *
       * @param mapLoaded - Flag indicating if the map is loaded.
       */
      setMapLoaded: (mapLoaded: boolean): void => {
        set({
          mapState: {
            ...get().mapState,
            mapLoaded,
          },
        });
      },

      /**
       * Sets whether the map is displayed.
       */
      setMapDisplayed: (): void => {
        set({
          mapState: {
            ...get().mapState,
            mapDisplayed: true,
          },
        });
      },

      /**
       * Sets the attribution of the map.
       *
       * @param attribution - The attribution information.
       */
      setAttribution: (attribution: string[]): void => {
        set({
          mapState: {
            ...get().mapState,
            attribution,
          },
        });
      },

      /**
       * Sets the current basemap options.
       *
       * @param basemapOptions - The new basemap options.
       */
      setCurrentBasemapOptions: (basemapOptions: TypeBasemapOptions): void => {
        set({
          mapState: {
            ...get().mapState,
            currentBasemapOptions: basemapOptions,
          },
        });
      },

      /**
       * Sets the initial filters of the map layers.
       *
       * @param filters - The filters.
       */
      setInitialFilters: (filters: Record<string, string>): void => {
        set({
          mapState: {
            ...get().mapState,
            initialFilters: filters,
          },
        });
      },

      /**
       * Sets the initial view of the map.
       *
       * @param view - The view extent or zoom&center.
       */
      setInitialView: (view: TypeZoomAndCenter | Extent): void => {
        const viewType = get().mapState.initialView;

        if (view.length === 2) viewType.zoomAndCenter = view as TypeZoomAndCenter;
        else viewType.extent = view as Extent;

        set({
          mapState: {
            ...get().mapState,
            initialView: viewType,
          },
        });
      },

      /**
       * Sets the geolocator search area with coordinates and optional bounding box.
       *
       * @param area - The search area object containing coordinates and optional bounding box, or undefined to clear.
       * @param area.searchItem - The search item description.
       * @param area.coords - The coordinates of the search location.
       * @param [area.bbox] - Optional bounding box extent for the search area.
       */
      setGeolocatorSearchArea: (area: { searchItem: string; coords: Coordinate; bbox?: Extent } | undefined): void => {
        set({
          mapState: {
            ...get().mapState,
            geolocatorSearchArea: area,
          },
        });
      },

      /**
       * Sets the view of the home button.
       *
       * @param view - The view to use.
       */
      setHomeView: (view: TypeMapViewSettings): void => {
        set({
          mapState: {
            ...get().mapState,
            homeView: view,
          },
        });
      },

      /**
       * Sets the interaction of the map.
       *
       * @param interaction - The interaction type.
       */
      setInteraction: (interaction: TypeInteraction): void => {
        set({
          mapState: {
            ...get().mapState,
            interaction,
          },
        });
      },

      /**
       * Sets to true if mouse is inside map.
       *
       * @param isMouseInsideMap - True if mouse is inside map.
       */
      setIsMouseInsideMap: (isMouseInsideMap: boolean): void => {
        set({
          mapState: {
            ...get().mapState,
            isMouseInsideMap,
          },
        });
      },

      /**
       * Sets the zoom level of the map.
       *
       * @param zoom - The zoom level.
       */
      setZoom: (zoom: number): void => {
        set({
          mapState: {
            ...get().mapState,
            zoom,
          },
        });
      },

      /**
       * Sets the rotation of the map.
       *
       * @param rotation - The rotation angle.
       */
      setRotation: (rotation: number): void => {
        set({
          mapState: {
            ...get().mapState,
            rotation,
          },
        });
      },

      /**
       * Sets the overlay click marker of the map.
       *
       * @param overlayClickMarker - The overlay click marker.
       */
      setOverlayClickMarker: (overlayClickMarker: Overlay): void => {
        set({
          mapState: {
            ...get().mapState,
            overlayClickMarker,
          },
        });
      },

      /**
       * Sets the overlay north marker of the map.
       *
       * @param overlayNorthMarker - The overlay north marker.
       */
      setOverlayNorthMarker: (overlayNorthMarker: Overlay): void => {
        set({
          mapState: {
            ...get().mapState,
            overlayNorthMarker,
          },
        });
      },

      /**
       * Sets the projection of the map.
       *
       * @param projectionCode - The projection code.
       */
      setProjection: (projectionCode: TypeValidMapProjectionCodes): void => {
        set({
          mapState: {
            ...get().mapState,
            currentProjection: projectionCode,
          },
        });
      },

      /**
       * Sets the point markers.
       *
       * @param pointMarkers - The new point markers.
       */
      setPointMarkers: (pointMarkers: Record<string, TypePointMarker[]>): void => {
        set({
          mapState: {
            ...get().mapState,
            pointMarkers,
          },
        });
      },

      /**
       * Sets map move end properties.
       *
       * @param centerCoordinates - The center coordinates of the map.
       * @param pointerPosition - The pointer position information.
       * @param degreeRotation - The degree rotation.
       * @param isNorthVisible - Flag indicating if north is visible.
       * @param scale - The scale information.
       */
      setMapMoveEnd: (
        centerCoordinates: Coordinate,
        pointerPosition: TypeMapMouseInfo,
        degreeRotation: string,
        isNorthVisible: boolean,
        mapExtent: Extent,
        scale: TypeScaleInfo
      ): void => {
        set({
          mapState: {
            ...get().mapState,
            centerCoordinates,
            northArrowElement: {
              degreeRotation,
              isNorthVisible,
            },
            mapExtent,
            scale,
          },
        });

        // On map center coord change, hide click marker
        get().mapState.actions.setClickMarker(undefined);

        // If crosshair is active and user uses keyboard, update pointer position
        // This will enable mouse position and hover tooltip
        if (get().appState.isCrosshairsActive) {
          get().mapState.actions.setPointerPosition(pointerPosition);
        }
      },

      /**
       * Sets the pointer position of the map.
       *
       * @param pointerPosition - The pointer position.
       */
      setPointerPosition: (pointerPosition: TypeMapMouseInfo): void => {
        set({
          mapState: {
            ...get().mapState,
            pointerPosition,
          },
        });
      },

      /**
       * Sets the click coordinates of the map.
       *
       * @param clickCoordinates - The click coordinates.
       */
      setClickCoordinates: (clickCoordinates: TypeMapMouseInfo): void => {
        set({
          mapState: {
            ...get().mapState,
            clickCoordinates,
          },
        });
      },

      /**
       * Sets whether the map is fixed to north.
       *
       * @param fixNorth - Flag indicating if the map should be fixed to north.
       */
      setFixNorth: (fixNorth: boolean): void => {
        set({
          mapState: {
            ...get().mapState,
            fixNorth,
          },
        });
      },

      /**
       * Sets the highlighted features of the map.
       *
       * @param highlightedFeatures - The highlighted features.
       */
      setHighlightedFeatures: (highlightedFeatures: TypeFeatureInfoEntry[]): void => {
        set({
          mapState: {
            ...get().mapState,
            highlightedFeatures,
          },
        });
      },

      /**
       * Sets the visible layers of the map.
       *
       * @param visibleLayers - The visible layers.
       */
      setVisibleLayers: (visibleLayers: string[]): void => {
        set({
          mapState: {
            ...get().mapState,
            visibleLayers,
          },
        });
      },

      /**
       * Sets the layers of the map that are in visible range.
       *
       * @param visibleRangeLayers - The layers in their visible range
       */
      setVisibleRangeLayers: (visibleRangeLayers: string[]): void => {
        set({
          mapState: {
            ...get().mapState,
            visibleRangeLayers,
          },
        });
      },

      /**
       * Sets the ordered layer information of the map.
       *
       * @param orderedLayerInfo - The ordered layer information.
       */
      setOrderedLayerInfo: (orderedLayerInfo: TypeOrderedLayerInfo[]): void => {
        set({
          mapState: {
            ...get().mapState,
            orderedLayerInfo,
          },
        });

        // Get all layers as specified in the order layer info we're updating
        const orderedLayers = orderedLayerInfo.map((layer) => layer.layerPath);

        // Check if the order of the layers has changed
        if (JSON.stringify(orderedLayers) !== JSON.stringify(get().mapState.orderedLayers)) {
          // Set the readonly representation of ordered layers array according to the order the layers are
          get().mapState.actions.setOrderedLayers(orderedLayers);
        }

        // Get all visible layers as specified in the order layer info we're updating
        const visibleLayers = orderedLayerInfo.filter((layer) => layer.visible).map((layer) => layer.layerPath);

        // Check if the order of the layers has changed
        if (JSON.stringify(visibleLayers) !== JSON.stringify(get().mapState.visibleLayers)) {
          // Set the readonly representation of visibile layers array according to the visibile layers
          get().mapState.actions.setVisibleLayers(visibleLayers);
        }

        // Get all layers in visible range as specified in the order layer info we're updating
        const inVisibleRange = orderedLayerInfo.filter((layer) => layer.inVisibleRange).map((layer) => layer.layerPath);

        // Check if the order of the layers has changed
        if (JSON.stringify(inVisibleRange) !== JSON.stringify(get().mapState.visibleRangeLayers)) {
          // Set the readonly representation of visibile range layers array according to the visibile range layers
          get().mapState.actions.setVisibleRangeLayers(inVisibleRange);
        }
      },

      /**
       * Sets the visible layers of the map.
       *
       * @param orderedLayers - The ordered layers.
       */
      setOrderedLayers: (orderedLayers: string[]): void => {
        set({
          mapState: {
            ...get().mapState,
            orderedLayers,
          },
        });
      },

      /**
       * Sets whether a layer is hoverable.
       *
       * @param layerPath - The path of the layer.
       * @param hoverable - Flag indicating if the layer should be hoverable.
       */
      setHoverable: (layerPath: string, hoverable: boolean): void => {
        get().mapState.actions.updateOrderedLayerInfoByPath(layerPath, { hoverable });
      },

      /**
       * Sets whether a layer legend is collapsed.
       *
       * @param layerPath - The path of the layer.
       * @param collapsed - Flag indicating if the layer should be collapsed.
       */
      setLegendCollapsed: (layerPath: string, collapsed: boolean): void => {
        get().mapState.actions.updateOrderedLayerInfoByPath(layerPath, { legendCollapsed: collapsed });
      },

      /**
       * Sets whether a layer is queryable.
       *
       * @param layerPath - The path of the layer.
       * @param queryable - Flag indicating if the layer should be queryable.
       */
      setQueryable: (layerPath: string, queryable: boolean): void => {
        const updates: Partial<TypeOrderedLayerInfo> = { queryableState: queryable };
        if (queryable) updates.hoverable = true;
        get().mapState.actions.updateOrderedLayerInfoByPath(layerPath, updates);
      },

      /**
       * Immutably updates a single entry in orderedLayerInfo and recalculates derived state.
       *
       * @param layerPath - The layer path to update.
       * @param updates - Partial properties to merge into the matching entry.
       */
      updateOrderedLayerInfoByPath: (layerPath: string, updates: Partial<TypeOrderedLayerInfo>): void => {
        const newOrderedLayerInfo = utilUpdateOrderedLayerInfoByPath(get().mapState.orderedLayerInfo, layerPath, updates);
        if (newOrderedLayerInfo !== get().mapState.orderedLayerInfo) {
          get().mapState.actions.setOrderedLayerInfo(newOrderedLayerInfo);
        }
      },

      /**
       * Sets the click marker of the map.
       *
       * @param coord - The click marker coordinates.
       */
      setClickMarker: (coord: number[] | undefined): void => {
        set({
          mapState: { ...get().mapState, clickMarker: coord ? { lonlat: coord } : undefined },
        });
      },

      /**
       * Sets the hover feature information to be displayed in the hover tooltip.
       *
       * @param hoverFeatureInfo - The hover feature information.
       */
      setHoverFeatureInfo(hoverFeatureInfo: TypeHoverFeatureInfo) {
        set({
          mapState: {
            ...get().mapState,
            hoverFeatureInfo,
          },
        });
      },
    },
  } as IMapState;

  return init;
}

// #endregion STATE INITIALIZATION

// #region STATE GETTERS & HOOKS
// GV Getters should be used to get the values at a moment in time.
// GV Hooks should be used to attach to values and trigger UI components when they change.
// GV Typically they are listed in couples (getter + hook) for the same value.

/**
 * Returns the full layer state slice for the given map.
 *
 * Internal-only selector - not exported to avoid direct store access from outside this module.
 *
 * @param mapId - The map identifier.
 * @returns The ILayerState for the given map.
 */
// GV No export for the main state!
const getStoreMapState = (mapId: string): IMapState => getGeoViewStore(mapId).getState().mapState;

/**
 * Returns the map state as a serializable JSON object.
 *
 * @param mapId - The map identifier
 * @returns The map state as a plain object
 */
export const getStoreMapStateJson = (mapId: string): TypeMapState => {
  const mapState = getStoreMapState(mapId);
  return {
    currentProjection: mapState.currentProjection,
    currentZoom: mapState.zoom,
    mapCenterCoordinates: mapState.centerCoordinates,
    mapExtent: mapState.mapExtent!,
    rotation: mapState.rotation,
    pointerPosition: mapState.pointerPosition || {
      pixel: [],
      lonlat: [],
      projected: [],
      dragging: false,
    },
    singleClickedPosition: mapState.clickCoordinates || {
      pixel: [],
      lonlat: [],
      projected: [],
      dragging: false,
    },
  };
};

/**
 * Returns the map state properties needed for the export layout.
 *
 * @param mapId - The map identifier
 * @returns The map state subset for export layout rendering
 */
export const getStoreMapStateForExportLayout = (mapId: string): TypeMapStateForExportLayout => {
  const mapState = getStoreMapState(mapId);
  return {
    attribution: mapState.attribution,
    northArrow: mapState.northArrow,
    northArrowElement: mapState.northArrowElement,
    mapScale: mapState.scale,
    mapRotation: mapState.rotation,
    currentProjection: mapState.currentProjection,
  };
};

/** Returns the ordered layer info array for the given map. */
export const getStoreMapOrderedLayerInfo = (mapId: string): TypeOrderedLayerInfo[] => {
  return getStoreMapState(mapId).orderedLayerInfo;
};

/** Returns the ordered layer info for a specific layer path, or undefined if not found. */
export const getStoreMapOrderedLayerInfoByPath = (mapId: string, layerPath: string): TypeOrderedLayerInfo | undefined => {
  return utilFindMapLayerFromOrderedInfo(layerPath, getStoreMapOrderedLayerInfo(mapId));
};

/** Returns the legend collapsed state for all layers, defaulting to true if not found. */
export const getStoreMapLegendCollapsedSet = (mapId: string): Record<string, boolean> => {
  const collapsedSet: Record<string, boolean> = {};
  getStoreMapOrderedLayerInfo(mapId).forEach((layer) => {
    collapsedSet[layer.layerPath] = layer.legendCollapsed ?? true;
  });
  return collapsedSet;
};

/** Returns the legend collapsed state for a layer, defaulting to true if not found. */
export const getStoreMapLegendCollapsedByPath = (mapId: string, layerPath: string): boolean => {
  return getStoreMapOrderedLayerInfoByPath(mapId, layerPath)?.legendCollapsed ?? true;
};

/**
 * Selects the legend collapsed state for a given layer.
 *
 * @param layerPath - The layer path to check
 * @returns True if the layer legend is collapsed
 */
export const useStoreMapLegendCollapsedByPath = (layerPath: string): boolean => {
  // Hook
  return useStore(
    useGeoViewStore(),
    (state) => utilFindMapLayerFromOrderedInfo(layerPath, state.mapState.orderedLayerInfo)?.legendCollapsed || false
  );
};

/**
 * Selects whether all collapsible layer legends are collapsed.
 *
 * @returns True if all collapsible legends are collapsed, or if there are no collapsible layers
 */
export const useStoreMapAllLayersCollapsedToggle = (): boolean =>
  useStore(useGeoViewStore(), (state) => {
    // Get the legend collapsible layers
    const collapsibleLayers = utilGetLegendCollapsibleLayers(state.mapId, state.mapState.orderedLayerInfo);

    // If there are no collapsible layers, return true
    if (collapsibleLayers.length === 0) return true;
    return collapsibleLayers.every((layer) => layer.legendCollapsed);
  });

/**
 * Selects whether there are any layers with collapsible legends.
 *
 * @returns True if at least one layer has a collapsible legend
 */
export const useStoreMapHasCollapsibleLayersToggle = (): boolean =>
  useStore(useGeoViewStore(), (state) => utilGetLegendCollapsibleLayers(state.mapId, state.mapState.orderedLayerInfo).length > 0);

/** Returns the visibility state of a layer, or undefined if the layer is not found. */
export const getStoreMapVisibilityByPath = (mapId: string, layerPath: string): boolean | undefined => {
  return getStoreMapOrderedLayerInfoByPath(mapId, layerPath)?.visible;
};

/** Returns whether any parent of the given layer is hidden. */
export const getStoreMapLayerParentHidden = (mapId: string, layerPath: string): boolean => {
  const orderedLayerInfo = getStoreMapOrderedLayerInfo(mapId);
  return utilGetParentLayerHiddenOnMap(layerPath, orderedLayerInfo);
};

/** Returns whether the layer is within its visible zoom range, defaulting to true. */
export const getStoreMapInVisibleRangeByPath = (mapId: string, layerPath: string): boolean => {
  return getStoreMapOrderedLayerInfoByPath(mapId, layerPath)?.inVisibleRange ?? true;
};

/** Returns all layer paths from the ordered layer info. */
export const getStoreMapLayerPaths = (mapId: string): string[] => {
  return getStoreMapOrderedLayerInfo(mapId).map((orderedLayerInfo) => {
    return orderedLayerInfo.layerPath;
  });
};

/**
 * Returns the index of a layer in the ordered layer info array by its path.
 *
 * @param mapId - The map identifier
 * @param layerPath - The layer path to search for
 * @returns The zero-based index of the layer, or -1 if not found
 * @deprecated This function seems fragile, do not use
 */
export const getStoreMapOrderedLayerIndexByPath = (mapId: string, layerPath: string): number => {
  const info = getStoreMapOrderedLayerInfo(mapId);
  for (let i = 0; i < info.length; i++) if (info[i].layerPath === layerPath) return i;
  return -1;
};

/** Returns the initial filter string for a layer path, or undefined if none is set. */
export const getStoreMapInitialFilter = (mapId: string, layerPath: string): string | undefined => {
  return getStoreMapState(mapId).initialFilters[layerPath];
};

/** Selects the initial layer filters from the store. */
export const useStoreMapInitialFilters = (): Record<string, string> =>
  useStore(useGeoViewStore(), (state) => state.mapState.initialFilters);

/** Returns the layer paths of all layers currently in their visible zoom range. */
export const getStoreMapLayersInVisibleRange = (mapId: string): string[] => {
  const { orderedLayerInfo } = getStoreMapState(mapId);
  const layersInVisibleRange = orderedLayerInfo.filter((layer) => layer.inVisibleRange).map((layer) => layer.layerPath);
  return layersInVisibleRange;
};

/**
 * Selects the visibility state of a single layer.
 *
 * @param layerPath - The layer path to check visibility for
 * @returns True if the layer is visible, false otherwise
 */
export const useStoreMapLayerVisibility = (layerPath: string): boolean => {
  // Hook
  return useStore(
    useGeoViewStore(),
    (state) => utilFindMapLayerFromOrderedInfo(layerPath, state.mapState.orderedLayerInfo)?.visible || false
  );
};

/**
 * Selects whether any of the given layer paths are visible.
 *
 * @param layerPaths - The layer paths to check visibility for
 * @returns True if at least one layer is visible, false otherwise
 */
export const useStoreMapLayerArrayVisibility = (layerPaths: string[]): boolean => {
  return useStore(useGeoViewStore(), (state) => {
    // Return true if all layers are visible (or don't exist yet)
    return layerPaths.some((layerPath) => {
      return utilFindMapLayerFromOrderedInfo(layerPath, state.mapState.orderedLayerInfo)?.visible || false;
    });
  });
};

/**
 * Selects whether a layer is within its visible zoom range.
 *
 * @param layerPath - The layer path to check
 * @returns True if the layer is in visible range
 */
export const useStoreMapLayerInVisibleRange = (layerPath: string): boolean => {
  // Hook
  return useStore(
    useGeoViewStore(),
    (state) => utilFindMapLayerFromOrderedInfo(layerPath, state.mapState.orderedLayerInfo)?.inVisibleRange || false
  );
};

/**
 * Selects whether all layers are visible (excluding errored layers).
 *
 * @returns True if all non-errored layers are visible
 */
export const useStoreMapAllLayersVisibleToggle = (): boolean =>
  // TODO: CHECK - Cross-stores, here we jump into the layer store :/
  useStore(useGeoViewStore(), (state) =>
    state.mapState.orderedLayerInfo.every((layer) => layer.visible || getStoreLayerStatus(state.mapId, layer.layerPath) === 'error')
  );

/** Returns whether a layer is effectively hidden on the map (parent hidden, out of range, or not visible). */
export const getStoreMapIsLayerHiddenOnMap = (mapId: string, layerPath: string): boolean => {
  const { orderedLayerInfo } = getStoreMapState(mapId);
  return utilGetLayerHiddenOnMap(layerPath, orderedLayerInfo);
};

/**
 * Selects whether a layer is effectively hidden on the map.
 *
 * A layer is hidden if any parent is hidden, or if it is out of visible range, or if it is not visible.
 *
 * @param layerPath - The layer path to check
 * @returns True if the layer is hidden on the map
 */
export const useStoreMapIsLayerHiddenOnMap = (layerPath: string): boolean => {
  return useStore(useGeoViewStore(), (state) => utilGetLayerHiddenOnMap(layerPath, state.mapState.orderedLayerInfo));
};

/**
 * Selects the hidden-on-map state for all layers.
 *
 * @returns A record mapping each layer path to whether it is hidden on the map
 */
export const useStoreMapIsLayerHiddenOnMapSet = (): Record<string, boolean> => {
  return useStableSelector(useGeoViewStore(), (state) => {
    return state.mapState.orderedLayerInfo.reduce<Record<string, boolean>>((acc, layer) => {
      if (layer.layerPath) {
        // eslint-disable-next-line no-param-reassign
        acc[layer.layerPath] = utilGetLayerHiddenOnMap(layer.layerPath, state.mapState.orderedLayerInfo);
      }
      return acc;
    }, {});
  });
};

/**
 * Selects whether any parent of the given layer is hidden.
 *
 * @param layerPath - The layer path to check parent visibility for
 * @returns True if any parent layer is hidden
 */
export const useStoreMapIsParentLayerHiddenOnMap = (layerPath: string): boolean => {
  return useStore(useGeoViewStore(), (state) => utilGetParentLayerHiddenOnMap(layerPath, state.mapState.orderedLayerInfo));
};

/**
 * Selects the parent-hidden state for all layers.
 *
 * @returns A record mapping each layer path to whether any of its parents are hidden
 */
export const useStoreMapIsParentLayerHiddenOnMapSet = (): Record<string, boolean> => {
  return useStableSelector(useGeoViewStore(), (state) => {
    return state.mapState.orderedLayerInfo.reduce<Record<string, boolean>>((acc, layer) => {
      if (layer.layerPath) {
        // eslint-disable-next-line no-param-reassign
        acc[layer.layerPath] = utilGetParentLayerHiddenOnMap(layer.layerPath, state.mapState.orderedLayerInfo);
      }
      return acc;
    }, {});
  });
};

/** Returns the current map projection code. */
export const getStoreMapCurrentProjection = (mapId: string): TypeValidMapProjectionCodes => getStoreMapState(mapId).currentProjection;

/** Selects the current map projection code from the store. */
export const useStoreMapCurrentProjection = (): TypeValidMapProjectionCodes =>
  useStore(useGeoViewStore(), (state) => state.mapState.currentProjection);

/** Returns the current map projection as an EPSG string. */
export const getStoreMapCurrentProjectionEPSG = (mapId: string): string => `EPSG:${getStoreMapState(mapId).currentProjection}`;

/** Selects the current map projection as an EPSG string from the store. */
export const useStoreMapCurrentProjectionEPSG = (): string =>
  useStore(useGeoViewStore(), (state) => `EPSG:${state.mapState.currentProjection}`);

/** Returns the current pointer position, or undefined if unavailable. */
export const getStoreMapPointerPosition = (mapId: string): TypeMapMouseInfo | undefined => getStoreMapState(mapId).pointerPosition;

/** Selects the current pointer position from the store. */
export const useStoreMapPointerPosition = (): TypeMapMouseInfo | undefined =>
  useStore(useGeoViewStore(), (state) => state.mapState.pointerPosition);

/** Returns the current pointer position, or undefined if unavailable. */
export const getStoreMapClickCoordinates = (mapId: string): TypeMapMouseInfo | undefined => getStoreMapState(mapId).clickCoordinates;

/** Selects the click coordinates from the store. */
export const useStoreMapClickCoordinates = (): TypeMapMouseInfo | undefined =>
  useStore(useGeoViewStore(), (state) => state.mapState.clickCoordinates);

/** Returns the current basemap options. */
export const getStoreMapCurrentBasemapOptions = (mapId: string): TypeBasemapOptions => {
  return getStoreMapState(mapId).currentBasemapOptions;
};

/** Selects the current basemap options from the store. */
export const useStoreMapCurrentBasemapOptions = (): TypeBasemapOptions =>
  useStore(useGeoViewStore(), (state) => state.mapState.currentBasemapOptions);

/** Returns the basemap options, falling back to initial options if current are not set. */
export const getStoreMapBasemapOptions = (mapId: string): TypeBasemapOptions => {
  // TODO: CHECK - This getter actually uses both state values, revise its name?
  return getStoreMapCurrentBasemapOptions(mapId) || getStoreMapState(mapId).basemapOptions;
};

/** Selects the initial basemap options from the store. */
export const useStoreMapBasemapOptions = (): TypeBasemapOptions => useStore(useGeoViewStore(), (state) => state.mapState.basemapOptions);

/** Returns the home view settings for the map. */
export const getStoreMapHomeView = (mapId: string): TypeMapViewSettings => {
  return getStoreMapState(mapId).homeView!;
};

/** Returns the initial view settings for the map, or undefined if not set. */
export const getStoreMapInitialView = (mapId: string): TypeMapViewSettings | undefined => {
  return getStoreMapState(mapId).initialView;
};

/** Selects the initial view settings from the store. */
export const useStoreMapInitialView = (): TypeMapViewSettings => useStore(useGeoViewStore(), (state) => state.mapState.initialView);

/** Returns the current map rotation angle in radians. */
export const getStoreMapRotation = (mapId: string): number => {
  return getStoreMapState(mapId).rotation;
};

/** Selects the map rotation angle from the store. */
export const useStoreMapRotation = (): number => useStore(useGeoViewStore(), (state) => state.mapState.rotation);

/** Returns the geolocator search area with coordinates and optional bounding box. */
export const getStoreMapGeolocatorSearchArea = (mapId: string): { coords: Coordinate; bbox?: Extent } | undefined => {
  return getStoreMapState(mapId).geolocatorSearchArea;
};

/** Returns the feature highlight color settings. */
export const getStoreMapFeatureHighlightColor = (mapId: string): TypeHighlightColors => {
  return getStoreMapState(mapId).featureHighlightColor;
};

/** Selects the feature highlight color settings from the store. */
export const useStoreMapFeatureHighlightColor = (): TypeHighlightColors =>
  useStore(useGeoViewStore(), (state) => state.mapState.featureHighlightColor);

/** Returns the hover feature info state. */
export const getStoreMapHoverFeatureInfo = (mapId: string): TypeHoverFeatureInfo => {
  return getStoreMapState(mapId).hoverFeatureInfo;
};

/** Selects the hover feature info from the store. */
export const useStoreMapHoverFeatureInfo = (): TypeHoverFeatureInfo =>
  useStore(useGeoViewStore(), (state) => state.mapState.hoverFeatureInfo);

/** Returns the point markers grouped by name. */
export const getStoreMapPointMarkers = (mapId: string): Record<string, TypePointMarker[]> => {
  return getStoreMapState(mapId).pointMarkers;
};

/** Selects the point markers grouped by name from the store. */
export const useStoreMapPointMarkers = (): Record<string, TypePointMarker[]> =>
  useStore(useGeoViewStore(), (state) => state.mapState.pointMarkers);

/** Returns the current map interaction mode. */
export const getStoreMapInteraction = (mapId: string): TypeInteraction => {
  return getStoreMapState(mapId).interaction;
};

/** Selects the map interaction mode from the store. */
export const useStoreMapInteraction = (): TypeInteraction => useStore(useGeoViewStore(), (state) => state.mapState.interaction);

/** Returns the array of currently highlighted features. */
export const getStoreMapHighlightedFeatures = (mapId: string): TypeFeatureInfoEntry[] => {
  return getStoreMapState(mapId).highlightedFeatures;
};

/** Returns highlighted features matching the given feature UID. */
export const getStoreMapHighlightedFeaturesByUid = (mapId: string, featureUid: string | undefined): TypeFeatureInfoEntry[] => {
  return getStoreMapState(mapId).highlightedFeatures.filter((feature) => feature.uid === featureUid);
};

/** Returns the ordered layer info entries that have collapsible legends. */
export const getStoreMapLegendCollapsibleLayers = (mapId: string): TypeOrderedLayerInfo[] => {
  return utilGetLegendCollapsibleLayers(mapId, getStoreMapOrderedLayerInfo(mapId));
};

// #endregion STATE GETTERS & HOOKS

// #region STATE GETTERS & HOOKS - OTHERS (no match between getter-hook)

/** Selects the map attribution strings from the store. */
export const useStoreMapAttribution = (): string[] => useStore(useGeoViewStore(), (state) => state.mapState.attribution);

/** Selects the map center coordinates from the store. */
export const useStoreMapCenterCoordinates = (): Coordinate => useStore(useGeoViewStore(), (state) => state.mapState.centerCoordinates);

/** Selects the click marker state from the store. */
export const useStoreMapClickMarker = (): TypeClickMarker | undefined => useStore(useGeoViewStore(), (state) => state.mapState.clickMarker);

/** Selects the current map extent from the store. */
export const useStoreMapExtent = (): Extent | undefined => useStore(useGeoViewStore(), (state) => state.mapState.mapExtent);

/** Selects whether the map has a geoview basemap layer from the store. */
export const useStoreMapHasGeoviewBasemapLayer = (): boolean =>
  useStore(useGeoViewStore(), (state) => state.mapState.hasGeoviewBasemapLayer);

/** Selects whether the map is fixed to north from the store. */
export const useStoreMapFixNorth = (): boolean => useStore(useGeoViewStore(), (state) => state.mapState.fixNorth);

/** Selects whether the mouse is inside the map from the store. */
export const useStoreMapIsMouseInsideMap = (): boolean => useStore(useGeoViewStore(), (state) => state.mapState.isMouseInsideMap);

/** Selects whether the map is loaded from the store. */
export const useStoreMapLoaded = (): boolean => useStore(useGeoViewStore(), (state) => state.mapState.mapLoaded);

/** Selects whether the map is displayed from the store. */
export const useStoreMapDisplayed = (): boolean => useStore(useGeoViewStore(), (state) => state.mapState.mapDisplayed);

/** Selects whether the north arrow is enabled from the store. */
export const useStoreMapNorthArrow = (): boolean => useStore(useGeoViewStore(), (state) => state.mapState.northArrow);

/** Selects the north arrow element state from the store. */
export const useStoreMapNorthArrowElement = (): TypeNorthArrow => useStore(useGeoViewStore(), (state) => state.mapState.northArrowElement);

/** Selects the zoom level at which the overview map hides from the store. */
export const useStoreMapOverviewMapHideZoom = (): number => useStore(useGeoViewStore(), (state) => state.mapState.overviewMapHideZoom);

/** Selects the map scale information from the store. */
export const useStoreMapScale = (): TypeScaleInfo => useStore(useGeoViewStore(), (state) => state.mapState.scale);

/** Selects the map size from the store. */
export const useStoreMapSize = (): Size => useStore(useGeoViewStore(), (state) => state.mapState.size);

/** Selects the ordered layer paths from the store. */
export const useStoreMapOrderedLayers = (): string[] => useStore(useGeoViewStore(), (state) => state.mapState.orderedLayers);

/** Selects the visible layer paths from the store. */
export const useStoreMapVisibleLayers = (): string[] => useStore(useGeoViewStore(), (state) => state.mapState.visibleLayers);

/**
 * Selects the union of visible and in-range layer paths.
 *
 * Used by data-table, details, geochart, and time-slider left panel components.
 *
 * @returns The deduplicated array of layer paths that are visible or in visible range
 */
export const useStoreMapAllVisibleandInRangeLayers = (): string[] => {
  const visibleLayers = useStore(useGeoViewStore(), (state) => state.mapState.visibleLayers);
  const visibleRangeLayers = useStore(useGeoViewStore(), (state) => state.mapState.visibleRangeLayers);
  return useMemo(() => {
    return [...new Set([...visibleLayers, ...visibleRangeLayers])];
  }, [visibleLayers, visibleRangeLayers]);
};

/** Selects the current zoom level from the store. */
export const useStoreMapZoom = (): number => useStore(useGeoViewStore(), (state) => state.mapState.zoom);

/**
 * Selects the queryable state for multiple layer paths.
 *
 * @param layerPaths - The layer paths to check queryable state for
 * @returns A record mapping each layer path to its queryable state
 */
export const useStoreMapLayerQueryable = (layerPaths: string[]): Record<string, boolean> => {
  // Hook
  return useStableSelector(useGeoViewStore(), (state) => {
    const result: Record<string, boolean> = {};

    for (const layerPath of layerPaths) {
      result[layerPath] = utilFindMapLayerFromOrderedInfo(layerPath, state.mapState.orderedLayerInfo)?.queryableState || false;
    }

    return result;
  });
};

// #endregion STATE GETTERS & HOOKS - OTHERS (no match between getter-hook)

// #region STATE SELECTORS MAPCONFIG

/**
 * Returns the map config state for the given map.
 *
 * Internal-only selector - not exported to avoid direct store access from outside this module.
 *
 * @param mapId - The map identifier.
 * @returns The ILayerState for the given map.
 * @throws {Error} When the map config state is uninitialized.
 */
// GV No export for the main state, here we had to for the api reload function
export const getStoreMapConfigState = (mapId: string): TypeMapFeaturesConfig => {
  const state = getGeoViewStore(mapId).getState().mapConfig;
  if (!state) throw new Error(`Map config for map id ${mapId} couldn't be read from store`);
  return state;
};

/**
 * Checks whether the map config state has been initialized for the given map.
 *
 * @param mapId - The map identifier.
 * @returns True if the map config state is initialized, false otherwise.
 */
export const isStoreMapConfigInitialized = (mapId: string): boolean => {
  try {
    // Get its state, this will throw PluginStateUninitializedError if uninitialized
    getStoreMapConfigState(mapId);
    return true;
  } catch {
    // Uninitialized
    return false;
  }
};

/** Returns the nav bar configuration from the map config. */
export const getStoreMapConfigNavBar = (mapId: string): TypeValidNavBarProps[] | undefined => getStoreMapConfigState(mapId).navBar;

/** Returns the footer bar configuration from the map config. */
export const getStoreMapConfigFooterBar = (mapId: string): TypeFooterBarProps | undefined => getStoreMapConfigState(mapId).footerBar;

/** Returns the app bar configuration from the map config. */
export const getStoreMapConfigAppBar = (mapId: string): TypeAppBarProps | undefined => getStoreMapConfigState(mapId).appBar;

/** Returns the overview map configuration from the map config. */
export const getStoreMapConfigOverviewMap = (mapId: string): TypeOverviewMapProps | undefined => getStoreMapConfigState(mapId).overviewMap;

/** Selects whether the overview map is enabled from the store. */
export const useStoreMapOverviewMap = (): boolean => useStore(useGeoViewStore(), (state) => state.mapState.overviewMap);

/** Returns the enabled map components from the map config. */
export const getStoreMapConfigComponents = (mapId: string): TypeValidMapComponentProps[] | undefined =>
  getStoreMapConfigState(mapId).components;

/** Returns the enabled core packages from the map config. */
export const getStoreMapConfigCorePackages = (mapId: string): TypeValidMapCorePackageProps[] | undefined =>
  getStoreMapConfigState(mapId).corePackages;

/** Returns the core packages configuration from the map config. */
export const getStoreMapConfigCorePackagesConfig = (mapId: string): TypeCorePackagesConfig | undefined =>
  getStoreMapConfigState(mapId).corePackagesConfig;

/** Returns the external packages configuration from the map config. */
export const getStoreMapConfigExternalPackages = (mapId: string): TypeExternalPackagesProps[] | undefined =>
  getStoreMapConfigState(mapId).externalPackages;

/** Returns the global settings from the map config. */
export const getStoreMapConfigGlobalSettings = (mapId: string): TypeGlobalSettings | undefined =>
  getStoreMapConfigState(mapId).globalSettings;

/** Returns the service URLs from the map config. */
export const getStoreMapConfigServiceUrls = (mapId: string): TypeServiceUrls => getStoreMapConfigState(mapId).serviceUrls;

/** Returns the schema version used in the map config. */
export const getStoreMapConfigSchemaVersionUsed = (mapId: string): TypeValidVersions | undefined =>
  getStoreMapConfigState(mapId).schemaVersionUsed;

/** Returns the view settings from the map config. */
export const getStoreMapConfigViewSettings = (mapId: string): TypeViewSettings => getStoreMapConfigState(mapId).map.viewSettings;

/**
 * Returns the current projection code from the map config state for the given map.
 *
 * @param mapId - The map identifier.
 * @returns The current projection code.
 * @throws {Error} When the map config state is uninitialized.
 */
export const getStoreMapConfigViewSettingsProjection = (mapId: string): TypeValidMapProjectionCodes =>
  getStoreMapConfigViewSettings(mapId).projection;

/** Returns the highlight color setting from the map config. */
export const getStoreMapConfigHighlightColor = (mapId: string): TypeHighlightColors | undefined =>
  getStoreMapConfigState(mapId).map.highlightColor;

/** Returns the list of geoview layer configurations from the map config. */
export const getStoreMapConfigListOfGeoviewLayerConfig = (mapId: string): MapConfigLayerEntry[] =>
  getStoreMapConfigState(mapId).map.listOfGeoviewLayerConfig;

// #endregion STATE SELECTORS MAPCONFIG

// #region STATE ADAPTORS
// GV These methods should be called from a State Adaptor class listening on domain events triggered by controllers.

/** Sets the map loaded state in the store. */
export const setStoreMapLoaded = (mapId: string, mapLoaded: boolean): void => {
  getStoreMapState(mapId).actions.setMapLoaded(mapLoaded);
};

/** Sets the geolocator search area with coordinates and optional bounding box in the store. */
export const setStoreMapGeolocatorSearchArea = (mapId: string, searchItem: string, coords: Coordinate, bbox?: Extent): void => {
  getStoreMapState(mapId).actions.setGeolocatorSearchArea({ searchItem, coords, bbox });
};

/** Sets the home button view settings in the store. */
export const setStoreMapHomeButtonView = (mapId: string, view: TypeMapViewSettings): void => {
  getStoreMapState(mapId).actions.setHomeView(view);
};

/** Sets the current basemap options in the store. */
export const setStoreMapCurrentBasemapOptions = (mapId: string, basemapOptions: TypeBasemapOptions): void => {
  getStoreMapState(mapId).actions.setCurrentBasemapOptions(basemapOptions);
};

/** Sets the overlay north marker in the store. */
export const setStoreMapOverlayNorthMarker = (mapId: string, overlay: Overlay): void => {
  getStoreMapState(mapId).actions.setOverlayNorthMarker(overlay);
};

/** Sets the overlay click marker in the store. */
export const setStoreMapOverlayClickMarker = (mapId: string, overlay: Overlay): void => {
  getStoreMapState(mapId).actions.setOverlayClickMarker(overlay);
};

/** Sets the click marker position in the store. */
export const setStoreMapClickMarker = (mapId: string, projectedCoords: number[]): void => {
  getStoreMapState(mapId).actions.setClickMarker(projectedCoords);
};

/** Hides the click marker icon by clearing its position in the store. */
export const setStoreMapClickMarkerIconHide = (mapId: string): void => {
  getStoreMapState(mapId).actions.setClickMarker(undefined);
};

/** Sets the map projection code in the store. */
export const setStoreMapProjection = (mapId: string, projectionCode: TypeValidMapProjectionCodes): void => {
  getStoreMapState(mapId).actions.setProjection(projectionCode);
};

/** Sets the zoom level in the store. */
export const setStoreMapZoom = (mapId: string, zoom: number): void => {
  getStoreMapState(mapId).actions.setZoom(zoom);
};

/** Sets the click coordinates in the store. */
export const setStoreMapClickCoordinates = (mapId: string, clickCoordinates: TypeMapMouseInfo): void => {
  getStoreMapState(mapId).actions.setClickCoordinates(clickCoordinates);
};

/** Sets the point markers in the store. */
export const setStoreMapPointMarkers = (mapId: string, pointMarkers: Record<string, TypePointMarker[]>): void => {
  getStoreMapState(mapId).actions.setPointMarkers(pointMarkers);
};

/** Sets the map attribution strings in the store. */
export const setStoreMapAttribution = (mapId: string, attribution: string[]): void => {
  getStoreMapState(mapId).actions.setAttribution(attribution);
};

/** Marks the map as displayed in the store. */
export const setStoreMapDisplayed = (mapId: string): void => {
  getStoreMapState(mapId).actions.setMapDisplayed();
};

/** Sets the pointer position in the store. */
export const setStoreMapPointerPosition = (mapId: string, pointerPosition: TypeMapMouseInfo): void => {
  getStoreMapState(mapId).actions.setPointerPosition(pointerPosition);
};

/** Sets the hoverable state for a layer in the store. */
export const setStoreMapLayerHoverable = (mapId: string, layerPath: string, hoverable: boolean): void => {
  getStoreMapState(mapId).actions.setHoverable(layerPath, hoverable);
};

/** Sets the hover feature info in the store. */
export const setStoreMapHoverFeatureInfo = (mapId: string, hoverFeatureInfo: TypeHoverFeatureInfo): void => {
  getStoreMapState(mapId).actions.setHoverFeatureInfo(hoverFeatureInfo);
};

/**
 * Sets the visibility of a layer in the store ordered layer info.
 *
 * @param mapId - The ID of the map
 * @param layerPath - The layer path of the layer to change
 * @param visibility - The visibility to set
 */
export const setStoreMapLayerVisibility = (mapId: string, layerPath: string, visibility: boolean): void => {
  getStoreMapState(mapId).actions.updateOrderedLayerInfoByPath(layerPath, { visible: visibility });
};

/**
 * Sets the visibility range state for a specific layer in the store.
 *
 * @param mapId - The map identifier
 * @param layerPath - The unique layer path identifier
 * @param inVisibleRange - Whether the layer is within its visible zoom range
 */
export const setStoreLayerInVisibleRange = (mapId: string, layerPath: string, inVisibleRange: boolean): void => {
  getStoreMapState(mapId).actions.updateOrderedLayerInfoByPath(layerPath, { inVisibleRange });
};

/** Sets the map interaction mode in the store. */
export const setStoreMapInteraction = (mapId: string, interaction: TypeInteraction): void => {
  getStoreMapState(mapId).actions.setInteraction(interaction);
};

/** Sets whether the mouse is inside the map in the store. */
export const setStoreMapIsMouseInsideMap = (mapId: string, inside: boolean): void => {
  getStoreMapState(mapId).actions.setIsMouseInsideMap(inside);
};

/** Sets the map scale information in the store. */
export const setStoreMapScale = (mapId: string, scale: TypeScaleInfo): void => {
  getStoreMapState(mapId).actions.setMapScale(scale);
};

/** Sets the map size in the store. */
export const setStoreMapSize = (mapId: string, size: Size): void => {
  getStoreMapState(mapId).actions.setMapSize(size);
};

/** Sets the map rotation angle in the store. */
export const setStoreMapRotation = (mapId: string, rotation: number): void => {
  getStoreMapState(mapId).actions.setRotation(rotation);
};

/** Sets the queryable state for a layer in the store. */
export const setStoreMapLayerQueryable = (mapId: string, layerPath: string, queryable: boolean): void => {
  getStoreMapState(mapId).actions.setQueryable(layerPath, queryable);
};

/** Sets the highlighted features in the store. */
export const setStoreMapHighlightedFeatures = (mapId: string, highlightedFeatures: TypeFeatureInfoEntry[]): void => {
  getStoreMapState(mapId).actions.setHighlightedFeatures(highlightedFeatures);
};

/** Sets the legend collapsed state for a layer in the store. */
export const setStoreMapLegendCollapsed = (mapId: string, layerPath: string, collapsed: boolean): void => {
  getStoreMapState(mapId).actions.setLegendCollapsed(layerPath, collapsed);
};

/** Toggles the legend collapsed state for a layer in the store. */
export const setStoreMapToggleLegendCollapsed = (mapId: string, layerPath: string): void => {
  const legendCollapsedRightNow: boolean =
    utilFindMapLayerFromOrderedInfo(layerPath, getStoreMapOrderedLayerInfo(mapId))?.legendCollapsed || false;
  getStoreMapState(mapId).actions.setLegendCollapsed(layerPath, !legendCollapsedRightNow);
};

/** Adds an initial filter for a layer path in the store. */
export const addStoreMapInitialFilter = (mapId: string, layerPath: string, filter: string): void => {
  const curFilters = getStoreMapState(mapId).initialFilters;
  getStoreMapState(mapId).actions.setInitialFilters({ ...curFilters, [layerPath]: filter });
};

/** Updates the store with map move end properties including center, rotation, extent, and scale. */
export const setStoreMapMoveEnd = (
  mapId: string,
  centerCoordinates: Coordinate,
  pointerPosition: TypeMapMouseInfo,
  degreeRotation: string,
  isNorthVisible: boolean,
  mapExtent: Extent,
  scale: TypeScaleInfo
): void => {
  getStoreMapState(mapId).actions.setMapMoveEnd(centerCoordinates, pointerPosition, degreeRotation, isNorthVisible, mapExtent, scale);
};

/** Sets the legend collapsed state for all layers in the store. */
export const setStoreMapAllMapLayerCollapsed = (mapId: string, newCollapsed: boolean): void => {
  // Set the collapsed state for all layers
  const orderedLayerInfo = getStoreMapOrderedLayerInfo(mapId);
  orderedLayerInfo.forEach((layer) => {
    if (layer.legendCollapsed !== newCollapsed) {
      setStoreMapLegendCollapsed(mapId, layer.layerPath, newCollapsed);
    }
  });
};

/** Sets the fix north state in the store. */
export const setStoreMapFixNorth = (mapId: string, fixNorth: boolean): void => {
  getStoreMapState(mapId).actions.setFixNorth(fixNorth);
};

/** Sets the HTML element reference for the overlay click marker. */
export const setStoreMapOverlayClickMarkerRef = (mapId: string, htmlRef: HTMLElement): void => {
  const overlay = getStoreMapState(mapId).overlayClickMarker;
  if (overlay !== undefined) overlay.setElement(htmlRef);
};

/** Sets the HTML element reference for the overlay north marker. */
export const setStoreMapOverlayNorthMarkerRef = (mapId: string, htmlRef: HTMLElement): void => {
  const overlay = getStoreMapState(mapId).overlayNorthMarker;
  if (overlay !== undefined) overlay.setElement(htmlRef);
};

/**
 * Temporary method to set the ordered layers directly in the store.
 * This method should be used with caution and only in specific cases, as it bypasses the usual
 * state update patterns and may lead to unintended side effects if not used properly.
 *
 * @param mapId - The map identifier
 * @param orderedLayerInfo - The ordered layer info array to set
 */
export const setStoreMapOrderedLayerDirectly = (mapId: string, orderedLayerInfo: TypeOrderedLayerInfo[]): void => {
  getStoreMapState(mapId).actions.setOrderedLayerInfo(orderedLayerInfo);
};

// #endregion STATE ADAPTORS

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

/** Represents ordering and state information for a single layer. */
export interface TypeOrderedLayerInfo {
  /** The unique layer path identifier. */
  layerPath: string;

  /** Whether the layer responds to hover interactions. */
  hoverable?: boolean;

  /** Whether the layer source supports queries. */
  queryableSource?: boolean;

  /** The current queryable state of the layer. */
  queryableState?: boolean;

  /** Whether the layer is visible. */
  visible: boolean;

  /** Whether the layer is within its visible zoom range. */
  inVisibleRange: boolean;

  /** Whether the layer legend is collapsed. */
  legendCollapsed: boolean;
}
