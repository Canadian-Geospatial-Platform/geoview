/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-underscore-dangle */
import L, { LeafletEventHandlerFn } from 'leaflet';
import 'leaflet.markercluster/src';
import './marker-cluster-element.d';

import { TypeIconCreationFunction } from '../../types/cgpv-types';
import * as MarkerDefinitions from '../../../public/markers/marker-definitions';

let { unselectedMarkerIconCreator, selectedMarkerIconCreator } = MarkerDefinitions;

/**
 * set the selectedMarkerIconCreator function to be used when creating a normal
 * selected marker that is part of cluster groups
 *
 * @param {TypeIconCreationFunction} options marker options including styling
 */
export const setSelectedMarkerIconCreator = (f: TypeIconCreationFunction): void => {
    selectedMarkerIconCreator = f;
};

/**
 * set the unselectedMarkerIconCreator function to be used when creating a normal
 * unselected marker that is part of cluster groups
 *
 * @param {TypeIconCreationFunction} options marker options including styling
 */
export const setUnselectedMarkerIconCreator = (f: TypeIconCreationFunction): void => {
    unselectedMarkerIconCreator = f;
};

/**
 * get the selectedMarkerIcon to be used when creating a normal
 * selected marker that is part of cluster groups
 *
 * @param {TypeIconCreationFunction} options marker options including styling
 */
export const getSelectedMarkerIcon = (): L.DivIcon => {
    return selectedMarkerIconCreator();
};

/**
 * get the unselectedMarkerIcon to be used when creating a normal
 * unselected marker that is part of cluster groups
 *
 * @param {TypeIconCreationFunction} options marker options including styling
 */
export const getUnselectedMarkerIcon = (): L.DivIcon => {
    return unselectedMarkerIconCreator();
};

export const MarkerClusterElement = L.Marker.extend({
    initialize(latLng: L.LatLng, options: L.MarkerClusterElementOptions) {
        (L.Marker.prototype as any).initialize.call(this, latLng, {
            ...options,
        });

        this.selected = !!this.options.selected;
        this.blinking = !!this.options.blinking;

        if (this.selected) {
            this.setIcon(selectedMarkerIconCreator());
        } else {
            this.setIcon(unselectedMarkerIconCreator());
        }

        if (this.blinking) this.startBlinking();

        if (options.on) {
            const onHandlerDefinitions = Object.entries(options.on);
            onHandlerDefinitions.forEach((handlerDefinition: [string, LeafletEventHandlerFn]) => {
                this.on(handlerDefinition[0], handlerDefinition[1]);
            });
            this.type = 'marker_cluster_element';
        }
    },

    startBlinking() {
        this.blinking = true;
        this.options.blinking = true;
        this.options.icon.options.className += ' blinking-icon-enabled';
        if (this._icon) L.DomUtil.addClass(this._icon, 'blinking-icon-enabled');
    },

    stopBlinking() {
        this.blinking = false;
        this.options.blinking = false;
        this.options.icon.options.className = this.options.icon.options.className.replace(' blinking-icon-enabled', '');
        if (this._icon) L.DomUtil.removeClass(this._icon, 'blinking-icon-enabled');
    },
});

MarkerClusterElement.addInitHook(function fn(this: L.MarkerClusterElement) {
    this.type = 'marker_cluster_element';
});
(L as any).MarkerClusterElement = MarkerClusterElement;

L.markerClusterElement = function markerClusterElement(latLng, options) {
    return new (L as any).MarkerClusterElement(latLng, options);
};
