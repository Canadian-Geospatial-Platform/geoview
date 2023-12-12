import { Cast, AbstractPlugin, TypeWindow, toJsonObject, TypePluginOptions, TypeButtonPanel } from 'geoview-core';
import { TimeSliderIcon } from 'geoview-core/src/ui';
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
      },
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
        id: 'slider',
        value: this.value,
        label: 'timeSlider.title',
        icon: <TimeSliderIcon />,
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
