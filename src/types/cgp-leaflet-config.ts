/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-underscore-dangle */
import L, { Util, LatLngBounds } from 'leaflet';
import * as DomUtil from 'leaflet/src/dom/DomUtil';
import * as DomEvent from 'leaflet/src/dom/DomEvent';

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
        if (!e.shiftKey || e.altKey || e.ctrlKey || (e.which !== 1 && e.button !== 1)) return;

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
        if (!e.shiftKey || !e.altKey || e.ctrlKey || (e.which !== 1 && e.button !== 1)) return;

        this._finish();

        if (!this._moved) return;
        // Postpone to next JS tick so internal click event handling
        // still see it as "moved".
        this._clearDeferredResetState();
        this._resetStateTimeout = setTimeout(Util.bind(this._resetState, this), 0);

        const bounds = new LatLngBounds(this._map.containerPointToLatLng(this._startPoint), this._map.containerPointToLatLng(this._point));

        this._map.fire('boxselectend', { boxZoomBounds: bounds });
    },
});

// L.Map.addInitHook('addHandler', 'boxZoom', BoxZoom);
L.Map.addInitHook('addHandler', 'selectBox', SelectBox);
