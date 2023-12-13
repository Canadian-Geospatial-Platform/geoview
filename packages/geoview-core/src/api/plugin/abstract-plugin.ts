import React from 'react';
import i18next from 'react-i18next';
import { API } from '@/api/api';
import { MapViewer } from '@/geo/map/map-viewer';
import { TypeWindow, TypeJsonObject } from '@/core/types/global-types';

/** ******************************************************************************************************************************
 * interface used by all plugins to define their options.
 */
export type TypePluginOptions = {
  mapId: string;
};

/** ******************************************************************************************************************************
 * Plugin abstract base class.
 */
export abstract class AbstractPlugin {
  // Id of the plugin
  pluginId: string;

  // Plugin properties
  pluginProps: TypePluginOptions;

  // NOTE START !! ****************************************************************************************************
  // The following attributes are attached, after instantiation, by the plugin loader addPlugin function ref 'Object.defineProperties'(!)
  // In this refactoring at the time of coding, I'm, simply, explicitely, writing them here so it's clear that this AbstractPlugin class has (and expects) those attributes.
  // See plugin.addPlugin function for more details.

  // Plugin config object
  configObj?: TypeJsonObject;

  // Plugin api object
  api?: API;

  // Plugin translate object
  translate?: typeof i18next;

  // Plugin react object
  react?: typeof React;

  // Plugin createElement object
  // TODO: Refactor - Plugin - Why createElement? - I'll just comment it out for now, as I've made it work another way in this refactor
  // createElement?: typeof React.createElement;

  // Plugin useTheme object
  // TODO: Refactor - Plugin - Why useTheme? - I'll just comment it out for now, as it doesn't seem to be used at all anyways (it should be commented out in plugin addPlugin too)
  // useTheme?: typeof useTheme;

  // Plugin props object
  // TODO: Refactor - Plugin - Remove 'props'? I don't know why props is set here, it seems like same thing as pluginProps already set in the constructor?
  props?: TypePluginOptions;

  // NOTE END !! ******************************************************************************************************

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
  map(): MapViewer | undefined {
    return this.api?.maps[this.pluginProps.mapId];
  }

  /**
   * Returns the language currently used by the 'translate' i18next component used by this Plugin
   * @returns string The language, 'en' (English) by default.
   */
  displayLanguage(): string {
    return this.translate?.getI18n().language || 'en';
  }

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
      // eslint-disable-next-line no-console
      console.log(`Plugin ${this.pluginId} loaded, adding it on map ${this.pluginProps.mapId}`);

      // Add
      this.onAdd();

      // Added
      this.onAdded?.();

      // eslint-disable-next-line no-console
      console.log(`Plugin ${this.pluginId} loaded, and added to map ${this.pluginProps.mapId}`);
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
      // eslint-disable-next-line no-console
      console.log(`Plugin ${this.pluginId} being removed from map ${this.pluginProps.mapId}`);

      // Remove
      this.onRemove();

      // Removed
      this.onRemoved?.();

      // eslint-disable-next-line no-console
      console.log(`Plugin ${this.pluginId} removed from map ${this.pluginProps.mapId}`);
    }
  }
}
