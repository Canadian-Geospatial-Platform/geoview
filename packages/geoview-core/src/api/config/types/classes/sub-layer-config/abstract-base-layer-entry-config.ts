import cloneDeep from 'lodash/cloneDeep';

import { Cast, TypeJsonObject } from '@config/types/config-types';
import { AbstractGeoviewLayerConfig } from '@config/types/classes/geoview-config/abstract-geoview-layer-config';
import { ConfigBaseClass } from '@config/types/classes/sub-layer-config/config-base-class';
import {
  TypeDisplayLanguage,
  TypeLayerInitialSettings,
  TypeBaseSourceInitialConfig,
  TypeTemporalDimension,
  TypeGeometryType,
} from '@config/types/map-schema-types';

/**
 * Base type used to define a GeoView sublayer to display on the map.
 */
export abstract class AbstractBaseLayerEntryConfig extends ConfigBaseClass {
  /** The geometry type of the leaf node. */
  geometryType: TypeGeometryType;

  /** Source settings to apply to the GeoView vector layer source at creation time. */
  source?: TypeBaseSourceInitialConfig;

  /** Optional temporal dimension. */
  temporalDimension?: TypeTemporalDimension;

  /**
   * The class constructor.
   * @param {TypeJsonObject} layerConfig The sublayer configuration we want to instanciate.
   * @param {TypeLayerInitialSettings} initialSettings The initial settings inherited.
   * @param {TypeDisplayLanguage} language The initial language to use when interacting with the map features configuration.
   * @param {AbstractGeoviewLayerConfig} geoviewLayerConfig The GeoView instance that owns the sublayer.
   * @param {ConfigBaseClass} parentNode The The parent node that owns this layer or undefined if it is the root layer.
   * @constructor
   */
  constructor(
    layerConfig: TypeJsonObject,
    initialSettings: TypeLayerInitialSettings,
    language: TypeDisplayLanguage,
    geoviewLayerConfig: AbstractGeoviewLayerConfig,
    parentNode?: ConfigBaseClass
  ) {
    super(layerConfig, initialSettings, language, geoviewLayerConfig, parentNode);
    this.geometryType = layerConfig.geometryType as TypeGeometryType;
    // If the user has provided a source then keep it, else create one using default values.
    // GV: This Cast operation uses a cloned version of the entire configuration, it covers even the child properties.
    if (layerConfig.source) this.source = Cast<TypeBaseSourceInitialConfig>(cloneDeep(layerConfig.source));
    if (layerConfig.temporalDimension) this.temporalDimension = Cast<TypeTemporalDimension>(cloneDeep(layerConfig.temporalDimension));
  }
}
