import type * as React from 'react';
import type { createRoot } from 'react-dom/client';
import type i18next from 'react-i18next';
import type { useTheme } from '@mui/material/styles';
import { MapViewer } from '@/geo/map/map-viewer';
/**
 * Plugin abstract base class.
 */
export declare abstract class AbstractPlugin {
    #private;
    pluginId: string;
    mapViewer: MapViewer;
    pluginProps?: unknown;
    react: typeof React;
    createRoot: typeof createRoot;
    useTheme: typeof useTheme;
    translate?: typeof i18next;
    /**
     * Creates an instance of the plugin.
     * @param {string} pluginId - Unique identifier for the plugin instance.
     * @param {MapViewer} mapViewer - The map viewer
     * @param {unknown | undefined} props - Optional plugin options and properties.
     */
    constructor(pluginId: string, mapViewer: MapViewer, props: unknown | undefined);
    /**
     * Sets the config (which happens post creation)
     * @param {unknown} config - The config
     */
    setConfig(config: unknown): void;
    /**
     * Gets the config
     * @returns {unknown} The config
     */
    getConfig(): unknown;
    /**
     * Returns the language currently used by the 'translate' i18next component used by this Plugin
     * @returns string The language, 'en' (English) by default.
     */
    displayLanguage(): string;
    /**
     * Must override function to get the schema validator
     */
    abstract schema(): unknown;
    /**
     * Must override function to get the default config
     */
    abstract defaultConfig(): unknown;
    /**
     * Overridable function to get the translations object for the Plugin.
     * @returns {Record<string, unknown>} The translations object
     */
    defaultTranslations(): Record<string, unknown>;
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