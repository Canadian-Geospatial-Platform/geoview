import L from 'leaflet';
import 'leaflet.markercluster/src';
import { TypeStampedIconCreationFunction } from '../../../core/types/cgpv-types';
import '../../../core/types/marker-cluster-element';
export declare const defaultClusterGroupOptions: L.MarkerClusterGroupOptions;
export declare const defaultSpiderfiedClusterGroupOptions: L.MarkerClusterGroupOptions;
/**
 * Class used to manage marker groups
 *
 * @export
 * @class MarkerCluster
 */
export declare class MarkerClusterClass {
    private markerClusterMap;
    clusterGroups: L.MarkerClusterGroup[];
    markerClusterElements: L.MarkerClusterElement[];
    blinkingElement: L.MarkerClusterElement | null;
    disableblinkingEvent: boolean;
    spiderfiedMarkerGroup: L.MarkerClusterGroup;
    spiderfiedModeOn: boolean;
    activeClusterGroupIndex: number;
    defaultClusterGroupID: string;
    clusterGroupOptions: L.MarkerClusterGroupOptions;
    spiderfiedClusterGroupOptions: L.MarkerClusterGroupOptions;
    respiderfyTheLastSpiderfiedClusterGroup: boolean;
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
       * @param {string} mapId leaflet map id
       */
    constructor(mapId: string);
    /**
     * set the getClusterIconEmpty function to be used when creating marker cluster groups
     * that contain no selected marker
     *
     * @param {TypeStampedIconCreationFunction} f function that returns a L.DivIcon for empty selection
     */
    setGetClusterIconEmpty: (f: TypeStampedIconCreationFunction) => void;
    /**
     * set the getClusterIconPart function to be used when creating marker cluster groups
     * that contain some selected markers
     *
     * @param {TypeStampedIconCreationFunction} f function that returns a L.DivIcon for partial selection
     */
    setGetClusterIconPart: (f: TypeStampedIconCreationFunction) => void;
    /**
     * set the getClusterIconFull function to be used when creating marker cluster groups
     * that contain only selected markers
     *
     * @param {TypeStampedIconCreationFunction} f function that returns a L.DivIcon for full selection
     */
    setGetClusterIconFull: (f: TypeStampedIconCreationFunction) => void;
    /**
     * set the default cluster group options
     *
     * @param {MarkerClusterGroupOptions} options marker options including styling
     */
    setClusterGroupOptions: (options: L.MarkerClusterGroupOptions) => void;
    /**
     * set the spiderfied default cluster group options
     *
     * @param {MarkerClusterGroupOptions} options marker options including styling
     */
    setSpiderfiedClusterGroupOptions: (options: L.MarkerClusterGroupOptions) => void;
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
    private createMarkerElement;
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
    addMarkerElement: (latitude: number, longitude: number, options: L.MarkerClusterElementOptions, id?: string | undefined) => L.MarkerClusterElement;
    /**
     * Find a marker cluster element using it's id
     *
     * @param {string} id the id of the marker cluster element to return
     *
     * @returns {L.MarkerClusterElement} a marker cluster element having the specified id
     */
    getMarkerClusterElement: (id: string) => L.MarkerClusterElement;
    /**
     * Find a marker cluster element in the spiderfied group using it's id
     *
     * @param {string} id the id of the marker cluster to return
     *
     * @returns {L.MarkerClusterElement} a marker cluster element with the specified id
     */
    getSpiderfiedMarkerClusterElement: (id: string) => L.MarkerClusterElement | null;
    /**
     * Find the groups that contain the marker cluster element using it's id
     *
     * @param {string} id the id of the marker cluster element
     *
     * @returns {MarkerClusterGroup | null} the groups that contain the marker cluster
     *                                      or null if not found
     */
    getClusterGroupsByMarkerId: (id: string) => L.MarkerClusterGroup[];
    /**
     * Create a new marker cluster group instance
     *
     * @param {string} clusterGroupid the id of the marker cluster group
     * @param {MarkerClusterGroupOptions} options marker cluster group options
     *
     * @returns {L.MarkerClusterGroup} the new marker cluster group instance
     */
    newClusterGroupInstance: (clusterGroupid: string, options: L.MarkerClusterGroupOptions) => L.MarkerClusterGroup;
    /**
     * Create a new marker cluster group in the clusterGroups attribute to manage multiple marker at once
     *
     * @param {string} clusterGroupid the id of the marker cluster group to use when managing this group
     * @param {MarkerClusterGroupOptions>} options marker cluster group options
     */
    createClusterGroup: (clusterGroupid: string, options?: L.MarkerClusterGroupOptions | undefined) => L.MarkerClusterGroup;
    /**
     * set the active marker cluster group (the cluster group used when adding marker cluster elements)
     *
     * @param {string} clusterGroupid optional the id of the marker cluster group to set as active
     */
    setActiveClusterGroup: (clusterGroupid?: string | undefined) => void;
    /**
     * Get the active marker cluster group
     *
     * @returns {L.MarkerClusterGroup} the active marker cluster group
     */
    getActiveGeometryGroup: () => L.MarkerClusterGroup;
    /**
     * set the identified marker cluster group as visible on the map
     * if clusterGroupid is not provided, the active marker cluster group is used
     *
     * @param {string} clusterGroupid optional the id of the marker cluster group to show on the map
     */
    setClusterGroupAsVisible: (clusterGroupid?: string | undefined) => void;
    /**
     * set the identified marker cluster group as visible on the map
     * if clusterGroupid is not provided, the active marker cluster group is used
     *
     * @param {string} clusterGroupid optional the id of the marker cluster group to show on the map
     */
    setClusterGroupAsInvisible: (clusterGroupid?: string | undefined) => void;
    /**
     * Turn on the cluster groups that are flaged as visible. The visible flag and options
     * remain unchanged, this allow us to turn on and off the cluster groups to temporarily
     * hide them.
     */
    turnOnGeometryGroups: () => void;
    /**
     * Turn off the cluster groups that are flaged as visible. The visible flag and options
     * remain unchanged, this allow us to turn on and off the cluster groups to temporarily
     * hide them.
     */
    turnOffGeometryGroups: () => void;
    /**
     * Get the marker cluster group whose id is equal to the clusterGroupid parameter
     * if clusterGroupid is not provided, return the active marker cluster group
     *
     * @param {string} clusterGroupid the id of the marker cluster group to return
     *
     * @returns the marker cluster group
     */
    getMarkerClusterGroup: (clusterGroupid?: string | undefined) => L.MarkerClusterGroup;
    /**
     * Delete a marker cluster element using the id and delete it from the groups and the map
     *
     * @param {string} id the id of the geometry to delete
     */
    deleteMarkerClusterElement: (id: string) => void;
    /**
     * Add a new marker cluster element to the group whose identifier is equal to clusterGroupId.
     * if clusterGroupId is not provided, use the active cluster group. If the
     * cluster group doesn't exist, create it.
     *
     * @param {L.MarkerClusterElement} markerClusterElement marker cluster element to be added to the group
     * @param {string} geometryGroupId optional id of the group to add the geometry to
     */
    addElementToMarkerClusterGroup: (markerClusterElement: L.MarkerClusterElement, clusterGroupId?: string | undefined) => void;
    /**
     * Find the groups that the marker cluster element exists in and delete it from those groups
     *
     * @param {string} markerClusterElementId the marker cluster element id
     */
    deleteMarkerClusterElementFromGroups: (markerClusterElementId: string) => void;
    /**
     * Delete a specific marker cluster element from a group using their ids
     * If clusterGroupid is not provided, the active marker cluster group is used.
     *
     * @param {string} markerClusterElementId the marker cluster id to be deleted
     * @param {string} clusterGroupid optional group id
     */
    deleteMarkerClusterFromGroup: (markerClusterElementId: string, clusterGroupid?: string | undefined) => void;
    /**
     * Delete all marker cluster elements from the marker cluster group but keep the group.
     * If clusterGroupid is not provided, the active marker cluster group is used.
     *
     * @param {string} clusterGroupid optional group id
     *
     * @returns {L.MarkerClusterGroup} the marker cluster group used by the méthode
     */
    deleteMarkerClusterElementsFromGroup: (clusterGroupid?: string | undefined) => L.MarkerClusterGroup;
    /**
     * Delete a marker cluster group and all the marker cluster elements from the map.
     * If clusterGroupid is not provided, the active marker cluster group is used.
     * The default marker cluster group can't be deleted.
     *
     * @param {string} clusterGroupid optional id of the marker cluster group to delete
     */
    deleteMarkerClusterGroup: (clusterGroupid?: string | undefined) => void;
    /**
     * Event handler triggered when we click on a marker cluster saved in a marker cluster group
     *
     * @param {MarkerClusterMouseEvent} event the event information
     */
    onClusterClick: (event: L.MarkerClusterMouseEvent) => void;
    /**
     * This private method is used when you click on a marker cluster. It spiderfies the cluster you clicked on
     * (i.e.: hide everything but a spider version of the cluster).
     *
     * @param {L.MarkerClusterElement[]} childMarkers the marker cluster elements that compopse the marker cluster.
     */
    private clickOnMarkerCluster;
    /**
     * This private method is used when you alt-click on a marker cluster. It toggles the cluster selection
     * of the cluster you alt-clicked on.
     *
     * @param {L.MarkerClusterElement[]} childMarkers the marker cluster elements that compopse the marker cluster.
     * @param {L.MarkerClusterGroup} markerClusterGroup the marker cluster group that contains the marker cluster elements.
     */
    private altClickOnMarkerCluster;
    /**
     * Event handler triggered when we click on a spiderfied marker cluster
     * saved in a marker cluster group
     *
     * @param {MarkerClusterMouseEvent} event the event information
     */
    onSpiderfiedClusterClick: (event: L.MarkerClusterMouseEvent) => void;
    /**
     * Event handler triggered when a spiderfied marker cluster returns to its
     * unspiderfied shape
     *
     * @param {MarkerClusterMouseEvent} event the event information
     */
    onUnspiderfyCluster: (event: L.MarkerClusterMouseEvent) => void;
    /**
     * Event handler triggered when a marker element is clicked
     *
     * @param {LeafletMouseEvent} event the event information
     */
    onMarkerElementClick: (event: L.MarkerClusterElementMouseEvent) => void;
    /**
     * This private method is used to process ctrl-click made on a marker cluster element.
     *
     * @param {L.MarkerClusterElement} clickedMarker the marker cluster element that has been clicked on
     * @param {'refresh' | 'toggle'} action type of action to apply to the blinking flag
     */
    private controlClickOnMarkerElement;
    /**
     * This private method is used to update the blinking flags of a marker cluster element using its id.
     *
     * @param {string} clickedMarkerId the id of the marker to update
     * @param {boolean} blinkingValueToAssign the value to assign to the flags
     */
    private setMarkerElementBlinkingFlags;
    /**
     * This private method is used to process alt-click made on a marker cluster element.The alt-click
     * operation toggles the marker selected flag.
     *
     * @param {L.MarkerClusterElement} clickedMarker the marker cluster element that has been clicked on
     */
    private altClickOnMarkerElement;
}
