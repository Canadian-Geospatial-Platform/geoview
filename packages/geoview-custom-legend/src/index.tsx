import { JSX } from 'react';
import { TypeJsonObject, toJsonObject, AnySchemaObject, Cast } from 'geoview-core/src/core/types/global-types';
import { AppBarPlugin } from 'geoview-core/src/api/plugin/appbar-plugin';
import { TypeIconButtonProps } from 'geoview-core/src/ui/icon-button/icon-button-types';
import { TypePanelProps } from 'geoview-core/src/ui/panel/panel-types';
import { CustomLegendIcon } from 'geoview-core/src/ui/icons/index';
import { LegendPanel } from './custom-legend';

/**
 * Create a plugin to show a custom legend panel
 */
class LegendPanelPlugin extends AppBarPlugin {
  button = true;

  panel = true;

  /**
   * Plugin schema
   */
  schema(): AnySchemaObject {
    return {
      type: 'object',
      properties: {
        enabled: {
          type: 'boolean',
        },
        isOpen: {
          type: 'boolean',
        },
      },
    };
  }

  /**
   * Default configuration
   */
  defaultConfig(): TypeJsonObject {
    return toJsonObject({
      enabled: true,
      isOpen: false,
    });
  }

  /**
   * Translation strings
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

  /**
   * Return button props
   */
  override onCreateButtonProps(): TypeIconButtonProps {
    return {
      id: 'custom-legend',
      tooltip: 'LegendPanel.title',
      tooltipPlacement: 'right',
      children: <CustomLegendIcon />,
      visible: true,
    };
  }

  /**
   * Return panel props
   */
  override onCreateContentProps(): TypePanelProps {
    return {
      title: 'LegendPanel.title',
      icon: <CustomLegendIcon />,
      width: 350,
      status: this.configObj?.isOpen as boolean,
    };
  }

  /**
   * Return panel content
   */
  override onCreateContent = (): JSX.Element => {
    return <LegendPanel mapId={this.api} />;
  };
}

// Register the plugin
window.geoviewPlugins = window.geoviewPlugins || {};
window.geoviewPlugins['custom-legend'] = Cast<LegendPanelPlugin>(LegendPanelPlugin);

export default LegendPanelPlugin;
