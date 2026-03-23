import React from 'react'; // GV This import is to validate that we're on the right React at the end of the file
import { AppBarPlugin } from 'geoview-core/api/plugin/appbar-plugin';
import type { IconButtonPropsExtend } from 'geoview-core/ui/icon-button/icon-button';
import type { TypePanelProps } from 'geoview-core/ui/panel/panel-types';
import { PublicIcon } from 'geoview-core/ui';

import { AboutPanel } from './about-panel';
import schema from '../schema.json';
import defaultConfig from '../default-config-about-panel.json';
import type { TypeAboutPanelConfig } from './about-panel-types';

/**
 * About panel plugin.
 */
class AboutPanelPlugin extends AppBarPlugin {
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
        AboutPanel: {
          title: 'About',
          failed: 'Failed to load content: ',
          loading: 'Loading...',
        },
      },
      fr: {
        AboutPanel: {
          title: 'À propos',
          failed: 'Impossible de charger le contenu: ',
          loading: 'Chargement...',
        },
      },
    };
  }

  /**
   * Overrides the getConfig in order to return the right type.
   *
   * @returns The About Panel config
   */
  override getConfig(): TypeAboutPanelConfig {
    // Redirect
    return super.getConfig() as TypeAboutPanelConfig;
  }

  /**
   * Gets the correct icon (default or configured) for the AppBar.
   *
   * @returns The icon to be used in the app bar
   */
  getIcon(): JSX.Element {
    const config = this.getConfig();

    // Use custom icon if iconPath is provided, otherwise use default PublicIcon
    return config.iconPath ? <img src={config.iconPath} alt="About" style={{ width: '24px', height: '24px' }} /> : <PublicIcon />;
  }

  /**
   * Overrides the onCreateButtonProps to pass the correct props.
   *
   * @returns The icon button props
   */
  override onCreateButtonProps(): IconButtonPropsExtend {
    // Button props
    return {
      id: `about-panel`,
      'aria-label': this.getConfig().aboutTitle || 'AboutPanel.title',
      tooltipPlacement: 'right',
      children: this.getIcon(),
      visible: true,
    };
  }

  /**
   * Overrides the creation of the content properties of this AboutPanel AppBar Plugin.
   *
   * @returns The panel properties for the AboutPanel AppBar Plugin
   */
  override onCreateContentProps(): TypePanelProps {
    return {
      title: this.getConfig().aboutTitle || 'AboutPanel.title',
      icon: this.getIcon(),
      width: 30,
      status: this.getConfig().isOpen,
    };
  }

  /**
   * Overrides the content creation of the AppBar Plugin.
   *
   * @returns The about panel content
   */
  override onCreateContent = (): JSX.Element => {
    return <AboutPanel config={this.getConfig()} />;
  };
}

export default AboutPanelPlugin;

// GV This if condition took over 3 days to investigate. It was giving errors on the app.geo.ca website with
// GV some conflicting reacts being loaded on the page for some obscure reason.
// Check if we're on the right react
if (React === window.cgpv.reactUtilities.react) {
  // Keep a reference to the AboutPanel AppBar Plugin as part of the geoviewPlugins property stored in the window object
  window.geoviewPlugins = window.geoviewPlugins || {};
  window.geoviewPlugins['about-panel'] = AboutPanelPlugin;
} // Else ignore, don't keep it on the window, wait for the right react load
