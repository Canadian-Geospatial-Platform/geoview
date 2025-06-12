import i18next from 'i18next';
import Ajv from 'ajv';

import { whenThisThen, getScriptAndAssetURL } from '@/core/utils/utilities';
import { Fetch } from '@/core/utils/fetch-helper';
import { api } from '@/app';
import { TypeJsonObject } from '@/api/config/types/config-types';
import { logger } from '@/core/utils/logger';

import { AbstractPlugin } from './abstract-plugin';
import { TypePluginStructure } from './plugin-types';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import { formatError } from '@/core/exceptions/core-exceptions';

/**
 * Class to manage plugins
 *
 * @exports
 * @class
 */
export abstract class Plugin {
  // used to indicate that all initial plugins finished loading
  pluginsLoaded = false;

  /**
   * Load a package script on runtime
   *
   * @param {string} pluginId the package id to load
   */
  // ? unknown type cannot be use, need to escape. Creates problems in footer-bar.tsx
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
   * Utility function to call a promise callback resolve function once a plugin is actually available in window.geoviewPlugins property.
   * @param {string} pluginId - The plugin id to look for.
   * @param {Function} resolve  - The resolve function to callback on.
   * @param {Function} reject - The reject function to callback on in case of failure.
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

  /**
   * Add new plugin
   *
   * @param {string} pluginId the plugin id
   * @param {string} mapId id of map to add this plugin to
   * @param {Class} constructor the plugin class (React Component)
   * @param {Object} props the plugin properties
   */
  static async addPlugin(pluginId: string, mapId: string, constructor: typeof AbstractPlugin, props?: TypeJsonObject): Promise<void> {
    const plugins = await MapEventProcessor.getMapViewerPlugins(mapId);
    if (!plugins[pluginId]) {
      // TODO: Refactor - Get rid of the TypePluginStructure and use AbstractPlugin directly, taking advantage of the the mother class abstract methods.
      let plugin: TypePluginStructure | null = null;

      if (constructor) {
        // create new instance of the plugin. Here we must type the constructor variable to any
        // in order to cancel the "'new' expression, whose target lacks a construct signature" error message
        // ? unknown type cannot be use, need to escape
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        plugin = new (constructor as any)(pluginId, props);
      }

      if (plugin) {
        // a config object used to store package config
        let pluginConfigObj: TypeJsonObject = {};

        // if a schema is defined then look for a config for this plugin
        if (plugin.schema && plugin.defaultConfig) {
          const schema = plugin.schema();
          const defaultConfig = plugin.defaultConfig();

          // create a validator object
          const validator = new Ajv({
            strict: false,
            allErrors: true,
          });

          // initialize validator with schema file
          const validate = validator.compile(schema);

          // if no config is provided then use default
          pluginConfigObj = defaultConfig;

          /**
           * If a user is using map config from a file then attempt to look
           * for custom config for loaded core packages on the same path of the map config.
           * If none exists then load the default config
           */
          const configUrl = document.getElementById(mapId)?.getAttribute('data-config-url');

          // Check if there is a corePackageConfig for the plugin
          const viewer = MapEventProcessor.getMapViewer(mapId);
          const configObj = viewer.getCorePackageConfig(pluginId);

          // If there is an inline config use it, if not try to read the file config associated with map config
          if (configObj) {
            logger.logTraceCore('Plugin - addPlugin inline config', configObj);
            pluginConfigObj = configObj;
          } else if (configUrl) {
            const configPath = `${configUrl.split('.json')[0]}-${pluginId}.json`;

            try {
              // Try to find the custom config from the config path
              const result = await Fetch.fetchJsonAsObject(configPath);

              if (result) {
                logger.logTraceCore('Plugin - addPlugin file config', result);
                pluginConfigObj = result;
              }
            } catch (error: unknown) {
              // Log warning
              logger.logWarning(`Config not found.`, error);
            }
          }

          // validate configuration
          const valid = validate(pluginConfigObj);

          if (!valid && validate.errors && validate.errors.length) {
            for (let j = 0; j < validate.errors.length; j += 1) {
              const error = validate.errors[j];
              const errorMessage = `Plugin ${pluginId}: ${error.instancePath} ${error.message} - ${JSON.stringify(error.params)}`;

              // Log
              logger.logError(errorMessage);
              // Don't show error message as it can contain non-translated elements via Ajv error messages, only log for now
              // api.getMapViewer(mapId).notifications.showError(errorMessage);
            }
          }
        }

        // add translations if provided
        if (typeof plugin.translations === 'object') {
          const { translations } = plugin;

          Object.keys(translations).forEach((languageKey: string) => {
            const translation = translations[languageKey];

            i18next.addResourceBundle(languageKey, 'translation', translation, true, false);
          });
        }

        // assign the plugin default values to be accessible from the plugin
        Object.defineProperties(plugin, {
          pluginId: { value: pluginId },
          api: { value: api },
          react: { value: window.cgpv.react },
          createRoot: { value: window.cgpv.createRoot },
          translate: { value: window.cgpv.translate },
          useTheme: { value: window.cgpv.ui.useTheme },
          configObj: { value: pluginConfigObj },
        });

        // attach to the map plugins object
        plugins[pluginId] = plugin;

        // call plugin added method if available
        if (typeof plugin.added === 'function') {
          plugin.added();
        }
      }
    }
  }

  /**
   * Delete a specific plugin loaded in a map
   *
   * @param {string} pluginId the id of the plugin to delete
   * @param {string} mapId the map id to remove the plugin from
   */
  static async removePlugin(pluginId: string, mapId: string): Promise<void> {
    // Get the plugin and remove it
    const plugins = await MapEventProcessor.getMapViewerPlugins(mapId);
    plugins[pluginId]?.removed?.();
    delete plugins[pluginId];
  }

  /**
   * Delete all plugins loaded in a map
   *
   * @param {string} mapId the map id to remove the plugin from (if not provided then plugin will be removed from all maps)
   */
  static async removePlugins(mapId: string): Promise<void> {
    const recordOfPlugins = await MapEventProcessor.getMapViewerPlugins(mapId);

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
}
