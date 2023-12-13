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
      tooltip: 'Drag to see underlying layer',
      menu: 'Swiper',
    },
    fr: {
      tooltip: 'Faites glisser pour voir les couches sous-jacentes',
      menu: 'Balayage',
    },
  });

  onCreateContent(): JSX.Element {
    return <Swiper mapId={this.pluginProps.mapId} config={this.configObj} translations={this.translations} />;
  }
}

export default SwiperPlugin;

window.plugins = window.plugins || {};
window.plugins.swiper = Cast<SwiperPlugin>(SwiperPlugin);
