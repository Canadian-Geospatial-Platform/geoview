import React from 'react'; // GV This import is to validate that we're on the right React at the end of the file
import { MapPlugin } from 'geoview-core/api/plugin/map-plugin';
import { SwiperEventProcessor } from 'geoview-core/api/event-processors/event-processor-children/swiper-event-processor';
import { LayerNotFoundError } from 'geoview-core/core/exceptions/layer-exceptions';
import { logger } from 'geoview-core/core/utils/logger';

import schema from '../schema.json';
import defaultConfig from '../default-config-swiper.json';
import { ConfigProps, Swiper } from './swiper';
import { SwipeOrientation } from './swiper-types';

/**
 * Create a class for the plugin instance
 */
class SwiperPlugin extends MapPlugin {
  /**
   * Returns the package schema
   *
   * @returns {unknown} the package schema
   */
  override schema(): unknown {
    return schema;
  }

  /**
   * Returns the default config for this package
   *
   * @returns {unknown} the default config
   */
  override defaultConfig(): unknown {
    return defaultConfig;
  }

  /**
   * Overrides the default translations for the Plugin.
   * @returns {Record<string, unknown>} - The translations object for the particular Plugin.
   */
  override defaultTranslations(): Record<string, unknown> {
    return {
      en: {
        swiper: {
          tooltip: 'Drag to see underlying layer',
          menu: 'Swiper',
        },
      },
      fr: {
        swiper: {
          tooltip: 'Faites glisser pour voir les couches sous-jacentes',
          menu: 'Balayage',
        },
      },
    };
  }

  /**
   * Overrides the getConfig in order to return the right type.
   * @returns {ConfigProps} The Swiper config
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
    SwiperEventProcessor.setLayerPaths(this.mapViewer.mapId, this.getConfig().layers);
    SwiperEventProcessor.setOrientation(this.mapViewer.mapId, this.getConfig().orientation as SwipeOrientation);
  }

  /**
   * Overrides the creation of the content of this Swiper Map Plugin.
   * @returns {JSX.Element} The JSX.Element representing the Swiper Plugin
   */
  override onCreateContent(): JSX.Element {
    return <Swiper viewer={this.mapViewer} config={this.getConfig()} />;
  }

  /**
   * Activates the swiper for the layer indicated by the given layer path.
   * @param {string} layerPath The layer path to activate swiper functionality
   */
  activateForLayer(layerPath: string): void {
    try {
      // Check if the layer exists on the map
      const olLayer = this.mapViewer.layer.getOLLayer(layerPath);
      if (!olLayer) throw new LayerNotFoundError(layerPath);

      // Add the layer path
      SwiperEventProcessor.addLayerPath(this.mapViewer.mapId, layerPath);
    } catch (error: unknown) {
      // Log
      logger.logError(error);
    }
  }

  /**
   * Deactivates the swiper for the layer indicated by the given layer path.
   * @param {string} layerPath The layer path to deactivate swiper functionality
   */
  deActivateForLayer(layerPath: string): void {
    // Remove the layer
    SwiperEventProcessor.removeLayerPath(this.mapViewer.mapId, layerPath);
  }

  /**
   * Deactivates the swiper for the layer indicated by the given layer path.
   */
  deActivateAll(): void {
    // Remove all layers
    SwiperEventProcessor.removeAll(this.mapViewer.mapId);
  }

  /**
   * Sets the orientation of the swiper.
   * @param {SwipeOrientation} orientation The orientation to set
   */
  setOrientation(orientation: SwipeOrientation): void {
    // Set the orientation
    SwiperEventProcessor.setOrientation(this.mapViewer.mapId, orientation);
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
