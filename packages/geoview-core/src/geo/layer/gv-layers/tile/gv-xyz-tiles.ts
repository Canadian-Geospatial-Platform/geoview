import TileLayer from 'ol/layer/Tile';
import { Options as TileOptions } from 'ol/layer/BaseTile';
import XYZ from 'ol/source/XYZ';
import { Extent } from 'ol/extent';

import { XYZTilesLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/xyz-layer-entry-config';
import { AbstractGVTile } from '@/geo/layer/gv-layers/tile/abstract-gv-tile';
import { featureInfoGetFieldType } from '@/geo/layer/gv-layers/utils';
import { validateExtent } from '@/geo/utils/utilities';
import { TypeOutfieldsType } from '@/api/config/types/map-schema-types';

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
   * @param {XYZ} olSource - The OpenLayer source.
   * @param {XYZTilesLayerEntryConfig} layerConfig - The layer configuration.
   */
  public constructor(mapId: string, olSource: XYZ, layerConfig: XYZTilesLayerEntryConfig) {
    super(mapId, olSource, layerConfig);

    // Create the tile layer options.
    const tileLayerOptions: TileOptions<XYZ> = { source: olSource };

    // Init the layer options with initial settings
    AbstractGVTile.initOptionsWithInitialSettings(tileLayerOptions, layerConfig);

    // Create and set the OpenLayer layer
    this.olLayer = new TileLayer(tileLayerOptions);
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
   * Overrides the get of the OpenLayers Layer Source
   * @returns {XYZ} The OpenLayers Layer Source
   */
  override getOLSource(): XYZ {
    // Get source from OL
    return super.getOLSource() as XYZ;
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
   * @returns {TypeOutfieldsType} The type of the field.
   */
  protected override getFieldType(fieldName: string): TypeOutfieldsType {
    // Redirect
    return featureInfoGetFieldType(this.getLayerConfig(), fieldName);
  }

  /**
   * Gets the bounds of the layer and returns updated bounds.
   * @returns {Extent | undefined} The layer bounding box.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  override getBounds(): Extent | undefined {
    // Get the layer
    const layer = this.getOLLayer() as TileLayer<XYZ> | undefined;

    // Get the source projection
    const sourceProjection = this.getOLSource()?.getProjection() || undefined;

    // Get the layer bounds
    let sourceExtent = layer?.getSource()?.getTileGrid()?.getExtent();
    if (sourceExtent) {
      // Make sure we're in the map projection
      sourceExtent = this.getMapViewer().convertExtentFromProjToMapProj(sourceExtent, sourceProjection);
      sourceExtent = validateExtent(sourceExtent, this.getMapViewer().getProjection().getCode());
    }

    // Return the calculated layer bounds
    return sourceExtent;
  }
}
