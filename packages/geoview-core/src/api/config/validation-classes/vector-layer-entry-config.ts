import type { TypeGeoviewLayerType, TypeBaseVectorSourceInitialConfig } from '@/api/types/layer-schema-types';
import { CONST_LAYER_ENTRY_TYPES } from '@/api/types/layer-schema-types';
import type { AbstractBaseLayerEntryConfigProps } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import { AbstractBaseLayerEntryConfig } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import type { WmsGetStylesUrlAware } from '@/api/config/validation-classes/wms-get-styles-url-aware';
import type { TypeWFSLayerConfig } from '@/geo/layer/geoview-layers/vector/wfs';
import type { TypeOgcFeatureLayerConfig } from '@/geo/layer/geoview-layers/vector/ogc-feature';
import { AbstractGeoViewVector } from '@/geo/layer/geoview-layers/vector/abstract-geoview-vector';

export interface VectorLayerEntryConfigProps extends AbstractBaseLayerEntryConfigProps {
  /** Max number of records per page for query */
  maxPageSize?: number;

  /** Max number of records for query */
  maxRecordCount?: number;
}

/** How the total matching record count was obtained. */
export type TypeRecordsCountSource = 'numberMatched' | 'service' | 'counted';

/**
 * Type used to define a GeoView vector layer to display on the map.
 */
export abstract class VectorLayerEntryConfig extends AbstractBaseLayerEntryConfig implements WmsGetStylesUrlAware {
  /** The GetStyles full url that was used to generate the style, if any */
  // GV Attribute is duplicated in the OGC WMS entry config to keep this state off unrelated base-layer entries.
  #wmsGetStylesFullUrl?: string;

  /** Total matching records reported or counted for the latest source request. */
  #totalRecordsCount?: number;

  /** Origin of the total matching record count. */
  #totalRecordsCountSource?: TypeRecordsCountSource;

  /**
   * Creates an instance of VectorLayerEntryConfig.
   *
   * @param layerConfig - The layer configuration we want to instantiate
   * @param schemaTag - The GeoView layer type schema tag
   */
  protected constructor(layerConfig: VectorLayerEntryConfigProps | VectorLayerEntryConfig, schemaTag: TypeGeoviewLayerType) {
    super(layerConfig, schemaTag, CONST_LAYER_ENTRY_TYPES.VECTOR);
  }

  // #region OVERRIDES

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   *
   * @returns The strongly-typed source configuration specific to this layer entry config
   */
  override getSource(): TypeBaseVectorSourceInitialConfig {
    return super.getSource();
  }

  /**
   * Overrides the toJson of the mother class.
   *
   * @returns The JSON representation of the instance
   */
  protected override onToJson<T>(): T {
    // Call parent
    // GV Can be any object so disable eslint and proceed with caution
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const serialized = super.onToJson<T>() as any;

    // Copy values
    serialized.maxPageSize = this.getMaxPageSize();
    serialized.maxRecordCount = this.getMaxRecordCount();

    // Return it
    return serialized;
  }

  // #endregion OVERRIDES

  // #region METHODS

  /**
   * Gets the total matching records reported or counted for the source request.
   *
   * @returns The matching record count, or undefined when unavailable
   */
  getTotalRecordsCount(): number | undefined {
    return this.#totalRecordsCount;
  }

  /**
   * Gets how the total matching record count was obtained.
   *
   * @returns The count origin, or undefined when unavailable
   */
  getTotalRecordsCountSource(): TypeRecordsCountSource | undefined {
    return this.#totalRecordsCountSource;
  }

  /**
   * Records the total matching count and its origin for the current source request.
   *
   * @param totalRecordsCount - The matching count, or undefined to clear an earlier request's count
   * @param source - Whether the service supplied the count or downloaded records were counted
   */
  setTotalRecordsCount(totalRecordsCount: number | undefined, source?: TypeRecordsCountSource): void {
    this.#totalRecordsCount = totalRecordsCount;
    this.#totalRecordsCountSource = totalRecordsCount === undefined ? undefined : source;
  }

  /**
   * Gets the maximum number of records the service allows in a feature request for this layer.
   *
   * @returns The service maximum record count, or undefined when it is not available
   */
  getMaxPageSize(): number | undefined {
    return (this.layerEntryProps as VectorLayerEntryConfigProps).maxPageSize;
  }

  /**
   * Gets the maximum number of records the service allows in a feature request for this layer, or the default if not specified.
   *
   * @returns The service maximum record count, or the default when it is not available
   */
  getMaxPageSizeOrDefault(): number {
    return this.getMaxPageSize() ?? AbstractGeoViewVector.MAX_PAGE_SIZE;
  }

  /**
   * Gets the maximum number of records the service allows in a feature request for this layer.
   *
   * @returns The service maximum record count, or undefined when it is not available
   */
  getMaxRecordCount(): number | undefined {
    return (this.layerEntryProps as VectorLayerEntryConfigProps).maxRecordCount;
  }

  /**
   * Gets the maximum number of records the service allows in a feature request for this layer, or the default if not specified.
   *
   * @returns The service maximum record count, or the default when it is not available
   */
  getMaxRecordCountOrDefault(): number {
    return this.getMaxRecordCount() ?? AbstractGeoViewVector.MAX_FEATURES;
  }

  /**
   * Gets if the config has specified that we should fetch the styles from the WMS.
   *
   * @returns True when the styles should be fetched from the WMS. True by default
   */
  getShouldFetchStylesFromWMS(): boolean {
    return (this.getGeoviewLayerConfig() as TypeWFSLayerConfig | TypeOgcFeatureLayerConfig).fetchStylesOnWMS ?? true; // default: true
  }

  /**
   * Gets the full WMS GetStyles URL used to generate the style.
   *
   * @returns The recorded WMS GetStyles URL, or undefined if none was recorded
   */
  getWmsGetStylesFullUrl(): string | undefined {
    return this.#wmsGetStylesFullUrl;
  }

  /**
   * Stores the full WMS GetStyles URL used to generate the style.
   *
   * @param wmsGetStylesFullUrl - Full URL of the WMS GetStyles request
   */
  setWmsGetStylesFullUrl(wmsGetStylesFullUrl: string | undefined): void {
    this.#wmsGetStylesFullUrl = wmsGetStylesFullUrl;
  }

  /**
   * Gets the WMS styles URL associated with this OGC Feature layer entry config if any.
   *
   * @returns The WMS styles URL
   */
  getWmsStylesUrl(): string | undefined {
    return this.layerEntryProps.wmsUrl;
  }

  /**
   * Gets the WMS styles URL associated with this OGC Feature layer entry config if any. Returns the DataAccessPath if not specified.
   *
   * @returns The WMS styles URL
   */
  getWmsStylesUrlOrDefault(): string {
    return this.layerEntryProps.wmsUrl ?? this.getDataAccessPath();
  }

  /**
   * Gets the WMS styles layer id associated with this WFS layer entry config if any.
   *
   * @returns The WMS styles layer id
   */
  getWmsStylesLayerId(): string | undefined {
    return this.layerEntryProps.wmsLayerId;
  }

  /**
   * Gets the WMS styles layer id associated with this WFS layer entry config if any. Returns the layerId if not specified.
   *
   * @returns The WMS styles layer id
   */
  getWmsStylesLayerIdOrDefault(): string {
    return this.layerEntryProps.wmsLayerId ?? this.layerId;
  }

  // #endregion METHODS
}
