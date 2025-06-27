import React from 'react'; // GV This import is to validate that we're on the right React at the end of the file
import { AnySchemaObject, TypeJsonObject, toJsonObject } from 'geoview-core/api/config/types/config-types';
import { FooterPlugin } from 'geoview-core/api/plugin/footer-plugin';
import { TypeTabs } from 'geoview-core/ui/tabs/tabs';
import { ChartIcon } from 'geoview-core/ui/icons';
import { ChartType } from 'geochart';

import { GeochartEventProcessor } from 'geoview-core/api/event-processors/event-processor-children/geochart-event-processor';
import schema from '../schema.json';
import defaultConfig from '../default-config-geochart.json';
import { GeoChartPanel } from './geochart-panel';
import { convertGeoViewGeoChartConfigToCore, PluginGeoChartConfig } from './geochart-types';

/**
 * The Chart Plugin which will be automatically instanciated during GeoView's initialization.
 */
class GeoChartFooterPlugin extends FooterPlugin {
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

  // The callback used to redraw the GeoCharts in the GeoChartPanel
  callbackRedraw?: () => void;

  /**
   * Overrides the default translations for the Plugin.
   * @returns {TypeJsonObject} - The translations object for the particular Plugin.
   */
  override defaultTranslations(): TypeJsonObject {
    return {
      en: {
        geochart: {
          title: 'Chart',
          panel: {
            chart: 'chart',
            loadingUI: 'Loading the Chart panel',
          },
        },
      },
      fr: {
        geochart: {
          title: 'Graphique',
          panel: {
            chart: 'graphique',
            loadingUI: "Chargement de l'interface pour graphique",
          },
        },
      },
    } as unknown as TypeJsonObject;
  }

  /**
   * Overrides the getConfig in order to return the right type.
   * @returns {PluginGeoChartConfig} The Geochart config
   */
  override getConfig(): PluginGeoChartConfig<ChartType> {
    // Redirect
    return super.getConfig() as PluginGeoChartConfig<ChartType>;
  }

  /**
   * Overrides the addition of the GeoChart Footer Plugin to make sure to set the chart configs into the store.
   */
  override onAdd(): void {
    // Call parent
    super.onAdd();

    // Initialize the store with geochart provided configuration if there is one
    if (this.getConfig().charts) {
      const configs = this.getConfig().charts.map((config) => convertGeoViewGeoChartConfigToCore(config));
      GeochartEventProcessor.setGeochartCharts(this.pluginProps.mapId, configs);
    }
  }

  /**
   * Overrides the creation of the content properties of this GeoChart Footer Plugin.
   * @returns {TypeTabs} The TypeTabs for the GeoChart Footer Plugin
   */
  override onCreateContentProps(): TypeTabs {
    // Create element
    const content = (
      <GeoChartPanel
        mapId={this.pluginProps.mapId}
        provideCallbackRedraw={(theCallbackRedraw) => this.handleProvideCallbackRedraw(theCallbackRedraw)}
      />
    );

    return {
      id: 'geochart',
      value: this.value!,
      label: 'geochart.title',
      icon: <ChartIcon />,
      content,
    };
  }

  /**
   * Handles when a redraw callback has been provided by GeoChartPanel
   */
  handleProvideCallbackRedraw(callbackRedraw: () => void): void {
    // Keep it
    this.callbackRedraw = callbackRedraw;
  }

  /**
   * Overrides when the plugin is selected in the Footer Bar.
   */
  override onSelect(): void {
    // Call parent
    super.onSelect();

    // When the GeoChart Plugin in the Footer is selected, we redraw the GeoChart, in case
    this.redrawChart();
  }

  /**
   * Callable plugin function to redraw the GeoCharts on demand.
   */
  redrawChart(): void {
    // Redraw the GeoChart Panel which will redraw the GeoCharts
    this.callbackRedraw?.();
  }
}

// Exports the GeoChartFooterPlugin
export default GeoChartFooterPlugin;

// GV This if condition took over 3 days to investigate. It was giving errors on the app.geo.ca website with
// GV some conflicting reacts being loaded on the page for some obscure reason.
// Check if we're on the right react
if (React === window.cgpv.reactUtilities.react) {
  // Keep a reference to the GeoChartPlugin as part of the geoviewPlugins property stored in the window object
  window.geoviewPlugins = window.geoviewPlugins || {};
  window.geoviewPlugins.geochart = GeoChartFooterPlugin;
} // Else ignore, don't keep it on the window, wait for the right react load
