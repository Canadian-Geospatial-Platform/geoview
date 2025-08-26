import { AbstractPlugin } from './abstract-plugin';
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
     * Add new plugin
     *
     * @param {string} pluginId - The plugin id
     * @param {typeof AbstractPlugin} constructor - The plugin class (React Component)
     * @param {string} mapId - Id of map to add this plugin to
     * @param {unknown} props - The plugin options
     */
    static addPlugin(pluginId: string, constructor: typeof AbstractPlugin, mapId: string, props?: unknown): Promise<void>;
    /**
     * Delete a specific plugin loaded in a map
     *
     * @param {string} pluginId the id of the plugin to delete
     * @param {string} mapId the map id to remove the plugin from
     */
    static removePlugin(pluginId: string, mapId: string): Promise<void>;
    /**
     * Delete all plugins loaded in a map
     *
     * @param {string} mapId the map id to remove the plugin from (if not provided then plugin will be removed from all maps)
     */
    static removePlugins(mapId: string): Promise<void>;
}
//# sourceMappingURL=plugin.d.ts.map