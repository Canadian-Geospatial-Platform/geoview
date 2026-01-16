import React from 'react'; // GV This import is to validate that we're on the right React at the end of the file
import { AppBarPlugin } from 'geoview-core/api/plugin/appbar-plugin';
import { LegendIcon } from 'geoview-core/ui/icons';
import type { IconButtonPropsExtend } from 'geoview-core/ui/icon-button/icon-button';
import type { TypePanelProps } from 'geoview-core/ui/panel/panel-types';
import type { TypeLegendProps } from './custom-legend';
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
   * @returns {unknown} the package schema
   */
  override schema(): unknown {
    return schema;
  }

  /**
   * Return the default config for this package
   *
   * @returns {unknown} the default config
   */
  override defaultConfig(): unknown {
    return defaultConfig;
  }

  /**
   * Overrides the default translations for the Plugin.
   * @returns {Record<string, unknown>} - The translations object for the particular Plugin.
   */
  override defaultTranslations(): Record<string, unknown> {
    return {
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
    };
  }

  override getConfig(): TypeLegendProps {
    const config = super.getConfig() as TypeLegendProps;
    return {
      ...config,
      isOpen: config.isOpen ?? false,
    };
  }

  override onCreateButtonProps(): IconButtonPropsExtend {
    // Button props
    return {
      id: `custom-legend`,
      tooltipPlacement: 'right',
      'aria-label': 'CustomLegend.title',
      children: <LegendIcon />,
      visible: true,
    };
  }

  override onCreateContentProps(): TypePanelProps {
    // Panel props
    return {
      title: 'CustomLegend.title',
      icon: <LegendIcon />,
      width: 15,
      status: this.getConfig().isOpen,
    };
  }

  override onCreateContent = (): JSX.Element => {
    return <CustomLegendPanel config={this.getConfig()} />;
  };

  /**
   * Function called when the plugin is removed, used for clean up
   */
  override onRemoved(): void {}
}

export default CustomLegendPanelPlugin;

// GV This if condition took over 3 days to investigate. It was giving errors on the app.geo.ca website with
// GV some conflicting reacts being loaded on the page for some obscure reason.
// Check if we're on the right react
if (React === window.cgpv.reactUtilities.react) {
  // Keep a reference to the Custom Legend Panel Plugin as part of the geoviewPlugins property stored in the window object
  window.geoviewPlugins = window.geoviewPlugins || {};
  window.geoviewPlugins['custom-legend'] = CustomLegendPanelPlugin;
} // Else ignore, don't keep it on the window, wait for the right react load
