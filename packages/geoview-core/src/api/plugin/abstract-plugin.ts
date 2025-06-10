import React from 'react';
import i18next from 'react-i18next';

import { useTheme } from '@mui/material/styles';
import { API } from '@/api/api';
import { MapViewer } from '@/geo/map/map-viewer';
import { TypeWindow } from '@/core/types/global-types';
import { TypeJsonObject, AnySchemaObject } from '@/api/config/types/config-types';
import { logger } from '@/core/utils/logger';

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
export abstract class AbstractPlugin {
  // Id of the plugin
  pluginId: string;

  // Plugin properties
  pluginProps: TypePluginOptions;

  // GV NOTE START ****************************************************************************************************
  // The following attributes are attached, after instantiation, by the plugin loader addPlugin function ref 'Object.defineProperties'(!)
  // In this refactoring at the time of coding, I'm, simply, explicitely, writing them here so it's clear that this AbstractPlugin class has (and expects) those attributes.
  // See plugin.addPlugin function for more details.

  // Plugin config object. The '!' is used, because it's not set by the constructor, it's set by the note above.
  configObj!: TypeJsonObject;

  // Plugin api object. The '!' is used, because it's not set by the constructor, it's set by the note above.
  api!: API;

  // Plugin react object. The '!' is used, because it's not set by the constructor, it's set by the note above.
  react!: typeof React;

  // Plugin translate object
  // TODO: Refactor - Plugin - Maybe translate is not necessary here.. This might get removed eventually. Don't forget to remove in plugin class too in 'Object.defineProperties'(!)
  translate?: typeof i18next;

  // Plugin useTheme object
  // TODO: Refactor - Plugin - Maybe useTheme is not necessary here.. This might get removed eventually. Don't forget to remove in plugin class too in 'Object.defineProperties'(!)
  useTheme?: typeof useTheme;

  // GV NOTE END *****************************************************************************************************

  /**
   * Constructs a Plugin
   * @param pluginId string The plugin id
   * @param props TypePluginOptions The plugin configuration options
   */
  constructor(pluginId: string, props: TypePluginOptions) {
    this.pluginId = pluginId;
    this.pluginProps = props;
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
  added(): void {
    // Fetch cgpv
    const { cgpv } = window as TypeWindow;

    // If cgpv
    if (cgpv) {
      // Log
      logger.logInfo(`Plugin ${this.pluginId} loaded, adding it on map ${this.pluginProps.mapId}`);

      // Add
      this.onAdd();

      // Added
      this.onAdded?.();

      // Log
      logger.logInfo(`Plugin ${this.pluginId} loaded, and added to map ${this.pluginProps.mapId}`);
    }
  }

  /**
   * This function is called when the plugin is removed, used for clean up. See plugin.addPlugin for details.
   */
  removed(): void {
    // Fetch cgpv
    const { cgpv } = window as TypeWindow;

    // If cgpv
    if (cgpv) {
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
}
