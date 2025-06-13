import type * as React from 'react';
import type { createRoot } from 'react-dom/client';
import type i18next from 'react-i18next';
import type { useTheme } from '@mui/material/styles';

import { API } from '@/api/api';
import { MapViewer } from '@/geo/map/map-viewer';
import { TypeJsonObject, AnySchemaObject } from '@/api/config/types/config-types';
import { logger } from '@/core/utils/logger';

/**
 * interface used by all plugins to define their options.
 */
export type TypePluginOptions = {
  mapId: string;
  viewer?: MapViewer;
};

/**
 * Plugin abstract base class.
 */
export abstract class AbstractPlugin {
  // Id of the plugin
  pluginId: string;

  // Plugin properties
  pluginProps: TypePluginOptions;

  // Plugin config object.
  #configObj: TypeJsonObject = {};

  // Plugin api object.
  api: API;

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
   * @param {TypePluginOptions} props - The plugin options and properties.
   * @param {TypeJsonObject} config - Configuration object for the plugin.
   * @param {API} api - API object providing access to core functionality.
   */
  // GV Do not edit the constructor params without editing the plugin.ts dynamic constructor call looking like 'new (constructor as any)'
  constructor(pluginId: string, props: TypePluginOptions, api: API) {
    this.pluginId = pluginId;
    this.pluginProps = props;
    this.api = api;
    this.react = window.cgpv.react;
    this.createRoot = window.cgpv.createRoot;
    this.translate = window.cgpv.translate;
    this.useTheme = window.cgpv.ui.useTheme;
  }

  /**
   * Sets the config (which happens post creation)
   * @param {TypeJsonObject} config - The config
   */
  setConfig(config: TypeJsonObject): void {
    this.#configObj = config;
  }

  /**
   * Gets the config
   * @returns {unknown} The config
   */
  getConfig(): unknown {
    return this.#configObj;
  }

  /**
   * Returns the MapViewer used by this Plugin
   * @returns MapViewer The MapViewer used by this Plugin
   */
  mapViewer(): MapViewer {
    return this.api.getMapViewer(this.pluginProps.mapId);
  }

  /**
   * Returns the language currently used by the 'translate' i18next component used by this Plugin
   * @returns string The language, 'en' (English) by default.
   */
  displayLanguage(): string {
    return this.translate?.getI18n().language || 'en';
  }

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
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  defaultTranslations(): TypeJsonObject {
    return {}; // Default empty
  }

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
  add(): void {
    // Log
    logger.logInfo(`Plugin ${this.pluginId} loaded, adding it on map ${this.pluginProps.mapId}`);

    // Add
    this.onAdd();

    // Added
    this.onAdded?.();

    // Log
    logger.logInfo(`Plugin ${this.pluginId} loaded, and added to map ${this.pluginProps.mapId}`);
  }

  /**
   * This function is called when the plugin is removed, used for clean up. See plugin.addPlugin for details.
   */
  remove(): void {
    // Log
    logger.logInfo(`Plugin ${this.pluginId} being removed from map ${this.pluginProps.mapId}`);

    // Remove
    this.onRemove();

    // Removed
    this.onRemoved?.();

    // Log
    logger.logInfo(`Plugin ${this.pluginId} removed from map ${this.pluginProps.mapId}`);
  }
}
