import type * as React from 'react';
import type { createRoot } from 'react-dom/client';
import type i18next from 'react-i18next';
import type { useTheme } from '@mui/material/styles';

import type { MapViewer } from '@/geo/map/map-viewer';
import { logger } from '@/core/utils/logger';

/**
 * Plugin abstract base class.
 */
export abstract class AbstractPlugin {
  // Id of the plugin
  pluginId: string;

  // The map viewer for the plugin
  mapViewer: MapViewer;

  // Plugin properties
  pluginProps?: unknown;

  // Plugin config object.
  #configObj: unknown = {};

  // Plugin react object.
  react: typeof React;

  // Plugin createRoot object.
  createRoot: typeof createRoot;

  // Plugin useTheme object
  useTheme: typeof useTheme;

  // Plugin translate object
  translate?: typeof i18next;

  /**
   * Creates an instance of the plugin.
   * @param {string} pluginId - Unique identifier for the plugin instance.
   * @param {MapViewer} mapViewer - The map viewer
   * @param {unknown} [props] - Optional plugin options and properties.
   * @constructor
   */
  // GV Do not edit the constructor params without editing the plugin.ts dynamic constructor call looking like 'new (constructor as any)'
  constructor(pluginId: string, mapViewer: MapViewer, props: unknown | undefined) {
    this.pluginId = pluginId;
    this.mapViewer = mapViewer;
    this.pluginProps = props;
    this.react = window.cgpv.reactUtilities.react;
    this.createRoot = window.cgpv.reactUtilities.createRoot;
    this.translate = window.cgpv.translate;
    this.useTheme = window.cgpv.ui.useTheme;
  }

  /**
   * Sets the config (which happens post creation)
   * @param {unknown} config - The config
   * @return {void}
   */
  setConfig(config: unknown): void {
    this.#configObj = config;
  }

  /**
   * Gets the config
   * @return {unknown} The config
   */
  getConfig(): unknown {
    return this.#configObj;
  }

  /**
   * Returns the language currently used by the 'translate' i18next component used by this Plugin
   * @return {string} The language, 'en' (English) by default.
   */
  displayLanguage(): string {
    return this.translate?.getI18n().language || 'en';
  }

  /**
   * Must override function to get the schema validator
   * @return {unknown} The schema validator
   */
  abstract schema(): unknown;

  /**
   * Must override function to get the default config
   * @return {unknown} The default config
   */
  abstract defaultConfig(): unknown;

  /**
   * Overridable function to get the translations object for the Plugin.
   * @return {Record<string, unknown>} The translations object
   */
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  defaultTranslations(): Record<string, unknown> {
    return {}; // Default empty
  }

  /**
   * Override this to do the actual adding
   * @return {void}
   * @protected
   */
  protected abstract onAdd(): void;

  /**
   * Optionally override this to do something when done adding
   * @return {void}
   * @protected
   */
  protected onAdded?(): void;

  /**
   * Override this to do the actual removal
   * @return {void}
   * @protected
   */
  protected abstract onRemove(): void;

  /**
   * Optionally override this to do something when done being removed
   * @return {void}
   * @protected
   */
  protected onRemoved?(): void;

  /**
   * This function is called when the plugin is added, used for finalizing initialization. See plugin.addPlugin for details.
   * @return {void}
   */
  add(): void {
    // Log
    logger.logInfo(`Plugin '${this.pluginId}' loaded, adding it on map ${this.mapViewer.mapId}`);

    // Add
    this.onAdd();

    // Added
    this.onAdded?.();

    // Log
    logger.logInfo(`Plugin '${this.pluginId}' loaded, and added to map ${this.mapViewer.mapId}`);
  }

  /**
   * This function is called when the plugin is removed, used for clean up. See plugin.addPlugin for details.
   * @return {void}
   */
  remove(): void {
    // Log
    logger.logInfo(`Plugin '${this.pluginId}' being removed from map ${this.mapViewer.mapId}`);

    // Remove
    this.onRemove();

    // Removed
    this.onRemoved?.();

    // Log
    logger.logInfo(`Plugin '${this.pluginId}' removed from map ${this.mapViewer.mapId}`);
  }
}
