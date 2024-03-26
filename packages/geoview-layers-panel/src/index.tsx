import { TypeJsonObject, toJsonObject } from 'geoview-core/src/core/types/global-types';
import { Cast } from 'geoview-core/src/core/types/global-types';
import { AnySchemaObject } from 'geoview-core/src/core/types/global-types';
import { TypeIconButtonProps } from 'geoview-core/src/ui/icon-button/icon-button-types';
import { AppBarPlugin } from 'geoview-core/src/api/plugin/appbar-plugin';
import { LayersOutlinedIcon } from 'geoview-core/src/ui';
import { TypePanelProps } from 'geoview-core/src/ui/panel/panel-types';
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

// Keep a reference to the Layers Panel Plugin as part of the geoviewPlugins property stored in the window object
window.geoviewPlugins = window.geoviewPlugins || {};
window.geoviewPlugins['layers-panel'] = Cast<LayersPanelPlugin>(LayersPanelPlugin);
