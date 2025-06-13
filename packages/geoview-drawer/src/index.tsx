import { TypeJsonObject, toJsonObject, Cast, AnySchemaObject } from 'geoview-core/src/api/config/types/config-types';
import { NavBarPlugin, TypeNavBarButtonConfig } from 'geoview-core/src/api/plugin/navbar-plugin';

import { logger } from 'geoview-core/src/core/utils/logger';

import schema from '../schema.json';
import defaultConfig from '../default-config-drawer.json';
import { createDrawerButtons } from './draw-navbar';

// TODO Measure Option
// TODO install package - MUI Colour Picker
// TODO Add support for RGBA instead of just Hex codes for Opacity/Transparency
// TODO Add ability to edit drawing

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
   * Translations object to inject to the viewer translations
   */
  translations = toJsonObject({
    en: {
      drawer: {
        title: 'Draw',
        stopDrawing: 'Stop',
        stopDrawingTooltip: 'Stop Drawing',
        toggleDrawing: 'Toggle Drawing',
        clear: 'Clear',
        clearTooltip: 'Clear the drawings',
        fillColour: 'Fill Colour',
        strokeColour: 'Stroke Colour',
        strokeWidth: 'Stroke Width',
        geometryPicker: 'Change geometry type',
        geometryPickerPanel: 'Select a geometry',
        point: 'Point',
        linestring: 'Line',
        polygon: 'Polygon',
        circle: 'Circle',
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
        fillColour: 'Couleur de remplissage',
        strokeColour: 'Couleur du contour',
        strokeWidth: 'Largeur du contour',
        geometryPicker: 'Changer le type de géométrie',
        geometryPickerPanel: 'Sélectionnez une géométrie',
        point: 'Pointer',
        linestring: 'Ligne',
        polygon: 'Polygone',
        circle: 'Cercle',
      },
    },
  });

  /**
   * Overrides the creation of the buttons components to create a record of Buttons with their optional panels.
   */
  override onCreateButtonConfigs(): Record<string, TypeNavBarButtonConfig> {
    // Create all drawer buttons
    logger.logInfo('Drawer Plugin - onAdd');
    return createDrawerButtons(this.configObj);
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

// Keep a reference to the Drawer Plugin as part of the geoviewPlugins property stored in the window object
window.geoviewPlugins = window.geoviewPlugins || {};
window.geoviewPlugins.drawer = Cast<DrawerPlugin>(DrawerPlugin);
