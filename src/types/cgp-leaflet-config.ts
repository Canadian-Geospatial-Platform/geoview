/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-underscore-dangle */
import L, { Util, LatLngBounds } from 'leaflet';
import 'leaflet.markercluster/src';
import 'react-leaflet';

import * as DomUtil from 'leaflet/src/dom/DomUtil';
import * as DomEvent from 'leaflet/src/dom/DomEvent';
import { Cast, CONST_VECTOR_TYPES } from './cgpv-types';

import { api } from '../api/api';
import { EVENT_NAMES } from '../api/event';

/*-----------------------------------------------------------------------------
 *
 * BoxZoom and SelectBox configuration
 *
 *---------------------------------------------------------------------------*/

(L.Map as any).BoxZoom.include({
    _onMouseDown: function _onMouseDown(e: MouseEvent): void {
        if (!e.shiftKey || e.altKey || e.ctrlKey || (e.which !== 1 && e.button !== 1)) return;

        // Clear the deferred resetState if it hasn't executed yet, otherwise it
        // will interrupt the interaction and orphan a box element in the container.
        this._clearDeferredResetState();
        this._resetState();

        DomUtil.disableTextSelection();
        DomUtil.disableImageDrag();

        this._startPoint = this._map.mouseEventToContainerPoint(e);

        DomEvent.on(
            document,
            {
                contextmenu: DomEvent.stop,
                mousemove: this._onMouseMove,
                mouseup: this._onMouseUp,
                keydown: this._onKeyDown,
            },
            this
        );
    },

    _onMouseUp: function _onMouseUp(e: MouseEvent): void {
        this._finish();
        if (!e.shiftKey || e.altKey || e.ctrlKey || (e.which !== 1 && e.button !== 1)) return;

        if (!this._moved) return;
        // Postpone to next JS tick so internal click event handling
        // still see it as "moved".
        this._clearDeferredResetState();
        this._resetStateTimeout = setTimeout(Util.bind(this._resetState, this), 0);

        const bounds = new LatLngBounds(this._map.containerPointToLatLng(this._startPoint), this._map.containerPointToLatLng(this._point));

        this._map.fitBounds(bounds).fire('boxzoomend', { boxZoomBounds: bounds });
    },
});

export const SelectBox = (L.Map as any).BoxZoom.extend({
    _onMouseMove: function _onMouseMove(e: MouseEvent): void {
        if (!this._moved) {
            this._moved = true;

            this._box = DomUtil.create('div', 'leaflet-zoom-box', this._container);
            DomUtil.addClass(this._container, 'leaflet-crosshair');

            this._map.fire('boxzoomstart');
        }

        this._point = this._map.mouseEventToContainerPoint(e);

        const bounds = new L.Bounds(this._point, this._startPoint);
        const size = bounds.getSize();

        DomUtil.setPosition(this._box, bounds.min);

        this._box.style.width = `${size.x}px`;
        this._box.style.height = `${size.y}px`;
    },

    _onMouseDown: function _onMouseDown(e: MouseEvent): void {
        if (e.shiftKey || !e.altKey || e.ctrlKey || (e.which !== 1 && e.button !== 1)) return;

        // Clear the deferred resetState if it hasn't executed yet, otherwise it
        // will interrupt the interaction and orphan a box element in the container.
        this._clearDeferredResetState();
        this._resetState();
        this._map.dragging.disable();

        DomUtil.disableTextSelection();
        DomUtil.disableImageDrag();

        this._startPoint = this._map.mouseEventToContainerPoint(e);

        DomEvent.on(
            document,
            {
                contextmenu: DomEvent.stop,
                mousemove: this._onMouseMove,
                mouseup: this._onMouseUp,
                keydown: this._onKeyDown,
            },
            this
        );
    },

    _onMouseUp: function _onMouseUp(e: MouseEvent): void {
        this._finish();
        this._map.dragging.enable();
        if (e.shiftKey || !e.altKey || e.ctrlKey || (e.which !== 1 && e.button !== 1)) return;

        if (!this._moved) return;
        // Postpone to next JS tick so internal click event handling
        // still see it as "moved".
        this._clearDeferredResetState();
        this._resetStateTimeout = setTimeout(Util.bind(this._resetState, this), 0);

        const bounds = new LatLngBounds(this._map.containerPointToLatLng(this._startPoint), this._map.containerPointToLatLng(this._point));

        this._map.fire('boxselectend', { selectBoxBounds: bounds });
    },
});

L.Map.addInitHook('addHandler', 'selectBox', SelectBox);

/*-----------------------------------------------------------------------------
 *
 * L.Layer configuration
 *
 *---------------------------------------------------------------------------*/

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

L.Layer.addInitHook(function fn(this: L.Layer) {
    if (this.options && this.options.id) this.id = this.options.id;
});

/*-----------------------------------------------------------------------------
 *
 * L.CircleMarker and L.Circle configuration
 *
 *---------------------------------------------------------------------------*/

declare module 'leaflet' {
    interface CircleMarkerOptions {
        id: string;
    }

    interface CircleMarker {
        options: CircleMarkerOptions;
    }

    interface Circle {
        options: CircleMarkerOptions;
        _mRadius: number;
    }
}

L.CircleMarker.addInitHook(function fn(this: L.CircleMarker) {
    this.type = CONST_VECTOR_TYPES.CIRCLE_MARKER;
});

L.Circle.addInitHook(function fn(this: L.Circle) {
    this.type = CONST_VECTOR_TYPES.CIRCLE;
    // Radius of the circle is in meters, we convert it to km
    this._mRadius = (this.options.radius as number) * 1000;
});

/*-----------------------------------------------------------------------------
 *
 * L.Polyline and Polygon configuration
 *
 *---------------------------------------------------------------------------*/

declare module 'leaflet' {
    interface PolylineOptions {
        id: string;
    }

    interface Polyline {
        options: PolylineOptions;
    }

    interface Polygon {
        options: PolylineOptions;
    }
}

L.Polyline.addInitHook(function fn(this: L.Polyline) {
    this.type = CONST_VECTOR_TYPES.POLYLINE;
});

L.Polygon.addInitHook(function fn(this: L.Polygon) {
    this.type = CONST_VECTOR_TYPES.POLYGON;
});

/*-----------------------------------------------------------------------------
 *
 * L.Marker and L.MarkerCluster configuration
 *
 *---------------------------------------------------------------------------*/
declare module 'leaflet' {
    interface MarkerOptions {
        id: string;
    }

    interface Marker {
        initialize: (latLng: L.LatLng, options: L.MarkerOptions) => void;
    }

    interface MarkerCluster {
        spiderfy: () => void;
        unspiderfy: () => void;
        getAllChildMarkers(): L.MarkerClusterElement[];
        zoomToBounds(options: { padding: [number, number] }): void;
    }
}

L.Marker.addInitHook(function fn(this: L.Marker | L.MarkerCluster) {
    if ('getAllChildMarkers' in this) {
        this.type = 'marker_cluster';
    } else {
        this.type = CONST_VECTOR_TYPES.MARKER;
    }
});

/*-----------------------------------------------------------------------------
 *
 * L.FeatureGroup and L.MarkerClusterGroup configuration
 *
 *---------------------------------------------------------------------------*/

declare module 'leaflet' {
    interface FeatureGroupOptions extends LayerOptions {
        id: string;
        visible?: boolean;
    }

    interface FeatureGroup {
        visible: boolean;
    }

    export function featureGroup(layers?: Layer[], options?: FeatureGroupOptions): FeatureGroup;

    export interface MarkerClusterMouseEvent extends LeafletMouseEvent {
        latlng: LatLng;
        layerPoint: Point;
        containerPoint: Point;
        originalEvent: MouseEvent;
        propagatedFrom: MarkerCluster;
        target: MarkerClusterGroup;
        type: string;
    }

    export type MarkerClusterMouseEventHandlerFn = (event: MarkerClusterMouseEvent) => void;

    interface MarkerClusterGroupOnOptions {
        clusterclick?: MarkerClusterMouseEventHandlerFn;
        unspiderfied?: MarkerClusterMouseEventHandlerFn;
        spiderfied?: MarkerClusterMouseEventHandlerFn;
    }

    interface MarkerClusterGroupOptions {
        id?: string;
        visible?: boolean;
        on?: MarkerClusterGroupOnOptions;
    }

    interface MarkerClusterGroup extends FeatureGroup {
        visible: boolean;
        type: string;
        addLayer(marker: MarkerClusterElement): this;
        removeLayer(marker: MarkerClusterElement): this;
        eachLayer(fn: (layer: L.MarkerClusterElement) => void, context?: any): this;
        getLayers(): MarkerClusterElement[];
        getVisibleParent(marker: MarkerClusterElement): MarkerCluster;
        unspiderfy(): void;
        on(type: 'clusterclick' | 'unspiderfied' | 'spiderfied', fn: MarkerClusterMouseEventHandlerFn): void;
        off(type: 'clusterclick' | 'unspiderfied' | 'spiderfied', fn: MarkerClusterMouseEventHandlerFn): void;
        fire(type: 'click', event: MarkerClusterMouseEvent, propagate: boolean): void;
    }
}

L.FeatureGroup.addInitHook(function fn(this: L.FeatureGroup | L.MarkerClusterGroup) {
    if ('visible' in this.options) {
        this.visible = this.options.visible as boolean;
    } else {
        this.visible = true;
        this.options.visible = true;
    }
    if ('getVisibleParent' in this) {
        this.type = 'MarkerClusterGroup';
    } else {
        this.type = 'FeatureGroup';
    }
});

/*-----------------------------------------------------------------------------
 *
 * L.Map configuration
 *
 *---------------------------------------------------------------------------*/

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

L.Map.addInitHook(function fn(this: L.Map) {
    if (this.options && this.options.id) this.id = this.options.id;
    if (this.options.selectBox) {
        this.on('boxselectend', (e: L.LeafletEvent) => {
            const bounds = Cast<{ selectBoxBounds: L.LatLngBounds }>(e).selectBoxBounds;
            api.event.emit(EVENT_NAMES.EVENT_BOX_SELECT_END, e.target.id, {
                selectBoxBounds: bounds,
            });
        });
    }
});

/*-----------------------------------------------------------------------------
 *
 * L.MapContainerProps configuration
 *
 *---------------------------------------------------------------------------*/

declare module 'react-leaflet' {
    interface MapContainerProps {
        id?: string;
        boxZoom?: boolean;
        selectBox?: boolean;
    }
}
