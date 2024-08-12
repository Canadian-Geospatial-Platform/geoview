import { TypeJsonObject, toJsonObject, AnySchemaObject, Cast } from 'geoview-core/';
import { AppBarPlugin } from 'geoview-core/src/api/plugin/appbar-plugin';
import { CustomLegendIcon } from 'geoview-core/src/ui/icons';
import { TypeIconButtonProps } from 'geoview-core/src/ui/icon-button/icon-button-types';
import { TypePanelProps } from 'geoview-core/src/ui/panel/panel-types';
import { LegendPanel } from './custom-legend-panel';
import schema from '../schema.json';
import defaultConfig from '../default-config-legend-panel.json';

/**
 * Create a class for the plugin instance
 */
class LegendPanelPlugin extends AppBarPlugin {
  /**
   * Return the package schema
   *
   * @returns {AnySchemaObject} the package schema
   */
  override schema(): AnySchemaObject {
    return schema;
  }

  /**
   * Return the default config for this package
   *
   * @returns {TypeJsonObject} the default config
   */
  override defaultConfig(): TypeJsonObject {
    return toJsonObject(defaultConfig);
  }

  /**
   * translations object to inject to the viewer translations
   */
  translations = toJsonObject({
    en: {
      LegendPanel: {
        title: 'Legend',
      },
    },
    fr: {
      LegendPanel: {
        title: 'Légende',
      },
    },
  });

  override onCreateButtonProps(): TypeIconButtonProps {
    // Button props
    return {
      id: `legend-panel`,
      tooltip: 'LegendPanel.title',
      tooltipPlacement: 'right',
      children: <CustomLegendIcon />,
      visible: true,
    };
  }

  override onCreateContentProps(): TypePanelProps {
    // Panel props
    return {
      title: 'LegendPanel.title',
      icon: <CustomLegendIcon />,
      width: 350,
      status: this.configObj?.isOpen as boolean,
    };
  }

  override onCreateContent = (): JSX.Element => {
    return <LegendPanel mapId={this.pluginProps.mapId} config={this.configObj || {}} />;
  };

  /**
   * Function called when the plugin is removed, used for clean up
   */
  override onRemoved(): void {}
}

export default LegendPanelPlugin;

// Keep a reference to the Legend Panel Plugin as part of the geoviewPlugins property stored in the window object
window.geoviewPlugins = window.geoviewPlugins || {};
window.geoviewPlugins['legend-panel'] = Cast<LegendPanelPlugin>(LegendPanelPlugin);
