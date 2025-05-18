import { getUid } from 'ol';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style';
import Feature from 'ol/Feature';
import { Point, MultiPoint, LineString, MultiLineString, Polygon, MultiPolygon } from 'ol/geom';
import { Extent, getCenter } from 'ol/extent';
import { fromExtent } from 'ol/geom/Polygon';
import { Coordinate } from 'ol/coordinate';
import { Color } from 'ol/color';

import { TypeHighlightColors, TypeFeatureInfoEntry } from '@/api/config/types/map-schema-types';
import { logger } from '@/core/utils/logger';
import { MapViewer } from '@/geo/map/map-viewer';
import { PointMarkers } from './point-markers';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';

/**
 * A class to handle highlighting of features
 *
 * @exports
 * @class FeatureHighlight
 */
export class FeatureHighlight {
  /** Reference on the map viewer */
  mapViewer: MapViewer;

  /** The vector source to use for the highlight features */
  highlightSource: VectorSource = new VectorSource();

  /** The hidden layer to display highlight. */
  // GV It's public, to save an eslint warning, because even if it's not read in this class, it's actually important to instanciate per OpenLayer design.
  overlayLayer?: VectorLayer;

  // Used to access point markers
  pointMarkers?: PointMarkers;

  /** The fill for the highlight */
  #highlightColor: TypeHighlightColors = 'black';

  /** The fill for the highlight */
  #highlightFill = new Fill({ color: [0, 0, 0, 0.3] });

  /** The style for the highlight */
  #highlightStyle = new Style({ stroke: new Stroke({ color: 'black', width: 1.25 }), fill: this.#highlightFill });

  /** The style for the bbox highlight */
  #darkOutlineStyle = new Style({ stroke: new Stroke({ color: 'black', width: 1.25 }) });

  /** The ID's of currently highlighted features */
  #highlightedFeatureIds: string[] = [];

  /** Timeout of the bounding box highlight */
  #bboxTimeout: NodeJS.Timeout | null = null;

  /**
   * Constructor
   * @param {MapViewer} mapViewer - A reference to the map viewer
   */
  constructor(mapViewer: MapViewer) {
    // Keep the reference
    this.mapViewer = mapViewer;
  }

  /**
   * Initializes the FeatureHightlight with the MapViewer, now that the map is accessible inside the MapViewer.
   */
  init(): void {
    // Initialize the Feature Hightlight
    this.overlayLayer = new VectorLayer({ source: this.highlightSource, map: this.mapViewer.map });
    this.pointMarkers = new PointMarkers(this.mapViewer, this);
    if (MapEventProcessor.getFeatureHighlightColor(this.mapViewer.mapId) !== 'black')
      this.changeHighlightColor(MapEventProcessor.getFeatureHighlightColor(this.mapViewer.mapId));
  }

  /**
   * Changes the highlight color
   * @param {TypeHighlightColors} color - New color
   */
  changeHighlightColor(color: TypeHighlightColors): void {
    this.#highlightColor = color;

    // set deafult value to black then check if vallid color
    let stroke: Stroke = new Stroke({ color: 'black', width: 1.25 });
    let featureColor: Color = [0, 0, 0, 0.3];
    switch (color) {
      case 'white': {
        featureColor = [255, 255, 255, 0.3];
        stroke = new Stroke({ color: 'white', width: 1.25 });
        break;
      }
      case 'red': {
        featureColor = [255, 0, 0, 0.3];
        stroke = new Stroke({ color: 'red', width: 1.25 });
        break;
      }
      case 'green': {
        featureColor = [0, 255, 255, 0.3];
        stroke = new Stroke({ color: 'green', width: 1.25 });
        break;
      }
      case 'black': {
        break;
      }
      default: {
        logger.logWarning('Ineligible color - defaulted to black');
        break;
      }
    }

    // set color
    this.#highlightFill.setColor(featureColor);
    this.#highlightStyle.setStroke(stroke);
    this.#highlightStyle.setFill(this.#highlightFill);
  }

  /**
   * Styles and registers feature for highlighting
   * @param {Feature} feature - Feature to add
   * @param {string} id - Id of the feature
   * @private
   */
  #styleHighlightedFeature(feature: Feature, id: string): void {
    feature.setStyle(this.#highlightStyle);
    feature.setId(id);
    this.#highlightedFeatureIds.push(id);
    this.highlightSource.addFeature(feature);
  }

  /**
   * Removes feature highlight(s)
   * @param {string} id - Uid of the feature to deselect, or 'all' to clear all
   */
  removeHighlight(id: string): void {
    if (id === 'all' && this.#highlightedFeatureIds.length) {
      for (let i = 0; i < this.#highlightedFeatureIds.length; i++) {
        this.highlightSource.removeFeature(this.highlightSource.getFeatureById(this.#highlightedFeatureIds[i]) as Feature);
      }
      this.#highlightedFeatureIds = [];
    } else if (this.#highlightedFeatureIds.length) {
      for (let i = this.#highlightedFeatureIds.length - 1; i >= 0; i--) {
        if (this.#highlightedFeatureIds[i] === id || this.#highlightedFeatureIds[i].startsWith(`${id}-`)) {
          const featureToRemove = this.highlightSource.getFeatureById(this.#highlightedFeatureIds[i]);
          if (featureToRemove) this.highlightSource.removeFeature(featureToRemove);
          this.#highlightedFeatureIds.splice(i, 1);
        }
      }
    }
  }

  /**
   * Highlights a feature with a plain overlay
   * @param {TypeFeatureInfoEntry} feature - Feature to highlight
   */
  highlightFeature(feature: TypeFeatureInfoEntry): void {
    const geometry = feature.geometry!.getGeometry();
    if (geometry instanceof Polygon) {
      const newPolygon = feature.geometry!.getGeometry();
      const newFeature = new Feature(newPolygon);
      const featureUid = getUid(feature.geometry);
      this.#styleHighlightedFeature(newFeature, featureUid);
    } else if (geometry instanceof LineString || geometry instanceof MultiLineString) {
      const newLineString = feature.geometry?.getGeometry();
      const newFeature = new Feature(newLineString);
      const featureUid = getUid(feature.geometry);
      this.#styleHighlightedFeature(newFeature, featureUid);
    } else if (geometry instanceof MultiPoint) {
      const coordinates: Coordinate[] = geometry.getCoordinates();
      const featureUid = getUid(feature.geometry);

      for (let i = 0; i < coordinates.length; i++) {
        const newPoint = new Point(coordinates[i]);
        const newFeature = new Feature(newPoint);
        const id = `${featureUid}-${i}`;
        this.#styleHighlightedFeature(newFeature, id);
        const radStyle = new Style({
          image: new CircleStyle({
            radius: 10,
            stroke: new Stroke({ color: this.#highlightColor, width: 1.25 }),
            fill: this.#highlightFill,
          }),
        });
        newFeature.setStyle(radStyle);
      }
    } else if (geometry instanceof MultiPolygon) {
      const polygons = (geometry as MultiPolygon).getPolygons();
      const featureUid = getUid(feature.geometry);

      for (let i = 0; i < polygons.length; i++) {
        const newPolygon = polygons[i];
        const newFeature = new Feature(newPolygon);
        const id = `${featureUid}-${i}`;
        this.#styleHighlightedFeature(newFeature, id);
      }
    } else if (feature.extent) {
      const center = getCenter(feature.extent);
      const newPoint = new Point(center);
      const newFeature = new Feature(newPoint);
      const featureUid = getUid(feature.geometry);
      this.#styleHighlightedFeature(newFeature, featureUid);
      const radStyle = new Style({
        image: new CircleStyle({
          radius: 10,
          stroke: new Stroke({ color: this.#highlightColor, width: 1.25 }),
          fill: this.#highlightFill,
        }),
      });
      newFeature.setStyle(radStyle);
    }
    this.overlayLayer?.changed();
  }

  /**
   * Highlights a bounding box
   * @param {Extent} extent - Extent to highlight
   * @param {boolean} isLayerHighlight - Optional if it is a layer highlight
   */
  highlightGeolocatorBBox(extent: Extent, isLayerHighlight = false): void {
    if (this.highlightSource.getFeatureById('geoLocatorFeature')) {
      this.highlightSource.removeFeature(this.highlightSource.getFeatureById('geoLocatorFeature') as Feature);
      clearTimeout(this.#bboxTimeout as NodeJS.Timeout);
    }
    const bboxPoly = fromExtent(extent);
    const bboxFeature = new Feature(bboxPoly);
    const style = this.#darkOutlineStyle;
    bboxFeature.setStyle(style);
    bboxFeature.setId('geoLocatorFeature');
    this.highlightSource.addFeature(bboxFeature);
    if (!isLayerHighlight)
      this.#bboxTimeout = setTimeout(
        () => this.highlightSource.removeFeature(this.highlightSource.getFeatureById('geoLocatorFeature') as Feature),
        5000
      );
  }

  /**
   * Removes bounding box highlight
   */
  removeBBoxHighlight(): void {
    this.highlightSource.removeFeature(this.highlightSource.getFeatureById('geoLocatorFeature') as Feature);
  }
}
