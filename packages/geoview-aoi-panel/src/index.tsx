import React from 'react'; // GV This import is to validate that we're on the right React at the end of the file
import { AppBarPlugin } from 'geoview-core/api/plugin/appbar-plugin';
import { AoiIcon } from 'geoview-core/ui/icons';
import type { IconButtonPropsExtend } from 'geoview-core/ui/icon-button/icon-button';
import type { TypePanelProps } from 'geoview-core/ui/panel/panel-types';
import type { TypeAoiProps } from './aoi-panel';
import { AoiPanel } from './aoi-panel';
import schema from '../schema.json';
import defaultConfig from '../default-config-aoi-panel.json';

/**
 * Area of Interest panel plugin.
 */
class AoiPanelPlugin extends AppBarPlugin {
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
        AoiPanel: {
          title: 'Area of Interest',
        },
      },
      fr: {
        AoiPanel: {
          title: "Région d'intérêt",
        },
      },
    };
  }

  /**
   * Overrides the getConfig in order to return the right type.
   *
   * @returns The AOI config
   */
  override getConfig(): TypeAoiProps {
    // Redirect
    return super.getConfig() as TypeAoiProps;
  }

  /**
   * Overrides the onCreateButtonProps to pass the correct props.
   *
   * @returns The icon button props
   */
  override onCreateButtonProps(): IconButtonPropsExtend {
    // Button props
    return {
      id: `aoi-panel`,
      'aria-label': 'AoiPanel.title',
      tooltipPlacement: 'right',
      children: <AoiIcon />,
      visible: true,
    };
  }

  /**
   * Overrides the creation of the content properties of this AOI AppBar Plugin.
   *
   * @returns The panel properties for the AOI AppBar Plugin
   */
  override onCreateContentProps(): TypePanelProps {
    // Panel props
    return {
      title: 'AoiPanel.title',
      icon: <AoiIcon />,
      width: 30, // use as %
      status: this.getConfig().isOpen,
    };
  }

  /**
   * Overrides the content creation of the AppBar Plugin.
   *
   * @returns The AOI panel content
   */
  override onCreateContent = (): JSX.Element => {
    return <AoiPanel config={this.getConfig()} />;
  };

  /**
   * Function called when the plugin is removed, used for clean up.
   */
  override onRemoved(): void {}
}

export default AoiPanelPlugin;

// GV This if condition took over 3 days to investigate. It was giving errors on the app.geo.ca website with
// GV some conflicting reacts being loaded on the page for some obscure reason.
// Check if we're on the right react
if (React === window.cgpv.reactUtilities.react) {
  // Keep a reference to the AoiPanelPlugin Plugin as part of the geoviewPlugins property stored in the window object
  window.geoviewPlugins = window.geoviewPlugins || {};
  window.geoviewPlugins['aoi-panel'] = AoiPanelPlugin;
} // Else ignore, don't keep it on the window, wait for the right react load
