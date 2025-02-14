import VectorSource from 'ol/source/Vector';

import { EsriFeatureLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-validation-classes/esri-feature-layer-entry-config';
import { codedValueType, rangeDomainType } from '@/geo/map/map-schema-types';
import { esriGetFieldType, esriGetFieldDomain } from '@/geo/layer/gv-layers/utils';
import { AbstractGVVector } from '@/geo/layer/gv-layers/vector/abstract-gv-vector';
import { TypeOutfieldsType } from '@/api/config/types/map-schema-types';

/**
 * Manages an Esri Feature layer.
 *
 * @exports
 * @class GVEsriFeature
 */
export class GVEsriFeature extends AbstractGVVector {
  /**
   * Constructs a GVEsriFeature layer to manage an OpenLayer layer.
   * @param {string} mapId - The map id
   * @param {VectorSource} olSource - The OpenLayer source.
   * @param {EsriFeatureLayerEntryConfig} layerConfig - The layer configuration.
   */
  public constructor(mapId: string, olSource: VectorSource, layerConfig: EsriFeatureLayerEntryConfig) {
    super(mapId, olSource, layerConfig);
  }

  /**
   * Overrides the get of the layer configuration associated with the layer.
   * @returns {EsriFeatureLayerEntryConfig} The layer configuration or undefined if not found.
   */
  override getLayerConfig(): EsriFeatureLayerEntryConfig {
    // Call parent and cast
    return super.getLayerConfig() as EsriFeatureLayerEntryConfig;
  }

  /**
   * Overrides the return of the field type from the metadata. If the type can not be found, return 'string'.
   * @param {string} fieldName - The field name for which we want to get the type.
   * @returns {TypeOutfieldsType} The type of the field.
   */
  protected override getFieldType(fieldName: string): TypeOutfieldsType {
    // Redirect
    return esriGetFieldType(this.getLayerConfig(), fieldName);
  }

  /**
   * Overrides the return of the domain of the specified field.
   * @param {string} fieldName - The field name for which we want to get the domain.
   * @returns {null | codedValueType | rangeDomainType} The domain of the field.
   */
  protected override getFieldDomain(fieldName: string): null | codedValueType | rangeDomainType {
    // Redirect
    return esriGetFieldDomain(this.getLayerConfig(), fieldName);
  }
}
