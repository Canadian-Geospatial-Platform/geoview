import type { AbstractPlugin } from '@/api/plugin/abstract-plugin';
import type { PluginsContainer } from '@/api/plugin/plugin-types';
import { AbstractMapViewerController } from '@/core/controllers/base/abstract-map-viewer-controller';
import { getScriptAndAssetURL, whenThisThen } from '@/core/utils/utilities';
import { formatError } from '@/core/exceptions/core-exceptions';
import type { MapViewer } from '@/geo/map/map-viewer';
import { PluginError } from '@/core/exceptions/geoview-exceptions';
import Ajv, { type AnySchema } from 'ajv';
import { logger } from '@/core/utils/logger';
import { Fetch } from '@/core/utils/fetch-helper';
import i18next from 'i18next';

/**
 * Controller responsible for Plugin interactions.
 */
export class PluginController extends AbstractMapViewerController {
  /**
   * Creates an instance of PluginController.
   *
   * @param mapViewer - The map viewer instance to associate with this controller
   */
  // GV Leave the constructor here, because we'll likely need it soon to inject dependencies.
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(mapViewer: MapViewer) {
    super(mapViewer);
  }

  // #region OVERRIDES

  // #endregion OVERRIDES

  // #region PUBLIC METHODS

  /**
   * Shortcut to get the Map Viewer plugins instance for a given map id
   * This is use to reduce the use of api.getMapViewer(mapId).plugins and be more explicit

   * @returns The map plugins container
   */
  async getMapViewerPlugins(): Promise<PluginsContainer> {
    await whenThisThen(() => this.getMapViewer());
    return this.getMapViewer().plugins;
  }

  /**
   * Retrieves a plugin instance registered for a given map viewer, if it exists.
   *
   * @param pluginId - The identifier of the plugin to retrieve
   * @returns A promise that resolves to the plugin instance if found, or `undefined` otherwise
   */
  async getMapViewerPluginIfExists(pluginId: string): Promise<AbstractPlugin | undefined> {
    // Get the plugins
    const plugins = await this.getMapViewerPlugins();

    // If plugin exists
    if (plugins[pluginId]) {
      // Return it
      return plugins[pluginId];
    }

    // Not found
    return undefined;
  }

  /**
   * Loads a plugin script dynamically and adds the plugin to a map.
   * This method first loads the plugin script by name, then registers the
   * plugin with the {@link PluginController} for the specified map.
   *
   * @param pluginName - The name of the plugin to load and register
   * @returns A promise that resolves when the plugin has been successfully loaded
   * and added to the map, or rejects with a formatted error if loading or registration fails.
   */
  loadAndAddPlugin(pluginName: string): Promise<void> {
    // Create a promise that will resolve when the plugin is added
    return new Promise<void>((resolve, reject) => {
      PluginController.loadScript(pluginName)
        .then((typePlugin) => {
          // add the plugin by passing in the loaded constructor from the script tag
          this.addPlugin(pluginName, typePlugin, this.getMapId())
            .then(() => {
              // Plugin added
              resolve();
            })
            .catch((error: unknown) => {
              // Reject
              reject(formatError(error));
            });
        })
        .catch((error: unknown) => {
          // Reject
          reject(formatError(error));
        });
    });
  }

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
  async addPlugin(pluginId: string, constructor: typeof AbstractPlugin, mapId: string, props?: unknown): Promise<AbstractPlugin> {
    // Get the MapViewer
    const mapViewer = this.getMapViewer();

    // If the plugin is already loaded, return it
    if (mapViewer.plugins[pluginId]) return mapViewer.plugins[pluginId];

    // If no constructor provided
    if (!constructor) throw new PluginError(pluginId, mapId);

    // Construct the Plugin class
    // create new instance of the plugin. Here we must type the constructor variable to any
    // in order to cancel the "'new' expression, whose target lacks a construct signature" error message
    // ? unknown type cannot be use, need to escape
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const plugin: AbstractPlugin = new (constructor as any)(pluginId, mapViewer, props);

    // Attach to the map plugins object
    mapViewer.plugins[pluginId] = plugin;

    // a config object used to store package config
    let pluginConfigObj: unknown = {};

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
      const validate = validator.compile(schema as AnySchema);

      // if no config is provided then use default
      pluginConfigObj = defaultConfig;

      /**
       * If a user is using map config from a file then attempt to look
       * for custom config for loaded core packages on the same path of the map config.
       * If none exists then load the default config
       */
      const configUrl = document.getElementById(mapViewer.mapId)?.getAttribute('data-config-url');

      // Check if there is a corePackageConfig for the plugin
      const configObj = mapViewer.getCorePackageConfig(pluginId);

      // If there is an inline config use it, if not try to read the file config associated with map config
      if (configObj) {
        logger.logTraceCore('Plugin - addPlugin inline config', configObj);
        pluginConfigObj = configObj;
      } else if (configUrl) {
        const configPath = `${configUrl.split('.json')[0]}-${pluginId}.json`;

        try {
          // Try to find the custom config from the config path
          const result = await Fetch.fetchJson(configPath);

          if (result) {
            logger.logTraceCore('Plugin - addPlugin file config', result);
            pluginConfigObj = result;
          }
        } catch (error: unknown) {
          // Log warning
          logger.logWarning(`Config not found.`, error);
          // Notify with a warning
          mapViewer.notifications.addNotificationWarning('error.map.pluginConfigNotFound', [pluginId, mapId, configPath]);
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

    // Set the config
    plugin.setConfig(pluginConfigObj);

    // add translations if provided
    Object.entries(plugin.defaultTranslations()).forEach(([languageKey, value]) => {
      // Add the resource bundle to support the plugin language
      i18next.addResourceBundle(languageKey, 'translation', value, true, false);
    });

    // Call plugin add method
    plugin.add();

    // Return the plugin
    return plugin;
  }

  /**
   * Deletes a specific plugin loaded in a map.
   *
   * @param pluginId - The id of the plugin to delete
   */
  async removePlugin(pluginId: string): Promise<void> {
    // Get the plugin and remove it
    const plugins = await this.getMapViewerPlugins();
    plugins[pluginId]?.remove?.();
    delete plugins[pluginId];
  }

  /**
   * Deletes all plugins loaded in a map.
   */
  async removePlugins(): Promise<void> {
    const recordOfPlugins = await this.getMapViewerPlugins();

    if (recordOfPlugins) {
      // remove all plugins by map
      for (let i = 0; i < Object.keys(recordOfPlugins).length; i += 1) {
        const pluginId = Object.keys(recordOfPlugins)[i];

        this.removePlugin(pluginId).catch((error: unknown) => {
          // Log
          logger.logPromiseFailed('removePlugins in plugins.ts', error);
        });
      }
    }
  }

  // #endregion PUBLIC METHODS

  // #region DOMAIN HANDLERS
  // GV Eventually, these should be moved to a store adaptor or similar construct that directly connects the domain to the store without going through the controller
  // GV.CONT but for now this allows us to keep domain-store interactions in one place and call application-level processes as needed during migration.

  // #endregion DOMAIN HANDLERS

  // #region STATIC METHODS

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
          this.#resolveWhenReady(pluginId, resolve, reject);
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
        this.#resolveWhenReady(pluginId, resolve, reject);
      }
    });
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

  // #endregion STATIC METHODS
}
