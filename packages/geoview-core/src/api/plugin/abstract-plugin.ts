import { TypeJsonObject } from '../../core/types/cgpv-types';

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
  id: string;

  // plugin properties
  pluginProps: TypePluginOptions;

  // plugin config object
  configObj?: TypeJsonObject;

  constructor(id: string, props: TypePluginOptions) {
    this.id = id;
    this.pluginProps = props;
  }
}
