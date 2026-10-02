import type { TypeGeoviewLayerType, TypeBaseVectorSourceInitialConfig } from '@/api/types/layer-schema-types';
import { CONST_LAYER_ENTRY_TYPES } from '@/api/types/layer-schema-types';
import type { AbstractBaseLayerEntryConfigProps } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import { AbstractBaseLayerEntryConfig } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import type { TypeWFSLayerConfig } from '@/geo/layer/geoview-layers/vector/wfs';
import type { TypeOgcFeatureLayerConfig } from '@/geo/layer/geoview-layers/vector/ogc-feature';

export interface VectorLayerEntryConfigProps extends AbstractBaseLayerEntryConfigProps {
  /** Max number of records for query */
  maxRecordCount?: number;
}

/**
 * Type used to define a GeoView vector layer to display on the map.
 */
export abstract class VectorLayerEntryConfig extends AbstractBaseLayerEntryConfig {
  /** Max number of records for query */
  maxRecordCount?: number;

  /**
   * Creates an instance of VectorLayerEntryConfig.
   *
   * @param layerConfig - The layer configuration we want to instantiate
   * @param schemaTag - The GeoView layer type schema tag
   */
  protected constructor(layerConfig: VectorLayerEntryConfigProps | VectorLayerEntryConfig, schemaTag: TypeGeoviewLayerType) {
    super(layerConfig, schemaTag, CONST_LAYER_ENTRY_TYPES.VECTOR);
    this.maxRecordCount = layerConfig.maxRecordCount;
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

  // #endregion OVERRIDES

  // #region METHODS

  /**
   * Gets if the config has specified that we should fetch the styles from the WMS.
   *
   * @returns True when the styles should be fetched from the WMS. True by default
   */
  getShouldFetchStylesFromWMS(): boolean {
    return (this.getGeoviewLayerConfig() as TypeWFSLayerConfig | TypeOgcFeatureLayerConfig).fetchStylesOnWMS ?? true; // default: true
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
