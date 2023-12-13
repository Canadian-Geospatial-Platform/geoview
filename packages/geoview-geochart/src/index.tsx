import { Cast, AnySchemaObject, toJsonObject, TypeJsonObject } from 'geoview-core';
import { TypeTabs } from 'geoview-core/src/ui/tabs/tabs';
import { ChartType } from 'geochart';
import { LayerListEntry } from 'geoview-core/src/core/components/common';
import { FooterPlugin } from 'geoview-core/src/api/plugin/footer-plugin';

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
      chartPanel: 'Chart',
    },
    fr: {
      chartPanel: 'Graphique',
    },
  });

  onCreateContentProps(): TypeTabs {
    // Cast the config
    const chartConfig: PluginGeoChartConfig<ChartType> | undefined = this.configObj;

    // Create content
    const layerList = chartConfig?.charts
      .map((chart) => {
        const layerIds =
          chart.layers?.map((layer) => {
            return layer.layerId;
          }) ?? [];

        return layerIds;
      })
      .flat()
      .reduce((acc, curr) => {
        if (this.api.maps[this.pluginProps.mapId].layer.registeredLayers[curr]) {
          const currLayer = this.api.maps[this.pluginProps.mapId].layer.registeredLayers[curr];
          const layerName =
            currLayer.layerName && this.displayLanguage() in currLayer.layerName
              ? currLayer.layerName[this.displayLanguage()]
              : currLayer.layerName;
          const layerData = {
            layerName,
            layerPath: curr,
            tooltip: layerName,
          };
          acc.push(layerData);
        }

        return acc;
      }, [] as LayerListEntry[]);

    // If any layers list
    let content = <div>No layers in config</div>;
    if (layerList) {
      // Create element
      content = <GeoChartPanel mapId={this.pluginProps.mapId} configObj={this.configObj} layerList={layerList} />;
    }

    return {
      value: this.value!,
      label: this.translations[this.displayLanguage()].chartPanel as string,
      content: () => content,
    };
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

// Keep a reference to the GeoChartPlugin as part of the plugins property stored in the window object
window.plugins = window.plugins || {};
window.plugins.geochart = Cast<GeoChartFooterPlugin>(GeoChartFooterPlugin);
