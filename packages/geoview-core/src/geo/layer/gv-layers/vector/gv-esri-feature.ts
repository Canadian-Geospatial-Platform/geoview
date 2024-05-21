import { VectorImage } from 'ol/layer';
import VectorSource from 'ol/source/Vector';

import { EsriFeatureLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-validation-classes/esri-feature-layer-entry-config';
import { codedValueType, rangeDomainType } from '@/geo/layer/layer-sets/abstract-layer-set';
import { esriGetFieldType, esriGetFieldDomain } from '../utils';
import { AbstractGVVector } from './abstract-gv-vector';

/**
 * Manages an Esri Feature layer.
 *
 * @exports
 * @class GVEsriFeature
 */
export class GVEsriFeature extends AbstractGVVector {
  /**
   * Overrides the get of the OpenLayers Layer
   * @returns {VectorImage<VectorSource>} The OpenLayers Layer
   */
  override getOLLayer(): VectorImage<VectorSource> {
    // Call parent and cast
    return super.getOLLayer() as VectorImage<VectorSource>;
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
   * @returns {'string' | 'date' | 'number'} The type of the field.
   */
  protected override getFieldType(fieldName: string): 'string' | 'date' | 'number' {
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
