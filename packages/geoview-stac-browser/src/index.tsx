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
          temporal: 'Temporal Extent',
          startDate: 'Start date',
          endDate: 'End date',
          modeSelector: 'Browse or search mode',
          keywords: 'Keywords',
          license: 'License',
          items: 'Items',
          noResults: 'No results found',
          showOnMap: 'Show on Map',
          zoomToExtent: 'Zoom to Extent',
          assets: 'Assets',
          useMapExtent: 'Use current map extent',
          containedInExtent: 'Fully contained in extent',
          loading: 'Loading...',
          back: 'Back',
          backToSearch: 'Back to search',
          backToCollections: 'Back to collections',
          readMore: 'Read more',
          readLess: 'Read less',
          previous: 'Previous',
          next: 'Next',
          searchCollections: 'Search collections...',
          sortAlphabetical: 'Sort alphabetically',
          goToCollection: 'Go to Collection',
          textSearch: 'Text Search',
          copyUrl: 'Copy URL',
          download: 'Download',
          collections: 'Collections',
          clearFilters: 'Clear filters',
          propertyFilters: 'Property filters',
          propertyOperator: '{{field}} operator',
          propertyValue: '{{field}} value',
          anyValue: 'Any value',
          noQueryableProperties: 'No queryable properties are available for this selection.',
          sort: 'Sort',
          sortField: 'Sort field',
          sortDirection: 'Sort direction',
          ascending: 'Ascending',
          descending: 'Descending',
          metadata: 'Metadata',
          zoom: 'Zoom',
          hideFromMap: 'Hide from map',
          details: 'Details',
          selectItem: 'Select {{title}}',
          selectionSummary: '{{selected}} selected, {{previewed}} on map',
          clear: 'Clear',
          errorRequest: 'Unable to get a response from the STAC service. Please try again later.',
          errorPreview: 'Unable to display this asset on the map.',
          errorQueryables: 'Unable to load the available property filters.',
        },
      },
      fr: {
        stacBrowser: {
          title: 'Navigateur STAC',
          browse: 'Parcourir',
          search: 'Rechercher',
          temporal: 'Étendue temporelle',
          startDate: 'Date de début',
          endDate: 'Date de fin',
          modeSelector: 'Mode parcourir ou rechercher',
          keywords: 'Mots-clés',
          license: 'Licence',
          items: 'Éléments',
          noResults: 'Aucun résultat trouvé',
          showOnMap: 'Afficher sur la carte',
          zoomToExtent: `Zoomer sur l'étendue`,
          assets: 'Actifs',
          useMapExtent: "Utiliser l'étendue actuelle de la carte",
          containedInExtent: "Entièrement contenu dans l'étendue",
          loading: 'Chargement...',
          back: 'Retour',
          backToSearch: 'Retour à la recherche',
          backToCollections: 'Retour aux collections',
          readMore: 'Lire la suite',
          readLess: 'Réduire',
          previous: 'Précédent',
          next: 'Suivant',
          searchCollections: 'Rechercher des collections...',
          sortAlphabetical: 'Trier par ordre alphabétique',
          goToCollection: 'Aller à la collection',
          textSearch: 'Recherche textuelle',
          copyUrl: "Copier l'URL",
          download: 'Télécharger',
          collections: 'Collections',
          clearFilters: 'Effacer les filtres',
          propertyFilters: 'Filtres de propriété',
          propertyOperator: 'Opérateur {{field}}',
          propertyValue: 'Valeur {{field}}',
          anyValue: 'Toutes les valeurs',
          noQueryableProperties: 'Aucune propriété interrogeable n’est disponible pour cette sélection.',
          sort: 'Trier',
          sortField: 'Champ de tri',
          sortDirection: 'Ordre de tri',
          ascending: 'Croissant',
          descending: 'Décroissant',
          metadata: 'Métadonnées',
          zoom: 'Zoomer',
          hideFromMap: 'Retirer de la carte',
          details: 'Détails',
          selectItem: 'Sélectionner {{title}}',
          selectionSummary: '{{selected}} sélectionné(s), {{previewed}} sur la carte',
          clear: 'Effacer',
          errorRequest: 'Impossible d’obtenir une réponse du service STAC. Veuillez réessayer plus tard.',
          errorPreview: 'Impossible d’afficher cet actif sur la carte.',
          errorQueryables: 'Impossible de charger les filtres de propriété disponibles.',
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
    return <StacBrowser config={this.getConfig()} />;
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
