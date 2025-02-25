import { TypeJsonObject, toJsonObject, AnySchemaObject, Cast } from 'geoview-core/src/core/types/global-types';
import { AppBarPlugin } from 'geoview-core/src/api/plugin/appbar-plugin';
import { TypeIconButtonProps } from 'geoview-core/src/ui/icon-button/icon-button-types';
import { TypePanelProps } from 'geoview-core/src/ui/panel/panel-types';
import { HubOutlinedIcon } from 'geoview-core/src/ui/icons';
import schema from '../schema.json';
import defaultConfig from '../default-config-custom-legend.json';
import { LegendPanel } from './custom-legend';

class LegendPanelPlugin extends AppBarPlugin {
  override schema() {
    throw new Error('Method not implemented.');
  }

  override defaultConfig() {
    throw new Error('Method not implemented.');
  }

  /**
   * Return the package schema

  }

  /**
   * Translations object to inject into the viewer translations
   */
  translations = toJsonObject({
    en: {
      LegendPanel: {
        title: 'Custom Legend',
      },
    },
    fr: {
      LegendPanel: {
        title: 'Légende Personnalisée',
      },
    },
  });

  override onCreateButtonProps(): TypeIconButtonProps {
    return {
      id: 'custom-legend',
      tooltip: 'LegendPanel.title',
      tooltipPlacement: 'right',
      children: <HubOutlinedIcon />,
      visible: true,
    };
  }

  override onCreateContentProps(): TypePanelProps {
    return {
      title: 'LegendPanel.title',
      icon: <HubOutlinedIcon />,
      width: 350,
      status: this.configObj?.isOpen as boolean,
    };
  }

  override onCreateContent = (): JSX.Element => {
    console.log('LegendPanel config:', this.configObj);

    // Ensure config exists and legendList is an array
    const config = this.configObj || {};
    const finalConfig = { isOpen: false, legendList: [], ...config }; // Use default config if needed

    return <LegendPanel config={finalConfig} />;
  };

  /**
   * Function called when the plugin is removed, used for clean-up
   */
  override onRemoved(): void {}
}

export default LegendPanelPlugin;

window.geoviewPlugins = window.geoviewPlugins || {};
window.geoviewPlugins['custom-legend'] = Cast<LegendPanelPlugin>(LegendPanelPlugin);
