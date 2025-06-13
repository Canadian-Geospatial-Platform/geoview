import { TypeJsonObject, toJsonObject, AnySchemaObject } from 'geoview-core/api/config/types/config-types';
import { AppBarPlugin } from 'geoview-core/api/plugin/appbar-plugin';
import { AoiIcon } from 'geoview-core/ui/icons';
import { IconButtonPropsExtend } from 'geoview-core/ui/icon-button/icon-button';
import { TypePanelProps } from 'geoview-core/ui/panel/panel-types';
import { AoiPanel, TypeAoiProps } from './aoi-panel';
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
   * Overrides the default translations for the Plugin.
   * @returns {TypeJsonObject} - The translations object for the particular Plugin.
   */
  override defaultTranslations(): TypeJsonObject {
    return {
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
    } as unknown as TypeJsonObject;
  }

  /**
   * Overrides the getConfig in order to return the right type.
   * @returns {TypeAoiProps} The AOI Propos
   */
  override getConfig(): TypeAoiProps {
    // Redirect
    return super.getConfig() as TypeAoiProps;
  }

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
      status: this.getConfig().isOpen as boolean,
    };
  }

  override onCreateContent = (): JSX.Element => {
    return <AoiPanel mapId={this.pluginProps.mapId} config={this.getConfig()} />;
  };

  /**
   * Function called when the plugin is removed, used for clean up
   */
  override onRemoved(): void {}
}

export default AoiPanelPlugin;

// Keep a reference to the AOI Panel Plugin as part of the geoviewPlugins property stored in the window object
window.geoviewPlugins = window.geoviewPlugins || {};
window.geoviewPlugins['aoi-panel'] = AoiPanelPlugin;
