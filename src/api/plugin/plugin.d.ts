import type { AbstractPlugin } from './abstract-plugin';
/**
 * Class to manage plugins.
 */
export declare abstract class Plugin {
    #private;
    /**
     * Loads a package script on runtime.
     *
     * @param pluginId - The package id to load
     * @returns A promise that resolves with the plugin class
     */
    static loadScript(pluginId: string): Promise<typeof AbstractPlugin>;
    /**
     * Deletes a specific plugin loaded in a map.
     *
     * @param pluginId - The id of the plugin to delete
     * @param mapId - The map id to remove the plugin from
     */
    static removePlugin(pluginId: string, mapId: string): Promise<void>;
    /**
     * Deletes all plugins loaded in a map.
     *
     * @param mapId - The map id to remove the plugin from (if not provided then plugin will be removed from all maps)
     */
    static removePlugins(mapId: string): Promise<void>;
}
//# sourceMappingURL=plugin.d.ts.map