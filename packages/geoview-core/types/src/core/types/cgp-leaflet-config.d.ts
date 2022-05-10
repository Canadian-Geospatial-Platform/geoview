import L from 'leaflet';
import 'leaflet.markercluster/src';
import 'react-leaflet';
export declare const SelectBox: any;
declare module 'leaflet' {
    interface LayerOptions {
        id?: string;
        visible?: boolean;
    }
    interface Layer {
        id: string;
        options: LayerOptions;
        type: string;
    }
}
declare module 'leaflet' {
    interface CircleMarkerOptions {
        id?: string;
    }
    interface CircleMarker {
        options: CircleMarkerOptions;
    }
    interface Circle {
        options: CircleMarkerOptions;
        _mRadius: number;
    }
}
declare module 'leaflet' {
    interface PolylineOptions {
        id?: string;
    }
    interface Polyline {
        options: PolylineOptions;
    }
    interface Polygon {
        options: PolylineOptions;
    }
}
declare module 'leaflet' {
    interface MarkerOptions {
        id?: string;
    }
    interface Marker {
        initialize: (latLng: LatLng, options: MarkerOptions) => void;
    }
}
declare module 'leaflet' {
    interface FeatureGroupOptions extends LayerOptions {
        id?: string;
        visible?: boolean;
    }
    interface FeatureGroup {
        visible: boolean;
    }
    function featureGroup(layers?: Layer[], options?: FeatureGroupOptions): FeatureGroup;
    interface Evented extends Class {
        on(type: 'clusterclick' | 'unspiderfied' | 'spiderfied', fn: MarkerClusterMouseEventHandlerFn): void;
        off(type: 'clusterclick' | 'unspiderfied' | 'spiderfied', fn: MarkerClusterMouseEventHandlerFn): void;
        fire(type: 'click', event: MarkerClusterMouseEvent, propagate: boolean): void;
    }
    interface MarkerClusterMouseEvent extends LeafletMouseEvent {
        latlng: LatLng;
        layerPoint: Point;
        containerPoint: Point;
        originalEvent: MouseEvent;
        propagatedFrom: MarkerClusterElement;
        target: MarkerClusterGroup;
        type: string;
    }
    type MarkerClusterMouseEventHandlerFn = (event: MarkerClusterMouseEvent) => void;
    interface MarkerClusterGroupOnOptions {
        clusterclick?: MarkerClusterMouseEventHandlerFn;
        unspiderfied?: MarkerClusterMouseEventHandlerFn;
        spiderfied?: MarkerClusterMouseEventHandlerFn;
    }
    interface MarkerClusterGroupOptions extends LayerOptions {
        id?: string;
        visible?: boolean;
        on?: MarkerClusterGroupOnOptions;
    }
    interface MarkerClusterGroup extends FeatureGroup {
        visible: boolean;
        type: string;
        getVisibleParent(marker: MarkerClusterElement): MarkerCluster;
        unspiderfy(): void;
        eachLayer(fn: (marker: MarkerClusterElement) => void, context?: any): this;
    }
}
declare module 'leaflet' {
    interface MapOptions {
        id?: string;
        zoomFactor?: number;
        selectBox?: boolean;
    }
    interface Map {
        id: string;
        selectBox: L.Handler;
        zoomFactor: number;
    }
}
declare module 'react-leaflet' {
    interface MapContainerProps {
        id?: string;
        boxZoom?: boolean;
        selectBox?: boolean;
    }
}
declare module 'esri-leaflet' {
    interface MapService {
        options: MapServiceOptions;
    }
    interface DynamicMapLayer {
        options: DynamicMapLayerOptions;
    }
}
