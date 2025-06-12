import { TypeJsonObject, toJsonObject, AnySchemaObject } from 'geoview-core/src/api/config/types/config-types';
import { AppBarPlugin } from 'geoview-core/src/api/plugin/appbar-plugin';
import { LegendIcon } from 'geoview-core/src/ui/icons';
import { IconButtonPropsExtend } from 'geoview-core/src/ui/icon-button/icon-button';
import { TypePanelProps } from 'geoview-core/src/ui/panel/panel-types';
import { CustomLegendPanel } from './custom-legend';
import schema from '../schema.json';
import defaultConfig from '../default-config-custom-legend.json';

/**
 * Create a class for the plugin instance
 */
class CustomLegendPanelPlugin extends AppBarPlugin {
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
      CustomLegend: {
        title: 'Custom Legend',
      },
    },
    fr: {
      CustomLegend: {
        title: 'Légende personnalisée',
      },
    },
  });

  override onCreateButtonProps(): IconButtonPropsExtend {
    // Button props
    return {
      id: `custom-legend`,
      tooltip: 'CustomLegend.title',
      tooltipPlacement: 'right',
      children: <LegendIcon />,
      visible: true,
    };
  }

  override onCreateContentProps(): TypePanelProps {
    // Panel props
    return {
      title: 'CustomLegend.title',
      icon: <LegendIcon />,
      width: 350,
      status: this.configObj?.isOpen as boolean,
    };
  }

  override onCreateContent = (): JSX.Element => {
    return <CustomLegendPanel config={this.configObj || {}} />;
  };

  /**
   * Function called when the plugin is removed, used for clean up
   */
  override onRemoved(): void {}
}

export default CustomLegendPanelPlugin;

// Keep a reference to the Custom Legend Panel Plugin as part of the geoviewPlugins property stored in the window object
window.geoviewPlugins = window.geoviewPlugins || {};
window.geoviewPlugins['custom-legend'] = CustomLegendPanelPlugin;
