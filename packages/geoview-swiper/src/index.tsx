import { Cast, toJsonObject, TypeJsonObject, AnySchemaObject } from 'geoview-core';
import { MapPlugin } from 'geoview-core/src/api/plugin/map-plugin';
import { SwiperEventProcessor } from 'geoview-core/src/api/event-processors/event-processor-children/swiper-event-processor';
import { logger } from 'geoview-core/src/core/utils/logger';

import schema from '../schema.json';
import defaultConfig from '../default-config-swiper.json';
import { Swiper } from './swiper';

/**
 * Create a class for the plugin instance
 */
class SwiperPlugin extends MapPlugin {
  /**
   * Returns the package schema
   *
   * @returns {AnySchemaObject} the package schema
   */
  schema = (): AnySchemaObject => schema;

  /**
   * Returns the default config for this package
   *
   * @returns {TypeJsonObject} the default config
   */
  defaultConfig = (): TypeJsonObject => toJsonObject(defaultConfig);

  /**
   * Translations object to inject to the viewer translations
   */
  translations = toJsonObject({
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
  });

  /**
   * Overrides the addition of the Swiper Map Plugin to make sure to set the layer paths from the config into the store.
   */
  onAdd(): void {
    // Initialize the store with swiper provided configuration
    SwiperEventProcessor.setLayerPaths(this.pluginProps.mapId, this.configObj.layers);

    // Call parent
    super.onAdd();
  }

  /**
   * Overrides the creation of the content of this Swiper Map Plugin.
   * @returns {JSX.Element} The JSX.Element representing the Swiper Plugin
   */
  onCreateContent(): JSX.Element {
    return <Swiper mapId={this.pluginProps.mapId} config={this.configObj} />;
  }

  /**
   * Activates the swiper for the layer indicated by the given layer path.
   * @param {string} layerPath The layer path to activate swiper functionality
   */
  activateForLayer = (layerPath: string) => {
    try {
      // Check if the layer exists on the map
      this.map().layer.getOLLayerByLayerPath(layerPath);

      // Add the layer path
      SwiperEventProcessor.addLayerPath(this.pluginProps.mapId, layerPath);
    } catch (error) {
      // Log
      logger.logError(error);
    }
  };

  /**
   * Deactivates the swiper for the layer indicated by the given layer path.
   * @param {string} layerPath The layer path to deactivate swiper functionality
   */
  deActivateForLayer = (layerPath: string) => {
    // Remove the layer
    SwiperEventProcessor.removeLayerPath(this.pluginProps.mapId, layerPath);
  };

  /**
   * Deactivates the swiper for the layer indicated by the given layer path.
   */
  deActivateAll = () => {
    // Remove all layers
    SwiperEventProcessor.removeAll(this.pluginProps.mapId);
  };
}

export default SwiperPlugin;

// Keep a reference to the Swiper Plugin as part of the geoviewPlugins property stored in the window object
window.geoviewPlugins = window.geoviewPlugins || {};
window.geoviewPlugins.swiper = Cast<SwiperPlugin>(SwiperPlugin);
