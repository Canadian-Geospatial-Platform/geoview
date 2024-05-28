import { Coordinate } from 'ol/coordinate'; // only for typing
import Overlay from 'ol/Overlay';
import { Extent } from 'ol/extent'; // only for Typing
import { FitOptions } from 'ol/View'; // only for typing

import { useStore } from 'zustand';
import { TypeBasemapOptions, TypeInteraction, TypeValidMapProjectionCodes } from '@config/types/map-schema-types';
import { useGeoViewStore } from '@/core/stores/stores-managers';
import { TypeSetStore, TypeGetStore } from '@/core/stores/geoview-store';
import { Projection } from '@/geo/utils/projection';
import { TypeMapFeaturesConfig } from '@/core/types/global-types';
import { TypeMapMouseInfo } from '@/geo/map/map-viewer';

import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import { TypeClickMarker } from '@/core/components/click-marker/click-marker';
import { TypeFeatureInfoEntry, TypeHoverFeatureInfo } from '@/geo/map/map-schema-types';
import { TypeFeatureInfoResultSet } from './feature-info-state';

// GV Important: See notes in header of MapEventProcessor file for information on the paradigm to apply when working with MapEventProcessor vs MapState

// #region INTERFACES & TYPES

type MapActions = IMapState['actions'];

export interface IMapState {
  attribution: string[];
  basemapOptions: TypeBasemapOptions;
  centerCoordinates: Coordinate;
  clickCoordinates?: TypeMapMouseInfo;
  clickMarker: TypeClickMarker | undefined;
  currentProjection: TypeValidMapProjectionCodes;
  fixNorth: boolean;
  highlightedFeatures: TypeFeatureInfoEntry[];
  hoverFeatureInfo: TypeHoverFeatureInfo | undefined | null;
  interaction: TypeInteraction;
  mapExtent: Extent | undefined;
  mapLoaded: boolean;
  northArrow: boolean;
  northArrowElement: TypeNorthArrow;
  orderedLayerInfo: TypeOrderedLayerInfo[];
  overlayClickMarker?: Overlay;
  overlayNorthMarker?: Overlay;
  overviewMap: boolean;
  overviewMapHideZoom: number;
  pointerPosition?: TypeMapMouseInfo;
  rotation: number;
  scale: TypeScaleInfo;
  size: [number, number];
  visibleLayers: string[];
  zoom: number;

  setDefaultConfigValues: (config: TypeMapFeaturesConfig) => void;

  actions: {
    createBaseMapFromOptions: () => Promise<void>;
    getPixelFromCoordinate: (coord: Coordinate) => [number, number];
    getIndexFromOrderedLayerInfo: (layerPath: string) => number;
    getVisibilityFromOrderedLayerInfo: (layerPath: string) => boolean;
    showClickMarker: (marker: TypeClickMarker) => void;
    hideClickMarker: () => void;
    highlightBBox: (extent: Extent, isLayerHighlight?: boolean) => void;
    addHighlightedFeature: (feature: TypeFeatureInfoEntry) => void;
    removeHighlightedFeature: (feature: TypeFeatureInfoEntry | 'all') => void;
    reorderLayer: (layerPath: string, move: number) => void;
    setOrToggleLayerVisibility: (layerPath: string, newValue?: boolean) => void;
    setMapKeyboardPanInteractions: (panDelta: number) => void;
    setZoom: (zoom: number, duration?: number) => void;
    setInteraction: (interaction: TypeInteraction) => void;
    setRotation: (rotation: number) => void;
    zoomToExtent: (extent: Extent, options?: FitOptions) => Promise<void>;
    zoomToInitialExtent: () => Promise<void>;
    zoomToGeoLocatorLocation: (coords: [number, number], bbox?: [number, number, number, number]) => Promise<void>;
    zoomToMyLocation: (position: GeolocationPosition) => Promise<void>;
    transformPoints: (coords: Coordinate[], outputProjection: number) => Coordinate[];
    setClickCoordinates: (pointerPosition: TypeMapMouseInfo) => Promise<TypeFeatureInfoResultSet>;
    setFixNorth: (ifFix: boolean) => void;
    setOverlayClickMarkerRef: (htmlRef: HTMLElement) => void;
    setOverlayNorthMarkerRef: (htmlRef: HTMLElement) => void;
  };

  setterActions: {
    setMapChangeSize: (size: [number, number], scale: TypeScaleInfo) => void;
    setMapLoaded: (mapLoaded: boolean) => void;
    setAttribution: (attribution: string[]) => void;
    setInteraction: (interaction: TypeInteraction) => void;
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
      scale: TypeScaleInfo
    ) => void;
    setPointerPosition: (pointerPosition: TypeMapMouseInfo) => void;
    setClickCoordinates: (clickCoordinates: TypeMapMouseInfo) => void;
    setFixNorth: (ifFix: boolean) => void;
    setHighlightedFeatures: (highlightedFeatures: TypeFeatureInfoEntry[]) => void;
    setVisibleLayers: (newOrder: string[]) => void;
    setOrderedLayerInfo: (newOrderedLayerInfo: TypeOrderedLayerInfo[]) => void;
    setHoverable: (layerPath: string, hoverable: boolean) => void;
    setQueryable: (layerPath: string, queryable: boolean) => void;
    setClickMarker: (coord: number[] | undefined) => void;
    setHoverFeatureInfo: (hoverFeatureInfo: TypeHoverFeatureInfo) => void;
  };
}

// #endregion INTERFACES & TYPES

/**
 * Initializes a Map State and provide functions which use the get/set Zustand mechanisms.
 * @param {TypeSetStore} set - The setter callback to be used by this state
 * @param {TypeGetStore} get - The getter callback to be used by this state
 * @returns {IMapState} - The initialized Map State
 */
export function initializeMapState(set: TypeSetStore, get: TypeGetStore): IMapState {
  const init = {
    attribution: [],
    basemapOptions: { basemapId: 'transport', shaded: true, labeled: true },
    centerCoordinates: [0, 0] as Coordinate,
    clickMarker: undefined,
    currentProjection: 3857 as TypeValidMapProjectionCodes,
    fixNorth: false,
    highlightedFeatures: [],
    hoverFeatureInfo: undefined,
    interaction: 'static',
    mapExtent: undefined,
    mapLoaded: false,
    northArrow: false,
    northArrowElement: { degreeRotation: '180.0', isNorthVisible: true } as TypeNorthArrow,
    orderedLayerInfo: [],
    overviewMap: false,
    overviewMapHideZoom: 0,
    pointerPosition: undefined,
    rotation: 0,
    scale: { lineWidth: '', labelGraphic: '', labelNumeric: '' } as TypeScaleInfo,
    size: [0, 0] as [number, number],
    visibleLayers: [],
    zoom: 0,

    /**
     * Initializes default stores section from config information when store receive configuration file
     */
    setDefaultConfigValues: (geoviewConfig: TypeMapFeaturesConfig) => {
      set({
        mapState: {
          ...get().mapState,
          basemapOptions: geoviewConfig.map.basemapOptions,
          centerCoordinates: geoviewConfig.map.viewSettings.initialView?.zoomAndCenter
            ? (geoviewConfig.map.viewSettings.initialView.zoomAndCenter[1] as Coordinate)
            : [-90, 67],
          currentProjection: geoviewConfig.map.viewSettings.projection,
          interaction: geoviewConfig.map.interaction || 'dynamic',
          mapExtent: geoviewConfig.map.viewSettings.maxExtent,
          northArrow: geoviewConfig.components!.indexOf('north-arrow') > -1 || false,
          overviewMap: geoviewConfig.components!.indexOf('overview-map') > -1 || false,
          overviewMapHideZoom: geoviewConfig.overviewMap !== undefined ? geoviewConfig.overviewMap.hideOnZoom : 0,
          rotation: geoviewConfig.map.viewSettings.rotation || 0,
          zoom: geoviewConfig.map.viewSettings.initialView?.zoomAndCenter
            ? geoviewConfig.map.viewSettings.initialView.zoomAndCenter[0]
            : 4.5,
        },
      });
    },

    // #region ACTIONS

    actions: {
      /**
       * Resets the base map.
       * @returns {Promise<void>}
       */
      createBaseMapFromOptions: (): Promise<void> => {
        // Redirect to processor
        return MapEventProcessor.resetBasemap(get().mapId);
      },

      /**
       * Retrieves the pixel from a coordinate.
       * @param {Coordinate} coord - The coordinate.
       * @returns {[number, number]} - The pixel coordinates.
       */
      getPixelFromCoordinate: (coord: Coordinate): [number, number] => {
        // Redirect to processor and return the result
        return MapEventProcessor.getPixelFromCoordinate(get().mapId, coord);
      },

      /**
       * Retrieves the index from ordered layer information.
       * @param {string} layerPath - The path of the layer.
       * @returns {number} The index of the layer.
       */
      getIndexFromOrderedLayerInfo: (layerPath: string): number => {
        // Redirect to processor and return the result
        return MapEventProcessor.getMapIndexFromOrderedLayerInfo(get().mapId, layerPath);
      },

      /**
       * Retrieves the visibility from ordered layer information.
       * @param {string} layerPath - The path of the layer.
       * @returns {boolean} The visibility of the layer.
       */
      getVisibilityFromOrderedLayerInfo: (layerPath: string): boolean => {
        // Redirect to processor and return the result
        return MapEventProcessor.getMapVisibilityFromOrderedLayerInfo(get().mapId, layerPath);
      },

      /**
       * Shows a click marker.
       * @param {TypeClickMarker} marker - The click marker to show.
       */
      showClickMarker: (marker: TypeClickMarker): void => {
        // Redirect to processor
        MapEventProcessor.clickMarkerIconShow(get().mapId, marker);
      },

      /**
       * Hides the click marker.
       */
      hideClickMarker: (): void => {
        // Redirect to processor
        MapEventProcessor.clickMarkerIconHide(get().mapId);
      },

      /**
       * Highlights a bounding box.
       * @param {Extent} extent - The extent to highlight.
       * @param {boolean} [isLayerHighlight] - Flag indicating if it's a layer highlight.
       */
      highlightBBox: (extent: Extent, isLayerHighlight?: boolean): void => {
        // Redirect to processor
        MapEventProcessor.highlightBBox(get().mapId, extent, isLayerHighlight);
      },

      /**
       * Adds a highlighted feature.
       * @param {TypeFeatureInfoEntry} feature The feature to highlight.
       */
      addHighlightedFeature: (feature: TypeFeatureInfoEntry): void => {
        // Redirect to processor
        MapEventProcessor.addHighlightedFeature(get().mapId, feature);
      },

      /**
       * Removes a highlighted feature.
       * @param {TypeFeatureInfoEntry | 'all'} feature - The feature to remove or 'all' to remove all.
       */
      removeHighlightedFeature: (feature: TypeFeatureInfoEntry | 'all'): void => {
        // Redirect to processor
        MapEventProcessor.removeHighlightedFeature(get().mapId, feature);
      },

      /**
       * Reorders the layer.
       * @param {string} layerPath - The path of the layer.
       * @param {number} move - The move value.
       */
      reorderLayer: (layerPath: string, move: number): void => {
        // Redirect to processor
        MapEventProcessor.reorderLayer(get().mapId, layerPath, move);
      },

      /**
       * Sets or toggles the visibility of a layer.
       * @param {string} layerPath - The path of the layer.
       * @param {boolean} [newValue] - The new value of visibility.
       */
      setOrToggleLayerVisibility: (layerPath: string, newValue?: boolean): void => {
        // Redirect to processor
        MapEventProcessor.setOrToggleMapLayerVisibility(get().mapId, layerPath, newValue);
      },

      /**
       * Sets the map keyboard pan interactions.
       * @param {number} panDelta - The pan delta value.
       */
      setMapKeyboardPanInteractions: (panDelta: number): void => {
        // Redirect to processor
        MapEventProcessor.setMapKeyboardPanInteractions(get().mapId, panDelta);
      },

      /**
       * Sets the zoom level.
       * @param {number} zoom - The zoom level.
       * @param {number} [duration] - The duration of zoom animation.
       */
      setZoom: (zoom: number, duration?: number): void => {
        // Redirect to processor
        MapEventProcessor.zoom(get().mapId, zoom, duration);
      },

      /**
       * Sets the interaction.
       * @param {TypeInteraction} interaction - The interaction type.
       */
      setInteraction: (interaction: TypeInteraction): void => {
        // Redirect to processor
        MapEventProcessor.setInteraction(get().mapId, interaction);
      },

      /**
       * Sets the rotation.
       * @param {number} rotation - The rotation angle.
       */
      setRotation: (rotation: number): void => {
        // Redirect to processor
        MapEventProcessor.rotate(get().mapId, rotation);
      },

      /**
       * Zooms to the specified extent.
       * @param {Extent} extent - The extent to zoom to.
       * @param {FitOptions} [options] - The fit options.
       * @returns {Promise<void>} A promise that resolves when the zoom operation completes.
       */
      zoomToExtent: (extent: Extent, options?: FitOptions): Promise<void> => {
        // Redirect to processor and return the result
        return MapEventProcessor.zoomToExtent(get().mapId, extent, options);
      },

      /**
       * Zooms to the initial extent.
       * @returns {Promise<void>} A promise that resolves when the zoom operation completes.
       */
      zoomToInitialExtent: (): Promise<void> => {
        // Redirect to processor and return the result
        return MapEventProcessor.zoomToInitialExtent(get().mapId);
      },

      /**
       * Zooms to the specified geographic locator location.
       * @param {Coordinate} coords - The coordinates to zoom to.
       * @param {Extent} [bbox] - The bounding box.
       * @returns {Promise<void>} A promise that resolves when the zoom operation completes.
       */
      zoomToGeoLocatorLocation: (coords: Coordinate, bbox?: Extent): Promise<void> => {
        // Redirect to processor and return the result
        return MapEventProcessor.zoomToGeoLocatorLocation(get().mapId, coords, bbox);
      },

      /**
       * Zooms to the specified location.
       * @param {GeolocationPosition} position - The geolocation position.
       * @returns {Promise<void>} A promise that resolves when the zoom operation completes.
       */
      zoomToMyLocation: (position: GeolocationPosition): Promise<void> => {
        // Redirect to processor and return the result
        return MapEventProcessor.zoomToMyLocation(get().mapId, position);
      },

      /**
       * Transforms points from one projection to another.
       * @param {Coordinate[]} coords - The coordinates to transform.
       * @param {number} outputProjection - The output projection code.
       * @returns {Coordinate[]} The transformed coordinates.
       */
      transformPoints: (coords: Coordinate[], outputProjection: number): Coordinate[] => {
        // Project the points and return the result
        return Projection.transformPoints(coords, `EPSG:${get().mapState.currentProjection}`, `EPSG:${outputProjection}`);
      },

      /**
       * Sets the click coordinates.
       * @param {TypeMapMouseInfo} pointerPosition - The pointer position.
       * @returns {Promise<TypeFeatureInfoResultSet>}
       */
      setClickCoordinates: (pointerPosition: TypeMapMouseInfo): Promise<TypeFeatureInfoResultSet> => {
        // Redirect to processor
        return MapEventProcessor.setClickCoordinates(get().mapId, pointerPosition);
      },

      /**
       * Sets whether the map should fix to north.
       * @param {boolean} ifFix - Flag indicating if map should fix to north.
       */
      setFixNorth: (ifFix: boolean): void => {
        // Redirect to setter
        get().mapState.setterActions.setFixNorth(ifFix);
      },

      /**
       * Sets the click marker reference for overlay.
       * @param {HTMLElement} htmlRef - The HTML element reference.
       */
      setOverlayClickMarkerRef: (htmlRef: HTMLElement): void => {
        // Quick function to set the element on the overlay
        // Only fot UI, no redirect to setterAction
        const overlay = get().mapState.overlayClickMarker;
        if (overlay !== undefined) overlay.setElement(htmlRef);
      },

      /**
       * Sets the north marker reference for overlay.
       * @param {HTMLElement} htmlRef - The HTML element reference.
       */
      setOverlayNorthMarkerRef: (htmlRef: HTMLElement): void => {
        // Quick function to set the element on the overlay
        // Only fot UI, no redirect to setterAction
        const overlay = get().mapState.overlayNorthMarker;
        if (overlay !== undefined) overlay.setElement(htmlRef);
      },
      // #endregion ACTIONS
    },

    setterActions: {
      /**
       * Sets the map size and scale.
       * @param {[number, number]} size - The size of the map.
       * @param {TypeScaleInfo} scale - The scale information.
       */
      setMapChangeSize: (size: [number, number], scale: TypeScaleInfo): void => {
        set({
          mapState: {
            ...get().mapState,
            size,
            scale,
          },
        });
      },

      /**
       * Sets whether the map is loaded.
       * @param {boolean} mapLoaded - Flag indicating if the map is loaded.
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
       * Sets the attribution of the map.
       * @param {string[]} attribution - The attribution information.
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
       * Sets the interaction of the map.
       * @param {TypeInteraction} interaction - The interaction type.
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
       * Sets the zoom level of the map.
       * @param {number} zoom - The zoom level.
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
       * @param {number} rotation - The rotation angle.
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
       * @param {Overlay} overlayClickMarker - The overlay click marker.
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
       * @param {Overlay} overlayNorthMarker - The overlay north marker.
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
       * @param {TypeValidMapProjectionCodes} projectionCode - The projection code.
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
       * Sets map move end properties.
       * @param {Coordinate} centerCoordinates - The center coordinates of the map.
       * @param {TypeMapMouseInfo} pointerPosition - The pointer position information.
       * @param {string} degreeRotation - The degree rotation.
       * @param {boolean} isNorthVisible - Flag indicating if north is visible.
       * @param {TypeScaleInfo} scale - The scale information.
       */
      setMapMoveEnd: (
        centerCoordinates: Coordinate,
        pointerPosition: TypeMapMouseInfo,
        degreeRotation: string,
        isNorthVisible: boolean,
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
            scale,
          },
        });

        // On map center coord change, hide click marker
        get().mapState.setterActions.setClickMarker(undefined);

        // If crosshair is active and user uses keyboard, update pointer position
        // This will enable mouse position and hover tooltip
        if (get().appState.isCrosshairsActive) {
          get().mapState.setterActions.setPointerPosition(pointerPosition);
        }
      },

      /**
       * Sets the pointer position of the map.
       * @param {TypeMapMouseInfo} pointerPosition - The pointer position.
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
       * @param {TypeMapMouseInfo} clickCoordinates - The click coordinates.
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
       * @param {boolean} fixNorth - Flag indicating if the map should be fixed to north.
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
       * @param {TypeFeatureInfoEntry[]} highlightedFeatures - The highlighted features.
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
       * @param {string[]} visibleLayers - The visible layers.
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
       * Sets the ordered layer information of the map.
       * @param {TypeOrderedLayerInfo[]} orderedLayerInfo - The ordered layer information.
       */
      setOrderedLayerInfo: (orderedLayerInfo: TypeOrderedLayerInfo[]): void => {
        // We need to explicitly define ... for the array. If not subscribe does not fired
        // TODO: refactor - setterActions in setState will recreate array if needed. We need to implement the pattern in all setterActions
        // TO.DOCONT: We should have a deep equality function to compare previous / current
        set({
          mapState: {
            ...get().mapState,
            orderedLayerInfo: [...orderedLayerInfo],
          },
        });
      },

      /**
       * Sets whether a layer is hoverable.
       * @param {string} layerPath - The path of the layer.
       * @param {boolean} hoverable - Flag indicating if the layer should be hoverable.
       */
      setHoverable: (layerPath: string, hoverable: boolean): void => {
        const curLayerInfo = get().mapState.orderedLayerInfo;
        const layerInfo = curLayerInfo.find((info) => info.layerPath === layerPath);
        if (layerInfo) {
          layerInfo.hoverable = hoverable;

          // Redirect
          get().mapState.setterActions.setOrderedLayerInfo(curLayerInfo);
        }
      },

      /**
       * Sets whether a layer is queryable.
       * @param {string} layerPath - The path of the layer.
       * @param {boolean} queryable - Flag indicating if the layer should be queryable.
       */
      setQueryable: (layerPath: string, queryable: boolean): void => {
        const curLayerInfo = get().mapState.orderedLayerInfo;
        const layerInfo = curLayerInfo.find((info) => info.layerPath === layerPath);
        if (layerInfo) {
          layerInfo.queryable = queryable;
          if (queryable) layerInfo.hoverable = queryable;

          // Redirect
          get().mapState.setterActions.setOrderedLayerInfo(curLayerInfo);
        }
      },

      /**
       * Sets the click marker of the map.
       * @param {number[] | undefined} coord - The click marker coordinates.
       */
      setClickMarker: (coord: number[] | undefined): void => {
        set({
          mapState: { ...get().mapState, clickMarker: coord ? { lnglat: coord } : undefined },
        });
      },

      setHoverFeatureInfo(hoverFeatureInfo: TypeHoverFeatureInfo) {
        set({
          mapState: {
            ...get().mapState,
            hoverFeatureInfo,
          },
        });
      },
    },

    // #endregion ACTIONS
  } as IMapState;

  return init;
}

export interface TypeScaleInfo {
  lineWidth: string;
  labelGraphic: string;
  labelNumeric: string;
}

export interface TypeNorthArrow {
  degreeRotation: string;
  isNorthVisible: boolean;
}

export interface TypeOrderedLayerInfo {
  hoverable?: boolean;
  layerPath: string;
  queryable?: boolean;
  visible: boolean;
}

// **********************************************************
// Map state selectors
// **********************************************************
export const useMapAttribution = (): string[] => useStore(useGeoViewStore(), (state) => state.mapState.attribution);
export const useMapBasemapOptions = (): TypeBasemapOptions => useStore(useGeoViewStore(), (state) => state.mapState.basemapOptions);
export const useMapCenterCoordinates = (): Coordinate => useStore(useGeoViewStore(), (state) => state.mapState.centerCoordinates);
export const useMapClickMarker = (): TypeClickMarker | undefined => useStore(useGeoViewStore(), (state) => state.mapState.clickMarker);
export const useMapClickCoordinates = (): TypeMapMouseInfo | undefined =>
  useStore(useGeoViewStore(), (state) => state.mapState.clickCoordinates);
export const useMapExtent = (): Extent | undefined => useStore(useGeoViewStore(), (state) => state.mapState.mapExtent);
export const useMapFixNorth = (): boolean => useStore(useGeoViewStore(), (state) => state.mapState.fixNorth);
export const useMapInteraction = (): TypeInteraction => useStore(useGeoViewStore(), (state) => state.mapState.interaction);
export const useMapHoverFeatureInfo = (): TypeHoverFeatureInfo => useStore(useGeoViewStore(), (state) => state.mapState.hoverFeatureInfo);
export const useMapLoaded = (): boolean => useStore(useGeoViewStore(), (state) => state.mapState.mapLoaded);
export const useMapNorthArrow = (): boolean => useStore(useGeoViewStore(), (state) => state.mapState.northArrow);
export const useMapNorthArrowElement = (): TypeNorthArrow => useStore(useGeoViewStore(), (state) => state.mapState.northArrowElement);
export const useMapOrderedLayerInfo = (): TypeOrderedLayerInfo[] => useStore(useGeoViewStore(), (state) => state.mapState.orderedLayerInfo);
export const useMapOverviewMap = (): boolean => useStore(useGeoViewStore(), (state) => state.mapState.overviewMap);
export const useMapOverviewMapHideZoom = (): number => useStore(useGeoViewStore(), (state) => state.mapState.overviewMapHideZoom);
export const useMapPointerPosition = (): TypeMapMouseInfo | undefined =>
  useStore(useGeoViewStore(), (state) => state.mapState.pointerPosition);
export const useMapProjection = (): TypeValidMapProjectionCodes => useStore(useGeoViewStore(), (state) => state.mapState.currentProjection);
export const useMapRotation = (): number => useStore(useGeoViewStore(), (state) => state.mapState.rotation);
export const useMapScale = (): TypeScaleInfo => useStore(useGeoViewStore(), (state) => state.mapState.scale);
export const useMapSize = (): [number, number] => useStore(useGeoViewStore(), (state) => state.mapState.size);
export const useMapVisibleLayers = (): string[] => useStore(useGeoViewStore(), (state) => state.mapState.visibleLayers);
export const useMapZoom = (): number => useStore(useGeoViewStore(), (state) => state.mapState.zoom);

export const useMapStoreActions = (): MapActions => useStore(useGeoViewStore(), (state) => state.mapState.actions);
