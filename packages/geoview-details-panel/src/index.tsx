/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import {
  AbstractPlugin,
  toJsonObject,
  TypeJsonObject,
  TypeWindow,
  TypePluginOptions,
  TypeButtonPanel,
  TypeIconButtonProps,
  TypePanelProps,
  AnySchemaObject,
} from 'geoview-core';
import { DetailsItem } from './details-item';

import schema from '../schema.json';
import defaultConfig from '../default-config-details-panel.json';

const w = window as TypeWindow;

/**
 * Create a class for the plugin instance
 */
class DetailsPlugin extends AbstractPlugin {
  // store the created button panel object
  buttonPanel: TypeButtonPanel | null;

  constructor(pluginId: string, props: TypePluginOptions) {
    super(pluginId, props);
    this.buttonPanel = null;
  }

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
   * translations object to inject to the viewer translations
   */
  translations = toJsonObject({
    en: {
      detailsPanel: 'Details',
      nothing_found: 'Nothing found',
      click_map: 'Choose a point on the map to start',
      action_back: 'Back',
    },
    fr: {
      detailsPanel: 'Détails',
      nothing_found: 'Aucun résultat',
      click_map: 'Choisissez un point sur la carte pour commencer',
      action_back: 'Retour',
    },
  });

  /**
   * Added function called after the plugin has been initialized
   */
  added(): void {
    const { mapId } = (this as AbstractPlugin).pluginProps;

    // access the cgpv object from the window object
    const { cgpv } = w;

    // access the api calls
    const { api, ui } = cgpv;
    const { DetailsIcon } = ui.elements;
    const { displayLanguage } = api.maps[mapId];

    // button props
    const button: TypeIconButtonProps = {
      id: 'detailsPanelButton',
      tooltip: this.translations[displayLanguage].detailsPanel as string,
      tooltipPlacement: 'right',
      children: <DetailsIcon />,
      visible: true,
    };

    // panel props
    const panel: TypePanelProps = {
      title: this.translations[displayLanguage].detailsPanel,
      icon: '<i class="material-icons">details</i>',
      width: 350,
    };

    // create a new button panel on the app-bar
    this.buttonPanel = api.maps[mapId].appBarButtons.createAppbarPanel(button, panel, null);

    // set panel content
    // TODO line 99 is duplication of line 100, but without the props of DetailsItem, to bypass lint error
    this.buttonPanel?.panel?.changeContent(<DetailsItem />);
    // this.buttonPanel?.panel?.changeContent(<DetailsItem mapId={mapId} buttonId={button.id} />);
  }

  /**
   * Function called when the plugin is removed, used for clean up
   */
  removed(): void {
    const { mapId } = (this as AbstractPlugin).pluginProps;

    // access the cgpv object from the window object
    const { cgpv } = w;

    // access the api calls
    const { api } = cgpv;

    if (this.buttonPanel) {
      api.maps[mapId as string].appBarButtons.removeAppbarPanel(this.buttonPanel.buttonPanelId);
    }
  }
}

export default DetailsPlugin;

w.plugins = w.plugins || {};
w.plugins['details-panel'] = DetailsPlugin as AbstractPlugin;
