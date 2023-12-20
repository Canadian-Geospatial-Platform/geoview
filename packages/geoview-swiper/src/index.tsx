import { Cast, toJsonObject, TypeJsonObject, AnySchemaObject } from 'geoview-core';
import { MapPlugin } from 'geoview-core/src/api/plugin/map-plugin';

import schema from '../schema.json';
import defaultConfig from '../default-config-swiper.json';
import { Swiper } from './swiper';

/**
 * Create a class for the plugin instance
 */
class SwiperPlugin extends MapPlugin {
  /**
   * Return the package schema
   *
   * @returns {AnySchemaObject} the package schema
   */
  schema = (): AnySchemaObject => schema;

  /**
   * Return the default config for this package
   *
   * @returns {TypeJsonObject} the default config
   */
  defaultConfig = (): TypeJsonObject => toJsonObject(defaultConfig);

  /**
   * translations object to inject to the viewer translations
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

  onCreateContent(): JSX.Element {
    return <Swiper mapId={this.pluginProps.mapId} config={this.configObj} />;
  }
}

export default SwiperPlugin;

// Keep a reference to the Swiper Plugin as part of the geoviewPlugins property stored in the window object
window.geoviewPlugins = window.geoviewPlugins || {};
window.geoviewPlugins.swiper = Cast<SwiperPlugin>(SwiperPlugin);
