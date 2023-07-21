import { TypeJsonObject } from '@/core/types/global-types';

/** ******************************************************************************************************************************
 * interface used by all plugins to define their options.
 */
export type TypePluginOptions = {
  mapId: string;
};

/** ******************************************************************************************************************************
 * Plugin abstract base class.
 */
export abstract class AbstractPlugin {
  // id of the plugin
  pluginId: string;

  // plugin properties
  pluginProps: TypePluginOptions;

  // plugin config object
  configObj?: TypeJsonObject;

  constructor(pluginId: string, props: TypePluginOptions) {
    this.pluginId = pluginId;
    this.pluginProps = props;
  }
}
