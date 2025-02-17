import { TypeJsonObject, toJsonObject, AnySchemaObject, Cast } from 'geoview-core/src/core/types/global-types';
import { AppBarPlugin } from 'geoview-core/src/api/plugin/appbar-plugin';
import { MapIcon } from 'geoview-core/src/ui/icons';
import { TypeIconButtonProps } from 'geoview-core/src/ui/icon-button/icon-button';
import { TypePanelProps } from 'geoview-core/src/ui/panel/panel-types';
import { BasemapPanel } from './basemap-panel';
import schema from '../schema.json';
import defaultConfig from '../default-config-basemap-panel.json';

/**
 * Create a class for the plugin instance
 */
class BasemapPanelPlugin extends AppBarPlugin {
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
          imagery: {
            name: 'Satellite Imagery',
            description: `World Imagery provides one meter or better satellite and aerial imagery in many parts of the world and lower resolution satellite imagery worldwide.`,
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
          imagery: {
            name: 'Imagerie satellite',
            description: `World Imagery fournit des images aériennes et satellitaires d'un mètre ou plus dans de nombreuses régions du monde, ainsi que des images satellitaires à plus faible résolution dans le monde entier.`,
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

  override onCreateButtonProps(): TypeIconButtonProps {
    // Button props
    return {
      id: `basemap-panel`,
      tooltip: 'basemapPanel.title',
      tooltipPlacement: 'right',
      children: <MapIcon />,
      visible: true,
    };
  }

  override onCreateContentProps(): TypePanelProps {
    // Panel props
    return {
      title: 'basemapPanel.title',
      icon: <MapIcon />,
      width: 350,
      status: this.configObj?.isOpen as boolean,
    };
  }

  override onCreateContent = (): JSX.Element => {
    return <BasemapPanel mapId={this.pluginProps.mapId} config={this.configObj || {}} />;
  };

  /**
   * Function called when the plugin is removed, used for clean up
   */
  override onRemoved(): void {}
}

export default BasemapPanelPlugin;

// Keep a reference to the Basemap Panel Plugin as part of the geoviewPlugins property stored in the window object
window.geoviewPlugins = window.geoviewPlugins || {};
window.geoviewPlugins['basemap-panel'] = Cast<BasemapPanelPlugin>(BasemapPanelPlugin);
