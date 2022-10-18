/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import {
  Cast,
  AbstractPlugin,
  toJsonObject,
  TypeJsonObject,
  TypeWindow,
  TypePluginOptions,
  TypeButtonPanel,
  TypeIconButtonProps,
  TypePanelProps,
  AnySchemaObject,
} from 'geoview-core';
import PanelContent from './panel-content';
import schema from '../schema.json';
import defaultConfig from '../default-config-layers-panel.json';

const w = window as TypeWindow;

/**
 * Create a class for the plugin instance
 */
class LayersPanelPlugin extends AbstractPlugin {
  // store the created button panel object
  buttonPanel: TypeButtonPanel | null;

  constructor(pluginId: string, props: TypePluginOptions) {
    super(pluginId, props);
    this.buttonPanel = null;
  }

  /**
   * Return the schema that is defined for this package
   *
   * @returns {AnySchemaObject} returns the schema for this package
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
  translations: TypeJsonObject = toJsonObject({
    en: {
      layersPanel: 'Layers',
    },
    fr: {
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
    const { displayLanguage } = api.map(mapId);

    let panelStatus = false;

    panelStatus = this.configObj?.isOpen?.large as boolean;

    // button props
    const button: TypeIconButtonProps = {
      buttonPanelId: 'layersPanelButton',
      tooltip: this.translations[displayLanguage].layersPanel as string,
      tooltipPlacement: 'right',
      children: <LayersOutlinedIcon />,
      visible: true,
    };

    // panel props
    const panel: TypePanelProps = {
      title: this.translations[displayLanguage].layersPanel,
      icon: '<i class="material-icons">layers</i>',
      width: 200,
      status: panelStatus,
    };

    // create a new button panel on the app-bar
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
      api.map(mapId).appBarButtons.removeAppbarPanel(this.buttonPanel.buttonPanelId);
    }
  }
}

export default LayersPanelPlugin;

w.plugins = w.plugins || {};
w.plugins['layers-panel'] = Cast<AbstractPlugin>(LayersPanelPlugin);
