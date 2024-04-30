import { CV_CONST_SUB_LAYER_TYPES, CV_LAYER_GROUP_SCHEMA_PATH } from '@config/types/config-constants';
import { TypeJsonArray, TypeJsonObject } from '@config/types/config-types';
import { TypeLayerEntryType, TypeLayerInitialSettings } from '@config/types/map-schema-types';
import { AbstractGeoviewLayerConfig } from '@config/types/classes/geoview-config/abstract-geoview-layer-config';
import { ConfigBaseClass } from '@config/types/classes/sub-layer-config/config-base-class';
import { getListOfLayerEntryConfig } from '@config/utils';
import { layerEntryIsGroupLayer } from '../../type-guards';

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
   * @param {ConfigBaseClass} parentNode The The parent node that owns this layer or undefined if it is the root layer..
   */
  constructor(
    layerNode: TypeJsonObject,
    initialSettings: TypeLayerInitialSettings | TypeJsonObject,
    geoviewLayerConfig: AbstractGeoviewLayerConfig,
    parentNode?: ConfigBaseClass
  ) {
    super(layerNode, initialSettings, geoviewLayerConfig, parentNode);
    this.listOfLayerEntryConfig = (layerNode.listOfLayerEntryConfig as TypeJsonArray)
      .map((subLayerConfig) => {
        if (layerEntryIsGroupLayer(subLayerConfig))
          return new GroupLayerEntryConfig(subLayerConfig, geoviewLayerConfig.initialSettings, geoviewLayerConfig, this);
        return geoviewLayerConfig.createLeafNode(subLayerConfig, geoviewLayerConfig.initialSettings, geoviewLayerConfig, this);
      })
      .filter((subLayerConfig) => {
        return subLayerConfig;
      }) as ConfigBaseClass[];
  }

  /** ***************************************************************************************************************************
   * Method used to instanciate a GroupLayerEntryConfig object. The interaction with the instance will use the language stored
   * in the #geoviewConfig object. The language associated to a configuration can be changed using the setConfigLanguage.
   * @param {TypeJsonObject} jsonGroupConfig The group layer configuration.
   * @param {TypeLayerInitialSettings} initialSettings The initial settings inherited.
   * @param {AbstractGeoviewLayerConfig | undefined} geoviewInstance The GeoView instance that owns the sub layer.
   *
   * @returns {GroupLayerEntryConfig} The group layer instance or undefined if there is an error.
   */
  static async getInstance(
    jsonGroupConfig: TypeJsonObject,
    initialSettings: TypeLayerInitialSettings,
    geoviewInstance: AbstractGeoviewLayerConfig
  ): Promise<GroupLayerEntryConfig | undefined> {
    const groupLayerInstance = new GroupLayerEntryConfig(jsonGroupConfig, initialSettings, geoviewInstance);
    groupLayerInstance.listOfLayerEntryConfig = await getListOfLayerEntryConfig(
      jsonGroupConfig.listOfLayerEntryConfig,
      initialSettings,
      geoviewInstance
    );
    return groupLayerInstance;
  }

  /**
   * The getter method that returns the entryType property.
   *
   * @returns {TypeLayerEntryType} The entryType associated to the sub layer.
   */
  getEntryType(): TypeLayerEntryType {
    return CV_CONST_SUB_LAYER_TYPES.GROUP;
  }

  get schemaPath(): string {
    return CV_LAYER_GROUP_SCHEMA_PATH;
  }
}
