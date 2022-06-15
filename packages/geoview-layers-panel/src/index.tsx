/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import {
  Cast,
  AbstractPluginClass,
  toJsonObject,
  TypeJsonObject,
  TypeWindow,
  TypePluginOptions,
  TypeButtonPanel,
  TypeIconButtonProps,
  TypePanelProps,
  TypeSchemaObject,
} from 'geoview-core';
import PanelContent from './panel-content';
import schema from '../schema.json';
import defaultConfig from '../default-config-layers-panel.json';

const w = window as TypeWindow;

/**
 * Create a class for the plugin instance
 */
class LayersPanelPlugin extends AbstractPluginClass {
  // store the created button panel object
  buttonPanel: TypeButtonPanel | null;

  constructor(id: string, props: TypePluginOptions) {
    super(id, props);
    this.buttonPanel = null;
  }

  /**
   * Return the schema that is defined for this package
   *
   * @returns {TypeSchemaObject} returns the schema for this package
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
  translations: TypeJsonObject = toJsonObject({
    'en-CA': {
      layersPanel: 'Layers',
    },
    'fr-CA': {
      layersPanel: 'Couches',
    },
  });

  /**
   * Added function called after the plugin has been initialized
   */
  added = (): void => {
    const { mapId } = this.pluginProps;

    // access the cgpv object from the window object
    const { cgpv } = w;

    // access the api calls
    const { api, ui } = cgpv;
    const { LayersOutlinedIcon } = ui.elements;
    const { language } = api.map(mapId);

    let panelStatus = false;

    panelStatus = this.configObj?.isOpen?.large as boolean;

    // button props
    const button: TypeIconButtonProps = {
      id: 'layersPanelButton',
      tooltip: this.translations[language].layersPanel as string,
      tooltipPlacement: 'right',
      children: <LayersOutlinedIcon />,
      visible: true,
    };

    // panel props
    const panel: TypePanelProps = {
      title: this.translations[language].layersPanel,
      icon: '<i class="material-icons">layers</i>',
      width: 200,
      status: panelStatus,
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
    const { mapId } = this.pluginProps;

    // access the cgpv object from the window object
    const { cgpv } = w;

    // access the api calls
    const { api } = cgpv;

    if (this.buttonPanel) {
      api.map(mapId).appBarButtons.removeAppbarPanel(this.buttonPanel.id);
    }
  }
}

export default LayersPanelPlugin;

w.plugins = w.plugins || {};
w.plugins['layers-panel'] = Cast<AbstractPluginClass>(LayersPanelPlugin);
