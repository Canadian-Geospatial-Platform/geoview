import type * as React from 'react';
import type { createRoot } from 'react-dom/client';
import type i18next from 'react-i18next';
import type { useTheme } from '@mui/material/styles';
import { API } from '@/api/api';
import { MapViewer } from '@/geo/map/map-viewer';
import { TypeJsonObject, AnySchemaObject } from '@/api/config/types/config-types';
/**
 * interface used by all plugins to define their options.
 */
export type TypePluginOptions = {
    mapId: string;
    viewer: MapViewer;
};
/**
 * Plugin abstract base class.
 */
export declare abstract class AbstractPlugin {
    #private;
    pluginId: string;
    pluginProps: TypePluginOptions;
    api: API;
    react: typeof React;
    createRoot: typeof createRoot;
    useTheme: typeof useTheme;
    translate?: typeof i18next;
    /**
     * Creates an instance of the plugin.
     * @param {string} pluginId - Unique identifier for the plugin instance.
     * @param {TypePluginOptions} props - The plugin options and properties.
     * @param {API} api - API object providing access to core functionality.
     */
    constructor(pluginId: string, props: TypePluginOptions, api: API);
    /**
     * Sets the config (which happens post creation)
     * @param {TypeJsonObject} config - The config
     */
    setConfig(config: TypeJsonObject): void;
    /**
     * Gets the config
     * @returns {unknown} The config
     */
    getConfig(): unknown;
    /**
     * Returns the MapViewer used by this Plugin
     * @returns MapViewer The MapViewer used by this Plugin
     */
    mapViewer(): MapViewer;
    /**
     * Returns the language currently used by the 'translate' i18next component used by this Plugin
     * @returns string The language, 'en' (English) by default.
     */
    displayLanguage(): string;
    /**
     * Must override function to get the schema validator
     */
    abstract schema(): AnySchemaObject;
    /**
     * Must override function to get the default config
     */
    abstract defaultConfig(): TypeJsonObject;
    /**
     * Overridable function to get the translations object for the Plugin.
     * @returns {TypeJsonObject} The translations object
     */
    defaultTranslations(): TypeJsonObject;
    /**
     * Override this to do the actual adding
     */
    protected abstract onAdd(): void;
    /**
     * Optionally override this to do something when done adding
     */
    protected onAdded?(): void;
    /**
     * Override this to do the actual removal
     */
    protected abstract onRemove(): void;
    /**
     * Optionally override this to do something when done being removed
     */
    protected onRemoved?(): void;
    /**
     * This function is called when the plugin is added, used for finalizing initialization. See plugin.addPlugin for details.
     */
    add(): void;
    /**
     * This function is called when the plugin is removed, used for clean up. See plugin.addPlugin for details.
     */
    remove(): void;
}
//# sourceMappingURL=abstract-plugin.d.ts.map