declare namespace L {
    interface MarkerClusterElementOptions extends MarkerOptions {
        selected?: boolean;
        blinking?: boolean;
        on?: Record<string, L.LeafletEventHandlerFn>;
    }

    interface MarkerClusterElement extends L.Marker {
        options: MarkerClusterElementOptions;
        startBlinking(): void;
        stopBlinking(): void;
    }

    function markerClusterElement(latlng: L.LatLngExpression, options?: MarkerClusterElementOptions): MarkerClusterElement;
}
