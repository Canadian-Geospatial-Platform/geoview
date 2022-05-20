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
import { BasemapSwitcher } from './basemap-switcher';

import schema from '../schema.json';
import defaultConfig from '../default-config-basemap-switcher.json';

const w = window as TypeWindow;

/**
 * Create a class for the plugin instance
 */
class BasemapSwitcherPlugin extends AbstractPluginClass {
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
      basemapSwitcher: 'Basemaps',
      'basemap-transport-label': {
        name: 'Transport with Labels',
        desc: '',
      },
      'basemap-transport': {
        name: 'Transport without labels',
        desc: '',
      },
      'basemap-shaded': {
        name: 'Shaded Relief',
        desc: '',
      },
      'basemap-shaded-label': {
        name: 'Shaded Relief with Labels',
        desc: '',
      },
      layer: {
        type: 'CBMT',
      },
    },
    'fr-CA': {
      basemapSwitcher: 'Fond de carte',
      'basemap-transport-label': {
        name: 'Transport avec des étiquettes',
        desc: '',
      },
      'basemap-transport': {
        name: 'Transport sans étiquettes',
        desc: '',
      },
      'basemap-shaded': {
        name: 'Relief ombré',
        desc: '',
      },
      'basemap-shaded-label': {
        name: 'Relief ombré avec étiquettes',
        desc: '',
      },

      layer: {
        type: 'CBCT',
      },
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
        tooltip: this.translations[language].basemapSwitcher as string,
        tooltipPlacement: 'right',
        icon: '<i class="material-icons">map</i>',
        type: 'textWithIcon',
      };

      // panel props
      const panel: TypePanelProps = {
        title: this.translations[language].basemapSwitcher,
        icon: '<i class="material-icons">map</i>',
        width: 200,
        status: configObj?.isOpen as boolean,
      };

      // create a new button panel on the appbar
      this.buttonPanel = api.map(mapId).appBarButtons.createAppbarPanel(button, panel, null);

      // set panel content
      this.buttonPanel?.panel?.changeContent(<BasemapSwitcher mapId={mapId} />);
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

export default BasemapSwitcherPlugin;

w.plugins = w.plugins || {};
w.plugins['basemap-switcher'] = Cast<AbstractPluginClass>(BasemapSwitcherPlugin);
