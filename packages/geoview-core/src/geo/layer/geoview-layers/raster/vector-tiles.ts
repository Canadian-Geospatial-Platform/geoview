import BaseLayer from 'ol/layer/Base';
import VectorTileLayer from 'ol/layer/VectorTile';
import VectorTileSource, { Options as SourceOptions } from 'ol/source/VectorTile';
import TileGrid, { Options as TileGridOptions } from 'ol/tilegrid/TileGrid';

import { applyStyle } from 'ol-mapbox-style';

import { MVT } from 'ol/format';
import { AbstractGeoViewLayer, CONST_LAYER_TYPES } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { AbstractGeoViewRaster } from '@/geo/layer/geoview-layers/raster/abstract-geoview-raster';
import {
  TypeLayerEntryConfig,
  TypeSourceTileInitialConfig,
  TypeGeoviewLayerConfig,
  TypeTileGrid,
  layerEntryIsGroupLayer,
} from '@/geo/map/map-schema-types';
import { TypeJsonObject } from '@/core/types/global-types';
import { getZoomFromScale, validateExtentWhenDefined } from '@/geo/utils/utilities';
import { api } from '@/app';
import { VectorTilesLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/vector-tiles-layer-entry-config';
import { logger } from '@/core/utils/logger';
import { AbstractBaseLayerEntryConfig } from '@/core/utils/config/validation-classes/abstract-base-layer-entry-config';

// TODO: Implement method to validate Vector Tiles service
// TODO: Add more customization (minZoom, maxZoom, TMS)

// GV: CONFIG EXTRACTION
// GV: This section of code must be deleted because we already have another type guard that does the same thing
// GV: |||||
// GV: vvvvv

export type TypeSourceVectorTilesInitialConfig = TypeSourceTileInitialConfig;

export interface TypeVectorTilesConfig extends Omit<TypeGeoviewLayerConfig, 'listOfLayerEntryConfig'> {
  geoviewLayerType: typeof CONST_LAYER_TYPES.VECTOR_TILES;
  listOfLayerEntryConfig: VectorTilesLayerEntryConfig[];
}

// GV: ^^^^^
// GV: |||||

/** *****************************************************************************************************************************
 * type guard function that redefines a TypeGeoviewLayerConfig as a TypeVectorTilesConfig if the geoviewLayerType attribute of the
 * verifyIfLayer parameter is VECTOR_TILES. The type ascention applies only to the true block of the if clause that use this
 * function.
 *
 * @param {TypeGeoviewLayerConfig} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const layerConfigIsVectorTiles = (verifyIfLayer: TypeGeoviewLayerConfig): verifyIfLayer is TypeVectorTilesConfig => {
  return verifyIfLayer?.geoviewLayerType === CONST_LAYER_TYPES.VECTOR_TILES;
};

/** *****************************************************************************************************************************
 * type guard function that redefines an AbstractGeoViewLayer as an VectorTiles if the type attribute of the verifyIfGeoViewLayer
 * parameter is Vector_TILES. The type ascention applies only to the true block of the if clause that use this function.
 *
 * @param {AbstractGeoViewLayer} verifyIfGeoViewLayer Polymorphic object to test in order to determine if the type ascention
 * is valid
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const geoviewLayerIsVectorTiles = (verifyIfGeoViewLayer: AbstractGeoViewLayer): verifyIfGeoViewLayer is VectorTiles => {
  return verifyIfGeoViewLayer?.type === CONST_LAYER_TYPES.VECTOR_TILES;
};

/** *****************************************************************************************************************************
 * type guard function that redefines a TypeLayerEntryConfig as a VectorTilesLayerEntryConfig if the geoviewLayerType attribute
 * of the verifyIfGeoViewEntry.geoviewLayerConfig attribute is VECTOR_TILES. The type ascention applies only to the true block of
 * the if clause that use this function.
 *
 * @param {TypeLayerEntryConfig} verifyIfGeoViewEntry Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const geoviewEntryIsVectorTiles = (
  verifyIfGeoViewEntry: TypeLayerEntryConfig
): verifyIfGeoViewEntry is VectorTilesLayerEntryConfig => {
  return verifyIfGeoViewEntry?.geoviewLayerConfig?.geoviewLayerType === CONST_LAYER_TYPES.VECTOR_TILES;
};

// ******************************************************************************************************************************
// ******************************************************************************************************************************
/** *****************************************************************************************************************************
 * a class to add vector-tiles layer
 *
 * @exports
 * @class VectorTiles
 */
// ******************************************************************************************************************************
// GV Layers Refactoring - Obsolete (in layers)
export class VectorTiles extends AbstractGeoViewRaster {
  /** ***************************************************************************************************************************
   * Initialize layer
   *
   * @param {string} mapId the id of the map
   * @param {TypeVectorTilesConfig} layerConfig the layer configuration
   */
  constructor(mapId: string, layerConfig: TypeVectorTilesConfig) {
    super(CONST_LAYER_TYPES.VECTOR_TILES, layerConfig, mapId);
  }

  /** ***************************************************************************************************************************
   * This method recursively validates the layer configuration entries by filtering and reporting invalid layers. If needed,
   * extra configuration may be done here.
   *
   * @param {TypeLayerEntryConfig[]} listOfLayerEntryConfig The list of layer entries configuration to validate.
   */
  // GV Layers Refactoring - Obsolete (in config?)
  protected validateListOfLayerEntryConfig(listOfLayerEntryConfig: TypeLayerEntryConfig[]): void {
    listOfLayerEntryConfig.forEach((layerConfig: TypeLayerEntryConfig) => {
      const { layerPath } = layerConfig;
      if (layerEntryIsGroupLayer(layerConfig)) {
        this.validateListOfLayerEntryConfig(layerConfig.listOfLayerEntryConfig!);
        if (!layerConfig?.listOfLayerEntryConfig?.length) {
          this.layerLoadError.push({
            layer: layerPath,
            loggerMessage: `Empty layer group (mapId:  ${this.mapId}, layerPath: ${layerPath})`,
          });
          // eslint-disable-next-line no-param-reassign
          layerConfig.layerStatus = 'error';
          return;
        }
      }

      // eslint-disable-next-line no-param-reassign
      layerConfig.layerStatus = 'processing';
    });
  }

  /** ****************************************************************************************************************************
   * This method creates a GeoView VectorTiles layer using the definition provided in the layerConfig parameter.
   *
   * @param {AbstractBaseLayerEntryConfig} layerConfig Information needed to create the GeoView layer.
   *
   * @returns {Promise<BaseLayer | undefined>} The GeoView raster layer that has been created.
   */
  // GV Layers Refactoring - Obsolete (in config? in layers?)
  protected override async processOneLayerEntry(layerConfig: AbstractBaseLayerEntryConfig): Promise<BaseLayer | undefined> {
    // GV IMPORTANT: The processOneLayerEntry method must call the corresponding method of its parent to ensure that the flow of
    // GV            layerStatus values is correctly sequenced.
    await super.processOneLayerEntry(layerConfig);

    // Instance check
    if (!(layerConfig instanceof VectorTilesLayerEntryConfig)) throw new Error('Invalid layer configuration type provided');

    const sourceOptions: SourceOptions = {
      url: layerConfig.source.dataAccessPath,
    };

    if (
      this.metadata?.tileInfo?.spatialReference?.wkid &&
      this.getMapViewer().getProjection().getCode().replace('EPSG:', '') !== this.metadata.tileInfo.spatialReference.wkid.toString()
    ) {
      // TODO: find a more centralized way to trap error and display message
      api.maps[this.mapId].notifications.showError(
        `Error: vector tile layer (${layerConfig.layerId}) projection does not match map projection`
      );
      logger.logError(`Error: vector tile layer (${layerConfig.layerId}) projection does not match map projection`);
      // eslint-disable-next-line no-param-reassign
      layerConfig.layerStatus = 'error';
      return Promise.resolve(undefined);
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

    sourceOptions.format = new MVT();
    sourceOptions.projection = this.getMapViewer().getProjection().getCode();
    sourceOptions.tileGrid = new TileGrid(layerConfig.source!.tileGrid!);

    // Create the source
    const source = new VectorTileSource(sourceOptions);

    // GV Time to request an OpenLayers layer!
    const requestResult = this.emitLayerRequesting({ config: layerConfig, source });

    // If any response
    let olLayer: VectorTileLayer<VectorTileSource> | undefined;
    if (requestResult.length > 0) {
      // Get the OpenLayer that was created
      olLayer = requestResult[0] as VectorTileLayer<VectorTileSource>;
    } else throw new Error('Error on layerRequesting event');

    // GV Time to emit about the layer creation!
    this.emitLayerCreation({ config: layerConfig, layer: olLayer });

    // TODO: Refactor - Layers refactoring. What is this doing? See how we can do this in the new layers. Can it be done before?
    const resolutions = sourceOptions.tileGrid.getResolutions();

    let appliedStyle = layerConfig.styleUrl || (this.metadata?.defaultStyles as string);

    if (appliedStyle) {
      if (!appliedStyle.endsWith('/root.json')) appliedStyle = `${appliedStyle}/root.json`;

      applyStyle(olLayer, appliedStyle, {
        resolutions: resolutions?.length ? resolutions : [],
      }).catch((error) => {
        // Log
        logger.logPromiseFailed('applyStyle in processOneLayerEntry in VectorTiles', error);
      });
    }

    return Promise.resolve(olLayer);
  }

  /** ***************************************************************************************************************************
   * This method is used to process the layer's metadata. It will fill the empty fields of the layer's configuration (renderer,
   * initial settings, fields and aliases).
   *
   * @param {AbstractBaseLayerEntryConfig} layerConfig The layer entry configuration to process.
   *
   * @returns {Promise<AbstractBaseLayerEntryConfig>} A promise that the vector layer configuration has its metadata processed.
   */
  // GV Layers Refactoring - Obsolete (in config?)
  protected override processLayerMetadata(layerConfig: AbstractBaseLayerEntryConfig): Promise<AbstractBaseLayerEntryConfig> {
    // Instance check
    const updatedLayerConfig = layerConfig;
    if (!(updatedLayerConfig instanceof VectorTilesLayerEntryConfig)) throw new Error('Invalid layer configuration type provided');

    if (this.metadata) {
      const { tileInfo, fullExtent, minScale, maxScale, minZoom, maxZoom } = this.metadata;
      const newTileGrid: TypeTileGrid = {
        extent: [fullExtent.xmin as number, fullExtent.ymin as number, fullExtent.xmax as number, fullExtent.ymax as number],
        origin: [tileInfo.origin.x as number, tileInfo.origin.y as number],
        resolutions: (tileInfo.lods as Array<TypeJsonObject>).map(({ resolution }) => resolution as number),
        tileSize: [tileInfo.rows as number, tileInfo.cols as number],
      };
      updatedLayerConfig.source!.tileGrid = newTileGrid;

      updatedLayerConfig.initialSettings.extent = validateExtentWhenDefined(updatedLayerConfig.initialSettings.extent);

      // Set zoom levels. Vector tiles may be unique as they can have both scale and zoom level properties
      // First set the min/max scales based on the service / config
      // * Infinity and -Infinity are used as extreme zoom level values in case the value is undefined
      if (minScale !== undefined) {
        updatedLayerConfig.minScale = Math.min(updatedLayerConfig.minScale ?? Infinity, minScale as number);
      }

      if (maxScale !== undefined) {
        updatedLayerConfig.maxScale = Math.max(updatedLayerConfig.maxScale ?? -Infinity, maxScale as number);
      }

      // Second, set the min/max zoom levels based on the service / config.
      // GV Vector tiles should always have a minZoom and maxZoom, so -Infinity or Infinity should never be set as a value
      if (minZoom !== undefined) {
        updatedLayerConfig.initialSettings.minZoom = Math.min(updatedLayerConfig.initialSettings.minZoom ?? Infinity, minZoom as number);
      }

      if (maxZoom !== undefined) {
        updatedLayerConfig.initialSettings.maxZoom = Math.max(updatedLayerConfig.initialSettings.maxZoom ?? -Infinity, maxZoom as number);
      }

      // Third, use the now set scale and zoom levels to determine the actual max / min zoom based on both
      const mapView = this.getMapViewer().getView();
      if (updatedLayerConfig.minScale) {
        const maxScaleZoomLevel = getZoomFromScale(mapView, updatedLayerConfig.minScale);
        if (maxScaleZoomLevel) {
          updatedLayerConfig.initialSettings.maxZoom = Math.max(updatedLayerConfig.initialSettings.maxZoom ?? -Infinity, maxScaleZoomLevel);
        }
      }

      if (updatedLayerConfig.maxScale) {
        const minScaleZoomLevel = getZoomFromScale(mapView, updatedLayerConfig.maxScale);
        if (minScaleZoomLevel) {
          updatedLayerConfig.initialSettings.minZoom = Math.min(updatedLayerConfig.initialSettings.minZoom ?? Infinity, minScaleZoomLevel);
        }
      }
    }
    return Promise.resolve(updatedLayerConfig);
  }
}
