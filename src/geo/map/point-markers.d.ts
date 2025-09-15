import { Coordinate } from 'ol/coordinate';
import { Extent } from 'ol/extent';
import { FeatureHighlight } from '@/geo/map/feature-highlight';
import { MapViewer } from '@/geo/map/map-viewer';
import { TypePointMarker } from '@/api/types/map-schema-types';
/**
 * A class to handle point markers
 *
 * @exports
 * @class PointMarkers
 */
export declare class PointMarkers {
    #private;
    /** The map projection */
    mapProjection: string;
    /** The map ID */
    mapId: string;
    /**
     * Initializes point marker classes
     * @param {MapViewer} mapViewer - The map viewer
     * @param {FeatureHighlight} featureHighlight - The feature highlight class
     */
    constructor(mapViewer: MapViewer, featureHighlight: FeatureHighlight);
    /**
     * Update the point markers on the map.
     * @param {Record<string, TypePointMarker[]>} mapPointMarkers - The markers
     */
    updatePointMarkers(mapPointMarkers: Record<string, TypePointMarker[]>): void;
    /**
     * Add point markers.
     * @param {string} group - The group to add the markers to.
     * @param {Record<string, TypePointMarker>[]} pointMarkers - The masrker to add.
     */
    addPointMarkers(group: string, pointMarkers: TypePointMarker[]): void;
    /**
     * Remove an array of point markers or a point marker group.
     * @param {string} group - The group to remove the markers from.
     * @param {string[] | Coordinate[]} idsOrCoordinates - The id or coordinate of the marker to remove.
     */
    removePointMarkersOrGroup(group: string, idsOrCoordinates?: string[] | Coordinate[]): void;
    /**
     * Zoom to point marker group.
     * @param {string} group - The group to zoom to.
     */
    zoomToPointMarkerGroup(group: string): void;
    /**
     * Zoom to point markers.
     * @param {string} group - The group containing the markers to zoom to.
     * @param {string | Coordinate} ids - The ids of the markers to zoom to.
     */
    zoomToPointMarkers(group: string, ids: string[]): void;
    /**
     * Get the extent of point markers.
     * @param {string[]} ids - The ids of markers to get the extents of.
     * @returns {Extent | undefined} The calculated extent or undefined.
     */
    getExtentFromMarkerIds(ids: string[]): Extent | undefined;
}
//# sourceMappingURL=point-markers.d.ts.map