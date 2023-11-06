/// <reference types="lodash" />
import { Map as OLMap, MapEvent } from 'ol';
import { Coordinate } from 'ol/coordinate';
import { ObjectEvent } from 'ol/Object';
import Overlay from 'ol/Overlay';
import { TypeSetStore, TypeGetStore } from '@/core/stores/geoview-store';
import { TypeValidMapProjectionCodes } from '@/core/types/global-types';
import { TypeMapMouseInfo } from '@/api/events/payloads';
import { TypeInteraction } from '@/geo/map/map-schema-types';
interface TypeScaleInfo {
    lineWidth: string;
    labelGraphic: string;
    labelNumeric: string;
}
export interface IMapState {
    centerCoordinates: Coordinate;
    clickCoordinates: TypeMapMouseInfo | undefined;
    currentProjection: TypeValidMapProjectionCodes;
    fixNorth: boolean;
    interaction: TypeInteraction;
    pointerPosition: TypeMapMouseInfo | undefined;
    mapElement: OLMap;
    mapLoaded: boolean;
    northArrow: boolean;
    overlayNorthMarker: Overlay;
    overviewMap: boolean;
    overviewMapHideZoom: number;
    rotation: number;
    scale: TypeScaleInfo;
    zoom?: number | undefined;
    onMapMoveEnd: (event: MapEvent) => void;
    onMapPointerMove: (event: MapEvent) => void;
    onMapRotation: (event: ObjectEvent) => void;
    onMapSingleClick: (event: MapEvent) => void;
    onMapZoomEnd: (event: ObjectEvent) => void;
    actions: {
        setMapElement: (mapElem: OLMap) => void;
        setOverlayNorthMarker: (overlay: Overlay) => void;
        setOverlayNorthMarkerRef: (htmlRef: HTMLElement) => void;
    };
}
export declare function initializeMapState(set: TypeSetStore, get: TypeGetStore): {
    centerCoordinates: Coordinate;
    currentProjection: number;
    fixNorth: boolean;
    mapLoaded: boolean;
    overviewMapHideZoom: number;
    pointerPosition: undefined;
    rotation: number;
    scale: {
        lineWidth: string;
        labelGraphic: string;
        labelNumeric: string;
    };
    zoom: undefined;
    onMapMoveEnd: import("lodash").DebouncedFunc<(event: MapEvent) => void>;
    onMapPointerMove: import("lodash").DebouncedFunc<(event: MapEvent) => void>;
    onMapRotation: import("lodash").DebouncedFunc<(event: ObjectEvent) => void>;
    onMapSingleClick: (event: MapEvent) => void;
    onMapZoomEnd: import("lodash").DebouncedFunc<(event: ObjectEvent) => void>;
    actions: {
        setMapElement: (mapElem: OLMap) => void;
        setOverlayNorthMarker: (overlay: Overlay) => void;
        setOverlayNorthMarkerRef: (htmlRef: HTMLElement) => void;
    };
};
export declare const useMapCenterCoordinates: () => Coordinate;
export declare const useMapProjection: () => TypeValidMapProjectionCodes;
export declare const useMapElement: () => OLMap;
export declare const useMapInteraction: () => TypeInteraction;
export declare const useMapOverlayNorthMarker: () => Overlay;
export declare const useMapPointerPosition: () => TypeMapMouseInfo | undefined;
export declare const useMapScale: () => TypeScaleInfo;
export declare const useMapStoreActions: () => {
    setMapElement: (mapElem: OLMap) => void;
    setOverlayNorthMarker: (overlay: Overlay) => void;
    setOverlayNorthMarkerRef: (htmlRef: HTMLElement) => void;
};
export {};
