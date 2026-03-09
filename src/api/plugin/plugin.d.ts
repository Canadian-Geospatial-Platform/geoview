import type { AbstractPlugin } from './abstract-plugin';
/**
 * Class to manage plugins
 *
 * @exports
 * @class
 */
export declare abstract class Plugin {
    #private;
    /**
     * Load a package script on runtime
     * @param {string} pluginId the package id to load
     */
    static loadScript(pluginId: string): Promise<typeof AbstractPlugin>;
    /**
     * Delete a specific plugin loaded in a map
     *
     * @param {string} pluginId - The id of the plugin to delete
     * @param {string} mapId - The map id to remove the plugin from
     */
    static removePlugin(pluginId: string, mapId: string): Promise<void>;
    /**
     * Delete all plugins loaded in a map
     *
     * @param {string} mapId - The map id to remove the plugin from (if not provided then plugin will be removed from all maps)
     */
    static removePlugins(mapId: string): Promise<void>;
}
//# sourceMappingURL=plugin.d.ts.map