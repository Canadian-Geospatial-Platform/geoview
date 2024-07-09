import { TypeJsonObject, TypeJsonValue } from '@/core/types/global-types';
import { AbstractPlugin } from './abstract-plugin';
/**
 * Class to manage plugins
 *
 * @exports
 * @class
 */
export declare abstract class Plugin {
    pluginsLoaded: boolean;
    /**
     * Load a package script on runtime
     *
     * @param {string} pluginId the package id to load
     */
    static loadScript(pluginId: string): Promise<any>;
    /**
     * Add new plugin
     *
     * @param {string} pluginId the plugin id
     * @param {string} mapId id of map to add this plugin to
     * @param {Class} constructor the plugin class (React Component)
     * @param {Object} props the plugin properties
     */
    static addPlugin(pluginId: string, mapId: string, constructor?: AbstractPlugin | ((pluginId: string, props: TypeJsonObject) => TypeJsonValue), props?: TypeJsonObject): Promise<void>;
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
