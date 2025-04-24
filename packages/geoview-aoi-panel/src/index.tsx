import { Cast, TypeJsonObject, toJsonObject, AnySchemaObject } from 'geoview-core/src/api/config/types/config-types';
import { AppBarPlugin } from 'geoview-core/src/api/plugin/appbar-plugin';
import { AoiIcon } from 'geoview-core/src/ui/icons';
import { IconButtonPropsExtend } from 'geoview-core/src/ui/icon-button/icon-button';
import { TypePanelProps } from 'geoview-core/src/ui/panel/panel-types';
import { AoiPanel } from './aoi-panel';
import schema from '../schema.json';
import defaultConfig from '../default-config-aoi-panel.json';

/**
 * Create a class for the plugin instance
 */
class AoiPanelPlugin extends AppBarPlugin {
  /**
   * Return the package schema
   *
   * @returns {AnySchemaObject} the package schema
   */
  override schema(): AnySchemaObject {
    return schema;
  }

  /**
   * Return the default config for this package
   *
   * @returns {TypeJsonObject} the default config
   */
  override defaultConfig(): TypeJsonObject {
    return toJsonObject(defaultConfig);
  }

  /**
   * translations object to inject to the viewer translations
   */
  translations = toJsonObject({
    en: {
      AoiPanel: {
        title: 'Area of Interest',
      },
    },
    fr: {
      AoiPanel: {
        title: "Région d'intérêt",
      },
    },
  });

  override onCreateButtonProps(): IconButtonPropsExtend {
    // Button props
    return {
      id: `aoi-panel`,
      tooltip: 'AoiPanel.title',
      tooltipPlacement: 'right',
      children: <AoiIcon />,
      visible: true,
    };
  }

  override onCreateContentProps(): TypePanelProps {
    // Panel props
    return {
      title: 'AoiPanel.title',
      icon: <AoiIcon />,
      width: 350,
      status: this.configObj?.isOpen as boolean,
    };
  }

  override onCreateContent = (): JSX.Element => {
    return <AoiPanel mapId={this.pluginProps.mapId} config={this.configObj || {}} />;
  };

  /**
   * Function called when the plugin is removed, used for clean up
   */
  override onRemoved(): void {}
}

export default AoiPanelPlugin;

// Keep a reference to the AOI Panel Plugin as part of the geoviewPlugins property stored in the window object
window.geoviewPlugins = window.geoviewPlugins || {};
window.geoviewPlugins['aoi-panel'] = Cast<AoiPanelPlugin>(AoiPanelPlugin);
