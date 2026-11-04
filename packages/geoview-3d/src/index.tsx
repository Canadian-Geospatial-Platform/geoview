import React from 'react'; // GV This import is to validate that we're on the right React at the end of the file
import { AppBarPlugin } from 'geoview-core/api/plugin/appbar-plugin';
import type { IconButtonPropsExtend } from 'geoview-core/ui/icon-button/icon-button';
import type { TypePanelProps } from 'geoview-core/ui/panel/panel-types';
import { PublicIcon } from 'geoview-core/ui';

import { GeoView3DPanel } from './geoview-3d-panel';
import type { TypeGeoView3DConfig } from './geoview-3d-types';
import schema from '../schema.json';
import defaultConfig from '../default-config-geoview-3d.json';

/** Plugin id: the config app-bar id, the loader's registration key and the app-bar tab (button) id. */
const TILES_3D_TAB_ID = 'tiles-3d';

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
          canvasLabel:
            '3D view of the configured 3D Tiles tileset. Use the arrow keys to pan, = and - to zoom, Shift with arrow keys to rotate and tilt.',
          canvasRole: '3D map',
          overlayHint: 'The 3D view covers the map while this panel is open. Close the panel to return to the 2D map.',
          status: {
            invalidUrl: 'No valid tileset URL is configured (set tilesetUrl to an http(s) tileset.json).',
            webglUnavailable:
              'The 3D view needs WebGL2, which this browser cannot provide. Enable hardware acceleration in the browser settings, or try another browser.',
            loading: 'Loading 3D tileset…',
            loaded: '3D tileset loaded.',
            error: 'The 3D tileset could not be displayed: {{message}}',
          },
          basemap: {
            label: 'Basemap',
            cbmt: 'Canada Base Map (blurry past street scale)',
            imagery: 'Esri World Imagery (sharp)',
            none: 'None',
            attribution: {
              cbmt: '© His Majesty the King in Right of Canada, as represented by the Minister of Natural Resources',
              imagery: 'Source: Esri, Vantor, Earthstar Geographics, and the GIS User Community',
            },
          },
        },
      },
      fr: {
        GeoView3D: {
          title: '3D',
          canvasLabel:
            'Vue 3D du jeu de tuiles 3D configuré. Utilisez les flèches pour vous déplacer, = et - pour zoomer, Maj avec les flèches pour pivoter et incliner.',
          canvasRole: 'Carte 3D',
          overlayHint: 'La vue 3D recouvre la carte tant que ce panneau est ouvert. Fermez le panneau pour revenir à la carte 2D.',
          status: {
            invalidUrl: "Aucune URL de jeu de tuiles valide n'est configurée (définir tilesetUrl vers un tileset.json http(s)).",
            webglUnavailable:
              "La vue 3D nécessite WebGL2, que ce navigateur ne peut pas fournir. Activez l'accélération matérielle dans les paramètres du navigateur ou essayez un autre navigateur.",
            loading: 'Chargement du jeu de tuiles 3D…',
            loaded: 'Jeu de tuiles 3D chargé.',
            error: "Le jeu de tuiles 3D n'a pas pu être affiché : {{message}}",
          },
          basemap: {
            label: 'Carte de base',
            cbmt: 'Carte de base du Canada (floue à l’échelle de la rue)',
            imagery: 'Imagerie mondiale Esri (nette)',
            none: 'Aucune',
            attribution: {
              cbmt: '© Sa Majesté le Roi du Chef du Canada, représentée par le ministre des Ressources naturelles',
              imagery: 'Source : Esri, Vantor, Earthstar Geographics et la communauté des utilisateurs SIG',
            },
          },
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
      id: TILES_3D_TAB_ID,
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
    return <GeoView3DPanel config={this.getConfig()} tabId={TILES_3D_TAB_ID} />;
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
  window.geoviewPlugins[TILES_3D_TAB_ID] = GeoView3DPlugin;
} // Else ignore, don't keep it on the window, wait for the right react load
