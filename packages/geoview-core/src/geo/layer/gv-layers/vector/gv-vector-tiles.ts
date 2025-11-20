import VectorTileLayer from 'ol/layer/VectorTile';
import type { Options as TileOptions } from 'ol/layer/BaseTile';
import type { VectorTile } from 'ol/source';
import { applyStyle } from 'ol-mapbox-style';

import type { VectorTilesLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/vector-tiles-layer-entry-config';
import { GVLayerUtilities } from '@/geo/layer/gv-layers/utils';
import { AbstractGVVectorTile } from '@/geo/layer/gv-layers/vector/abstract-gv-vector-tile';
import type { TypeOutfieldsType } from '@/api/types/map-schema-types';

/**
 * Manages a Vector Tiles layer.
 *
 * @exports
 * @class GVVectorTiles
 */
export class GVVectorTiles extends AbstractGVVectorTile {
  /**
   * Constructs a GVVectorTiles layer to manage an OpenLayer layer.
   * @param {VectorTile} olSource - The OpenLayer source.
   * @param {VectorTilesLayerEntryConfig} layerConfig - The layer configuration.
   */
  constructor(olSource: VectorTile, layerConfig: VectorTilesLayerEntryConfig) {
    super(olSource, layerConfig);

    // Create the tile layer options.
    const tileLayerOptions: TileOptions<VectorTile> = { source: olSource };

    // Init the layer options with initial settings
    AbstractGVVectorTile.initOptionsWithInitialSettings(tileLayerOptions, layerConfig);

    // Create and set the OpenLayer layer
    const declutter = true;
    this.setOLLayer(new VectorTileLayer({ ...tileLayerOptions, declutter }));
  }

  // #region OVERRIDES

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   * @override
   * @returns {VectorTilesLayerEntryConfig} The strongly-typed layer configuration specific to this layer.
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
  protected override onGetFieldType(fieldName: string): TypeOutfieldsType {
    // Redirect
    return GVLayerUtilities.featureInfoGetFieldType(this.getLayerConfig(), fieldName);
  }

  // #endregion OVERRIDES

  // #region METHODS

  /**
   * Used to change the style of the vector tile layer.
   * @param styleUrl The style URL to apply to the layer
   * @returns Promise<void>
   */
  changeStyle(styleUrl: string): Promise<void> {
    if (styleUrl) {
      const olLayer = this.getOLLayer();
      const source = this.getOLSource();
      const tileGrid = source.getTileGrid();
      if (tileGrid) {
        return applyStyle(olLayer, styleUrl, {
          resolutions: tileGrid.getResolutions(),
        });
      }
    }

    // Done, no style, no layer, no source, or no tilegrid to process
    return Promise.resolve();
  }

  // #endregion METHODS
}
