/* eslint-disable block-scoped-var, no-var, vars-on-top, no-param-reassign */
import TileLayer from 'ol/layer/Tile';
import { Options as TileOptions } from 'ol/layer/BaseTile';
import XYZ, { Options as SourceOptions } from 'ol/source/XYZ';
import { Coordinate } from 'ol/coordinate';
import TileGrid, { Options as TileGridOptions } from 'ol/tilegrid/TileGrid';
import { Pixel } from 'ol/pixel';
import { transformExtent } from 'ol/proj';
import { Extent } from 'ol/extent';

import { defaultsDeep } from 'lodash';
import { AbstractGeoViewLayer, CONST_LAYER_TYPES } from '../abstract-geoview-layers';
import { AbstractGeoViewRaster, TypeBaseRasterLayer } from './abstract-geoview-raster';
import {
  TypeLayerEntryConfig,
  TypeSourceTileInitialConfig,
  TypeTileLayerEntryConfig,
  TypeGeoviewLayerConfig,
  TypeListOfLayerEntryConfig,
  layerEntryIsGroupLayer,
} from '../../../map/map-schema-types';
import { getLocalizedValue, getXMLHttpRequest } from '../../../../core/utils/utilities';
import { TypeArrayOfRecords } from '../../../../api/events/payloads/get-feature-info-payload';
import { Cast, toJsonObject } from '../../../../core/types/global-types';
import { api } from '../../../../app';
import { Layer } from '../../layer';

// ? Do we keep this TODO ? Dynamic parameters can be placed on the dataAccessPath and initial settings can be used on xyz-tiles.
// TODO: Implement method to validate XYZ tile service
//
// NOTE: The signature of tile services may vary depending of if it's a dynamic or static tile service. Dynamic tile services solutions like TiTiler allows users
// to define query parameters such as a COG url, a TileMatrixSet and a resampling method.
// e.g.: http://{s}.somedomain.com/blabla/{z}/{x}/{y}{r}.png?url=http://smtg/cog.tif&TileMatrixSetId=CanadianNAD83_LCC&resampling_method=bilinear

// TODO: Add more customization (minZoom, maxZoom, TMS)

export type TypeSourceImageXYZTilesInitialConfig = TypeSourceTileInitialConfig;

export interface TypeXYZTilesLayerEntryConfig extends Omit<TypeTileLayerEntryConfig, 'source'> {
  source: TypeSourceImageXYZTilesInitialConfig;
}

export interface TypeXYZTilesConfig extends Omit<TypeGeoviewLayerConfig, 'listOfLayerEntryConfig'> {
  geoviewLayerType: 'xyzTiles';
  listOfLayerEntryConfig: TypeXYZTilesLayerEntryConfig[];
}

/** *****************************************************************************************************************************
 * Type Gard function that redefines a TypeGeoviewLayerConfig as a TypeXYZTilesConfig if the geoviewLayerType attribute of the
 * verifyIfLayer parameter is XYZ_TILES. The type ascention applies only to the true block of the if clause that use this
 * function.
 *
 * @param {TypeGeoviewLayerConfig} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
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
 * @returns {boolean} true if the type ascention is valid.
 */
export const geoviewLayerIsXYZTiles = (verifyIfGeoViewLayer: AbstractGeoViewLayer): verifyIfGeoViewLayer is XYZTiles => {
  return verifyIfGeoViewLayer.type === CONST_LAYER_TYPES.XYZ_TILES;
};

/** *****************************************************************************************************************************
 * Type Gard function that redefines a TypeLayerEntryConfig as a TypeXYZTilesLayerEntryConfig if the geoviewLayerType attribute
 * of the verifyIfGeoViewEntry.geoviewRootLayer attribute is XYZ_TILES. The type ascention applies only to the true block of
 * the if clause that use this function.
 *
 * @param {TypeLayerEntryConfig} verifyIfGeoViewEntry Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const geoviewEntryIsXYZTiles = (
  verifyIfGeoViewEntry: TypeLayerEntryConfig
): verifyIfGeoViewEntry is TypeXYZTilesLayerEntryConfig => {
  return verifyIfGeoViewEntry.geoviewRootLayer!.geoviewLayerType === CONST_LAYER_TYPES.XYZ_TILES;
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

  /** ***************************************************************************************************************************
   * This method reads the service metadata from the metadataAccessPath.
   *
   * @returns {Promise<void>} A promise that the execution is completed.
   */
  protected getServiceMetadata(): Promise<void> {
    const promisedExecution = new Promise<void>((resolve) => {
      const metadataUrl = getLocalizedValue(this.metadataAccessPath, this.mapId);
      if (metadataUrl) {
        getXMLHttpRequest(`${metadataUrl}?f=json`).then((metadataString) => {
          if (metadataString === '{}')
            throw new Error(`Cant't read service metadata for GeoView layer ${this.geoviewLayerId} of map ${this.mapId}.`);
          else {
            this.metadata = toJsonObject(JSON.parse(metadataString));
            const { copyrightText } = this.metadata;
            if (copyrightText) this.attributions.push(copyrightText as string);
            resolve();
          }
        });
      } else resolve();
    });
    return promisedExecution;
  }

  /** ***************************************************************************************************************************
   * This method recursively validates the layer configuration entries by filtering and reporting invalid layers. If needed,
   * extra configuration may be done here.
   *
   * @param {TypeListOfLayerEntryConfig} listOfLayerEntryConfig The list of layer entries configuration to validate.
   *
   * @returns {TypeListOfLayerEntryConfig} A new list of layer entries configuration with deleted error layers.
   */
  protected validateListOfLayerEntryConfig(listOfLayerEntryConfig: TypeListOfLayerEntryConfig): TypeListOfLayerEntryConfig {
    return listOfLayerEntryConfig.filter((layerEntryConfig: TypeLayerEntryConfig) => {
      if (api.map(this.mapId).layer.isRegistered(layerEntryConfig)) {
        this.layerLoadError.push({
          layer: Layer.getLayerPath(layerEntryConfig),
          consoleMessage: `Duplicate layerId (mapId:  ${this.mapId}, layerPath: ${Layer.getLayerPath(layerEntryConfig)})`,
        });
        return false;
      }

      if (layerEntryIsGroupLayer(layerEntryConfig)) {
        layerEntryConfig.listOfLayerEntryConfig = this.validateListOfLayerEntryConfig(layerEntryConfig.listOfLayerEntryConfig!);
        if (layerEntryConfig.listOfLayerEntryConfig.length) {
          api.map(this.mapId).layer.registerLayerConfig(layerEntryConfig);
          return true;
        }
        this.layerLoadError.push({
          layer: Layer.getLayerPath(layerEntryConfig),
          consoleMessage: `Empty layer group (mapId:  ${this.mapId}, layerPath: ${Layer.getLayerPath(layerEntryConfig)})`,
        });
        return false;
      }

      // When no metadata are provided, all layers are considered valid.
      if (!this.metadata) {
        api.map(this.mapId).layer.registerLayerConfig(layerEntryConfig);
        return true;
      }

      // Note that geojson metadata as we defined it does not contains layer group. If you need geogson layer group,
      // you can define them in the configuration section.
      if (Array.isArray(this.metadata?.listOfLayerEntryConfig)) {
        const metadataLayerList = Cast<TypeLayerEntryConfig[]>(this.metadata?.listOfLayerEntryConfig);
        for (var i = 0; i < metadataLayerList.length; i++) if (metadataLayerList[i].layerId === layerEntryConfig.layerId) break;
        if (i === metadataLayerList.length) {
          this.layerLoadError.push({
            layer: Layer.getLayerPath(layerEntryConfig),
            consoleMessage: `GeoJSON layer not found (mapId:  ${this.mapId}, layerPath: ${Layer.getLayerPath(layerEntryConfig)})`,
          });
          return false;
        }
        api.map(this.mapId).layer.registerLayerConfig(layerEntryConfig);
        return true;
      }
      this.layerLoadError.push({
        layer: Layer.getLayerPath(layerEntryConfig),
        consoleMessage: `Invalid GeoJSON metadata (listOfLayerEntryConfig) prevent loading of layer (mapId:  ${
          this.mapId
        }, layerPath: ${Layer.getLayerPath(layerEntryConfig)})`,
      });
      return false;
    });
  }

  /** ****************************************************************************************************************************
   * This method creates a GeoView XYZTiles layer using the definition provided in the layerEntryConfig parameter.
   *
   * @param {TypeXYZTilesLayerEntryConfig} layerEntryConfig Information needed to create the GeoView layer.
   *
   * @returns {TypeBaseRasterLayer} The GeoView raster layer that has been created.
   */
  processOneLayerEntry(layerEntryConfig: TypeXYZTilesLayerEntryConfig): Promise<TypeBaseRasterLayer | null> {
    const promisedVectorLayer = new Promise<TypeBaseRasterLayer | null>((resolve) => {
      const sourceOptions: SourceOptions = {
        url: getLocalizedValue(layerEntryConfig.source.dataAccessPath, this.mapId),
      };
      if (layerEntryConfig.source.crossOrigin) sourceOptions.crossOrigin = layerEntryConfig.source.crossOrigin;
      if (layerEntryConfig.source.projection) sourceOptions.projection = `EPSG:${layerEntryConfig.source.projection}`;
      if (layerEntryConfig.source.tileGrid) {
        const tileGridOptions: TileGridOptions = {
          origin: layerEntryConfig.source.tileGrid?.origin,
          resolutions: layerEntryConfig.source.tileGrid?.resolutions as number[],
        };
        if (layerEntryConfig.source.tileGrid?.tileSize) tileGridOptions.tileSize = layerEntryConfig.source.tileGrid?.tileSize;
        if (layerEntryConfig.source.tileGrid?.extent) tileGridOptions.extent = layerEntryConfig.source.tileGrid?.extent;
        sourceOptions.tileGrid = new TileGrid(tileGridOptions);
      }

      const tileLayerOptions: TileOptions<XYZ> = { source: new XYZ(sourceOptions) };
      if (layerEntryConfig.initialSettings?.className !== undefined)
        tileLayerOptions.className = layerEntryConfig.initialSettings?.className;
      if (layerEntryConfig.initialSettings?.extent !== undefined) tileLayerOptions.extent = layerEntryConfig.initialSettings?.extent;
      if (layerEntryConfig.initialSettings?.maxZoom !== undefined) tileLayerOptions.maxZoom = layerEntryConfig.initialSettings?.maxZoom;
      if (layerEntryConfig.initialSettings?.minZoom !== undefined) tileLayerOptions.minZoom = layerEntryConfig.initialSettings?.minZoom;
      if (layerEntryConfig.initialSettings?.opacity !== undefined) tileLayerOptions.opacity = layerEntryConfig.initialSettings?.opacity;
      if (layerEntryConfig.initialSettings?.visible !== undefined) tileLayerOptions.visible = layerEntryConfig.initialSettings?.visible;

      const xyzLayer = new TileLayer(tileLayerOptions);

      resolve(xyzLayer);
    });
    return promisedVectorLayer;
  }

  /** ***************************************************************************************************************************
   * This method is used to process the layer's metadata. It will fill the empty fields of the layer's configuration (renderer,
   * initial settings, fields and aliases).
   *
   * @param {TypeVectorLayerEntryConfig} layerEntryConfig The layer entry configuration to process.
   *
   * @returns {Promise<void>} A promise that the vector layer configuration has its metadata processed.
   */
  protected processLayerMetadata(layerEntryConfig: TypeXYZTilesLayerEntryConfig): Promise<void> {
    const promiseOfExecution = new Promise<void>((resolve) => {
      const metadataLayerList = Cast<TypeXYZTilesLayerEntryConfig[]>(this.metadata?.listOfLayerEntryConfig);
      for (var i = 0; i < metadataLayerList.length; i++) if (metadataLayerList[i].layerId === layerEntryConfig.layerId) break;
      layerEntryConfig.source = defaultsDeep(layerEntryConfig.source, metadataLayerList[i].source);
      layerEntryConfig.initialSettings = defaultsDeep(layerEntryConfig.initialSettings, metadataLayerList[i].initialSettings);
      const extent = layerEntryConfig.initialSettings?.extent;
      if (extent) {
        const layerExtent = transformExtent(extent, 'EPSG:4326', `EPSG:${api.map(this.mapId).currentProjection}`) as Extent;
        layerEntryConfig.initialSettings!.extent = layerExtent;
      }
      resolve();
    });
    return promiseOfExecution;
  }

  /** ***************************************************************************************************************************
   * XYZ tiles return null because these services do not support getFeatureInfo queries. When getFeatureInfo is supported this
   * method returns feature information for all the features around the provided Pixel.
   *
   * @param {Coordinate} location The pixel coordinate that will be used by the query.
   * @param {TypeXYZTilesLayerEntryConfig} layerConfig The layer configuration.
   *
   * @returns {Promise<TypeArrayOfRecords>} The feature info table.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected getFeatureInfoAtPixel(location: Pixel, layerConfig: TypeXYZTilesLayerEntryConfig): Promise<TypeArrayOfRecords> {
    const promisedQueryResult = new Promise<TypeArrayOfRecords>((resolve) => {
      resolve([]);
    });
    return promisedQueryResult;
  }

  /** ***************************************************************************************************************************
   * XYZ tiles return null because these services do not support getFeatureInfo queries. When getFeatureInfo is supported this
   * method returns information for all the features around the provided coordinate.
   *
   * @param {Coordinate} location The coordinate that will be used by the query.
   * @param {TypeXYZTilesLayerEntryConfig} layerConfig The layer configuration.
   *
   * @returns {Promise<TypeArrayOfRecords>} The feature info table.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected getFeatureInfoAtCoordinate(location: Coordinate, layerConfig: TypeXYZTilesLayerEntryConfig): Promise<TypeArrayOfRecords> {
    const promisedQueryResult = new Promise<TypeArrayOfRecords>((resolve) => {
      resolve([]);
    });
    return promisedQueryResult;
  }

  /** ***************************************************************************************************************************
   * XYZ tiles return null because these services do not support getFeatureInfo queries. When getFeatureInfo is supported this
   * method returns feature information for all the features around the provided longitude latitude.
   *
   * @param {Coordinate} location The coordinate that will be used by the query.
   * @param {TypeXYZTilesLayerEntryConfig} layerConfig The layer configuration.
   *
   * @returns {Promise<TypeArrayOfRecords>} The feature info table.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected getFeatureInfoAtLongLat(location: Coordinate, layerConfig: TypeXYZTilesLayerEntryConfig): Promise<TypeArrayOfRecords> {
    const promisedQueryResult = new Promise<TypeArrayOfRecords>((resolve) => {
      resolve([]);
    });
    return promisedQueryResult;
  }

  /** ***************************************************************************************************************************
   * XYZ tiles return null because these services do not support getFeatureInfo queries. When getFeatureInfo is supported this
   * method returns feature information for all the features in the provided bounding box.
   *
   * @param {Coordinate} location The coordinate that will be used by the query.
   * @param {TypeXYZTilesLayerEntryConfig} layerConfig The layer configuration.
   *
   * @returns {Promise<TypeArrayOfRecords>} The feature info table.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected getFeatureInfoUsingBBox(location: Coordinate[], layerConfig: TypeXYZTilesLayerEntryConfig): Promise<TypeArrayOfRecords> {
    const promisedQueryResult = new Promise<TypeArrayOfRecords>((resolve) => {
      resolve([]);
    });
    return promisedQueryResult;
  }

  /** ***************************************************************************************************************************
   * XYZ tiles return null because these services do not support getFeatureInfo queries. When getFeatureInfo is supported this
   * method returns feature information for all the features in the provided polygon.
   *
   * @param {Coordinate} location The coordinate that will be used by the query.
   * @param {TypeXYZTilesLayerEntryConfig} layerConfig The layer configuration.
   *
   * @returns {Promise<TypeArrayOfRecords>} The feature info table.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected getFeatureInfoUsingPolygon(location: Coordinate[], layerConfig: TypeXYZTilesLayerEntryConfig): Promise<TypeArrayOfRecords> {
    const promisedQueryResult = new Promise<TypeArrayOfRecords>((resolve) => {
      resolve([]);
    });
    return promisedQueryResult;
  }
}
