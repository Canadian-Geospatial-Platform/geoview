import { TypeJsonObject, toJsonObject, AnySchemaObject } from 'geoview-core/src/api/config/types/config-types';
import { FooterPlugin } from 'geoview-core/src/api/plugin/footer-plugin';
import { TypeTabs } from 'geoview-core/src/ui/tabs/tabs';
import { DrawIcon } from 'geoview-core/src/ui/icons';

// import { DrawerEventProcessor } from 'geoview-core/src/api/event-processors/event-processor-children/drawer-event-processor';
// import { logger } from 'geoview-core/src/core/utils/logger';

import schema from '../schema.json';
import defaultConfig from '../default-config-drawer.json';
import { DrawPanel } from './draw-panel-footer';

/**
 * Create a class for the plugin instance
 */
class DrawerPlugin extends FooterPlugin {
  /**
   * Returns the package schema
   *
   * @returns {AnySchemaObject} the package schema
   */
  override schema(): AnySchemaObject {
    return schema;
  }

  /**
   * Returns the default config for this package
   *
   * @returns {TypeJsonObject} the default config
   */
  override defaultConfig(): TypeJsonObject {
    return toJsonObject(defaultConfig);
  }

  // The callback used to redraw the GeoCharts in the GeoChartPanel
  callbackRedraw?: () => void;

  /**
   * Translations object to inject to the viewer translations
   */
  translations = toJsonObject({
    en: {
      drawer: {
        title: 'Draw',
        stopDrawing: 'Stop',
        stopDrawingTooltip: 'Stop Drawing',
        startDrawing: 'Start',
        startDrawingTooltip: 'Start Drawing',
        clear: 'Clear',
        clearTooltip: 'Clear the drawings',
      },
    },
    fr: {
      drawer: {
        title: 'Dessiner',
        stopDrawing: 'Arrêter',
        stopDrawingTooltip: 'Arrêter le dessin',
        startDrawing: 'Commencer',
        startDrawingTooltip: 'Commencer à dessiner',
        clear: 'Effacer',
        clearTooltip: 'Effacer les dessins',
      },
    },
  });

  /**
   * Overrides the addition of the Drawer Map Plugin to make sure to set the layer paths from the config into the store.
   */
  override onAdd(): void {
    // Initialize the store with drawer provided configuration
    // DrawerEventProcessor.setLayerPaths(this.pluginProps.mapId, this.configObj.layers);

    // Call parent
    super.onAdd();
  }

  /**
   * Overrides the creation of the content properties of this Drawer Map Plugin.
   * @returns {TypeTabs} The TypeTabs for the Drawer Plugin
   */
  override onCreateContentProps(): TypeTabs {
    const content = <DrawPanel viewer={this.pluginProps.viewer} config={this.configObj} />;

    return {
      id: 'drawer',
      value: this.value!,
      label: 'drawer.title',
      icon: <DrawIcon />,
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
}

export default DrawerPlugin;

// Keep a reference to the Drawer Plugin as part of the geoviewPlugins property stored in the window object
// window.geoviewPlugins = window.geoviewPlugins || {};
// window.geoviewPlugins.drawer = Cast<DrawerPlugin>(DrawerPlugin);
