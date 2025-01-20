import VectorTileLayer from 'ol/layer/VectorTile';
import { Options as TileOptions } from 'ol/layer/BaseTile';
import { VectorTile } from 'ol/source';
import { applyStyle } from 'ol-mapbox-style';

import { VectorTilesLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/vector-tiles-layer-entry-config';
import { featureInfoGetFieldType } from '../utils';
import { AbstractGVVectorTile } from './abstract-gv-vector-tile';
import { TypeOutfieldsType } from '@/api/config/types/map-schema-types';

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
    const declutter = true;
    this.olLayer = new VectorTileLayer({ ...tileLayerOptions, declutter });
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
   * @returns {TypeOutfieldsType} The type of the field.
   */
  protected override getFieldType(fieldName: string): TypeOutfieldsType {
    // Redirect
    return featureInfoGetFieldType(this.getLayerConfig(), fieldName);
  }

  async changeStyle(styleUrl: string): Promise<void> {
    if (styleUrl) {
      const olLayer = this.olLayer as VectorTileLayer;
      const source = olLayer?.getSource();
      if (olLayer && source) {
        const tileGrid = source.getTileGrid();
        if (tileGrid) {
          await applyStyle(olLayer, styleUrl, {
            resolutions: tileGrid.getResolutions(),
          });
        }
      }
    }
  }
}
