import VectorSource from 'ol/source/Vector';
import { GeoJSONObject } from 'ol/format/GeoJSON';
import { GeoJSON as FormatGeoJSON } from 'ol/format';
import Feature from 'ol/Feature';
import VectorLayer from 'ol/layer/Vector';

import { GeoJSONLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-validation-classes/geojson-layer-entry-config';
import { AbstractGVVector } from '@/geo/layer/gv-layers/vector/abstract-gv-vector';
import { Projection } from '@/geo/utils/projection';
import { LegendEventProcessor } from '@/api/event-processors/event-processor-children/legend-event-processor';
import { FeatureInfoEventProcessor } from '@/api/event-processors/event-processor-children/feature-info-event-processor';
import { DataTableEventProcessor } from '@/api/event-processors/event-processor-children/data-table-event-processor';
import { logger } from '@/core/utils/logger';

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
  // Disabling 'any', because that's how it is in OpenLayers
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  /** ***************************************************************************************************************************
   * Override the features of a geojson layer with new geojson.
   * @param {GeoJSONObject | string} geojson - The new geoJSON.
   */
  overrideGeojsonSource(geojson: GeoJSONObject | string): void {
    // Convert string to geoJSON if necessary
    const geojsonObject = typeof geojson === 'string' ? JSON.parse(geojson) : geojson;

    // Create features from geoJSON
    const dataProjection = geojsonObject.crs?.properties?.name || Projection.PROJECTION_NAMES.LNGLAT;
    const features = new FormatGeoJSON().readFeatures(geojsonObject, {
      dataProjection,
      featureProjection: this.getMapViewer().getProjection(),
    });

    const olLayer = this.getOLLayer() as VectorLayer<VectorSource<Feature>>;

    if (olLayer && features.length) {
      const layerPath = this.getLayerPath();
      const mapId = this.getMapId();

      // Remove current features and add new ones
      olLayer!.getSource()?.clear();
      olLayer!.getSource()?.addFeatures(features);
      olLayer.changed();

      // TODO: This is coupled with the processor. Maybe we should have a processor event to trigger this and
      // TODO.CONT: keep this functio not tie with UI.
      // Update the bounds in the store
      const bounds = this.getBounds();
      if (bounds) {
        LegendEventProcessor.setLayerBounds(mapId, layerPath, bounds);
      }

      // Reset the feature info result set
      FeatureInfoEventProcessor.resetResultSet(mapId, layerPath, 'name');

      // Update feature info
      DataTableEventProcessor.triggerGetAllFeatureInfo(mapId, layerPath).catch((error) => {
        // Log
        logger.logPromiseFailed(`Update all feature info in overrideGeojsonSource failed for layer ${layerPath}`, error);
      });
    }
  }
}
