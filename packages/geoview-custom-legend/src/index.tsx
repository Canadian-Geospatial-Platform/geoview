import React from 'react'; // GV This import is to validate that we're on the right React at the end of the file
import { AppBarPlugin } from 'geoview-core/api/plugin/appbar-plugin';
import { LegendIcon } from 'geoview-core/ui/icons';
import type { IconButtonPropsExtend } from 'geoview-core/ui/icon-button/icon-button';
import type { TypePanelProps } from 'geoview-core/ui/panel/panel-types';
import type { TypeCustomLegendConfig } from './custom-legend-types';
import { CustomLegendPanel } from './custom-legend-panel';
import schema from '../schema.json';
import defaultConfig from '../default-config-custom-legend.json';

/**
 * Custom Legend panel plugin.
 */
class CustomLegendPanelPlugin extends AppBarPlugin {
  /**
   * Returns the schema that is defined for this package.
   *
   * @returns The schema for this package
   */
  override schema(): unknown {
    return schema;
  }

  /**
   * Returns the default config for this package.
   *
   * @returns The default config
   */
  override defaultConfig(): unknown {
    return defaultConfig;
  }

  /**
   * Overrides the default translations for the Plugin.
   *
   * @returns The translations object for the Plugin
   */
  override defaultTranslations(): Record<string, unknown> {
    return {
      en: {
        CustomLegend: {
          title: 'Legend',
          layer: 'layer',
          sublayers: 'sublayers',
          descriptionToggle: 'Toggle description',
          showDescription: 'Show description',
          hideDescription: 'Hide description',
        },
      },
      fr: {
        CustomLegend: {
          title: 'Légende',
          layer: 'couche',
          sublayers: 'sous-couches',
          descriptionToggle: 'Basculer la description',
          showDescription: 'Afficher la description',
          hideDescription: 'Masquer la description',
        },
      },
    };
  }

  /**
   * Overrides the getConfig in order to return the right type.
   *
   * @returns The Custom Legend config
   */
  override getConfig(): TypeCustomLegendConfig {
    // Redirect
    return super.getConfig() as TypeCustomLegendConfig;
  }

  /**
   * Overrides the onCreateButtonProps to pass the correct props.
   *
   * @returns The icon button props
   */
  override onCreateButtonProps(): IconButtonPropsExtend {
    // Button props
    return {
      id: `custom-legend`,
      tooltip: 'CustomLegend.title',
      tooltipPlacement: 'right',
      children: <LegendIcon />,
      visible: true,
      'aria-label': 'CustomLegend.title',
    };
  }

  /**
   * Overrides the creation of the content properties of this Custom Legend AppBar Plugin.
   *
   * @returns The panel properties for the Custom Legend AppBar Plugin
   */
  override onCreateContentProps(): TypePanelProps {
    // Panel props
    const config = this.getConfig();
    return {
      title: config.title ?? 'CustomLegend.title',
      icon: <LegendIcon />,
      width: 30, // use as %
      status: config.isOpen,
    };
  }

  /**
   * Overrides the content creation of the AppBar Plugin.
   *
   * @returns The custom legend panel content
   */
  override onCreateContent = (): JSX.Element => {
    return <CustomLegendPanel config={this.getConfig()} />;
  };

  /**
   * Function called when the plugin is removed, used for clean up.
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
