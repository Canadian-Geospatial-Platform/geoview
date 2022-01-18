/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import {
  TypeButtonPanel,
  TypeProps,
  TypeButtonProps,
  TypePanelProps,
} from "geoview-core/src/types/cgpv-types";

const w = window as any;

/**
 * Create a class for the plugin instance
 */
class OverviewMapPlugin {
  // id of the plugin
  id: string;

  // plugin properties
  OverviewMapPluginProps: TypeProps;

  constructor(id: string, props: TypeProps) {
    this.id = id;
    this.OverviewMapPluginProps = props;
  }

  /**
   * translations object to inject to the viewer translations
   */
  translations: TypeProps<TypeProps<string>> = {
    "en-CA": {},
    "fr-CA": {},
  };

  /**
   * Added function called after the plugin has been initialized
   */
  added = (): void => {
    const { mapId } = this.OverviewMapPluginProps;

    // access the cgpv object from the window object
    const cgpv = w["cgpv"];

    // access the api calls
    const { api } = cgpv;

    const { language } = api.map(mapId);
  };

  /**
   * Function called when the plugin is removed, used for clean up
   */
  removed(): void {
    const { mapId } = this.OverviewMapPluginProps;

    // access the cgpv object from the window object
    const cgpv = w["cgpv"];

    // access the api calls
    const { api } = cgpv;
  }
}

export default OverviewMapPlugin;

w["plugins"] = w["plugins"] || {};
w["plugins"]["overviewMap"] = OverviewMapPlugin;
