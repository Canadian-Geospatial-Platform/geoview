import { Cast, toJsonObject, TypeJsonObject, TypeWindow, TypeIconButtonProps, TypePanelProps, AnySchemaObject } from 'geoview-core';
import { AppBarPlugin } from 'geoview-core/src/api/plugin/appbar-plugin';
import PanelContent from './panel-content';
import schema from '../schema.json';
import defaultConfig from '../default-config-layers-panel.json';

/**
 * Create a class for the plugin instance
 */
class LayersPanelPlugin extends AppBarPlugin {
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

  onCreateButtonProps(): TypeIconButtonProps {
    // Fetch cgpv
    const { cgpv } = window as TypeWindow;
    const { ui } = cgpv;
    const { LayersOutlinedIcon } = ui.elements;

    // Button props
    return {
      id: 'layersPanelButton',
      tooltip: this.translations[this.displayLanguage()].layersPanel as string,
      tooltipPlacement: 'right',
      children: <LayersOutlinedIcon />,
      visible: true,
    };
  }

  onCreateContentProps(): TypePanelProps {
    // Panel props
    let panelStatus = false;
    panelStatus = this.configObj?.isOpen?.large as boolean;

    return {
      title: this.translations[this.displayLanguage()].layersPanel,
      icon: '<i class="material-icons">layers</i>',
      width: 350,
      status: panelStatus,
    };
  }

  onCreateContent(): JSX.Element {
    return <PanelContent buttonPanel={this.buttonPanel} mapId={this.pluginProps.mapId} />;
  }
}

export default LayersPanelPlugin;

window.plugins = window.plugins || {};
window.plugins['layers-panel'] = Cast<LayersPanelPlugin>(LayersPanelPlugin);
