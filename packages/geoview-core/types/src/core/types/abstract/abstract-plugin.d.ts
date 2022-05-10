import { TypePluginOptions } from '../cgpv-types';
export declare abstract class AbstractPluginClass {
    id: string;
    pluginProps: TypePluginOptions;
    constructor(id: string, props: TypePluginOptions);
}
