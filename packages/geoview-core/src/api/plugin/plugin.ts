import React from 'react';

import i18next from 'i18next';
import * as translate from 'react-i18next';

import Ajv from 'ajv';

import makeStyles from '@mui/styles/makeStyles';

import { MapViewer } from '../../geo/map/map';

import { api } from '../../app';
import { AbstractPlugin } from './abstract-plugin';
import { TypePluginStructure, TypeRecordOfPlugin } from './plugin-types';
import { toJsonObject, TypeJsonObject, TypeJsonValue } from '../../core/types/global-types';

import { EVENT_NAMES } from '../events/event-types';
import { snackbarMessagePayload } from '../events/payloads/snackbar-message-payload';

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

  plugins: TypeRecordOfPlugin = {};

  /**
   * Load a package script on runtime
   *
   * @param {string} id the package id to load
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  loadScript = async (id: string): Promise<any> => {
    return new Promise((resolve) => {
      const existingScript = document.getElementById(id);

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
        script.src = `${scriptPath}/corePackages/geoview-${id}.js`;
        script.id = id;
        document.body.appendChild(script);
        script.onload = () => {
          resolve(window.plugins[id]);
        };

        script.onerror = () => {
          resolve(null);
        };
      }

      if (existingScript && window.plugins && window.plugins[id]) {
        resolve(window.plugins[id]);
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
    if ((this.plugins[mapId] && !this.plugins[mapId][pluginId]) || !(mapId in this.plugins)) {
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

              api.event.emit(
                snackbarMessagePayload(EVENT_NAMES.SNACKBAR.EVENT_SNACKBAR_OPEN, mapId, {
                  type: 'string',
                  value: errorMessage,
                })
              );
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
          id: { value: pluginId },
          api: { value: api },
          createElement: { value: React.createElement },
          react: { value: React },
          props: { value: props !== undefined && props !== null ? props : {} },
          translate: { value: translate },
          makeStyles: { value: makeStyles },
          configObj: { value: pluginConfigObj },
        });

        if (!this.plugins[mapId]) {
          this.plugins[mapId] = {
            [pluginId]: plugin,
          };
        } else {
          this.plugins[mapId][pluginId] = plugin;
        }

        // call plugin added method if available
        if (typeof plugin.added === 'function') {
          plugin.added();
        }
      }
    }

    // call this only if plugins are being loaded from map config
    // this will not call if a plugin is loaded later from an api call
    if (!this.pluginsLoaded) {
      /**
       * are we still calling addPlugin to load more plugins? If so
       * Clear our timeout throughout the addPlugin call
       */
      window.clearTimeout(this.#pluginsReady);

      /**
       * If nothing clears this timeout
       * this will only be called after the last call of addPlugin
       */
      this.#pluginsReady = window.setTimeout(() => {
        this.pluginsLoaded = true;

        api.callInitCallback();
      }, 1000);
    }
  };

  /**
   * Delete a plugin
   *
   * @param {string} pluginId the id of the plugin to delete
   * @param {string} mapId the map id to remove the plugin from (if not provided then plugin will be removed from all maps)
   */
  removePlugin = (pluginId: string, mapId?: string): void => {
    if (mapId) {
      if (this.plugins[mapId] && this.plugins[mapId][pluginId]) {
        const plugin = this.plugins[mapId][pluginId];

        // call the removed function on the plugin
        if (typeof plugin.removed === 'function') plugin.removed();
      }

      delete this.plugins[mapId][pluginId];
    } else {
      // remove the plugin from all maps
      for (let i = 0; i < Object.keys(this.plugins).length; i += 1) {
        const aMapId = Object.keys(this.plugins)[i];
        const recordOfPlugins = this.plugins[aMapId];

        const plugin = recordOfPlugins[pluginId];

        // call the removed function on the plugin
        if (typeof plugin.removed === 'function') plugin.removed();

        delete this.plugins[aMapId][pluginId];
      }
    }
  };

  /**
   * Delete all plugins loaded in a map
   *
   * @param {string} mapId the map id to remove the plugin from (if not provided then plugin will be removed from all maps)
   */
  removePlugins = (mapId: string): void => {
    if (mapId) {
      const recordOfPlugins = this.plugins[mapId];

      if (recordOfPlugins) {
        // remove all plugins by map
        for (let i = 0; i < Object.keys(recordOfPlugins).length; i += 1) {
          const pluginId = Object.keys(recordOfPlugins)[i];

          this.removePlugin(pluginId, mapId);
        }
      }
    }
  };

  /**
   * A function that will load each plugin on a map then checks if there are a next plugin to load
   *
   * @param {string} mapIndex the map index to load the plugin at
   * @param {string} pluginIndex the plugin index to load
   */
  loadPlugin = (mapIndex: number, pluginIndex: number) => {
    const mapId = Object.keys(api.maps)[mapIndex];
    const map = api.maps[mapId] as MapViewer;

    // check if the map at this index have core packages and if there is a package at the plugin index
    if (map.mapFeaturesConfig.corePackages && map.mapFeaturesConfig.corePackages[pluginIndex]) {
      const pluginId = map.mapFeaturesConfig.corePackages[pluginIndex];

      // load the plugin from the script tag or create it
      this.loadScript(pluginId).then((constructor) => {
        // add the plugin by passing in the loaded constructor from the script tag
        this.addPlugin(
          pluginId,
          mapId,
          constructor,
          toJsonObject({
            mapId,
          })
        );

        // check if there is a next plugin at the current map index
        if (map.mapFeaturesConfig.corePackages && map.mapFeaturesConfig.corePackages[pluginIndex + 1]) {
          // load next plugin at the same map index
          this.loadPlugin(mapIndex, pluginIndex + 1);
          // if no more plugins at current map index then check if there is another map
        } else if (Object.keys(api.maps)[mapIndex + 1]) {
          // try to load first plugin at the next map
          this.loadPlugin(mapIndex + 1, 0);
        }
      });
      // if previous map did not have any packages then try to load packages from next map
    } else if (Object.keys(api.maps)[mapIndex + 1]) {
      // load packages at next map if exists
      this.loadPlugin(mapIndex + 1, 0);
      // if no plugins loaded then call init callback function
    } else if (Object.keys(this.plugins).length === 0) {
      api.callInitCallback();
    }
  };

  /**
   * Load plugins provided by map config
   */
  loadPlugins = (): void => {
    // check if a map exists
    if (Object.keys(api.maps)[0]) {
      // start loading core packages on first map and first package
      this.loadPlugin(0, 0);
    }
  };
}
