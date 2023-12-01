import { Cast, AbstractPlugin, TypeWindow, toJsonObject, TypePluginOptions, TypeButtonPanel } from 'geoview-core';
import { TimeSliderPanel } from './time-slider-panel';

export interface LayerProps {
  layerPath: string;
  layerName: string;
}
export interface SliderFilterProps {
  range: string[];
  defaultValue: string;
  minAndMax: number[];
  field: string;
  singleHandle: boolean;
  values: number[];
  filtering: boolean;
  delay: number;
  locked: boolean;
  reversed: boolean;
}

/**
 * Time slider plugin
 */
class TimeSliderPlugin extends AbstractPlugin {
  // store the created button panel object
  buttonPanel: TypeButtonPanel | null;

  // store index of tab
  value: number | null = null;

  constructor(pluginId: string, props: TypePluginOptions) {
    super(pluginId, props);
    this.buttonPanel = null;
  }

  /**
   * Translations object to inject to the viewer translations
   */
  translations = toJsonObject({
    en: {
      timeSlider: 'Time Slider',
    },
    fr: {
      timeSlider: 'Curseur Temporel',
    },
  });

  /**
   * Added function called after the plugin has been initialized
   */
  added = (): void => {
    // Fetch cgpv
    const { cgpv } = window as TypeWindow;
    const { createElement } = cgpv.react;
    const { pluginProps } = this as AbstractPlugin;
    const { mapId } = pluginProps;

    // If cgpv exists
    if (cgpv) {
      // Access the api calls
      const { api } = cgpv;

      this.value = api.maps[mapId].footerTabs.tabs.length;
      api.maps[mapId].footerTabs.createFooterTab({
        value: this.value,
        label: this.translations[api.maps[mapId].displayLanguage].timeSlider as string,
        content: () => createElement(TimeSliderPanel, { mapId }, []),
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
}

export default TimeSliderPlugin;

window.plugins = window.plugins || {};
window.plugins['time-slider'] = Cast<AbstractPlugin>(TimeSliderPlugin);
