import type VectorSource from 'ol/source/Vector';
import type WKBObject from 'ol/format/WKB';
import type { Projection as OLProjection } from 'ol/proj';

import type { WkbLayerEntryConfig } from '@/api/config/validation-classes/vector-validation-classes/wkb-layer-entry-config';
import { AbstractGVVector } from '@/geo/layer/gv-layers/vector/abstract-gv-vector';
import { Projection } from '@/geo/utils/projection';
import { GeoUtilities } from '@/geo/utils/utilities';
import { logger } from '@/core/utils/logger';

/**
 * Manages a WKB layer.
 *
 * @exports
 * @class GVWKB
 */
export class GVWKB extends AbstractGVVector {
  /** Custom source features */
  #wkbSource: WKBObject | undefined;

  /**
   * Constructs a GVWKB layer to manage an OpenLayer layer.
   * @param {VectorSource} olSource - The OpenLayer source.
   * @param {WkbLayerEntryConfig} layerConfig - The layer configuration.
   */
  // The constructor is not useless, it narrows down the accepted parameter type.
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(olSource: VectorSource, layerConfig: WkbLayerEntryConfig) {
    super(olSource, layerConfig);
  }

  // #region OVERRIDES

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   * @override
   * @returns {WkbLayerEntryConfig} The strongly-typed layer configuration specific to this layer.
   */
  override getLayerConfig(): WkbLayerEntryConfig {
    // Call parent and cast
    return super.getLayerConfig() as WkbLayerEntryConfig;
  }

  /**
   * Overrides the refresh to reload the WKB object in the layer source once the refresh completes.
   * @param {OLProjection | undefined} projection - Optional, the projection to refresh to.
   * @override
   */
  override onRefresh(projection: OLProjection | undefined): void {
    // Sure
    super.onRefresh(projection);

    // If projection is defined
    if (projection) {
      // After a refresh, reload the WKB Source if any
      this.updateWkbSource(projection).catch((error: unknown) => {
        // Log promise failed
        logger.logPromiseFailed('in updateWkbSource in GV-WKB.onRefresh()', error);
      });
    }
  }

  // #endregion OVERRIDES

  // #region METHODS

  /**
   * Loads a WKB object as the layer source features, overriding the current features if any.
   * @param {WkbObject | string} wkb - The WKB object.
   * @param {OLProjection} projection - The output projection.
   */
  async setWkbSource(wkb: WKBObject | string, projection: OLProjection): Promise<void> {
    // Convert string to JSON if necessary
    const wkbObject = typeof wkb === 'string' ? JSON.parse(wkb) : wkb;

    // Keep internally
    this.#wkbSource = wkbObject;

    // Read the EPSG
    const dataEPSG = GeoUtilities.readEPSGOfGeoJSON(wkbObject) || Projection.PROJECTION_NAMES.LONLAT; // default: read the features as LONLAT

    // Check if we have it in Projection and try adding it if we're missing it
    await Projection.addProjectionIfMissing(dataEPSG);

    // Read the features
    const features = GeoUtilities.readFeaturesFromWKB(wkbObject, {
      dataProjection: dataEPSG,
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
   * Updates the WKB object, if any, to reproject the features into the new provided projection.
   * @param {OLProjection} projection - The projection to project the wkb source features into.
   */
  updateWkbSource(projection: OLProjection): Promise<void> {
    // If a custom geojson is defined
    if (this.#wkbSource) {
      // Redirect
      return this.setWkbSource(this.#wkbSource, projection);
    }

    // Nothing to do
    return Promise.resolve();
  }

  // #endregion METHODS
}
