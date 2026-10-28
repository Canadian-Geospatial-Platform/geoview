import React from 'react'; // GV This import is to validate that we're on the right React at the end of the file
import { MapPlugin } from 'geoview-core/api/plugin/map-plugin';
import { logger } from 'geoview-core/core/utils/logger';

import schema from '../schema.json';
import defaultConfig from '../default-config-swiper.json';
import type { ConfigProps } from './swiper';
import { Swiper } from './swiper';
import type { SwipeOrientation, SwipeSide } from './swiper-types';

/**
 * Create a class for the plugin instance.
 */
class SwiperPlugin extends MapPlugin {
  /**
   * Returns the package schema.
   *
   * @returns The package schema
   */
  override schema(): unknown {
    return schema;
  }

  /**
   * Returns the default config for this package.
   *
   * @returns The default config
   */
  override defaultConfig(): unknown {
    return defaultConfig;
  }

  /**
   * Overrides the default translations for the Plugin.
   *
   * @returns The translations object for the particular Plugin
   */
  override defaultTranslations(): Record<string, unknown> {
    return {
      en: {
        swiper: {
          tooltip: 'Drag to see underlying layer',
          positionLabel: 'Map comparison position',
          positionFromLeft: 'Divider {{percent}} percent from the left',
          positionFromTop: 'Divider {{percent}} percent from the top',
          instructionsHorizontal: 'Use the Left and Right arrow keys to move the comparison divider.',
          instructionsVertical: 'Use the Up and Down arrow keys to move the comparison divider.',
          menu: 'Swiper',
          settingsTitle: 'Swiper',
          useWithSwiper: 'Use with swiper bar',
          sideLabel: 'Visible side',
          sideLeft: 'Left',
          sideRight: 'Right',
          sideUp: 'Up',
          sideDown: 'Down',
        },
      },
      fr: {
        swiper: {
          tooltip: 'Faites glisser pour voir les couches sous-jacentes',
          positionLabel: 'Position de comparaison de la carte',
          positionFromLeft: 'Séparateur à {{percent}} pour cent depuis la gauche',
          positionFromTop: 'Séparateur à {{percent}} pour cent depuis le haut',
          instructionsHorizontal: 'Utilisez les touches fléchées Gauche et Droite pour déplacer le séparateur de comparaison.',
          instructionsVertical: 'Utilisez les touches fléchées Haut et Bas pour déplacer le séparateur de comparaison.',
          menu: 'Balayage',
          settingsTitle: 'Balayage',
          useWithSwiper: 'Utiliser avec la barre de balayage',
          sideLabel: 'Côté visible',
          sideLeft: 'Gauche',
          sideRight: 'Droit',
          sideUp: 'Haut',
          sideDown: 'Bas',
        },
      },
    };
  }

  /**
   * Overrides the getConfig in order to return the right type.
   *
   * @returns The Swiper config
   */
  override getConfig(): ConfigProps {
    // Redirect
    return super.getConfig() as ConfigProps;
  }

  /**
   * Overrides the addition of the Swiper Map Plugin to make sure to set the layer paths from the config into the store.
   */
  override onAdd(): void {
    // Call parent
    super.onAdd();

    // Initialize the store with swiper provided configuration
    this.mapViewer.controllers.swiperController?.setOrientation(this.getConfig().orientation);
    this.mapViewer.controllers.swiperController?.setInteractive(this.getConfig().interactive ?? false);
    this.mapViewer.controllers.swiperController?.setLayers(this.getConfig().layers);
  }

  /**
   * Overrides the creation of the content of this Swiper Map Plugin.
   *
   * @returns The JSX.Element representing the Swiper Plugin
   */
  override onCreateContent(): JSX.Element {
    return <Swiper controllerRegistry={this.mapViewer.controllers} config={this.getConfig()} />;
  }

  /**
   * Activates the swiper for the layer indicated by the given layer path.
   *
   * @param layerPath - The layer path to activate swiper functionality
   * @param side - Optional visible side for the layer. Defaults to left for vertical orientation and up for horizontal orientation
   */
  activateForLayer(layerPath: string, side?: SwipeSide): void {
    try {
      // Add the layer path
      this.mapViewer.controllers.swiperController?.addLayerPath(layerPath, side);
    } catch (error: unknown) {
      // Log
      logger.logError(error);
    }
  }

  /**
   * Deactivates the swiper for the layer indicated by the given layer path.
   *
   * @param layerPath - The layer path to deactivate swiper functionality
   */
  deActivateForLayer(layerPath: string): void {
    try {
      // Remove the layer
      this.mapViewer.controllers.swiperController?.removeLayerPath(layerPath);
    } catch (error: unknown) {
      // Log
      logger.logError(error);
    }
  }

  /**
   * Sets the visible side for a layer already participating in the swiper.
   *
   * @param layerPath - The layer path to update
   * @param side - The visible side for the layer
   */
  setLayerSide(layerPath: string, side: SwipeSide): void {
    this.mapViewer.controllers.swiperController?.setLayerSide(layerPath, side);
  }

  /**
   * Deactivates the swiper for all layers.
   */
  deActivateAll(): void {
    // Remove all layers
    this.mapViewer.controllers.swiperController?.removeAllLayerPaths();
  }

  /**
   * Sets the orientation of the swiper.
   *
   * @param orientation - The orientation to set
   */
  setOrientation(orientation: SwipeOrientation): void {
    // Set the orientation in the store
    this.mapViewer.controllers.swiperController?.setOrientation(orientation);
  }
}

export default SwiperPlugin;

// GV This if condition took over 3 days to investigate. It was giving errors on the app.geo.ca website with
// GV some conflicting reacts being loaded on the page for some obscure reason.
// Check if we're on the right react
if (React === window.cgpv.reactUtilities.react) {
  // Keep a reference to the Swiper Plugin as part of the geoviewPlugins property stored in the window object
  window.geoviewPlugins = window.geoviewPlugins || {};
  window.geoviewPlugins.swiper = SwiperPlugin;
} // Else ignore, don't keep it on the window, wait for the right react load
