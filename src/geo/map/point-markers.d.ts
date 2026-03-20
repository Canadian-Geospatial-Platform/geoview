import type { Coordinate } from 'ol/coordinate';
import type { Extent } from 'ol/extent';
import type { FeatureHighlight } from '@/geo/map/feature-highlight';
import type { MapViewer } from '@/geo/map/map-viewer';
import type { TypePointMarker } from '@/api/types/map-schema-types';
/**
 * A class to handle point markers.
 */
export declare class PointMarkers {
    #private;
    /** The map projection */
    mapProjection: string;
    /** The map ID */
    mapId: string;
    /**
     * Initializes point marker classes.
     *
     * @param mapViewer - The map viewer
     * @param featureHighlight - The feature highlight class
     */
    constructor(mapViewer: MapViewer, featureHighlight: FeatureHighlight);
    /**
     * Update the point markers on the map.
     *
     * @param mapPointMarkers - The markers
     */
    updatePointMarkers(mapPointMarkers: Record<string, TypePointMarker[]>): void;
    /**
     * Add point markers.
     *
     * @param group - The group to add the markers to
     * @param pointMarkers - The markers to add
     */
    addPointMarkers(group: string, pointMarkers: TypePointMarker[]): void;
    /**
     * Remove an array of point markers or a point marker group.
     *
     * @param group - The group to remove the markers from
     * @param idsOrCoordinates - The id or coordinate of the marker to remove
     */
    removePointMarkersOrGroup(group: string, idsOrCoordinates?: string[] | Coordinate[]): void;
    /**
     * Zoom to point marker group.
     *
     * @param group - The group to zoom to
     */
    zoomToPointMarkerGroup(group: string): void;
    /**
     * Zoom to point markers.
     *
     * @param group - The group containing the markers to zoom to
     * @param ids - The ids of the markers to zoom to
     */
    zoomToPointMarkers(group: string, ids: string[]): void;
    /**
     * Get the extent of point markers.
     *
     * @param ids - The ids of markers to get the extents of
     * @returns The calculated extent or undefined
     */
    getExtentFromMarkerIds(ids: string[]): Extent | undefined;
}
//# sourceMappingURL=point-markers.d.ts.map