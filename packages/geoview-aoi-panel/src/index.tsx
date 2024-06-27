import { TypeJsonObject, toJsonObject, AnySchemaObject, Cast } from 'geoview-core/src/core/types/global-types';
import { AppBarPlugin } from 'geoview-core/src/api/plugin/appbar-plugin';
import { AoiIcon } from 'geoview-core/src/ui/icons';
import { TypeIconButtonProps } from 'geoview-core/src/ui/icon-button/icon-button-types';
import { TypePanelProps } from 'geoview-core/src/ui/panel/panel-types';
import { AoiPanel } from './aoi-panel';
import schema from '../schema.json';
import defaultConfig from '../default-config-area-of-interest.json';

/**
 * Create a class for the plugin instance
 */
class AoiPanelPlugin extends AppBarPlugin {
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
      AoiPanel: {
        title: 'Area of Interest',
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
      AoiPanel: {
        title: "Région d'intéret",
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

  override onCreateButtonProps(): TypeIconButtonProps {
    // Button props
    return {
      id: `${this.pluginProps.mapId}-AoiPanelButton`,
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
      status: this.configObj?.isOpen as boolean,
    };
  }

  override onCreateContent = (): JSX.Element => {
    return <AoiPanel mapId={this.pluginProps.mapId} config={this.configObj || {}} />;
  };

  /**
   * Function called when the plugin is removed, used for clean up
   */
  override onRemoved(): void {
    // reset AOI array
    this.mapViewer().basemap.basemaps = [];
  }
}

export default AoiPanelPlugin;

// Keep a reference to the AOI Panel Plugin as part of the geoviewPlugins property stored in the window object
window.geoviewPlugins = window.geoviewPlugins || {};
window.geoviewPlugins['aoi-panel'] = Cast<AoiPanelPlugin>(AoiPanelPlugin);
