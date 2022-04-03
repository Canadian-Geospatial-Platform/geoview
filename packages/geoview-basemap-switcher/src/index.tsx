<<<<<<< HEAD
import {
  Cast,
  AbstractPluginClass,
  TypePluginOptions,
  TypeButtonProps,
  TypeButtonPanel,
  TypeWindow,
  TypeJSONObject,
  TypeJSONValue,
  TypePanelProps,
} from 'geoview-core';
=======
import { TypeButtonProps, TypeProps, TypeButtonPanel, TypeWindow } from 'geoview-core';
>>>>>>> 2494732ad4a7a2c68e059d9d1877b2d59d665d4d
import { BasemapSwitcher } from './basemap-switcher';

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
   * translations object to inject to the viewer translations
   */
<<<<<<< HEAD
  translations: TypeJSONValue = {
=======
  translations: TypeProps<TypeProps<any>> = {
>>>>>>> 2494732ad4a7a2c68e059d9d1877b2d59d665d4d
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
  };

  /**
   * Added function called after the plugin has been initialized
   */
  added = (): void => {
    const mapId: string = this.pluginOptions.mapId as TypeJSONValue as string;

    // access the cgpv object from the window object
    const { cgpv } = w;

    if (cgpv) {
      // access the api calls
      const { api } = cgpv;

      const { language } = api.map(mapId);

      // button props
      const button: TypeButtonProps = {
<<<<<<< HEAD
        tooltip: (this.translations as TypeJSONObject)[language].basemapSwitcher,
=======
        tooltip: this.translations[language].basemapSwitcher,
>>>>>>> 2494732ad4a7a2c68e059d9d1877b2d59d665d4d
        tooltipPlacement: 'right',
        icon: '<i class="material-icons">map</i>',
        type: 'textWithIcon',
      };

      // panel props
      const panel: TypePanelProps = {
        title: (this.translations as TypeJSONObject)[language].basemapSwitcher,
        icon: '<i class="material-icons">map</i>',
        width: 200,
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
    const mapId: string = this.pluginOptions.mapId as TypeJSONValue as string;

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
w.plugins.basemapSwitcher = Cast<AbstractPluginClass>(BasemapSwitcherPlugin);
