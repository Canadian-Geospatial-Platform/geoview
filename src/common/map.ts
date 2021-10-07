import { LatLngBounds } from 'leaflet';
import screenfull from 'screenfull';
import { TypeMapOptions } from '../types/cgpv-types';

// LCC map options
// ! Map bounds doesn't work for projection other then Web Mercator
const lccMapOptionsParam: TypeMapOptions = {
    zoomFactor: 7,
    minZoom: 3,
    maxZooom: 19,
};

// Web Mercator map options
const wmMapOptionsParam: TypeMapOptions = {
    zoomFactor: 5,
    minZoom: 2,
    maxZooom: 19,
    maxBounds: new LatLngBounds({ lat: -89.999, lng: -180 }, { lat: 89.999, lng: 180 }),
    maxBoundsViscosity: 0.0,
};

export function getMapOptions(epsgCode: number): TypeMapOptions {
    return epsgCode === 3978 ? lccMapOptionsParam : wmMapOptionsParam;
}

/**
 * Toggles fullscreen for the app.
 *
 * @memberof MapInstance
 */
export function toggleFullscreen(element: HTMLElement): void {
    if (screenfull.isEnabled) {
        // TODO: check if needed
        // DomUtil.hasClass(mapElem, 'leaflet-pseudo-fullscreen') ? DomUtil.removeClass(mapElem, 'leaflet-pseudo-fullscreen') : DomUtil.addClass(mapElem, 'leaflet-pseudo-fullscreen');
        // DomUtil.hasClass(mapElem, 'leaflet-fullscreen-on') ? DomUtil.removeClass(mapElem, 'leaflet-fullscreen-on') : DomUtil.addClass(mapElem, 'leaflet-fullscreen-on');
        // toogle fullscreen
        screenfull.toggle(element);
    }
}
