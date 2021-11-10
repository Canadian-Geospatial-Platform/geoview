/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable no-plusplus */
import L from 'leaflet';
import 'leaflet.markercluster/src';

import { EVENT_NAMES } from '../../api/event';
import { api } from '../../api/api';
import { generateId } from '../constant';
import { TypeStampedIconCreationFunction } from '../../types/cgpv-types';
import './marker-cluster-element';

import * as MarkerDefinitions from '../../../public/markers/marker-definitions';

let { getClusterIconFull, getClusterIconPart, getClusterIconEmpty } = MarkerDefinitions;

/**
 * function used for creating a marker cluster icon
 *
 * @param {MarkerCluster}  cluster in which the marker will be created
 *
 * @returns {L.DivIcon} the icon to be used by the marker
 */
const createMarkerIcon = (cluster: L.MarkerCluster): L.DivIcon => {
    let icon: L.DivIcon;
    let numberOfSelectedIcons = 0;
    let blinkingIcon = false;
    const markers = cluster.getAllChildMarkers();
    for (let i = 0; i < markers.length; i++) {
        if (markers[i].options.selected) numberOfSelectedIcons++;
        blinkingIcon = blinkingIcon || markers[i].blinking;
    }

    const Stamp = `${numberOfSelectedIcons}/${markers.length}`;
    if (numberOfSelectedIcons === 0) {
        icon = getClusterIconEmpty(Stamp);
    } else if (numberOfSelectedIcons === markers.length) {
        icon = getClusterIconFull(Stamp);
    } else {
        icon = getClusterIconPart(Stamp);
    }

    if (blinkingIcon) L.DomUtil.addClass(icon.options as HTMLElement, 'blinking-icon-enabled');

    return icon;
};

// default options used by cluster groups
export const defaultClusterGroupOptions: L.MarkerClusterGroupOptions = {
    maxClusterRadius: 25,
    iconCreateFunction: createMarkerIcon,
    animate: false,
    zoomToBoundsOnClick: false,
    spiderfyOnMaxZoom: false,
    removeOutsideVisibleBounds: false,
};

/**
 * function used for creating a spiderfied marker cluster icon
 *
 * @param {MarkerCluster}  cluster in which the marker will be created
 *
 * @returns {L.DivIcon} the icon to be used by the marker
 */
const createSpiderfiedMarkerIcon = (cluster: L.MarkerCluster): L.DivIcon => {
    const icon = createMarkerIcon(cluster);
    icon.options.className = 'leaflet-marker-icon cluster-div-icon spiderfied-marker';

    return icon;
};

// default options used by spiderfied cluster groups
export const defaultSpiderfiedClusterGroupOptions: L.MarkerClusterGroupOptions = {
    maxClusterRadius: 100,
    iconCreateFunction: createSpiderfiedMarkerIcon,
    animate: false,
    zoomToBoundsOnClick: false,
    spiderfyOnMaxZoom: false,
    removeOutsideVisibleBounds: false,
    visible: true,
};

/**
 * Class used to manage marker groups
 *
 * @export
 * @class MarkerCluster
 */
export class MarkerCluster {
    // reference to the map object
    private markerClusterMap: L.Map;

    // used to store marker cluster groups
    clusterGroups: L.MarkerClusterGroup[] = [];

    // contains all the added marker cluster elements
    markerClusterElements: L.MarkerClusterElement[] = [];

    // used to store the blinking marker cluster elements
    blinkingElement: L.MarkerClusterElement | null = null;

    // used to store the blinking marker cluster elements
    disableblinkingEvent = false;

    // used to store the spiderfied version of a marker cluster when we click on it
    spiderfiedMarkerGroup: L.MarkerClusterGroup;

    // used to indicate that we are in the spiderfy mode
    spiderfiedModeOn = false;

    // index of the active marker cluster group used to add new marker cluster in the map
    activeClusterGroupIndex = 0;

    // default marker cluster group name
    defaultClusterGroupID = 'defaultClusterGroup';

    // options used by cluster groups
    clusterGroupOptions = defaultClusterGroupOptions;

    // options used by the spiderfied cluster groups
    spiderfiedClusterGroupOptions = defaultSpiderfiedClusterGroupOptions;

    // Flag used to restore the last spiderfied marker that was unspiderfy by
    // the EVENT_BOX_SELECT_END handler without our consentment. The respiderfy
    // operation also refresh the marker if it has changed.
    respiderfyTheLastSpiderfiedClusterGroup = false;

    // We need o copy of the event that triggered the last spiderfy operation
    // if we want to be able to restore it (see above).
    lastUnspidefiedClusterGroupEvent: L.MarkerClusterMouseEvent | undefined;

    /**
     * set the selectedMarkerIconCreator function to be used when creating a normal
     * selected marker that is part of cluster groups
     *
     * @param {TypeIconCreationFunction} options marker options including styling
     * /
    setSelectedMarkerIconCreator = setSelectedMarkerIconCreator;

    /**
     * set the unselectedMarkerIconCreator function to be used when creating a normal
     * unselected marker that is part of cluster groups
     *
     * @param {TypeIconCreationFunction} options marker options including styling
     * /
    setUnselectedMarkerIconCreator = setUnselectedMarkerIconCreator;

    /**
     * Initialize map, MarkerCluster, and listen to add marker cluster events
     *
     * @param {Map} map leaflet map object
     */
    constructor(map: L.Map) {
        this.markerClusterMap = map;

        // initialize clusterGroupOptions
        this.setClusterGroupOptions(defaultClusterGroupOptions);
        // create default cluster group and set it as visible
        this.createClusterGroup(this.defaultClusterGroupID, this.clusterGroupOptions);

        // initialize spiderfiedClusterGroupOptions
        this.setSpiderfiedClusterGroupOptions(defaultSpiderfiedClusterGroupOptions);
        // create a spiderfied marker cluster group
        this.spiderfiedMarkerGroup = this.newClusterGroupInstance('SpiderfiedClusterGroup', this.spiderfiedClusterGroupOptions);

        // listen to marker cluster element start blinking events
        api.event.on(EVENT_NAMES.EVENT_CLUSTER_ELEMENT_START_BLINKING, (payload: L.MarkerClusterElement) => {
            if (this.disableblinkingEvent) return;
            if (this.blinkingElement && this.blinkingElement.id !== payload.id) {
                const blinkingElementId = this.blinkingElement.id;
                if (this.spiderfiedModeOn) {
                    const spiderfiedVersion = this.getSpiderfiedMarkerClusterElement(blinkingElementId);
                    if (spiderfiedVersion) spiderfiedVersion.stopBlinking();
                }
                const unspiderfiedVersion = this.getMarkerClusterElement(blinkingElementId);
                if (unspiderfiedVersion) unspiderfiedVersion.stopBlinking();
            }
            this.blinkingElement = this.getMarkerClusterElement(payload.id);
            if (!this.blinkingElement) this.blinkingElement = payload;
        });

        // listen to marker cluster element stop blinking events
        api.event.on(EVENT_NAMES.EVENT_CLUSTER_ELEMENT_STOP_BLINKING, (payload: L.MarkerClusterElement) => {
            if (this.disableblinkingEvent) return;
            if (this.blinkingElement && this.blinkingElement.id === payload.id) {
                this.blinkingElement = null;
            }
        });

        // listen to add marker cluster events
        api.event.on(EVENT_NAMES.EVENT_CLUSTER_ELEMENT_ADD, (payload) => {
            const id = payload.id ? payload.id : null;
            this.addMarkerElement(payload.latitude, payload.longitude, payload.options, id);
        });

        // listen to outside events to remove a marker cluster element
        api.event.on(EVENT_NAMES.EVENT_CLUSTER_ELEMENT_REMOVE, (payload) => {
            // remove marker cluster from outside
            this.deleteMarkerClusterElement(payload.id);
        });

        // listen to outside events to process select by bounding polygone
        api.event.on(EVENT_NAMES.EVENT_BOX_SELECT_END, (payload) => {
            // Get the select bounding box.
            const bbox: L.LatLngBounds = payload.selectBoxBounds;
            if (this.spiderfiedModeOn) {
                // In spiderfied mode, only one marker cluster is displayed and it is spiderfied.
                // Get the spiderfied maker cluster elements.
                const markerClusterElements = this.spiderfiedMarkerGroup.getLayers();
                for (let i = 0; i < markerClusterElements.length; i++) {
                    // Test the spiderfied maker cluster elements to find those that are inside the selection box.
                    if (bbox.contains(markerClusterElements[i].getLatLng())) {
                        // Since spiderfied markers are clones, find the originals and toggle the selected flag.
                        const originalMarker = this.getMarkerClusterElement(markerClusterElements[i].id);
                        originalMarker.setSelectedFlag(!originalMarker.selected);
                        // Refresh all marker cluster groups that contain the updated original marker
                        // so the marker cluster they contains reflect the new reality
                        this.getClusterGroupsByMarkerId(originalMarker.id).forEach((masterClusterGroup) => {
                            masterClusterGroup.refreshClusters();
                        });
                        // Also, refresh the blinking css of the modified marker
                        this.controlClickOnMarkerElement(originalMarker, 'refresh');
                    }
                }
                // Set the flag used to restore the last spiderfied marker that was unspiderfy by
                // the this handler without our consentment. The respiderfy operation also refresh
                // the spiderfied marker if it has changed.
                this.respiderfyTheLastSpiderfiedClusterGroup = true;
            } else {
                // for each visible marker cluster groups...
                for (let i = 0; i < this.clusterGroups.length; i++) {
                    if (this.clusterGroups[i].options.visible) {
                        // get the marker cluster elements it contains...
                        const markerClusterElements = this.clusterGroups[i].getLayers();
                        // for each marker cluster element...
                        for (let j = 0; j < markerClusterElements.length; j++) {
                            // get the visible marker, it may be an element or a cluster...
                            const visibleMarker = this.clusterGroups[i].getVisibleParent(markerClusterElements[j]);
                            // if it is in the selection box...
                            if (bbox.contains(visibleMarker.getLatLng())) {
                                // toggle the selected flag
                                markerClusterElements[j].setSelectedFlag(!markerClusterElements[j].selected);
                                // Refresh all marker cluster groups that contain the updated marker
                                // so the marker cluster they contains reflect the new reality
                                this.getClusterGroupsByMarkerId(markerClusterElements[j].id).forEach((masterClusterGroup) => {
                                    masterClusterGroup.refreshClusters();
                                });
                                // Also, refresh the blinking css of the modified marker
                                this.controlClickOnMarkerElement(markerClusterElements[j], 'refresh');
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * set the getClusterIconEmpty function to be used when creating marker cluster groups
     * that contain no selected marker
     *
     * @param {TypeStampedIconCreationFunction} a function that returns a L.DivIcon for empty selection
     */
    setGetClusterIconEmpty = (f: TypeStampedIconCreationFunction): void => {
        getClusterIconEmpty = f;
    };

    /**
     * set the getClusterIconPart function to be used when creating marker cluster groups
     * that contain some selected markers
     *
     * @param {TypeStampedIconCreationFunction} a function that returns a L.DivIcon for partial selection
     */
    setGetClusterIconPart = (f: TypeStampedIconCreationFunction): void => {
        getClusterIconPart = f;
    };

    /**
     * set the getClusterIconFull function to be used when creating marker cluster groups
     * that contain only selected markers
     *
     * @param {TypeStampedIconCreationFunction} a function that returns a L.DivIcon for full selection
     */
    setGetClusterIconFull = (f: TypeStampedIconCreationFunction): void => {
        getClusterIconFull = f;
    };

    /**
     * set the default cluster group options
     *
     * @param {MarkerClusterGroupOptions} options marker options including styling
     */
    setClusterGroupOptions = (options: L.MarkerClusterGroupOptions): void => {
        this.clusterGroupOptions = {
            ...options,
            on: {
                clusterclick: this.onClusterClick,
            },
        };
    };

    /**
     * set the spiderfied default cluster group options
     *
     * @param {MarkerClusterGroupOptions} options marker options including styling
     */
    setSpiderfiedClusterGroupOptions = (options: L.MarkerClusterGroupOptions): void => {
        this.spiderfiedClusterGroupOptions = {
            ...options,
            on: {
                clusterclick: this.onSpiderfiedClusterClick,
                unspiderfied: this.onUnspiderfyCluster,
            },
        };
    };

    /**
     * Create a new marker cluster element
     *
     * @param {string} markerId the id of this marker cluster element
     * @param {number} latitude the latitude position of the marker
     * @param {number} longitude the longitude position of the marker
     * @param {TypeMarkerClusterOptions} options marker options including styling
     *
     * @returns a marker cluster element with the id, the selected flag and the created marker layer
     */
    private createMarkerElement = (
        markerId: string,
        latitude: number,
        longitude: number,
        options: L.MarkerClusterElementOptions
    ): L.MarkerClusterElement => {
        const marker = L.markerClusterElement([latitude, longitude], {
            ...options,
            id: markerId,
        });
        marker.on('click', this.onMarkerElementClick);

        return marker;
    };

    /**
     * Create and add a new marker cluster element
     *
     * @param {number} latitude the latitude position of the marker
     * @param {number} longitude the longitude position of the marker
     * @param {L.MarkerClusterElementOptions} options marker options including styling
     * @param {string} id an optional id to be used to manage this marker cluster
     *
     * @returns {L.MarkerClusterElement} the created marker cluster element.
     */
    addMarkerElement = (
        latitude: number,
        longitude: number,
        options: L.MarkerClusterElementOptions,
        id?: string
    ): L.MarkerClusterElement => {
        const MarkerClusterElementId = generateId(id);

        const marker = this.createMarkerElement(MarkerClusterElementId, latitude, longitude, {
            ...options,
            mapId: this.markerClusterMap.id,
        });

        this.markerClusterElements.push(marker);
        marker.addTo(this.clusterGroups[this.activeClusterGroupIndex]);

        // emit an event that a marker vector has been added
        api.event.emit(EVENT_NAMES.EVENT_CLUSTER_ELEMENT_ADDED, this.markerClusterMap.id, { ...marker });

        return marker;
    };

    /**
     * Find a marker cluster element using it's id
     *
     * @param {string} id the id of the marker cluster element to return
     *
     * @returns {L.MarkerClusterElement} a marker cluster element having the specified id
     */
    getMarkerClusterElement = (id: string): L.MarkerClusterElement => {
        return this.markerClusterElements.filter((layer) => layer.id === id)[0];
    };

    /**
     * Find a marker cluster element in the spiderfied group using it's id
     *
     * @param {string} id the id of the marker cluster to return
     *
     * @returns {L.MarkerClusterElement} a marker cluster element with the specified id
     */
    getSpiderfiedMarkerClusterElement = (id: string): L.MarkerClusterElement | null => {
        let returnValue: L.MarkerClusterElement | null = null;
        this.spiderfiedMarkerGroup.eachLayer((marker) => {
            if (marker.id === id) returnValue = marker;
        });

        return returnValue;
    };

    /**
     * Find the groups that contain the marker cluster element using it's id
     *
     * @param {string} id the id of the marker cluster element
     *
     * @returns {MarkerClusterGroup | null} the groups that contain the marker cluster
     *                                      or null if not found
     */
    getClusterGroupsByMarkerId = (id: string): L.MarkerClusterGroup[] => {
        const returnValue: L.MarkerClusterGroup[] = [];
        for (let i = 0; i < this.clusterGroups.length; i++) {
            const markerClusterElements = this.clusterGroups[i].getLayers();
            for (let j = 0; j < markerClusterElements.length; j++) {
                const markerClusterElement = markerClusterElements[j];
                if (markerClusterElement.id === id) returnValue.push(this.clusterGroups[i]);
            }
        }

        return returnValue;
    };

    /**
     * Create a new marker cluster group instance
     *
     * @param {string} clusterGroupid the id of the marker cluster group
     * @param {MarkerClusterGroupOptions} options marker cluster group options
     *
     * @returns {L.MarkerClusterGroup} the new marker cluster group instance
     */
    newClusterGroupInstance = (clusterGroupid: string, options: L.MarkerClusterGroupOptions): L.MarkerClusterGroup => {
        const clusterGroup = L.markerClusterGroup({ ...options, id: clusterGroupid });

        if (options.on) {
            const onHandlerDefinitions = Object.entries(options.on);
            onHandlerDefinitions.forEach((handlerDefinition) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                clusterGroup.on(handlerDefinition[0] as any, handlerDefinition[1]);
            });
        }

        if (clusterGroup.options.visible) {
            clusterGroup.addTo(this.markerClusterMap);
        }

        return clusterGroup;
    };

    /**
     * Create a new marker cluster group in the clusterGroups attribute to manage multiple marker at once
     *
     * @param {string} clusterGroupid the id of the marker cluster group to use when managing this group
     * @param {MarkerClusterGroupOptions>} options marker cluster group options
     */
    createClusterGroup = (clusterGroupid: string, options?: L.MarkerClusterGroupOptions): L.MarkerClusterGroup => {
        let markerClusterGroup = this.getMarkerClusterGroup(clusterGroupid);
        if (!markerClusterGroup) {
            const markerClusterGroupOptions = options || this.clusterGroupOptions;
            markerClusterGroup = this.newClusterGroupInstance(clusterGroupid, markerClusterGroupOptions);
            if (markerClusterGroup.visible) {
                markerClusterGroup.addTo(this.markerClusterMap);
            }
            this.clusterGroups.push(markerClusterGroup);
        }

        return markerClusterGroup;
    };

    /**
     * set the active marker cluster group (the cluster group used when adding marker cluster elements)
     *
     * @param {string} clusterGroupid optional the id of the marker cluster group to set as active
     */
    setActiveClusterGroup = (clusterGroupid?: string): void => {
        // if group name not give, select the default group
        const groupId = clusterGroupid || this.defaultClusterGroupID;
        for (let i = 0; i < this.clusterGroups.length; i++) {
            if (this.clusterGroups[i].id === groupId) {
                this.activeClusterGroupIndex = i;
                break;
            }
        }
    };

    /**
     * Get the active marker cluster group
     *
     * @returns {L.MarkerClusterGroup} the active marker cluster group
     */
    getActiveGeometryGroup = (): L.MarkerClusterGroup => {
        return this.clusterGroups[this.activeClusterGroupIndex];
    };

    /**
     * set the identified marker cluster group as visible on the map
     * if clusterGroupid is not provided, the active marker cluster group is used
     *
     * @param {string} clusterGroupid optional the id of the marker cluster group to show on the map
     */
    setClusterGroupAsVisible = (clusterGroupid?: string): void => {
        const clusterGroup = this.getMarkerClusterGroup(clusterGroupid);
        clusterGroup.addTo(this.markerClusterMap);
        clusterGroup.options.visible = true;
        clusterGroup.visible = true;
    };

    /**
     * set the identified marker cluster group as visible on the map
     * if clusterGroupid is not provided, the active marker cluster group is used
     *
     * @param {string} clusterGroupid optional the id of the marker cluster group to show on the map
     */
    setClusterGroupAsInvisible = (clusterGroupid?: string): void => {
        const clusterGroup = this.getMarkerClusterGroup(clusterGroupid);
        clusterGroup.removeFrom(this.markerClusterMap);
        clusterGroup.options.visible = false;
        clusterGroup.visible = false;
    };

    /**
     * Turn on the cluster groups that are flaged as visible. The visible flag and options
     * remain unchanged, this allow us to turn on and off the cluster groups to temporarily
     * hide them.
     */
    turnOnGeometryGroups = (): void => {
        for (let i = 0; i < this.clusterGroups.length; i++) {
            if (this.clusterGroups[i].visible) this.clusterGroups[i].addTo(this.markerClusterMap);
        }
    };

    /**
     * Turn off the cluster groups that are flaged as visible. The visible flag and options
     * remain unchanged, this allow us to turn on and off the cluster groups to temporarily
     * hide them.
     */
    turnOffGeometryGroups = (): void => {
        for (let i = 0; i < this.clusterGroups.length; i++) {
            if (this.clusterGroups[i].visible) this.clusterGroups[i].removeFrom(this.markerClusterMap);
        }
    };

    /**
     * Get the marker cluster group whose id is equal to the clusterGroupid parameter
     * if clusterGroupid is not provided, return the active marker cluster group
     *
     * @param {string} clusterGroupid the id of the marker cluster group to return
     *
     * @returns the marker cluster group
     */
    getMarkerClusterGroup = (clusterGroupid?: string): L.MarkerClusterGroup => {
        let markerClusterGroup: L.MarkerClusterGroup;
        if (clusterGroupid) {
            [markerClusterGroup] = this.clusterGroups.filter((clusterGroup) => clusterGroup.id === clusterGroupid);
        } else {
            markerClusterGroup = this.clusterGroups[this.activeClusterGroupIndex];
        }

        return markerClusterGroup;
    };

    /**
     * Delete a marker cluster element using the id and delete it from the groups and the map
     *
     * @param {string} id the id of the geometry to delete
     */
    deleteMarkerClusterElement = (id: string): void => {
        for (let i = 0; i < this.markerClusterElements.length; i++) {
            if (this.markerClusterElements[i].id === id) {
                this.deleteMarkerClusterElementFromGroups(id);

                this.markerClusterElements[i].remove();

                this.markerClusterElements.splice(i, 1);

                break;
            }
        }
    };

    /**
     * Add a new marker cluster element to the group whose identifier is equal to clusterGroupId.
     * if clusterGroupId is not provided, use the active cluster group. If the
     * cluster group doesn't exist, create it.
     *
     * @param {L.MarkerClusterElement} the marker cluster element to be added to the group
     * @param {string} geometryGroupId optional id of the group to add the geometry to
     */
    addElementToMarkerClusterGroup = (markerClusterElement: L.MarkerClusterElement, clusterGroupId?: string): void => {
        let markerClusterGroup: L.MarkerClusterGroup;
        if (clusterGroupId) {
            // create marker cluster group if it does not exist
            markerClusterGroup = this.createClusterGroup(clusterGroupId);
        } else {
            markerClusterGroup = this.clusterGroups[this.activeClusterGroupIndex];
        }

        markerClusterGroup.addLayer(markerClusterElement);
    };

    /**
     * Find the groups that the marker cluster element exists in and delete it from those groups
     *
     * @param {string} markerClusterElementId the marker cluster element id
     */
    deleteMarkerClusterElementFromGroups = (markerClusterElementId: string): void => {
        const markerClusterElement = this.getMarkerClusterElement(markerClusterElementId);
        for (let i = 0; i < this.clusterGroups.length; i++) {
            this.clusterGroups[i].getLayers().forEach((layer) => {
                if (markerClusterElement === layer) {
                    this.clusterGroups[i].removeLayer(layer);
                }
            });
        }
    };

    /**
     * Delete a specific marker cluster element from a group using their ids
     * If clusterGroupid is not provided, the active marker cluster group is used.
     *
     * @param {string} markerClusterElementId the marker cluster id to be deleted
     * @param {string} clusterGroupid optional group id
     */
    deleteMarkerClusterFromGroup = (markerClusterElementId: string, clusterGroupid?: string): void => {
        const markerClusterElement = this.getMarkerClusterElement(markerClusterElementId);
        const clusterGroup = this.getMarkerClusterGroup(clusterGroupid);
        clusterGroup.getLayers().forEach((layer) => {
            if (markerClusterElement === layer) {
                clusterGroup.removeLayer(layer);
            }
        });
    };

    /**
     * Delete all marker cluster elements from the marker cluster group but keep the group.
     * If clusterGroupid is not provided, the active marker cluster group is used.
     *
     * @param {string} clusterGroupid optional group id
     *
     * @returns {L.MarkerClusterGroup} the marker cluster group used by the méthode
     */
    deleteMarkerClusterElementsFromGroup = (clusterGroupid?: string): L.MarkerClusterGroup => {
        const clusterGroup = this.getMarkerClusterGroup(clusterGroupid);
        clusterGroup.clearLayers();
        return clusterGroup;
    };

    /**
     * Delete a marker cluster group and all the marker cluster elements from the map.
     * If clusterGroupid is not provided, the active marker cluster group is used.
     * The default marker cluster group can't be deleted.
     *
     * @param {string} clusterGroupid optional id of the marker cluster group to delete
     */
    deleteMarkerClusterGroup = (clusterGroupid?: string): void => {
        const clusterGroup = this.deleteMarkerClusterElementsFromGroup(clusterGroupid);
        if (clusterGroup.id !== this.defaultClusterGroupID) {
            for (let i = 0; i < this.clusterGroups.length; i++) {
                if (this.clusterGroups[i].id === clusterGroup.id) {
                    this.clusterGroups.splice(i, 1);
                }
            }
        }
    };

    /**
     * Event handler triggered when we click on a marker cluster saved in a marker cluster group
     *
     * @param {MarkerClusterMouseEvent} event the event information
     */
    onClusterClick = (event: L.MarkerClusterMouseEvent): void => {
        if (!event.originalEvent.shiftKey && !event.originalEvent.ctrlKey && event.originalEvent.altKey) {
            // toggle the cluster selection of the cluster you alt-clicked on (i.e.: selected becomes unselected and inversly)
            this.altClickOnMarkerCluster(event.propagatedFrom.getAllChildMarkers(), event.target);
        } else if (event.originalEvent.shiftKey && !event.originalEvent.ctrlKey && !event.originalEvent.altKey) {
            // zoom to the cluster you shift clicked on
            event.propagatedFrom.zoomToBounds({ padding: [20, 20] });
        } else if (!event.originalEvent.shiftKey && !event.originalEvent.ctrlKey && !event.originalEvent.altKey) {
            // spiderfy the cluster you clicked on (i.e.: hide everything but a spider version of the cluster)
            event.propagatedFrom.unspiderfy();
            if (!this.respiderfyTheLastSpiderfiedClusterGroup) {
                this.lastUnspidefiedClusterGroupEvent = event;
            }
            this.clickOnMarkerCluster(event.propagatedFrom.getAllChildMarkers());
        }
    };

    /**
     * This private method is used when you click on a marker cluster. It spiderfies the cluster you clicked on
     * (i.e.: hide everything but a spider version of the cluster).
     *
     * @param {L.MarkerClusterElement[]} childMarkers the marker cluster elements that compopse the marker cluster.
     */
    private clickOnMarkerCluster = (childMarkers: L.MarkerClusterElement[]): void => {
        // activate spiderfied mode (this flag is used by event handler)
        this.spiderfiedModeOn = true;
        // disable blink events since the spiderfied marker cluster is a copy of the original cluster.
        // It is therefore not subject to events.
        this.disableblinkingEvent = true;
        // turn off all visible cluster groups
        this.clusterGroups.forEach((clusterGroup) => {
            if (clusterGroup.options.visible) clusterGroup.removeFrom(this.markerClusterMap);
        });
        // turn off all visible geometry groups
        api.event.emit(api.eventNames.EVENT_VECTOR_OFF, null, {});
        // Insert only the markers associated to the current group in the new spiderfied cluster
        // and keep a reference to the last child marker clone
        let i = 0;
        let clonedMarker: L.MarkerClusterElement;
        do {
            const sourceMarker = childMarkers[i];
            clonedMarker = this.createMarkerElement(
                sourceMarker.id,
                sourceMarker.getLatLng().lat,
                sourceMarker.getLatLng().lng,
                sourceMarker.options
            );
            clonedMarker.type = `spiderfied_${clonedMarker.type}`;
            clonedMarker.addTo(this.spiderfiedMarkerGroup);
            i++;
        } while (i < childMarkers.length);
        // Find the cluster marker and spiderfy it.
        this.spiderfiedMarkerGroup.getVisibleParent(clonedMarker).spiderfy();
        // spidefy operation done, deactivate spiderfied mode
        this.disableblinkingEvent = false;
    };

    /**
     * This private method is used when you alt-click on a marker cluster. It toggles the cluster selection
     * of the cluster you alt-clicked on.
     *
     * @param {L.MarkerClusterElement[]} childMarkers the marker cluster elements that compopse the marker cluster.
     * @param {L.MarkerClusterGroup} markerClusterGroup the marker cluster group that contains the marker cluster elements.
     */
    private altClickOnMarkerCluster = (childMarkers: L.MarkerClusterElement[], markerClusterGroup: L.MarkerClusterGroup): void => {
        for (let i = 0; i < childMarkers.length; i++) {
            // toggle the value of the selected flag
            childMarkers[i].setSelectedFlag(!childMarkers[i].selected);
        }
        markerClusterGroup.refreshClusters();
    };

    /**
     * Event handler triggered when we click on a spiderfied marker cluster
     * saved in a marker cluster group
     *
     * @param {MarkerClusterMouseEvent} event the event information
     */
    onSpiderfiedClusterClick = (event: L.MarkerClusterMouseEvent): void => {
        event.target.unspiderfy();
        // deactivate spiderfied mode
        this.spiderfiedModeOn = false;
    };

    /**
     * Event handler triggered when a spiderfied marker cluster returns to its
     * unspiderfied shape
     *
     * @param {MarkerClusterMouseEvent} event the event information
     */
    onUnspiderfyCluster = (event: L.MarkerClusterMouseEvent): void => {
        event.target.off('unspiderfied', this.onUnspiderfyCluster);
        this.spiderfiedMarkerGroup.clearLayers();
        this.spiderfiedMarkerGroup = this.newClusterGroupInstance('SpiderfiedClusterGroup', this.spiderfiedClusterGroupOptions);
        event.target.on('unspiderfied', this.onUnspiderfyCluster);
        // turn on all visible geometry groups
        api.event.emit(api.eventNames.EVENT_VECTOR_ON, null, {});
        // turn on all visible cluster group
        this.clusterGroups.forEach((clusterGroup) => {
            if (clusterGroup.options.visible) clusterGroup.addTo(this.markerClusterMap);
        });

        if (this.respiderfyTheLastSpiderfiedClusterGroup && this.lastUnspidefiedClusterGroupEvent) {
            this.lastUnspidefiedClusterGroupEvent.target.fire('click', this.lastUnspidefiedClusterGroupEvent, true);
            this.respiderfyTheLastSpiderfiedClusterGroup = false;
        } else {
            // deactivate spiderfied mode
            this.spiderfiedModeOn = false;
        }
    };

    /**
     * Event handler triggered when a marker element is clicked
     *
     * @param {LeafletMouseEvent} event the event information
     */
    onMarkerElementClick = (event: L.MarkerClusterElementMouseEvent): void => {
        const clickedMarker = event.target;
        if (!event.originalEvent.shiftKey && event.originalEvent.ctrlKey && !event.originalEvent.altKey) {
            this.controlClickOnMarkerElement(clickedMarker, 'toggle');
        } else if (event.originalEvent.shiftKey && !event.originalEvent.ctrlKey && !event.originalEvent.altKey) {
            // zoom to the element you shift clicked on
            // get the visible marker, it may be an element or a cluster...
            const originalMarker = this.spiderfiedModeOn ? this.getMarkerClusterElement(clickedMarker.id) : clickedMarker;
            this.markerClusterMap.fitBounds(
                L.latLngBounds(
                    [originalMarker.getLatLng().lat - 0.5, originalMarker.getLatLng().lng - 0.5],
                    [originalMarker.getLatLng().lat + 0.5, originalMarker.getLatLng().lng + 0.5]
                )
            );
        } else if (!event.originalEvent.shiftKey && !event.originalEvent.ctrlKey && event.originalEvent.altKey) {
            this.altClickOnMarkerElement(clickedMarker);
        }
    };

    /**
     * This private method is used to process ctrl-click made on a marker cluster element.
     *
     * @param {L.MarkerClusterElement} clickedMarker the marker cluster element that has been clicked on
     * @param {'refresh' | 'toggle'} action type of action to apply to the blinking flag
     */
    private controlClickOnMarkerElement = (clickedMarker: L.MarkerClusterElement, action: 'refresh' | 'toggle'): void => {
        const stopCondition = action === 'toggle' ? clickedMarker.blinking : !clickedMarker.blinking;

        // Update the clicked marker
        if (stopCondition) clickedMarker.stopBlinking();
        else clickedMarker.startBlinking();

        // in spiderfied mode the clicked marker is a copy of a marker saved in the markerClusterElements
        // array. So, we must retreive the original marker and update it.
        if (this.spiderfiedModeOn) {
            if (stopCondition) this.setMarkerElementBlinkingFlags(clickedMarker.id, false);
            else this.setMarkerElementBlinkingFlags(clickedMarker.id, true);

            // refresh the cluster group used by the spiderfy feature.
            this.spiderfiedMarkerGroup.refreshClusters();
        }

        // refresh the cluster groups that contain the clicked marker.
        this.getClusterGroupsByMarkerId(clickedMarker.id).forEach((clusterGroup) => {
            clusterGroup.refreshClusters();
        });
    };

    /**
     * This private method is used to update the blinking flags of a marker cluster element using its id.
     *
     * @param {string} clickedMarkerId the id of the marker to update
     * @param {boolean} blinkingValueToAssign the value to assign to the flags
     */
    private setMarkerElementBlinkingFlags = (clickedMarkerId: string, blinkingValueToAssign: boolean): void => {
        const unspiderfiedVersion = this.getMarkerClusterElement(clickedMarkerId);
        if (unspiderfiedVersion) {
            unspiderfiedVersion.options.blinking = blinkingValueToAssign;
            unspiderfiedVersion.blinking = blinkingValueToAssign;
        }
    };

    /**
     * This private method is used to process alt-click made on a marker cluster element.The alt-click
     * operation toggles the marker selected flag.
     *
     * @param {L.MarkerClusterElement} clickedMarker the marker cluster element that has been clicked on
     */
    private altClickOnMarkerElement = (clickedMarker: L.MarkerClusterElement): void => {
        // toggle the value of the selected flag
        clickedMarker.setSelectedFlag(!clickedMarker.selected);

        // in spiderfied mode the clicked marker is a copy of a marker saved in the markerClusterElements
        // array. So, we retreive the original marker and toggle its selection too.
        if (this.spiderfiedModeOn) {
            const unspiderfiedVersion = this.getMarkerClusterElement(clickedMarker.id);
            if (unspiderfiedVersion) {
                // toggle the value of the selected flag
                unspiderfiedVersion.setSelectedFlag(!unspiderfiedVersion.selected);
            }
        }
        // Since the toggleSelection method updates the marker, we must refresh its blinking behaviour.
        this.controlClickOnMarkerElement(clickedMarker, 'refresh');
    };
}
