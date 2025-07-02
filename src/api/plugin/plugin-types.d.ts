import type React from 'react';
import { TypeJsonObject, TypeJsonValue, AnySchemaObject } from '@/api/config/types/config-types';
import { API } from '@/api';
import { AbstractPlugin } from './abstract-plugin';
/**
 * interface used when creating the actual plugin.
 */
export type TypePluginStructure = {
    pluginId: string;
    api: API;
    createElement: typeof React.createElement;
    react: typeof React;
    props: TypeJsonValue;
    translate: TypeJsonValue;
    translations: TypeJsonObject;
    configObj: TypeJsonObject;
    schema?: () => AnySchemaObject;
    defaultConfig?: () => TypeJsonObject;
    add?: () => void;
    remove?: () => void;
    select?: () => void;
};
/**
 * Record of plugins.
 */
export type PluginsContainer = {
    [pluginId: string]: AbstractPlugin;
};
//# sourceMappingURL=plugin-types.d.ts.map