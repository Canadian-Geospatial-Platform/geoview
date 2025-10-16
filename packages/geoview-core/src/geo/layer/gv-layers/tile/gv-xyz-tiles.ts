import TileLayer from 'ol/layer/Tile';
import type { Options as TileOptions } from 'ol/layer/BaseTile';
import type XYZ from 'ol/source/XYZ';
import type { Extent } from 'ol/extent';
import type { Projection as OLProjection } from 'ol/proj';

import type { XYZTilesLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/xyz-layer-entry-config';
import { AbstractGVTile } from '@/geo/layer/gv-layers/tile/abstract-gv-tile';
import { featureInfoGetFieldType } from '@/geo/layer/gv-layers/utils';
import { validateExtent } from '@/geo/utils/utilities';
import type { TypeOutfieldsType } from '@/api/types/map-schema-types';
import { Projection } from '@/geo/utils/projection';

/**
 * Manages a Tile<XYZ> layer.
 *
 * @exports
 * @class GVXYZTiles
 */
export class GVXYZTiles extends AbstractGVTile {
  /**
   * Constructs a GVXYZTiles layer to manage an OpenLayer layer.
   * @param {XYZ} olSource - The OpenLayer source.
   * @param {XYZTilesLayerEntryConfig} layerConfig - The layer configuration.
   */
  public constructor(olSource: XYZ, layerConfig: XYZTilesLayerEntryConfig) {
    super(olSource, layerConfig);

    // Create the tile layer options.
    const tileLayerOptions: TileOptions<XYZ> = { source: olSource };

    // Init the layer options with initial settings
    AbstractGVTile.initOptionsWithInitialSettings(tileLayerOptions, layerConfig);

    // Create and set the OpenLayer layer
    this.setOLLayer(new TileLayer(tileLayerOptions));
  }

  /**
   * Overrides the parent method to return a more specific OpenLayers layer type (covariant return).
   * @override
   * @returns {TileLayer<XYZ>} The strongly-typed OpenLayers type.
   */
  override getOLLayer(): TileLayer<XYZ> {
    // Call parent and cast
    return super.getOLLayer() as TileLayer<XYZ>;
  }

  /**
   * Overrides the parent class's method to return a more specific OpenLayers source type (covariant return).
   * @override
   * @returns {XYZ} The XYZ source instance associated with this layer.
   */
  override getOLSource(): XYZ {
    // Get source from OL
    return super.getOLSource() as XYZ;
  }

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   * @override
   * @returns {XYZTilesLayerEntryConfig} The strongly-typed layer configuration specific to this layer.
   */
  override getLayerConfig(): XYZTilesLayerEntryConfig {
    // Call parent and cast
    return super.getLayerConfig() as XYZTilesLayerEntryConfig;
  }

  /**
   * Overrides the return of the field type from the metadata. If the type can not be found, return 'string'.
   * @param {string} fieldName - The field name for which we want to get the type.
   * @returns {TypeOutfieldsType} The type of the field.
   */
  protected override onGetFieldType(fieldName: string): TypeOutfieldsType {
    // Redirect
    return featureInfoGetFieldType(this.getLayerConfig(), fieldName);
  }

  /**
   * Overrides the way to get the bounds for this layer type.
   * @param {OLProjection} projection - The projection to get the bounds into.
   * @param {number} stops - The number of stops to use to generate the extent.
   * @returns {Extent | undefined} The layer bounding box.
   */
  override onGetBounds(projection: OLProjection, stops: number): Extent | undefined {
    // Get the layer
    const layer = this.getOLLayer() as TileLayer<XYZ> | undefined;

    // Get the source projection
    const sourceProjection = this.getOLSource()?.getProjection() || undefined;

    // Get the layer bounds
    let sourceExtent = layer?.getSource()?.getTileGrid()?.getExtent();

    // If both found
    if (sourceExtent && sourceProjection) {
      // Transform extent to given projection
      sourceExtent = Projection.transformExtentFromProj(sourceExtent, sourceProjection, projection, stops);
      sourceExtent = validateExtent(sourceExtent, projection.getCode());
    }

    // Return the calculated layer bounds
    return sourceExtent;
  }
}
