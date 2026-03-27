import type * as React from 'react';
import type { createRoot } from 'react-dom/client';
import type i18next from 'react-i18next';
import type { useTheme } from '@mui/material/styles';
import type { MapViewer } from '@/geo/map/map-viewer';
/**
 * Plugin abstract base class.
 */
export declare abstract class AbstractPlugin {
    #private;
    /** The id of the plugin */
    pluginId: string;
    /** The map viewer for the plugin */
    mapViewer: MapViewer;
    /** The plugin properties */
    pluginProps?: unknown;
    /** The plugin react object */
    react: typeof React;
    /** The plugin createRoot object */
    createRoot: typeof createRoot;
    /** The plugin useTheme object */
    useTheme: typeof useTheme;
    /** The plugin translate object */
    translate?: typeof i18next;
    /**
     * Creates an instance of the plugin.
     *
     * @param pluginId - Unique identifier for the plugin instance
     * @param mapViewer - The map viewer
     * @param props - Optional plugin options and properties
     */
    constructor(pluginId: string, mapViewer: MapViewer, props: unknown | undefined);
    /**
     * Sets the config (which happens post creation).
     *
     * @param config - The config
     */
    setConfig(config: unknown): void;
    /**
     * Gets the config.
     *
     * @returns The config
     */
    getConfig(): unknown;
    /**
     * Returns the language currently used by the 'translate' i18next component used by this Plugin.
     *
     * @returns The language, 'en' (English) by default
     */
    displayLanguage(): string;
    /**
     * Must override function to get the schema validator.
     */
    abstract schema(): unknown;
    /**
     * Must override function to get the default config.
     */
    abstract defaultConfig(): unknown;
    /**
     * Overridable function to get the translations object for the Plugin.
     *
     * @returns The translations object
     */
    defaultTranslations(): Record<string, unknown>;
    /**
     * Override this to do the actual adding.
     */
    protected abstract onAdd(): void;
    /**
     * Optionally override this to do something when done adding.
     */
    protected onAdded?(): void;
    /**
     * Override this to do the actual removal.
     */
    protected abstract onRemove(): void;
    /**
     * Optionally override this to do something when done being removed.
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