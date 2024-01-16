import { Cast, toJsonObject, TypeJsonObject, AnySchemaObject, TypeJsonValue } from 'geoview-core';
import { AbstractPlugin } from 'geoview-core/src/api/plugin/abstract-plugin';
// import { HubOutlinedIcon, InfoOutlinedIcon, LayersOutlinedIcon, StorageIcon } from 'geoview-core/src/ui';

import schema from '../schema.json';
import defaultConfig from '../default-config-footer-panel.json';
// import { FooterPanelLegendItem } from './footer-panel-legend-item';
// import { DataTable } from './data-table';
// import { Layers } from './layers';

type CustomTabs = {
  id: string;
  title: string;
  contentHTML: string;
};

/**
 * Create a class for the plugin instance
 */
class FooterPanelPlugin extends AbstractPlugin {
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
   * translations object to inject to the viewer translations
   */
  translations = toJsonObject({
    en: {
      footerPanel: {
        legend: 'Legend',
        layers: 'Layers',
        details: 'Details',
        dataTable: 'DataTable',
        timeSlider: 'Time Slider',
        geochart: 'Chart',
      },
    },
    fr: {
      footerPanel: {
        legend: 'Légende',
        layers: 'Couches',
        details: 'Détails',
        dataTable: 'Données',
        timeSlider: 'Curseur Temporel',
        geochart: 'Graphique',
      },
    },
  });

  /**
   * Function called when plugin is being added
   */
  onAdd(): void {
    const defaultTabs = (this.configObj?.tabs.defaultTabs as Array<string>) || [];
    let tabsCounter = 0;
    // if (defaultTabs.includes('legend')) {
    //   // create new tab and add the LegendComponent to the footer tab
    //   this.map().footerTabs.createFooterTab({
    //     id: 'legend',
    //     value: tabsCounter,
    //     label: 'footerPanel.legend',
    //     content: () => <FooterPanelLegendItem mapId={this.pluginProps.mapId} />,
    //     icon: <HubOutlinedIcon />,
    //   });
    //   tabsCounter++;
    // }

    // if (defaultTabs.includes('layers')) {
    //   // create new tab and add the LayersComponent to the footer tab
    //   this.map().footerTabs.createFooterTab({
    //     id: 'layers',
    //     value: tabsCounter,
    //     label: 'footerPanel.layers',
    //     content: () => <Layers mapId={this.pluginProps.mapId} />,
    //     icon: <LayersOutlinedIcon />,
    //   });
    //   tabsCounter++;
    // }

    // // create the listener to return the details
    // if (defaultTabs.includes('details')) {
    //   // create new tab and add the DetailComponent to the footer tab
    //   const detailsTabValue = tabsCounter;
    //   this.map().footerTabs.createFooterTab({
    //     id: 'details',
    //     value: detailsTabValue,
    //     label: 'footerPanel.details',
    //     content: () => this.map()?.details.createDetails(this.pluginProps.mapId),
    //     icon: <InfoOutlinedIcon />,
    //   });
    //   tabsCounter++;
    // }

    // if (defaultTabs.includes('data-table')) {
    //   /// create new tab and add the DataTable Component to the footer tab
    //   this.map().footerTabs.createFooterTab({
    //     id: 'data-table',
    //     value: tabsCounter,
    //     label: 'footerPanel.dataTable',
    //     content: () => <DataTable mapId={this.pluginProps.mapId} />,
    //     icon: <StorageIcon />,
    //   });
    //   tabsCounter++;
    // }

    // if (defaultTabs.includes('time-slider')) {
    //   /// create a new tab by loading the time-slider plugin
    //   this.api.plugin
    //     .loadScript('time-slider')
    //     .then((constructor: AbstractPlugin | ((pluginId: string, props: TypeJsonObject) => TypeJsonValue)) => {
    //       this.api.plugin.addPlugin(
    //         'time-slider',
    //         this.pluginProps.mapId,
    //         constructor,
    //         toJsonObject({
    //           mapId: this.pluginProps.mapId,
    //         })
    //       );
    //     });
    // }

    if (defaultTabs.includes('geoChart')) {
      // create a new tab by loading the geo chart plugin
      this.api.plugin
        .loadScript('geochart')
        .then((constructor: AbstractPlugin | ((pluginId: string, props: TypeJsonObject) => TypeJsonValue)) => {
          this.api.plugin.addPlugin(
            'geochart',
            this.pluginProps.mapId,
            constructor,
            toJsonObject({
              mapId: this.pluginProps.mapId,
            })
          );
        });
    }

    // TODO add custom detail reusable component when done

    const customTabs = this.configObj?.tabs.customTabs as Array<string>;
    for (let i = 0; i < customTabs.length; i++) {
      const tab = customTabs[i] as unknown as CustomTabs;
      this.map().footerTabs.createFooterTab({
        id: tab.id,
        value: tabsCounter,
        label: tab.title,
        content: tab.contentHTML,
      });
      tabsCounter++;
    }
  }

  /**
   * Function called when plugin is being removed, used for clean up
   */
  onRemove(): void {
    // TODO: Enable the footer tabs removal
  }
}

export default FooterPanelPlugin;

// Keep a reference to the Footer Panel Plugin as part of the geoviewPlugins property stored in the window object
window.geoviewPlugins = window.geoviewPlugins || {};
window.geoviewPlugins['footer-panel'] = Cast<FooterPanelPlugin>(FooterPanelPlugin);
