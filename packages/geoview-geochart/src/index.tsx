import {
  Cast,
  AbstractPlugin,
  AnySchemaObject,
  TypePluginOptions,
  TypeWindow,
  TypeButtonPanel,
  toJsonObject,
  TypeJsonObject,
} from 'geoview-core';
import { ChartType } from 'geochart';
import { LayerListEntry } from 'geoview-core/src/core/components/common';
import { PayloadBaseClassChart, EVENT_CHART_REDRAW } from './geochart-event-base';
import { PayloadChartConfig } from './geochart-event-config';
import { PluginGeoChartConfig } from './geochart-types';
import schema from '../schema.json';
import defaultConfig from '../default-config-geochart.json';
import { GeoChartPanel } from './geochart-panel';

/**
 * The Chart Plugin which will be automatically instanciated during GeoView's initialization.
 */
class GeoChartPlugin extends AbstractPlugin {
  // Store the created button panel object
  buttonPanel?: TypeButtonPanel;

  // store index of tab
  value: number | null = null;

  /**
   * Constructor
   * @param pluginId The plugin id
   * @param props The plugin properties upon initialization
   */
  constructor(pluginId: string, props: TypePluginOptions) {
    super(pluginId, props);
    this.buttonPanel = null;
  }

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

  /**
   * Added function called after the plugin has been initialized
   */
  added = (): void => {
    // Fetch cgpv
    const { cgpv } = window as TypeWindow;
    const { createElement } = cgpv.react;
    const { configObj, pluginProps } = this as AbstractPlugin;
    const { mapId } = pluginProps;

    // If cgpv exists
    if (cgpv) {
      // Access the api calls
      const { api } = cgpv;
      this.value = api.maps[mapId].footerTabs.tabs.length;
      const language = api.maps[mapId].getDisplayLanguage();

      const layerList = (configObj as PluginGeoChartConfig<ChartType>).charts
        .map((chart) => {
          const layerIds =
            chart.layers?.map((layer) => {
              return layer.layerId;
            }) ?? [];

          return layerIds;
        })
        .flat()
        .reduce((acc, curr) => {
          if (api.maps[mapId].layer.registeredLayers[curr]) {
            const currLayer = api.maps[mapId].layer.registeredLayers[curr];
            const layerName = currLayer.layerName && language in currLayer.layerName ? currLayer.layerName[language] : currLayer.layerName;
            const layerData = {
              layerName,
              layerPath: curr,
              tooltip: layerName,
            };
            acc.push(layerData);
          }

          return acc;
        }, [] as LayerListEntry[]);

      api.maps[mapId].footerTabs.createFooterTab({
        value: this.value,
        label: this.translations[api.maps[mapId].getDisplayLanguage()].chartPanel as string,
        content: () => createElement(GeoChartPanel, { mapId, configObj, layerList }, []),
      });
    }
  };

  /**
   * Function called when the plugin is removed, used for clean up
   */
  removed = (): void => {
    // Fetch cgpv
    const { cgpv } = window as TypeWindow;
    const { pluginProps } = this as AbstractPlugin;
    const { mapId } = pluginProps;

    // If cgpv exists
    if (cgpv) {
      // Remove the footer tab
      if (this.value) cgpv.api.maps[mapId].footerTabs.removeFooterTab(this.value);
    }
  };

  /**
   * Callable plugin function to emit a Chart config event in order to update the Chart configuration on demand.
   * @param data The GeoChartData to update the Chart with
   * @param options The GeoChartOptions to update the Chart with
   */
  loadConfig = (config: PluginGeoChartConfig<ChartType>): void => {
    // Fetch cgpv
    const { cgpv } = window as TypeWindow;
    const { pluginProps } = this as AbstractPlugin;
    const { mapId } = pluginProps;

    // If cgpv exists
    if (cgpv) {
      // Emit a Chart Changed event so the chart updates
      cgpv.api.event.emit(new PayloadChartConfig(mapId, config));
    }
  };

  /**
   * Callable plugin function to emit a Chart redraw event in order to update the Chart ui on demand.
   */
  redrawChart = (): void => {
    // Fetch cgpv
    const { cgpv } = window as TypeWindow;
    const { pluginProps } = this as AbstractPlugin;
    const { mapId } = pluginProps;

    // If cgpv exists
    if (cgpv) {
      // Emit a Chart Redraw event so the chart redraws
      cgpv.api.event.emit(new PayloadBaseClassChart(EVENT_CHART_REDRAW, mapId));
    }
  };
}

// Exports the GeoChartPlugin
export default GeoChartPlugin;

// Keep a reference to the GeoChartPlugin as part of the plugins property stored in the window object
window.plugins = window.plugins || {};
window.plugins.geochart = Cast<AbstractPlugin>(GeoChartPlugin);
