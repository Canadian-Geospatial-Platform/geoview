import VectorSource from 'ol/source/Vector';
import { GeoJSONObject } from 'ol/format/GeoJSON';
import { GeoJSON as FormatGeoJSON } from 'ol/format';
import { Projection as OLProjection } from 'ol/proj';

import { GeoJSONLayerEntryConfig } from '@/api/config/validation-classes/vector-validation-classes/geojson-layer-entry-config';
import { AbstractGVVector } from '@/geo/layer/gv-layers/vector/abstract-gv-vector';
import { Projection } from '@/geo/utils/projection';

/**
 * Manages a GeoJSON layer.
 *
 * @exports
 * @class GVGeoJSON
 */
export class GVGeoJSON extends AbstractGVVector {
  /** Custom source features */
  #geoJsonSource: GeoJSONObject | undefined;

  /**
   * Constructs a GVGeoJSON layer to manage an OpenLayer layer.
   * @param {VectorSource} olSource - The OpenLayer source.
   * @param {GeoJSONLayerEntryConfig} layerConfig - The layer configuration.
   */
  public constructor(olSource: VectorSource, layerConfig: GeoJSONLayerEntryConfig) {
    super(olSource, layerConfig);
  }

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   * @override
   * @returns {GeoJSONLayerEntryConfig} The strongly-typed layer configuration specific to this layer.
   */
  override getLayerConfig(): GeoJSONLayerEntryConfig {
    // Call parent and cast
    return super.getLayerConfig() as GeoJSONLayerEntryConfig;
  }

  /**
   * Overrides the refresh to reload the Geojson object in the layer source once the refresh completes.
   * @param {OLProjection | undefined} projection - Optional, the projection to refresh to.
   * @override
   */
  override onRefresh(projection: OLProjection | undefined): void {
    // Sure
    super.onRefresh(projection);

    // If projection is defined
    if (projection) {
      // After a refresh, reload the Geojson Source if any
      this.updateGeojsonSource(projection);
    }
  }

  /**
   * Loads a Geojson object as the layer source features, overriding the current features if any.
   * @param {GeoJSONObject | string} geojson - The geoJSON object.
   * @param {OLProjection} projection - The output projection.
   */
  setGeojsonSource(geojson: GeoJSONObject | string, projection: OLProjection): void {
    // Convert string to geoJSON if necessary
    const geojsonObject = typeof geojson === 'string' ? JSON.parse(geojson) : geojson;

    // Keep internally
    this.#geoJsonSource = geojsonObject;

    // Create features from geoJSON
    const dataProjection = geojsonObject.crs?.properties?.name || Projection.PROJECTION_NAMES.LONLAT;
    const features = new FormatGeoJSON().readFeatures(geojsonObject, {
      dataProjection,
      featureProjection: projection,
    });

    // Get the OL layer
    const olLayer = this.getOLLayer();

    // Remove current features and add new ones
    olLayer.getSource()?.clear();

    // If has features to add
    if (features.length) {
      olLayer.getSource()?.addFeatures(features);
    }

    // Refresh
    olLayer.changed();
  }

  /**
   * Updates the Geojson object, if any, to reproject the features into the new provided projection.
   * @param {OLProjection} projection - The projection to project the geojson source features into.
   */
  updateGeojsonSource(projection: OLProjection): void {
    // If a custom geojson is defined
    if (this.#geoJsonSource) {
      // Redirect
      this.setGeojsonSource(this.#geoJsonSource, projection);
    }
  }
}
