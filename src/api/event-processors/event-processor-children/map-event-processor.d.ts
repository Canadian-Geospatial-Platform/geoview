import { Root } from 'react-dom/client';
import { Extent } from 'ol/extent';
import { FitOptions } from 'ol/View';
import { Coordinate } from 'ol/coordinate';
import { TypeBasemapOptions, TypeInteraction, TypeValidMapProjectionCodes } from '@config/types/map-schema-types';
import { LayerApi } from '@/geo/layer/layer';
import { MapViewer, TypeMapState, TypeMapMouseInfo } from '@/geo/map/map-viewer';
import { TypeFeatureInfoEntry, TypeGeoviewLayerConfig, TypeLayerEntryConfig } from '@/geo/map/map-schema-types';
import { TypeRecordOfPlugin } from '@/api/plugin/plugin-types';
import { GeoviewStoreType } from '@/core/stores/geoview-store';
import { AbstractEventProcessor } from '@/api/event-processors/abstract-event-processor';
import { TypeMapFeaturesConfig } from '@/core/types/global-types';
import { TypeClickMarker } from '@/core/components';
import { IMapState, TypeOrderedLayerInfo, TypeScaleInfo } from '@/core/stores/store-interface-and-intial-values/map-state';
import { TypeFeatureInfoResultSet, TypeHoverFeatureInfo } from '@/core/stores/store-interface-and-intial-values/feature-info-state';
import { TypeBasemapProps } from '@/geo/layer/basemap/basemap-types';
export declare class MapEventProcessor extends AbstractEventProcessor {
    /**
     * Override the initialization process to register store subscriptions handlers and return them so they can be destroyed later.
     */
    protected onInitialize(store: GeoviewStoreType): Array<() => void> | void;
    /**
     * Initializes the map controls
     * @param {string} mapId - The map id being initialized
     */
    static initMapControls(mapId: string): void;
    static getStoreConfig(mapId: string): TypeMapFeaturesConfig | undefined;
    /**
     * Shortcut to get the Map state for a given map id
     * @param {string} mapId - map Id
     * @returns {IMapState} The Map state
     */
    protected static getMapStateProtected(mapId: string): IMapState;
    /**
     * Shortcut to get the Map Viewer instance for a given map id
     * This is use to reduce the use of api.maps[mapId] and be more explicit
     * @param {string} mapId - map Id
     * @returns {MapViewer} The Map viewer instance
     */
    static getMapViewer(mapId: string): MapViewer;
    /**
     * Shortcut to get the Map Viewer layer api instance for a given map id
     * This is use to reduce the use of api.maps[mapId].layer and be more explicit
     * @param {string} mapId - map Id
     * @returns {LayerApi} The Map viewer layer API instance
     */
    static getMapViewerLayerAPI(mapId: string): LayerApi;
    /**
     * Shortcut to get the Map Viewer plugins instance for a given map id
     * This is use to reduce the use of api.maps[mapId].plugins and be more explicit
     * @param {string} mapId - map Id
     * @returns {TypeRecordOfPlugin} The map plugins record
     */
    static getMapViewerPlugins(mapId: string): Promise<TypeRecordOfPlugin>;
    /**
     * Asynchronously retrieves the scale information as read from the Dom element for the given map id
     * @param {string} mapId The mapId
     * @returns {Promise<TypeScaleInfo>} A Promise to receive scale information when the dom has it
     */
    static getScaleInfoFromDomElement(mapId: string): Promise<TypeScaleInfo>;
    /**
     * Shortcut to get the Map config for a given map id
     * @param {string} mapId the map id to retreive the config for
     * @returns {TypeMapFeaturesConfig | undefined} the map config or undefined if there is no config for this map id
     */
    static getGeoViewMapConfig(mapId: string): TypeMapFeaturesConfig | undefined;
    static getBasemapOptions(mapId: string): TypeBasemapOptions;
    static clickMarkerIconShow(mapId: string, marker: TypeClickMarker): void;
    static clickMarkerIconHide(mapId: string): void;
    static highlightBBox(mapId: string, extent: Extent, isLayerHighlight?: boolean): void;
    static getMapInteraction(mapId: string): TypeInteraction;
    /**
     * Gets map layer paths in order.
     * @param {string} mapId - The map id
     * @returns {string[]} The ordered layer paths
     */
    static getMapLayerOrder(mapId: string): string[];
    static getMapState(mapId: string): TypeMapState;
    static setMapAttribution(mapId: string, attribution: string[]): void;
    static setMapLoaded(mapId: string, mapLoaded: boolean): void;
    static setMapPointerPosition(mapId: string, pointerPosition: TypeMapMouseInfo): void;
    static setClickCoordinates(mapId: string, clickCoordinates: TypeMapMouseInfo): Promise<TypeFeatureInfoResultSet>;
    static setZoom(mapId: string, zoom: number): void;
    static setRotation(mapId: string, rotation: number): void;
    static setMapChangeSize(mapId: string, size: [number, number], scale: TypeScaleInfo): void;
    static setMapMoveEnd(mapId: string, centerCoordinates: Coordinate, pointerPosition: TypeMapMouseInfo, degreeRotation: string, isNorthVisible: boolean, scale: TypeScaleInfo): void;
    static setInteraction(mapId: string, interaction: TypeInteraction): void;
    static setProjection(mapId: string, projectionCode: TypeValidMapProjectionCodes): Promise<void>;
    static rotate(mapId: string, rotation: number): void;
    static zoom(mapId: string, zoom: number, duration?: number): void;
    /**
     * Gets the ordered layer info.
     * @param {string} mapId - The map id
     * @returns {TypeOrderedLayerInfo[]} The ordered layer info
     */
    static getMapOrderedLayerInfo(mapId: string): TypeOrderedLayerInfo[];
    static getMapIndexFromOrderedLayerInfo(mapId: string, layerPath: string): number;
    static getMapLegendCollapsedFromOrderedLayerInfo(mapId: string, layerPath: string): boolean;
    static getMapVisibilityFromOrderedLayerInfo(mapId: string, layerPath: string): boolean;
    static addHighlightedFeature(mapId: string, feature: TypeFeatureInfoEntry): void;
    static removeHighlightedFeature(mapId: string, feature: TypeFeatureInfoEntry | 'all'): void;
    /**
     * Update or remove the layer highlight.
     * @param {string} mapId - The ID of the map.
     * @param {string} layerPath - The layer path to set as the highlighted layer.
     * @param {string} hilightedLayerPath - The layer path of the currently highlighted layer.
     * @returns {string} The layer path of the highlighted layer.
     */
    static changeOrRemoveLayerHighlight(mapId: string, layerPath: string, hilightedLayerPath: string): string;
    static setMapLayerHoverable(mapId: string, layerPath: string, hoverable: boolean): void;
    static setMapHoverFeatureInfo(mapId: string, hoverFeatureInfo: TypeHoverFeatureInfo): void;
    static setMapOrderedLayerInfo(mapId: string, orderedLayerInfo: TypeOrderedLayerInfo[]): void;
    static setMapLayerQueryable(mapId: string, layerPath: string, queryable: boolean): void;
    static setMapLegendCollapsed(mapId: string, layerPath: string, collapsed?: boolean): void;
    static setOrToggleMapLayerVisibility(mapId: string, layerPath: string, newValue?: boolean): void;
    static setOrderedLayerInfoWithNoOrderChangeState(mapId: string, curOrderedLayerInfo: TypeOrderedLayerInfo[]): void;
    static reorderLayer(mapId: string, layerPath: string, move: number): void;
    /**
     * Replace a layer in the orderedLayerInfo array.
     *
     * @param {string} mapId The ID of the map to add the layer to.
     * @param {TypeGeoviewLayerConfig} geoviewLayerConfig The config of the layer to add.
     * @param {string} layerPathToReplace The layerPath of the info to replace.
     * @return {void}
     */
    static replaceOrderedLayerInfo(mapId: string, geoviewLayerConfig: TypeGeoviewLayerConfig | TypeLayerEntryConfig, layerPathToReplace?: string): void;
    /**
     * Add a new layer to the front of the orderedLayerInfo array.
     *
     * @param {string} mapId The ID of the map to add the layer to.
     * @param {TypeGeoviewLayerConfig} geoviewLayerConfig The config of the layer to add.
     * @return {void}
     */
    static addOrderedLayerInfo(mapId: string, geoviewLayerConfig: TypeGeoviewLayerConfig | TypeLayerEntryConfig, index?: number): void;
    /**
     * Remove a layer from the orderedLayerInfo array.
     *
     * @param {string} mapId The ID of the map to remove the layer from.
     * @param {string} layerPath The path of the layer to remove.
     * @return {void}
     */
    static removeOrderedLayerInfo(mapId: string, layerPath: string): void;
    static createOverviewMapBasemap(mapId: string): TypeBasemapProps | undefined;
    static resetBasemap(mapId: string): Promise<void>;
    static setBasemap(mapId: string, basemapOptions: TypeBasemapOptions): Promise<void>;
    static setMapKeyboardPanInteractions(mapId: string, panDelta: number): void;
    /**
     * Set the React root overview map element so it can be destroy if the map element is destroyed
     *
     * @param mapId The map id.
     * @param overviewRoot The React root element for the overview map
     */
    static setMapOverviewMapRoot(mapId: string, overviewRoot: Root): void;
    /**
     * Zoom to the specified extent.
     *
     * @param {string} mapId The map id.
     * @param {Extent} extent The extent to zoom to.
     * @param {FitOptions} options The options to configure the zoomToExtent (default: { padding: [100, 100, 100, 100], maxZoom: 11, duration: 500 }).
     */
    static zoomToExtent(mapId: string, extent: Extent, options?: FitOptions): Promise<void>;
    static zoomToGeoLocatorLocation(mapId: string, coords: Coordinate, bbox?: Extent): Promise<void>;
    /**
     * Return to initial view state of map using config.
     *
     * @param {string} mapId - ID of the map to return to original view
     * @returns Promise<void>
     */
    static zoomToInitialExtent(mapId: string): Promise<void>;
    /**
     * Zoom to geolocation position provided.
     *
     * @param {string} mapId - ID of map to zoom on
     * @param {GeolocationPosition} position - Info on position to zoom to.
     * @returns Promise<void>
     */
    static zoomToMyLocation(mapId: string, position: GeolocationPosition): Promise<void>;
    /**
     * Set Z index for layers
     *
     * @param {string} mapId - Id of map to set layer Z indices
     */
    static setLayerZIndices: (mapId: string) => void;
    static getPixelFromCoordinate: (mapId: string, coord: Coordinate) => [number, number];
    static setClickMarkerOnPosition: (mapId: string, position: number[]) => void;
}
