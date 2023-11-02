import {
  Cast,
  AbstractPlugin,
  AnySchemaObject,
  TypePluginOptions,
  TypeWindow,
  TypeButtonPanel,
  TypeIconButtonProps,
  TypePanelProps,
  toJsonObject,
  TypeJsonObject,
} from 'geoview-core';
import { ChartType, SchemaValidator } from 'geochart';

import { PayloadBaseClassChart, EVENT_CHART_REDRAW } from './geochart-event-base';
import { PayloadChartConfig } from './geochart-event-config';
import { PluginGeoChartConfig } from './geochart-types';
import { GeoChart } from './geochart';
import schema from '../schema.json';
import defaultConfig from '../default-config-geochart.json';

/**
 * The Chart Plugin which will be automatically instanciated during GeoView's initialization.
 */
class GeoChartPlugin extends AbstractPlugin {
  // Store the created button panel object
  buttonPanel?: TypeButtonPanel;

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
    const { configObj, pluginProps } = this as AbstractPlugin;
    const { mapId } = pluginProps;

    // If cgpv exists
    if (cgpv) {
      // Access the api calls
      const { api, ui } = cgpv;
      const { MapIcon } = ui.elements;
      const { displayLanguage } = api.maps[mapId];

      // Button props
      const button: TypeIconButtonProps = {
        id: 'geoChartPanelButton',
        tooltip: this.translations[displayLanguage].chartPanel as string,
        tooltipPlacement: 'right',
        children: <MapIcon />,
        visible: true,
      };

      // Panel props
      const panel: TypePanelProps = {
        title: this.translations[displayLanguage].chartPanel,
        icon: '<i class="material-icons">map</i>',
        width: '80vw',
        status: configObj?.isOpen as boolean,
        handlePanelOpened: () => {
          // Redraw the chart, because of the canvas rendering
          this.redrawChart();
        },
      };

      // Create a new button panel on the app-bar
      this.buttonPanel = api.maps[mapId].appBarButtons.createAppbarPanel(button, panel, null);
      // Set panel content
      this.buttonPanel?.panel?.changeContent(<GeoChart mapId={mapId} config={configObj || {}} schemaValidator={new SchemaValidator()} />);
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
      // If there is a button panel
      if (this.buttonPanel) {
        // Remove the app bar panel
        cgpv.api.maps[mapId].appBarButtons.removeAppbarPanel(this.buttonPanel.buttonPanelId);
      }
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
