import React from 'react';
import i18next from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import { API } from '@/api/api';
import { MapViewer } from '@/geo/map/map-viewer';
import { TypeJsonObject } from '@/core/types/global-types';
/** ******************************************************************************************************************************
 * interface used by all plugins to define their options.
 */
export type TypePluginOptions = {
    mapId: string;
};
/** ******************************************************************************************************************************
 * Plugin abstract base class.
 */
export declare abstract class AbstractPlugin {
    pluginId: string;
    pluginProps: TypePluginOptions;
    configObj?: TypeJsonObject;
    api?: API;
    react?: typeof React;
    translate?: typeof i18next;
    useTheme?: typeof useTheme;
    /**
     * Constructs a Plugin
     * @param pluginId string The plugin id
     * @param props TypePluginOptions The plugin configuration options
     */
    constructor(pluginId: string, props: TypePluginOptions);
    /**
     * Returns the MapViewer used by this Plugin
     * @returns MapViewer The MapViewer used by this Plugin
     */
    map(): MapViewer | undefined;
    /**
     * Returns the language currently used by the 'translate' i18next component used by this Plugin
     * @returns string The language, 'en' (English) by default.
     */
    displayLanguage(): string;
    /**
     * Override this to do the actual adding
     */
    abstract onAdd(): void;
    /**
     * Optionally override this to do something when done adding
     */
    onAdded?(): void;
    /**
     * Override this to do the actual removal
     */
    abstract onRemove(): void;
    /**
     * Optionally override this to do something when done being removed
     */
    onRemoved?(): void;
    /**
     * This function is called when the plugin is added, used for finalizing initialization. See plugin.addPlugin for details.
     */
    added(): void;
    /**
     * This function is called when the plugin is removed, used for clean up. See plugin.addPlugin for details.
     */
    removed(): void;
}
