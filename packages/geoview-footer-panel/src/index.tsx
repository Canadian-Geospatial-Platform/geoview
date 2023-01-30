import {
  Cast,
  AbstractPlugin,
  TypePluginOptions,
  TypeButtonPanel,
  TypeWindow,
  toJsonObject,
  TypeJsonObject,
  AnySchemaObject,
  payloadIsAllQueriesDone,
  TypeArrayOfFeatureInfoEntries,
} from 'geoview-core';

import schema from '../schema.json';
import defaultConfig from '../default-config-footer-panel.json';
import { DetailsItem } from './details-item';
import { LegendItem } from './legend-item';
import { DataItem } from './data-item';

const w = window as TypeWindow;

type CustomTabs = {
  title: string;
  contentHTML: string;
};

/**
 * Create a class for the plugin instance
 */
class FooterPanelPlugin extends AbstractPlugin {
  // store the created button panel object
  buttonPanel: TypeButtonPanel | null;

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
   * translations object to inject to the viewer translations
   */
  translations = toJsonObject({
    en: {
      legend: 'Legend',
      details: 'Details',
      dataGrid: 'Data',
    },
    fr: {
      legend: 'Légende',
      details: 'Détails',
      dataGrid: 'Données',
    },
  });

  /**
   * Added function called after the plugin has been initialized
   */
  added = (): void => {
    const { configObj, pluginProps } = this;

    const { mapId } = pluginProps;

    // access the cgpv object from the window object
    const { cgpv } = w;

    if (cgpv) {
    // access the api calls
    const { api } = cgpv;
    const { displayLanguage, footerTabs, map } = api.map(mapId);

    const mapContainer = map.getTargetElement().parentElement;
    if (mapContainer) {
      mapContainer.style.height = 'calc( 100% - 300px )';
    }

    const defaultTabs = configObj?.tabs.defaultTabs as Array<string>;
    let tabsCounter = 0;

    if (defaultTabs.includes('legend')) {
      // create new tab and add the LegendComponent to the footer tab
      footerTabs.createFooterTab({
        value: tabsCounter,
        label: this.translations[displayLanguage].legend as string,
        content: () => <LegendItem mapId={mapId} />,
      });
      tabsCounter++;
    }

    // create the listener to return the details
    if (defaultTabs.includes('details')) {
      // create new tab and add the DetailComponent to the footer tab
      const detailsTabValue = tabsCounter;
      footerTabs.createFooterTab({
        value: detailsTabValue,
        label: this.translations[displayLanguage].details as string,
        content: () => <DetailsItem mapId={mapId} />,
      });
      tabsCounter++;
      // select the details tab when map click queries are done
      api.event.on(
        api.eventNames.GET_FEATURE_INFO.ALL_QUERIES_DONE,
        (payload) => {
          if (payloadIsAllQueriesDone(payload)) {
            const { resultSets } = payload;
            let features: TypeArrayOfFeatureInfoEntries = [];
            Object.keys(resultSets).forEach((layerPath) => {
              features = features.concat(resultSets[layerPath]!);
            });
            if (features.length > 0) {
              footerTabs.selectFooterTab(detailsTabValue);
            }
          }
        },
        mapId,
        `${mapId}-DetailsAPI`
      );
    }

    if (defaultTabs.includes('data-grid')) {
      /// create new tab and add the DataGridComponent to the footer tab
      footerTabs.createFooterTab({
        value: tabsCounter,
        label: this.translations[displayLanguage].dataGrid as string,
        content: () => <DataItem mapId={mapId} />,
      });
      tabsCounter++;
    }

    // TODO add custom detail reusable component when done

    const customTabs = configObj?.tabs.customTabs as Array<string>;
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
  };

  /**
   * Function called when the plugin is removed, used for clean up
   */
  removed(): void {
    // const { mapId } = this.pluginProps;

    // access the cgpv object from the window object
    const { cgpv } = w;

    if (cgpv) {
      // access the api calls
      // const { api } = cgpv;
      // TODO: Enable the footer tabs removal
    }
  }
}

export default FooterPanelPlugin;

w.plugins = w.plugins || {};
w.plugins['footer-panel'] = Cast<AbstractPlugin>(FooterPanelPlugin);
