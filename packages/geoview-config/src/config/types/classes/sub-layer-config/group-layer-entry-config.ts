import { CV_CONST_SUB_LAYER_TYPES, CV_LAYER_GROUP_SCHEMA_PATH } from '../../config-constants';
import { TypeJsonObject, TypeJsonArray } from '../../config-types';
import { TypeLayerInitialSettings } from '../../map-schema-types';
import { layerEntryIsGroupLayer } from '../../type-guards';
import { AbstractGeoviewLayerConfig } from '../geoview-config/abstract-geoview-layer-config';
import { ConfigBaseClass } from './config-base-class';

/** ******************************************************************************************************************************
 * Type used to define a layer group.
 */
export class GroupLayerEntryConfig extends ConfigBaseClass {
  /** Layer entry data type. */
  entryType = CV_CONST_SUB_LAYER_TYPES.GROUP;

  /** The list of layer entry configurations to use from the GeoView layer group. */
  listOfLayerEntryConfig: ConfigBaseClass[] = [];

  /**
   * The class constructor.
   * @param {TypeJsonObject} layerConfig The layer node configuration we want to instanciate.
   * @param {TypeLayerInitialSettings} initialSettings The initial settings inherited form the parent.
   * @param {AbstractGeoviewLayerConfig} geoviewLayerConfig The geoview layer configuration object that is creating this layer tree node.
   */
  constructor(layerNode: TypeJsonObject, initialSettings: TypeLayerInitialSettings, geoviewLayerConfig: AbstractGeoviewLayerConfig) {
    super(layerNode, initialSettings, geoviewLayerConfig);
    this.listOfLayerEntryConfig = (layerNode.listOfLayerEntryConfig as TypeJsonArray).map((subLayerNode: TypeJsonObject) => {
      if (layerEntryIsGroupLayer(subLayerNode)) return new GroupLayerEntryConfig(subLayerNode, this.initialSettings, geoviewLayerConfig);
      return geoviewLayerConfig.createLeafNode(layerNode, initialSettings, geoviewLayerConfig)!;
    });
  }

  get schemaPath(): string {
    return CV_LAYER_GROUP_SCHEMA_PATH;
  }
}
