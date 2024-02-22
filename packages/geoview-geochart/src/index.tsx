import { Cast, AnySchemaObject, toJsonObject, TypeJsonObject } from 'geoview-core';
import { FooterPlugin } from 'geoview-core/src/api/plugin/footer-plugin';
import { TypeTabs } from 'geoview-core/src/ui/tabs/tabs';
import { ChartType } from 'geochart';
import { ChartIcon } from 'geoview-core/src/ui/icons';

import { GeochartEventProcessor } from 'geoview-core/src/api/event-processors/event-processor-children/geochart-event-processor';
import { PayloadBaseClassChart, EVENT_CHART_REDRAW } from './geochart-event-base';
import { PayloadChartConfig } from './geochart-event-config';
import { PluginGeoChartConfig } from './geochart-types';
import schema from '../schema.json';
import defaultConfig from '../default-config-geochart.json';
import { GeoChartPanel } from './geochart-panel';

/**
 * The Chart Plugin which will be automatically instanciated during GeoView's initialization.
 */
class GeoChartFooterPlugin extends FooterPlugin {
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
   * Translations object to inject to the viewer translations
   */
  translations = toJsonObject({
    en: {
      geochart: {
        title: 'Chart',
        panel: {
          chart: 'chart',
          clickMap: 'Click on the map on a layer with a graph',
          loadingUI: 'Loading the Chart panel',
        },
      },
    },
    fr: {
      geochart: {
        title: 'Graphique',
        panel: {
          chart: 'graphique',
          clickMap: 'Cliquez sur la map sur la couche ayant un graphique',
          loadingUI: "Chargement de l'interface pour graphique",
        },
      },
    },
  });

  /**
   * Overrides the addition of the GeoChart Footer Plugin to make sure to set the chart configs into the store.
   */
  onAdd(): void {
    // Initialize the store with geochart provided configuration
    GeochartEventProcessor.setGeochartCharts(this.pluginProps.mapId, this.configObj.charts);

    // Call parent
    super.onAdd();
  }

  /**
   * Overrides the creation of the content properties of this GeoChart Footer Plugin.
   * @returns {TypeTabs} The TypeTabs for the GeoChart Footer Plugin
   */
  onCreateContentProps(): TypeTabs {
    // Create element
    const content = <GeoChartPanel mapId={this.pluginProps.mapId} />;

    return {
      id: 'geochart',
      value: this.value!,
      label: 'geochart.title',
      icon: <ChartIcon />,
      content,
    };
  }

  /**
   * Overrides when the plugin is selected in the Footer Bar.
   * @returns {TypeTabs} The TypeTabs for the GeoChart Footer Plugin
   */
  onSelected(): void {
    // Call parent
    super.onSelected();

    // When the GeoChart Plugin in the Footer is selected, we redraw the chart, in case
    this.redrawChart();
  }

  /**
   * Callable plugin function to emit a Chart config event in order to update the Chart configuration on demand.
   * @param config PluginGeoChartConfig<ChartType> The GeoChart Config
   */
  loadConfig(config: PluginGeoChartConfig<ChartType>): void {
    // Emit a Chart Changed event so the chart updates
    this.api.event.emit(new PayloadChartConfig(this.pluginProps.mapId, config));
  }

  /**
   * Callable plugin function to emit a Chart redraw event in order to update the Chart ui on demand.
   */
  redrawChart(): void {
    // Emit a Chart Redraw event so the chart redraws
    this.api.event.emit(new PayloadBaseClassChart(EVENT_CHART_REDRAW, this.pluginProps.mapId));
  }
}

// Exports the GeoChartFooterPlugin
export default GeoChartFooterPlugin;

// Keep a reference to the GeoChartPlugin as part of the geoviewPlugins property stored in the window object
window.geoviewPlugins = window.geoviewPlugins || {};
window.geoviewPlugins.geochart = Cast<GeoChartFooterPlugin>(GeoChartFooterPlugin);
