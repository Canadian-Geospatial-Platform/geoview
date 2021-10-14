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
        if (!e.shiftKey || e.altKey || e.ctrlKey || (e.which !== 1 && e.button !== 1)) {
            this._finish();
            return;
        }

        this._finish();

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
    _onMouseDown: function _onMouseDown(e: MouseEvent): void {
        if (!e.shiftKey || !e.altKey || e.ctrlKey || (e.which !== 1 && e.button !== 1)) return;

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
        if (!e.shiftKey || !e.altKey || e.ctrlKey || (e.which !== 1 && e.button !== 1)) {
            this._finish();
            return;
        }

        this._finish();

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

L.CircleMarker.addInitHook(function fn(this: L.CircleMarker) {
    this.type = CONST_VECTOR_TYPES.CIRCLE_MARKER;
});

L.Circle.addInitHook(function fn(this: L.Circle) {
    this.type = CONST_VECTOR_TYPES.CIRCLE;
});

/*-----------------------------------------------------------------------------
 *
 * L.Polyline configuration
 *
 *---------------------------------------------------------------------------*/

L.Polyline.addInitHook(function fn(this: L.Polyline) {
    this.type = CONST_VECTOR_TYPES.POLYLINE;
});

/*-----------------------------------------------------------------------------
 *
 * L.Polygon configuration
 *
 *---------------------------------------------------------------------------*/

L.Polygon.addInitHook(function fn(this: L.Polygon) {
    this.type = CONST_VECTOR_TYPES.POLYGON;
});

/*-----------------------------------------------------------------------------
 *
 * L.Marker and L.MarkerCluster configuration
 *
 *---------------------------------------------------------------------------*/
declare module 'leaflet' {
    interface MarkerCluster {
        spiderfy: () => void;
        getAllChildMarkers(): L.MarkerClusterElement[];
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
    interface MarkerClusterGroupOptions {
        id?: string;
        visible?: boolean;
        on?: Record<string, L.LeafletEventHandlerFn>;
    }

    interface FeatureGroup {
        visible: boolean;
    }

    interface MarkerClusterGroup {
        visible: boolean;
        type: string;
    }
}

L.FeatureGroup.addInitHook(function fn(this: L.FeatureGroup | L.MarkerClusterGroup) {
    this.visible = !!(this.options as L.MarkerClusterGroupOptions).visible;
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
        id: string | undefined;
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
