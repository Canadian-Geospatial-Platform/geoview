import { Extent } from 'ol/extent';
import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';

import { api } from '../../../../app';

import {
  AbstractWebLayersClass,
  CONST_LAYER_TYPES,
  TypeBaseWebLayersConfig,
  TypeWebLayers,
  TypeXYZTiles,
} from '../../../../core/types/cgpv-types';

// TODO: Implement method to validate XYZ tile service
//
// NOTE: The signature of tile services may vary depending of if it's a dynamic or static tile service. Dynamic tile services solutions like TiTiler allows users
// to define query parameters such as a COG url, a TileMatrixSet and a resampling method.
// e.g.: http://{s}.somedomain.com/blabla/{z}/{x}/{y}{r}.png?url=http://smtg/cog.tif&TileMatrixSetId=CanadianNAD83_LCC&resampling_method=bilinear

// TODO: Add more customization (minZoom, maxZoom, TMS)

/* ******************************************************************************************************************************
 * Type Gard function that redefines a TypeBaseWebLayersConfig as a TypeXYZTiles
 * if the layerType attribute of the verifyIfLayer parameter is XYZ_TILES. The type ascention
 * applies only to the the true block of the if clause that use this function.
 *
 * @param {TypeBaseWebLayersConfig} polymorphic object to test in order to determine if the type ascention is valid
 *
 * @return {boolean} true if the type ascention is valid
 */
export const layerConfigIsXYZTiles = (verifyIfLayer: TypeBaseWebLayersConfig): verifyIfLayer is TypeXYZTiles => {
  return verifyIfLayer.layerType === CONST_LAYER_TYPES.XYZ_TILES;
};

/* ******************************************************************************************************************************
 * Type Gard function that redefines an AbstractWebLayersClass as an XYZTiles
 * if the type attribute of the verifyIfWebLayer parameter is XYZ_TILES. The type ascention
 * applies only to the the true block of the if clause that use this function.
 *
 * @param {AbstractWebLayersClass} polymorphic object to test in order to determine if the type ascention is valid
 *
 * @return {boolean} true if the type ascention is valid
 */
export const webLayerIsXYZTiles = (verifyIfWebLayer: AbstractWebLayersClass): verifyIfWebLayer is XYZTiles => {
  return verifyIfWebLayer.type === CONST_LAYER_TYPES.XYZ_TILES;
};

/**
 * a class to add xyz-tiles layer
 *
 * @exports
 * @class XYZTiles
 */
export class XYZTiles extends AbstractWebLayersClass {
  // layer
  layer!: TileLayer<XYZ>;

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
   * @return {Promise<TileLayer<XYZ> | null>} layers to add to the map
   */
  add(layer: TypeXYZTiles): Promise<TileLayer<XYZ> | null> {
    const tileLayer = new Promise<TileLayer<XYZ> | null>((resolve) => {
      const xyzTileLayer = new TileLayer({
        source: new XYZ({
          url: layer.url[api.map(this.mapId).getLanguageCode()],
        }),
      });

      resolve(xyzTileLayer);
    });
    return tileLayer;
  }

  /**
   * Set Layer Opacity
   * @param {number} opacity layer opacity
   */
  setOpacity = (opacity: number) => {
    this.layer?.setOpacity(opacity);
  };

  /**
   * Get bounds
   *
   * @returns {Extent} layer bounds
   */
  getBounds = (): Extent => this.layer?.getExtent() || [];
}
