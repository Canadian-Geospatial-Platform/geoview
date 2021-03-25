/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-classes-per-file */
import React from 'react';

import i18next from 'i18next';
import * as translate from 'react-i18next';

import { makeStyles } from '@material-ui/core/styles';

import { api } from './api';

/**
 * interface used when creating a new plugin
 */
interface PluginType {
    // id of the plugin
    id: string;
    // plugin class object
    plugin: any;
}

/**
 * Class to manage plugins
 *
 * @exports
 * @class
 */
export class Plugin {
    plugins: Record<string, PluginType> = {};

    /**
     * Add new plugin
     *
     * @param {string} id the plugin id
     * @param {Class} constructor the plugin class (React Component)
     * @param {Object} props the plugin properties
     */
    addPlugin = async (id: string, constructor?: any, props?: Record<string, unknown>): void => {
        if (!(id in this.plugins)) {
            let plugin: any;

            if (constructor) {
                // create new instance of the plugin
                plugin = new constructor();
            } else {
                const InstanceConstructor = (await import(`../plugins/${id}/index.tsx`)).default;

                if (InstanceConstructor) plugin = new InstanceConstructor();
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

                if (!this.plugins[id]) {
                    this.plugins[id] = {
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
     */
    removePlugin = (id: string): void => {
        if (this.plugins[id] && this.plugins[id].plugin) {
            const { plugin } = this.plugins[id];

            // call the removed function on the plugin
            if (typeof plugin.removed === 'function') plugin.removed();
        }

        delete this.plugins[id];
    };
}
