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
     * Adds a specific plugin in a map.
     *
     * @param pluginId - The id of the plugin to add
     * @param constructor - The constructor of the plugin
     * @param mapId - The map id to add the plugin to
     * @param props - Optional properties to pass to the plugin
     * @returns A promise that resolves with the plugin instance once added
     */
    static addPlugin(pluginId: string, constructor: typeof AbstractPlugin, mapId: string, props?: unknown): Promise<AbstractPlugin>;
    /**
     * Deletes a specific plugin from a map.
     *
     * @param pluginId - The id of the plugin to delete
     * @param mapId - The map id to remove the plugin from
     * @returns A promise that resolves once the plugin is removed
     */
    static removePlugin(pluginId: string, mapId: string): Promise<void>;
    /**
     * Deletes all plugins loaded in a map.
     *
     * @param mapId - The map id to remove the plugin from (if not provided then plugin will be removed from all maps)
     * @returns A promise that resolves once the plugins are removed
     */
    static removePlugins(mapId: string): Promise<void>;
}
//# sourceMappingURL=plugin.d.ts.map