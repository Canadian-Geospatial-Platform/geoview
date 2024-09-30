import axios from 'axios';

import { TypeJsonObject } from '@config/types/config-types';
import { GroupLayerEntryConfig } from '@config/types/classes/sub-layer-config/group-node/group-layer-entry-config';
import { Extent } from '@config/types/map-schema-types';
import { GeoviewLayerConfigError } from '@config/types/classes/config-exceptions';
import { isvalidComparedToInternalSchema } from '@config/utils';

import { logger } from '@/core/utils/logger';
import { Projection } from '@/geo/utils/projection';
import { validateExtentWhenDefined } from '@/geo/utils/utilities';
import { TypeJsonArray } from '@/app';

// ========================
// #region CLASS HEADER
/**
 * Base type used to define the common implementation of an ESRI GeoView sublayer to display on the map.
 */
export class EsriGroupLayerConfig extends GroupLayerEntryConfig {
  // ===============
  // #region METHODS
  /*
   * Methods are listed in the following order: abstract, override, private, protected and public.
   */

  // ================
  // #region OVERRIDE
  // TODO: Have a chat with Alex abaout his comment "It doesn't help that not all code paths return an explicit Promise
  // TODOCONT: (only an implicit Promise is returned here (one on the return line and one at the end of the function)).
  // TODOCONT: Personally, I wish we would have an ESLint rule to that effect, to prevent accidents/unintentional behavior when chaining promises."
  /**
   * This method is used to fetch, parse and extract the relevant information from the metadata of the group layer.
   * The same method signature is used by layer group nodes and leaf nodes (layers).
   * @override
   */
  override async fetchLayerMetadata(): Promise<void> {
    // If an error has already been detected, then the layer is unusable.
    if (this.getErrorDetectedFlag()) return;

    const serviceMetadata = this.getGeoviewLayerConfig().getServiceMetadata();

    // If we can't find the group's layerId in the list of layers contained in the service metadata, then an attempt to query
    // with this layerId won't return the expected information. However, the service metadata contains an aggregated version of
    // the information sought in a different structure. We will therefore use #parseServiceMetadata to parse this metadata.
    if (!(serviceMetadata.layers as TypeJsonArray).find((availableLayer) => (availableLayer.id as string) === this.layerId)) {
      // The metadata used are the service metadata.
      this.setLayerMetadata(serviceMetadata);
      // parse the raw service metadata and build the geoview configuration.
      this.#parseServiceMetadata();
    } else {
      // The layer exists and we can fetch its metadata and parse it.
      const serviceUrl = serviceMetadata.metadataAccessPath as string;
      const queryUrl = serviceUrl.endsWith('/') ? `${serviceUrl}${this.layerId}` : `${serviceUrl}/${this.layerId}`;

      try {
        const { data } = await axios.get<TypeJsonObject>(`${queryUrl}?f=json`);
        if ('error' in data) logger.logError('Error detected while reading layer metadata.', data.error);
        else {
          // The metadata used are the layer metadata.
          this.setLayerMetadata(data);
          // Parse the raw layer metadata and build the geoview configuration.
          this.parseLayerMetadata();
          return;
        }
      } catch (error) {
        logger.logError('Error detected while reading Layer metadata.', error);
        this.setErrorDetectedFlag();
      }
    }

    await this.fetchListOfLayerMetadata();

    if (!isvalidComparedToInternalSchema(this.getSchemaPath(), this, true)) {
      throw new GeoviewLayerConfigError(
        `GeoView internal configuration ${this.getLayerPath()} is invalid compared to the internal schema specification.`
      );
    }
  }

  /**
   * This method is used to analyze metadata and extract the relevant information from a group layer based on a definition
   * provided by the ESRI service.
   * @override @protected
   */
  protected override parseLayerMetadata(): void {
    const layerMetadata = this.getLayerMetadata();

    this.minScale = layerMetadata.minScale as number;
    this.maxScale = layerMetadata.maxScale as number;

    const metadataExtent = [
      layerMetadata.initialExtent.xmin,
      layerMetadata.initialExtent.ymin,
      layerMetadata.initialExtent.xmax,
      layerMetadata.initialExtent.ymax,
    ] as Extent;
    const sourceProj = layerMetadata.initialExtent.spatialReference.wkid;
    if (sourceProj === '4326') this.initialSettings.extent = validateExtentWhenDefined(metadataExtent);
    else
      this.initialSettings.extent = validateExtentWhenDefined(
        Projection.transformExtent(metadataExtent, `EPSG:${sourceProj}`, Projection.PROJECTION_NAMES.LNGLAT)
      );

    if (layerMetadata.defaultVisibility !== undefined) this.initialSettings.states!.visible = layerMetadata.defaultVisibility as boolean;

    this.initialSettings.states!.queryable = (layerMetadata?.capabilities as string)?.includes('Query') || false;

    if (layerMetadata.copyrightText) this.attributions.push(layerMetadata.copyrightText as string);
  }

  // #endregion OVERRIDE

  // ===============
  // #region PRIVATE
  /**
   * This method is used to analyze metadata and extract the relevant information from a group layer based on a definition
   * provided by the user's configuration. In this case, we use the service metadata.
   * @private
   */
  #parseServiceMetadata(): void {
    const serviceMetadata = this.getGeoviewLayerConfig().getServiceMetadata();

    this.minScale = serviceMetadata.minScale as number;
    this.maxScale = serviceMetadata.maxScale as number;

    const metadataExtent = [
      serviceMetadata.initialExtent.xmin,
      serviceMetadata.initialExtent.ymin,
      serviceMetadata.initialExtent.xmax,
      serviceMetadata.initialExtent.ymax,
    ] as Extent;
    const sourceProj = serviceMetadata.initialExtent.spatialReference.wkid;
    if (sourceProj === '4326') this.initialSettings.extent = validateExtentWhenDefined(metadataExtent);
    else
      this.initialSettings.extent = validateExtentWhenDefined(
        Projection.transformExtent(metadataExtent, `EPSG:${sourceProj}`, Projection.PROJECTION_NAMES.LNGLAT)
      );

    this.initialSettings.states!.queryable = (serviceMetadata?.capabilities as string)?.includes('Query') || false;

    if (serviceMetadata.copyrightText) this.attributions.push(serviceMetadata.copyrightText as string);
  }
  // #endregion PRIVATE
  // #endregion METHODS
  // #endregion CLASS HEADER
}
