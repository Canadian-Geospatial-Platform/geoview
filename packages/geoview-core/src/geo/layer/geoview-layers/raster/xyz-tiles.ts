import TileLayer from 'ol/layer/Tile';
import { Options as TileOptions } from 'ol/layer/BaseTile';
import XYZ, { Options as SourceOptions } from 'ol/source/XYZ';
import TileGrid, { Options as TileGridOptions } from 'ol/tilegrid/TileGrid';

import { api } from '../../../../app';
import { AbstractGeoViewLayer, CONST_LAYER_TYPES, TypeGeoviewLayerType } from '../abstract-geoview-layers';
import { AbstractGeoViewRaster, TypeBaseRasterLayer } from './abstract-geoview-raster';
import {
  TypeLayerEntryConfig,
  TypeSourceTileInitialConfig,
  TypeTileLayerEntryConfig,
  TypeGeoviewLayerConfig,
} from '../../../map/map-schema-types';

// TODO: Implement method to validate XYZ tile service
//
// NOTE: The signature of tile services may vary depending of if it's a dynamic or static tile service. Dynamic tile services solutions like TiTiler allows users
// to define query parameters such as a COG url, a TileMatrixSet and a resampling method.
// e.g.: http://{s}.somedomain.com/blabla/{z}/{x}/{y}{r}.png?url=http://smtg/cog.tif&TileMatrixSetId=CanadianNAD83_LCC&resampling_method=bilinear

// TODO: Add more customization (minZoom, maxZoom, TMS)

export interface TypeSourceImageXYZTilesInitialConfig extends Omit<TypeSourceTileInitialConfig, 'sourceType'> {
  sourceType: 'XYZ';
}

export interface TypeXYZTilesLayerEntryConfig extends Omit<TypeTileLayerEntryConfig, 'source'> {
  source: TypeSourceImageXYZTilesInitialConfig;
}

export interface TypeXYZTilesConfig extends Omit<TypeGeoviewLayerConfig, 'listOfLayerEntryConfig' | 'geoviewLayerType'> {
  geoviewLayerType: 'xyzTiles';
  listOfLayerEntryConfig: TypeXYZTilesLayerEntryConfig[];
}

/** *****************************************************************************************************************************
 * Type Gard function that redefines a TypeGeoviewLayerConfig as a TypeXYZTilesConfig if the geoviewLayerType attribute of the
 * verifyIfLayer parameter is XYZ_TILES. The type ascention applies only to the true block of the if clause that use this
 * function.
 *
 * @param {TypeGeoviewLayerConfig} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid
 *
 * @return {boolean} true if the type ascention is valid
 */
export const layerConfigIsXYZTiles = (verifyIfLayer: TypeGeoviewLayerConfig): verifyIfLayer is TypeXYZTilesConfig => {
  return verifyIfLayer.geoviewLayerType === CONST_LAYER_TYPES.XYZ_TILES;
};

/** *****************************************************************************************************************************
 * Type Gard function that redefines an AbstractGeoViewLayer as an XYZTiles if the type attribute of the verifyIfGeoViewLayer
 * parameter is XYZ_TILES. The type ascention applies only to the true block of the if clause that use this function.
 *
 * @param {AbstractGeoViewLayer} verifyIfGeoViewLayer Polymorphic object to test in order to determine if the type ascention
 * is valid
 *
 * @return {boolean} true if the type ascention is valid
 */
export const geoviewLayerIsXYZTiles = (verifyIfGeoViewLayer: AbstractGeoViewLayer): verifyIfGeoViewLayer is XYZTiles => {
  return verifyIfGeoViewLayer.type === CONST_LAYER_TYPES.XYZ_TILES;
};

/** *****************************************************************************************************************************
 * Type Gard function that redefines a TypeLayerEntryConfig as a TypeXYZTilesLayerEntryConfig if the geoviewLayerType attribute of the
 * verifyIfGeoViewEntry.geoviewLayerParent attribute is XYZ_TILES. The type ascention applies only to the true block of
 * the if clause that use this function.
 *
 * @param {TypeLayerEntryConfig} verifyIfGeoViewEntry Polymorphic object to test in order to determine if the type ascention is valid
 *
 * @return {boolean} true if the type ascention is valid
 */
export const geoviewEntryIsXYZTiles = (
  verifyIfGeoViewEntry: TypeLayerEntryConfig
): verifyIfGeoViewEntry is TypeXYZTilesLayerEntryConfig => {
  return verifyIfGeoViewEntry.geoviewLayerParent!.geoviewLayerType === CONST_LAYER_TYPES.XYZ_TILES;
};

// ******************************************************************************************************************************
// ******************************************************************************************************************************
/** *****************************************************************************************************************************
 * a class to add xyz-tiles layer
 *
 * @exports
 * @class XYZTiles
 */
// ******************************************************************************************************************************
export class XYZTiles extends AbstractGeoViewRaster {
  // layer
  layer!: TileLayer<XYZ>;

  /** ***************************************************************************************************************************
   * Initialize layer
   *
   * @param {string} mapId the id of the map
   * @param {TypeXYZTilesConfig} layerConfig the layer configuration
   */
  constructor(mapId: string, layerConfig: TypeXYZTilesConfig) {
    super(CONST_LAYER_TYPES.XYZ_TILES, layerConfig, mapId);
  }

  /** ****************************************************************************************************************************
   * This method is not used by XYZTiles.
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  getAdditionalServiceDefinition(): void {}

  /** ****************************************************************************************************************************
   * This method creates a GeoView XYZTiles layer using the definition provided in the layerEntry parameter.
   *
   * @param {TypeXYZTilesLayerEntryConfig} layerEntry Information needed to create the GeoView layer.
   *
   * @returns {TypeBaseRasterLayer} The GeoView raster layer that has been created.
   */
  processOneLayerEntry(layerEntry: TypeXYZTilesLayerEntryConfig): TypeBaseRasterLayer {
    const sourceOptions: SourceOptions = {
      url: layerEntry.source.dataAccessPath[api.map(this.mapId).getLanguageCodePrefix()],
    };
    if (typeof layerEntry.source.crossOrigin !== undefined) sourceOptions.crossOrigin = layerEntry.source.crossOrigin;
    if (typeof layerEntry.source.projection !== undefined) sourceOptions.projection = `EPSG:${layerEntry.source.projection}`;
    if (typeof layerEntry.source.tileGrid !== undefined) {
      const tileGridOptions: TileGridOptions = {
        origin: layerEntry.source.tileGrid?.origin,
        resolutions: layerEntry.source.tileGrid?.resolutions as number[],
      };
      if (typeof layerEntry.source.tileGrid?.tileSize !== undefined) tileGridOptions.tileSize = layerEntry.source.tileGrid?.tileSize;
      if (typeof layerEntry.source.tileGrid?.extent !== undefined) tileGridOptions.extent = layerEntry.source.tileGrid?.extent;
      sourceOptions.tileGrid = new TileGrid(tileGridOptions);
    }

    const tileLayerOptions: TileOptions<XYZ> = { source: new XYZ(sourceOptions) };
    if (typeof layerEntry.initialSettings?.className !== undefined) tileLayerOptions.className = layerEntry.initialSettings?.className;
    if (typeof layerEntry.initialSettings?.extent !== undefined) tileLayerOptions.extent = layerEntry.initialSettings?.extent;
    if (typeof layerEntry.initialSettings?.maxZoom !== undefined) tileLayerOptions.maxZoom = layerEntry.initialSettings?.maxZoom;
    if (typeof layerEntry.initialSettings?.minZoom !== undefined) tileLayerOptions.minZoom = layerEntry.initialSettings?.minZoom;
    if (typeof layerEntry.initialSettings?.opacity !== undefined) tileLayerOptions.opacity = layerEntry.initialSettings?.opacity;
    if (typeof layerEntry.initialSettings?.visible !== undefined) tileLayerOptions.visible = layerEntry.initialSettings?.visible;

    const xyzLayer = new TileLayer(tileLayerOptions);

    return xyzLayer;
  }

  /** ****************************************************************************************************************************
   * This method associate a renderer to the GeoView layer.
   *
   * @param {TypeLayerEntryConfig} layerEntry Information needed to create the renderer.
   * @param {TypeBaseRasterLayer} rasterLayer The GeoView layer associated to the renderer.
   */
  setRenderer(layerEntry: TypeLayerEntryConfig, rasterLayer: TypeBaseRasterLayer): void {
    // eslint-disable-next-line no-console
    console.log('This method needs to be coded!');
    // eslint-disable-next-line no-console
    console.log(layerEntry, rasterLayer);
  }

  /** ****************************************************************************************************************************
   * This method register the GeoView layer to panels that offer this possibility.
   *
   * @param {TypeLayerEntryConfig} layerEntry Information needed to create the renderer.
   * @param {TypeBaseRasterLayer} rasterLayer The GeoView layer who wants to register.
   */
  registerToPanels(layerEntry: TypeLayerEntryConfig, rasterLayer: TypeBaseRasterLayer): void {
    // eslint-disable-next-line no-console
    console.log('This method needs to be coded!');
    // eslint-disable-next-line no-console
    console.log(layerEntry, rasterLayer);
  }
}
