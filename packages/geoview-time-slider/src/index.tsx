import { AnySchemaObject, api, Cast, TimeDimension, toJsonObject, TypeJsonObject, TypeTabs } from 'geoview-core';
import { TimeSliderIcon } from 'geoview-core/src/ui';
import { FooterPlugin } from 'geoview-core/src/api/plugin/footer-plugin';

import { TimeSliderPanel } from './time-slider-panel';
import schema from '../schema.json';
import defaultConfig from '../default-config-time-slider-panel.json';
import { SliderProps } from './time-slider-types';

export interface LayerProps {
  layerPath: string;
  layerName: string;
}
export interface SliderFilterProps {
  title: string;
  description: string;
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
   * Return the schema that is defined for this package
   *
   * @returns {AnySchemaObject} returns the schema for this package
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
      timeSlider: {
        title: 'Time Slider',
        panel: {
          noLayers: 'No layers with temporal data',
        },
        slider: {
          unlockRight: 'Unlock right handle',
          unlockLeft: 'Unlock left handle',
          lockRight: 'Lock right handle',
          lockLeft: 'Lock left handle',
          disableFilter: 'Disable Filtering',
          enableFilter: 'Enable Filtering',
          pauseAnimation: 'Pause animation',
          playAnimation: 'Play animation',
          back: 'Back',
          forward: 'Forward',
          changeDirection: 'Change animation direction',
          timeDelay: 'Animation time delay',
        },
        instructions: 'Time Slider Instructions',
      },
    },
    fr: {
      timeSlider: {
        title: 'Curseur Temporel',
        panel: {
          noLayers: 'Pas de couches avec des données temporelles',
        },
        slider: {
          unlockRight: 'Déverrouiller la poignée droite',
          unlockLeft: 'Déverrouiller la poignée gauche',
          lockRight: 'Verrouiller la poignée droite',
          lockLeft: 'Verrouiller la poignée gauche',
          disableFilter: 'Désactiver le filtrage',
          enableFilter: 'Activer le filtrage',
          pauseAnimation: `Pause de l'animation`,
          playAnimation: `Jouer l'animation`,
          back: 'Retour',
          forward: 'En avant',
          changeDirection: `Changer la direction de l'animation`,
          timeDelay: `Délai d'animation`,
        },
        instructions: 'Instructions Curseur Temporel',
      },
    },
  });

  onCreateContentProps = (): TypeTabs => {
    // Set custom time dimension if applicable
    this.configObj.sliders.forEach((obj: SliderProps) => {
      if (obj.temporalDimension) {
        const timeDimension: TimeDimension = {
          field: obj.temporalDimension.field,
          default: obj.temporalDimension.default,
          unitSymbol: obj.temporalDimension.unitSymbol,
          nearestValues: obj.temporalDimension.nearestValues,
          range: api.dateUtilities.createRangeOGC(obj.temporalDimension.range as unknown as string),
          singleHandle: obj.temporalDimension.singleHandle,
        };
        api.maps[this.pluginProps.mapId].layer.geoviewLayer(obj.layerPaths[0]).setTemporalDimension(obj.layerPaths[0], timeDimension);
      }

      // Set override default value under time dimension if applicable
      if (obj.defaultValue) {
        const layerPath = obj.layerPaths[0];
        const timeDimension = api.maps[this.pluginProps.mapId].layer.geoviewLayer(layerPath).layerTemporalDimension[layerPath];
        api.maps[this.pluginProps.mapId].layer.geoviewLayer(layerPath).setTemporalDimension(layerPath, {
          ...timeDimension,
          default: obj.defaultValue,
        });
      }
    });

    return {
      id: 'time-slider',
      value: this.value!,
      label: 'timeSlider.title',
      icon: <TimeSliderIcon />,
      content: <TimeSliderPanel mapId={this.pluginProps.mapId} configObj={this.configObj} />,
    };
  };
}

export default TimeSliderPlugin;

// Keep a reference to the Time Slider Plugin as part of the geoviewPlugins property stored in the window object
window.geoviewPlugins = window.geoviewPlugins || {};
window.geoviewPlugins['time-slider'] = Cast<TimeSliderPlugin>(TimeSliderPlugin);
