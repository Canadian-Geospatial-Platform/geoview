// Type modification for Leaflet.markercluster 1.0

/// <reference types="leaflet" />

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

    interface MarkerClusterElement {
        id: string;
        type: string;
        options: MarkerClusterElementOptions;
        blinking: boolean;
        selected: boolean;
        setSelectedMarkerIconCreator(f: () => L.DivIcon): void;
        setUnselectedMarkerIconCreator(f: () => L.DivIcon): void;
        getSelectedMarkerIcon(): L.DivIcon;
        getUnselectedMarkerIcon(): L.DivIcon;
        setSelectedFlag(newValue: boolean): void;
        startBlinking(): void;
        stopBlinking(): void;
        addTo(map: L.Map | L.MarkerClusterGroup): this;
        remove(): this;
        getLatLng(): LatLng;
        on(type: 'click', fn: MarkerClusterElementMouseEventHandlerFn): void;
        off(type: 'click', fn: MarkerClusterElementMouseEventHandlerFn): void;
    }

    function markerClusterElement(latlng: L.LatLngExpression, options?: MarkerClusterElementOptions): MarkerClusterElement;
}
