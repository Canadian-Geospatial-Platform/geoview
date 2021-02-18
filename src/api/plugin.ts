import React from 'react';

import i18next from 'i18next';
import * as translate from 'react-i18next';

import { makeStyles } from '@material-ui/core/styles';

import { api } from './api';

/**
 * Class to manage plugins
 *
 * @exports
 * @class
 */
export class Plugin {
    /**
     * Add new plugin
     *
     * @param {string} id the plugin id
     * @param {Class} constructor the plugin class (React Component)
     * @param {Object} props the plugin properties
     */
    add = (id: string, constructor: unknown, props: Record<string, unknown>): void => {
        let plugin = null;

        if (constructor) {
            // create new instance of the plugin
            plugin = new constructor();

            // add translations if provided
            if (plugin.translations) {
                const translations = plugin.translations();

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
                props: { value: props },
                translate: { value: translate },
                makeStyles: { value: makeStyles },
            });

            // call plugin added method
            plugin.added();
        }
    };
}
