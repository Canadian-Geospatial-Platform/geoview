/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import PanelContent from "./panel-content";

import {
  TypeButtonPanel,
  TypeProps,
  TypeButtonProps,
  TypePanelProps,
} from "geoview-core";

const w = window as any;

/**
 * Create a class for the plugin instance
 */
class DetailsPlugin {
  // id of the plugin
  id: string;

  // plugin properties
  DetailsPluginProps: TypeProps;

  // store the created button panel object
  buttonPanel: TypeButtonPanel | null;

  constructor(id: string, props: TypeProps) {
    this.id = id;
    this.DetailsPluginProps = props;
    this.buttonPanel = null;
  }

  /**
   * translations object to inject to the viewer translations
   */
  translations: TypeProps<TypeProps<string>> = {
    "en-CA": {
      detailsPanel: "Details",
      nothing_found: "Nothing found",
      action_back: "Back",
    },
    "fr-CA": {
      detailsPanel: "Détails",
      nothing_found: "Aucun résultat",
      action_back: "Retour",
    },
  };

  /**
   * Added function called after the plugin has been initialized
   */
  added = (): void => {
    const { mapId } = this.DetailsPluginProps;

    // access the cgpv object from the window object
    const cgpv = w["cgpv"];

    // access the api calls
    const { api } = cgpv;

    const { language } = api.map(mapId);

    // button props
    const button: TypeButtonProps = {
      // set ID to detailsPanel so that it can be accessed from the core viewer
      id: "detailsPanelButton",
      tooltip: this.translations[language].detailsPanel,
      icon: '<i class="material-icons">details</i><div>Test</div>',
      visible: false,
    };

    // panel props
    const panel: TypePanelProps = {
      title: this.translations[language].detailsPanel,
      icon: '<i class="material-icons">details</i>',
      width: 300,
    };

    // create a new button panel on the appbar
    this.buttonPanel = api
      .map(mapId)
      .appBarButtons.createAppbarPanel(button, panel, null);

    // set panel content
    this.buttonPanel?.panel?.changeContent(
      <PanelContent buttonPanel={this.buttonPanel} mapId={mapId} />
    );
  };

  /**
   * Function called when the plugin is removed, used for clean up
   */
  removed(): void {
    const { mapId } = this.DetailsPluginProps;

    // access the cgpv object from the window object
    const cgpv = w["cgpv"];

    // access the api calls
    const { api } = cgpv;

    if (this.buttonPanel) {
      api.map(mapId).appBarButtons.removeAppbarPanel(this.buttonPanel.id);
    }
  }
}

export default DetailsPlugin;

w["plugins"] = w["plugins"] || {};
w["plugins"]["detailsPanel"] = DetailsPlugin;
