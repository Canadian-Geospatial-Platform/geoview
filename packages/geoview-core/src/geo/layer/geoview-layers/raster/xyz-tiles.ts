/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable block-scoped-var, no-var, vars-on-top, no-param-reassign */
// eslint-disable-next-line max-classes-per-file
import TileLayer from 'ol/layer/Tile';
import { Options as TileOptions } from 'ol/layer/BaseTile';
import XYZ, { Options as SourceOptions } from 'ol/source/XYZ';
import TileGrid, { Options as TileGridOptions } from 'ol/tilegrid/TileGrid';
import { Extent } from 'ol/extent';

import defaultsDeep from 'lodash/defaultsDeep';
import { AbstractGeoViewLayer, CONST_LAYER_TYPES } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { AbstractGeoViewRaster, TypeBaseRasterLayer } from '@/geo/layer/geoview-layers/raster/abstract-geoview-raster';
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
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';

// ? Do we keep this TODO ? Dynamic parameters can be placed on the dataAccessPath and initial settings can be used on xyz-tiles.
// TODO: Implement method to validate XYZ tile service
//
// NOTE: The signature of tile services may vary depending of if it's a dynamic or static tile service. Dynamic tile services solutions like TiTiler allows users
// to define query parameters such as a COG url, a TileMatrixSet and a resampling method.
// e.g.: http://{s}.somedomain.com/blabla/{z}/{x}/{y}{r}.png?url=http://smtg/cog.tif&TileMatrixSetId=CanadianNAD83_LCC&resampling_method=bilinear

// TODO: Add more customization (minZoom, maxZoom, TMS)

export type TypeSourceImageXYZTilesInitialConfig = TypeSourceTileInitialConfig;

export class TypeXYZTilesLayerEntryConfig extends TypeTileLayerEntryConfig {
  declare source: TypeSourceImageXYZTilesInitialConfig;

  /**
   * The class constructor.
   * @param {TypeXYZTilesLayerEntryConfig} layerConfig The layer configuration we want to instanciate.
   */
  constructor(layerConfig: TypeXYZTilesLayerEntryConfig) {
    super(layerConfig);
    Object.assign(this, layerConfig);

    /** layerConfig.source.dataAccessPath is mandatory. */
    if (!this.source.dataAccessPath) {
      throw new Error(
        `source.dataAccessPath on layer entry ${this.layerPath} is mandatory for GeoView layer ${this.geoviewLayerConfig.geoviewLayerId} of type ${this.geoviewLayerConfig.geoviewLayerType}`
      );
    }
  }
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
 * of the verifyIfGeoViewEntry.geoviewLayerConfig attribute is XYZ_TILES. The type ascention applies only to the true block of
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
  return verifyIfGeoViewEntry?.geoviewLayerConfig?.geoviewLayerType === CONST_LAYER_TYPES.XYZ_TILES;
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
    const fieldDefinitions = this.layerMetadata[layerConfig.layerPath].source.featureInfo;
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
    this.setLayerPhase('validateListOfLayerEntryConfig');
    listOfLayerEntryConfig.forEach((layerConfig: TypeLayerEntryConfig) => {
      const { layerPath } = layerConfig;
      if (layerEntryIsGroupLayer(layerConfig)) {
        this.validateListOfLayerEntryConfig(layerConfig.listOfLayerEntryConfig!);
        if (!layerConfig.listOfLayerEntryConfig.length) {
          this.layerLoadError.push({
            layer: layerPath,
            consoleMessage: `Empty layer group (mapId:  ${this.mapId}, layerPath: ${layerPath})`,
          });
          layerConfig.layerStatus = 'error';
          return;
        }
      }

      layerConfig.layerStatus = 'processing';

      // When no metadata are provided, all layers are considered valid.
      if (!this.metadata) return;

      // Note that XYZ metadata as we defined it does not contains metadata layer group. If you need geogson layer group,
      // you can define them in the configuration section.
      if (Array.isArray(this.metadata?.listOfLayerEntryConfig)) {
        const metadataLayerList = Cast<TypeLayerEntryConfig[]>(this.metadata?.listOfLayerEntryConfig);
        const foundEntry = metadataLayerList.find((layerMetadata) => layerMetadata.layerId === layerConfig.layerId);
        if (!foundEntry) {
          this.layerLoadError.push({
            layer: layerPath,
            consoleMessage: `XYZ layer not found (mapId:  ${this.mapId}, layerPath: ${layerPath})`,
          });
          layerConfig.layerStatus = 'error';
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
   * This method creates a GeoView XYZTiles layer using the definition provided in the layerConfig parameter.
   *
   * @param {TypeXYZTilesLayerEntryConfig} layerConfig Information needed to create the GeoView layer.
   *
   * @returns {TypeBaseRasterLayer} The GeoView raster layer that has been created.
   */
  protected processOneLayerEntry(layerConfig: TypeXYZTilesLayerEntryConfig): Promise<TypeBaseRasterLayer | null> {
    const promisedVectorLayer = new Promise<TypeBaseRasterLayer | null>((resolve) => {
      const { layerPath } = layerConfig;
      this.setLayerPhase('processOneLayerEntry', layerPath);
      const sourceOptions: SourceOptions = {
        url: getLocalizedValue(layerConfig.source.dataAccessPath, this.mapId),
      };
      if (layerConfig.source.crossOrigin) {
        sourceOptions.crossOrigin = layerConfig.source.crossOrigin;
      } else {
        sourceOptions.crossOrigin = 'Anonymous';
      }
      if (layerConfig.source.projection) sourceOptions.projection = `EPSG:${layerConfig.source.projection}`;
      if (layerConfig.source.tileGrid) {
        const tileGridOptions: TileGridOptions = {
          origin: layerConfig.source.tileGrid?.origin,
          resolutions: layerConfig.source.tileGrid?.resolutions as number[],
        };
        if (layerConfig.source.tileGrid?.tileSize) tileGridOptions.tileSize = layerConfig.source.tileGrid?.tileSize;
        if (layerConfig.source.tileGrid?.extent) tileGridOptions.extent = layerConfig.source.tileGrid?.extent;
        sourceOptions.tileGrid = new TileGrid(tileGridOptions);
      }

      const tileLayerOptions: TileOptions<XYZ> = { source: new XYZ(sourceOptions) };
      // layerConfig.initialSettings cannot be undefined because config-validation set it to {} if it is undefined.
      if (layerConfig.initialSettings?.className !== undefined) tileLayerOptions.className = layerConfig.initialSettings?.className;
      if (layerConfig.initialSettings?.extent !== undefined) tileLayerOptions.extent = layerConfig.initialSettings?.extent;
      if (layerConfig.initialSettings?.maxZoom !== undefined) tileLayerOptions.maxZoom = layerConfig.initialSettings?.maxZoom;
      if (layerConfig.initialSettings?.minZoom !== undefined) tileLayerOptions.minZoom = layerConfig.initialSettings?.minZoom;
      if (layerConfig.initialSettings?.opacity !== undefined) tileLayerOptions.opacity = layerConfig.initialSettings?.opacity;
      if (layerConfig.initialSettings?.visible !== undefined)
        tileLayerOptions.visible = layerConfig.initialSettings?.visible === 'yes' || layerConfig.initialSettings?.visible === 'always';

      layerConfig.olLayerAndLoadEndListeners = {
        olLayer: new TileLayer(tileLayerOptions),
        loadEndListenerType: 'tile',
      };
      layerConfig.geoviewLayerInstance = this;

      resolve(layerConfig.olLayer);
    });
    return promisedVectorLayer;
  }

  /** ***************************************************************************************************************************
   * This method is used to process the layer's metadata. It will fill the empty fields of the layer's configuration (renderer,
   * initial settings, fields and aliases).
   *
   * @param {TypeLayerEntryConfig} layerConfig The layer entry configuration to process.
   *
   * @returns {Promise<TypeLayerEntryConfig>} A promise that the vector layer configuration has its metadata processed.
   */
  protected processLayerMetadata(layerConfig: TypeLayerEntryConfig): Promise<TypeLayerEntryConfig> {
    const promiseOfExecution = new Promise<TypeLayerEntryConfig>((resolve) => {
      if (this.metadata) {
        const metadataLayerConfigFound = Cast<TypeXYZTilesLayerEntryConfig[]>(this.metadata?.listOfLayerEntryConfig).find(
          (metadataLayerConfig) => metadataLayerConfig.layerId === layerConfig.layerId
        );
        // metadataLayerConfigFound can not be undefined because we have already validated the config exist
        this.layerMetadata[layerConfig.layerPath] = toJsonObject(metadataLayerConfigFound);
        layerConfig.source = defaultsDeep(layerConfig.source, metadataLayerConfigFound!.source);
        layerConfig.initialSettings = defaultsDeep(layerConfig.initialSettings, metadataLayerConfigFound!.initialSettings);

        if (layerConfig.initialSettings?.extent)
          layerConfig.initialSettings.extent = api.projection.transformExtent(
            layerConfig.initialSettings.extent,
            'EPSG:4326',
            `EPSG:${MapEventProcessor.getMapState(this.mapId).currentProjection}`
          );
      }

      // When we get here, we know that the metadata (if the service provide some) are processed.
      // We need to signal to the layer sets that the 'processed' phase is done.
      layerConfig.layerStatus = 'processed';
      // Then, we signal that the loading phase has begun
      layerConfig.layerStatus = 'loading';

      resolve(layerConfig);
    });
    return promiseOfExecution;
  }

  /** ***************************************************************************************************************************
   * Get the bounds of the layer represented in the layerConfig pointed to by the cached layerPath, returns updated bounds
   *
   * @param {Extent | undefined} bounds The current bounding box to be adjusted.
   * @param {never} notUsed This parameter must not be provided. It is there to allow overloading of the method signature.
   *
   * @returns {Extent} The new layer bounding box.
   */
  protected getBounds(bounds: Extent, notUsed?: never): Extent | undefined;

  /** ***************************************************************************************************************************
   * Get the bounds of the layer represented in the layerConfig pointed to by the layerPath, returns updated bounds
   *
   * @param {string} layerPath The Layer path to the layer's configuration.
   * @param {Extent | undefined} bounds The current bounding box to be adjusted.
   *
   * @returns {Extent} The new layer bounding box.
   */
  protected getBounds(layerPath: string, bounds?: Extent): Extent | undefined;

  // See above headers for signification of the parameters. The first lines of the method select the template
  // used based on the parameter types received.
  protected getBounds(parameter1?: string | Extent, parameter2?: Extent): Extent | undefined {
    const layerPath = typeof parameter1 === 'string' ? parameter1 : this.layerPathAssociatedToTheGeoviewLayer;
    let bounds = typeof parameter1 !== 'string' ? parameter1 : parameter2;
    const layerConfig = this.getLayerConfig(layerPath);
    const layerBounds = (layerConfig?.olLayer as TileLayer<XYZ>)?.getSource()?.getTileGrid()?.getExtent();
    const projection =
      (layerConfig?.olLayer as TileLayer<XYZ>).getSource()?.getProjection()?.getCode().replace('EPSG:', '') ||
      MapEventProcessor.getMapState(this.mapId).currentProjection;

    if (layerBounds) {
      let transformedBounds = layerBounds;
      if (this.metadata?.fullExtent?.spatialReference?.wkid !== MapEventProcessor.getMapState(this.mapId).currentProjection) {
        transformedBounds = api.projection.transformExtent(
          layerBounds,
          `EPSG:${projection}`,
          `EPSG:${MapEventProcessor.getMapState(this.mapId).currentProjection}`
        );
      }

      if (!bounds) bounds = [transformedBounds[0], transformedBounds[1], transformedBounds[2], transformedBounds[3]];
      else bounds = getMinOrMaxExtents(bounds, transformedBounds);
    }

    return bounds;
  }
}
