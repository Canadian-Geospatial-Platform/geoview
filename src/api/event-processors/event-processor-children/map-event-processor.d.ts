import { Root } from 'react-dom/client';
import { Extent } from 'ol/extent';
import { FitOptions } from 'ol/View';
import { GeoviewStoreType } from '@/core/stores/geoview-store';
import { Coordinate, TypeBasemapOptions, TypeBasemapProps, TypeClickMarker, TypeMapFeaturesConfig } from '@/app';
import { TypeInteraction, TypeMapState, TypeValidMapProjectionCodes } from '@/geo/map/map-schema-types';
import { TypeLegendLayer } from '@/core/components/layers/types';
import { AbstractEventProcessor } from '../abstract-event-processor';
export declare class MapEventProcessor extends AbstractEventProcessor {
    /**
     * Override the initialization process to wire subscriptions and return them so they can be destroyed later.
     */
    protected onInitialize(store: GeoviewStoreType): Array<() => void> | void;
    static setMapLoaded(mapId: string): void;
    /**
     * Shortcut to get the Map state for a given map id
     * @param {string} mapId The mapId
     * @returns {ILayerState} The Map state
     */
    protected static getMapStateProtected(mapId: string): import("@/app").IMapState;
    /**
     * Shortcut to get the Map config for a given map id
     * @param {string} mapId the map id to retreive the config for
     * @returns {TypeMapFeaturesConfig | undefined} the map config or undefined if there is no config for this map id
     */
    static getGeoViewMapConfig(mapId: string): TypeMapFeaturesConfig | undefined;
    static getBasemapOptions(mapId: string): TypeBasemapOptions;
    static clickMarkerIconHide(mapId: string): void;
    static clickMarkerIconShow(mapId: string, marker: TypeClickMarker): void;
    static getMapInteraction(mapId: string): TypeInteraction;
    static getMapState(mapId: string): TypeMapState;
    static setMapAttribution(mapId: string, attribution: string[]): void;
    static setInteraction(mapId: string, interaction: TypeInteraction): void;
    static setProjection(mapId: string, projectionCode: TypeValidMapProjectionCodes): Promise<void>;
    static rotate(mapId: string, rotation: number): void;
    static zoom(mapId: string, zoom: number): void;
    static createEmptyBasemap(mapId: string): import("ol/layer/Tile").default<import("ol/source/XYZ").default>;
    static createOverviewMapBasemap(mapId: string): TypeBasemapProps | undefined;
    static resetBasemap(mapId: string): void;
    static evaluateLayerPathsFromLegendsArray(legendsArray: TypeLegendLayer[]): string[];
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
     * @param {FitOptions} options The options to configure the zoomToExtent (default: { padding: [100, 100, 100, 100], maxZoom: 11 }).
     */
    static zoomToExtent(mapId: string, extent: Extent, options?: FitOptions): void;
    static zoomToGeoLocatorLocation(mapId: string, coords: Coordinate, bbox?: Extent): void;
    static zoomToInitialExtent(mapId: string): void;
    static zoomToMyLocation(mapId: string, position: GeolocationPosition): void;
    /**
     * Set Z index for layers
     *
     * @param {string} mapId Id of map to set layer Z indices
     */
    static setLayerZIndices: (mapId: string) => void;
}
