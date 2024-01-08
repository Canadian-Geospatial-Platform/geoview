import { AbstractPlugin } from './abstract-plugin';
import { TypeJsonObject, TypeJsonValue } from '@/core/types/global-types';
/**
 * Class to manage plugins
 *
 * @exports
 * @class
 */
export declare class Plugin {
    #private;
    pluginsLoaded: boolean;
    /**
     * Load a package script on runtime
     *
     * @param {string} pluginId the package id to load
     */
    loadScript: (pluginId: string) => Promise<any>;
    /**
     * Add new plugin
     *
     * @param {string} pluginId the plugin id
     * @param {string} mapId id of map to add this plugin to
     * @param {Class} constructor the plugin class (React Component)
     * @param {Object} props the plugin properties
     */
    addPlugin: (pluginId: string, mapId: string, constructor?: AbstractPlugin | ((pluginId: string, props: TypeJsonObject) => TypeJsonValue) | undefined, props?: TypeJsonObject) => Promise<void>;
    /**
     * Delete a specific plugin loaded in a map
     *
     * @param {string} pluginId the id of the plugin to delete
     * @param {string} mapId the map id to remove the plugin from
     */
    removePlugin: (pluginId: string, mapId: string) => void;
    /**
     * Delete all plugins loaded in a map
     *
     * @param {string} mapId the map id to remove the plugin from (if not provided then plugin will be removed from all maps)
     */
    removePlugins: (mapId: string) => void;
    /**
     * A function that will load each plugin on a map then checks if there are a next plugin to load
     *
     * @param {string} mapIndex the map index to load the plugin at
     * @param {string} pluginIndex the plugin index to load
     */
    loadPlugin: (mapIndex: number, pluginIndex: number) => void;
    /**
     * Load plugins provided by map config
     */
    loadPlugins: () => void;
}
