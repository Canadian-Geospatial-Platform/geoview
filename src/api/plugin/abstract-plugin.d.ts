import { TypeJsonObject } from '../../core/types/global-types';
/** ******************************************************************************************************************************
 * interface used by all plugins to define their options.
 */
export type TypePluginOptions = {
    mapId: string;
};
/** ******************************************************************************************************************************
 * Plugin abstract base class.
 */
export declare abstract class AbstractPlugin {
    pluginId: string;
    pluginProps: TypePluginOptions;
    configObj?: TypeJsonObject;
    constructor(pluginId: string, props: TypePluginOptions);
}
