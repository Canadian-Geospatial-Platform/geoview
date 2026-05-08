import React from 'react';
import { AppBarPlugin } from 'geoview-core/api/plugin/appbar-plugin';
import { StacBrowserIcon } from 'geoview-core/ui/icons';
import type { IconButtonPropsExtend } from 'geoview-core/ui/icon-button/icon-button';
import type { TypePanelProps } from 'geoview-core/ui/panel/panel-types';
import type { StacBrowserConfig } from './stac-browser-types';
import { StacBrowser } from './stac-browser';
import schema from '../schema.json';
import defaultConfig from '../default-config-stac-browser.json';

/**
 * STAC Browser plugin — provides a panel for browsing and filtering STAC API catalogs.
 */
class StacBrowserPlugin extends AppBarPlugin {
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
   * @returns The translations object for the particular Plugin
   */
  override defaultTranslations(): Record<string, unknown> {
    return {
      en: {
        stacBrowser: {
          title: 'STAC Browser',
          search: 'Search',
          collections: 'Collections',
          temporal: 'Temporal Extent',
          spatial: 'Spatial Extent',
          keywords: 'Keywords',
          noResults: 'No results found',
          showFootprint: 'Show Footprint',
          showOnMap: 'Show on Map',
          removeLayer: 'Remove Layer',
          clearMap: 'Clear Map',
          zoomTo: 'Zoom To',
          description: 'Description',
          assets: 'Assets',
          useMapExtent: 'Use current map extent',
          loading: 'Loading...',
          error: 'An error occurred',
          loadMore: 'Load More',
          back: 'Back to results',
          backToSearch: 'Back to search',
          backToResults: 'Back to results',
          datetime: 'Date',
          collection: 'Collection',
        },
      },
      fr: {
        stacBrowser: {
          title: 'Navigateur STAC',
          search: 'Rechercher',
          collections: 'Collections',
          temporal: 'Étendue temporelle',
          spatial: 'Étendue spatiale',
          keywords: 'Mots-clés',
          noResults: 'Aucun résultat trouvé',
          showFootprint: `Afficher l'empreinte`,
          showOnMap: 'Afficher sur la carte',
          removeLayer: 'Retirer la couche',
          clearMap: 'Effacer la carte',
          zoomTo: 'Zoomer vers',
          description: 'Description',
          assets: 'Actifs',
          useMapExtent: "Utiliser l'étendue actuelle de la carte",
          loading: 'Chargement...',
          error: 'Une erreur est survenue',
          loadMore: 'Charger plus',
          back: 'Retour aux résultats',
          backToSearch: 'Retour à la recherche',
          backToResults: 'Retour aux résultats',
          datetime: 'Date',
          collection: 'Collection',
        },
      },
    };
  }

  /**
   * Overrides the getConfig in order to return the right type.
   *
   * @returns The STAC browser config
   */
  override getConfig(): StacBrowserConfig {
    // Redirect
    return super.getConfig() as StacBrowserConfig;
  }

  /**
   * Overrides the creation of the button properties of this STAC Browser AppBar Plugin.
   *
   * @returns The IconButtonPropsExtend for the STAC Browser AppBar Plugin
   */
  override onCreateButtonProps(): IconButtonPropsExtend {
    return {
      id: 'stac-browser',
      'aria-label': 'stacBrowser.title',
      tooltipPlacement: 'right',
      children: <StacBrowserIcon />,
      visible: true,
    };
  }

  /**
   * Overrides the creation of the content properties of this STAC Browser AppBar Plugin.
   *
   * @returns The TypePanelProps for the STAC Browser AppBar Plugin
   */
  override onCreateContentProps(): TypePanelProps {
    return {
      title: 'stacBrowser.title',
      icon: <StacBrowserIcon />,
      width: 40,
      status: this.getConfig().isOpen,
    };
  }

  /**
   * Overrides the creation of the content of this STAC Browser AppBar Plugin.
   *
   * @returns The JSX.Element representing the STAC Browser panel content
   */
  override onCreateContent = (): JSX.Element => {
    return <StacBrowser config={this.getConfig()} mapId={this.mapViewer.mapId} />;
  };

  /**
   * Handles cleanup when the plugin is removed.
   */
  override onRemoved(): void {}
}

export default StacBrowserPlugin;

if (React === window.cgpv.reactUtilities.react) {
  window.geoviewPlugins = window.geoviewPlugins || {};
  window.geoviewPlugins['stac-browser'] = StacBrowserPlugin;
}
