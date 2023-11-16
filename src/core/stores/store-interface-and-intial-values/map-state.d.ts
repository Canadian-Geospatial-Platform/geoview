import { Map as OLMap, MapEvent } from 'ol';
import { Coordinate } from 'ol/coordinate';
import { ObjectEvent } from 'ol/Object';
import Overlay from 'ol/Overlay';
import { TypeSetStore, TypeGetStore } from '@/core/stores/geoview-store';
import { TypeValidMapProjectionCodes } from '@/core/types/global-types';
import { TypeFeatureInfoEntry, TypeMapMouseInfo } from '@/api/events/payloads';
import { TypeInteraction } from '@/geo/map/map-schema-types';
import { TypeClickMarker } from '@/app';
interface TypeScaleInfo {
    lineWidth: string;
    labelGraphic: string;
    labelNumeric: string;
}
export interface TypeNorthArrow {
    degreeRotation: string;
    isNorthVisible: boolean;
}
export interface IMapState {
    centerCoordinates: Coordinate;
    clickCoordinates?: TypeMapMouseInfo;
    clickMarker: TypeClickMarker | undefined;
    currentProjection: TypeValidMapProjectionCodes;
    fixNorth: boolean;
    interaction: TypeInteraction;
    pointerPosition?: TypeMapMouseInfo;
    mapElement?: OLMap;
    mapLoaded: boolean;
    northArrow: boolean;
    northArrowElement: TypeNorthArrow;
    overlayClickMarker?: Overlay;
    overlayNorthMarker?: Overlay;
    overviewMap: boolean;
    overviewMapHideZoom: number;
    rotation: number;
    scale: TypeScaleInfo;
    selectedFeatures: Array<TypeFeatureInfoEntry>;
    size: [number, number];
    zoom: number;
    events: {
        onMapMoveEnd: (event: MapEvent) => void;
        onMapPointerMove: (event: MapEvent) => void;
        onMapRotation: (event: ObjectEvent) => void;
        onMapSingleClick: (event: MapEvent) => void;
        onMapZoomEnd: (event: ObjectEvent) => void;
    };
    actions: {
        getPixelFromCoordinate: (coord: Coordinate) => [number, number];
        getSize: () => [number, number];
        hideClickMarker: () => void;
        setClickCoordinates: () => void;
        setFixNorth: (ifFix: boolean) => void;
        setMapElement: (mapElem: OLMap) => void;
        setMapKeyboardPanInteractions: (panDelta: number) => void;
        setOverlayClickMarker: (overlay: Overlay) => void;
        setOverlayClickMarkerRef: (htmlRef: HTMLElement) => void;
        setOverlayNorthMarker: (overlay: Overlay) => void;
        setOverlayNorthMarkerRef: (htmlRef: HTMLElement) => void;
        setRotation: (degree: number) => void;
        setZoom: (zoom: number) => void;
        showClickMarker: (marker: TypeClickMarker) => void;
        zoomToInitialExtent: () => void;
        zoomToMyLocation: (position: GeolocationPosition) => void;
    };
}
export declare function initializeMapState(set: TypeSetStore, get: TypeGetStore): IMapState;
export declare const useMapCenterCoordinates: () => Coordinate;
export declare const useMapClickMarker: () => TypeClickMarker | undefined;
export declare const useMapProjection: () => TypeValidMapProjectionCodes;
export declare const useMapElement: () => OLMap | undefined;
export declare const useMapFixNorth: () => boolean;
export declare const useMapInteraction: () => TypeInteraction;
export declare const useMapLoaded: () => boolean;
export declare const useMapNorthArrow: () => boolean;
export declare const useMapNorthArrowElement: () => TypeNorthArrow;
export declare const useMapOverviewMap: () => boolean;
export declare const useMapPointerPosition: () => TypeMapMouseInfo | undefined;
export declare const useMapRotation: () => number;
export declare const useMapScale: () => TypeScaleInfo;
export declare const useMapZoom: () => number;
export declare const useMapStoreActions: () => {
    getPixelFromCoordinate: (coord: Coordinate) => [number, number];
    getSize: () => [number, number];
    hideClickMarker: () => void;
    setClickCoordinates: () => void;
    setFixNorth: (ifFix: boolean) => void;
    setMapElement: (mapElem: OLMap) => void;
    setMapKeyboardPanInteractions: (panDelta: number) => void;
    setOverlayClickMarker: (overlay: Overlay) => void;
    setOverlayClickMarkerRef: (htmlRef: HTMLElement) => void;
    setOverlayNorthMarker: (overlay: Overlay) => void;
    setOverlayNorthMarkerRef: (htmlRef: HTMLElement) => void;
    setRotation: (degree: number) => void;
    setZoom: (zoom: number) => void;
    showClickMarker: (marker: TypeClickMarker) => void;
    zoomToInitialExtent: () => void;
    zoomToMyLocation: (position: GeolocationPosition) => void;
};
export {};
