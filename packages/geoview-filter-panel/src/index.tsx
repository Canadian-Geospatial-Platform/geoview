import React from 'react'; // GV This import is to validate that we're on the right React at the end of the file
import { AppBarPlugin } from 'geoview-core/api/plugin/appbar-plugin';
import { FilterAltIcon } from 'geoview-core/ui/icons';
import type { IconButtonPropsExtend } from 'geoview-core/ui/icon-button/icon-button';
import type { TypePanelProps } from 'geoview-core/ui/panel/panel-types';
import type { TypeFilterPanelProps } from './types';
import { FilterPanel } from './components/filter-panel';
import schema from '../schema.json';
import defaultConfig from '../default-config-filter-panel.json';

/**
 * Filter panel plugin.
 *
 * Provides a customizable UI panel for filtering map layers based on attribute values.
 */
class FilterPanelPlugin extends AppBarPlugin {
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
        FilterPanel: {
          title: 'Filter Layers',
          clear: 'Clear',
          apply: 'Apply Filters',
          applying: 'Applying...',
          reset: 'Reset All',
          all: 'All',
          loading: 'Loading options...',
          loadingLayer: 'Loading layer...',
          loadingValues: 'Loading values...',
          noValues: 'No values available',
          noNumericValues: 'No numeric values available',
          noDateValues: 'No date values available',
          noConfig: 'No filter configuration provided',
          noController: 'Filter controller not initialized',
          toggleCollapse: 'Toggle Collapse - {{filterName}} Filters',
          expand: 'Expand',
          collapse: 'Collapse',
          nullValue: '(null)',
          available: 'Available',
          to: 'to',
        },
      },
      fr: {
        FilterPanel: {
          title: 'Filtrer les couches',
          clear: 'Effacer',
          apply: 'Appliquer les filtres',
          applying: 'Application...',
          reset: 'Réinitialiser tout',
          all: 'Tous',
          loading: 'Chargement des options...',
          loadingLayer: 'Chargement de la couche...',
          loadingValues: 'Chargement des valeurs...',
          noValues: 'Aucune valeur disponible',
          noNumericValues: 'Aucune valeur numérique disponible',
          noDateValues: 'Aucune valeur de date disponible',
          noConfig: 'Aucune configuration de filtre fournie',
          noController: 'Contrôleur de filtre non initialisé',
          toggleCollapse: 'Basculer le repli - Filtres {{filterName}}',
          expand: 'Développer',
          collapse: 'Réduire',
          nullValue: '(nul)',
          available: 'Disponible',
          to: 'à',
        },
      },
    };
  }

  /**
   * Overrides the getConfig in order to return the right type.
   *
   * @returns The filter panel config
   */
  override getConfig(): TypeFilterPanelProps {
    // Redirect
    return super.getConfig() as TypeFilterPanelProps;
  }

  /**
   * Overrides the onCreateButtonProps to pass the correct props.
   *
   * @returns The icon button props
   */
  override onCreateButtonProps(): IconButtonPropsExtend {
    // Button props
    return {
      id: 'filter-panel',
      'aria-label': 'FilterPanel.title',
      tooltipPlacement: 'right',
      children: <FilterAltIcon />,
      visible: true,
    };
  }

  /**
   * Overrides the creation of the content properties of this Filter Panel AppBar Plugin.
   *
   * @returns The panel properties for the Filter Panel AppBar Plugin
   */
  override onCreateContentProps(): TypePanelProps {
    // Panel props
    return {
      title: this.getConfig().title ?? 'FilterPanel.title',
      icon: <FilterAltIcon />,
      width: 30, // use as %
      status: this.getConfig().isOpen,
    };
  }

  /**
   * Overrides the content creation of the AppBar Plugin.
   *
   * @returns The filter panel content
   */
  override onCreateContent = (): JSX.Element => {
    return <FilterPanel config={this.getConfig()} />;
  };
}

// Export plugin instance
export default FilterPanelPlugin;

// GV This if condition took over 3 days to investigate. It was giving errors on the app.geo.ca website with
// GV some conflicting reacts being loaded on the page for some obscure reason.
// Check if we're on the right react
if (React === window.cgpv.reactUtilities.react) {
  // Keep a reference to the Filter Panel Plugin as part of the geoviewPlugins property stored in the window object
  window.geoviewPlugins = window.geoviewPlugins || {};
  window.geoviewPlugins['filter-panel'] = FilterPanelPlugin;
} // Else ignore, don't keep it on the window, wait for the right react load
