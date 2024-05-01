import defaultsDeep from 'lodash/defaultsDeep';

import { TypeGeoviewLayerType, TypeJsonObject } from '@config/types/config-types';
import { TypeLayerEntryType, TypeLayerInitialSettings, TypeDisplayLanguage } from '@config/types/map-schema-types';
import { AbstractGeoviewLayerConfig } from '@config/types/classes/geoview-config/abstract-geoview-layer-config';
import { normalizeLocalizedString } from '@config/utils';

/** ******************************************************************************************************************************
 * Base type used to define a GeoView layer to display on the map. Unless specified,its properties are not part of the schema.
 */
export abstract class ConfigBaseClass {
  // GV: Only the public properties are serialized.
  /** The language used when interacting with this instance of MapFeaturesConfig. */
  #language;

  /** The GeoView configuration that owns the configuration tree that contains this node. */
  #geoviewConfig: AbstractGeoviewLayerConfig;

  /** Parent node (used to compute the layerPath). */
  #parentNode: ConfigBaseClass | undefined = undefined;

  /** Used internally to distinguish layer groups derived from the metadata. */
  #isMetadataLayerGroup?: false;

  /** The identifier of the layer to display on the map. This element is part of the schema. */
  layerId: string;

  /** The display name of the layer (English/French). */
  layerName?: string;

  /** Layer entry data type. This element is part of the schema. */
  entryType: TypeLayerEntryType;

  /** Used internally too distinguish layers created from a GeoCore UUID. */
  geocoreId: string;

  /**
   * Initial settings to apply to the GeoView layer entry at creation time. Initial settings are inherited from the parent in the
   * configuration tree.
   */
  initialSettings: TypeLayerInitialSettings;

  /**
   * The class constructor.
   * @param {TypeJsonObject} layerConfig The sub layer configuration we want to instanciate.
   * @param {TypeLayerInitialSettings} initialSettings The initial settings inherited.
   * @param {TypeDisplayLanguage} language The initial language to use when interacting with the map features configuration.
   * @param {AbstractGeoviewLayerConfig} geoviewLayerConfig The GeoView instance that owns the sub layer.
   * @param {ConfigBaseClass} parentNode The The parent node that owns this layer or undefined if it is the root layer..
   */
  constructor(
    layerConfig: TypeJsonObject,
    initialSettings: TypeLayerInitialSettings | TypeJsonObject,
    language: TypeDisplayLanguage,
    geoviewLayerConfig: AbstractGeoviewLayerConfig,
    parentNode?: ConfigBaseClass
  ) {
    this.#language = language;
    this.#geoviewConfig = geoviewLayerConfig;
    this.#parentNode = parentNode;

    this.layerId = layerConfig.layerId as string;
    this.layerName = layerConfig.layerName ? normalizeLocalizedString(layerConfig.layerName)![this.#language]! : undefined;
    this.entryType = this.getEntryType();
    this.geocoreId = layerConfig.geocoreId as string;
    this.initialSettings = defaultsDeep(layerConfig.initialSettings, initialSettings);
  }

  abstract get schemaPath(): string;

  abstract getEntryType(): TypeLayerEntryType;

  /** The geoview layer type that owns this config entry. */
  get geoviewLayerType(): TypeGeoviewLayerType {
    return this.#geoviewConfig.geoviewLayerType;
  }

  get layerPath(): string {
    const getLayerPath = (aNode: ConfigBaseClass): string => {
      return aNode.#parentNode ? `${getLayerPath(aNode.#parentNode)}/${aNode.layerId}` : aNode.layerId;
    };
    return `${this.#geoviewConfig.geoviewLayerId}/${getLayerPath(this)}`;
  }

  propagateError(): void {
    this.#geoviewConfig.propagateError();
  }
}
