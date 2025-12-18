import type VectorSource from 'ol/source/Vector';
import type { GeoJSONObject } from 'ol/format/GeoJSON';
import type { Projection as OLProjection } from 'ol/proj';

import type { GeoJSONLayerEntryConfig } from '@/api/config/validation-classes/vector-validation-classes/geojson-layer-entry-config';
import { AbstractGVVector } from '@/geo/layer/gv-layers/vector/abstract-gv-vector';
import { Projection } from '@/geo/utils/projection';
import { GeoUtilities } from '@/geo/utils/utilities';
import { logger } from '@/core/utils/logger';

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
  // The constructor is not useless, it narrows down the accepted parameter type.
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(olSource: VectorSource, layerConfig: GeoJSONLayerEntryConfig) {
    super(olSource, layerConfig);
  }

  // #region OVERRIDES

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
      this.updateGeojsonSource(projection).catch((error: unknown) => {
        // Log error
        logger.logPromiseFailed('in updateGeojsonSource in GVGeoJSON.onRefresh', error);
      });
    }
  }

  // #endregion OVERRIDES

  // #region METHODS

  /**
   * Loads a Geojson object as the layer source features, overriding the current features if any.
   * @param {GeoJSONObject | string} geojson - The geoJSON object.
   * @param {OLProjection} projection - The output projection.
   */
  async setGeojsonSource(geojson: GeoJSONObject | string, projection: OLProjection): Promise<void> {
    // Convert string to geoJSON if necessary
    const geojsonObject = typeof geojson === 'string' ? JSON.parse(geojson) : geojson;

    // Keep internally
    this.#geoJsonSource = geojsonObject;

    // Read the EPSG from the data
    const dataEPSG = GeoUtilities.readEPSGOfGeoJSON(geojsonObject);

    // Check if we have it in Projection and try adding it if we're missing it
    await Projection.addProjectionIfMissing(dataEPSG);

    // Read the features (dataProjection can remain undefined here to let OpenLayers guess it via the GeoJSON reader)
    const features = GeoUtilities.readFeaturesFromGeoJSON(geojsonObject, { featureProjection: projection, dataProjection: dataEPSG });

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
  async updateGeojsonSource(projection: OLProjection): Promise<void> {
    // If a custom geojson is defined
    if (this.#geoJsonSource) {
      // Redirect
      await this.setGeojsonSource(this.#geoJsonSource, projection);
    }
  }

  // #endregion METHODS
}
