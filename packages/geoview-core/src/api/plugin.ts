/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-classes-per-file */
import React from 'react';

import i18next from 'i18next';
import * as translate from 'react-i18next';

import makeStyles from '@mui/styles/makeStyles';

import { MapViewer } from '../geo/map/map';

import { api } from './api';
import { Cast, TypeWindow } from '../core/types/cgpv-types';

/**
 * Class to manage plugins
 *
 * @exports
 * @class
 */
export class Plugin {
  plugins: Record<string, any> = {};

  /**
   * Load a package script on runtime
   *
   * @param {string} id the package id to load
   */
  loadScript = async (id: string): Promise<any> => {
    return new Promise((resolve) => {
      const existingScript = document.getElementById(id);
      if (!existingScript) {
        const script = document.createElement('script');
        script.src = `./geoview-${id}.js`;
        script.id = id;
        document.body.appendChild(script);
        script.onload = () => {
          resolve(window.plugins[id]);
        };

        script.onerror = () => {
          resolve(null);
        };
      }
      if (existingScript) resolve(window.plugins[id]);
    });
  };

  /**
   * Add new plugin
   *
   * @param {string} id the plugin id
   * @param {string} id of map to add this plugin to
   * @param {Class} constructor the plugin class (React Component)
   * @param {Object} props the plugin properties
   */
  addPlugin = async (id: string, mapId: string, constructor?: any, props?: Record<string, unknown>): Promise<void> => {
    if ((this.plugins[mapId] && !this.plugins[mapId][id]) || !(mapId in this.plugins)) {
      let plugin: any;

      if (constructor) {
        // create new instance of the plugin
        plugin = new constructor(id, props);
      } else {
        const InstanceConstructor = await this.loadScript(id);

        // const InstanceConstructor = (await import(`${'../plugins'}/${id}/index.tsx`)).default;

        if (InstanceConstructor) plugin = new InstanceConstructor(id, props);
      }

      if (plugin) {
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
          id: { value: id },
          api: { value: api },
          createElement: { value: React.createElement },
          react: { value: React },
          props: { value: props !== undefined && props !== null ? props : {} },
          translate: { value: translate },
          makeStyles: { value: makeStyles },
        });

        if (!this.plugins[mapId]) {
          this.plugins[mapId] = {
            [id]: {
              id,
              plugin,
            },
          };
        } else {
          this.plugins[mapId][id] = {
            id,
            plugin,
          };
        }

        // call plugin added method if available
        if (typeof plugin.added === 'function') {
          plugin.added();
        }
      }
    }
  };

  /**
   * Delete a plugin
   *
   * @param {string} id the id of the plugin to delete
   * @param {string} mapId the map id to remove the plugin from (if not provided then plugin will be removed from all maps)
   */
  removePlugin = (id: string, mapId?: string): void => {
    if (mapId) {
      if (this.plugins[mapId] && this.plugins[mapId][id] && this.plugins[mapId][id].plugin) {
        const { plugin } = this.plugins[mapId][id];

        // call the removed function on the plugin
        if (typeof plugin.removed === 'function') plugin.removed();
      }

      delete this.plugins[mapId][id];
    } else {
      // remove the plugin from all maps
      for (let i = 0; i < Object.keys(this.plugins).length; i += 1) {
        const pluginMapId = Object.keys(this.plugins)[i];
        const value = this.plugins[pluginMapId];

        if (value[id] && value[id].plugin) {
          const { plugin } = value[id];

          // call the removed function on the plugin
          if (typeof plugin.removed === 'function') plugin.removed();

          delete this.plugins[pluginMapId][id];
        }
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
      const mapPlugins = this.plugins[mapId];

      if (mapPlugins) {
        // remove all plugins by map
        for (let i = 0; i < Object.keys(mapPlugins).length; i += 1) {
          const plugin = Object.keys(mapPlugins)[i];

          this.removePlugin(plugin, mapId);
        }
      }
    }
  };

  /**
   * Load plugins provided by map config
   */
  loadPlugins = (): void => {
    // loop through each map and check if the config contains any plugins to load
    Object.keys(api.maps).forEach((mapId: string) => {
      const map = api.maps[mapId] as MapViewer;

      // load plugins if provided in the config
      if (map.mapProps.corePackages && map.mapProps.corePackages.length > 0) {
        map.mapProps.corePackages.forEach((plugin) => {
          const { plugins } = Cast<TypeWindow>(window);
          if (plugins && plugins[plugin]) {
            this.addPlugin(plugin, mapId, plugins[plugin], {
              mapId,
            });
          } else {
            this.addPlugin(plugin, mapId, null, {
              mapId,
            });
          }
        });
      }
    });
  };
}
