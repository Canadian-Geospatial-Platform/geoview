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
      layersPanel: { title: 'Layers' },
    },
    fr: {
      layersPanel: { title: 'Couches' },
    },
  });

  onCreateButtonProps(): TypeIconButtonProps {
    // Fetch cgpv
    const { cgpv } = window as TypeWindow;
    const { LayersOutlinedIcon } = cgpv.ui.elements;

    // Button props
    return {
      id: 'layersPanelButton',
      tooltip: 'layersPanel.title',
      tooltipPlacement: 'right',
      children: <LayersOutlinedIcon />,
      visible: true,
    };
  }

  onCreateContentProps(): TypePanelProps {
    // Fetch cgpv
    const { cgpv } = window as TypeWindow;
    const { LayersOutlinedIcon } = cgpv.ui.elements;

    // Panel props
    return {
      title: 'layersPanel.title',
      icon: <LayersOutlinedIcon />,
      width: 350,
      status: this.configObj?.isOpen?.large as boolean,
    };
  }

  onCreateContent(): JSX.Element {
    return <PanelContent buttonPanel={this.buttonPanel} mapId={this.pluginProps.mapId} />;
  }
}

export default LayersPanelPlugin;

window.plugins = window.plugins || {};
window.plugins['layers-panel'] = Cast<LayersPanelPlugin>(LayersPanelPlugin);
