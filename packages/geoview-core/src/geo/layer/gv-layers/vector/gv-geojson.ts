import VectorSource from 'ol/source/Vector';
import { GeoJSONObject } from 'ol/format/GeoJSON';
import { GeoJSON as FormatGeoJSON } from 'ol/format';

import { GeoJSONLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-validation-classes/geojson-layer-entry-config';
import { AbstractGVVector } from '@/geo/layer/gv-layers/vector/abstract-gv-vector';
import { Projection } from '@/geo/utils/projection';

/**
 * Manages a GeoJSON layer.
 *
 * @exports
 * @class GVGeoJSON
 */
export class GVGeoJSON extends AbstractGVVector {
  /**
   * Constructs a GVGeoJSON layer to manage an OpenLayer layer.
   * @param {string} mapId - The map id
   * @param {VectorSource} olSource - The OpenLayer source.
   * @param {GeoJSONLayerEntryConfig} layerConfig - The layer configuration.
   */
  public constructor(mapId: string, olSource: VectorSource, layerConfig: GeoJSONLayerEntryConfig) {
    super(mapId, olSource, layerConfig);
  }

  /**
   * Overrides the get of the layer configuration associated with the layer.
   * @returns {GeoJSONLayerEntryConfig} The layer configuration or undefined if not found.
   */
  override getLayerConfig(): GeoJSONLayerEntryConfig {
    // Call parent and cast
    return super.getLayerConfig() as GeoJSONLayerEntryConfig;
  }

  /**
   * Overrides the features of a geojson layer with new geojson.
   *
   * @param {GeoJSONObject | string} geojson - The new geoJSON.
   */
  setGeojsonSource(geojson: GeoJSONObject | string): void {
    // Convert string to geoJSON if necessary
    const geojsonObject = typeof geojson === 'string' ? JSON.parse(geojson) : geojson;

    // Create features from geoJSON
    const dataProjection = geojsonObject.crs?.properties?.name || Projection.PROJECTION_NAMES.LNGLAT;
    const features = new FormatGeoJSON().readFeatures(geojsonObject, {
      dataProjection,
      featureProjection: this.getMapViewer().getProjection(),
    });

    // Get the OL layer
    const olLayer = this.getOLLayer();

    // If found
    if (olLayer) {
      // Remove current features and add new ones
      olLayer.getSource()?.clear();

      // If has features to add
      if (features.length) {
        olLayer.getSource()?.addFeatures(features);
      }

      // Refresh
      olLayer.changed();
    }
  }
}
