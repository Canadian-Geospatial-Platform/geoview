import defaultsDeep from 'lodash/defaultsDeep';

import { TypeGeoviewLayerType, TypeJsonObject } from '@config/types/config-types';
import { TypeLayerEntryType, TypeLayerInitialSettings, TypeDisplayLanguage, Extent } from '@config/types/map-schema-types';
import { AbstractGeoviewLayerConfig } from '@config/types/classes/geoview-config/abstract-geoview-layer-config';
import { normalizeLocalizedString } from '@config/utils';

/**
 * Base type used to define a GeoView sublayer to display on the map. The sublayer can be a group or an abstract sublayer.
 */
export abstract class ConfigBaseClass {
  // GV: Only the public properties are serialized.
  /** The language used when interacting with this instance of MapFeatureConfig. */
  #language;

  /** The GeoView configuration that owns the configuration tree that contains this node. */
  #geoviewConfig: AbstractGeoviewLayerConfig;

  /** Parent node (used to compute the layerPath). */
  #parentNode: ConfigBaseClass | undefined = undefined;

  /** Used internally to distinguish layer groups derived from the metadata. */
  // TODO: Refactor - Add this back?
  // #isMetadataLayerGroup?: false;

  /** The identifier of the layer to display on the map. */
  layerId: string;

  /** The display name of the layer (English/French). */
  layerName?: string;

  /** Attributions obtained from the configuration or the metadata. */
  attributions: string[];

  /** Bounds (in lat long) obtained from the metadata or calculated from the layers */
  bounds: Extent;

  /** The min scale that can be reach by the layer. */
  minScale: number;

  /** The max scale that can be reach by the layer. */
  maxScale: number;

  /** Layer entry data type. */
  entryType: TypeLayerEntryType;

  /**
   * Initial settings to apply to the GeoView layer entry at creation time. Initial settings are inherited from the parent in the
   * configuration tree.
   */
  initialSettings: TypeLayerInitialSettings;

  /**
   * The class constructor.
   * @param {TypeJsonObject} layerConfig The sublayer configuration we want to instanciate.
   * @param {TypeLayerInitialSettings | TypeJsonObject} initialSettings The initial settings inherited.
   * @param {TypeDisplayLanguage} language The initial language to use when interacting with the map feature configuration.
   * @param {AbstractGeoviewLayerConfig} geoviewLayerConfig The GeoView instance that owns the sublayer.
   * @param {ConfigBaseClass} parentNode The The parent node that owns this layer or undefined if it is the root layer.
   * @constructor
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
    this.attributions = (layerConfig.attributions as string[]) || [];
    this.bounds = layerConfig.bounds as Extent;
    this.minScale = (layerConfig.minScale as number) || 0;
    this.maxScale = (layerConfig.minScale as number) || 0;
    this.entryType = this.getEntryType();
    this.initialSettings = defaultsDeep(layerConfig.initialSettings, initialSettings);
  }

  /**
   * The getter method that returns the schemaPath property. Each geoview sublayer type knows what section of the schema must be
   * used to do its validation.
   *
   * @returns {string} The schemaPath associated to the sublayer.
   * @protected @abstract
   */
  protected abstract get schemaPath(): string;

  /**
   * A method that returns the entryType property. Each sublayer knows what entry type is associated to it.
   *
   * @returns {TypeLayerEntryType} The entryType associated to the sublayer.
   * @protected @abstract
   */
  protected abstract getEntryType(): TypeLayerEntryType;

  /** The geoview layer type that owns this config entry. */
  get geoviewLayerType(): TypeGeoviewLayerType {
    return this.#geoviewConfig.geoviewLayerType;
  }

  /**
   * The getter method, which returns the layerPath of the sublayer configuration. The layer path is a unique identifier
   * associated with the sublayer configuration. It's made up of the Geoview layer identifier and the node identifiers you need
   * to traverse to the targeted sublayer configuration, all separated by slashes '/'.
   *
   * @returns {string} The schemaPath associated to the sublayer.
   */
  get layerPath(): string {
    const getLayerPath = (aNode: ConfigBaseClass): string => {
      return aNode.#parentNode ? `${getLayerPath(aNode.#parentNode)}/${aNode.layerId}` : aNode.layerId;
    };
    return `${this.#geoviewConfig.geoviewLayerId}/${getLayerPath(this)}`;
  }

  /**
   * Method used to propagate an error flag to the geoview layer instance. Once this operation has been performed, the geoview
   * layer is no longer considered viable.
   */
  propagateError(): void {
    this.#geoviewConfig.propagateError();
  }
}
