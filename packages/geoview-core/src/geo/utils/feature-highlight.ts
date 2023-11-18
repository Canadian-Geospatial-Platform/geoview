import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style';
import Feature from 'ol/Feature';
import { Geometry, LineString, MultiLineString, MultiPoint, MultiPolygon, Point, Polygon } from 'ol/geom';
import { Extent, getCenter } from 'ol/extent';
import { getUid } from 'ol';
import { fromExtent } from 'ol/geom/Polygon';
import { Coordinate, TypeFeatureInfoEntry, api } from '@/app';

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
  private animationSource: VectorSource = new VectorSource();

  /** The hidden layer to display animations */
  private overlayLayer: VectorLayer<VectorSource>;

  /** The style to make a linestring blink */
  private blankStyle: Style = new Style({});

  /** The fill for the animation */
  private whiteFill: Fill = new Fill({ color: [255, 255, 255, 0.3] });

  /** The style for the feature animation */
  private whiteStyle: Style = new Style({ stroke: new Stroke({ color: 'white', width: 1.25 }), fill: this.whiteFill });

  /** The ID's of currently animated features */
  private featureIds: string[] = [];

  /** List of timeout intervals to clear when removing selection */
  private intervals: NodeJS.Timeout[] = [];

  /** Timeout of the bounding box highlight */
  private bboxTimeout: NodeJS.Timeout | null = null;

  constructor(mapId: string) {
    this.mapId = mapId;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    this.overlayLayer = new VectorLayer({ source: this.animationSource, map: api.maps[this.mapId].map });
  }

  /**
   * Set animation for points
   *
   * @param {number} radius max radius of circle to draw
   * @param {Feature<Point>} pointFeature the feature to animate
   * @returns {NodeJS.Timeout} The interval timer.
   */
  private pointInterval(radius: number, pointFeature: Feature<Point>): NodeJS.Timeout {
    let animationRadius = radius;
    const pointIntervalId = setInterval(() => {
      const radStyle = new Style({
        image: new CircleStyle({
          radius: animationRadius,
          stroke: new Stroke({
            color: 'white',
          }),
          fill: this.whiteFill,
        }),
      });
      pointFeature.setStyle(radStyle);
      animationRadius -= 2;
      if (animationRadius <= 0) animationRadius = radius;
    }, 250);
    return pointIntervalId;
  }

  /**
   * Set animation for polygons
   *
   * @param {Geometry} geometry the geometry to animate
   * @returns {NodeJS.Timeout} The interval timer.
   */
  private polygonInterval(geometry: Geometry, feature: Feature): NodeJS.Timeout {
    let counter = 10;
    let adjustGeometry = geometry.clone();
    const polygonIntervalId = setInterval(() => {
      adjustGeometry.scale(0.1 * counter);
      feature.setGeometry(adjustGeometry);
      counter--;
      if (counter === 0) {
        counter = 10;
        adjustGeometry = geometry.clone();
      }
    }, 250);
    return polygonIntervalId;
  }

  /**
   * Style, register, and add feature for animation
   *
   * @param {Feature} feature the feature to add
   * @param {string} id the id of the feature
   */
  private addFeatureAnimation(feature: Feature, id: string) {
    feature.setStyle(this.whiteStyle);
    feature.setId(id);
    this.featureIds.push(id);
    this.animationSource.addFeature(feature);
  }

  /**
   * Animate selected point
   *
   * @param {TypeFeatureInfoEntry} feature the point feature to animate
   */
  private animateSelection(feature: TypeFeatureInfoEntry) {
    const { height, width } = feature.featureIcon;
    const radius = Math.min(height, width) / 2 - 2 < 7 ? 7 : Math.min(height, width) / 2 - 2;
    const center = getCenter(feature.extent);
    const newPoint = new Point(center);
    const newFeature = new Feature(newPoint);
    const featureUid = getUid(feature.geometry);
    this.addFeatureAnimation(newFeature, featureUid);

    const multiIntervalId = this.pointInterval(radius, newFeature);
    this.intervals.push(multiIntervalId);
  }

  /**
   * Animate all points in MultiPoint feature
   *
   * @param {TypeFeatureInfoEntry} feature the MultiPoint feature to animate
   */
  private animateMultiPoint(feature: TypeFeatureInfoEntry) {
    const geometry = feature.geometry!.getGeometry() as MultiPoint;
    const { height, width } = feature.featureIcon;
    const radius = Math.min(height, width) / 2 - 2 < 7 ? 7 : Math.min(height, width) / 2 - 2;
    const coordinates: Coordinate[] = geometry.getCoordinates();
    const featureUid = getUid(feature.geometry);

    for (let i = 0; i < coordinates.length; i++) {
      const newPoint = new Point(coordinates[i]);
      const newFeature = new Feature(newPoint);
      const id = `${featureUid}-${i}`;
      this.addFeatureAnimation(newFeature, id);

      const multiIntervalId = this.pointInterval(radius, newFeature);
      this.intervals.push(multiIntervalId);
    }
  }

  /**
   * Animate selected polygon
   *
   * @param {TypeFeatureInfoEntry} feature the feature Polygon to animate
   */
  private animatePolygon(feature: TypeFeatureInfoEntry) {
    const newPolygon = feature.geometry!.getGeometry();
    const newFeature = new Feature(newPolygon);
    const featureUid = getUid(feature.geometry);
    this.addFeatureAnimation(newFeature, featureUid);

    const multiIntervalId = this.polygonInterval(feature.geometry!.getGeometry()! as Geometry, newFeature);
    this.intervals.push(multiIntervalId);
  }

  /**
   * Animate all points in MultiPolygon feature
   *
   * @param {TypeFeatureInfoEntry} feature the multiPolygon feature to animate
   */
  private animateMultiPolygon(feature: TypeFeatureInfoEntry) {
    const polygons = (feature.geometry?.getGeometry() as MultiPolygon).getPolygons();
    const featureUid = getUid(feature.geometry);

    for (let i = 0; i < polygons.length; i++) {
      const newPolygon = polygons[i];
      const newFeature = new Feature(newPolygon);
      const id = `${featureUid}-${i}`;
      this.addFeatureAnimation(newFeature, id);

      const multiIntervalId = this.polygonInterval(polygons[i], newFeature);
      this.intervals.push(multiIntervalId);
    }
  }

  /**
   * Animate selected lineString
   *
   * @param {TypeFeatureInfoEntry} feature the lineString feature to animate
   */
  private animateLineString(feature: TypeFeatureInfoEntry) {
    const newLineString = feature.geometry?.getGeometry();
    const newFeature = new Feature(newLineString);
    const featureUid = getUid(feature.geometry);
    this.addFeatureAnimation(newFeature, featureUid);
    let counter = 0;
    this.intervals.push(
      setInterval(() => {
        if (!(counter % 8)) newFeature.setStyle(this.whiteStyle);
        else newFeature.setStyle(this.blankStyle);
        counter++;
        if (counter > 9999) counter = 0;
      }, 250)
    );
  }

  /**
   * Reset animation feature and clear intervals
   *
   * @param {string} id the Uid of the feature to deselect, or 'all' to clear all
   */
  resetAnimation(id: string) {
    if (id === 'all' && this.featureIds.length) {
      for (let i = 0; i < this.featureIds.length; i++) {
        this.animationSource.removeFeature(this.animationSource.getFeatureById(this.featureIds[i]) as Feature);
        clearInterval(this.intervals[i]);
      }
      this.featureIds = [];
      this.intervals = [];
    } else if (this.featureIds.length) {
      for (let i = this.featureIds.length - 1; i >= 0; i--) {
        if (this.featureIds[i] === id || this.featureIds[i].startsWith(`${id}-`)) {
          if (this.animationSource.getFeatureById(this.featureIds[i]))
            this.animationSource.removeFeature(this.animationSource.getFeatureById(this.featureIds[i]) as Feature);
          clearInterval(this.intervals[i]);
          this.intervals.splice(i, 1);
          this.featureIds.splice(i, 1);
        }
      }
    }
  }

  /**
   * Highlight a feature
   *
   * @param {TypeFeatureInfoEntry} feature the feature to highlight
   */
  highlightFeature(feature: TypeFeatureInfoEntry) {
    const geometry = feature.geometry!.getGeometry();
    if (geometry instanceof Polygon) {
      this.animatePolygon(feature);
    } else if (geometry instanceof LineString || geometry instanceof MultiLineString) {
      this.animateLineString(feature);
    } else if (geometry instanceof MultiPoint) {
      this.animateMultiPoint(feature);
    } else if (geometry instanceof MultiPolygon) {
      this.animateMultiPolygon(feature);
    } else this.animateSelection(feature);
  }

  /**
   * Highlight a bounding box
   *
   * @param {Extent} extent the extent to highlight
   */
  highlightGeolocatorBBox(extent: Extent) {
    if (this.animationSource.getFeatureById('geoLocatorFeature')) {
      this.animationSource.removeFeature(this.animationSource.getFeatureById('geoLocatorFeature') as Feature);
      clearTimeout(this.bboxTimeout as NodeJS.Timeout);
    }
    const bboxFill = new Fill({ color: [0, 0, 0, 0.3] });
    const bboxStyle = new Style({ stroke: new Stroke({ color: 'black', width: 1.25 }), fill: bboxFill });
    const bboxPoly = fromExtent(extent);
    const bboxFeature = new Feature(bboxPoly);
    bboxFeature.setStyle(bboxStyle);
    bboxFeature.setId('geoLocatorFeature');
    this.animationSource.addFeature(bboxFeature);
    this.bboxTimeout = setTimeout(
      () => this.animationSource.removeFeature(this.animationSource.getFeatureById('geoLocatorFeature') as Feature),
      5000
    );
  }
}
