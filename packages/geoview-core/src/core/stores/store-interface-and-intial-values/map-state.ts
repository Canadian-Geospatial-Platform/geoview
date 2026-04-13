import { useStore } from 'zustand';

import type { Coordinate } from 'ol/coordinate';
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
import { getGeoViewStore, useGeoViewStore } from '@/core/stores/stores-managers';
import type { TypeSetStore, TypeGetStore } from '@/core/stores/geoview-store';
import type { TypeMapFeaturesConfig } from '@/core/types/global-types';
import type { TypeClickMarker } from '@/core/components/click-marker/click-marker';
import type { TypeHoverFeatureInfo } from './feature-info-state';
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
    setGeolocatorSearchArea: (area: { searchItem: string; coords: Coordinate; bbox?: Extent } | undefined) => void;
    setHomeView: (view: TypeMapViewSettings) => void;
    setInteraction: (interaction: TypeInteraction) => void;
    setIsMouseInsideMap: (isMouseInsideMap: boolean) => void;
    setZoom: (zoom: number) => void;
    setRotation: (rotation: number) => void;
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
    setClickMarker: (coord: number[] | undefined) => void;
    setHoverFeatureInfo: (hoverFeatureInfo: TypeHoverFeatureInfo) => void;
  };
}

// #endregion INTERFACE DEFINITION

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

/** Selects the current zoom level from the store. */
export const useStoreMapZoom = (): number => useStore(useGeoViewStore(), (state) => state.mapState.zoom);

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

/** Sets the hover feature info in the store. */
export const setStoreMapHoverFeatureInfo = (mapId: string, hoverFeatureInfo: TypeHoverFeatureInfo): void => {
  getStoreMapState(mapId).actions.setHoverFeatureInfo(hoverFeatureInfo);
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

/** Sets the highlighted features in the store. */
export const setStoreMapHighlightedFeatures = (mapId: string, highlightedFeatures: TypeFeatureInfoEntry[]): void => {
  getStoreMapState(mapId).actions.setHighlightedFeatures(highlightedFeatures);
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

/** Sets the fix north state in the store. */
export const setStoreMapFixNorth = (mapId: string, fixNorth: boolean): void => {
  getStoreMapState(mapId).actions.setFixNorth(fixNorth);
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
