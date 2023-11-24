import { Cast, AbstractPlugin, TypeWindow, toJsonObject, TypePluginOptions, TypeButtonPanel } from 'geoview-core';
import { TimeSliderPanel } from './time-slider-panel';

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

      // Create list of layers that have a temporal dimension
      // TODO use list of visible layers from store
      const layersList = Object.keys(api.maps[mapId].layer.registeredLayers).filter(
        (layerPath) =>
          api.maps[mapId].layer.registeredLayers[layerPath].entryType !== 'group' &&
          api.maps[mapId].layer.geoviewLayers[layerPath.split('/')[0]].layerTemporalDimension[layerPath]
      );

      // Collect data needed for slider
      let timeSliderData: { [index: string]: SliderFilterProps } = {};
      layersList.forEach((layerPath) => {
        const temporalDimensionInfo = api.maps[mapId].layer.geoviewLayers[layerPath.split('/')[0]].layerTemporalDimension[layerPath];
        const { range } = temporalDimensionInfo.range;
        const defaultValue = temporalDimensionInfo.default;
        const minAndMax: number[] = [new Date(range[0]).getTime(), new Date(range[range.length - 1]).getTime()];
        const { field, singleHandle } = temporalDimensionInfo;
        const values = singleHandle ? [new Date(temporalDimensionInfo.default).getTime()] : [...minAndMax];
        const filtering = true;
        const sliderData = {
          [layerPath]: {
            range,
            defaultValue,
            minAndMax,
            field,
            singleHandle,
            filtering,
            values,
            delay: 1000,
            locked: false,
            reversed: false,
          },
        };
        timeSliderData = { ...timeSliderData, ...sliderData };
      });
      this.value = api.maps[mapId].footerTabs.tabs.length;
      api.maps[mapId].footerTabs.createFooterTab({
        value: this.value,
        label: this.translations[api.maps[mapId].displayLanguage].timeSlider as string,
        content: () => createElement(TimeSliderPanel, { mapId, layersList, timeSliderData }, []),
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
