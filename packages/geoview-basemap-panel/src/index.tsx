import {
  Cast,
  AbstractPlugin,
  TypePluginOptions,
  TypeIconButtonProps,
  TypeButtonPanel,
  TypeWindow,
  toJsonObject,
  TypePanelProps,
  TypeJsonObject,
  AnySchemaObject,
} from 'geoview-core';

import { BasemapPanel } from './basemap-panel';
import schema from '../schema.json';
import defaultConfig from '../default-config-basemap-panel.json';

const w = window as TypeWindow;

/**
 * Create a class for the plugin instance
 */
class BasemapPanelPlugin extends AbstractPlugin {
  // store the created button panel object
  buttonPanel: TypeButtonPanel | null;

  constructor(pluginId: string, props: TypePluginOptions) {
    super(pluginId, props);
    this.buttonPanel = null;
  }

  /**
   * Return the package schema
   *
   * @returns {AnySchemaObject} the package schema
   */
  schema = (): AnySchemaObject => schema;

  /**
   * Return the default config for this package
   *
   * @returns {TypeJsonObject} the default config
   */
  defaultConfig = (): TypeJsonObject => toJsonObject(defaultConfig);

  /**
   * translations object to inject to the viewer translations
   */
  translations = toJsonObject({
    en: {
      basemapPanel: {
        title: 'Basemaps',
        info: {
          transport: {
            name: 'Transport',
            description: `The Canada Base Map - Transportation (CBMT). This web mapping service provides spatial reference context with an emphasis on transportation networks. 
                          It is designed especially for use as a background map in a web mapping application or geographic information system (GIS).`,
          },
          simple: {
            name: 'Simple',
          },
          shaded: {
            name: 'Shaded relief',
            description: `The Canada Base Map - Elevation (CBME) web mapping services of the Earth Sciences Sector at Natural Resources Canada, 
                          is intended primarily for online mapping application users and developers`,
          },
          osm: {
            name: 'Open Street Maps',
          },
          nogeom: {
            name: 'No geometry',
          },
          label: {
            name: 'with labels',
          },
        },
      },
    },
    fr: {
      basemapPanel: {
        title: 'Fond de carte',
        info: {
          transport: {
            name: 'Transport',
            description: `Carte de base du Canada - Transport (CBCT). Ce service de cartographie Web offre un contexte de référence spatiale axé sur les réseaux de transport. 
                          Il est particulièrement conçu pour être utilisé comme fond de carte dans une application cartographique Web ou un système d'information géographique (SIG).`,
          },
          simple: {
            name: 'Simple',
          },
          shaded: {
            name: 'Relief ombré',
            description: `Les services de cartographie Web de la carte de base du Canada - élévation (CBCE) du Secteur des sciences de la 
                          Terre de Ressources naturelles Canada sont destinés principalement aux utilisateurs et aux développeurs d'applications de cartographie en ligne.`,
          },
          osm: {
            name: 'Carte - Open Street Maps',
          },
          nogeom: {
            name: 'Pas de géométrie',
          },
          label: {
            name: 'avec étiquettes',
          },
        },
      },
    },
  });

  /**
   * Added function called after the plugin has been initialized
   */
  added = (): void => {
    const { configObj, pluginProps } = this as AbstractPlugin;

    const { mapId } = pluginProps;

    // access the cgpv object from the window object
    const { cgpv } = w;

    if (cgpv) {
      // access the api calls
      const { api, ui } = cgpv;
      const { MapIcon } = ui.elements;

      // button props
      const button: TypeIconButtonProps = {
        id: 'basemapPanelButton',
        tooltip: 'basemapPanel.title',
        tooltipPlacement: 'right',
        children: <MapIcon />,
        visible: true,
      };

      // panel props
      const panel: TypePanelProps = {
        title: 'basemapPanel.title',
        icon: <MapIcon />,
        width: 350,
        status: configObj?.isOpen as boolean,
      };

      // create a new button panel on the app-bar
      this.buttonPanel = api.maps[mapId].appBarButtons.createAppbarPanel(button, panel, null);
      // set panel content
      this.buttonPanel?.panel?.changeContent(<BasemapPanel mapId={mapId} config={configObj || {}} />);
    }
  };

  /**
   * Function called when the plugin is removed, used for clean up
   */
  removed(): void {
    const { mapId } = (this as AbstractPlugin).pluginProps;

    // access the cgpv object from the window object
    const { cgpv } = w;

    if (cgpv) {
      // access the api calls
      const { api } = cgpv;

      if (this.buttonPanel) {
        api.maps[mapId].appBarButtons.removeAppbarPanel(this.buttonPanel.buttonPanelId);

        // reset basemaps array
        api.maps[mapId].basemap.basemaps = [];
        // reload default basemap
        api.maps[mapId].basemap.loadDefaultBasemaps();
      }
    }
  }
}

export default BasemapPanelPlugin;

w.plugins = w.plugins || {};
w.plugins['basemap-panel'] = Cast<AbstractPlugin>(BasemapPanelPlugin);
