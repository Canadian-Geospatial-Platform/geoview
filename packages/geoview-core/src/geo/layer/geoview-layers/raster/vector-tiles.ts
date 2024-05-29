import View from 'ol/View';
import Map from 'ol/Map';
import TileLayer from 'ol/layer/Tile';
import VectorTileLayer from 'ol/layer/VectorTile';
import { Options as TileOptions } from 'ol/layer/BaseTile';
import VectorTileSource, { Options as SourceOptions } from 'ol/source/VectorTile';
import TileGrid, { Options as TileGridOptions } from 'ol/tilegrid/TileGrid';
import { Extent } from 'ol/extent';

import olms, { applyStyle } from 'ol-mapbox-style';

// import { layerEntryIsGroupLayer } from '@config/types/type-guards';

import Feature from 'ol/Feature';
import { MVT } from 'ol/format';
import { TypeLocalizedString } from '@config/types/map-schema-types';
import { AbstractGeoViewLayer, CONST_LAYER_TYPES } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { AbstractGeoViewRaster, TypeBaseRasterLayer } from '@/geo/layer/geoview-layers/raster/abstract-geoview-raster';
import {
  TypeLayerEntryConfig,
  TypeSourceTileInitialConfig,
  TypeGeoviewLayerConfig,
  TypeTileGrid,
  layerEntryIsGroupLayer,
} from '@/geo/map/map-schema-types';
import { getMinOrMaxExtents } from '@/geo/utils/utilities';
import { Projection } from '@/geo/utils/projection';
import { getLocalizedValue } from '@/core/utils/utilities';
import { Cast, TypeJsonObject } from '@/core/types/global-types';
import { api } from '@/app';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import { VectorTilesLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/vector-tiles-layer-entry-config';
import { logger } from '@/core/utils/logger';
import { TileLayerEntryConfig } from '@/core/utils/config/validation-classes/tile-layer-entry-config';
import { AppEventProcessor } from '@/api/event-processors/event-processor-children/app-event-processor';
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
   * Extract the type of the specified field from the metadata. If the type can not be found, return 'string'.
   *
   * @param {string} fieldName field name for which we want to get the type.
   * @param {TypeLayerEntryConfig} layerConfig layer configuration.
   *
   * @returns {'string' | 'date' | 'number'} The type of the field.
   */
  protected override getFieldType(fieldName: string, layerConfig: AbstractBaseLayerEntryConfig): 'string' | 'date' | 'number' {
    const fieldDefinitions = this.layerMetadata[layerConfig.layerPath].source.featureInfo;
    const fieldIndex = getLocalizedValue(
      Cast<TypeLocalizedString>(fieldDefinitions.outfields),
      AppEventProcessor.getDisplayLanguage(this.mapId)
    )
      ?.split(',')
      .indexOf(fieldName);
    if (!fieldIndex || fieldIndex === -1) return 'string';
    return (fieldDefinitions.fieldTypes as string).split(',')[fieldIndex!] as 'string' | 'date' | 'number';
  }

  /** ***************************************************************************************************************************
   * This method recursively validates the layer configuration entries by filtering and reporting invalid layers. If needed,
   * extra configuration may be done here.
   *
   * @param {TypeLayerEntryConfig[]} listOfLayerEntryConfig The list of layer entries configuration to validate.
   */
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
   * @param {VectorTilesLayerEntryConfig} layerConfig Information needed to create the GeoView layer.
   *
   * @returns {TypeBaseRasterLayer} The GeoView raster layer that has been created.
   */
  protected override async processOneLayerEntry(layerConfig: VectorTilesLayerEntryConfig): Promise<TypeBaseRasterLayer | undefined> {
    // GV IMPORTANT: The processOneLayerEntry method must call the corresponding method of its parent to ensure that the flow of
    // GV            layerStatus values is correctly sequenced.
    await super.processOneLayerEntry(layerConfig);
    const sourceOptions: SourceOptions<Feature> = {
      url: getLocalizedValue(layerConfig.source.dataAccessPath as TypeLocalizedString, AppEventProcessor.getDisplayLanguage(this.mapId)),
    };

    if (
      this.metadata?.tileInfo?.spatialReference?.wkid &&
      MapEventProcessor.getMapState(this.mapId).currentProjection !== this.metadata.tileInfo.spatialReference.wkid
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
    sourceOptions.projection = `EPSG:${MapEventProcessor.getMapState(this.mapId).currentProjection}`;
    sourceOptions.tileGrid = new TileGrid(layerConfig.source!.tileGrid!);
    const tileLayerOptions: TileOptions<VectorTileSource> = { source: new VectorTileSource(sourceOptions) };
    // layerConfig.initialSettings cannot be undefined because config-validation set it to {} if it is undefined.
    if (layerConfig.initialSettings?.className !== undefined) tileLayerOptions.className = layerConfig.initialSettings.className;
    if (layerConfig.initialSettings?.extent !== undefined) tileLayerOptions.extent = layerConfig.initialSettings.extent;
    if (layerConfig.initialSettings?.maxZoom !== undefined) tileLayerOptions.maxZoom = layerConfig.initialSettings.maxZoom;
    if (layerConfig.initialSettings?.minZoom !== undefined) tileLayerOptions.minZoom = layerConfig.initialSettings.minZoom;
    if (layerConfig.initialSettings?.states?.opacity !== undefined) tileLayerOptions.opacity = layerConfig.initialSettings.states.opacity;
    // GV IMPORTANT: The initialSettings.visible flag must be set in the layerConfig.loadedFunction otherwise the layer will stall
    // GV            in the 'loading' state if the flag value is false.

    // TODO remove after demoing again
    const declutter = this.mapId !== 'LYR2';

    // TODO: Refactor - Wire it up
    this.setLayerAndLoadEndListeners(layerConfig, {
      olLayer: new VectorTileLayer({ ...tileLayerOptions, declutter }),
      loadEndListenerType: 'tile',
    });

    const resolutions = (layerConfig.olLayer as VectorTileLayer).getSource()?.getTileGrid()?.getResolutions();

    if (this.metadata?.defaultStyles)
      applyStyle(
        layerConfig.olLayer as VectorTileLayer,
        `${getLocalizedValue(this.metadataAccessPath, AppEventProcessor.getDisplayLanguage(this.mapId))}${
          this.metadata.defaultStyles
        }/root.json`,
        { resolutions: resolutions?.length ? resolutions : [] }
      ).catch((error) => {
        // Log
        logger.logPromiseFailed('applyStyle in processOneLayerEntry in VectorTiles', error);
      });

    return Promise.resolve(layerConfig.olLayer);
  }

  /** ***************************************************************************************************************************
   * This method is used to process the layer's metadata. It will fill the empty fields of the layer's configuration (renderer,
   * initial settings, fields and aliases).
   *
   * @param {TileLayerEntryConfig} layerConfig The layer entry configuration to process.
   *
   * @returns {Promise<TypeLayerEntryConfig>} A promise that the vector layer configuration has its metadata processed.
   */
  protected override processLayerMetadata(layerConfig: TileLayerEntryConfig): Promise<TypeLayerEntryConfig> {
    if (this.metadata) {
      const { tileInfo } = this.metadata;
      const extent = this.metadata.fullExtent;
      const newTileGrid: TypeTileGrid = {
        extent: [extent.xmin as number, extent.ymin as number, extent.xmax as number, extent.ymax as number],
        origin: [tileInfo.origin.x as number, tileInfo.origin.y as number],
        resolutions: (tileInfo.lods as Array<TypeJsonObject>).map(({ resolution }) => resolution as number),
        tileSize: [tileInfo.rows as number, tileInfo.cols as number],
      };
      // eslint-disable-next-line no-param-reassign
      layerConfig.source!.tileGrid = newTileGrid;

      if (layerConfig.initialSettings?.extent)
        // eslint-disable-next-line no-param-reassign
        layerConfig.initialSettings.extent = Projection.transformExtent(
          layerConfig.initialSettings.extent,
          Projection.PROJECTION_NAMES.LNGLAT,
          `EPSG:${MapEventProcessor.getMapState(this.mapId).currentProjection}`
        );
    }
    return Promise.resolve(layerConfig);
  }

  /** ***************************************************************************************************************************
   * Get the bounds of the layer represented in the layerConfig pointed to by the layerPath, returns updated bounds
   *
   * @param {string} layerPath The Layer path to the layer's configuration.
   * @param {Extent | undefined} bounds The current bounding box to be adjusted.
   *
   * @returns {Extent | undefined} The new layer bounding box.
   */
  protected getBounds(layerPath: string, bounds?: Extent): Extent | undefined {
    const layerConfig = this.getLayerEntryConfig(layerPath);
    const layerBounds = (layerConfig?.olLayer as TileLayer<VectorTileSource>).getSource()?.getTileGrid()?.getExtent();
    const projection =
      (layerConfig?.olLayer as TileLayer<VectorTileSource>).getSource()?.getProjection()?.getCode().replace('EPSG:', '') ||
      MapEventProcessor.getMapState(this.mapId).currentProjection;

    if (layerBounds) {
      let transformedBounds = layerBounds;
      if (this.metadata?.fullExtent?.spatialReference?.wkid !== MapEventProcessor.getMapState(this.mapId).currentProjection) {
        transformedBounds = Projection.transformExtent(
          layerBounds,
          `EPSG:${projection}`,
          `EPSG:${MapEventProcessor.getMapState(this.mapId).currentProjection}`
        );
      }

      // eslint-disable-next-line no-param-reassign
      if (!bounds) bounds = [transformedBounds[0], transformedBounds[1], transformedBounds[2], transformedBounds[3]];
      // eslint-disable-next-line no-param-reassign
      else bounds = getMinOrMaxExtents(bounds, transformedBounds);
    }

    return bounds;
  }

  // TODO: This section needs documentation (a header at least). Also, is it normal to have things hardcoded like that?
  static async addVectorTileLayer(): Promise<void> {
    // GV from code sandbox https://codesandbox.io/s/vector-tile-info-forked-g28jud?file=/main.js it works good
    // GV from inside GeoView, even when not use, something is wrong.
    const map = await olms(
      'LYR3',
      'https://tiles.arcgis.com/tiles/HsjBaDykC1mjhXz9/arcgis/rest/services/CBMT3978_v11/VectorTileServer/resources/styles/root.json?f=json'
    );

    // Configure the map with a view with EPSG:3978 projection
    (map as Map).setView(
      new View({
        projection: 'EPSG:3857',
        center: [(-2750565.340500001 + -936703.1849000007) / 2, (3583872.5053000003 + 4659267.001500003) / 2],
        zoom: 5,
      })
    );
  }

  /**
   * Set Vector Tile style
   *
   * @param {string} layerPath Path of layer to style.
   * @param {string} styleUrl The url of the styles to apply.
   * @returns {Promise<unknown>}
   */
  setVectorTileStyle(layerPath: string, styleUrl: string): Promise<unknown> {
    return applyStyle(MapEventProcessor.getMapViewerLayerAPI(this.mapId).registeredLayers[layerPath].olLayer as VectorTileLayer, styleUrl);
  }
}
