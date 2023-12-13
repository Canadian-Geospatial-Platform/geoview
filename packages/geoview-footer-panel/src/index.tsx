import {
  Cast,
  toJsonObject,
  TypeJsonObject,
  AnySchemaObject,
  payloadIsAllQueriesDone,
  TypeArrayOfFeatureInfoEntries,
  PayloadBaseClass,
  TypeJsonValue,
} from 'geoview-core';
import { AbstractPlugin } from 'geoview-core/src/api/plugin/abstract-plugin';
import { HubOutlinedIcon, InfoOutlinedIcon, LayersOutlinedIcon, StorageIcon } from 'geoview-core/src/ui';

import schema from '../schema.json';
import defaultConfig from '../default-config-footer-panel.json';
import { FooterPanelLegendItem } from './footer-panel-legend-item';
import { DataTable } from './data-table';
import { Layers } from './layers';

type CustomTabs = {
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
      legend: 'Legend',
      layers: 'Layers',
      details: 'Details',
      dataTable: 'DataTable',
      timeSlider: 'Time Slider',
      geochart: 'Chart',
    },
    fr: {
      legend: 'Légende',
      layers: 'Couches',
      details: 'Détails',
      dataTable: 'Données',
      timeSlider: 'Curseur Temporel',
      geochart: 'Graphique',
    },
  });

  /**
   * Function called when plugin is being added
   */
  onAdd(): void {
    // access the api calls
    const { footerTabs } = this.api.maps[this.pluginProps.mapId];

    const defaultTabs = this.configObj?.tabs.defaultTabs as Array<string>;
    let tabsCounter = 0;
    if (defaultTabs.includes('legend')) {
      // create new tab and add the LegendComponent to the footer tab
      footerTabs.createFooterTab({
        value: tabsCounter,
        label: this.translations[this.displayLanguage()].legend as string,
        content: () => <FooterPanelLegendItem mapId={this.pluginProps.mapId} />,
        icon: <HubOutlinedIcon />,
      });
      tabsCounter++;
    }

    if (defaultTabs.includes('layers')) {
      // create new tab and add the LayersComponent to the footer tab
      footerTabs.createFooterTab({
        value: tabsCounter,
        label: this.translations[this.displayLanguage()].layers as string,
        content: () => <Layers mapId={this.pluginProps.mapId} />,
        icon: <LayersOutlinedIcon />,
      });
      tabsCounter++;
    }

    // create the listener to return the details
    if (defaultTabs.includes('details')) {
      // create new tab and add the DetailComponent to the footer tab
      const detailsTabValue = tabsCounter;
      footerTabs.createFooterTab({
        value: detailsTabValue,
        label: this.translations[this.displayLanguage()].details as string,
        content: () => this.map().details.createDetails(this.pluginProps.mapId),
        icon: <InfoOutlinedIcon />,
      });
      tabsCounter++;
      // select the details tab when map click queries are done
      // TODO: This info should be kept in the store cause we do notlisten to layerset directly anymore
      this.api.event.on(
        this.api.eventNames.GET_FEATURE_INFO.ALL_QUERIES_DONE,
        (payload: PayloadBaseClass) => {
          if (payloadIsAllQueriesDone(payload)) {
            const { eventType, resultSets } = payload;
            if (eventType === 'click') {
              let features: TypeArrayOfFeatureInfoEntries = [];
              Object.keys(resultSets).forEach((layerPath) => {
                features = features.concat(resultSets[layerPath]!);
              });
              if (features.length > 0) {
                footerTabs.selectFooterTab(detailsTabValue);
              }
            }
          }
        },
        `${this.pluginProps.mapId}/FeatureInfoLayerSet`
      );
    }

    if (defaultTabs.includes('data-table')) {
      /// create new tab and add the DataTable Component to the footer tab
      footerTabs.createFooterTab({
        value: tabsCounter,
        label: this.translations[this.displayLanguage()].dataTable as string,
        content: () => <DataTable mapId={this.pluginProps.mapId} />,
        icon: <StorageIcon />,
      });
      tabsCounter++;
    }

    if (defaultTabs.includes('time-slider')) {
      /// create a new tab by loading the time-slider plugin
      this.api.plugin
        .loadScript('time-slider')
        .then((constructor: AbstractPlugin | ((pluginId: string, props: TypeJsonObject) => TypeJsonValue)) => {
          this.api.plugin.addPlugin(
            'time-slider',
            this.pluginProps.mapId,
            constructor,
            toJsonObject({
              mapId: this.pluginProps.mapId,
            })
          );
        });
    }

    if (defaultTabs.includes('geoChart')) {
      /// create a new tab by loading the geo chart plugin
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

      footerTabs.createFooterTab({
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

window.plugins = window.plugins || {};
window.plugins['footer-panel'] = Cast<FooterPanelPlugin>(FooterPanelPlugin);
