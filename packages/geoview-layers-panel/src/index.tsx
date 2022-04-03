/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
<<<<<<< HEAD
import PanelContent from './panel-content';

import { TypeButtonPanel, TypeProps, TypeButtonProps, TypePanelProps } from 'geoview-core';

const w = window as any;
=======
import { TypeButtonPanel, TypeProps, TypeButtonProps, TypePanelProps, TypeWindow } from 'geoview-core';
import PanelContent from './panel-content';

const w = window as TypeWindow;
>>>>>>> 2494732ad4a7a2c68e059d9d1877b2d59d665d4d

/**
 * Create a class for the plugin instance
 */
class LayersPanelPlugin {
  // id of the plugin
  id: string;

  // plugin properties
  LayersPanelPluginProps: TypeProps;

  // store the created button panel object
  buttonPanel: TypeButtonPanel | null;

  constructor(id: string, props: TypeProps) {
    this.id = id;
    this.LayersPanelPluginProps = props;
    this.buttonPanel = null;
  }

  /**
   * translations object to inject to the viewer translations
   */
<<<<<<< HEAD
  translations: TypeProps<TypeProps<any>> = {
=======
  translations: TypeProps<TypeProps<string>> = {
>>>>>>> 2494732ad4a7a2c68e059d9d1877b2d59d665d4d
    'en-CA': {
      layersPanel: 'Layers',
    },
    'fr-CA': {
      layersPanel: 'Couches',
    },
  };

  /**
   * Added function called after the plugin has been initialized
   */
  added = (): void => {
    const { mapId } = this.LayersPanelPluginProps;

    // access the cgpv object from the window object
<<<<<<< HEAD
    const cgpv = w['cgpv'];
=======
    const { cgpv } = w;
>>>>>>> 2494732ad4a7a2c68e059d9d1877b2d59d665d4d

    // access the api calls
    const { api } = cgpv;

    const { language } = api.map(mapId);

    // button props
    const button: TypeButtonProps = {
      id: 'layersPanelButton',
      tooltip: this.translations[language].layersPanel,
      tooltipPlacement: 'right',
      icon: '<i class="material-icons">layers</i>',
      type: 'textWithIcon',
    };

    // panel props
    const panel: TypePanelProps = {
      title: this.translations[language].layersPanel,
      icon: '<i class="material-icons">layers</i>',
      width: 200,
    };

    // create a new button panel on the appbar
    this.buttonPanel = api.map(mapId).appBarButtons.createAppbarPanel(button, panel, null);

    // set panel content
    this.buttonPanel?.panel?.changeContent(<PanelContent buttonPanel={this.buttonPanel} mapId={mapId} />);
  };

  /**
   * Function called when the plugin is removed, used for clean up
   */
  removed(): void {
    const { mapId } = this.LayersPanelPluginProps;

    // access the cgpv object from the window object
<<<<<<< HEAD
    const cgpv = w['cgpv'];
=======
    const { cgpv } = w;
>>>>>>> 2494732ad4a7a2c68e059d9d1877b2d59d665d4d

    // access the api calls
    const { api } = cgpv;

    if (this.buttonPanel) {
      api.map(mapId).appBarButtons.removeAppbarPanel(this.buttonPanel.id);
    }
  }
}

export default LayersPanelPlugin;

<<<<<<< HEAD
w['plugins'] = w['plugins'] || {};
w['plugins']['layersPanel'] = LayersPanelPlugin;
=======
w.plugins = w.plugins || {};
w.plugins.layersPanel = LayersPanelPlugin;
>>>>>>> 2494732ad4a7a2c68e059d9d1877b2d59d665d4d
