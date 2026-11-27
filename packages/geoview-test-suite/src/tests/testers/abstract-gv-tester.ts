import type { Coordinate } from 'ol/coordinate';

import { TestConstants } from './constants';
import { AbstractTester } from '../core/abstract-tester';
import { Test } from '../core/test';
import type { API } from 'geoview-core/api/api';
import type { TypeGeoviewLayerConfig } from 'geoview-core/api/types/layer-schema-types';
import { DomHelper } from 'geoview-core/core/utils/dom-helper';
import { NotImplementedError } from 'geoview-core/core/exceptions/core-exceptions';
import { delay, generateId, whenThisThen } from 'geoview-core/core/utils/utilities';
import type { TypeFeatureInfoEntry } from 'geoview-core/api/types/map-schema-types';
import { GeoPackageReader } from 'geoview-core/api/config/reader/geopackage-reader';
import type { ConfigBaseClass } from 'geoview-core/api/config/validation-classes/config-base-class';
import type { GroupLayerEntryConfig } from 'geoview-core/api/config/validation-classes/group-layer-entry-config';
import type { EsriDynamicLayerEntryConfig } from 'geoview-core/api/config/validation-classes/raster-validation-classes/esri-dynamic-layer-entry-config';
import type { EsriImageLayerEntryConfig } from 'geoview-core/api/config/validation-classes/raster-validation-classes/esri-image-layer-entry-config';
import type { GeoTIFFLayerEntryConfig } from 'geoview-core/api/config/validation-classes/raster-validation-classes/geotiff-layer-entry-config';
import type { OgcWmsLayerEntryConfig } from 'geoview-core/api/config/validation-classes/raster-validation-classes/ogc-wms-layer-entry-config';
import type { OgcWmtsLayerEntryConfig } from 'geoview-core/api/config/validation-classes/raster-validation-classes/ogc-wmts-layer-entry-config';
import type { VectorTilesLayerEntryConfig } from 'geoview-core/api/config/validation-classes/raster-validation-classes/vector-tiles-layer-entry-config';
import type { XYZTilesLayerEntryConfig } from 'geoview-core/api/config/validation-classes/raster-validation-classes/xyz-layer-entry-config';
import type { CsvLayerEntryConfig } from 'geoview-core/api/config/validation-classes/vector-validation-classes/csv-layer-entry-config';
import type { EsriFeatureLayerEntryConfig } from 'geoview-core/api/config/validation-classes/vector-validation-classes/esri-feature-layer-entry-config';
import type { GeoJSONLayerEntryConfig } from 'geoview-core/api/config/validation-classes/vector-validation-classes/geojson-layer-entry-config';
import type { KmlLayerEntryConfig } from 'geoview-core/api/config/validation-classes/vector-validation-classes/kml-layer-entry-config';
import type { OgcFeatureLayerEntryConfig } from 'geoview-core/api/config/validation-classes/vector-validation-classes/ogc-layer-entry-config';
import type { OgcWfsLayerEntryConfig } from 'geoview-core/api/config/validation-classes/vector-validation-classes/wfs-layer-entry-config';
import type { WkbLayerEntryConfig } from 'geoview-core/api/config/validation-classes/vector-validation-classes/wkb-layer-entry-config';
import { CONTAINER_TYPE } from 'geoview-core/core/utils/constant';
import type { ControllerRegistry } from 'geoview-core/core/controllers/base/controller-registry';
import { getStoreLayerLegendLayerByPath } from 'geoview-core/core/stores/states/layer-state';
import { TIME_DELAY_BETWEEN_PROPAGATION_FOR_BATCH } from 'geoview-core/core/stores/states/feature-info-state';
import type { MapViewer } from 'geoview-core/geo/map/map-viewer';
import type { GeometryApi } from 'geoview-core/geo/layer/geometry/geometry';
import { EsriDynamic } from 'geoview-core/geo/layer/geoview-layers/raster/esri-dynamic';
import { EsriFeature } from 'geoview-core/geo/layer/geoview-layers/vector/esri-feature';
import { EsriImage } from 'geoview-core/geo/layer/geoview-layers/raster/esri-image';
import { WMS } from 'geoview-core/geo/layer/geoview-layers/raster/wms';
import { WMTS } from 'geoview-core/geo/layer/geoview-layers/raster/wmts';
import { XYZTiles } from 'geoview-core/geo/layer/geoview-layers/raster/xyz-tiles';
import { VectorTiles } from 'geoview-core/geo/layer/geoview-layers/raster/vector-tiles';
import { WFS } from 'geoview-core/geo/layer/geoview-layers/vector/wfs';
import { GeoJSON } from 'geoview-core/geo/layer/geoview-layers/vector/geojson';
import { GeoTIFF } from 'geoview-core/geo/layer/geoview-layers/raster/geotiff';
import { CSV } from 'geoview-core/geo/layer/geoview-layers/vector/csv';
import { OgcFeature } from 'geoview-core/geo/layer/geoview-layers/vector/ogc-feature';
import { WKB } from 'geoview-core/geo/layer/geoview-layers/vector/wkb';
import { KML } from 'geoview-core/geo/layer/geoview-layers/vector/kml';
import type { AbstractBaseGVLayer } from 'geoview-core/geo/layer/gv-layers/abstract-base-layer';
import type { AbstractGVLayer } from 'geoview-core/geo/layer/gv-layers/abstract-gv-layer';
import type { GVGroupLayer } from 'geoview-core/geo/layer/gv-layers/gv-group-layer';
import type { GVGeoJSON } from 'geoview-core/geo/layer/gv-layers/vector/gv-geojson';
import type { GVWMTS } from 'geoview-core/geo/layer/gv-layers/tile/gv-wmts';
import type { GVEsriDynamic } from 'geoview-core/geo/layer/gv-layers/raster/gv-esri-dynamic';
import type { GVEsriFeature } from 'geoview-core/geo/layer/gv-layers/vector/gv-esri-feature';
import type { GVWMS } from 'geoview-core/geo/layer/gv-layers/raster/gv-wms';
import type { GVXYZTiles } from 'geoview-core/geo/layer/gv-layers/tile/gv-xyz-tiles';
import type { GVVectorTiles } from 'geoview-core/geo/layer/gv-layers/vector/gv-vector-tiles';
import type { GVWFS } from 'geoview-core/geo/layer/gv-layers/vector/gv-wfs';
import type { GVEsriImage } from 'geoview-core/geo/layer/gv-layers/raster/gv-esri-image';
import type { GVOGCFeature } from 'geoview-core/geo/layer/gv-layers/vector/gv-ogc-feature';
import type { GVCSV } from 'geoview-core/geo/layer/gv-layers/vector/gv-csv';
import type { GVGeoTIFF } from 'geoview-core/geo/layer/gv-layers/tile/gv-geotiff';
import type { GVWKB } from 'geoview-core/geo/layer/gv-layers/vector/gv-wkb';
import type { GVKML } from 'geoview-core/geo/layer/gv-layers/vector/gv-kml';

/**
 * Main GeoView Abstract Tester class.
 */
export abstract class GVAbstractTester extends AbstractTester {
  /** The API for the tests */
  #api: API;

  /** The Map Viewer for the tests */
  #mapViewer: MapViewer;

  /** The controller registry for the tests */
  #controllerRegistry: ControllerRegistry;

  /**
   * Constructs a GeoView specific tester.
   *
   * @param api - The api
   * @param mapViewer - The map viewer
   */
  constructor(api: API, mapViewer: MapViewer, controllerRegistry: ControllerRegistry) {
    super();

    // Keep the attributes
    this.#api = api;
    this.#mapViewer = mapViewer;
    this.#controllerRegistry = controllerRegistry;
  }

  /**
   * Gets the shared api.
   *
   * @returns The shared api
   */
  getApi(): API {
    return this.#api;
  }

  /**
   * Gets the MapViewer assigned for the current suite execution.
   *
   * @returns The MapViewer
   */
  getMapViewer(): MapViewer {
    return this.#mapViewer;
  }

  /**
   * Gets the Map Id.
   *
   * @returns The Map Id
   */
  getMapId(): string {
    return this.getMapViewer().mapId;
  }

  /**
   * Gets the geometry API from the map viewer.
   * @returns The geometry API instance
   */
  getGeometryApi(): GeometryApi {
    return this.getMapViewer().geometry;
  }

  /**
   * Gets the controller registry when the tester class needs to do something with controllers.
   *
   * @returns The controller registry
   */
  getControllersRegistry(): ControllerRegistry {
    return this.#controllerRegistry;
  }

  /**
   * Assigns the viewer and its controllers together when a suite starts or replaces its map.
   *
   * @param mapViewer - The current map viewer
   */
  assignMapViewerAndControllers(mapViewer: MapViewer): void {
    this.#mapViewer = mapViewer;
    this.#controllerRegistry = mapViewer.controllers;
  }

  // #region LAYERS ADD / REMOVE

  /**
   * Adds the historical flood events Esri Dynamic layer and waits for it to load.
   *
   * @param test - The test instance used to log layer addition and registration
   * @param gvLayerName - Optional display name for the GeoView layer
   * @param callbacks - Optional selected-path and registered-configuration callbacks
   * @returns A promise resolving with the loaded layer after its legend is queried
   */
  async addLayerEsriDynamicHistoFloodEvents(
    test: Test,
    callbacks?: LayerAdditionCallbacks<EsriDynamicLayerEntryConfig>
  ): Promise<GVEsriDynamic> {
    const gvLayerId = generateId();
    const layerPath = `${gvLayerId}/${TestConstants.HISTORICAL_FLOOD_LAYER_ID}`;
    const layerUrl = TestConstants.HISTORICAL_FLOOD_URL_MAP_SERVER;

    // Create the geoview layer config
    const gvConfig = EsriDynamic.createGeoviewLayerConfig(gvLayerId, undefined, layerUrl, true, [
      { id: TestConstants.HISTORICAL_FLOOD_LAYER_ID },
    ]);

    // Redirect to helper to add the layer to the map and wait
    await this.addLayerOnMap<EsriDynamicLayerEntryConfig>(test, gvConfig, layerPath, callbacks);
    return this.waitLayerAtLayerPath<GVEsriDynamic>(test, layerPath);
  }

  /**
   * Adds the Esri Feature Forest Industry fixture and exposes its registered configuration.
   *
   * @param test - The test instance used to log layer setup steps
   * @param callbacks - Optional selected-path and registered-configuration callbacks
   * @returns A promise resolving with the loaded layer after its legend is queried
   */
  async addLayerEsriFeatureForestIndustry(
    test: Test,
    callbacks?: LayerAdditionCallbacks<EsriFeatureLayerEntryConfig>
  ): Promise<GVEsriFeature> {
    const gvLayerId = generateId();
    const layerPath = `${gvLayerId}/${TestConstants.FOREST_INDUSTRY_LAYER_ID}`;
    const layerUrl = TestConstants.FOREST_INDUSTRY_MAP_SERVER;

    // Create the config
    test.addStep('Creating the GeoView Layer Configuration...');
    const gvConfig = EsriFeature.createGeoviewLayerConfig(gvLayerId, undefined, layerUrl, false, [
      { id: TestConstants.FOREST_INDUSTRY_LAYER_ID },
    ]);

    // Redirect to helper to add the layer to the map and wait
    await this.addLayerOnMap(test, gvConfig, layerPath, callbacks);
    return this.waitLayerAtLayerPath<GVEsriFeature>(test, layerPath);
  }

  /**
   * Adds the Top Projects Esri Feature fixture and exposes its registered configuration.
   *
   * @param test - The test instance used to log layer setup steps
   * @param callbacks - Optional selected-path and registered-configuration callbacks
   * @returns A promise resolving with the loaded layer after its legend is queried
   */
  async addLayerEsriFeatureTopProjects(
    test: Test,
    callbacks?: LayerAdditionCallbacks<EsriFeatureLayerEntryConfig>
  ): Promise<GVEsriFeature> {
    const gvLayerId = generateId();
    const layerPath = `${gvLayerId}/${TestConstants.TOP_PROJECTS_900A_LAYER_ID}`;

    // Create the config
    test.addStep('Creating the Top Projects Esri Feature configuration...');
    const gvConfig = EsriFeature.createGeoviewLayerConfig(
      gvLayerId,
      TestConstants.TOP_PROJECTS_900A_LAYER_NAME,
      TestConstants.TOP_PROJECTS_900A_URL_MAP_SERVER,
      false,
      [{ id: TestConstants.TOP_PROJECTS_900A_LAYER_ID }]
    );
    await this.addLayerOnMap(test, gvConfig, layerPath, callbacks);
    return this.waitLayerAtLayerPath<GVEsriFeature>(test, layerPath);
  }

  /**
   * Adds the Yukon low-head hydro Esri Feature layer containing invalid geometries and exposes its registered configuration.
   *
   * @param test - The test instance used to log layer setup steps
   * @param callbacks - Optional selected-path and registered-configuration callbacks
   * @returns A promise resolving with the loaded layer after its legend is queried
   */
  async addLayerEsriFeatureInvalidGeometry(
    test: Test,
    callbacks?: LayerAdditionCallbacks<EsriFeatureLayerEntryConfig>
  ): Promise<GVEsriFeature> {
    const gvLayerId = generateId();
    const layerPath = `${gvLayerId}/${TestConstants.LOW_HEAD_HYDRO_DATABASE_YUKON_ID}`;
    const layerUrl = TestConstants.LOW_HEAD_HYDRO_DATABASE;
    const gvLayerName = 'Yukon Low Head Hydro';

    // Create the config
    test.addStep('Creating the GeoView Layer Configuration...');
    const gvConfig = EsriFeature.createGeoviewLayerConfig(gvLayerId, gvLayerName, layerUrl, false, [
      { id: TestConstants.LOW_HEAD_HYDRO_DATABASE_YUKON_ID },
    ]);

    // Redirect to helper to add the layer to the map and wait
    await this.addLayerOnMap(test, gvConfig, layerPath, callbacks);
    return this.waitLayerAtLayerPath<GVEsriFeature>(test, layerPath);
  }

  /**
   * Adds the elevation Esri Image layer and exposes its registered configuration.
   *
   * @param test - The test instance used to log layer setup steps
   * @param callbacks - Optional selected-path and registered-configuration callbacks
   * @returns A promise resolving with the loaded layer after its legend is queried
   */
  async addLayerEsriImageWithElevation(test: Test, callbacks?: LayerAdditionCallbacks<EsriImageLayerEntryConfig>): Promise<GVEsriImage> {
    const gvLayerId = generateId();
    const layerPath = `${gvLayerId}/${TestConstants.IMAGE_SERVER_ELEVATION_LAYER_ID}`;
    const layerUrl = TestConstants.IMAGE_SERVER_ELEVATION_URL;
    const gvLayerName = 'Esri Image Elevation';

    // Creating the configuration
    test.addStep('Creating the GeoView Layer Configuration...');

    // Create the config
    const gvConfig = EsriImage.createGeoviewLayerConfigSimple(gvLayerId, gvLayerName, layerUrl, false);

    // Redirect to helper to add the layer to the map and wait
    await this.addLayerOnMap(test, gvConfig, layerPath, callbacks);
    return this.waitLayerAtLayerPath<GVEsriImage>(test, layerPath);
  }

  /**
   * Adds the USA Esri Image fixture and exposes its registered configuration.
   *
   * @param test - The test instance used to log layer setup steps
   * @param callbacks - Optional selected-path and registered-configuration callbacks
   * @returns A promise resolving with the loaded layer after its legend is queried
   */
  async addLayerEsriImageWithUSA(test: Test, callbacks?: LayerAdditionCallbacks<EsriImageLayerEntryConfig>): Promise<GVEsriImage> {
    const gvLayerId = generateId();
    const layerUrl = TestConstants.IMAGE_SERVER_USA_URL;
    const layerPathRoads = `${gvLayerId}/base-group/${TestConstants.IMAGE_SERVER_USA_LAYER_ID_ROADS}`;
    const gvLayerName = 'Esri Image USA';

    // Create the config
    test.addStep('Creating the GeoView Layer Configuration...');
    const gvConfig = EsriImage.createGeoviewLayerConfig(gvLayerId, gvLayerName, layerUrl, false, [
      {
        id: TestConstants.IMAGE_SERVER_USA_LAYER_ID_CITIES,
        layerName: 'Cities',
      },
      {
        id: TestConstants.IMAGE_SERVER_USA_LAYER_ID_ROADS,
        layerName: 'Roads',
      },
    ]);

    // Redirect to helper to add the layer to the map and wait
    await this.addLayerOnMap(test, gvConfig, layerPathRoads, callbacks);
    return this.waitLayerAtLayerPath<GVEsriImage>(test, layerPathRoads);
  }

  /**
   * Adds the OWS Terrestris WMS layer and exposes its registered configuration.
   *
   * @param test - The test instance used to log layer setup steps
   * @param callbacks - Optional selected-path and registered-configuration callbacks
   * @returns A promise resolving with the loaded layer after its legend is queried
   */
  async addLayerWMSWithOWSTerrestris(test: Test, callbacks?: LayerAdditionCallbacks<OgcWmsLayerEntryConfig>): Promise<GVWMS> {
    const gvLayerId = generateId();
    const layerPath = `${gvLayerId}/${TestConstants.OWS_TERRESTRIS_LAYER_ID}`;
    const layerUrl = TestConstants.OWS_TERRESTRIS;
    const gvLayerName = 'OWS Terrestris';

    // Create the config
    test.addStep('Creating the GeoView Layer Configuration...');
    const gvConfig = WMS.createGeoviewLayerConfig(gvLayerId, gvLayerName, layerUrl, undefined, false, [
      { id: TestConstants.OWS_TERRESTRIS_LAYER_ID },
    ]);

    // Redirect to helper to add the layer to the map and wait
    await this.addLayerOnMap(test, gvConfig, layerPath, callbacks);
    return this.waitLayerAtLayerPath<GVWMS>(test, layerPath);
  }

  /**
   * Adds the Datacube MSI WMS layer and exposes its registered configuration.
   *
   * @param test - The test instance used to log layer setup steps
   * @param callbacks - Optional selected-path and registered-configuration callbacks
   * @returns A promise resolving with the loaded layer after its legend is queried
   */
  async addLayerWMSWithDatacubeMSI(test: Test, callbacks?: LayerAdditionCallbacks<OgcWmsLayerEntryConfig>): Promise<GVWMS> {
    const gvLayerId = generateId();
    const layerPath = `${gvLayerId}/${TestConstants.DATACUBE_MSI_LAYER_NAME_MSI_OR_MORE}`;
    const layerUrl = TestConstants.DATACUBE_MSI_URL;
    const gvLayerName = 'Datacube MSI';

    // Create the config
    test.addStep('Creating the GeoView Layer Configuration...');
    const gvConfig = WMS.createGeoviewLayerConfig(
      gvLayerId,
      gvLayerName,
      layerUrl,
      undefined,
      false,
      [{ id: TestConstants.DATACUBE_MSI_LAYER_NAME_MSI_OR_MORE }],
      false
    );

    // Redirect to helper to add the layer to the map and wait
    await this.addLayerOnMap(test, gvConfig, layerPath, callbacks);
    return this.waitLayerAtLayerPath<GVWMS>(test, layerPath);
  }

  /**
   * Adds the Datacube Ring of Fire Halifax WMS layer and exposes its registered configuration.
   *
   * @param test - The test instance used to log layer setup steps
   * @param callbacks - Optional selected-path and registered-configuration callbacks
   * @returns A promise resolving with the loaded layer after its legend is queried
   */
  async addLayerWMSWithDatacubeRingOfFire(test: Test, callbacks?: LayerAdditionCallbacks<OgcWmsLayerEntryConfig>): Promise<GVWMS> {
    const gvLayerId = generateId();
    const layerPath = `${gvLayerId}/${TestConstants.DATACUBE_RING_FIRE_LAYER_ID_HALIFAX}`;
    const layerUrl = TestConstants.DATACUBE_RING_FIRE;
    const gvLayerName = 'Halifax';

    // Create the config
    test.addStep('Creating the GeoView Layer Configuration...');
    const gvConfig = WMS.createGeoviewLayerConfig(
      gvLayerId,
      gvLayerName,
      layerUrl,
      undefined,
      false,
      [{ id: TestConstants.DATACUBE_RING_FIRE_LAYER_ID_HALIFAX }],
      false
    );

    // Redirect to helper to add the layer to the map and wait
    await this.addLayerOnMap(test, gvConfig, layerPath, callbacks);
    return this.waitLayerAtLayerPath<GVWMS>(test, layerPath);
  }

  /**
   * Adds the VPN-only landcover WMS group with a group time dimension and exposes its registered configuration.
   *
   * @param test - The test instance used to log layer setup steps
   * @param callbacks - Optional selected-path and registered-configuration callbacks
   * @param isTimeAware - Whether to register the layer with the time slider
   * @returns A promise resolving with the loaded layer after its legend is queried
   */
  async addLayerWMSLandcoverGroupDimensions(
    test: Test,
    callbacks?: LayerAdditionCallbacks<OgcWmsLayerEntryConfig>,
    isTimeAware = false
  ): Promise<GVGroupLayer> {
    const gvLayerId = generateId();
    const layerPath = `${gvLayerId}/${TestConstants.LANDCOVER_CDTK_LAYER_GROUP_ID}`;
    const layerUrl = TestConstants.LANDCOVER_CDTK_URL;
    const gvLayerName = 'Landcover 2010-2020 (XML)';

    // Create the config
    test.addStep('Creating the GeoView Layer Configuration...');
    const gvConfig = WMS.createGeoviewLayerConfig(gvLayerId, gvLayerName, layerUrl, undefined, isTimeAware, [
      { id: TestConstants.LANDCOVER_CDTK_LAYER_GROUP_ID },
    ]);

    // Redirect to helper to add the layer to the map and wait
    await this.addLayerOnMap(test, gvConfig, layerPath, callbacks);
    return this.waitLayerAtLayerPath<GVGroupLayer>(test, layerPath);
  }

  /**
   * Adds the VPN-only landcover WMS sublayers directly and exposes its registered configuration.
   *
   * @param test - The test instance used to log layer setup steps
   * @param callbacks - Optional selected-path and registered-configuration callbacks
   * @returns A promise resolving with the loaded layer after its legend is queried
   */
  async addLayerWMSLandcoverSubLayers(test: Test, callbacks?: LayerAdditionCallbacks<GroupLayerEntryConfig>): Promise<GVWMS> {
    const gvLayerId = generateId();
    const layerPath = gvLayerId;
    const layerUrl = TestConstants.LANDCOVER_CDTK_URL;
    const layerPathGroup = `${gvLayerId}/base-group`;
    const gvLayerName = 'Landcover 2010-2020 (XML)';

    // Create the config
    test.addStep('Creating the GeoView Layer Configuration...');
    const gvConfig = WMS.createGeoviewLayerConfig(gvLayerId, gvLayerName, layerUrl, undefined, false, [
      { id: TestConstants.LANDCOVER_CDTK_LAYER_ID_2010 },
      { id: TestConstants.LANDCOVER_CDTK_LAYER_ID_2015 },
      { id: TestConstants.LANDCOVER_CDTK_LAYER_ID_2020 },
    ]);

    // Redirect to helper to add the layer to the map and wait
    await this.addLayerOnMap(test, gvConfig, layerPathGroup, callbacks);
    return this.waitLayerAtLayerPath<GVWMS>(test, layerPath);
  }

  /**
   * Adds the Nonna WMS layer requiring proxy fallback and exposes its registered configuration.
   *
   * @param test - The test instance used to log layer setup steps
   * @param callbacks - Optional selected-path and registered-configuration callbacks
   * @returns A promise resolving with the loaded layer after its legend is queried
   */
  async addLayerWMSNonna(test: Test, callbacks?: LayerAdditionCallbacks<OgcWmsLayerEntryConfig>): Promise<GVWMS> {
    const gvLayerId = generateId();
    const layerPath = `${gvLayerId}/${TestConstants.NONNA_WMS_LAYER_ID}`;
    const layerUrl = TestConstants.NONNA_WMS_URL;
    const gvLayerName = 'Nonna WMS';

    // Create the config
    test.addStep('Creating the GeoView Layer Configuration...');
    const gvConfig = WMS.createGeoviewLayerConfig(gvLayerId, gvLayerName, layerUrl, undefined, false, [
      { id: TestConstants.NONNA_WMS_LAYER_ID },
    ]);

    // Redirect to helper to add the layer to the map and wait
    await this.addLayerOnMap(test, gvConfig, layerPath, callbacks);
    return this.waitLayerAtLayerPath<GVWMS>(test, layerPath);
  }

  /**
   * Adds the CanImage WMS group with duplicate nested names and exposes its registered configuration.
   *
   * @param test - The test instance used to log layer setup steps
   * @param callbacks - Optional selected-path and registered-configuration callbacks
   * @returns A promise resolving with the loaded layer after its legend is queried
   */
  async addLayerWMSDuplicateGroupNames(test: Test, callbacks?: LayerAdditionCallbacks<OgcWmsLayerEntryConfig>): Promise<GVWMS> {
    const gvLayerId = generateId();
    const layerUrl = TestConstants.CANIMAGE_WMS_URL;
    const groupPath = `${gvLayerId}/${TestConstants.CANIMAGE_WMS_GROUP_ID}`;
    const duplicateGroupPath = `${groupPath}/${TestConstants.CANIMAGE_WMS_GROUP_ID}`;
    const leafPath = `${duplicateGroupPath}/${TestConstants.CANIMAGE_WMS_LEAF_ID}`;
    const gvLayerName = 'CanImage';

    // Create the config using the top-level duplicate group id 'canimage'
    test.addStep('Creating the GeoView Layer Configuration using the duplicate group id...');
    const gvConfig = WMS.createGeoviewLayerConfig(gvLayerId, gvLayerName, layerUrl, undefined, false, [
      { id: TestConstants.CANIMAGE_WMS_GROUP_ID },
    ]);

    // Redirect to helper to add the layer to the map and wait
    // The selected path traverses both identically named groups.
    await this.addLayerOnMap(test, gvConfig, leafPath, callbacks);
    return this.waitLayerAtLayerPath<GVWMS>(test, leafPath);
  }

  /**
   * Adds the world timezones WMTS layer with its tile matrix set and exposes its registered configuration.
   *
   * @param test - The test instance used to log layer setup steps
   * @param callbacks - Optional selected-path and registered-configuration callbacks
   * @returns A promise resolving with the loaded layer after its legend is queried
   */
  async addLayerWMTSWorldTimezones(test: Test, callbacks?: LayerAdditionCallbacks<OgcWmtsLayerEntryConfig>): Promise<GVWMTS> {
    const gvLayerId = generateId();
    const layerPath = `${gvLayerId}/${TestConstants.WORLD_TIMEZONES_WMTS_URL_LAYER_ID}`;
    const layerUrl = TestConstants.WORLD_TIMEZONES_WMTS_URL;
    const gvLayerName = 'World Timezones WMTS';

    // Create the config
    test.addStep('Creating the GeoView Layer Configuration...');
    const gvConfig = WMTS.createGeoviewLayerConfig(gvLayerId, gvLayerName, layerUrl, false, [
      {
        id: TestConstants.WORLD_TIMEZONES_WMTS_URL_LAYER_ID,
        tileMatrixSet: TestConstants.WORLD_TIMEZONES_WMTS_URL_MATRIX_SET_ID,
      },
    ]);

    // Redirect to helper to add the layer to the map and wait
    await this.addLayerOnMap(test, gvConfig, layerPath, callbacks);
    return this.waitLayerAtLayerPath<GVWMTS>(test, layerPath, true);
  }

  /**
   * Adds the OpenStreetMap XYZ tiles layer and exposes its registered configuration.
   *
   * @param test - The test instance used to log layer setup steps
   * @param callbacks - Optional selected-path and registered-configuration callbacks
   * @returns A promise resolving with the loaded layer after its legend is queried
   */
  async addLayerXYZTilesOSM(test: Test, callbacks?: LayerAdditionCallbacks<XYZTilesLayerEntryConfig>): Promise<GVXYZTiles> {
    const gvLayerId = generateId();
    const layerPath = `${gvLayerId}/${TestConstants.XYZ_TILES_OSM_LAYER_ID}`;
    const layerUrl = TestConstants.XYZ_TILES_OSM_URL;
    const gvLayerName = TestConstants.XYZ_TILES_OSM_LAYER_ID;

    // Create the config
    test.addStep('Creating the GeoView Layer Configuration...');
    const gvConfig = XYZTiles.createGeoviewLayerConfig(gvLayerId, gvLayerName, undefined, false, [
      {
        id: TestConstants.XYZ_TILES_OSM_LAYER_ID,
        source: {
          dataAccessPath: layerUrl,
        },
      },
    ]);

    // Redirect to helper to add the layer to the map and wait
    await this.addLayerOnMap(test, gvConfig, layerPath, callbacks);
    return this.waitLayerAtLayerPath<GVXYZTiles>(test, layerPath, true);
  }

  /**
   * Adds the CBMT vector tiles layer for projection 3978 and exposes its registered configuration.
   *
   * @param test - The test instance used to log layer setup steps
   * @param callbacks - Optional selected-path and registered-configuration callbacks
   * @returns A promise resolving with the loaded layer after its legend is queried
   */
  async addLayerVectorTilesCBMT(test: Test, callbacks?: LayerAdditionCallbacks<VectorTilesLayerEntryConfig>): Promise<GVVectorTiles> {
    const gvLayerId = generateId();
    const layerPath = `${gvLayerId}/${TestConstants.VECTOR_TILES_CBMT_3978_LAYER_NAME}`;
    const layerUrl = TestConstants.VECTOR_TILES_CBMT_3978_URL;
    const gvLayerName = TestConstants.VECTOR_TILES_CBMT_3978_LAYER_NAME;
    const gvConfig = VectorTiles.createGeoviewLayerConfig(gvLayerId, gvLayerName, layerUrl, false, [
      { id: TestConstants.VECTOR_TILES_CBMT_3978_LAYER_NAME },
    ]);

    // Creating the configuration
    test.addStep('Creating the GeoView Layer Configuration...');

    // Redirect to helper to add the layer to the map and wait
    await this.addLayerOnMap(test, gvConfig, layerPath, callbacks);
    return this.waitLayerAtLayerPath<GVVectorTiles>(test, layerPath, true);
  }

  /**
   * Adds the GeoMet current conditions WFS layer and exposes its registered configuration.
   *
   * @param test - The test instance used to log layer setup steps
   * @param callbacks - Optional selected-path and registered-configuration callbacks
   * @returns A promise resolving with the loaded layer after its legend is queried
   */
  async addLayerWFSGeometCurrentConditions(test: Test, callbacks?: LayerAdditionCallbacks<OgcWfsLayerEntryConfig>): Promise<GVWFS> {
    const gvLayerId = generateId();
    const layerPath = `${gvLayerId}/${TestConstants.GEOMET_URL_CURRENT_COND_LAYER_ID}`;
    const layerUrl = TestConstants.GEOMET_URL;
    const gvLayerName = 'Current Conditions';

    // Create the config
    test.addStep('Creating the GeoView Layer Configuration...');
    const gvConfig = WFS.createGeoviewLayerConfig(gvLayerId, gvLayerName, layerUrl, false, 'all', [
      { id: TestConstants.GEOMET_URL_CURRENT_COND_LAYER_ID },
    ]);

    // Redirect to helper to add the layer to the map and wait
    // GV Current Conditions isn't returning a legend for us anymore, sending acceptNoIconsOrNoData = true now
    await this.addLayerOnMap(test, gvConfig, layerPath, callbacks);
    return this.waitLayerAtLayerPath<GVWFS>(test, layerPath, true);
  }

  /**
   * Adds the GeoJSON polygons fixture with its service date format and exposes its registered configuration.
   *
   * @param test - The test instance used to log layer setup steps
   * @param callbacks - Optional selected-path and registered-configuration callbacks
   * @returns A promise resolving with the loaded layer after its legend is queried
   */
  async addLayerGeoJSONWithMetadataPolygons(test: Test, callbacks?: LayerAdditionCallbacks<GeoJSONLayerEntryConfig>): Promise<GVGeoJSON> {
    const gvLayerId = generateId();
    const layerPath = `${gvLayerId}/${TestConstants.GEOJSON_POLYGONS}`;
    const layerUrl = TestConstants.GEOJSON_METADATA_META;
    const gvLayerName = 'Polygons JSON';

    // Create the config
    test.addStep('Creating the GeoView Layer Configuration...');
    const gvConfig = GeoJSON.createGeoviewLayerConfig(gvLayerId, gvLayerName, layerUrl, false, [{ id: TestConstants.GEOJSON_POLYGONS }]);

    // Set the service date format, because Polygons date have weirdly formatted dates
    gvConfig.serviceDateFormat = 'DD/MM/YYYYTHH:mm:ss';

    // Redirect to helper to add the layer to the map and wait
    await this.addLayerOnMap(test, gvConfig, layerPath, callbacks);
    return this.waitLayerAtLayerPath<GVGeoJSON>(test, layerPath);
  }

  /**
   * Adds a queryable blank GeoJSON layer and exposes its registered configuration.
   *
   * @param test - The test instance used to log layer setup steps
   * @param callbacks - Optional selected-path and registered-configuration callbacks
   * @returns A promise resolving with the loaded layer after its legend is queried
   */
  async addLayerGeoJSONBlank(test: Test, callbacks?: LayerAdditionCallbacks<GeoJSONLayerEntryConfig>): Promise<GVGeoJSON> {
    const gvLayerId = generateId();
    const layerPath = `${gvLayerId}/${TestConstants.GEOJSON_BLANK}`;

    // Keep the blank fixture queryable for tests that inject features after loading.
    const gvConfig = GeoJSON.createGeoviewLayerConfig(gvLayerId, undefined, TestConstants.GEOJSON_METADATA_META_BLANK, false, [
      { id: TestConstants.GEOJSON_BLANK },
    ]);

    // Redirect to helper to add the layer to the map and wait
    await this.addLayerOnMap(test, gvConfig, layerPath, callbacks);
    return this.waitLayerAtLayerPath<GVGeoJSON>(test, layerPath, true);
  }

  /**
   * Adds the GeoJSON GeometryCollection fixture and exposes its registered configuration.
   *
   * @param test - The test instance used to log layer setup steps
   * @param callbacks - Optional selected-path and registered-configuration callbacks
   * @returns A promise resolving with the loaded layer after its legend is queried
   */
  async addLayerGeoJSONWithGeometryCollection(test: Test, callbacks?: LayerAdditionCallbacks<GeoJSONLayerEntryConfig>): Promise<GVGeoJSON> {
    const gvLayerId = generateId();
    const layerPath = `${gvLayerId}/${TestConstants.GEOJSON_GEOMETRY_COLLECTION}`;
    const layerUrl = TestConstants.GEOJSON_DATASET_ROOT;
    const gvLayerName = 'Geometry Collection JSON';

    // Create the config
    test.addStep('Creating the GeoView Layer Configuration...');
    const gvConfig = GeoJSON.createGeoviewLayerConfig(gvLayerId, gvLayerName, layerUrl, false, [
      { id: TestConstants.GEOJSON_GEOMETRY_COLLECTION },
    ]);

    // Redirect to helper to add the layer to the map and wait
    await this.addLayerOnMap(test, gvConfig, layerPath, callbacks);
    return this.waitLayerAtLayerPath<GVGeoJSON>(test, layerPath);
  }

  /**
   * Adds the Datacube vegetation GeoTIFF layer and exposes its registered configuration.
   *
   * @param test - The test instance used to log layer setup steps
   * @param callbacks - Optional selected-path and registered-configuration callbacks
   * @returns A promise resolving with the loaded layer after its legend is queried
   */
  async addLayerGeoTIFFWithDatacubeVegetation(test: Test, callbacks?: LayerAdditionCallbacks<GeoTIFFLayerEntryConfig>): Promise<GVGeoTIFF> {
    const gvLayerId = generateId();
    const layerPath = `${gvLayerId}/${TestConstants.GEOTIFF_VEGETATION_FILE}`;
    const layerUrl = TestConstants.GEOTIFF_VEGETATION;
    const gvLayerName = 'Datacube Vegetation';

    // Create the config
    test.addStep('Creating the GeoView Layer Configuration...');
    const gvConfig = GeoTIFF.createGeoviewLayerConfig(gvLayerId, gvLayerName, layerUrl, false, [
      { id: TestConstants.GEOTIFF_VEGETATION_FILE },
    ]);

    // Redirect to helper to add the layer to the map and wait
    // Find the layer and wait until its ready, wait longer than default timeout, because TIFF
    await this.addLayerOnMap(test, gvConfig, layerPath, callbacks);
    return this.waitLayerAtLayerPath<GVGeoTIFF>(test, layerPath, true);
  }

  /**
   * Adds the station list CSV layer and exposes its registered configuration.
   *
   * @param test - The test instance used to log layer setup steps
   * @param callbacks - Optional selected-path and registered-configuration callbacks
   * @returns A promise resolving with the loaded layer after its legend is queried
   */
  async addLayerCSVWithStationList(test: Test, callbacks?: LayerAdditionCallbacks<CsvLayerEntryConfig>): Promise<GVCSV> {
    const gvLayerId = generateId();
    const layerPath = `${gvLayerId}/${TestConstants.CSV_STATION_LIST_FILE}`;
    const layerUrl = TestConstants.CSV_STATION_LIST;
    const gvLayerName = 'Station List CSV';

    // Create the config
    test.addStep('Creating the GeoView Layer Configuration...');
    const gvConfig = CSV.createGeoviewLayerConfig(gvLayerId, gvLayerName, layerUrl, false, [{ id: TestConstants.CSV_STATION_LIST_FILE }]);

    // Redirect to helper to add the layer to the map and wait
    await this.addLayerOnMap(test, gvConfig, layerPath, callbacks);
    return this.waitLayerAtLayerPath<GVCSV>(test, layerPath);
  }

  /**
   * Adds the Pygeoapi lakes OGC Feature layer and exposes its registered configuration.
   *
   * @param test - The test instance used to log layer setup steps
   * @param callbacks - Optional selected-path and registered-configuration callbacks
   * @returns A promise resolving with the loaded layer after its legend is queried
   */
  async addLayerOGCFeatureLakes(test: Test, callbacks?: LayerAdditionCallbacks<OgcFeatureLayerEntryConfig>): Promise<GVOGCFeature> {
    const gvLayerId = generateId();
    const layerPath = `${gvLayerId}/${TestConstants.PYGEOAPI_B6RYUVAKK5_LAKES}`;
    const layerUrl = TestConstants.PYGEOAPI_B6RYUVAKK5;
    const gvLayerName = TestConstants.PYGEOAPI_B6RYUVAKK5_LAKES;

    // Create the config
    test.addStep('Creating the GeoView Layer Configuration...');
    const gvConfig = OgcFeature.createGeoviewLayerConfig(gvLayerId, gvLayerName, layerUrl, false, [
      { id: TestConstants.PYGEOAPI_B6RYUVAKK5_LAKES },
    ]);

    // Redirect to helper to add the layer to the map and wait
    await this.addLayerOnMap(test, gvConfig, layerPath, callbacks);
    return this.waitLayerAtLayerPath<GVOGCFeature>(test, layerPath);
  }

  /**
   * Adds the South Africa WKB layer and exposes its registered configuration.
   *
   * @param test - The test instance used to log layer setup steps
   * @param callbacks - Optional selected-path and registered-configuration callbacks
   * @returns A promise resolving with the loaded layer after its legend is queried
   */
  async addLayerWKBWithSouthAfrica(test: Test, callbacks?: LayerAdditionCallbacks<WkbLayerEntryConfig>): Promise<GVWKB> {
    const gvLayerId = generateId();
    const layerPath = `${gvLayerId}/${TestConstants.WKB_SOUTH_AFRICA}`;
    const layerUrl = TestConstants.WKB_SOUTH_AFRICA;
    const gvLayerName = 'WKB South Africa';

    // Create the config
    test.addStep('Creating the GeoView Layer Configuration...');
    const gvConfig = WKB.createGeoviewLayerConfig(gvLayerId, gvLayerName, layerUrl, false, [{ id: TestConstants.WKB_SOUTH_AFRICA }]);

    // Redirect to helper to add the layer to the map and wait
    await this.addLayerOnMap(test, gvConfig, layerPath, callbacks);
    return this.waitLayerAtLayerPath<GVWKB>(test, layerPath, true);
  }

  /**
   * Adds the tornado KML layer and exposes its registered configuration.
   *
   * @param test - The test instance used to log layer setup steps
   * @param callbacks - Optional selected-path and registered-configuration callbacks
   * @returns A promise resolving with the loaded layer after its legend is queried
   */
  async addLayerKMLWithTornado(test: Test, callbacks?: LayerAdditionCallbacks<KmlLayerEntryConfig>): Promise<GVKML> {
    const gvLayerId = generateId();
    const layerPath = `${gvLayerId}/${TestConstants.KML_TORNADO_FILE}`;
    const layerUrl = TestConstants.KML_TORNADO;
    const gvLayerName = 'KML Tornado';

    // Create the config
    test.addStep('Creating the GeoView Layer Configuration...');
    const gvConfig = KML.createGeoviewLayerConfig(gvLayerId, gvLayerName, layerUrl, false, [{ id: TestConstants.KML_TORNADO_FILE }]);

    // Redirect to helper to add the layer to the map and wait
    await this.addLayerOnMap(test, gvConfig, layerPath, callbacks);
    return this.waitLayerAtLayerPath<GVKML>(test, layerPath, true);
  }

  /**
   * Adds the GeoJSON points settings fixture and exposes its registered configuration.
   *
   * @param test - The test instance used to log layer setup steps
   * @param callbacks - Optional selected-path and registered-configuration callbacks
   * @returns A promise resolving with the loaded layer after its legend is queried
   */
  async addLayerGeoJSONPointsSettingsUnderGroup(
    test: Test,
    callbacks?: LayerAdditionCallbacks<GeoJSONLayerEntryConfig>
  ): Promise<GVGeoJSON> {
    const geoviewLayerId = generateId();
    const gvConfig = GVAbstractTester.createGeoJsonPointsSettings(geoviewLayerId);
    const groupPath = `${geoviewLayerId}/point-feature-group`;
    const layerPath = `${groupPath}/points_1.json`;

    // Redirect to helper to add the layer to the map and wait
    await this.addLayerOnMap(test, gvConfig, layerPath, callbacks);
    return this.waitLayerAtLayerPath<GVGeoJSON>(test, layerPath);
  }

  /**
   * Adds the Esri Dynamic Water Network fixture and exposes its registered configuration.
   *
   * @param test - The test instance used to log layer setup steps
   * @param gvLayerName - Optional display name for the GeoView layer
   * @param callbacks - Optional selected-path and registered-configuration callbacks
   * @returns A promise resolving with the loaded layer after its legend is queried
   */
  async addLayerEsriDynamicWaterNetwork(
    test: Test,
    gvLayerName = 'Esri Dynamic Water Network',
    callbacks?: LayerAdditionCallbacks<EsriDynamicLayerEntryConfig>
  ): Promise<GVEsriDynamic> {
    const gvLayerId = generateId();
    const layerPath = `${gvLayerId}/${TestConstants.WATER_NETWORK_LAYER_ID}`;
    const layerUrl = TestConstants.WATER_NETWORK_MAP_SERVER;

    // Create the config
    test.addStep('Creating the GeoView Layer Configuration...');
    const gvConfig = EsriDynamic.createGeoviewLayerConfig(gvLayerId, gvLayerName, layerUrl, false, [
      { id: TestConstants.WATER_NETWORK_LAYER_ID },
    ]);

    // Redirect to helper to add the layer to the map and wait
    await this.addLayerOnMap(test, gvConfig, layerPath, callbacks);
    return this.waitLayerAtLayerPath<GVEsriDynamic>(test, layerPath);
  }

  /**
   * Adds the Esri Feature Water Network fixture and exposes its registered configuration.
   *
   * @param test - The test instance used to log layer setup steps
   * @param gvLayerName - Optional display name for the GeoView layer
   * @param callbacks - Optional selected-path and registered-configuration callbacks
   * @returns A promise resolving with the loaded layer after its legend is queried
   */
  async addLayerEsriFeatureWaterNetwork(
    test: Test,
    gvLayerName = 'Esri Feature Water Network',
    callbacks?: LayerAdditionCallbacks<EsriFeatureLayerEntryConfig>
  ): Promise<GVEsriFeature> {
    const gvLayerId = generateId();
    const layerPath = `${gvLayerId}/${TestConstants.WATER_NETWORK_LAYER_ID}`;
    const layerUrl = TestConstants.WATER_NETWORK_MAP_SERVER;

    // Create the config
    test.addStep('Creating the GeoView Layer Configuration...');
    const gvConfig = EsriFeature.createGeoviewLayerConfig(gvLayerId, gvLayerName, layerUrl, false, [
      { id: TestConstants.WATER_NETWORK_LAYER_ID },
    ]);

    // Redirect to helper to add the layer to the map and wait
    await this.addLayerOnMap(test, gvConfig, layerPath, callbacks);
    return this.waitLayerAtLayerPath<GVEsriFeature>(test, layerPath);
  }

  /**
   * Adds the single-point GeoJSON layer and exposes its registered configuration.
   *
   * @param test - The test instance used to log layer setup steps
   * @param callbacks - Optional selected-path and registered-configuration callbacks
   * @returns A promise resolving with the loaded layer after its legend is queried
   */
  async addLayerGeoJSONSinglePoint(test: Test, callbacks?: LayerAdditionCallbacks<GeoJSONLayerEntryConfig>): Promise<GVGeoJSON> {
    const gvLayerId = generateId();
    const layerPath = `${gvLayerId}/${TestConstants.GEOJSON_SINGLE_POINT}`;
    const layerUrl = TestConstants.GEOJSON_METADATA_META;

    // Create the config
    test.addStep('Creating the GeoView Layer Configuration...');
    const gvConfig = GeoJSON.createGeoviewLayerConfig(gvLayerId, undefined, layerUrl, false, [{ id: TestConstants.GEOJSON_SINGLE_POINT }]);

    // Redirect to helper to add the layer to the map and wait
    await this.addLayerOnMap(test, gvConfig, layerPath, callbacks);
    return this.waitLayerAtLayerPath<GVGeoJSON>(test, layerPath);
  }

  /**
   * Adds a featureless GeoJSON layer with an explicit extent and exposes its registered configuration.
   *
   * @param test - The test instance used to log layer setup steps
   * @param callbacks - Optional selected-path and registered-configuration callbacks
   * @returns A promise resolving with the loaded layer after its legend is queried
   */
  async addLayerGeoJSONBlankWithConfiguredExtent(
    test: Test,
    callbacks?: LayerAdditionCallbacks<GeoJSONLayerEntryConfig>
  ): Promise<GVGeoJSON> {
    const gvLayerId = generateId();
    const layerPath = `${gvLayerId}/${TestConstants.GEOJSON_BLANK}`;
    const layerUrl = TestConstants.GEOJSON_METADATA_META_BLANK;

    // Create the config
    test.addStep('Creating the GeoView Layer Configuration...');
    const gvConfig = GeoJSON.createGeoviewLayerConfig(gvLayerId, undefined, layerUrl, false, [{ id: TestConstants.GEOJSON_BLANK }]);

    // TODO: No need to do this if the function call above is fixed, Search id : 59026aa9
    const gvLayerConfig = gvConfig.listOfLayerEntryConfig[0];
    gvLayerConfig.getSource().extent = [-87.77486341686723, 51.62285357468582, -84.57727128084842, 53.833354975551075];

    // Redirect to helper to add the layer to the map and wait
    await this.addLayerOnMap(test, gvConfig, layerPath, callbacks);
    return this.waitLayerAtLayerPath<GVGeoJSON>(test, layerPath);
  }

  /**
   * Adds the top projects Esri Dynamic layer with restricted outfields and exposes its registered configuration.
   *
   * @param test - The test instance used to log layer setup steps
   * @param callbacks - Optional selected-path and registered-configuration callbacks
   * @returns A promise resolving with the loaded layer after its legend is queried
   */
  async addLayerEsriDynamicTopProjectsWithRestrictedOutfields(
    test: Test,
    callbacks?: LayerAdditionCallbacks<EsriDynamicLayerEntryConfig>
  ): Promise<GVEsriDynamic> {
    const gvLayerId = generateId();
    const layerPath = `${gvLayerId}/${TestConstants.TOP_PROJECTS_900A_LAYER_ID}`;
    const gvLayerName = 'gvLayerName';

    // Create the config
    test.addStep('Creating the GeoView Layer Configuration...');
    const gvConfig = EsriDynamic.createGeoviewLayerConfig(gvLayerId, gvLayerName, TestConstants.TOP_PROJECTS_900A_URL_MAP_SERVER, false, [
      {
        id: TestConstants.TOP_PROJECTS_900A_LAYER_ID,
        layerName: TestConstants.TOP_PROJECTS_900A_LAYER_NAME,
      },
    ]);

    // TODO: No need to do this if the function call above is fixed, Search id : 59026aa9
    const gvLayerConfig = gvConfig.listOfLayerEntryConfig[0] as EsriDynamicLayerEntryConfig;
    gvLayerConfig.getSource().featureInfo ??= {};
    gvLayerConfig.getSource().featureInfo!.outfields = TestConstants.TOP_PROJECTS_900A_OUTFIELDS;

    // Redirect to helper to add the layer to the map and wait
    await this.addLayerOnMap(test, gvConfig, layerPath, callbacks);
    return this.waitLayerAtLayerPath<GVEsriDynamic>(test, layerPath, true);
  }

  /**
   * Adds the GNWT boundaries Esri Dynamic layer and exposes its registered configuration.
   *
   * @param test - The test instance used to log layer setup steps
   * @param callbacks - Optional selected-path and registered-configuration callbacks
   * @returns A promise resolving with the loaded layer after its legend is queried
   */
  async addLayerEsriDynamicGNWTBoundaries(
    test: Test,
    callbacks?: LayerAdditionCallbacks<EsriDynamicLayerEntryConfig>
  ): Promise<GVEsriDynamic> {
    const gvLayerId = generateId();
    const layerPath = `${gvLayerId}/${TestConstants.GNWT_BOUNDARIES_LAYER_ID}`;
    const gvLayerName = 'GNWT Boundaries';

    // Create the config
    test.addStep('Creating the GeoView Layer Configuration...');
    const gvConfig = EsriDynamic.createGeoviewLayerConfig(gvLayerId, gvLayerName, TestConstants.GNWT_BOUNDARIES_URL_MAP_SERVER, false, [
      { id: TestConstants.GNWT_BOUNDARIES_LAYER_ID },
    ]);

    // Add the layer and wait for its configuration to register.
    await this.addLayerOnMap(test, gvConfig, layerPath, callbacks);
    return this.waitLayerAtLayerPath<GVEsriDynamic>(test, layerPath, true);
  }

  /**
   * Adds the cities WMS layer with an explicit WFS layer association and exposes its registered configuration.
   *
   * @param test - The test instance used to log layer setup steps
   * @param callbacks - Optional selected-path and registered-configuration callbacks
   * @returns A promise resolving with the loaded layer after its legend is queried
   */
  async addLayerWMSCitiesWithWFS(test: Test, callbacks?: LayerAdditionCallbacks<OgcWmsLayerEntryConfig>): Promise<GVWMS> {
    const gvLayerId = generateId();
    const layerPath = `${gvLayerId}/${TestConstants.CITIES_WMS_LAYER_ID}`;
    const layerName = 'Cities';

    // Create the config
    test.addStep('Creating the GeoView Layer Configuration...');
    const gvConfig = WMS.createGeoviewLayerConfig(gvLayerId, undefined, TestConstants.CITIES_WMS_URL, undefined, false, [
      {
        id: TestConstants.CITIES_WMS_LAYER_ID,
        layerName,
      },
    ]);

    // TODO: No need to do this if the function call above is fixed, Search id : 59026aa9
    const gvLayerConfig = gvConfig.listOfLayerEntryConfig[0];
    gvLayerConfig.setWfsLayerId(TestConstants.CITIES_WFS_LAYER_ID);

    // Redirect to helper to add the layer to the map and wait
    await this.addLayerOnMap(test, gvConfig, layerPath, callbacks);
    return this.waitLayerAtLayerPath<GVWMS>(test, layerPath, true);
  }

  /**
   * Zooms to level 4 and adds the VPN-only airborne radioactivity WMS layer for WFS queries, accepting an empty legend.
   *
   * @param test - The test instance used to log layer setup steps
   * @param callbacks - Optional selected-path and registered-configuration callbacks
   * @returns A promise resolving with the loaded layer after its legend is queried
   */
  async addLayerWMSAirborneWithWFS(test: Test, callbacks?: LayerAdditionCallbacks<OgcWmsLayerEntryConfig>): Promise<GVWMS> {
    const gvLayerId = generateId();
    const layerPath = `${gvLayerId}/${TestConstants.AIRBORNE_RADIOACTIVITY_WMS_LAYER_ID}`;
    const metadataAccessPath = TestConstants.AIRBORNE_RADIOACTIVITY_WMS_URL;
    const layerName = 'Airborne Radioactivity';

    // Create the config
    test.addStep('Creating the GeoView Layer Configuration...');
    const gvConfig = WMS.createGeoviewLayerConfig(gvLayerId, undefined, metadataAccessPath, undefined, false, [
      {
        id: TestConstants.AIRBORNE_RADIOACTIVITY_WMS_LAYER_ID,
        layerName,
      },
    ]);

    // Redirect to helper to add the layer to the map and wait
    await this.addLayerOnMap(test, gvConfig, layerPath, callbacks);
    return this.waitLayerAtLayerPath<GVWMS>(test, layerPath);
  }

  /**
   * Adds the ZPEGT WMS group, optionally alongside an airport sibling, and exposes its registered configuration.
   *
   * @param test - The test instance used to log layer setup steps
   * @param geoviewLayerName - Optional configured display name for the GeoView layer
   * @param includeAirport - Optional flag to include the airport sibling
   * @param callbacks - Optional selected-path and registered-configuration callbacks
   * @returns A promise resolving with the loaded layer after its legend is queried
   */
  async addLayerWMSZpegtGroup(
    test: Test,
    geoviewLayerName?: string,
    includeAirport = false,
    callbacks?: LayerAdditionCallbacks<OgcWmsLayerEntryConfig>
  ): Promise<GVWMS> {
    const gvLayerId = generateId();
    const zpegtLayerId = TestConstants.TRANSPORTS_WMS_ZPEGT_LAYER_ID;
    const selectedLayerPath = includeAirport ? `${gvLayerId}/base-group/${zpegtLayerId}` : `${gvLayerId}/${zpegtLayerId}`;

    test.addStep('Creating the ZPEGT WMS configuration...');
    // Include the airport as a sibling in the variant that checks group resolution with multiple entries.
    const layerEntries = includeAirport
      ? [{ id: TestConstants.TRANSPORTS_WMS_AIRPORT_LAYER_ID }, { id: zpegtLayerId }]
      : [{ id: zpegtLayerId }];
    const gvConfig = WMS.createGeoviewLayerConfig(
      gvLayerId,
      geoviewLayerName,
      TestConstants.TRANSPORTS_WMS_URL,
      undefined,
      false,
      layerEntries
    );

    // Redirect to helper to add the layer to the map and wait
    await this.addLayerOnMap(test, gvConfig, selectedLayerPath, callbacks);
    return this.waitLayerAtLayerPath<GVWMS>(test, selectedLayerPath, true);
  }

  /**
   * Adds the railway GeoPackage table containing an empty field name and exposes its registered configuration.
   *
   * @param test - The test instance used to log fixture setup
   * @param callbacks - Optional selected-path and registered-configuration callbacks
   * @returns A promise resolving with the loaded layer after its legend is queried
   */
  async addGeopackageRailwaysCartoFerDebarcadere(
    test: Test,
    callbacks?: LayerAdditionCallbacks<WkbLayerEntryConfig>
  ): Promise<AbstractGVLayer> {
    const gvLayerId = generateId();
    const tableId = 'carto_fer_debarcadere';
    const selectedLayerPath = `${gvLayerId}/${tableId}`;

    test.addStep('Reading the Railways Empty Field GeoPackage...');
    callbacks?.onLayerPath?.(gvLayerId, selectedLayerPath);
    const gvConfig = await GeoPackageReader.createLayerConfigFromGeoPackage({
      geoviewLayerId: gvLayerId,
      geoviewLayerName: 'Railways Empty Field',
      geoviewLayerType: 'GeoPackage',
      metadataAccessPath: './datasets/geopackages/railways-emptyfieldname.gpkg',
    });
    const tableConfig = gvConfig.listOfLayerEntryConfig.find((entry) => entry.layerId === tableId);
    gvConfig.listOfLayerEntryConfig = [tableConfig!];
    await this.addLayerOnMap(test, gvConfig, selectedLayerPath, { onConfig: callbacks?.onConfig });
    return this.waitLayerAtLayerPath<AbstractGVLayer>(test, selectedLayerPath);
  }

  /**
   * Reports that the former labour force GeoCore fixture is no longer supported.
   *
   * @param _test - The test instance used to log layer setup steps
   * @param _callbacks - Optional selected-path and registered-configuration callbacks
   * @returns A promise rejected because this fixture is no longer supported
   */
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  addLayerEsriDynamicWithRasterLayersViaGeocore(
    _test: Test,
    _callbacks?: LayerAdditionCallbacks<EsriDynamicLayerEntryConfig>
  ): Promise<GVEsriDynamic> {
    // Not supported anymore, needs replacement
    // TODO: Find a replacement to test EsriDynamic with raster layers via geocore, because this layer uuid ac2096a6-7b4a-464e-9e08-eca7873dd88c got scrapped/replaced in the catalog
    return Promise.reject(new NotImplementedError('addLayerEsriDynamicWithRasterLayersViaGeocore is not supported anymore'));
    // const gvLayerId = GVAbstractTester.ESRI_DYNAMIC_LABOUR_FORCE_UUID;
    // return (async (): Promise<GVEsriDynamic> => {
    //   const selectedPath = `${gvLayerId}/${GVAbstractTester.ESRI_DYNAMIC_LABOUR_FORCE_CANECUMENE}`;
    //   const config = await this.addLayerOnMapFromUUID<EsriDynamicLayerEntryConfig>(
    //     _test, gvLayerId, selectedPath, undefined, _callbacks
    //   );
    //   const root = config.getGeoviewLayerId();
    //   await this.waitLayerAtLayerPath<GVEsriDynamic>(_test, `${root}/${GVAbstractTester.ESRI_DYNAMIC_LABOUR_FORCE_PETROLEUM}`);
    //   await this.waitLayerAtLayerPath<GVEsriDynamic>(_test, `${root}/${GVAbstractTester.ESRI_DYNAMIC_LABOUR_FORCE_MINERALS}`);
    //   await this.waitLayerAtLayerPath<GVEsriDynamic>(_test, `${root}/${GVAbstractTester.ESRI_DYNAMIC_LABOUR_FORCE_FORESTRY}`);
    //   await this.waitLayerAtLayerPath<GVEsriDynamic>(_test, `${root}/${GVAbstractTester.ESRI_DYNAMIC_LABOUR_FORCE_FISHERIES}`);
    //   await this.waitLayerAtLayerPath<GVEsriDynamic>(_test, `${root}/${GVAbstractTester.ESRI_DYNAMIC_LABOUR_FORCE_AGRICULTURE}`);
    //   return this.waitLayerAtLayerPath<GVEsriDynamic>(_test, `${root}/${GVAbstractTester.ESRI_DYNAMIC_LABOUR_FORCE_CANECUMENE}`);
    // })();
  }

  /**
   * Adds the marine fisheries GeoCore fixture and selects its initially hidden group.
   *
   * @param test - The test instance used to log layer setup and readiness
   * @param callbacks - Optional selected-path and registered-configuration callbacks
   * @returns A promise resolving with the loaded layer after its legend is queried
   */
  async addLayerEsriDynamicMarineFisheriesViaGeocore(
    test: Test,
    callbacks?: LayerAdditionCallbacks<EsriDynamicLayerEntryConfig>
  ): Promise<GVEsriDynamic> {
    test.addStep('Adding the Marine Fisheries layer on the map via UUID...');

    const config = await this.addLayerOnMapFromUUID<EsriDynamicLayerEntryConfig>(
      test,
      TestConstants.GEOCORE_MARINE_FISHERIES_UUID,
      TestConstants.GEOCORE_MARINE_FISHERIES_LAYER_PATH_GROUP_NON_VISIBLE,
      undefined,
      callbacks
    );
    return this.waitLayerAtLayerPath<GVEsriDynamic>(test, config.layerPath);
  }

  /**
   * Adds the commemorative GeoCore fixture.
   *
   * @param test - The test instance used to log layer setup and readiness
   * @param callbacks - Optional selected-path and registered-configuration callbacks
   * @returns A promise resolving with the loaded layer after its legend is queried
   */
  async addLayerCommemorativeViaGeocore(
    test: Test,
    callbacks?: LayerAdditionCallbacks<EsriDynamicLayerEntryConfig>
  ): Promise<GVEsriDynamic> {
    test.addStep('Adding the Commemorative layer on the map via UUID...');

    const config = await this.addLayerOnMapFromUUID<EsriDynamicLayerEntryConfig>(
      test,
      TestConstants.GEOCORE_COMMEMORATIVE_UUID,
      TestConstants.GEOCORE_COMMEMORATIVE_LAYER_PATH,
      undefined,
      callbacks
    );
    return this.waitLayerAtLayerPath<GVEsriDynamic>(test, config.layerPath);
  }

  /**
   * Adds the permafrost ecoprovince Esri Feature fixture through GeoCore.
   *
   * @param test - The test instance used to log layer setup and readiness
   * @param callbacks - Optional selected-path and registered-configuration callbacks
   * @returns A promise resolving with the loaded layer after its legend is queried
   */
  async addLayerEsriFeaturePermafrostEcoprovinceViaGeocore(
    test: Test,
    callbacks?: LayerAdditionCallbacks<EsriFeatureLayerEntryConfig>
  ): Promise<GVEsriFeature> {
    test.addStep('Adding the Permafrost Ecoprovince layer on the map via UUID...');

    const config = await this.addLayerOnMapFromUUID<EsriFeatureLayerEntryConfig>(
      test,
      TestConstants.GEOCORE_PERMAFROST_ECOPROVINCE_UUID,
      TestConstants.GEOCORE_PERMAFROST_ECOPROVINCE_LAYER_PATH,
      undefined,
      callbacks
    );
    return this.waitLayerAtLayerPath<GVEsriFeature>(test, config.layerPath);
  }

  /**
   * Adds the Esri Dynamic GeoCore fixture backed by a case-sensitive export service.
   *
   * @param test - The test instance used to log layer setup and readiness
   * @param callbacks - Optional selected-path and registered-configuration callbacks
   * @returns A promise resolving with the loaded layer after its legend is queried
   */
  async addLayerEsriDynamicCaseSensitiveExportViaGeocore(
    test: Test,
    callbacks?: LayerAdditionCallbacks<EsriDynamicLayerEntryConfig>
  ): Promise<GVEsriDynamic> {
    test.addStep('Adding the Sentinelle Biodiversity layer on the map via UUID...');

    const config = await this.addLayerOnMapFromUUID<EsriDynamicLayerEntryConfig>(
      test,
      TestConstants.ESRI_DYNAMIC_SENTINELLE_BIODIVERSITY_UUID,
      TestConstants.ESRI_DYNAMIC_SENTINELLE_BIODIVERSITY_LAYER_PATH,
      undefined,
      callbacks
    );
    return this.waitLayerAtLayerPath<GVEsriDynamic>(test, config.layerPath);
  }

  /**
   * Adds the airborne radioactivity Esri Dynamic fixture through GeoCore.
   *
   * @param test - The test instance used to log layer setup and readiness
   * @param customLayerEntryConfig - Optional serialized inline layer entry configuration
   * @param customLayerPath - Optional selected layer path; defaults to the airborne child path
   * @param callbacks - Optional selected-path and registered-configuration callbacks
   * @returns A promise resolving with the loaded layer after its legend is queried
   */
  async addLayerEsriDynamicAirborneViaGeocore(
    test: Test,
    customLayerEntryConfig?: string,
    customLayerPath?: string,
    callbacks?: LayerAdditionCallbacks<EsriDynamicLayerEntryConfig>
  ): Promise<GVEsriDynamic> {
    test.addStep('Adding the Airborne layer on the map via UUID...');

    const config = await this.addLayerOnMapFromUUID<EsriDynamicLayerEntryConfig>(
      test,
      TestConstants.AIRBORNE_RADIOACTIVITY_UUID,
      customLayerPath ?? TestConstants.AIRBORNE_RADIOACTIVITY_UUID_WITH_SUFFIX,
      customLayerEntryConfig,
      callbacks
    );
    return this.waitLayerAtLayerPath<GVEsriDynamic>(test, config.layerPath);
  }

  /**
   * Adds the CESI Esri Dynamic fixture through GeoCore.
   *
   * @param test - The test instance used to log layer setup and readiness
   * @param customLayerEntryConfig - Optional serialized inline layer entry configuration
   * @param customLayerPath - Optional selected layer path; defaults to the water quantity child path
   * @param callbacks - Optional selected-path and registered-configuration callbacks
   * @returns A promise resolving with the loaded layer after its legend is queried
   */
  async addLayerEsriDynamicCESIViaGeocore(
    test: Test,
    customLayerEntryConfig?: string,
    customLayerPath?: string,
    callbacks?: LayerAdditionCallbacks<EsriDynamicLayerEntryConfig>
  ): Promise<GVEsriDynamic> {
    test.addStep('Adding the CESI layer on the map via GeoCore...');

    const config = await this.addLayerOnMapFromUUID<EsriDynamicLayerEntryConfig>(
      test,
      TestConstants.GEOCORE_CESI_UUID,
      customLayerPath ?? TestConstants.GEOCORE_CESI_WATER_QUANTITY_MONITORING_LAYER_PATH,
      customLayerEntryConfig,
      callbacks
    );
    return this.waitLayerAtLayerPath<GVEsriDynamic>(test, config.layerPath);
  }

  /**
   * Adds an IAAC GeoCore fixture with an inline group override and waits for its generated group to be ready.
   *
   * @param test - The test instance used to log layer setup
   * @param customLayerEntryConfig - Serialized inline group configuration without an explicit group layer ID
   * @param callbacks - Optional selected-path and registered-configuration callbacks
   * @returns A promise resolving with the group after its leaf layers load and its legend is queried
   * @throws {TestError} When the generated entry is not a group
   */
  async addLayerIAACInlineViaGeocore(
    test: Test,
    customLayerEntryConfig: string,
    callbacks?: LayerAdditionCallbacks<GroupLayerEntryConfig>
  ): Promise<GVGroupLayer> {
    test.addStep('Adding the IAAC GeoCore record with an inline group...');

    const uuid = TestConstants.GEOCORE_IAAC_UUID;
    const config = await this.addLayerOnMapFromUUID<GroupLayerEntryConfig>(
      test,
      uuid,
      `${uuid}/base-group`,
      customLayerEntryConfig,
      callbacks
    );

    // Group legend events have no icons of their own.
    return this.waitLayerAtLayerPath(test, config.layerPath, true);
  }

  /**
   * Adds the Major Economic Projects point WMS fixture through GeoCore.
   *
   * @param test - The test instance used to log layer setup and readiness
   * @param customLayerEntryConfig - Optional serialized inline layer entry configuration
   * @param customLayerPath - Optional selected layer path; defaults to the major economic projects point path
   * @param callbacks - Optional selected-path and registered-configuration callbacks
   * @returns A promise resolving with the loaded layer after its legend is queried
   */
  async addLayerWMSMajorEconomicPointViaGeocore(
    test: Test,
    customLayerEntryConfig?: string,
    customLayerPath?: string,
    callbacks?: LayerAdditionCallbacks<EsriDynamicLayerEntryConfig>
  ): Promise<GVEsriDynamic> {
    test.addStep('Adding the Major Economic Points layer on the map via GeoCore...');

    const config = await this.addLayerOnMapFromUUID<EsriDynamicLayerEntryConfig>(
      test,
      TestConstants.WMS_MAJOR_ECONOMIC_POINT_UUID,
      customLayerPath ?? TestConstants.WMS_MAJOR_ECONOMIC_POINT_LAYER_PATH,
      customLayerEntryConfig,
      callbacks
    );
    return this.waitLayerAtLayerPath<GVEsriDynamic>(test, config.layerPath);
  }

  /**
   * Adds the land-cover WMS fixture through GeoCore.
   *
   * @param test - The test instance used to log layer setup and readiness
   * @param customLayerEntryConfig - Optional serialized inline layer entry configuration
   * @param customLayerPath - Optional selected layer path under the land-cover UUID; defaults to the 2010 land-cover path
   * @param callbacks - Optional selected-path and registered-configuration callbacks
   * @returns A promise resolving with the loaded layer after its legend is queried
   */
  async addLayerWMSLancoverViaGeocore(
    test: Test,
    customLayerEntryConfig?: string,
    customLayerPath?: string,
    callbacks?: LayerAdditionCallbacks<OgcWmsLayerEntryConfig>
  ): Promise<GVWMS> {
    test.addStep('Adding the Landcover layer on the map via GeoCore...');

    const config = await this.addLayerOnMapFromUUID<OgcWmsLayerEntryConfig>(
      test,
      TestConstants.GEOCORE_LAND_COVER_UUID,
      customLayerPath ?? TestConstants.GEOCORE_LAND_COVER_LAYER_PATH,
      customLayerEntryConfig,
      callbacks
    );
    return this.waitLayerAtLayerPath<GVWMS>(test, config.layerPath);
  }

  /**
   * Starts adding a fixture layer and waits for its selected configuration to register.
   *
   * @param test - The test instance used to log addition and readiness steps
   * @param gvConfig - The configuration of the fixture layer to add
   * @param layerPath - The selected layer configuration path
   * @param callbacks - Optional selected-path and registered-configuration callbacks
   * @returns A promise that resolves with the registered configuration after the configuration callback
   */
  async addLayerOnMap<T extends ConfigBaseClass>(
    test: Test,
    gvConfig: TypeGeoviewLayerConfig,
    layerPath: string,
    callbacks?: LayerAdditionCallbacks<T>
  ): Promise<T> {
    // Callback with the layer path
    callbacks?.onLayerPath?.(gvConfig.geoviewLayerId, layerPath);

    test.addStep('Adding the layer on the map...');
    const layerAddition = this.getControllersRegistry().layerCreatorController.addGeoviewLayer(gvConfig);

    // Wait for the layer config to get registered
    test.addStep(`Wait for the layer config ${layerPath} to be registered...`);
    const config = (await this.getControllersRegistry().layerController.waitForLayerConfigRegistered(layerPath)) as T;

    // Callback with the config
    await callbacks?.onConfig?.(config);

    // Wait for the layer to be added on the map
    test.addStep('Waiting for the layer to be added on map...');
    await layerAddition.promiseLayerOnMap;

    // Return the config
    return config;
  }

  /**
   * Adds a GeoView layer by GeoCore UUID and waits for the selected configuration to register.
   *
   * @param test - The test instance used to log layer setup steps
   * @param uuid - The GeoCore UUID used to add the layer
   * @param layerPath - The selected layer configuration path
   * @param layerEntryConfig - Optional layer entry configuration for the layer addition
   * @param callbacks - Optional selected-path and registered-configuration callbacks
   * @returns A promise that resolves with the registered configuration after the configuration callback
   * @throws {Error} When GeoCore does not return a layer addition result
   */
  async addLayerOnMapFromUUID<T extends ConfigBaseClass>(
    test: Test,
    uuid: string,
    layerPath: string,
    layerEntryConfig?: string,
    callbacks?: LayerAdditionCallbacks<T>
  ): Promise<T> {
    if (layerPath !== uuid && !layerPath.startsWith(`${uuid}/`)) throw new Error(`Layer path '${layerPath}' is not under '${uuid}'`);

    // Add the geoview layer by geocore uuid
    test.addStep('Adding the layer on the map...');
    const layerAddition = await this.getControllersRegistry().layerCreatorController.addGeoviewLayerByGeoCoreUUID(uuid, layerEntryConfig);
    if (!layerAddition) throw new Error(`GeoCore did not create a layer for '${uuid}'`);

    // Read paths
    const root = layerAddition.layer.getGeoviewLayerId();
    const actualLayerPath = `${root}${layerPath.slice(uuid.length)}`;

    // Callback
    callbacks?.onLayerPath?.(root, actualLayerPath);

    // Wait for the layer to get registered
    test.addStep(`Wait for the layer config ${actualLayerPath} to be registered...`);
    const config = (await this.getControllersRegistry().layerController.waitForLayerConfigRegistered(actualLayerPath)) as T;

    // Callback with the config
    await callbacks?.onConfig?.(config);

    // Wait for the layer to be fully added on the map
    test.addStep('Waiting for the layer to be added on map...');
    await layerAddition.promiseLayerOnMap;

    // Return the config
    return config;
  }

  /**
   * Waits for a layer's box to mount in both panels without changing group or tab state.
   *
   * @param test - The test instance used to record readiness steps
   * @param layerPath - The full path of the layer to wait for
   * @param timeout - Maximum wait in milliseconds for each readiness condition
   * @returns The registered layer configuration
   */
  async waitForLayerBoxInLayersPanels(test: Test, layerPath: string, timeout = 60000): Promise<ConfigBaseClass> {
    const mapId = this.getMapId();

    // Wait for the layer config to be registered
    test.addStep(`Waiting for layer config to be registered at layer path ${layerPath}...`);
    const layerConfig = await this.getControllersRegistry().layerController.waitForLayerConfigRegistered(layerPath, timeout);

    test.addStep('Waiting for fixture entries in the Legend and Layers panels...');
    await whenThisThen(() => getStoreLayerLegendLayerByPath(mapId, layerPath), timeout);

    test.addStep('Waiting for UI to hold the box...');
    await whenThisThen(() => {
      return (
        (DomHelper.getLayerBoxInLayersPanel(mapId, layerPath, CONTAINER_TYPE.APP_BAR) ||
          DomHelper.getLayerBoxInLayersPanel(mapId, layerPath, CONTAINER_TYPE.FOOTER_BAR)) &&
        (DomHelper.getLayerBoxInLegendPanel(mapId, layerPath, CONTAINER_TYPE.APP_BAR) ||
          DomHelper.getLayerBoxInLegendPanel(mapId, layerPath, CONTAINER_TYPE.FOOTER_BAR))
      );
    }, timeout);

    // Return the layer config
    return layerConfig;
  }

  /**
   * Waits until the layer at the given layer path has loaded once, and waits until its legend has been queried.
   *
   * Each step of the process is logged into the provided test instance for traceability and debugging.
   * The legend wait ignores empty-icon and `no data` legend payloads by default; pass `acceptNoIconsOrNoData` as true
   * to accept those payloads as a valid resolution (useful for layers whose service legitimately reports no icons).
   *
   * @param test - The test instance used to log each step in the layer check process
   * @param layerPath - The unique path or ID used to retrieve the added layer from the map viewer
   * @param acceptNoIconsOrNoData - Optional. When true, a legend with no icons or with a `no data` first icon is accepted as a valid resolution. Defaults to false
   * @returns A promise that resolves to the fully loaded GeoView layer instance
   * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path
   * @throws {LayerWrongTypeError} When the layer is of wrong type at the given layer path
   */
  async waitLayerAtLayerPath<T extends AbstractBaseGVLayer>(test: Test, layerPath: string, acceptNoIconsOrNoData = false): Promise<T> {
    // Wait for the layer to get registered
    test.addStep(`Wait for the layer ${layerPath} to be registered...`);
    const layer = await this.getControllersRegistry().layerController.waitForLayerRegistered(layerPath);

    // Wait until the layer has at least loaded once
    test.addStep(`Waiting for the layer to be loaded at least once...`);
    await layer.waitForLoadedOnce();

    // Wait until the legend has been queried
    // TODO: CHECK - Do we really have to wait for the legend to be queried if we're waiting for the layer to be loaded just above?
    // TO.DOCONT: Can the legend arrive after loaded status in some layer types maybe? Vector layers?
    test.addStep(`Wait for the legend to be queried...`);
    await this.getControllersRegistry().layerSetController.legendsLayerSet.waitForLegendQueried(layerPath, acceptNoIconsOrNoData);

    // Return the layer
    return layer as T;
  }

  /**
   * Removes a layer or all top-level entries under a GeoView layer root and asserts that they are gone.
   *
   * Fixture cleanup paths may be root IDs when metadata determines the child paths asynchronously.
   *
   * @param test - The test instance used to record each step of the removal process
   * @param layerPath - The layer entry path or GeoView layer root ID to remove
   */
  removeLayerConfigAndAssert(test: Test, layerPath: string): void {
    const { layerController } = this.getControllersRegistry();
    const exactConfig = layerController.getLayerEntryConfigIfExists(layerPath);
    if (!exactConfig) {
      const descendantPaths = layerController.getLayerEntryLayerPaths().filter((path) => path.startsWith(`${layerPath}/`));
      if (descendantPaths.length === 0) {
        test.addStep(`No layer entries remain under '${layerPath}'.`);
        return;
      }

      const firstEntryDepth = Math.min(...descendantPaths.map((path) => path.split('/').length));
      const rootEntryPaths = descendantPaths.filter((path) => path.split('/').length === firstEntryDepth);
      test.addStep(`Removing all layer entries under the GeoView layer root '${layerPath}'...`);
      rootEntryPaths.forEach((rootEntryPath) => this.getControllersRegistry().layerCreatorController.removeLayerUsingPath(rootEntryPath));

      test.addStep(`Validating all layer entries under '${layerPath}' were removed...`);
      descendantPaths.forEach((descendantPath) => {
        Test.assertIsUndefined(`layerEntryConfig ${descendantPath}`, layerController.getLayerEntryConfigIfExists(descendantPath));
        Test.assertIsUndefined('legendLayer', getStoreLayerLegendLayerByPath(this.getMapId(), descendantPath));
      });
      return;
    }

    // Here the layer entry existed

    // Remove the added layer
    test.addStep(`Removing the geoview layer ${layerPath} from the map...`);
    this.getControllersRegistry().layerCreatorController.removeLayerUsingPath(layerPath);

    // Validate that it's gone from domain
    test.addStep(`Validate that the layer is indeed gone...`);
    Test.assertIsUndefined(`layerEntryConfig ${layerPath}`, layerController.getLayerEntryConfigIfExists(layerPath));

    // Validate that it's gone from store
    const legendLayer = getStoreLayerLegendLayerByPath(this.getMapId(), layerPath);
    Test.assertIsUndefined('legendLayer', legendLayer);
  }

  // #endregion LAYERS ADD / REMOVE

  // #region UI INTERACTION METHODS

  /**
   * Retrieves a layer from the map, performs a feature info query at a specific coordinate,
   * and sets up the details UI with that layer. Steps are logged to the provided test instance.
   *
   * This will return the results of the query itself as a promise.
   * Remember than the UI is batched and you should await for the batched results to propagate before verifying the results are appearing in the UI.
   *
   * @template T - The type parameter for the test instance
   * @param test - The test instance used to log each step of the details setup process
   * @param layerPath - The unique path or ID of the layer to interact with
   * @param lonlat - The longitude/latitude coordinate at which to query the layer
   * @returns A promise that resolves to the layer after setup is complete
   * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path
   * @throws {LayerWrongTypeError} When the layer is of wrong type at the given layer path
   */
  async queryAtCoordinateRetrieveResultsForLayer(
    test: Test,
    layer: AbstractGVLayer,
    lonlat: Coordinate
  ): Promise<TypeFeatureInfoEntry[] | undefined> {
    // Get the layer and make sure it's in loaded status
    await layer.waitForLoadedOnce();

    // Before querying, make sure the map render is synchronized, this can be necessary for vector layers that were just added to the map
    await this.getMapViewer().waitForRender();

    // Update the step
    test.addStep(`Perform query operation at given coordinates...`);
    const queryResults = await this.getControllersRegistry().layerSetController.queryAtLonLat(lonlat);

    // Get the results for the specific layer from the query results
    const queryResultForLayer = queryResults[layer.getLayerPath()];

    // Wait specifically for the results of this query
    const promiseResult = await queryResultForLayer.promiseResult;

    // Wait for the geometries if we must (EsriDynamic particularity)
    await promiseResult?.promiseGeometries;

    // Results
    test.addStep(`Query for layer '${layer.getLayerPath()}' returned with ${queryResultForLayer.features?.length ?? 0} results`);

    // Return the features
    return queryResultForLayer.features;
  }

  /**
   * Simulates a map click and waits for the batched query results to propagate to the store.
   *
   * @param test - The test instance used to record each step
   * @param clickCoordinates - The longitude and latitude coordinates to click
   * @returns A promise that resolves after the query and batched store propagation complete
   */
  async simulateMapClickWaitForBatchedQuery(test: Test, clickCoordinates: Coordinate): Promise<void> {
    // Before querying, make sure the map render is synchronized, this can be necessary for vector layers that were just added to the map
    await this.getMapViewer().waitForRender();

    // Simulate map click
    test.addStep(`Simulating map click on all queryable layers for coordinate [${clickCoordinates.join(', ')}]...`);
    await this.getMapViewer().simulateMapClick(clickCoordinates);

    // Wait for batched query
    await GVAbstractTester.waitForBatchedQueryPropagation(test);
  }

  /**
   * Opens or closes an app bar tab and waits for its active class to reflect the requested state.
   *
   * @param test - The test instance used to record each step
   * @param tabId - The app bar tab identifier
   * @param open - Whether to open or close the app bar tab
   * @returns A promise that resolves when the app bar tab reaches the requested state
   */
  async toggleAppbarTab(test: Test, tabId: string, open: boolean): Promise<void> {
    if (open) {
      // Opening app bar tab
      test.addStep(`Opening ${tabId} app bar panel...`);
      this.getControllersRegistry().uiController.setActiveAppBarTab(tabId, true, false);

      // Wait for the React UI to actually pick up on the store update
      test.addStep(`Waiting on the ${tabId} panel to open...`);
      await DomHelper.waitForAppbarTabSelected(this.getMapId(), tabId);
      await DomHelper.waitForReactIdle();
    } else {
      test.addStep(`Closing ${tabId} app bar panel...`);
      this.getControllersRegistry().uiController.setActiveAppBarTab(tabId, false, false);

      // Wait for the React UI to actually pick up on the store update
      test.addStep(`Waiting on the ${tabId} panel to close...`);
      await DomHelper.waitForAppbarTabNotSelected(this.getMapId(), tabId);
    }
  }

  /**
   * Opens or closes the Details app bar tab and waits for its active class to reflect the requested state.
   *
   * @param test - The test instance used to record each step
   * @param open - Whether to open or close the Details tab
   * @returns A promise that resolves when the Details tab reaches the requested state
   */
  toggleAppbarTabDetails(test: Test, open: boolean): Promise<void> {
    // Redirect
    return this.toggleAppbarTab(test, 'details', open);
  }

  /**
   * Opens or closes an app bar tab and waits for its active class to reflect the requested state.
   *
   * @param test - The test instance used to record each step
   * @param tabId - The app bar tab identifier
   * @param open - Whether to open or close the app bar tab
   * @returns A promise that resolves when the app bar tab reaches the requested state
   */
  async toggleFooterbarTab(test: Test, tabId: string, open: boolean): Promise<void> {
    if (open) {
      // Opening app bar tab
      test.addStep(`Opening ${tabId} footer bar panel...`);
      this.getControllersRegistry().uiController.setActiveFooterBarTab(tabId);

      // Wait for the React UI to actually pick up on the store update
      test.addStep(`Waiting on the ${tabId} panel to open...`);
      await DomHelper.waitForFooterTabSelected(this.getMapId(), tabId);
    } else {
      test.addStep(`Closing ${tabId} footer bar panel...`);
      this.getControllersRegistry().uiController.setActiveFooterBarTab(undefined);

      // Wait for the React UI to actually pick up on the store update
      test.addStep(`Waiting on the ${tabId} panel to close...`);
      await DomHelper.waitForFooterTabNotSelected(this.getMapId(), tabId);
    }
  }

  // #endregion UI INTERACTION METHODS

  // #region STATIC METHODS PUBLIC

  /**
   * Creates the GeoJSON group configuration used by settings and visibility tests.
   *
   * The returned fixture contains a group with one child layer and nested initial settings for testing inheritance.
   *
   * @param geoviewLayerId - The unique GeoView layer identifier to assign to the configuration
   * @returns A GeoJSON group layer configuration with nested initial settings
   */
  static createGeoJsonPointsSettings(geoviewLayerId: string): TypeGeoviewLayerConfig {
    const layerConfig: unknown = {
      geoviewLayerId,
      geoviewLayerName: 'GeoJSON Sample',
      metadataAccessPath: './datasets/geojson/metadata.meta',
      geoviewLayerType: 'GeoJSON',
      serviceDateFormat: 'DD/MM/YYYYTHH:mm:ss',
      initialSettings: {
        controls: {
          highlight: false,
          zoom: false,
        },
      },
      listOfLayerEntryConfig: [
        {
          entryType: 'group',
          layerId: 'point-feature-group',
          layerName: 'Points & Icons',
          initialSettings: {
            controls: {
              remove: false,
            },
          },
          listOfLayerEntryConfig: [
            {
              layerId: 'points_1.json',
              layerName: 'Points 1',
              initialSettings: {
                controls: {
                  highlight: true,
                },
              },
            },
          ],
        },
      ],
    };

    return layerConfig as TypeGeoviewLayerConfig;
  }

  /**
   * Logs a test step and waits for the query batching.
   *
   * @param test - The test instance used to log the propagation wait
   * @returns A promise that resolves after the batching interval and buffer have elapsed
   */
  static async waitForBatchedQueryPropagation(test: Test): Promise<void> {
    // Wait for the query to go through the batch logic in the UI
    test.addStep(`Waiting on the query to complete and get in the store...`);
    await delay(TIME_DELAY_BETWEEN_PROPAGATION_FOR_BATCH);
    await DomHelper.waitForReactIdle();
  }

  // #endregion STATIC METHODS PUBLIC
}

// #region TYPES AND INTERFACES

/** Optional hooks for the root and selected paths and registered configuration during layer addition. */
export type LayerAdditionCallbacks<T extends ConfigBaseClass> = {
  onLayerPath?: (rootLayerPath: string, configLayerPath: string) => void;
  onConfig?: (config: T) => Promise<void>;
};

// #endregion TYPES AND INTERFACES
