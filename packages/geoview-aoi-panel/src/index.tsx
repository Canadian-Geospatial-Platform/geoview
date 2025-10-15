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
 * Create a class for the plugin instance
 */
class AoiPanelPlugin extends AppBarPlugin {
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
   * @returns {TypeAoiProps} The AOI Propos
   */
  override getConfig(): TypeAoiProps {
    // Redirect
    return super.getConfig() as TypeAoiProps;
  }

  override onCreateButtonProps(): IconButtonPropsExtend {
    // Button props
    return {
      id: `aoi-panel`,
      tooltip: 'AoiPanel.title',
      tooltipPlacement: 'right',
      children: <AoiIcon />,
      visible: true,
    };
  }

  override onCreateContentProps(): TypePanelProps {
    // Panel props
    return {
      title: 'AoiPanel.title',
      icon: <AoiIcon />,
      width: 350,
      status: this.getConfig().isOpen,
    };
  }

  override onCreateContent = (): JSX.Element => {
    return <AoiPanel mapId={this.mapViewer.mapId} config={this.getConfig()} />;
  };

  /**
   * Function called when the plugin is removed, used for clean up
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
