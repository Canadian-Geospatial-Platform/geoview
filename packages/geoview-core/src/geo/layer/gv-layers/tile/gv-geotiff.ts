import WebGLTile from 'ol/layer/WebGLTile';
import type GeoTIFFSource from 'ol/source/GeoTIFF';
import type { Extent } from 'ol/extent';
import type { Projection as OLProjection } from 'ol/proj';

import type { GeoTIFFLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/geotiff-layer-entry-config';
import { AbstractGVTile } from '@/geo/layer/gv-layers/tile/abstract-gv-tile';
import { featureInfoGetFieldType } from '@/geo/layer/gv-layers/utils';
import { GeoUtilities } from '@/geo/utils/utilities';
import type { TypeOutfieldsType } from '@/api/types/map-schema-types';
import { Projection } from '@/geo/utils/projection';

/**
 * Manages a GeoTIFF layer.
 * @exports
 * @class GVGeoTIFF
 */
export class GVGeoTIFF extends AbstractGVTile {
  /**
   * Constructs a GVGeoTIFF layer to manage an OpenLayer layer.
   * @param {GeoTIFFSource} olSource - The OpenLayer source.
   * @param {GeoTIFFLayerEntryConfig} layerConfig - The layer configuration.
   */
  constructor(olSource: GeoTIFFSource, layerConfig: GeoTIFFLayerEntryConfig) {
    // Call parent constructor with source
    super(olSource, layerConfig);

    // Create WebGLTile layer
    const olLayer = new WebGLTile({
      source: olSource,
      properties: { layerConfig },
      className: `ol-layer-${layerConfig.layerId}`,
    });

    // Set the OpenLayer layer
    this.setOLLayer(olLayer);
  }

  /**
   * Overrides the parent method to return a more specific OpenLayers layer type (covariant return).
   * @override
   * @returns {WebGLTile} The strongly-typed OpenLayers type.
   */
  override getOLLayer(): WebGLTile {
    // Call parent and cast
    return super.getOLLayer() as WebGLTile;
  }

  /**
   * Overrides the parent class's method to return a more specific OpenLayers source type (covariant return).
   * @override
   * @returns {GeoTIFFSource} The GeoTIFF source instance associated with this layer.
   */
  override getOLSource(): GeoTIFFSource {
    // Get source from OL
    return super.getOLSource() as GeoTIFFSource;
  }

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   * @override
   * @returns {GeoTIFFLayerEntryConfig} The strongly-typed layer configuration specific to this layer.
   */
  override getLayerConfig(): GeoTIFFLayerEntryConfig {
    // Call parent and cast
    return super.getLayerConfig() as GeoTIFFLayerEntryConfig;
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
    // Get the source
    const source = this.getOLSource();

    // Get the source projection
    const sourceProjection = source?.getProjection() || undefined;

    // Get the layer bounds
    let sourceExtent = source?.getTileGrid()?.getExtent();

    // If both found
    if (sourceExtent && sourceProjection) {
      // Transform extent to given projection
      sourceExtent = Projection.transformExtentFromProj(sourceExtent, sourceProjection, projection, stops);
      sourceExtent = GeoUtilities.validateExtent(sourceExtent, projection.getCode());
    }

    // Return the calculated layer bounds
    return sourceExtent;
  }
}
