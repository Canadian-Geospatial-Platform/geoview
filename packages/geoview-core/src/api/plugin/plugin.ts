import { formatError } from '@/core/exceptions/core-exceptions';
import { whenThisThen, getScriptAndAssetURL } from '@/core/utils/utilities';
import { logger } from '@/core/utils/logger';
import type { AbstractPlugin } from './abstract-plugin';

/**
 * Class to manage plugins.
 */
export abstract class Plugin {
  /**
   * Loads a package script on runtime.
   *
   * @param pluginId - The package id to load
   * @returns A promise that resolves with the plugin class
   */
  static loadScript(pluginId: string): Promise<typeof AbstractPlugin> {
    return new Promise((resolve, reject) => {
      const existingScript = document.querySelector(`script#${pluginId}`);

      if (!existingScript) {
        // Get the main script URL
        const scriptPath = getScriptAndAssetURL();

        // create a script element
        const script = document.createElement('script');
        script.src = `${scriptPath}/corePackages/geoview-${pluginId}.js`;
        script.id = pluginId;
        document.body.appendChild(script);
        script.onload = () => {
          // Resolve when ready
          Plugin.#resolveWhenReady(pluginId, resolve, reject);
        };
        script.onerror = () => {
          // Reject
          reject(new Error(`Failed to load plugin ${pluginId}`));
        };
      } else {
        // Resolve only once the script is indeed loaded.
        // This is because when you load for example 2 maps in parallel with the same plugin script, this 'loadScript' function is
        // called in parallel and the script.onload callback (a few lines above) hasn't been called back yet (for the 1st plugin load).
        // Therefore, any subsequent call to loadScript has to actually wait for the script.onload to
        // be calledback. Otherwise, even if 'existingScript' says that it's been loaded,
        // it's not 'yet' true, because the js file might still be being downloaded and window.geoviewPlugins[pluginId] still undefined.
        Plugin.#resolveWhenReady(pluginId, resolve, reject);
      }
    });
  }

  /**
   * Adds a specific plugin in a map.
   *
   * @param pluginId - The id of the plugin to add
   * @param constructor - The constructor of the plugin
   * @param mapId - The map id to add the plugin to
   * @param props - Optional properties to pass to the plugin
   * @returns A promise that resolves with the plugin instance once added
   */
  static addPlugin(pluginId: string, constructor: typeof AbstractPlugin, mapId: string, props?: unknown): Promise<AbstractPlugin> {
    // TODO: REFACTOR IMPORTANT - Rethink how the plugin api finds the MapViewer
    return window.cgpv.api.getMapViewer(mapId).controllers.pluginController.addPlugin(pluginId, constructor, mapId, props);
  }

  /**
   * Deletes a specific plugin from a map.
   *
   * @param pluginId - The id of the plugin to delete
   * @param mapId - The map id to remove the plugin from
   * @returns A promise that resolves once the plugin is removed
   */
  static async removePlugin(pluginId: string, mapId: string): Promise<void> {
    // TODO: REFACTOR IMPORTANT - Rethink how the plugin api finds the MapViewer
    // Get the plugin and remove it
    const plugins = await window.cgpv.api.getMapViewer(mapId).controllers.pluginController.getMapViewerPlugins();
    plugins[pluginId]?.remove?.();
    delete plugins[pluginId];
  }

  /**
   * Deletes all plugins loaded in a map.
   *
   * @param mapId - The map id to remove the plugin from (if not provided then plugin will be removed from all maps)
   * @returns A promise that resolves once the plugins are removed
   */
  static async removePlugins(mapId: string): Promise<void> {
    // TODO: REFACTOR IMPORTANT - Rethink how the plugin api finds the MapViewer
    const recordOfPlugins = await window.cgpv.api.getMapViewer(mapId).controllers.pluginController.getMapViewerPlugins();

    if (recordOfPlugins) {
      // remove all plugins by map
      for (let i = 0; i < Object.keys(recordOfPlugins).length; i += 1) {
        const pluginId = Object.keys(recordOfPlugins)[i];

        Plugin.removePlugin(pluginId, mapId).catch((error: unknown) => {
          // Log
          logger.logPromiseFailed('removePlugins in plugins.ts', error);
        });
      }
    }
  }

  /**
   * Utility function to call a promise callback resolve function once a plugin is actually available in window.geoviewPlugins property.
   *
   * @param pluginId - The plugin id to look for
   * @param resolve - The resolve function to callback on
   * @param reject - The reject function to callback on in case of failure
   */
  static #resolveWhenReady(pluginId: string, resolve: (plugin: typeof AbstractPlugin) => void, reject: (reason: Error) => void): void {
    whenThisThen(() => window.geoviewPlugins?.[pluginId])
      .then(() => {
        // Resolve
        resolve(window.geoviewPlugins![pluginId]);
      })
      .catch((error: unknown) => {
        // Reject
        reject(formatError(error));
      });
  }
}
