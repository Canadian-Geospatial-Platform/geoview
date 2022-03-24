// Type modification for Leaflet.markercluster 1.0

/// <reference types="leaflet.markercluster" />

declare namespace L {
    export interface MarkerClusterElementMouseEvent extends LeafletMouseEvent {
        latlng: LatLng;
        layerPoint: Point;
        containerPoint: Point;
        originalEvent: MouseEvent;
        sourceTarget: MarkerClusterElement;
        target: MarkerClusterElement;
        type: string;
    }

    export type MarkerClusterElementMouseEventHandlerFn = (event: MarkerClusterElementMouseEvent) => void;

    interface MarkerClusterElementOnOptions {
        clusterclick?: MarkerClusterElementMouseEventHandlerFn;
        unspiderfied?: MarkerClusterElementMouseEventHandlerFn;
        spiderfied?: MarkerClusterElementMouseEventHandlerFn;
    }

    interface MarkerClusterElementOptions extends MarkerOptions {
        selected?: boolean;
        blinking?: boolean;
        mapId: string;
        on?: MarkerClusterElementOnOptions;
    }

    interface MarkerClusterElement extends MarkerCluster {
        id: string;
        type: string;
        options: MarkerClusterElementOptions;
        blinking: boolean;
        selected: boolean;
        setSelectedMarkerIconCreator(f: () => DivIcon): void;
        setUnselectedMarkerIconCreator(f: () => DivIcon): void;
        getSelectedMarkerIcon(): DivIcon;
        getUnselectedMarkerIcon(): DivIcon;
        setSelectedFlag(newValue: boolean): void;
        startBlinking(): void;
        stopBlinking(): void;
        remove(): this;
        getLatLng(): LatLng;
    }

    function markerClusterElement(latlng: LatLngExpression, options?: MarkerClusterElementOptions): MarkerClusterElement;
}
