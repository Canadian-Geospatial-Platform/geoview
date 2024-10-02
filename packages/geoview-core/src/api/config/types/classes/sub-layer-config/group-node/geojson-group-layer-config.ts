import { GroupLayerEntryConfig } from '@config/types/classes/sub-layer-config/group-node/group-layer-entry-config';
import { isvalidComparedToInternalSchema } from '@config/utils';
import { GeoviewLayerConfigError } from '@config/types/classes/config-exceptions';
import { GeoJsonLayerConfig } from '@config/types/classes/geoview-config/vector-config/geojson-config';
import { Cast } from '@config/types/config-types';
import { Extent, TypeLayerInitialSettings } from '@config/types/map-schema-types';
import { merge } from 'lodash';
import { validateExtentWhenDefined } from '@/geo/utils/utilities';
import { logger } from '@/core/utils/logger';

// ========================
// #region CLASS HEADER
/**
 * Base type used to define the common implementation of a GeoJson GeoView sublayer to display on the map.
 */
export class GeoJsonGroupLayerConfig extends GroupLayerEntryConfig {
  // ===============
  // #region METHODS
  /*
   * Methods are listed in the following order: abstract, override, private, protected, public and static.
   */

  // ================
  // #region OVERRIDE
  /**
   * Shadow method used to do a cast operation on the parent method to return GeoJsonLayerConfig instead of
   * AbstractGeoviewLayerConfig.
   *
   * @returns {GeoJsonLayerConfig} The Geoview layer configuration that owns this GeoJson layer entry config.
   * @override
   */
  override getGeoviewLayerConfig(): GeoJsonLayerConfig {
    return super.getGeoviewLayerConfig() as GeoJsonLayerConfig;
  }

  /** ***************************************************************************************************************************
   * This method is used to fetch, parse and extract the relevant information from the metadata for the group layer.
   * The same method signature is used by layer group nodes and leaf nodes (layers).
   * @override @async
   */
  override async fetchLayerMetadata(): Promise<void> {
    // If an error has already been detected, then the layer is unusable.
    if (this.getErrorDetectedFlag()) return;

    const layerMetadata = this.getGeoviewLayerConfig().findLayerMetadataEntry(this.layerId);
    if (layerMetadata) {
      this.setLayerMetadata(layerMetadata);

      // Parse the raw layer metadata and build the geoview configuration.
      this.parseLayerMetadata();
    }

    // Fetch the sub-layers metadata that compose the group.
    await this.fetchListOfLayerMetadata();

    if (!isvalidComparedToInternalSchema(this.getSchemaPath(), this, true)) {
      throw new GeoviewLayerConfigError(
        `GeoView internal configuration ${this.getLayerPath()} is invalid compared to the internal schema specification.`
      );
    }
  }

  /**
   * This method is used to parse the layer metadata and extract the source information and other properties.
   * @override @protected
   */
  protected override parseLayerMetadata(): void {
    const layerMetadata = this.getLayerMetadata();

    if (layerMetadata?.attributions) this.attributions.push(layerMetadata.attributions as string);
    this.layerName = layerMetadata.layerName as string;
    this.minScale = (layerMetadata?.minScale || this.minScale) as number;
    this.maxScale = (layerMetadata.maxScale || this.maxScale) as number;

    this.initialSettings = Cast<TypeLayerInitialSettings>(merge(this.initialSettings, layerMetadata.initialSettings));

    if (layerMetadata?.initialSettings?.extent) {
      this.initialSettings.extent = validateExtentWhenDefined(layerMetadata.initialSettings.extent as Extent);
      if (this?.initialSettings?.extent?.find?.((value, i) => value !== layerMetadata.initialSettings.extent[i]))
        logger.logWarning(
          `The extent specified in the metadata for the layer path “${this.getLayerPath()}” is considered invalid and has been corrected.`
        );
    }

    if (layerMetadata?.bounds) {
      this.bounds = validateExtentWhenDefined(layerMetadata.bounds as Extent);
      if (this?.bounds?.find?.((value, i) => value !== layerMetadata.bounds[i]))
        logger.logWarning(
          `The bounds specified in the metadata for the layer path “${this.getLayerPath()}” is considered invalid and has been corrected.`
        );
    }
  }

  // #endregion OVERRIDE
  // #endregion METHODS
  // #endregion CLASS HEADER
}
