import { Cast, TypeIconButtonProps, TypeWindow, toJsonObject, TypePanelProps, TypeJsonObject, AnySchemaObject } from 'geoview-core';
import { AppBarPlugin } from 'geoview-core/src/api/plugin/appbar-plugin';

import { BasemapPanel } from './basemap-panel';
import schema from '../schema.json';
import defaultConfig from '../default-config-basemap-panel.json';

/**
 * Create a class for the plugin instance
 */
class BasemapPanelPlugin extends AppBarPlugin {
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
      basemapPanel: 'Basemaps',
    },
    fr: {
      basemapPanel: 'Fond de carte',
    },
  });

  onCreateButtonProps(): TypeIconButtonProps {
    // Fetch cgpv
    const { cgpv } = window as TypeWindow;
    const { MapIcon } = cgpv.ui.elements;

    // Button props
    return {
      id: 'basemapPanelButton',
      tooltip: this.translations[this.displayLanguage()].basemapPanel as string,
      tooltipPlacement: 'right',
      children: <MapIcon />,
      visible: true,
    };
  }

  onCreateContentProps(): TypePanelProps {
    // Panel props
    return {
      title: this.translations[this.displayLanguage()].basemapPanel,
      icon: '<i class="material-icons">map</i>',
      width: 350,
      status: this.configObj?.isOpen as boolean,
    };
  }

  onCreateContent = (): JSX.Element => {
    return <BasemapPanel mapId={this.pluginProps.mapId} config={this.configObj || {}} />;
  };

  /**
   * Function called when the plugin is removed, used for clean up
   */
  onRemoved(): void {
    // reset basemaps array
    this.api.maps[this.pluginProps.mapId].basemap.basemaps = [];
    // reload default basemap
    this.api.maps[this.pluginProps.mapId].basemap.loadDefaultBasemaps();
  }
}

export default BasemapPanelPlugin;

window.plugins = window.plugins || {};
window.plugins['basemap-panel'] = Cast<BasemapPanelPlugin>(BasemapPanelPlugin);
