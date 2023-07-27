import { Cast, AbstractPlugin, TypePluginOptions, TypeWindow, toJsonObject, TypeJsonObject, AnySchemaObject } from 'geoview-core';

import schema from '../schema.json';
import defaultConfig from '../default-config-swiper.json';
import { Swiper } from './swiper';

const w = window as TypeWindow;

/**
 * Create a class for the plugin instance
 */
class SwiperPlugin extends AbstractPlugin {
  // eslint-disable-next-line no-useless-constructor
  constructor(pluginId: string, props: TypePluginOptions) {
    super(pluginId, props);
  }

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

  /**
   * Added function called after the plugin has been initialized
   */
  added = (): void => {
    const { configObj, pluginProps } = this;

    const { mapId } = pluginProps;

    // access the cgpv object from the window object
    const { cgpv } = w;
    const { react, createRoot } = cgpv;
    const { createElement } = react;

    // if there is layers in the array, initialize the swiper
    if (cgpv && (configObj?.layers as string[]).length > 0) {
      // create the swiper container and insert it after top link
      const el = document.createElement('div');
      el.setAttribute('id', `${mapId}-swiper`);
      document.getElementById(`toplink-${mapId}`)?.after(el);

      // create the swiper component and render
      const node = createElement(Swiper, { mapId, config: configObj!, translations: this.translations });
      const root = createRoot(document.getElementById(`${mapId}-swiper`)!);
      root.render(node);
    }
  };

  /**
   * Function called when the plugin is removed, used for clean up
   */
  removed(): void {
    // const { mapId } = this.pluginProps;

    // access the cgpv object from the window object
    const { cgpv } = w;

    if (cgpv) {
      // TODO: Enable swiper removal, make it work with React 18+ new root and unmount
      // cgpv.reactDOM.unmountComponentAtNode(document.getElementById(`${mapId}-swiper`)! as Element);
    }
  }
}

export default SwiperPlugin;

w.plugins = w.plugins || {};
w.plugins.swiper = Cast<AbstractPlugin>(SwiperPlugin);
