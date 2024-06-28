import VectorTileLayer from 'ol/layer/VectorTile';
import { Options as TileOptions } from 'ol/layer/BaseTile';
import { VectorTile } from 'ol/source';

import { AppEventProcessor } from '@/api/event-processors/event-processor-children/app-event-processor';
import { VectorTilesLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/vector-tiles-layer-entry-config';
import { featureInfoGetFieldType } from '../utils';
import { AbstractGVVectorTile } from './abstract-gv-vector-tile';

/**
 * Manages a Vector Tiles layer.
 *
 * @exports
 * @class GVVectorTiles
 */
export class GVVectorTiles extends AbstractGVVectorTile {
  /**
   * Constructs a GVVectorTiles layer to manage an OpenLayer layer.
   * @param {string} mapId - The map id
   * @param {VectorTile} olSource - The OpenLayer source.
   * @param {VectorTilesLayerEntryConfig} layerConfig - The layer configuration.
   */
  public constructor(mapId: string, olSource: VectorTile, layerConfig: VectorTilesLayerEntryConfig) {
    super(mapId, olSource, layerConfig);

    // Create the tile layer options.
    const tileLayerOptions: TileOptions<VectorTile> = { source: olSource };

    // Init the layer options with initial settings
    AbstractGVVectorTile.initOptionsWithInitialSettings(tileLayerOptions, layerConfig);

    // Create and set the OpenLayer layer
    this.olLayer = new VectorTileLayer({ ...tileLayerOptions });
  }

  /**
   * Overrides the get of the layer configuration associated with the layer.
   * @returns {VectorTilesLayerEntryConfig} The layer configuration or undefined if not found.
   */
  override getLayerConfig(): VectorTilesLayerEntryConfig {
    // Call parent and cast
    return super.getLayerConfig() as VectorTilesLayerEntryConfig;
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
}
