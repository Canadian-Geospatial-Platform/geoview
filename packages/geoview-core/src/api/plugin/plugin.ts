import React from 'react';

import { useTheme } from '@mui/material/styles';

import i18next from 'i18next';
import * as translate from 'react-i18next';

import Ajv from 'ajv';

import { whenThisThen, showError } from '@/core/utils/utilities';

import { api } from '@/app';
import { AbstractPlugin } from './abstract-plugin';
import { TypePluginStructure } from './plugin-types';
import { TypeJsonObject, TypeJsonValue } from '@/core/types/global-types';

/**
 * Class to manage plugins
 *
 * @exports
 * @class
 */
export class Plugin {
  // used for a timer to check if all plugins are loaded then execute a timer
  #pluginsReady = 0;

  // used to indicate that all initial plugins finished loading
  pluginsLoaded = false;

  /**
   * Load a package script on runtime
   *
   * @param {string} pluginId the package id to load
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  loadScript = (pluginId: string): Promise<any> => {
    return new Promise((resolve, reject) => {
      const existingScript = document.getElementById(pluginId);

      if (!existingScript) {
        // get all loaded js scripts on the page
        const scripts = document.getElementsByTagName('script');
        let scriptPath: string | null = null;

        if (scripts && scripts.length) {
          // go through all loaded scripts on the page
          for (let scriptIndex = 0; scriptIndex < scripts.length; scriptIndex++) {
            // search for the core script
            if (scripts[scriptIndex].src.includes('cgpv-main')) {
              // get the src of the core script
              const { src } = scripts[scriptIndex];

              // extract the host from the loaded core script
              scriptPath = src.substring(0, src.lastIndexOf('/'));

              break;
            }
          }
        }

        // create a script element
        const script = document.createElement('script');
        script.src = `${scriptPath}/corePackages/geoview-${pluginId}.js`;
        script.id = pluginId;
        document.body.appendChild(script);
        script.onload = () => {
          resolve(window.geoviewPlugins[pluginId]);
        };
        script.onerror = () => {
          resolve(null);
        };
      } else {
        // Resolve only once the script is indeed loaded.
        // This is because when you load for example 2 maps in parallel with the same plugin script, this 'loadScript' function is
        // called in parallel and the script.onload callback (a few lines above) hasn't been called back yet (for the 1st plugin load).
        // Therefore, any subsequent call to loadScript has to actually wait for the script.onload to
        // be calledback. Otherwise, even if 'existingScript' says that it's been loaded,
        // it's not 'yet' true, because the js file might still be being downloaded and window.geoviewPlugins[pluginId] still undefined.
        whenThisThen(() => window.geoviewPlugins?.[pluginId])
          .then(() => {
            resolve(window.geoviewPlugins[pluginId]);
          })
          .catch((error) => {
            reject(error);
          });
      }
    });
  };

  /**
   * Add new plugin
   *
   * @param {string} pluginId the plugin id
   * @param {string} mapId id of map to add this plugin to
   * @param {Class} constructor the plugin class (React Component)
   * @param {Object} props the plugin properties
   */
  addPlugin = async (
    pluginId: string,
    mapId: string,
    constructor?: AbstractPlugin | ((pluginId: string, props: TypeJsonObject) => TypeJsonValue),
    props?: TypeJsonObject
  ): Promise<void> => {
    if (!api.maps?.[mapId]?.plugins?.[pluginId]) {
      let plugin: TypePluginStructure | null = null;

      if (constructor) {
        // create new instance of the plugin. Here we must type the constructor variable to any
        // in order to cancel the "'new' expression, whose target lacks a construct signature" error message
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        plugin = new (constructor as any)(pluginId, props);
      }

      if (plugin) {
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
          const validate = validator.compile(schema);

          // if no config is provided then use default
          pluginConfigObj = defaultConfig;

          /**
           * If a user is using map config from a file then attempt to look
           * for custom config for loaded core packages on the same path of the map config.
           * If none exists then load the default config
           */
          const configUrl = document.getElementById(mapId)?.getAttribute('data-config-url');

          if (configUrl) {
            const configPath = `${configUrl.split('.json')[0]}-${pluginId}.json`;

            try {
              // try to find get the custom config from the config path
              const result = await (await fetch(configPath)).json();

              if (result) {
                pluginConfigObj = result;
              }
            } catch (error) {
              // config not found
            }
          }

          // validate configuration
          const valid = validate(pluginConfigObj);

          if (!valid && validate.errors && validate.errors.length) {
            for (let j = 0; j < validate.errors.length; j += 1) {
              const error = validate.errors[j];

              const errorMessage = `Plugin ${pluginId}: ${error.instancePath} ${error.message} - ${JSON.stringify(error.params)}`;
              showError(mapId, errorMessage);
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
          react: { value: React },
          translate: { value: translate },
          useTheme: { value: useTheme },
          configObj: { value: pluginConfigObj },
        });

        // attach to the map plugins object
        api.maps[mapId].plugins[pluginId] = plugin;

        // call plugin added method if available
        if (typeof plugin.added === 'function') {
          plugin.added();
        }
      }
    }
  };

  /**
   * Delete a specific plugin loaded in a map
   *
   * @param {string} pluginId the id of the plugin to delete
   * @param {string} mapId the map id to remove the plugin from
   */
  removePlugin = (pluginId: string, mapId: string): void => {
    if (mapId) {
      if (!api.maps?.[mapId]?.plugins?.[pluginId]) {
        const plugin = api.maps[mapId].plugins[pluginId];

        // call the removed function on the plugin
        if (typeof plugin.removed === 'function') plugin.removed();
      }

      delete api.maps[mapId].plugins[pluginId];
    }
  };

  /**
   * Delete all plugins loaded in a map
   *
   * @param {string} mapId the map id to remove the plugin from (if not provided then plugin will be removed from all maps)
   */
  removePlugins = (mapId: string): void => {
    if (mapId) {
      const recordOfPlugins = api.maps[mapId].plugins;

      if (recordOfPlugins) {
        // remove all plugins by map
        for (let i = 0; i < Object.keys(recordOfPlugins).length; i += 1) {
          const pluginId = Object.keys(recordOfPlugins)[i];

          this.removePlugin(pluginId, mapId);
        }
      }
    }
  };
}
