import { Coordinate } from 'ol/coordinate'; // only for typing
import Overlay from 'ol/Overlay';
import { Extent } from 'ol/extent'; // only for Typing
import { FitOptions } from 'ol/View'; // only for typing
import { Size } from 'ol/size';
import { Pixel } from 'ol/pixel';
import { useStore } from 'zustand';

import {
  TypeBasemapOptions,
  TypeHighlightColors,
  TypeInteraction,
  TypeMapViewSettings,
  TypeValidMapProjectionCodes,
  TypeZoomAndCenter,
  TypeFeatureInfoEntry,
  TypePointMarker,
  MAP_CENTER,
} from '@/api/config/types/map-schema-types';
import { getGeoViewStore, useGeoViewStore } from '@/core/stores/stores-managers';
import { TypeSetStore, TypeGetStore } from '@/core/stores/geoview-store';
import { Projection } from '@/geo/utils/projection';
import { TypeMapFeaturesConfig } from '@/core/types/global-types';
import { TypeMapMouseInfo } from '@/geo/map/map-viewer';

import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import { TypeClickMarker } from '@/core/components/click-marker/click-marker';
import { TypeHoverFeatureInfo } from './feature-info-state';
import { logger } from '@/core/utils/logger';

// GV Important: See notes in header of MapEventProcessor file for information on the paradigm to apply when working with MapEventProcessor vs MapState

// #region INTERFACES & TYPES

export const DEFAULT_PROJECTION = 3857 as TypeValidMapProjectionCodes;

type MapActions = IMapState['actions'];

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
    createBasemapFromOptions: (basemapOptions: TypeBasemapOptions) => Promise<void>;
    getMapLayerParentHidden(layerPath: string): boolean;
    isLayerHiddenOnMap(layerPath: string): boolean;
    getPixelFromCoordinate: (coord: Coordinate) => Pixel;
    showClickMarker: (marker: TypeClickMarker) => void;
    hideClickMarker: () => void;
    highlightBBox: (extent: Extent, isLayerHighlight?: boolean) => void;
    addHighlightedFeature: (feature: TypeFeatureInfoEntry) => void;
    removeHighlightedFeature: (feature: TypeFeatureInfoEntry | 'all') => void;
    removeLayerHighlights: (layerPath: string) => void;
    addPointMarkers: (group: string, pointMarkers: TypePointMarker[]) => void;
    removePointMarkersOrGroup: (group: string, idsOrCoordinates?: string[] | Coordinate[]) => void;
    reorderLayer: (layerPath: string, move: number) => void;
    resetBasemap: () => Promise<void>;
    setLegendCollapsed: (layerPath: string, newValue: boolean) => void;
    toggleLegendCollapsed: (layerPath: string) => void;
    setAllLayersCollapsed: (collapsed: boolean) => void;
    setOrToggleLayerVisibility: (layerPath: string, newValue?: boolean) => boolean;
    setAllLayersVisibility: (visibility: boolean) => void;
    setMapKeyboardPanInteractions: (panDelta: number) => void;
    setProjection: (projectionCode: TypeValidMapProjectionCodes) => void;
    setZoom: (zoom: number, duration?: number) => void;
    setInteraction: (interaction: TypeInteraction) => void;
    setRotation: (rotation: number) => void;
    zoomToExtent: (extent: Extent, options?: FitOptions) => Promise<void>;
    zoomToInitialExtent: () => Promise<void>;
    zoomToGeoLocatorLocation: (coords: [number, number], bbox?: [number, number, number, number]) => Promise<void>;
    zoomToMyLocation: (position: GeolocationPosition) => Promise<void>;
    transformPoints: (coords: Coordinate[], outputProjection: number) => Coordinate[];
    setClickCoordinates: (pointerPosition: TypeMapMouseInfo) => void;
    setCurrentBasemapOptions: (basemapOptions: TypeBasemapOptions) => void;
    setFixNorth: (ifFix: boolean) => void;
    setOverlayClickMarkerRef: (htmlRef: HTMLElement) => void;
    setOverlayNorthMarkerRef: (htmlRef: HTMLElement) => void;
  };

  setterActions: {
    setMapSize: (size: Size) => void;
    setMapScale: (scale: TypeScaleInfo) => void;
    setMapLoaded: (mapLoaded: boolean) => void;
    setMapDisplayed: () => void;
    setAttribution: (attribution: string[]) => void;
    setInitialFilters: (filters: Record<string, string>) => void;
    setInitialView: (view: TypeZoomAndCenter | Extent) => void;
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
    currentBasemapOptions: { basemapId: 'transport', shaded: true, labeled: true },
    currentProjection: DEFAULT_PROJECTION,
    featureHighlightColor: 'black',
    fixNorth: false,
    highlightedFeatures: [],
    homeView: undefined,
    hoverFeatureInfo: undefined,
    initialFilters: {},
    initialView: {
      zoomAndCenter: [3.5, MAP_CENTER[3857] as [number, number]],
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
          centerCoordinates: geoviewConfig.map.viewSettings.initialView?.zoomAndCenter
            ? (geoviewConfig.map.viewSettings.initialView.zoomAndCenter[1] as Coordinate)
            : MAP_CENTER[geoviewConfig.map.viewSettings.projection],
          currentProjection: geoviewConfig.map.viewSettings.projection,
          currentBasemapOptions: geoviewConfig.map.basemapOptions,
          featureHighlightColor: geoviewConfig.map.highlightColor || 'black',
          homeView: geoviewConfig.map.viewSettings.homeView ||
            geoviewConfig.map.viewSettings.initialView || { zoomAndCenter: [3.5, MAP_CENTER[3857] as [number, number]] },
          initialView: geoviewConfig.map.viewSettings.initialView || { zoomAndCenter: [3.5, MAP_CENTER[3857] as [number, number]] },
          interaction: geoviewConfig.map.interaction || 'dynamic',
          mapExtent: geoviewConfig.map.viewSettings.maxExtent,
          northArrow: geoviewConfig.components!.indexOf('north-arrow') > -1 || false,
          overviewMap: geoviewConfig.components!.indexOf('overview-map') > -1 || false,
          overviewMapHideZoom: geoviewConfig.overviewMap !== undefined ? geoviewConfig.overviewMap.hideOnZoom : 0,
          pointMarkers: geoviewConfig.map.overlayObjects?.pointMarkers || {},
          rotation: geoviewConfig.map.viewSettings.rotation || 0,
          zoom: geoviewConfig.map.viewSettings.initialView?.zoomAndCenter
            ? geoviewConfig.map.viewSettings.initialView.zoomAndCenter[0]
            : 3.5,
        },
      });
    },

    // #region ACTIONS

    actions: {
      /**
       * Sets new base map from options.
       * @param {TypeBasemapOptions} basemapOptions - The options for the new basemap
       * @returns {Promise<void>}
       */
      createBasemapFromOptions: (basemapOptions: TypeBasemapOptions): Promise<void> => {
        // Redirect to processor
        return MapEventProcessor.setBasemap(get().mapId, basemapOptions);
      },

      /**
       * Returns true if any of the layers parents are hidden.
       * @param {string} layerPath - The layers path
       * @returns {boolean} - If there is a hidden parent
       */
      getMapLayerParentHidden: (layerPath: string): boolean => {
        // Redirect to processor
        return MapEventProcessor.getMapLayerParentHidden(get().mapId, layerPath);
      },

      /**
       * Returns true if any of the layers parents are hidden.
       * @param {string} layerPath - The layers path
       * @returns {boolean} - If the layer is hidden through any means
       */
      isLayerHiddenOnMap: (layerPath: string): boolean => {
        // Redirect to processor
        return (
          MapEventProcessor.getMapLayerParentHidden(get().mapId, layerPath) ||
          !MapEventProcessor.findMapLayerFromOrderedInfo(get().mapId, layerPath, get().mapState.orderedLayerInfo)?.inVisibleRange ||
          !MapEventProcessor.findMapLayerFromOrderedInfo(get().mapId, layerPath, get().mapState.orderedLayerInfo)?.visible
        );
      },

      /**
       * Retrieves the pixel from a coordinate.
       * @param {Coordinate} coord - The coordinate.
       * @returns {Pixel} - The pixel coordinates.
       */
      getPixelFromCoordinate: (coord: Coordinate): Pixel => {
        // Redirect to processor and return the result
        return MapEventProcessor.getPixelFromCoordinate(get().mapId, coord);
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
       * Removes layer and feature highlights for a given layer.
       * @param {string} layerPath - The path of the layer to remove highlights from.
       */
      removeLayerHighlights: (layerPath: string): void => {
        // Redirect to processor
        MapEventProcessor.removeLayerHighlights(get().mapId, layerPath);
      },

      /**
       * Add point markers.
       * @param {string} group - The group to add the point to
       * @param {TypePointMarker[]} pointMarkers - The points to add
       */
      addPointMarkers: (group: string, pointMarkers: TypePointMarker[]): void => {
        // Redirect to processor
        return MapEventProcessor.addPointMarkers(get().mapId, group, pointMarkers);
      },

      /**
       * Remove a point marker.
       * @param {string} group - The group to remove the point from
       * @param {string[] | Coordinate[]} idsOrCoordinates - The point to remove
       */
      removePointMarkersOrGroup: (group: string, idsOrCoordinates?: string[] | Coordinate[]): void => {
        // Redirect to processor
        return MapEventProcessor.removePointMarkersOrGroup(get().mapId, group, idsOrCoordinates);
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
       * Resets the base map.
       * @returns {Promise<void>}
       */
      resetBasemap: (): Promise<void> => {
        // Redirect to processor
        return MapEventProcessor.resetBasemap(get().mapId);
      },

      /**
       * Sets the current basemap options.
       * @param {TypeBasemapOptions} basemapOptions - The basemap options.
       */
      setCurrentBasemapOptions: (basemapOptions: TypeBasemapOptions): void => {
        // Redirect to setter
        get().mapState.setterActions.setCurrentBasemapOptions(basemapOptions);
      },

      /**
       * Sets the collapse state of a layer.
       * @param {string} layerPath - The path of the layer.
       * @param {boolean} [newValue] - The new value of collapse.
       */
      setLegendCollapsed: (layerPath: string, newValue: boolean): void => {
        // Redirect to setter
        get().mapState.setterActions.setLegendCollapsed(layerPath, newValue);
      },

      /**
       * Toggles the collapse state of a layer.
       * @param {string} layerPath - The path of the layer.
       */
      toggleLegendCollapsed: (layerPath: string): void => {
        // Get current value
        const legendCollapsedRightNow: boolean =
          MapEventProcessor.findMapLayerFromOrderedInfo(get().mapId, layerPath)?.legendCollapsed || false;

        // Redirect
        get().mapState.setterActions.setLegendCollapsed(layerPath, !legendCollapsedRightNow);
      },

      /**
       * Sets the collapsed state of all layers.
       * @param {boolean} collapsed - The collapsed.
       */
      setAllLayersCollapsed: (collapsed: boolean): void => {
        // Redirect to processor.
        MapEventProcessor.setAllMapLayerCollapsed(get().mapId, collapsed);
      },

      /**
       * Sets or toggles the visibility of a layer.
       * @param {string} layerPath - The path of the layer.
       * @param {boolean} [newValue] - The new value of visibility.
       */
      setOrToggleLayerVisibility: (layerPath: string, newValue?: boolean): boolean => {
        // Redirect to processor
        return MapEventProcessor.setOrToggleMapLayerVisibility(get().mapId, layerPath, newValue);
      },

      /**
       * Sets the visibility of all layers.
       * @param {boolean} visibility - The visibility.
       */
      setAllLayersVisibility: (visibility: boolean): void => {
        // Redirect to processor.
        MapEventProcessor.setAllMapLayerVisibility(get().mapId, visibility);
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
       * Sets the projection of the map.
       * @param {TypeValidMapProjectionCodes} projectionCode - The projection.
       */
      setProjection: (projectionCode: TypeValidMapProjectionCodes): void => {
        // Redirect to processor
        MapEventProcessor.setProjection(get().mapId, projectionCode).catch((error: unknown) => {
          logger.logError('Map-State Failed to set projection', error);
        });
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
      setClickCoordinates: (pointerPosition: TypeMapMouseInfo): void => {
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
       * Sets the map size.
       * @param {Size} size - The size of the map.
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
       * @param {TypeScaleInfo} scale - The scale information.
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
       * Sets the current basemap options.
       * @param {TypeBasemapOptions} basemapOptions - The new basemap options.
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
       * @param {Record<string, string>} filters - The filters.
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
       * @param {TypeZoomAndCenter | Extent} view - The view extent or zoom&center.
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
       * Sets the view of the home button.
       * @param {TypeMapViewSettings} view - The view to use.
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
       * Sets to true if mouse is inside map.
       * @param {boolean} isMouseInsideMap - True if mouse is inside map.
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
       * Sets the point markers.
       * @param {Record<string, TypePointMarker[]>} pointMarkers - The new point markers.
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
       * Sets the layers of the map that are in visible range.
       * @param {string[]} visibleRangeLayers - The layers in their visible range
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
       * @param {TypeOrderedLayerInfo[]} orderedLayerInfo - The ordered layer information.
       */
      setOrderedLayerInfo: (orderedLayerInfo: TypeOrderedLayerInfo[]): void => {
        set({
          mapState: {
            ...get().mapState,
            orderedLayerInfo: [...orderedLayerInfo],
            // GV Here, we use the spread operator for the custom selector hooks such as useSelectorLayerLegendCollapsed to
            // GV notice and eventually trigger the changes that need to be get triggered
          },
        });

        // Get all layers as specified in the order layer info we're updating
        const orderedLayers = orderedLayerInfo.map((layer) => layer.layerPath);

        // Check if the order of the layers has changed
        if (JSON.stringify(orderedLayers) !== JSON.stringify(get().mapState.orderedLayers)) {
          // Set the readonly representation of ordered layers array according to the order the layers are
          get().mapState.setterActions.setOrderedLayers(orderedLayers);
        }

        // Get all visible layers as specified in the order layer info we're updating
        const visibleLayers = orderedLayerInfo.filter((layer) => layer.visible).map((layer) => layer.layerPath);

        // Check if the order of the layers has changed
        if (JSON.stringify(visibleLayers) !== JSON.stringify(get().mapState.visibleLayers)) {
          // Set the readonly representation of visibile layers array according to the visibile layers
          get().mapState.setterActions.setVisibleLayers(visibleLayers);
        }

        // Get all layers in visible range as specified in the order layer info we're updating
        const inVisibleRange = orderedLayerInfo.filter((layer) => layer.inVisibleRange).map((layer) => layer.layerPath);

        // Check if the order of the layers has changed
        if (JSON.stringify(inVisibleRange) !== JSON.stringify(get().mapState.visibleRangeLayers)) {
          // Set the readonly representation of visibile range layers array according to the visibile range layers
          get().mapState.setterActions.setVisibleRangeLayers(inVisibleRange);
        }
      },

      /**
       * Sets the visible layers of the map.
       * @param {string[]} orderedLayers - The ordered layers.
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
       * Sets whether a layer is hoverable.
       * @param {string} layerPath - The path of the layer.
       * @param {boolean} collapsed - Flag indicating if the layer should be collapsed.
       */
      setLegendCollapsed: (layerPath: string, collapsed: boolean): void => {
        const curLayerInfo = get().mapState.orderedLayerInfo;
        const layerInfo = curLayerInfo.find((info) => info.layerPath === layerPath);
        if (layerInfo) {
          layerInfo.legendCollapsed = collapsed;

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
          mapState: { ...get().mapState, clickMarker: coord ? { lonlat: coord } : undefined },
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
  lineWidthMetric: string;
  labelGraphicMetric: string;
  lineWidthImperial: string;
  labelGraphicImperial: string;
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
  inVisibleRange: boolean;
  legendCollapsed: boolean;
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
export const useMapFeatureHighlightColor = (): TypeHighlightColors =>
  useStore(useGeoViewStore(), (state) => state.mapState.featureHighlightColor);
export const useMapFixNorth = (): boolean => useStore(useGeoViewStore(), (state) => state.mapState.fixNorth);
export const useMapInitialFilters = (): Record<string, string> => useStore(useGeoViewStore(), (state) => state.mapState.initialFilters);
export const useMapInitialView = (): TypeMapViewSettings => useStore(useGeoViewStore(), (state) => state.mapState.initialView);
export const useMapInteraction = (): TypeInteraction => useStore(useGeoViewStore(), (state) => state.mapState.interaction);
export const useMapIsMouseInsideMap = (): boolean => useStore(useGeoViewStore(), (state) => state.mapState.isMouseInsideMap);
export const useMapHoverFeatureInfo = (): TypeHoverFeatureInfo => useStore(useGeoViewStore(), (state) => state.mapState.hoverFeatureInfo);
export const useMapLoaded = (): boolean => useStore(useGeoViewStore(), (state) => state.mapState.mapLoaded);
export const useMapDisplayed = (): boolean => useStore(useGeoViewStore(), (state) => state.mapState.mapDisplayed);
export const useMapNorthArrow = (): boolean => useStore(useGeoViewStore(), (state) => state.mapState.northArrow);
export const useMapNorthArrowElement = (): TypeNorthArrow => useStore(useGeoViewStore(), (state) => state.mapState.northArrowElement);
export const useMapOverviewMap = (): boolean => useStore(useGeoViewStore(), (state) => state.mapState.overviewMap);
export const useMapOverviewMapHideZoom = (): number => useStore(useGeoViewStore(), (state) => state.mapState.overviewMapHideZoom);
export const useMapPointerPosition = (): TypeMapMouseInfo | undefined =>
  useStore(useGeoViewStore(), (state) => state.mapState.pointerPosition);
export const useMapPointMarkers = (): Record<string, TypePointMarker[]> =>
  useStore(useGeoViewStore(), (state) => state.mapState.pointMarkers);
export const useMapProjection = (): TypeValidMapProjectionCodes => useStore(useGeoViewStore(), (state) => state.mapState.currentProjection);
export const useMapRotation = (): number => useStore(useGeoViewStore(), (state) => state.mapState.rotation);
export const useMapScale = (): TypeScaleInfo => useStore(useGeoViewStore(), (state) => state.mapState.scale);
export const useMapSize = (): Size => useStore(useGeoViewStore(), (state) => state.mapState.size);
export const useMapOrderedLayers = (): string[] => useStore(useGeoViewStore(), (state) => state.mapState.orderedLayers);
export const useMapVisibleLayers = (): string[] => useStore(useGeoViewStore(), (state) => state.mapState.visibleLayers);
export const useMapVisibleRangeLayers = (): string[] => useStore(useGeoViewStore(), (state) => state.mapState.visibleRangeLayers);
export const useMapZoom = (): number => useStore(useGeoViewStore(), (state) => state.mapState.zoom);

// Getter function for one-time access, there is no subcription to modification
export const getMapPointerPosition = (mapId: string): TypeMapMouseInfo | undefined =>
  getGeoViewStore(mapId).getState().mapState.pointerPosition;

export const useSelectorLayerVisibility = (layerPath: string): boolean => {
  // Hook
  return useStore(
    useGeoViewStore(),
    (state) => MapEventProcessor.findMapLayerFromOrderedInfo(state.mapId, layerPath, state.mapState.orderedLayerInfo)?.visible || false
  );
};

export const useSelectorLayerParentHidden = (layerPath: string): boolean => {
  return useStore(useGeoViewStore(), (state) => MapEventProcessor.getMapLayerParentHidden(state.mapId, layerPath));
};

export const useAllLayersVisible = (): boolean =>
  useStore(useGeoViewStore(), (state) => state.mapState.orderedLayerInfo.every((layer) => layer.visible));

export const useMapHasCollapsibleLayers = (): boolean =>
  useStore(useGeoViewStore(), (state) => MapEventProcessor.getLegendCollapsibleLayers(state.mapId).length > 0);

export const useAllLayersCollapsed = (): boolean =>
  useStore(useGeoViewStore(), (state) => MapEventProcessor.getAllLegendLayersCollapsed(state.mapId));

export const useSelectorLayerInVisibleRange = (layerPath: string): boolean => {
  // Hook
  return useStore(
    useGeoViewStore(),
    (state) =>
      MapEventProcessor.findMapLayerFromOrderedInfo(state.mapId, layerPath, state.mapState.orderedLayerInfo)?.inVisibleRange || false
  );
};

export const useSelectorIsLayerHiddenOnMap = (layerPath: string): boolean => {
  return useStore(
    useGeoViewStore(),
    (state) =>
      MapEventProcessor.getMapLayerParentHidden(state.mapId, layerPath) ||
      !MapEventProcessor.findMapLayerFromOrderedInfo(state.mapId, layerPath, state.mapState.orderedLayerInfo)?.inVisibleRange ||
      !MapEventProcessor.findMapLayerFromOrderedInfo(state.mapId, layerPath, state.mapState.orderedLayerInfo)?.visible
  );
};

export const useSelectorLayerLegendCollapsed = (layerPath: string): boolean => {
  // Hook
  return useStore(
    useGeoViewStore(),
    (state) =>
      MapEventProcessor.findMapLayerFromOrderedInfo(state.mapId, layerPath, state.mapState.orderedLayerInfo)?.legendCollapsed || false
  );
};

// Store Actions
export const useMapStoreActions = (): MapActions => useStore(useGeoViewStore(), (state) => state.mapState.actions);
