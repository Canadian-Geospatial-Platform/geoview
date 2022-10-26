import { Legend } from './legend';

/**
 * API to manage legend component
 *
 * @exports
 * @class
 */
export class LegendApi {
  mapId!: string;

  /**
   * initialize the legend api
   *
   * @param mapId the id of the map this legend belongs to
   */
  constructor(mapId: string) {
    this.mapId = mapId;
  }

  /**
   * Create a legend
   *
   */
  createLegend = () => {
    // TODO emit create legend event instead see issue 576
    // api.event.emit(legendPayload(EVENT_NAMES.FOOTER_TABS.EVENT_LEGEND_CREATE, this.mapId));
    return Legend;
  };
}
