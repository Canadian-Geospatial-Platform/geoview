/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable block-scoped-var, no-var, vars-on-top, no-param-reassign */
import TileLayer from 'ol/layer/Tile';
import { Options as TileOptions } from 'ol/layer/BaseTile';
import XYZ, { Options as SourceOptions } from 'ol/source/XYZ';
import TileGrid, { Options as TileGridOptions } from 'ol/tilegrid/TileGrid';
import { transformExtent } from 'ol/proj';
import { Extent } from 'ol/extent';

import defaultsDeep from 'lodash/defaultsDeep';
import { AbstractGeoViewLayer, CONST_LAYER_TYPES } from '../abstract-geoview-layers';
import { AbstractGeoViewRaster, TypeBaseRasterLayer } from './abstract-geoview-raster';
import {
  TypeLayerEntryConfig,
  TypeSourceTileInitialConfig,
  TypeTileLayerEntryConfig,
  TypeGeoviewLayerConfig,
  TypeListOfLayerEntryConfig,
  layerEntryIsGroupLayer,
  TypeLocalizedString,
} from '@/geo/map/map-schema-types';
import { getLocalizedValue, getMinOrMaxExtents, getXMLHttpRequest } from '@/core/utils/utilities';
import { Cast, toJsonObject } from '@/core/types/global-types';
import { api } from '@/app';
import { Layer } from '../../layer';
import { LayerSetPayload } from '@/api/events/payloads';

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
 * type guard function that redefines a TypeGeoviewLayerConfig as a TypeXYZTilesConfig if the geoviewLayerType attribute of the
 * verifyIfLayer parameter is XYZ_TILES. The type ascention applies only to the true block of the if clause that use this
 * function.
 *
 * @param {TypeGeoviewLayerConfig} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const layerConfigIsXYZTiles = (verifyIfLayer: TypeGeoviewLayerConfig): verifyIfLayer is TypeXYZTilesConfig => {
  return verifyIfLayer?.geoviewLayerType === CONST_LAYER_TYPES.XYZ_TILES;
};

/** *****************************************************************************************************************************
 * type guard function that redefines an AbstractGeoViewLayer as an XYZTiles if the type attribute of the verifyIfGeoViewLayer
 * parameter is XYZ_TILES. The type ascention applies only to the true block of the if clause that use this function.
 *
 * @param {AbstractGeoViewLayer} verifyIfGeoViewLayer Polymorphic object to test in order to determine if the type ascention
 * is valid
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const geoviewLayerIsXYZTiles = (verifyIfGeoViewLayer: AbstractGeoViewLayer): verifyIfGeoViewLayer is XYZTiles => {
  return verifyIfGeoViewLayer?.type === CONST_LAYER_TYPES.XYZ_TILES;
};

/** *****************************************************************************************************************************
 * type guard function that redefines a TypeLayerEntryConfig as a TypeXYZTilesLayerEntryConfig if the geoviewLayerType attribute
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
  return verifyIfGeoViewEntry?.geoviewRootLayer?.geoviewLayerType === CONST_LAYER_TYPES.XYZ_TILES;
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
   * Extract the type of the specified field from the metadata. If the type can not be found, return 'string'.
   *
   * @param {string} fieldName field name for which we want to get the type.
   * @param {TypeLayerEntryConfig} layerConfig layer configuration.
   *
   * @returns {'string' | 'date' | 'number'} The type of the field.
   */
  protected getFieldType(fieldName: string, layerConfig: TypeLayerEntryConfig): 'string' | 'date' | 'number' {
    const fieldDefinitions = this.layerMetadata[Layer.getLayerPath(layerConfig)].source.featureInfo;
    const fieldIndex = getLocalizedValue(Cast<TypeLocalizedString>(fieldDefinitions.outfields), this.mapId)?.split(',').indexOf(fieldName);
    if (!fieldIndex || fieldIndex === -1) return 'string';
    return (fieldDefinitions.fieldTypes as string).split(',')[fieldIndex!] as 'string' | 'date' | 'number';
  }

  /** ***************************************************************************************************************************
   * This method recursively validates the layer configuration entries by filtering and reporting invalid layers. If needed,
   * extra configuration may be done here.
   *
   * @param {TypeListOfLayerEntryConfig} listOfLayerEntryConfig The list of layer entries configuration to validate.
   */
  protected validateListOfLayerEntryConfig(listOfLayerEntryConfig: TypeListOfLayerEntryConfig) {
    this.changeLayerPhase('validateListOfLayerEntryConfig');
    listOfLayerEntryConfig.forEach((layerEntryConfig: TypeLayerEntryConfig) => {
      const layerPath = Layer.getLayerPath(layerEntryConfig);
      if (layerEntryIsGroupLayer(layerEntryConfig)) {
        this.validateListOfLayerEntryConfig(layerEntryConfig.listOfLayerEntryConfig!);
        if (!layerEntryConfig.listOfLayerEntryConfig.length) {
          this.layerLoadError.push({
            layer: layerPath,
            consoleMessage: `Empty layer group (mapId:  ${this.mapId}, layerPath: ${layerPath})`,
          });
          this.changeLayerStatus('error', layerEntryConfig);
          return;
        }
      }

      this.changeLayerStatus('loading', layerEntryConfig);

      // When no metadata are provided, all layers are considered valid.
      if (!this.metadata) return;

      // Note that XYZ metadata as we defined it does not contains metadata layer group. If you need geogson layer group,
      // you can define them in the configuration section.
      if (Array.isArray(this.metadata?.listOfLayerEntryConfig)) {
        const metadataLayerList = Cast<TypeLayerEntryConfig[]>(this.metadata?.listOfLayerEntryConfig);
        const foundEntry = metadataLayerList.find((layerMetadata) => layerMetadata.layerId === layerEntryConfig.layerId);
        if (!foundEntry) {
          this.layerLoadError.push({
            layer: layerPath,
            consoleMessage: `XYZ layer not found (mapId:  ${this.mapId}, layerPath: ${layerPath})`,
          });
          this.changeLayerStatus('error', layerEntryConfig);
          return;
        }
        return;
      }

      throw new Error(
        `Invalid GeoJSON metadata (listOfLayerEntryConfig) prevent loading of layer (mapId:  ${this.mapId}, layerPath: ${layerPath})`
      );
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
      this.changeLayerPhase('processOneLayerEntry', layerEntryConfig);
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
      // layerEntryConfig.initialSettings cannot be undefined because config-validation set it to {} if it is undefined.
      if (layerEntryConfig.initialSettings?.className !== undefined)
        tileLayerOptions.className = layerEntryConfig.initialSettings?.className;
      if (layerEntryConfig.initialSettings?.extent !== undefined) tileLayerOptions.extent = layerEntryConfig.initialSettings?.extent;
      if (layerEntryConfig.initialSettings?.maxZoom !== undefined) tileLayerOptions.maxZoom = layerEntryConfig.initialSettings?.maxZoom;
      if (layerEntryConfig.initialSettings?.minZoom !== undefined) tileLayerOptions.minZoom = layerEntryConfig.initialSettings?.minZoom;
      if (layerEntryConfig.initialSettings?.opacity !== undefined) tileLayerOptions.opacity = layerEntryConfig.initialSettings?.opacity;
      if (layerEntryConfig.initialSettings?.visible !== undefined)
        tileLayerOptions.visible =
          layerEntryConfig.initialSettings?.visible === 'yes' || layerEntryConfig.initialSettings?.visible === 'always';

      layerEntryConfig.olLayer = new TileLayer(tileLayerOptions);

      super.addLoadendListener(layerEntryConfig, 'tile');

      resolve(layerEntryConfig.olLayer);
    });
    return promisedVectorLayer;
  }

  /** ***************************************************************************************************************************
   * This method is used to process the layer's metadata. It will fill the empty fields of the layer's configuration (renderer,
   * initial settings, fields and aliases).
   *
   * @param {TypeVectorLaTypeLayerEntryConfigyerEntryConfig} layerEntryConfig The layer entry configuration to process.
   *
   * @returns {Promise<void>} A promise that the vector layer configuration has its metadata processed.
   */
  protected processLayerMetadata(layerEntryConfig: TypeLayerEntryConfig): Promise<void> {
    const promiseOfExecution = new Promise<void>((resolve) => {
      if (!this.metadata) resolve();
      else {
        const metadataLayerConfigFound = Cast<TypeXYZTilesLayerEntryConfig[]>(this.metadata?.listOfLayerEntryConfig).find(
          (metadataLayerConfig) => metadataLayerConfig.layerId === layerEntryConfig.layerId
        );
        // metadataLayerConfigFound can not be undefined because we have already validated the config exist
        this.layerMetadata[Layer.getLayerPath(layerEntryConfig)] = toJsonObject(metadataLayerConfigFound);
        layerEntryConfig.source = defaultsDeep(layerEntryConfig.source, metadataLayerConfigFound!.source);
        layerEntryConfig.initialSettings = defaultsDeep(layerEntryConfig.initialSettings, metadataLayerConfigFound!.initialSettings);

        if (layerEntryConfig.initialSettings?.extent)
          layerEntryConfig.initialSettings.extent = transformExtent(
            layerEntryConfig.initialSettings.extent,
            'EPSG:4326',
            `EPSG:${api.maps[this.mapId].currentProjection}`
          );

        resolve();
      }
    });
    return promiseOfExecution;
  }

  /** ***************************************************************************************************************************
   * Get the bounds of the layer represented in the layerConfig, returns updated bounds
   *
   * @param {TypeLayerEntryConfig} layerConfig Layer config to get bounds from.
   * @param {Extent | undefined} bounds The current bounding box to be adjusted.
   *
   * @returns {Extent} The layer bounding box.
   */
  getBounds(layerConfig: TypeLayerEntryConfig, bounds: Extent | undefined): Extent | undefined {
    const layerBounds = (layerConfig.olLayer as TileLayer<XYZ>).getSource()?.getTileGrid()?.getExtent();
    const projection =
      (layerConfig.olLayer as TileLayer<XYZ>).getSource()?.getProjection()?.getCode().replace('EPSG:', '') ||
      api.maps[this.mapId].currentProjection;

    if (layerBounds) {
      const transformedBounds = transformExtent(layerBounds, `EPSG:${projection}`, `EPSG:4326`);
      if (!bounds) bounds = [transformedBounds[0], transformedBounds[1], transformedBounds[2], transformedBounds[3]];
      else bounds = getMinOrMaxExtents(bounds, transformedBounds);
    }

    return bounds;
  }
}
