import type { AbstractPlugin } from '@/api/plugin/abstract-plugin';
import type { PluginsContainer } from '@/api/plugin/plugin-types';
import { AbstractMapViewerController } from '@/core/controllers/base/abstract-map-viewer-controller';
import type { MapViewer } from '@/geo/map/map-viewer';
/**
 * Controller responsible for Plugin interactions.
 */
export declare class PluginController extends AbstractMapViewerController {
    #private;
    /**
     * Creates an instance of PluginController.
     *
     * @param mapViewer - The map viewer instance to associate with this controller
     */
    constructor(mapViewer: MapViewer);
    /**
     * Shortcut to get the Map Viewer plugins instance for a given map id
     * This is use to reduce the use of api.getMapViewer(mapId).plugins and be more explicit
  
     * @returns The map plugins container
     */
    getMapViewerPlugins(): Promise<PluginsContainer>;
    /**
     * Retrieves a plugin instance registered for a given map viewer, if it exists.
     *
     * @param pluginId - The identifier of the plugin to retrieve.
     * @returns A promise that resolves to the plugin instance if found, or `undefined` otherwise.
     */
    getMapViewerPluginIfExists(pluginId: string): Promise<AbstractPlugin | undefined>;
    /**
     * Loads a plugin script dynamically and adds the plugin to a map.
     * This method first loads the plugin script by name, then registers the
     * plugin with the {@link PluginController} for the specified map.
     *
     * @param pluginName - The name of the plugin to load and register.
     * @returns A promise that resolves when the plugin has been successfully loaded
     * and added to the map, or rejects with a formatted error if loading or registration fails.
     */
    loadAndAddPlugin(pluginName: string): Promise<void>;
    /**
     * Adds a new plugin to the map.
     *
     * Creates the plugin instance, validates its configuration against the schema,
     * loads translations, and calls the plugin's add method. Returns an existing
     * plugin instance if it is already loaded.
     *
     * @param pluginId - The plugin identifier
     * @param constructor - The plugin class constructor
     * @param props - Optional plugin options
     * @returns A promise that resolves with the plugin instance
     * @throws {PluginError} When no constructor is provided
     */
    addPlugin(pluginId: string, constructor: typeof AbstractPlugin, mapId: string, props?: unknown): Promise<AbstractPlugin>;
    /**
     * Deletes a specific plugin loaded in a map.
     *
     * @param pluginId - The id of the plugin to delete
     */
    removePlugin(pluginId: string): Promise<void>;
    /**
     * Deletes all plugins loaded in a map.
     */
    removePlugins(): Promise<void>;
    /**
     * Loads a package script on runtime.
     *
     * @param pluginId - The package id to load
     * @returns A promise that resolves with the plugin class
     */
    static loadScript(pluginId: string): Promise<typeof AbstractPlugin>;
}
/**
 * Hook to access the PluginController from the controller context.
 *
 * @returns The plugin controller instance
 * @throws {Error} When used outside of a ControllerContext.Provider.
 */
export declare function usePluginController(): PluginController;
//# sourceMappingURL=plugin-controller.d.ts.map