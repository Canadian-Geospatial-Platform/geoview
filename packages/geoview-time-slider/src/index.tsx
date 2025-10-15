import React from 'react'; // GV This import is to validate that we're on the right React at the end of the file
import type { TypeTabs } from 'geoview-core/ui/tabs/tabs';
import { AbstractGVLayer } from 'geoview-core/geo/layer/gv-layers/abstract-gv-layer';
import { TimeSliderIcon } from 'geoview-core/ui';
import { FooterPlugin } from 'geoview-core/api/plugin/footer-plugin';
import { TimeSliderEventProcessor } from 'geoview-core/api/event-processors/event-processor-children/time-slider-event-processor';

import { TimeSliderPanel } from './time-slider-panel';
import schema from '../schema.json';
import defaultConfig from '../default-config-time-slider-panel.json';
import type { ConfigProps } from './time-slider-types';

export interface SliderFilterProps {
  title: string;
  description: string;
  range: string[];
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
   * @returns {unknown} returns the schema for this package
   */
  override schema(): unknown {
    return schema;
  }

  /**
   * Return the default config for this package
   *
   * @returns {unknown} the default config
   */
  override defaultConfig(): unknown {
    return defaultConfig;
  }

  /**
   * Overrides the default translations for the Plugin.
   * @returns {Record<string, unknown>} - The translations object for the particular Plugin.
   */
  override defaultTranslations(): Record<string, unknown> {
    return {
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
            disableFilter: 'Disable Time Filtering',
            enableFilter: 'Enable Time Filtering',
            pauseAnimation: 'Pause animation',
            playAnimation: 'Play animation',
            back: 'Back',
            forward: 'Forward',
            changeDirection: 'Change animation direction',
            timeDelay: 'Animation delay',
            stepValue: 'Step value',
            hour: 'Hour',
            day: 'Day',
            week: 'Week',
            month: 'Month',
            year: 'Year',
          },
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
            disableFilter: 'Désactiver le filtrage temporel',
            enableFilter: 'Activer le filtrage temporel',
            pauseAnimation: `Pause de l'animation`,
            playAnimation: `Jouer l'animation`,
            back: 'Retour',
            forward: 'En avant',
            changeDirection: `Changer la direction de l'animation`,
            timeDelay: `Délai d'animation`,
            stepValue: 'Valeur du saut',
            hour: 'Heure',
            day: 'Jour',
            week: 'Semaine',
            month: 'Mois',
            year: 'Année',
          },
        },
      },
    };
  }

  /**
   * Overrides the getConfig in order to return the right type.
   * @returns {ConfigProps} The Swiper config
   */
  override getConfig(): ConfigProps {
    // Redirect
    return super.getConfig() as ConfigProps;
  }

  /**
   * Overrides the creation of the content properties of this TimeSlider Footer Plugin.
   * @returns {TypeTabs} The TypeTabs for the TimeSlider Footer Plugin
   */
  override onCreateContentProps(): TypeTabs {
    return {
      id: 'time-slider',
      value: this.value!,
      label: 'timeSlider.title',
      icon: <TimeSliderIcon />,
      // Config is not needed as the store keeps track of values
      content: <TimeSliderPanel mapId={this.mapViewer.mapId} />,
    };
  }

  /**
   * Overrides the addition of the TimeSlider Footer Plugin to make sure to set the time slider configs in the store and apply filters.
   */
  override onAdd(): void {
    // Once the map is ready we can initialize the time slider. Layers will be registered for the time slider as they load.
    if (this.mapViewer.mapReady) {
      this.initTimeSliderPlugin();
    } else {
      this.mapViewer.onMapReady(() => {
        this.initTimeSliderPlugin();
      });
    }

    // Call parent
    super.onAdd();
  }

  /**
   * Initializes the Time Slider Plugin once the layers are all 'processed'.
   */
  initTimeSliderPlugin(): void {
    // Now the layerTimeDimension should be good on the layers
    const orderedLayerPaths = this.mapViewer.layer.getLayerEntryConfigIds();
    const initialTimeSliderLayerPaths = this.#filterTimeSliderLayers(orderedLayerPaths);
    if (initialTimeSliderLayerPaths) {
      initialTimeSliderLayerPaths.forEach((layerPath) => {
        // Get the layer
        const layer = this.mapViewer.layer.getGeoviewLayer(layerPath);

        // Get the time slider config for the layer
        const timesliderConfig = this.getConfig().sliders.find((slider) => slider.layerPaths.includes(layerPath));

        // If the layer was found and of right type
        if (layer instanceof AbstractGVLayer) {
          // Check and add time slider layer when needed
          TimeSliderEventProcessor.checkInitTimeSliderLayerAndApplyFilters(this.mapViewer.mapId, layer, timesliderConfig);
        }
      });
    }
  }

  /**
   * Filters an array of legend layers to get usable time slider layer paths
   *
   * @param {string[]} layerPaths - Array of layer paths to filter
   * @returns {string[]} A list of usable layer paths
   * @private
   */
  #filterTimeSliderLayers(layerPaths: string[]): string[] {
    const filteredLayerPaths = layerPaths.filter((layerPath) => {
      // Get the layer
      const layer = this.mapViewer.layer.getGeoviewLayer(layerPath);

      // If of the right type
      if (layer instanceof AbstractGVLayer) {
        // Return the temporal dimension for the layer if any
        return layer.getTimeDimension();
      }

      // Skip
      return undefined;
    });
    return filteredLayerPaths;
  }
}

export default TimeSliderPlugin;

// GV This if condition took over 3 days to investigate. It was giving errors on the app.geo.ca website with
// GV some conflicting reacts being loaded on the page for some obscure reason.
// Check if we're on the right react
if (React === window.cgpv.reactUtilities.react) {
  // Keep a reference to the Time Slider Plugin as part of the geoviewPlugins property stored in the window object
  window.geoviewPlugins = window.geoviewPlugins || {};
  window.geoviewPlugins['time-slider'] = TimeSliderPlugin;
} // Else ignore, don't keep it on the window, wait for the right react load
