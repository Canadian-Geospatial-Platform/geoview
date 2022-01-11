/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-underscore-dangle */
import L, { LeafletEventHandlerFn } from 'leaflet';
import 'leaflet.markercluster/src';

import { api } from '../../api/api';
import { EVENT_NAMES } from '../../api/event';
import { TypeIconCreationFunction } from '../../types/cgpv-types';
import * as MarkerDefinitions from '../../../public/markers/marker-definitions';

let { unselectedMarkerIconCreator, selectedMarkerIconCreator } = MarkerDefinitions;

/**
 * MarkerClusterElement is a child of the leaflet Marker class. It has
 * some extra attributes and methodes.
 */
export const MarkerClusterElement = L.Marker.extend({
    initialize(latLng: L.LatLng, options: L.MarkerClusterElementOptions) {
        // call the L.Marker leaflet initialize methode (constructor)
        L.Marker.prototype.initialize.call(this, latLng, {
            ...options,
        });

        if (this.options && this.options.id) this.id = this.options.id;
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

    /**
     * set the selectedMarkerIconCreator function to be used when creating a normal
     * selected marker that is part of cluster groups
     *
     * @param {TypeIconCreationFunction} f: a function returning a L.DivIcon
     */
    setSelectedMarkerIconCreator(f: TypeIconCreationFunction) {
        selectedMarkerIconCreator = f;
    },

    /**
     * set the unselectedMarkerIconCreator function to be used when creating a normal
     * unselected marker that is part of cluster groups
     *
     * @param {TypeIconCreationFunction} f: a function returning a L.DivIcon
     */
    setUnselectedMarkerIconCreator(f: TypeIconCreationFunction) {
        unselectedMarkerIconCreator = f;
    },

    /**
     * get the selectedMarkerIcon to be used when creating a normal
     * selected marker that is part of cluster groups
     *
     * @returns {L.DivIcon} the selected marker icon
     */
    getSelectedMarkerIcon() {
        return selectedMarkerIconCreator();
    },

    /**
     * get the unselectedMarkerIcon to be used when creating a normal
     * unselected marker that is part of cluster groups
     *
     * @returns {L.DivIcon} the unselected marker icon
     */
    getUnselectedMarkerIcon() {
        return unselectedMarkerIconCreator();
    },

    setSelectedFlag(newValue: boolean) {
        this.selected = newValue;
        this.options.selected = newValue;
        if (newValue) {
            this.setIcon(this.getSelectedMarkerIcon());
        } else {
            this.setIcon(this.getUnselectedMarkerIcon());
        }
        api.event.emit(EVENT_NAMES.EVENT_CLUSTER_ELEMENT_SELECTION_HAS_CHANGED, this.options.mapId, this);
    },

    startBlinking() {
        this.blinking = true;
        this.options.blinking = true;
        L.DomUtil.addClass(this.options.icon.options, 'blinking-icon-enabled');
        if (this._icon) L.DomUtil.addClass(this._icon, 'blinking-icon-enabled');
        api.event.emit(EVENT_NAMES.EVENT_CLUSTER_ELEMENT_START_BLINKING, this.options.mapId, this);
    },

    stopBlinking() {
        this.blinking = false;
        this.options.blinking = false;
        L.DomUtil.removeClass(this.options.icon.options, 'blinking-icon-enabled');
        if (this._icon) L.DomUtil.removeClass(this._icon, 'blinking-icon-enabled');
        api.event.emit(EVENT_NAMES.EVENT_CLUSTER_ELEMENT_STOP_BLINKING, this.options.mapId, this);
    },
});

/**
 * this method is called right after the constructor chain has been called
 * it sets the type attribute of the marker cluster element
 */
MarkerClusterElement.addInitHook(function fn(this: L.MarkerClusterElement) {
    this.type = 'marker_cluster_element';
});

// any is used here because attribute L.MarkerClusterElement doesn't exist
// and we want to attach the L.Marker child MarkerClusterElement to L
(L as any).MarkerClusterElement = MarkerClusterElement;

// any is used here because attribute L.MarkerClusterElement.setSelectedMarkerIconCreator doesn't exist
// and we want to define L.MarkerClusterElement.setSelectedMarkerIconCreator as a static class method
(L as any).MarkerClusterElement.setSelectedMarkerIconCreator = function setSelectedMarkerIconCreator(f: TypeIconCreationFunction) {
    MarkerClusterElement.prototype.setSelectedMarkerIconCreator.call(null, f);
};

// any is used here because attribute L.MarkerClusterElement.setUnselectedMarkerIconCreator doesn't exist
// and we want to define L.MarkerClusterElement.setUnselectedMarkerIconCreator as a static class method
(L as any).MarkerClusterElement.setUnselectedMarkerIconCreator = function setUnselectedMarkerIconCreator(f: TypeIconCreationFunction) {
    MarkerClusterElement.prototype.setUnselectedMarkerIconCreator.call(null, f);
};

/**
 *  Define a factory function. Most Leaflet classes have a corresponding
 * factory function. A factory function has the same name as the class,
 * but in lowerCamelCase instead of UpperCamelCase
 */
L.markerClusterElement = function markerClusterElement(latLng, options) {
    return new (L as any).MarkerClusterElement(latLng, options);
};
