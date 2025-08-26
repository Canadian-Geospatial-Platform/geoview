import type React from 'react';
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
    props: unknown;
    translate: unknown;
    translations: Record<string, unknown>;
    configObj: unknown;
    schema?: () => unknown;
    defaultConfig?: () => unknown;
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