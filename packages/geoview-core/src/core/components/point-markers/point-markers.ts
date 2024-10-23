import { Coordinate } from 'ol/coordinate';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { Icon, Style } from 'ol/style';
import { Extent } from 'ol/extent';
import { Projection } from '@/geo/utils/projection';
import { getExtentUnion } from '@/geo/utils/utilities';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import { FeatureHighlight, getScriptAndAssetURL, MapViewer } from '@/app';
import { logger } from '@/core/utils/logger';
import { TypePointMarker } from '@/api/config/types/map-schema-types';

/**
 * A class to handle point markers
 *
 * @exports
 * @class PointMarkers
 */
export class PointMarkers {
  /** The feature highlight class, used to access overlay layer source */
  #featureHighlight: FeatureHighlight;

  /** The map projection */
  mapProjection: string;

  /** The map ID */
  mapId: string;

  /** Array to track marker feature IDs */
  #featureIds: string[] = [];

  /**
   * Initializes point marker classes
   * @param {MapViewer} mapViewer - The map viewer
   * @param {FeatureHighlight} featureHighlight - The feature highlight class
   */
  constructor(mapViewer: MapViewer, featureHighlight: FeatureHighlight) {
    this.mapProjection = mapViewer.map.getView().getProjection().getCode();
    this.mapId = mapViewer.mapId;
    this.#featureHighlight = featureHighlight;
    if (Object.keys(MapEventProcessor.getPointMarkers(this.mapId)).length)
      this.updatePointMarkers(MapEventProcessor.getPointMarkers(this.mapId));
  }

  /**
   * Update the point markers on the map.
   * @param {Record<string, TypePointMarker[]>} mapPointMarkers - The markers
   */
  updatePointMarkers(mapPointMarkers: Record<string, TypePointMarker[]>): void {
    // Remove existing markers
    this.#removePointMarkersFromMap();

    // Add point markers to map
    Object.keys(mapPointMarkers).forEach((markerGroup) => {
      mapPointMarkers[markerGroup].forEach((point) => {
        const pointStyle = new Style({
          image: new Icon({
            anchor: [0.5, 1],
            src: `${getScriptAndAssetURL()}/img/marker-icon36.png`,
            color: point.color || 'green',
            opacity: point.opacity || 1,
            scale: 0.25,
          }),
        });

        const pointFeature = new Feature({
          geometry: new Point(
            Projection.transformPoints([point.coordinate], `EPSG:${point.projectionCode || 4326}`, this.mapProjection)[0],
          ),
        });

        // Set ID and style for feature
        const featureId = `${markerGroup}-${point.id}`;
        pointFeature.setId(featureId);
        pointFeature.setStyle(pointStyle);

        // Add feature to source
        this.#featureHighlight.highlighSource.addFeature(pointFeature);
        // Add ID to array
        this.#featureIds.push(featureId);
      });
    });
  }

  /**
   * Remove the point markers from the map.
   * @private
   */
  #removePointMarkersFromMap(): void {
    this.#featureIds.forEach((id) => {
      const feature = this.#featureHighlight.highlighSource.getFeatureById(id);
      if (feature) this.#featureHighlight.highlighSource.removeFeature(feature);
    });
    this.#featureIds = [];
  }

  /**
   * Add point markers.
   * @param {string} group - The group to add the markers to.
   * @param {Record<string, TypePointMarker>[]} pointMarkers - The masrker to add.
   */
  addPointMarkers(group: string, pointMarkers: TypePointMarker[]): void {
    // Redirect to event processor
    MapEventProcessor.addPointMarkers(this.mapId, group, pointMarkers);
  }

  /**
   * Remove an array of point markers or a point marker group.
   * @param {string} group - The group to remove the markers from.
   * @param {string[] | Coordinate[]} idsOrCoordinates - The id or coordinate of the marker to remove.
   */
  removePointMarkersOrGroup(group: string, idsOrCoordinates?: string[] | Coordinate[]): void {
    // Redirect to event processor
    MapEventProcessor.removePointMarkersOrGroup(this.mapId, group, idsOrCoordinates);
  }

  /**
   * Zoom to point marker group.
   * @param {string} group - The group to zoom to.
   */
  zoomToPointMarkerGroup(group: string): void {
    const groupMarkers = MapEventProcessor.getPointMarkers(this.mapId)[group];

    if (groupMarkers) {
      // Create list of feature IDs
      const idList: string[] = groupMarkers.map((marker) => marker.id);

      // If there are IDs, zoom to them
      if (idList.length) this.zoomToPointMarkers(group, idList);
      else logger.logError(`Point marker group ${group} has no markers.`);
    } else logger.logError(`Point marker group ${group} does not exist.`);
  }

  /**
   * Zoom to point markers.
   * @param {string} group - The group containing the markers to zoom to.
   * @param {string | Coordinate} ids - The ids of the markers to zoom to.
   */
  zoomToPointMarkers(group: string, ids: string[]): void {
    // Create list of feature IDs
    const idList = ids.map((id) => `${group}-${id}`);

    // Get extent of point markers and zoom to it
    const extent = this.getExtentFromMarkerIds(idList);
    if (extent)
      MapEventProcessor.zoomToExtent(this.mapId, extent).catch((error: unknown) => {
        // Log
        logger.logPromiseFailed('zoomToExtent in zoomToPointMarkersOrGroup in MapEventProcessor', error);
      });
    else logger.logError(`Point marker group ${group} has no markers or does not exist, or point marker ids ${ids} are not correct.`);
  }

  /**
   * Get the extent of point markers.
   * @param {string[]} ids - The ids of markers to get the extents of.
   * @returns {Extent | undefined} The calculated extent or undefined.
   */
  getExtentFromMarkerIds(ids: string[]): Extent | undefined {
    if (ids.length) {
      // Get the point coordinates and extrapolate to extent
      const coordinates = ids
        .map((id) => {
          const feature = this.#featureHighlight.highlighSource.getFeatureById(id);
          if (feature) {
            const pointCoordinates = (feature?.getGeometry() as Point).getCoordinates();
            return [pointCoordinates[0], pointCoordinates[1], pointCoordinates[0], pointCoordinates[1]] as Extent;
          }
          return undefined;
        })
        .filter((extents) => extents);

      // If only one extent, return
      if (coordinates.length === 1) return coordinates[0];

      // Find max extent of points
      if (coordinates.length) {
        let extent = coordinates[0] as number[];
        for (let i = 1; i < coordinates.length; i++) {
          extent = getExtentUnion(extent, coordinates[i]);
        }

        return extent;
      }
    }

    return undefined;
  }
}
