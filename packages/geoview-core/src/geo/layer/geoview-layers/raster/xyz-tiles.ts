import TileLayer from 'ol/layer/Tile';
import XYZ, { Options as SourceOptions } from 'ol/source/XYZ';
import TileGrid, { Options as TileGridOptions } from 'ol/tilegrid/TileGrid';

import defaultsDeep from 'lodash/defaultsDeep';

import { CONST_LAYER_TYPES } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { AbstractGeoViewRaster } from '@/geo/layer/geoview-layers/raster/abstract-geoview-raster';
import { TypeLayerEntryConfig, TypeSourceTileInitialConfig, TypeGeoviewLayerConfig } from '@/geo/map/map-schema-types';
import { Cast, toJsonObject, TypeJsonArray, TypeJsonObject } from '@/core/types/global-types';
import { validateExtentWhenDefined } from '@/geo/utils/utilities';
import { XYZTilesLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/xyz-layer-entry-config';
import { AbstractBaseLayerEntryConfig } from '@/core/utils/config/validation-classes/abstract-base-layer-entry-config';

// ? Do we keep this TODO ? Dynamic parameters can be placed on the dataAccessPath and initial settings can be used on xyz-tiles.
// TODO: Implement method to validate XYZ tile service
//
// NOTE: The signature of tile services may vary depending of if it's a dynamic or static tile service. Dynamic tile services solutions like TiTiler allows users
// to define query parameters such as a COG url, a TileMatrixSet and a resampling method.
// e.g.: http://{s}.somedomain.com/blabla/{z}/{x}/{y}{r}.png?url=http://smtg/cog.tif&TileMatrixSetId=CanadianNAD83_LCC&resampling_method=bilinear

// TODO: Add more customization (minZoom, maxZoom, TMS)

export type TypeSourceImageXYZTilesInitialConfig = TypeSourceTileInitialConfig;

export interface TypeXYZTilesConfig extends Omit<TypeGeoviewLayerConfig, 'listOfLayerEntryConfig'> {
  geoviewLayerType: typeof CONST_LAYER_TYPES.XYZ_TILES;
  listOfLayerEntryConfig: XYZTilesLayerEntryConfig[];
}

/**
 * A class to add xyz-tiles layer
 *
 * @exports
 * @class XYZTiles
 */
export class XYZTiles extends AbstractGeoViewRaster {
  /**
   * Constructs a XYZTiles Layer configuration processor.
   *
   * @param {string} mapId the id of the map
   * @param {TypeXYZTilesConfig} layerConfig the layer configuration
   */
  constructor(mapId: string, layerConfig: TypeXYZTilesConfig) {
    super(CONST_LAYER_TYPES.XYZ_TILES, layerConfig, mapId);
  }

  /**
   * Overrides the validation of a layer entry config.
   * @param {TypeLayerEntryConfig} layerConfig - The layer entry config to validate.
   */
  protected override onValidateLayerEntryConfig(layerConfig: TypeLayerEntryConfig): void {
    // TODO: Update to properly use metadata from map server
    // Note that XYZ metadata as we defined it does not contain metadata layer group. If you need geojson layer group,
    // you can define them in the configuration section.
    if (Array.isArray(this.metadata?.listOfLayerEntryConfig)) {
      const metadataLayerList = Cast<TypeLayerEntryConfig[]>(this.metadata?.listOfLayerEntryConfig);
      const foundEntry = metadataLayerList.find((layerMetadata) => layerMetadata.layerId === layerConfig.layerId);
      if (!foundEntry) {
        // Add a layer load error
        this.addLayerLoadError(layerConfig, `XYZ layer not found (mapId:  ${this.mapId}, layerPath: ${layerConfig.layerPath})`);
      }
      return;
    }

    // ESRI MapServer Implementation
    if (Array.isArray(this.metadata?.layers)) {
      const metadataLayerList = this.metadata.layers;
      const foundEntry = metadataLayerList.find((layerMetadata) => layerMetadata.id.toString() === layerConfig.layerId);
      if (!foundEntry) {
        // Add a layer load error
        this.addLayerLoadError(layerConfig, `XYZ layer not found (mapId:  ${this.mapId}, layerPath: ${layerConfig.layerPath})`);
      }
      return;
    }

    throw new Error(
      `Invalid GeoJSON metadata (listOfLayerEntryConfig) prevent loading of layer (mapId:  ${this.mapId}, layerPath: ${layerConfig.layerPath})`
    );
  }

  /**
   * Overrides the way the layer entry is processed to generate an Open Layer Base Layer object.
   * @param {AbstractBaseLayerEntryConfig} layerConfig - The layer entry config needed to create the Open Layer object.
   * @returns {Promise<TileLayer<XYZ>>} The GeoView raster layer that has been created.
   */
  protected override onProcessOneLayerEntry(layerConfig: AbstractBaseLayerEntryConfig): Promise<TileLayer<XYZ>> {
    // Instance check
    if (!(layerConfig instanceof XYZTilesLayerEntryConfig)) throw new Error('Invalid layer configuration type provided');

    const sourceOptions: SourceOptions = {
      url: layerConfig.source.dataAccessPath,
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

    // Create the source
    const source = new XYZ(sourceOptions);

    // GV Time to request an OpenLayers layer!
    const requestResult = this.emitLayerRequesting({ config: layerConfig, source });

    // If any response
    let olLayer: TileLayer<XYZ>;
    if (requestResult.length > 0) {
      // Get the OpenLayer that was created
      olLayer = requestResult[0] as TileLayer<XYZ>;
    } else throw new Error('Error on layerRequesting event');

    // GV Time to emit about the layer creation!
    this.emitLayerCreation({ config: layerConfig, layer: olLayer });

    // Return the OpenLayer layer
    return Promise.resolve(olLayer);
  }

  /**
   * Overrides the way the layer metadata is processed.
   * @param {AbstractBaseLayerEntryConfig} layerConfig - The layer entry configuration to process.
   * @returns {Promise<AbstractBaseLayerEntryConfig>} A promise that the layer entry configuration has gotten its metadata processed.
   */
  protected override onProcessLayerMetadata(layerConfig: AbstractBaseLayerEntryConfig): Promise<AbstractBaseLayerEntryConfig> {
    // Instance check
    if (!(layerConfig instanceof XYZTilesLayerEntryConfig)) throw new Error('Invalid layer configuration type provided');

    // TODO Need to see why the metadata isn't handled properly for ESRI XYZ tiles.
    // GV Possibly caused by a difference between OGC and ESRI XYZ Tiles, but only have ESRI XYZ Tiles as example currently
    // GV Also, might be worth checking out OGCMapTile for this? https://openlayers.org/en/latest/examples/ogc-map-tiles-geographic.html
    // GV Seems like it can deal with less specificity in the url and can handle the x y z internally?
    if (this.metadata) {
      let metadataLayerConfigFound: XYZTilesLayerEntryConfig | TypeJsonObject | undefined;
      if (this.metadata?.listOfLayerEntryConfig) {
        metadataLayerConfigFound = Cast<XYZTilesLayerEntryConfig[]>(this.metadata?.listOfLayerEntryConfig).find(
          (metadataLayerConfig) => metadataLayerConfig.layerId === layerConfig.layerId
        );
      }

      // For ESRI MapServer XYZ Tiles
      if (this.metadata?.layers) {
        metadataLayerConfigFound = (this.metadata?.layers as TypeJsonArray).find(
          (metadataLayerConfig) => metadataLayerConfig.id.toString() === layerConfig.layerId
        );
      }

      // metadataLayerConfigFound can not be undefined because we have already validated the config exist
      this.setLayerMetadata(layerConfig.layerPath, toJsonObject(metadataLayerConfigFound));
      // eslint-disable-next-line no-param-reassign
      layerConfig.source = defaultsDeep(layerConfig.source, metadataLayerConfigFound!.source);
      // eslint-disable-next-line no-param-reassign
      layerConfig.initialSettings = defaultsDeep(layerConfig.initialSettings, metadataLayerConfigFound!.initialSettings);
      // eslint-disable-next-line no-param-reassign
      layerConfig.initialSettings.extent = validateExtentWhenDefined(layerConfig.initialSettings.extent);

      // Set zoom limits for max / min zooms
      const maxScale = metadataLayerConfigFound?.maxScale as number;
      const minScaleDenominator = (metadataLayerConfigFound as TypeJsonObject)?.minScaleDenominator as number;
      // eslint-disable-next-line no-param-reassign
      layerConfig.maxScale =
        !maxScale && !minScaleDenominator
          ? layerConfig.maxScale
          : Math.max(maxScale ?? -Infinity, minScaleDenominator ?? -Infinity, layerConfig.maxScale ?? -Infinity);

      const minScale = metadataLayerConfigFound?.minScale as number;
      const maxScaleDenominator = (metadataLayerConfigFound as TypeJsonObject)?.maxScaleDenominator as number;
      // eslint-disable-next-line no-param-reassign
      layerConfig.minScale =
        !minScale && !maxScaleDenominator
          ? layerConfig.minScale
          : Math.min(minScale ?? Infinity, maxScaleDenominator ?? Infinity, layerConfig.minScale ?? Infinity);
    }

    // Return the layer config
    return Promise.resolve(layerConfig);
  }
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
 * type guard function that redefines a TypeLayerEntryConfig as a XYZTilesLayerEntryConfig if the geoviewLayerType attribute
 * of the verifyIfGeoViewEntry.geoviewLayerConfig attribute is XYZ_TILES. The type ascention applies only to the true block of
 * the if clause that use this function.
 *
 * @param {TypeLayerEntryConfig} verifyIfGeoViewEntry Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const geoviewEntryIsXYZTiles = (verifyIfGeoViewEntry: TypeLayerEntryConfig): verifyIfGeoViewEntry is XYZTilesLayerEntryConfig => {
  return verifyIfGeoViewEntry?.geoviewLayerConfig?.geoviewLayerType === CONST_LAYER_TYPES.XYZ_TILES;
};
