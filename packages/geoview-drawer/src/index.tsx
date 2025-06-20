import React from 'react';
import { TypeJsonObject, toJsonObject, AnySchemaObject } from 'geoview-core/api/config/types/config-types';
import { TypeDrawerConfig } from 'geoview-core/core/stores/store-interface-and-intial-values/drawer-state';
import { NavBarPlugin, TypeNavBarButtonConfig } from 'geoview-core/api/plugin/navbar-plugin';

import { logger } from 'geoview-core/core/utils/logger';

import schema from '../schema.json';
import defaultConfig from '../default-config-drawer.json';
import { createDrawerButtons } from './draw-navbar';

// Import css styles
import './measurement-styles.css';

// TODO Optional: Install package - MUI Colour Picker
// TO.DO Add support for RGBA instead of just Hex to handle transparency
// TO.DO Confirm / Finalize config in the geoview config
// TO.DO Use Config properly
// TO.DO Export drawings
// TO.DO Other interactions: Snap, Translate, Scale / Rotate (not actually a built in interaction)
// TO.DO Optional: Make the geometry icon in the geometry picker match the style colours (Fill / Outline)

/**
 * Create a class for the plugin instance
 */
class DrawerPlugin extends NavBarPlugin {
  /**
   * Returns the package schema
   *
   * @returns {AnySchemaObject} the package schema
   */
  override schema(): AnySchemaObject {
    return schema;
  }

  /**
   * Returns the default config for this package
   *
   * @returns {TypeJsonObject} the default config
   */
  override defaultConfig(): TypeJsonObject {
    return toJsonObject(defaultConfig);
  }

  // The callback used to redraw the GeoCharts in the GeoChartPanel
  callbackRedraw?: () => void;

  /**
   * Overrides the default translations for the Plugin.
   * @returns {TypeJsonObject} - The translations object for the particular Plugin.
   */
  override defaultTranslations(): TypeJsonObject {
    return {
      en: {
        drawer: {
          title: 'Draw',
          stopDrawing: 'Stop',
          stopDrawingTooltip: 'Stop Drawing',
          toggleDrawing: 'Toggle Drawing',
          clear: 'Clear',
          clearTooltip: 'Clear the drawings',
          edit: 'Toggle editing',
          fillColour: 'Fill Colour',
          strokeColour: 'Stroke Colour',
          strokeWidth: 'Stroke Width',
          geometryPicker: 'Change geometry type',
          geometryPickerPanel: 'Select a geometry',
          point: 'Point',
          linestring: 'Line',
          polygon: 'Polygon',
          circle: 'Circle',
          style: 'Change Style',
          toggleMeasurements: 'Toggle measurements',
        },
      },
      fr: {
        drawer: {
          title: 'Dessiner',
          stopDrawing: 'Arrêter',
          stopDrawingTooltip: 'Arrêter le dessin',
          toggleDrawing: 'Basculer',
          clear: 'Effacer',
          clearTooltip: 'Effacer les dessins',
          edit: "Basculer l'édition",
          fillColour: 'Couleur de remplissage',
          strokeColour: 'Couleur du contour',
          strokeWidth: 'Largeur du contour',
          geometryPicker: 'Changer le type de géométrie',
          geometryPickerPanel: 'Sélectionnez une géométrie',
          point: 'Pointer',
          linestring: 'Ligne',
          polygon: 'Polygone',
          circle: 'Cercle',
          style: 'Changer de style',
          toggleMeasurements: 'Basculer les mesures',
        },
      },
    } as unknown as TypeJsonObject;
  }

  /**
   * Overrides the getConfig in order to return the right type.
   * @returns {ConfigProps} The Swiper config
   */
  override getConfig(): TypeDrawerConfig {
    // Redirect
    return super.getConfig() as TypeDrawerConfig;
  }

  /**
   * Overrides the creation of the buttons components to create a record of Buttons with their optional panels.
   */
  override onCreateButtonConfigs(): Record<string, TypeNavBarButtonConfig> {
    // Create all drawer buttons
    logger.logInfo('Drawer Plugin - onAdd');
    // return createDrawerButtons(this.getConfig().drawer);
    return createDrawerButtons();
  }

  override onAdd(): void {
    // Call parent
    super.onAdd();
  }

  /**
   * Handles when a redraw callback has been provided by GeoChartPanel
   */
  handleProvideCallbackRedraw(callbackRedraw: () => void): void {
    // Keep it
    this.callbackRedraw = callbackRedraw;
  }
}

export default DrawerPlugin;

// GV This if condition took over 3 days to investigate. It was giving errors on the app.geo.ca website with
// GV some conflicting reacts being loaded on the page for some obscure reason.
// Check if we're on the right react
if (React === window.cgpv.reactUtilities.react) {
  // Keep a reference to the Drawer Plugin as part of the geoviewPlugins property stored in the window object
  window.geoviewPlugins = window.geoviewPlugins || {};
  window.geoviewPlugins.drawer = DrawerPlugin;
}
