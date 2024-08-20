import { Cast, AnySchemaObject, TypeJsonObject, toJsonObject } from 'geoview-core/src/core/types/global-types';
import { FooterPlugin } from 'geoview-core/src/api/plugin/footer-plugin';
import { TypeTabs } from 'geoview-core/src/ui/tabs/tabs';
import { CustomLegendIcon } from 'geoview-core/src/ui/icons';

import schema from '../schema.json';
import defaultConfig from '../default-config-legend-panel.json';
import { LegendPanel } from './custom-legend-panel';

/**
 * The Chart Plugin which will be automatically instanciated during GeoView's initialization.
 */
class CustomLegendFooterPlugin extends FooterPlugin {
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
   * translations object to inject to the viewer translations
   */
  translations = toJsonObject({
    en: {
      customLegendPanel: {
        title: 'Custom Legend',
      },
    },
    fr: {
      customLegendPanel: {
        title: 'Légende Personalisée',
      },
    },
  });

  /**
   * Overrides the addition of the GeoChart Footer Plugin to make sure to set the chart configs into the store.
   */
  override onAdd(): void {
    // Initialize the store with geochart provided configuration
    // GeochartEventProcessor.setGeochartCharts(this.pluginProps.mapId, this.configObj.charts);

    // Call parent
    super.onAdd();
  }

  /**
   * Overrides the creation of the content properties of this GeoChart Footer Plugin.
   * @returns {TypeTabs} The TypeTabs for the GeoChart Footer Plugin
   */
  override onCreateContentProps(): TypeTabs {
    // Create element
    const content = <LegendPanel mapId={this.pluginProps.mapId} config={{ isOpen: true, legendList: [] }} />;

    return {
      id: 'custom-legend-panel',
      value: this.value!,
      label: 'customLegendPanel.title',
      icon: <CustomLegendIcon />,
      content,
    };
  }

  /**
   * Handles when a redraw callback has been provided by LegendPanel
   */
  handleProvideCallbackRedraw(callbackRedraw: () => void): void {
    // Keep it
    this.callbackRedraw = callbackRedraw;
  }
}

// Exports the CustomLegendFooterPlugin
export default CustomLegendFooterPlugin;

// Keep a reference to the CustomLegendPlugin as part of the geoviewPlugins property stored in the window object
window.geoviewPlugins = window.geoviewPlugins || {};
window.geoviewPlugins['custom-legend-panel'] = Cast<CustomLegendFooterPlugin>(CustomLegendFooterPlugin);
