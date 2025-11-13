import type { Coordinate } from 'ol/coordinate';
import { AbstractTester } from '../core/abstract-tester';
import type { API } from 'geoview-core/api/api';
import type { MapViewer } from 'geoview-core/geo/map/map-viewer';

/**
 * Main GeoView Abstract Tester class.
 * @extends {AbstractTester}
 */
export abstract class GVAbstractTester extends AbstractTester {
  /** GLOBAL CONSTANTS FOR THE TESTS */

  /** Some long lat coordinates for map investigations */
  static readonly QUEBEC_LONLAT: Coordinate = [-71.356054449131, 46.78077550041052];
  static readonly MANITOBA_CENTER_LONLAT: Coordinate = [-86.73558298224057, 50.833271435899974];

  /** Bad url */
  static BAD_URL = 'https://badurl/oops';

  /**
   * Fake url acting like a WMS/WFS url for a GetCapabilities call - the proxy is a good url to use to fake this.
   * Something like https://google.ca will get turned into https://google.ca/?service=WFS&request=GetCapabilities and that's
   * not a 200 response and we can't test with that.
   * Not using the core config url constant on purpose, because it serves a whole different purpose here.
   */
  static FAKE_URL_ALWAYS_RETURNING_RESPONSE_INSTEAD_OF_NETWORK_ERROR = 'https://maps.canada.ca/wmsproxy/ws/wmsproxy/executeFromProxy';

  /** Airborne Radioactivity uuid */
  static AIRBORNE_RADIOACTIVITY_UUID: string = '21b821cf-0f1c-40ee-8925-eab12d357668';
  static AIRBORNE_RADIOACTIVITY_GROUP: string = GVAbstractTester.AIRBORNE_RADIOACTIVITY_UUID + '/0';
  static AIRBORNE_RADIOACTIVITY_UUID_WITH_SUFFIX: string = GVAbstractTester.AIRBORNE_RADIOACTIVITY_UUID + '/0/1';
  static AIRBORNE_RADIOACTIVITY_LAYER_GROUP_NAME: string = 'Airborne Radioactivity';

  /** Historical Flood */
  static readonly HISTORICAL_FLOOD_URL_MAP_SERVER: string =
    'https://maps-cartes.services.geo.ca/server_serveur/rest/services/NRCan/historical_flood_event_en/MapServer';
  static readonly HISTORICAL_FLOOD_URL_LAYER_ID: string = '0';
  static readonly HISTORICAL_FLOOD_LAYER_NAME: string = 'Historical Flood Events';

  static readonly HISTORICAL_FLOOD_URL_FEATURE_SERVER: string =
    GVAbstractTester.HISTORICAL_FLOOD_URL_MAP_SERVER + '/' + GVAbstractTester.HISTORICAL_FLOOD_URL_LAYER_ID;

  /** Forest Industry Hotspots */
  static readonly FOREST_INDUSTRY_MAP_SERVER: string =
    'https://maps-cartes.services.geo.ca/server_serveur/rest/services/NRCan/forest_industry_hotspots_en/MapServer';
  static readonly FOREST_INDUSTRY_LAYER_ID: string = '0';
  static readonly FOREST_INDUSTRY_LAYER_NAME: string = 'Location of mill facilities';
  static readonly FOREST_INDUSTRY_FEATURE_SERVER: string =
    GVAbstractTester.FOREST_INDUSTRY_MAP_SERVER + '/' + GVAbstractTester.FOREST_INDUSTRY_LAYER_ID;

  /** EsriDynamic with Raster Layers */
  static readonly ESRI_DYNAMIC_LABOUR_FORCE_UUID: string = 'ac2096a6-7b4a-464e-9e08-eca7873dd88c';
  static readonly ESRI_DYNAMIC_LABOUR_FORCE_GROUP: string = '0';
  static readonly ESRI_DYNAMIC_LABOUR_FORCE_PETROLEUM: string = '0/1';
  static readonly ESRI_DYNAMIC_LABOUR_FORCE_MINERALS: string = '0/2';
  static readonly ESRI_DYNAMIC_LABOUR_FORCE_FORESTRY: string = '0/3';
  static readonly ESRI_DYNAMIC_LABOUR_FORCE_FISHERIES: string = '0/4';
  static readonly ESRI_DYNAMIC_LABOUR_FORCE_AGRICULTURE: string = '0/5';
  static readonly ESRI_DYNAMIC_LABOUR_FORCE_CANECUMENE: string = '0/6';

  /** CESI */
  static readonly CESI_MAP_SERVER: string = 'https://maps-cartes.ec.gc.ca/arcgis/rest/services/CESI/MapServer';
  static readonly CESI_GROUP_0_LAYER_NAME: string = 'Water quantity';

  /** Toronto */
  static readonly FEATURE_SERVER_TORONTO_NEIGHBOURHOODS_URL: string =
    'https://services.arcgis.com/V6ZHFr6zdgNZuVG0/ArcGIS/rest/services/Toronto_Neighbourhoods/FeatureServer';
  static readonly FEATURE_SERVER_TORONTO_NEIGHBOURHOODS_LAYER_NAME: string = 'Toronto_Neighbourhoods';

  /** Elevation */
  static readonly IMAGE_SERVER_ELEVATION_URL: string =
    'https://ws.geoservices.lrc.gov.on.ca/arcgis5/rest/services/Elevation/FRI_CHM_SPL/ImageServer';
  static readonly IMAGE_SERVER_ELEVATION_LAYER_ID: string = 'FRI_CHM_SPL';

  /** USA Image Server */
  static readonly IMAGE_SERVER_USA_URL: string = 'https://sampleserver6.arcgisonline.com/ArcGIS/rest/services/USA/MapServer';
  static readonly IMAGE_SERVER_USA_LAYER_ID_CITIES: string = '0';
  static readonly IMAGE_SERVER_USA_LAYER_ID_ROADS: string = '1';

  /** OWS Mundialis */
  static readonly OWS_MUNDIALIS: string = 'https://ows.mundialis.de/services/service'; // NOTE: Doesn't support EPSG:3978
  static readonly OWS_MUNDIALIS_LAYER_ID: string = 'Dark';

  /** Datacube MSI */
  static readonly DATACUBE_MSI: string = 'https://datacube.services.geo.ca/ows/msi';
  static readonly DATACUBE_MSI_LAYER_NAME_MSI: string = 'msi';
  static readonly DATACUBE_MSI_LAYER_NAME_MSI_OR_MORE: string = 'msi-94-or-more';
  static readonly DATACUBE_MSI_LAYERS_MSI_GET_CAP: string =
    GVAbstractTester.DATACUBE_MSI + '?request=GetCapabilities&amp;service=wms&amp;version=1.3.0&amp;layers=msi';

  static readonly DATACUBE_RING_FIRE: string = 'https://datacube.services.geo.ca/web/aerial.xml';
  static readonly DATACUBE_RING_FIRE_LAYER_ID_HALIFAX: string = 'halifax';
  static readonly DATACUBE_RING_FIRE_LAYER_ID_VICTORIA: string = 'victoria';

  /** Geomet */
  static readonly GEOMET_URL: string = 'https://geo.weather.gc.ca/geomet';
  static readonly GEOMET_URL_CURRENT_COND_LAYER_ID: string = 'ec-msc:CURRENT_CONDITIONS';

  /** Geojson */
  static readonly GEOJSON_METADATA_META: string =
    'https://canadian-geospatial-platform.github.io/geoview/public/datasets/geojson/metadata.meta';
  static readonly GEOJSON_METADATA_META_FILE: string = 'metadata.meta';
  static readonly GEOJSON_POLYGONS: string = 'polygons.json';

  static readonly CSV_STATION_LIST: string =
    'https://canadian-geospatial-platform.github.io/geoview/public/datasets/csv-files/Station_List_Minus_HQ-MELCC.csv';
  static readonly CSV_STATION_LIST_FILE: string = 'Station_List_Minus_HQ-MELCC.csv';

  static readonly PYGEOAPI_B6RYUVAKK5: string = 'https://b6ryuvakk5.execute-api.us-east-1.amazonaws.com/dev';
  static readonly PYGEOAPI_B6RYUVAKK5_LAKES: string = 'lakes';

  static readonly WKB_SOUTH_AFRICA: string =
    '0103000000010000000500000054E3A59BC4602540643BDF4F8D1739C05C8FC2F5284C4140EC51B81E852B34C0D578E926316843406F1283C0CAD141C01B2FDD2406012B40A4703D0AD79343C054E3A59BC4602540643BDF4F8D1739C0';

  static readonly KML_TORNADO: string =
    'https://canadian-geospatial-platform.github.io/geoview/public/datasets/kml-files/CanadianNationalTornadoDatabase_1980-2009.kml';
  static readonly KML_TORNADO_FILE: string = 'CanadianNationalTornadoDatabase_1980-2009.kml';

  /** The API for the tests */
  #api: API;

  /** The Map Viewer for the tests */
  #mapViewer: MapViewer;

  /**
   * Constructs a GeoView specific tester.
   * @param {API} api - The api.
   * @param {string} mapViewer - The map viewer.
   */
  constructor(api: API, mapViewer: MapViewer) {
    super();

    // Keep the attributes
    this.#api = api;
    this.#mapViewer = mapViewer;
  }

  /**
   * Gets the shared api.
   */
  getApi(): API {
    return this.#api;
  }

  /**
   * Gets the MapViewer.
   */
  getMapViewer(): MapViewer {
    return this.#mapViewer;
  }

  /**
   * Gets the Map Id.
   */
  getMapId(): string {
    return this.getMapViewer().mapId;
  }
}
