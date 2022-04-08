import L from 'leaflet';

import { api } from '../../../../api/api';

import { AbstractWebLayersClass, CONST_LAYER_TYPES, TypeWebLayers, TypeXYZTiles } from '../../../../core/types/cgpv-types';

// TODO: Implement method to validate XYZ tile service
//
// NOTE: The signature of tile services may vary depending of if it's a dynamic or static tile service. Dynamic tile services solutions like TiTiler allows users
// to define query parameters such as a COG url, a TileMatrixSet and a resampling method.
// e.g.: http://{s}.somedomain.com/blabla/{z}/{x}/{y}{r}.png?url=http://smtg/cog.tif&TileMatrixSetId=CanadianNAD83_LCC&resampling_method=bilinear

// TODO: Add more customization (minZoom, maxZoom, TMS)

/**
 * a class to add xyz-tiles layer
 *
 * @export
 * @class XYZTiles
 */
export class XYZTiles extends AbstractWebLayersClass {
  // layer from leaflet
  layer: L.TileLayer | null = null;

  /**
   * Initialize layer
   *
   * @param {string} mapId the id of the map
   * @param {TypeXYZTiles} layerConfig the layer configuration
   */
  constructor(mapId: string, layerConfig: TypeXYZTiles) {
    super(CONST_LAYER_TYPES.XYZ_TILES as TypeWebLayers, layerConfig, mapId);
  }

  /**
   * Add a XYZ Tiles layer to the map.
   *
   * @param {TypeXYZTiles} layer the layer configuration
   * @return {Promise<L.TileLayer | null>} layers to add to the map
   */
  add(layer: TypeXYZTiles): Promise<L.TileLayer | null> {
    const tileLayer = new Promise<L.TileLayer | null>((resolve) => {
      const xyzTileLayer = L.tileLayer(layer.url[api.map(this.mapId).getLanguageCode()]);

      resolve(xyzTileLayer || null);
    });
    return tileLayer;
  }

  /**
   * Set Layer Opacity
   * @param {number} opacity layer opacity
   */
  setOpacity = (opacity: number) => {
    (this.layer as L.TileLayer).setOpacity(opacity);
  };

  /**
   * Get bounds through Leaflet built-in functions
   *
   * @returns {L.LatLngBounds} layer bounds
   */
  getBounds = (): L.LatLngBounds =>
    L.latLngBounds([
      [-85.05112877980660357, -180],
      [85.05112877980660357, 180],
    ]);
}
