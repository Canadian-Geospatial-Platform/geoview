import React from 'react'; // GV This import is to validate that we're on the right React at the end of the file
import { AppBarPlugin } from 'geoview-core/api/plugin/appbar-plugin';
import type { IconButtonPropsExtend } from 'geoview-core/ui/icon-button/icon-button';
import type { TypePanelProps } from 'geoview-core/ui/panel/panel-types';
import { PublicIcon } from 'geoview-core/ui';

import { GeoView3DPanel } from './geoview-3d-panel';
import type { TypeGeoView3DConfig } from './geoview-3d-types';
import schema from '../schema.json';
import defaultConfig from '../default-config-geoview-3d.json';

/**
 * GeoView 3D Tiles (deck.gl) plugin.
 */
class GeoView3DPlugin extends AppBarPlugin {
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
        GeoView3D: {
          title: '3D',
          placeholder: '3D Tiles viewer (deck.gl) — rendering added in Phase 2.',
        },
      },
      fr: {
        GeoView3D: {
          title: '3D',
          placeholder: 'Visionneuse 3D Tiles (deck.gl) — rendu ajouté à la phase 2.',
        },
      },
    };
  }

  /**
   * Overrides the getConfig in order to return the right type.
   *
   * @returns The GeoView 3D config
   */
  override getConfig(): TypeGeoView3DConfig {
    // Redirect
    return super.getConfig() as TypeGeoView3DConfig;
  }

  /**
   * Overrides the onCreateButtonProps to pass the correct props.
   *
   * @returns The icon button props
   */
  override onCreateButtonProps(): IconButtonPropsExtend {
    // Button props
    return {
      id: 'tiles-3d',
      'aria-label': 'GeoView3D.title',
      tooltipPlacement: 'right',
      children: <PublicIcon />,
      visible: true,
    };
  }

  /**
   * Overrides the creation of the content properties of this 3D AppBar Plugin.
   *
   * @returns The panel properties for the 3D AppBar Plugin
   */
  override onCreateContentProps(): TypePanelProps {
    // Panel props
    return {
      title: 'GeoView3D.title',
      icon: <PublicIcon />,
      width: 30, // use as %
      status: this.getConfig().isOpen,
    };
  }

  /**
   * Overrides the content creation of the AppBar Plugin.
   *
   * @returns The 3D panel content
   */
  override onCreateContent = (): JSX.Element => {
    return <GeoView3DPanel config={this.getConfig()} />;
  };

  /**
   * Function called when the plugin is removed, used for clean up.
   */
  override onRemoved(): void {}
}

export default GeoView3DPlugin;

// GV This if condition took over 3 days to investigate. It was giving errors on the app.geo.ca website with
// GV some conflicting reacts being loaded on the page for some obscure reason.
// Check if we're on the right react
if (React === window.cgpv.reactUtilities.react) {
  // Keep a reference to the GeoView3DPlugin as part of the geoviewPlugins property stored in the window object
  window.geoviewPlugins = window.geoviewPlugins || {};
  window.geoviewPlugins['tiles-3d'] = GeoView3DPlugin;
} // Else ignore, don't keep it on the window, wait for the right react load
