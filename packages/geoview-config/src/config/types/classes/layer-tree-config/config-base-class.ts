import defaultsDeep from 'lodash/defaultsDeep';
import { Cast, TypeGeoviewLayerType, TypeJsonObject } from '../../config-types';
import { TypeLocalizedString, TypeLayerEntryType, TypeLayerInitialSettings } from '../../map-schema-types';
import { AbstractGeoviewLayerConfig } from '../geoview-config/abstract-geoview-layer-config';

/** ******************************************************************************************************************************
 * Base type used to define a GeoView layer to display on the map. Unless specified,its properties are not part of the schema.
 */
export class ConfigBaseClass {
  // GV: Only the public properties are serialized.
  /** The GeoView configuration that owns the configuration tree that contains this node. */
  #geoviewConfig: AbstractGeoviewLayerConfig;

  /** Parent node (used to compute the layerPath). */
  #parentNode: ConfigBaseClass | undefined = undefined;

  /** The identifier of the layer to display on the map. This element is part of the schema. */
  layerId: string;

  /** The display name of the layer (English/French). */
  layerName?: TypeLocalizedString;

  /** The geoview layer type that owns this config entry. */
  geoviewLayerType: TypeGeoviewLayerType;

  /** Layer entry data type. This element is part of the schema. */
  entryType?: TypeLayerEntryType;

  /** Used internally too distinguish layers created from a GeoCore UUID. */
  geocoreId: string;

  /** Used internally to distinguish layer groups derived from the metadata. */
  isMetadataLayerGroup?: false;

  /**
   * Initial settings to apply to the GeoView layer entry at creation time. Initial settings are inherited from the parent in the
   * configuration tree.
   */
  initialSettings: TypeLayerInitialSettings;

  /**
   * The class constructor.
   * @param {TypeJsonObject} layerConfig The layer node configuration we want to instanciate.
   * @param {TypeLayerInitialSettings} initialSettings The initial settings inherited form the parent.
   * @param {AbstractGeoviewLayerConfig} geoviewLayerConfig The geoview layer configuration object that is creating this layer tree node.
   */
  constructor(layerConfig: TypeJsonObject, initialSettings: TypeLayerInitialSettings, geoviewLayerConfig: AbstractGeoviewLayerConfig) {
    this.#geoviewConfig = geoviewLayerConfig;
    this.layerId = layerConfig.layerId as string;
    this.layerName = Cast<TypeLocalizedString>(layerConfig.layerName);
    this.geoviewLayerType = geoviewLayerConfig.geoviewLayerType;
    this.entryType = layerConfig.entryType as TypeLayerEntryType;
    this.geocoreId = layerConfig.geocoreId as string;
    this.initialSettings = defaultsDeep(layerConfig.initialSettings, initialSettings);
  }

  get layerPath(): string {
    const getLayerPath = (aNode: ConfigBaseClass): string => {
      return aNode.#parentNode ? `${getLayerPath(aNode.#parentNode)}/${aNode.layerId}` : aNode.layerId;
    };
    return `${this.#geoviewConfig.geoviewLayerId}/${getLayerPath(this)}`;
  }
}
