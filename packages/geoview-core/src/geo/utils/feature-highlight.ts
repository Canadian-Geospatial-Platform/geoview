import { getUid } from 'ol';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style';
import Feature from 'ol/Feature';
import { LineString, MultiLineString, MultiPoint, MultiPolygon, Point, Polygon } from 'ol/geom';
import { Extent, getCenter } from 'ol/extent';
import { fromExtent } from 'ol/geom/Polygon';
import { Coordinate } from 'ol/coordinate';
import { TypeHighlightColors } from '@/geo/map/map-schema-types';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import { logger } from '@/core/utils/logger';
import { MapViewer } from '@/geo/map/map-viewer';
import { TypeFeatureInfoEntry } from './layer-set';

/** *****************************************************************************************************************************
 * A class to handle highlighting of features
 *
 * @exports
 * @class FeatureHighlight
 */
export class FeatureHighlight {
  /** The map identifier the layer set belongs to */
  private mapId!: string;

  /** The vector source to use for the animation features */
  private highlighSource: VectorSource = new VectorSource();

  /** The hidden layer to display animations */
  private overlayLayer: VectorLayer<VectorSource>;

  /** The fill for the highlight */
  private highlightColor = 'black';

  /** The fill for the highlight */
  private highlightFill = new Fill({ color: [0, 0, 0, 0.3] });

  /** The style for the highlight */
  private highlightStyle = new Style({ stroke: new Stroke({ color: 'black', width: 1.25 }), fill: this.highlightFill });

  /** The style for the bbox highlight */
  private darkOutlineStyle = new Style({ stroke: new Stroke({ color: 'black', width: 1.25 }) });

  /** The ID's of currently highlighted features */
  private highlightedFeatureIds: string[] = [];

  /** Timeout of the bounding box highlight */
  private bboxTimeout: NodeJS.Timeout | null = null;

  /**
   * Initializes feature higlight classes
   * @param {MapViewer} mapViewer a reference to the map viewer
   */
  constructor(mapViewer: MapViewer) {
    this.mapId = mapViewer.mapId;

    this.overlayLayer = new VectorLayer({ source: this.highlighSource, map: mapViewer.map });
    if (MapEventProcessor.getMapHighlightColor(this.mapId) !== undefined)
      this.changeHighlightColor(MapEventProcessor.getMapHighlightColor(this.mapId) as TypeHighlightColors);
  }

  /**
   * Changes the highlight color
   * @param {TypeHighlightColor} color the new color
   */
  changeHighlightColor(color: TypeHighlightColors): void {
    this.highlightColor = color;
    if (this.highlightColor === 'white') {
      this.highlightFill.setColor([255, 255, 255, 0.3]);
      this.highlightStyle.setStroke(new Stroke({ color: 'white', width: 1.25 }));
      this.highlightStyle.setFill(this.highlightFill);
      MapEventProcessor.setMapHighlightColor(this.mapId, 'white');
    } else if (this.highlightColor === 'red') {
      this.highlightFill.setColor([255, 0, 0, 0.3]);
      this.highlightStyle.setStroke(new Stroke({ color: 'red', width: 1.25 }));
      this.highlightStyle.setFill(this.highlightFill);
      MapEventProcessor.setMapHighlightColor(this.mapId, 'red');
    } else if (this.highlightColor === 'green') {
      this.highlightFill.setColor([0, 255, 255, 0.3]);
      this.highlightStyle.setStroke(new Stroke({ color: 'green', width: 1.25 }));
      this.highlightStyle.setFill(this.highlightFill);
      MapEventProcessor.setMapHighlightColor(this.mapId, 'green');
    } else if (this.highlightColor === 'black') {
      this.highlightFill.setColor([0, 0, 0, 0.3]);
      this.highlightStyle.setStroke(new Stroke({ color: 'black', width: 1.25 }));
      this.highlightStyle.setFill(this.highlightFill);
      MapEventProcessor.setMapHighlightColor(this.mapId, 'black');
    } else logger.logError('Ineligible color - must be one of white, black, red, or green');
  }

  /**
   * Styles and registers feature for highlighting
   * @param {Feature} feature the feature to add
   * @param {string} id the id of the feature
   * @private
   */
  private styleHighlightedFeature(feature: Feature, id: string): void {
    feature.setStyle(this.highlightStyle);
    feature.setId(id);
    this.highlightedFeatureIds.push(id);
    this.highlighSource.addFeature(feature);
  }

  /**
   * Removes feature highlight(s)
   * @param {string} id the Uid of the feature to deselect, or 'all' to clear all
   */
  removeHighlight(id: string): void {
    if (id === 'all' && this.highlightedFeatureIds.length) {
      for (let i = 0; i < this.highlightedFeatureIds.length; i++) {
        this.highlighSource.removeFeature(this.highlighSource.getFeatureById(this.highlightedFeatureIds[i]) as Feature);
      }
      this.highlightedFeatureIds = [];
    } else if (this.highlightedFeatureIds.length) {
      for (let i = this.highlightedFeatureIds.length - 1; i >= 0; i--) {
        if (this.highlightedFeatureIds[i] === id || this.highlightedFeatureIds[i].startsWith(`${id}-`)) {
          if (this.highlighSource.getFeatureById(this.highlightedFeatureIds[i]))
            this.highlighSource.removeFeature(this.highlighSource.getFeatureById(this.highlightedFeatureIds[i]) as Feature);
          this.highlightedFeatureIds.splice(i, 1);
        }
      }
    }
  }

  /**
   * Highlights a feature with a plain overlay
   * @param {TypeFeatureInfoEntry} feature the feature to highlight
   */
  highlightFeature(feature: TypeFeatureInfoEntry): void {
    const geometry = feature.geometry!.getGeometry();
    if (geometry instanceof Polygon) {
      const newPolygon = feature.geometry!.getGeometry();
      const newFeature = new Feature(newPolygon);
      const featureUid = getUid(feature.geometry);
      this.styleHighlightedFeature(newFeature, featureUid);
    } else if (geometry instanceof LineString || geometry instanceof MultiLineString) {
      const newLineString = feature.geometry?.getGeometry();
      const newFeature = new Feature(newLineString);
      const featureUid = getUid(feature.geometry);
      this.styleHighlightedFeature(newFeature, featureUid);
    } else if (geometry instanceof MultiPoint) {
      const { height, width } = feature.featureIcon;
      const radius = Math.min(height, width) / 2 - 2 < 7 ? 7 : Math.min(height, width) / 2 - 2;
      const coordinates: Coordinate[] = geometry.getCoordinates();
      const featureUid = getUid(feature.geometry);

      for (let i = 0; i < coordinates.length; i++) {
        const newPoint = new Point(coordinates[i]);
        const newFeature = new Feature(newPoint);
        const id = `${featureUid}-${i}`;
        this.styleHighlightedFeature(newFeature, id);
        const radStyle = new Style({
          image: new CircleStyle({
            radius,
            stroke: new Stroke({ color: this.highlightColor, width: 1.25 }),
            fill: this.highlightFill,
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
        this.styleHighlightedFeature(newFeature, id);
      }
    } else {
      const { height, width } = feature.featureIcon;
      const radius = Math.min(height, width) / 2 - 2 < 7 ? 7 : Math.min(height, width) / 2 - 2;
      const center = getCenter(feature.extent);
      const newPoint = new Point(center);
      const newFeature = new Feature(newPoint);
      const featureUid = getUid(feature.geometry);
      this.styleHighlightedFeature(newFeature, featureUid);
      const radStyle = new Style({
        image: new CircleStyle({
          radius,
          stroke: new Stroke({ color: this.highlightColor, width: 1.25 }),
          fill: this.highlightFill,
        }),
      });
      newFeature.setStyle(radStyle);
    }
  }

  /**
   * Highlights a bounding box
   * @param {Extent} extent the extent to highlight
   * @param {boolean} isLayerHighlight optional if it is a layer highlight
   */
  highlightGeolocatorBBox(extent: Extent, isLayerHighlight = false): void {
    if (this.highlighSource.getFeatureById('geoLocatorFeature')) {
      this.highlighSource.removeFeature(this.highlighSource.getFeatureById('geoLocatorFeature') as Feature);
      clearTimeout(this.bboxTimeout as NodeJS.Timeout);
    }
    const bboxPoly = fromExtent(extent);
    const bboxFeature = new Feature(bboxPoly);
    const style = this.darkOutlineStyle;
    bboxFeature.setStyle(style);
    bboxFeature.setId('geoLocatorFeature');
    this.highlighSource.addFeature(bboxFeature);
    if (!isLayerHighlight)
      this.bboxTimeout = setTimeout(
        () => this.highlighSource.removeFeature(this.highlighSource.getFeatureById('geoLocatorFeature') as Feature),
        5000
      );
  }

  /**
   * Removes bounding box highlight
   */
  removeBBoxHighlight(): void {
    this.highlighSource.removeFeature(this.highlighSource.getFeatureById('geoLocatorFeature') as Feature);
  }
}
