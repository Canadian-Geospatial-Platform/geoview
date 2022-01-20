import { CRS } from "leaflet";
import { api } from "../../api/api";

/**
 * A class that manages the projection for the loaded map
 *
 * @export
 * @class Projection
 */
export class Projection {
  private crs?: CRS;

  /**
   * initialize projection
   *
   * @param {number} projection projection number
   */
  constructor(projection?: number) {
    // if projection was provided to the constructor then initialize crs
    if (projection) {
      this.setCRS(projection);
    }
  }

  /**
   * Set the CRS from the provided projection
   *
   * @param projection the projection to use
   */
  setCRS = (projection: number): void => {
    this.crs =
      projection === 3857
        ? CRS.EPSG3857
        : api.projection.getProjection(projection);
  };

  /**
   * Get the CRS that was set by the used projection
   *
   * @returns the crs being used in the map
   */
  getCRS = (): CRS => {
    return this.crs!;
  };
}
