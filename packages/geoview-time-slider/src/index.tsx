import { Cast, toJsonObject, TypeTabs } from 'geoview-core';
import { FooterPlugin } from 'geoview-core/src/api/plugin/footer-plugin';

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
class TimeSliderPlugin extends FooterPlugin {
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

  onCreateContentProps = (): TypeTabs => {
    return {
      value: this.value!,
      label: this.translations[this.displayLanguage()].timeSlider as string,
      content: () => <TimeSliderPanel mapId={this.pluginProps.mapId} />,
    };
  };
}

export default TimeSliderPlugin;

window.plugins = window.plugins || {};
window.plugins['time-slider'] = Cast<TimeSliderPlugin>(TimeSliderPlugin);
