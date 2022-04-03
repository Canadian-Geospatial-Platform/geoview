<<<<<<< HEAD:packages/geoview-core/src/geo/layer/web-layers/map-tile/xyz-tiles.ts
import L from 'leaflet';

import { AbstractWebLayersClass, TypeLayerConfig } from '../../../../core/types/cgpv-types';
=======
import L, { Layer } from 'leaflet';

import { TypeLayerConfig } from '../../../core/types/cgpv-types';
import { generateId } from '../../../core/utils/utilities';
>>>>>>> 2494732ad4a7a2c68e059d9d1877b2d59d665d4d:packages/geoview-core/src/geo/layer/map-tile/xyz-tiles.ts

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
<<<<<<< HEAD:packages/geoview-core/src/geo/layer/web-layers/map-tile/xyz-tiles.ts
export class XYZTiles extends AbstractWebLayersClass {
=======
export class XYZTiles {
  // layer id with default
  id: string;

  // layer name with default
  name?: string = 'XYZ Tiles';

  // layer type
  type: string;

>>>>>>> 2494732ad4a7a2c68e059d9d1877b2d59d665d4d:packages/geoview-core/src/geo/layer/map-tile/xyz-tiles.ts
  // layer from leaflet
  layer: L.TileLayer | null = null;

  /**
   * Initialize layer
   *
   * @param {TypeLayerConfig} layerConfig the layer configuration
   */
  constructor(layerConfig: TypeLayerConfig) {
<<<<<<< HEAD:packages/geoview-core/src/geo/layer/web-layers/map-tile/xyz-tiles.ts
    super('xyzTiles', 'XYZ Tiles', layerConfig);
=======
    this.id = layerConfig.id || generateId('');
    if ('name' in layerConfig) this.name = layerConfig.name;
    this.type = layerConfig.type;
    this.url = layerConfig.url;
    this.layer = new Layer();
>>>>>>> 2494732ad4a7a2c68e059d9d1877b2d59d665d4d:packages/geoview-core/src/geo/layer/map-tile/xyz-tiles.ts
  }

  /**
   * Add a XYZ Tiles layer to the map.
   *
   * @param {TypeLayerConfig} layer the layer configuration
   * @return {Promise<L.TileLayer | null>} layers to add to the map
   */
  add(layer: TypeLayerConfig): Promise<L.TileLayer | null> {
    const tileLayer = new Promise<L.TileLayer | null>((resolve) => {
      const xyzTileLayer = L.tileLayer(layer.url);

      resolve(xyzTileLayer);
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
