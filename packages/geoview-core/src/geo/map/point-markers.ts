import type { Coordinate } from 'ol/coordinate';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { Icon, Style } from 'ol/style';
import type { Extent } from 'ol/extent';
import { Projection } from '@/geo/utils/projection';
import { GeoUtilities } from '@/geo/utils/utilities';
import type { FeatureHighlight } from '@/geo/map/feature-highlight';
import { getScriptAndAssetURL } from '@/core/utils/utilities';
import type { MapViewer } from '@/geo/map/map-viewer';
import { logger } from '@/core/utils/logger';
import type { TypePointMarker } from '@/api/types/map-schema-types';
import { getStoreMapPointMarkers } from '@/core/stores/store-interface-and-intial-values/map-state';

/**
 * A class to handle point markers.
 */
export class PointMarkers {
  /** The feature highlight class, used to access overlay layer source */
  #featureHighlight: FeatureHighlight;

  /** The map viewer */
  mapViewer: MapViewer;

  /** The map ID */
  mapId: string;

  /** Array to track marker feature IDs */
  #featureIds: string[] = [];

  /**
   * Initializes point marker classes.
   *
   * @param mapViewer - The map viewer
   * @param featureHighlight - The feature highlight class
   */
  constructor(mapViewer: MapViewer, featureHighlight: FeatureHighlight) {
    this.mapViewer = mapViewer;
    this.mapId = mapViewer.mapId;
    this.#featureHighlight = featureHighlight;
    if (Object.keys(getStoreMapPointMarkers(this.mapId)).length) this.updatePointMarkers(getStoreMapPointMarkers(this.mapId));
  }

  /**
   * Update the point markers on the map.
   *
   * @param mapPointMarkers - The markers
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
            Projection.transformPoints(
              [point.coordinate],
              `EPSG:${point.projectionCode || 4326}`,
              this.mapViewer.getProjection().getCode()
            )[0]
          ),
        });

        // Set ID and style for feature
        const featureId = `${markerGroup}-${point.id}`;
        pointFeature.setId(featureId);
        pointFeature.setStyle(pointStyle);

        // Add feature to source
        this.#featureHighlight.highlightSource.addFeature(pointFeature);
        // Add ID to array
        this.#featureIds.push(featureId);
      });
    });
  }

  /**
   * Remove the point markers from the map.
   */
  #removePointMarkersFromMap(): void {
    this.#featureIds.forEach((id) => {
      const feature = this.#featureHighlight.highlightSource.getFeatureById(id);
      if (feature) this.#featureHighlight.highlightSource.removeFeature(feature);
    });
    this.#featureIds = [];
  }

  /**
   * Add point markers.
   *
   * @param group - The group to add the markers to
   * @param pointMarkers - The markers to add
   */
  // TODO: REFACTOR - These functions should likely be removed from here and just be handled in the map controller, but for now they are left here to avoid breaking changes with the point marker API
  addPointMarkers(group: string, pointMarkers: TypePointMarker[]): void {
    // Redirect to map controller
    this.mapViewer.controllers.mapController.addPointMarkers(group, pointMarkers);
  }

  /**
   * Remove an array of point markers or a point marker group.
   *
   * @param group - The group to remove the markers from
   * @param idsOrCoordinates - The id or coordinate of the marker to remove
   */
  // TODO: REFACTOR - These functions should likely be removed from here and just be handled in the map controller, but for now they are left here to avoid breaking changes with the point marker API
  removePointMarkersOrGroup(group: string, idsOrCoordinates?: string[] | Coordinate[]): void {
    // Redirect to map controller
    this.mapViewer.controllers.mapController.removePointMarkersOrGroup(group, idsOrCoordinates);
  }

  /**
   * Zoom to point marker group.
   *
   * @param group - The group to zoom to
   */
  zoomToPointMarkerGroup(group: string): void {
    const groupMarkers = getStoreMapPointMarkers(this.mapId)[group];

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
   *
   * @param group - The group containing the markers to zoom to
   * @param ids - The ids of the markers to zoom to
   */
  zoomToPointMarkers(group: string, ids: string[]): void {
    // Create list of feature IDs
    const idList = ids.map((id) => `${group}-${id}`);

    // Get extent of point markers and zoom to it
    const extent = this.getExtentFromMarkerIds(idList);
    if (extent)
      this.mapViewer.controllers.mapController.zoomToExtent(extent).catch((error: unknown) => {
        // Log
        logger.logPromiseFailed('zoomToExtent in zoomToPointMarkersOrGroup in PointMarkers.zoomToPointMarkers', error);
      });
    else logger.logError(`Point marker group ${group} has no markers or does not exist, or point marker ids ${ids} are not correct.`);
  }

  /**
   * Get the extent of point markers.
   *
   * @param ids - The ids of markers to get the extents of
   * @returns The calculated extent or undefined
   */
  getExtentFromMarkerIds(ids: string[]): Extent | undefined {
    if (ids.length) {
      // Get the point coordinates and extrapolate to extent
      const coordinates = ids
        .map((id) => {
          const feature = this.#featureHighlight.highlightSource.getFeatureById(id);
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
          extent = GeoUtilities.getExtentUnion(extent, coordinates[i])!;
        }

        return extent;
      }
    }

    return undefined;
  }
}
