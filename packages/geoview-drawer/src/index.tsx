import React from 'react'; // GV This import is to validate that we're on the right React at the end of the file
import { TypeJsonObject, toJsonObject, AnySchemaObject } from 'geoview-core/api/config/types/config-types';
import { TypeDrawerConfig } from 'geoview-core/core/stores/store-interface-and-intial-values/drawer-state';
import { NavBarPlugin, TypeNavBarButtonConfig } from 'geoview-core/api/plugin/navbar-plugin';

import { logger } from 'geoview-core/core/utils/logger';

import schema from '../schema.json';
import defaultConfig from '../default-config-drawer.json';
import { createDrawerButtons } from './draw-navbar';

// Import css styles
import './measurement-styles.css';

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
          iconSize: 'Icon Size',
          geometryPicker: 'Change geometry type',
          geometryPickerPanel: 'Select a geometry',
          point: 'Point',
          text: 'Text',
          textFont: 'Font',
          textSize: 'Font Size',
          textColour: 'Text Colour',
          textHaloColour: 'Halo Colour',
          textHaloWidth: 'Halo Width',
          textBold: 'Bold',
          textItalic: 'Italic',
          textFormatting: 'Text formatting',
          linestring: 'Line',
          polygon: 'Polygon',
          rectangle: 'Rectangle',
          circle: 'Circle',
          star: 'Star',
          style: 'Change Style',
          toggleMeasurements: 'Toggle measurements',
          undoTooltip: 'Undo',
          redoTooltip: 'Redo',
          downloadTooltip: 'Download drawings',
          uploadTooltip: 'Upload drawings',
          colourPicker: 'Pick a colour',
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
          iconSize: "Taille de l'icône",
          geometryPicker: 'Changer le type de géométrie',
          geometryPickerPanel: 'Sélectionnez une géométrie',
          point: 'Pointer',
          text: 'Texte',
          textFont: 'Police de caractères',
          textSize: 'Taille de la police',
          textColour: 'Couleur du texte',
          textHaloColour: 'Couleur du halo',
          textHaloWidth: 'Largeur du halo',
          textBold: 'Gras',
          textItalic: 'Italique',
          textFormatting: 'Formatage du texte',
          linestring: 'Ligne',
          polygon: 'Polygone',
          rectangle: 'Rectangle',
          circle: 'Cercle',
          star: 'Étoile',
          style: 'Changer de style',
          toggleMeasurements: 'Basculer les mesures',
          undoTooltip: 'défaire',
          redoTooltip: 'refaire',
          downloadTooltip: 'Télécharger les dessins',
          uploadTooltip: 'Télécharger des dessins',
          colourPicker: 'Choisissez une couleur',
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
    return createDrawerButtons(this.getConfig());
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
