import { TypePluginOptions, TypeJsonObject } from '../cgpv-types';

export abstract class AbstractPluginClass {
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
