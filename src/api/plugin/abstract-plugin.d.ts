import { TypeJsonObject } from '../../core/types/global-types';
/** ******************************************************************************************************************************
 * interface used by all plugins to define their options.
 */
export declare type TypePluginOptions = {
    mapId: string;
};
/** ******************************************************************************************************************************
 * Plugin abstract base class.
 */
export declare abstract class AbstractPlugin {
    id: string;
    pluginProps: TypePluginOptions;
    configObj?: TypeJsonObject;
    constructor(id: string, props: TypePluginOptions);
}
