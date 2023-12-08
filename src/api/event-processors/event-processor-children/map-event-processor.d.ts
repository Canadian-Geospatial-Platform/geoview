import { Extent } from 'ol/extent';
import { FitOptions } from 'ol/View';
import { GeoViewStoreType } from '@/core/stores/geoview-store';
import { AbstractEventProcessor } from '../abstract-event-processor';
import { Coordinate, TypeBasemapOptions, TypeClickMarker } from '@/app';
import { TypeInteraction, TypeMapState } from '@/geo/map/map-schema-types';
export declare class MapEventProcessor extends AbstractEventProcessor {
    onInitialize(store: GeoViewStoreType): void;
    static setMapLoaded(mapId: string): void;
    static getBasemapOptions(mapId: string): TypeBasemapOptions;
    static clickMarkerIconHide(mapId: string): void;
    static clickMarkerIconShow(mapId: string, marker: TypeClickMarker): void;
    static getMapInteraction(mapId: string): TypeInteraction;
    static getMapState(mapId: string): TypeMapState;
    static setMapAttribution(mapId: string, attribution: string[]): void;
    static rotate(mapId: string, rotation: number): void;
    static zoom(mapId: string, zoom: number): void;
    static setMapKeyboardPanInteractions(mapId: string, panDelta: number): void;
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
}
