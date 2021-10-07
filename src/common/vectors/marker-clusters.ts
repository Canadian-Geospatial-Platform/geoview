/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable no-plusplus */
import L, { LeafletMouseEvent, LeafletEventHandlerFn, LeafletEvent } from 'leaflet';
import 'leaflet.markercluster/src';
import {
    Cast,
    TypeMarkerCluster,
    TypeClusterGroupOptions,
    TypeClusterGroup,
    TypeStampedIconCreationFunction,
    TypeIconCreationFunction,
    TypeMarkerClusterOptions,
    TypeMapRef,
} from '../../types/cgpv-types';

import { EVENT_NAMES } from '../../api/event';
import { api } from '../../api/api';
import { generateId } from '../constant';
import * as MarkerDefinitions from '../../../public/markers/marker-definitions';

let {
    getClusterIconFull,
    getClusterIconPart,
    getClusterIconEmpty,
    unselectedMarkerIconCreator,
    selectedMarkerIconCreator,
} = MarkerDefinitions;

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
    const markers = cluster.getAllChildMarkers() as TypeMarkerCluster[];
    for (let i = 0; i < markers.length; i++) {
        if (markers[i].options.selected) numberOfSelectedIcons++;
    }
    const Stamp = `${numberOfSelectedIcons}/${markers.length}`;
    if (numberOfSelectedIcons === 0) {
        icon = getClusterIconEmpty(Stamp);
    } else if (numberOfSelectedIcons === markers.length) {
        icon = getClusterIconFull(Stamp);
    } else {
        icon = getClusterIconPart(Stamp);
    }
    return icon;
};

// default options used by cluster groups
export const defaultClusterGroupOptions: TypeClusterGroupOptions = {
    maxClusterRadius: 50,
    iconCreateFunction: createMarkerIcon,
    animate: false,
    zoomToBoundsOnClick: false,
    spiderfyOnMaxZoom: false,
    removeOutsideVisibleBounds: false,
};

// options used by cluster groups
let clusterGroupOptions = defaultClusterGroupOptions;

/**
 * function used for creating a zoomed marker cluster icon
 *
 * @param {MarkerCluster}  cluster in which the marker will be created
 *
 * @returns {L.DivIcon} the icon to be used by the marker
 */
const createZoomedMarkerIcon = (cluster: L.MarkerCluster): L.DivIcon => {
    const icon = createMarkerIcon(cluster);
    icon.options.className = 'leaflet-marker-icon cluster-div-icon zoomed-marker';
    return icon;
};

// default options used by zoomed cluster groups
export const defaultZoomedClusterGroupOptions: TypeClusterGroupOptions = {
    maxClusterRadius: 100,
    iconCreateFunction: createZoomedMarkerIcon,
    animate: false,
    zoomToBoundsOnClick: false,
    spiderfyOnMaxZoom: false,
    removeOutsideVisibleBounds: false,
    visible: true,
};

// options used by zoomed cluster groups
let zoomedClusterGroupOptions = defaultZoomedClusterGroupOptions;

/**
 * Class used to manage marker groups
 *
 * @export
 * @class Vector
 */
export class MarkerClusters {
    // reference to the map object
    private markerClusterMapRef: TypeMapRef;

    // used to store marker cluster groups
    clusterGroups: TypeClusterGroup[] = [];

    // used to store a marker cluster when zooming to it
    zoomedMarkerGroup: TypeClusterGroup;

    // index of the active marker cluster group used to add new marker cluster in the map
    activeClusterGroup = 0;

    // default marker cluster group name
    defaultClusterGroupID = 'defaultClusterGroup';

    /**
     * Initialize map, MarkerClusters, and listen to add marker cluster events
     *
     * @param {Map} map leaflet map object
     */
    constructor(mapRef: TypeMapRef) {
        this.markerClusterMapRef = mapRef;

        // create default cluster group and set it as visible
        this.createClusterGroup(this.defaultClusterGroupID, {
            ...clusterGroupOptions,
            visible: true,
            on: {
                clusterclick: Cast<LeafletEventHandlerFn>(this.markerLayersOnClusterclick),
            },
        });

        // create zoomed marker cluster group
        this.zoomedMarkerGroup = this.newClusterGroupInstance('ZoomedClusterGroup', {
            ...zoomedClusterGroupOptions,
            on: {
                clusterclick: this.zoomedClusterGroupOnClusterclick,
                unspiderfied: this.zoomedClusterGroupOnUnspiderfied,
            },
        });

        // listen to add marker cluster events
        api.event.on(EVENT_NAMES.EVENT_CLUSTER_ADD, (payload) => {
            const id = payload.id ? payload.id : null;
            this.addClusterMarker(payload.latitude, payload.longitude, payload.options, id);
        });

        // listen to outside events to remove marker cluster
        api.event.on(EVENT_NAMES.EVENT_CLUSTER_REMOVE, (payload) => {
            // remove marker cluster from outside
            this.deleteMarkerClusterFromGroups(payload.id);
        });

        // listen to outside events to turn select by bounding polygone
        api.event.on(EVENT_NAMES.EVENT_BOX_SELECT_END, (payload) => {
            const bbox = payload.boxZoomBounds;
            for (let i = 0; i < this.clusterGroups.length; i++) {
                if (this.clusterGroups[i].options.visible) {
                    const markerClusters = Cast<TypeMarkerCluster[]>(this.clusterGroups[i].getLayers());
                    for (let j = 0; j < markerClusters.length; j++) {
                        if (bbox.contains(markerClusters[j].getLatLng())) {
                            markerClusters[j].options.selected = !markerClusters[j].options.selected;
                            if (markerClusters[j].options.selected) {
                                markerClusters[j].setIcon(selectedMarkerIconCreator());
                            } else {
                                markerClusters[j].setIcon(unselectedMarkerIconCreator());
                            }
                            this.getClusterGroupByMarkerId(markerClusters[j].id)?.refreshClusters();
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
     * @param {TypeStampedIconCreationFunction} options marker options including styling
     */
    setGetClusterIconEmpty = (f: TypeStampedIconCreationFunction): void => {
        getClusterIconEmpty = f;
    };

    /**
     * set the getClusterIconPart function to be used when creating marker cluster groups
     * that contain some selected markers
     *
     * @param {TypeStampedIconCreationFunction} options marker options including styling
     */
    setGetClusterIconPart = (f: TypeStampedIconCreationFunction): void => {
        getClusterIconPart = f;
    };

    /**
     * set the getClusterIconFull function to be used when creating marker cluster groups
     * that contain only selected markers
     *
     * @param {TypeStampedIconCreationFunction} options marker options including styling
     */
    setGetClusterIconFull = (f: TypeStampedIconCreationFunction): void => {
        getClusterIconFull = f;
    };

    /**
     * set the unselectedMarkerIconCreator function to be used when creating a normal
     * unselected marker that is part of cluster groups
     *
     * @param {TypeIconCreationFunction} options marker options including styling
     */
    setUnselectedMarkerIconCreator = (f: TypeIconCreationFunction): void => {
        unselectedMarkerIconCreator = f;
    };

    /**
     * set the selectedMarkerIconCreator function to be used when creating a normal
     * selected marker that is part of cluster groups
     *
     * @param {TypeIconCreationFunction} options marker options including styling
     */
    setSelectedMarkerIconCreator = (f: TypeIconCreationFunction): void => {
        selectedMarkerIconCreator = f;
    };

    /**
     * set the default cluster group options
     *
     * @param {TypeClusterGroupOptions} options marker options including styling
     */
    setClusterGroupOptions = (options: TypeClusterGroupOptions): void => {
        clusterGroupOptions = options;
    };

    /**
     * set the zoomed default cluster group options
     *
     * @param {TypeClusterGroupOptions} options marker options including styling
     */
    setZoomedClusterGroupOptions = (options: TypeClusterGroupOptions): void => {
        zoomedClusterGroupOptions = options;
    };

    /**
     * Create a new marker cluster
     *
     * @param {string} markerId the id of this marker cluster
     * @param {number} latitude the latitude position of the circle
     * @param {number} longitude the longitude position of the circle
     * @param {TypeMarkerClusterOptions} options marker options including styling
     *
     * @returns a marker cluster element with the id, the selected flag and the created marker layer
     */
    createMarker = (markerId: string, latitude: number, longitude: number, options: TypeMarkerClusterOptions): TypeMarkerCluster => {
        let iconToUse: L.DivIcon;
        if (options.selected) {
            iconToUse = selectedMarkerIconCreator();
        } else {
            iconToUse = unselectedMarkerIconCreator();
        }
        const marker = L.marker([latitude, longitude], { ...options, icon: iconToUse }) as TypeMarkerCluster;
        marker.id = markerId;
        marker.options.selected = !!options.selected;
        marker.on('click', this.markerOnClick);

        if (options.on) {
            const onHandlerDefinitions = Object.entries(options.on);
            onHandlerDefinitions.forEach((handlerDefinition: [string, LeafletEventHandlerFn]) => {
                marker.on(handlerDefinition[0], handlerDefinition[1]);
            });
        }

        return marker;
    };

    /**
     * Create and add a new cluster marker
     *
     * @param {number} latitude the latitude position of the marker
     * @param {number} longitude the longitude position of the marker
     * @param {TypeMarkerClusterOptions} options marker options including styling
     * @param {string} id an optional id to be used to manage this marker cluster
     *
     * @returns a geometry containing the id and the created geometry
     */
    addClusterMarker = (latitude: number, longitude: number, options: TypeMarkerClusterOptions, id?: string): TypeMarkerCluster => {
        const MarkerClusterID = generateId(id);

        const marker = this.createMarker(MarkerClusterID, latitude, longitude, options);

        marker.addTo(this.clusterGroups[this.activeClusterGroup]);

        // emit an event that a marker vector has been added
        api.event.emit(EVENT_NAMES.EVENT_CLUSTER_ADDED, this.markerClusterMapRef.id, { ...marker });

        return marker;
    };

    /**
     * Find a marker cluster using it's id
     *
     * @param {string} id the id of the marker cluster to return
     *
     * @returns a marker cluster with the specified id
     */
    getMarkerCluster = (id: string): TypeMarkerCluster | null => {
        let returnValue: TypeMarkerCluster | null = null;
        this.clusterGroups.forEach((clusterGroup) => {
            clusterGroup.eachLayer((marker) => {
                const markerCluster = marker as TypeMarkerCluster;
                if (markerCluster.id === id) returnValue = markerCluster;
            });
        });
        return returnValue;
    };

    /**
     * Find the group that contains the marker cluster using it's id
     *
     * @param {string} id the id of the marker cluster
     *
     * @returns {TypeClusterGroup} the group that contains the marker cluster
     */
    getClusterGroupByMarkerId = (id: string): TypeClusterGroup | null => {
        let returnValue: TypeClusterGroup | null = null;
        for (let i = 0; i < this.clusterGroups.length; i++) {
            const markerClusters = this.clusterGroups[i].getLayers();
            for (let j = 0; j < markerClusters.length; j++) {
                const markerCluster = markerClusters[j] as TypeMarkerCluster;
                if (markerCluster.id === id) returnValue = this.clusterGroups[i];
            }
        }
        return returnValue;
    };

    /**
     * Create a new marker cluster group instance
     *
     * @param {string} clusterGroupid the id of the marker cluster group
     * @param {TypeClusterGroupOptions} options marker cluster group options
     */
    newClusterGroupInstance = (clusterGroupid: string, options: TypeClusterGroupOptions): TypeClusterGroup => {
        const clusterGroup = Cast<TypeClusterGroup>(L.markerClusterGroup(options));

        clusterGroup.id = clusterGroupid;

        if (options.on) {
            const onHandlerDefinitions = Object.entries(options.on);
            onHandlerDefinitions.forEach((handlerDefinition: [string, LeafletEventHandlerFn]) => {
                clusterGroup.on(handlerDefinition[0], handlerDefinition[1]);
            });
        }

        clusterGroup.options.visible = !!options.visible;
        if (clusterGroup.options.visible) {
            clusterGroup.addTo(this.markerClusterMapRef.map);
        }

        return clusterGroup;
    };

    /**
     * Create a new marker cluster group in the clusterGroups attribute to manage multiple marker at once
     *
     * @param {string} clusterGroupid the id of the marker cluster group to use when managing this group
     * @param {TypeClusterGroupOptions>} options marker cluster group options
     */
    createClusterGroup = (clusterGroupid: string, options: TypeClusterGroupOptions): void => {
        if (!this.getClusterGroupById(clusterGroupid)) {
            this.clusterGroups.push(this.newClusterGroupInstance(clusterGroupid, options));
        }
    };

    /**
     * set the active geometry group (the geometry group used when adding geometries)
     *
     * @param {string} clusterGroupid optional the id of the marker cluster group to set as active
     */
    setActiveClusterGroup = (clusterGroupid?: string): void => {
        // if group name not give, add to default group
        const groupName = clusterGroupid || this.defaultClusterGroupID;
        for (let i = 0; i < this.clusterGroups.length; i++) {
            if (this.clusterGroups[i].id === groupName) {
                this.activeClusterGroup = i;
                break;
            }
        }
    };

    /**
     * set the identified marker cluster group as visible on the map
     *
     * @param {string} clusterGroupid optional the id of the marker cluster group to show on the map
     */
    setClusterGroupAsVisible = (clusterGroupid?: string): void => {
        // if group name not give, add to default group
        const groupName = clusterGroupid || this.defaultClusterGroupID;
        const clusterGroup = this.getClusterGroupById(groupName);
        clusterGroup.addTo(this.markerClusterMapRef.map);
        clusterGroup.options.visible = true;
    };

    /**
     * set the identified marker cluster group as visible on the map
     *
     * @param {string} clusterGroupid optional the id of the marker cluster group to show on the map
     */
    setClusterGroupAsInvisible = (clusterGroupid?: string): void => {
        // if group name not give, add to default group
        const groupName = clusterGroupid || this.defaultClusterGroupID;
        const clusterGroup = this.getClusterGroupById(groupName);
        clusterGroup.removeFrom(this.markerClusterMapRef.map);
        clusterGroup.options.visible = false;
    };

    /**
     * Get the marker cluster group by using the ID specified when the group was created
     *
     * @param {string} clusterGroupid the id of the marker cluster group to return
     *
     * @returns the geomtry group
     */
    getClusterGroupById = (clusterGroupid: string): TypeClusterGroup => {
        return this.clusterGroups.filter((clusterGroup) => clusterGroup.id === clusterGroupid)[0];
    };

    /**
     * Find the groups that the marker cluster exists in and delete the geometry from those groups
     *
     * @param {string} markerClusterId the marker cluster id
     */
    deleteMarkerClusterFromGroups = (markerClusterId: string): void => {
        const markerCluster = this.getMarkerCluster(markerClusterId);
        for (let i = 0; i < this.clusterGroups.length; i++) {
            this.clusterGroups[i].getLayers().forEach((layer) => {
                if (markerCluster === layer) {
                    this.clusterGroups[i].removeLayer(layer);
                }
            });
        }
    };

    /**
     * Delete a specific marker cluster from a group using the marker cluster id
     *
     * @param {string} markerClusterId the marker cluster id to be deleted
     * @param {string} groupId optional group id
     */
    deleteMarkerClusterFromGroup = (markerClusterId: string, groupId?: string): void => {
        const markerCluster = this.getMarkerCluster(markerClusterId);
        // if group name not given, use the default group
        const groupName = groupId || this.defaultClusterGroupID;
        for (let i = 0; i < this.clusterGroups.length; i++) {
            if (this.clusterGroups[i].id === groupName) {
                this.clusterGroups[i].getLayers().forEach((layer) => {
                    if (markerCluster === layer) {
                        this.clusterGroups[i].removeLayer(layer);
                    }
                });
            }
        }
    };

    /**
     * Delete all marker cluster from the marker cluster group but keep the group
     *
     * @param {string} id optional group id
     */
    deleteMarkerClustersFromGroup = (id?: string): number => {
        let i: number;
        // if group name not give, add to default group
        const groupName = id || this.defaultClusterGroupID;
        for (i = 0; i < this.clusterGroups.length; i++) {
            if (this.clusterGroups[i].id === groupName) {
                this.clusterGroups[i].clearLayers();
                break;
            }
        }
        return i;
    };

    /**
     * Delete a marker cluster group and all the marker cluster from the map
     *
     * @param {string} id optional id of the marker cluster group to delete
     */
    deleteGeometryGroup = (id?: string): void => {
        const clusterGroupIndex = this.deleteMarkerClustersFromGroup(id);
        if (id !== this.defaultClusterGroupID && id !== '') {
            // can't delete the default group
            this.clusterGroups.splice(clusterGroupIndex, 1);
        }
    };

    markerLayersOnClusterclick = (e: LeafletMouseEvent): void => {
        if (!e.originalEvent.shiftKey && !e.originalEvent.ctrlKey && e.originalEvent.altKey) {
            const layers = e.layer.getAllChildMarkers();
            for (let i = 0; i < layers.length; i++) {
                layers[i].options.selected = !layers[i].options.selected;
                if (layers[i].options.selected) {
                    layers[i].setIcon(selectedMarkerIconCreator());
                } else {
                    layers[i].setIcon(unselectedMarkerIconCreator());
                }
            }
            e.target.refreshClusters();
        } else if (e.originalEvent.shiftKey && !e.originalEvent.ctrlKey && !e.originalEvent.altKey) {
            e.layer.zoomToBounds({ padding: [20, 20] });
        } else if (!e.originalEvent.shiftKey && !e.originalEvent.ctrlKey && !e.originalEvent.altKey) {
            // turn off all visible cluster groups
            this.clusterGroups.forEach((clusterGroup) => {
                if (clusterGroup.options.visible) clusterGroup.removeFrom(this.markerClusterMapRef.map);
            });
            // turn off all visible geometry groups
            api.event.emit(api.eventNames.EVENT_VECTOR_OFF, null, {});
            // Insert only the markers associated to the current group in the new zoomed cluster
            // and keep a reference to the last child marker
            const childMarkers = e.layer.getAllChildMarkers();
            let sourceMarker = childMarkers[0];
            let lastChildMarker: TypeMarkerCluster = this.createMarker(
                sourceMarker.id,
                sourceMarker.getLatLng().lat,
                sourceMarker.getLatLng().lng,
                sourceMarker.options
            );
            lastChildMarker.addTo(this.zoomedMarkerGroup);
            for (let i = 1; i < childMarkers.length; i++) {
                sourceMarker = childMarkers[i];
                lastChildMarker = this.createMarker(
                    sourceMarker.id,
                    sourceMarker.getLatLng().lat,
                    sourceMarker.getLatLng().lng,
                    sourceMarker.options
                );
                lastChildMarker.addTo(this.zoomedMarkerGroup);
            }
            // Find the cluster marker and spiderfy it.
            const zoomedMarkerCluster = this.zoomedMarkerGroup.getVisibleParent(lastChildMarker);
            zoomedMarkerCluster.spiderfy();
        }
    };

    // =============================================================================
    zoomedClusterGroupOnClusterclick = (e: LeafletEvent): void => {
        e.target.unspiderfy();
    };

    // =============================================================================
    zoomedClusterGroupOnUnspiderfied = (e: LeafletEvent): void => {
        e.target.off('unspiderfied', this.zoomedClusterGroupOnUnspiderfied);
        this.zoomedMarkerGroup.clearLayers();
        e.target.on('unspiderfied', this.zoomedClusterGroupOnUnspiderfied);
        // turn on all visible geometry groups
        api.event.emit(api.eventNames.EVENT_VECTOR_ON, null, {});
        // turn on all visible cluster group
        this.clusterGroups.forEach((clusterGroup) => {
            if (clusterGroup.options.visible) clusterGroup.addTo(this.markerClusterMapRef.map);
        });
    };

    markerOnClick = (e: LeafletMouseEvent): void => {
        if (!e.originalEvent.shiftKey && !e.originalEvent.ctrlKey && e.originalEvent.altKey) {
            const zoomedMarker = e.target;
            zoomedMarker.options.selected = !zoomedMarker.options.selected;
            if (zoomedMarker.options.selected) {
                zoomedMarker.setIcon(selectedMarkerIconCreator());
            } else {
                zoomedMarker.setIcon(unselectedMarkerIconCreator());
            }
            // refresh the visible parent
            this.zoomedMarkerGroup.refreshClusters();

            const originalMarker = Cast<TypeMarkerCluster>(this.getMarkerCluster(e.target.id));
            originalMarker.options.selected = !originalMarker.options.selected;
            if (originalMarker.options.selected) {
                originalMarker.setIcon(selectedMarkerIconCreator());
            } else {
                originalMarker.setIcon(unselectedMarkerIconCreator());
            }
            this.getClusterGroupByMarkerId(originalMarker.id)?.refreshClusters();
        }
    };
}
