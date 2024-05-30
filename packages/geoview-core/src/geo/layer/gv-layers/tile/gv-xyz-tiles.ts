import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';
import { Extent } from 'ol/extent';

import { getMinOrMaxExtents } from '@/geo/utils/utilities';
import { Projection } from '@/geo/utils/projection';
import { AppEventProcessor } from '@/api/event-processors/event-processor-children/app-event-processor';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import { XYZTilesLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/xyz-layer-entry-config';
import { AbstractGVTile } from './abstract-gv-tile';
import { featureInfoGetFieldType } from '../utils';

/**
 * Manages a Tile<XYZ> layer.
 *
 * @exports
 * @class GVXYZTiles
 */
export class GVXYZTiles extends AbstractGVTile {
  /**
   * Constructs a GVXYZTiles layer to manage an OpenLayer layer.
   * @param {string} mapId - The map id
   * @param {TileLayer<XYZ>} olLayer - The OpenLayer layer.
   * @param {XYZTilesLayerEntryConfig} layerConfig - The layer configuration.
   */
  public constructor(mapId: string, olLayer: TileLayer<XYZ>, layerConfig: XYZTilesLayerEntryConfig) {
    super(mapId, olLayer, layerConfig);
  }

  /**
   * Overrides the get of the OpenLayers Layer
   * @returns {TileLayer<XYZ>} The OpenLayers Layer
   */
  override getOLLayer(): TileLayer<XYZ> {
    // Call parent and cast
    return super.getOLLayer() as TileLayer<XYZ>;
  }

  /**
   * Overrides the get of the layer configuration associated with the layer.
   * @returns {XYZTilesLayerEntryConfig} The layer configuration or undefined if not found.
   */
  override getLayerConfig(): XYZTilesLayerEntryConfig {
    // Call parent and cast
    return super.getLayerConfig() as XYZTilesLayerEntryConfig;
  }

  /**
   * Overrides the return of the field type from the metadata. If the type can not be found, return 'string'.
   * @param {string} fieldName - The field name for which we want to get the type.
   * @returns {'string' | 'date' | 'number'} The type of the field.
   */
  protected override getFieldType(fieldName: string): 'string' | 'date' | 'number' {
    // Redirect
    return featureInfoGetFieldType(this.getLayerConfig(), fieldName, AppEventProcessor.getDisplayLanguage(this.getMapId()));
  }

  /**
   * Gets the bounds of the layer and returns updated bounds
   * @param {Extent | undefined} bounds The current bounding box to be adjusted.
   * @returns {Extent | undefined} The new layer bounding box.
   */
  protected getBounds(bounds?: Extent): Extent | undefined {
    const layerConfig = this.getLayerConfig();
    const layer = this.getOLLayer();
    const layerBounds = layer?.getSource()?.getTileGrid()?.getExtent();
    const projection =
      layer?.getSource()?.getProjection()?.getCode().replace('EPSG:', '') ||
      MapEventProcessor.getMapState(this.getMapId()).currentProjection;

    if (layerBounds) {
      let transformedBounds = layerBounds;
      if (
        layerConfig.getMetadata()?.fullExtent?.spatialReference?.wkid !== MapEventProcessor.getMapState(this.getMapId()).currentProjection
      ) {
        transformedBounds = Projection.transformExtent(
          layerBounds,
          `EPSG:${projection}`,
          `EPSG:${MapEventProcessor.getMapState(this.getMapId()).currentProjection}`
        );
      }

      // eslint-disable-next-line no-param-reassign
      if (!bounds) bounds = [transformedBounds[0], transformedBounds[1], transformedBounds[2], transformedBounds[3]];
      // eslint-disable-next-line no-param-reassign
      else bounds = getMinOrMaxExtents(bounds, transformedBounds);
    }

    return bounds;
  }
}
