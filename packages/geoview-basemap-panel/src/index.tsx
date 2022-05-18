import {
  Cast,
  AbstractPluginClass,
  TypePluginOptions,
  TypeButtonProps,
  TypeButtonPanel,
  TypeWindow,
  toJsonObject,
  TypePanelProps,
  TypeSchemaObject,
  TypeJsonObject,
} from 'geoview-core';
import { BasemapPanel } from './basemap-panel';

import schema from '../schema.json';
import defaultConfig from '../default-config-basemap-panel.json';

const w = window as TypeWindow;

/**
 * Create a class for the plugin instance
 */
class BasemapPanelPlugin extends AbstractPluginClass {
  // store the created button panel object
  buttonPanel: TypeButtonPanel | null;

  constructor(id: string, props: TypePluginOptions) {
    super(id, props);
    this.buttonPanel = null;
  }

  /**
   * Return the package schema
   *
   * @returns {TypeSchemaObject} the package schema
   */
  schema = (): TypeSchemaObject => schema;

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
    'en-CA': {
      basemapPanel: 'Basemaps',
    },
    'fr-CA': {
      basemapPanel: 'Fond de carte',
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

    if (cgpv) {
      // access the api calls
      const { api } = cgpv;

      const { language } = api.map(mapId);

      // button props
      const button: TypeButtonProps = {
        tooltip: this.translations[language].basemapPanel as string,
        tooltipPlacement: 'right',
        icon: '<i class="material-icons">map</i>',
        type: 'textWithIcon',
      };

      // panel props
      const panel: TypePanelProps = {
        title: this.translations[language].basemapPanel,
        icon: '<i class="material-icons">map</i>',
        width: 200,
        status: configObj?.isOpen as boolean,
      };

      // create a new button panel on the appbar
      this.buttonPanel = api.map(mapId).appBarButtons.createAppbarPanel(button, panel, null);

      // set panel content
      this.buttonPanel?.panel?.changeContent(<BasemapPanel mapId={mapId} />);
    }
  };

  /**
   * Function called when the plugin is removed, used for clean up
   */
  removed(): void {
    const { mapId } = this.pluginProps;

    // access the cgpv object from the window object
    const { cgpv } = w;

    if (cgpv) {
      // access the api calls
      const { api } = cgpv;

      if (this.buttonPanel) {
        api.map(mapId).appBarButtons.removeAppbarPanel(this.buttonPanel.id);
      }
    }
  }
}

export default BasemapPanelPlugin;

w.plugins = w.plugins || {};
w.plugins['basemap-panel'] = Cast<AbstractPluginClass>(BasemapPanelPlugin);
