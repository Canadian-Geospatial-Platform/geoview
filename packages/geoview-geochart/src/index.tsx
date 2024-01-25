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
          noLayers: 'No layers with chart data',
        },
      },
    },
    fr: {
      geochart: {
        title: 'Graphique',
        panel: {
          noLayers: 'Pas de couches avec des données graphiques',
        },
      },
    },
  });

  onAdd(): void {
    // Initialize the store with geochart provided configuration
    GeochartEventProcessor.setGeochartCharts(this.pluginProps.mapId, this.configObj.charts);

    // Call parent
    super.onAdd();
  }

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
