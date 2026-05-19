import React from 'react'; // GV This import is to validate that we're on the right React at the end of the file
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
          browse: 'Browse',
          search: 'Search',
          collections: 'Collections',
          temporal: 'Temporal Extent',
          spatial: 'Spatial Extent',
          keywords: 'Keywords',
          license: 'License',
          items: 'Items',
          noResults: 'No results found',
          showFootprint: 'Show Footprint',
          showOnMap: 'Show on Map',
          removeLayer: 'Remove Layer',
          zoomTo: 'Zoom To',
          zoomToExtent: 'Zoom to Extent',
          description: 'Description',
          assets: 'Assets',
          useMapExtent: 'Use current map extent',
          loading: 'Loading...',
          error: 'An error occurred',
          loadMore: 'Load More',
          back: 'Back',
          backToSearch: 'Back to search',
          backToResults: 'Back to results',
          backToCollections: 'Back to collections',
          readMore: 'Read more',
          readLess: 'Read less',
          previous: 'Previous',
          next: 'Next',
          datetime: 'Date',
          collection: 'Collection',
          general: 'General',
          created: 'Created',
          updated: 'Updated',
          projection: 'Projection',
          epsgCode: 'EPSG Code',
          imageDimensions: 'Image Dimensions',
          transform: 'Transform',
          searchCollections: 'Search collections...',
          sortAlphabetical: 'Sort alphabetically',
          goToCollection: 'Go to Collection',
          textSearch: 'Text Search',
        },
      },
      fr: {
        stacBrowser: {
          title: 'Navigateur STAC',
          browse: 'Parcourir',
          search: 'Rechercher',
          collections: 'Collections',
          temporal: 'Étendue temporelle',
          spatial: 'Étendue spatiale',
          keywords: 'Mots-clés',
          license: 'Licence',
          items: 'Éléments',
          noResults: 'Aucun résultat trouvé',
          showFootprint: `Afficher l'empreinte`,
          showOnMap: 'Afficher sur la carte',
          removeLayer: 'Retirer la couche',
          zoomTo: 'Zoomer vers',
          zoomToExtent: `Zoomer sur l'étendue`,
          description: 'Description',
          assets: 'Actifs',
          useMapExtent: "Utiliser l'étendue actuelle de la carte",
          loading: 'Chargement...',
          error: 'Une erreur est survenue',
          loadMore: 'Charger plus',
          back: 'Retour',
          backToSearch: 'Retour à la recherche',
          backToResults: 'Retour aux résultats',
          backToCollections: 'Retour aux collections',
          readMore: 'Lire la suite',
          readLess: 'Réduire',
          previous: 'Précédent',
          next: 'Suivant',
          datetime: 'Date',
          collection: 'Collection',
          general: 'Général',
          created: 'Créé',
          updated: 'Mis à jour',
          projection: 'Projection',
          epsgCode: 'Code EPSG',
          imageDimensions: "Dimensions de l'image",
          transform: 'Transformation',
          searchCollections: 'Rechercher des collections...',
          sortAlphabetical: 'Trier par ordre alphabétique',
          goToCollection: 'Aller à la collection',
          textSearch: 'Recherche textuelle',
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
