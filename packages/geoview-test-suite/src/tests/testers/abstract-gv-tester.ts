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

  /** Québec long lat */
  static readonly QUEBEC_LONLAT: Coordinate = [-71.356054449131, 46.78077550041052];
  static readonly MANITOBA_CENTER_LONLAT: Coordinate = [-86.73558298224057, 50.833271435899974];

  /** Airborne Radioactivity uuid */
  static AIRBORNE_RADIOACTIVITY_UUID: string = '21b821cf-0f1c-40ee-8925-eab12d357668';
  static AIRBORNE_RADIOACTIVITY_GROUP: string = GVAbstractTester.AIRBORNE_RADIOACTIVITY_UUID + '/0';
  static AIRBORNE_RADIOACTIVITY_UUID_WITH_SUFFIX: string = GVAbstractTester.AIRBORNE_RADIOACTIVITY_UUID + '/0/1';
  static AIRBORNE_RADIOACTIVITY_LAYER_GROUP_NAME: string = 'Airborne Radioactivity';

  /** Historical Flood */
  static readonly HISTORICAL_FLOOD_URL_MAP_SERVER: string =
    'https://maps-cartes.services.geo.ca/server_serveur/rest/services/NRCan/historical_flood_event_en/MapServer';
  static readonly HISTORICAL_FLOOD_URL_MAP_SERVER_0: string = GVAbstractTester.HISTORICAL_FLOOD_URL_MAP_SERVER + '/0';
  static readonly HISTORICAL_FLOOD_LAYER_NAME: string = 'Historical Flood Events';

  /** Historical Flood */
  static readonly FOREST_INDUSTRY_MAP_SERVER: string =
    'https://maps-cartes.services.geo.ca/server_serveur/rest/services/NRCan/forest_industry_hotspots_en/MapServer';
  static readonly FOREST_INDUSTRY_MAP_SERVER_0: string = GVAbstractTester.FOREST_INDUSTRY_MAP_SERVER + '/0';
  static readonly FOREST_INDUSTRY_LAYER_NAME: string = 'Location of mill facilities';

  /** CESI */
  static readonly CESI_MAP_SERVER: string = 'https://maps-cartes.ec.gc.ca/arcgis/rest/services/CESI/MapServer';
  static readonly CESI_GROUP_0_LAYER_NAME: string = 'Water quantity';

  /** Toronto */
  static readonly TORONTO_NEIGHBOURHOODS_FEATURE_SERVER: string =
    'https://services.arcgis.com/V6ZHFr6zdgNZuVG0/ArcGIS/rest/services/Toronto_Neighbourhoods/FeatureServer';
  static readonly TORONTO_NEIGHBOURHOODS_LAYER_NAME: string = 'Toronto_Neighbourhoods';

  /** Elevation */
  static readonly ELEVATION_IMAGE_SERVER: string =
    'https://ws.geoservices.lrc.gov.on.ca/arcgis5/rest/services/Elevation/FRI_CHM_SPL/ImageServer';
  static readonly ELEVATION_LAYER_ID: string = 'FRI_CHM_SPL';

  /** OWS Mundialis */
  static readonly OWS_MUNDIALIS: string = 'https://ows.mundialis.de/services/service'; // NOTE: Doesn't support EPSG:3978

  /** Datacube MSI */
  static readonly DATACUBE_MSI: string = 'https://datacube.services.geo.ca/ows/msi';
  static readonly DATACUBE_MSI_LAYER_NAME_MSI: string = 'msi';
  static readonly DATACUBE_MSI_LAYER_NAME_MSI_OR_MORE: string = 'msi-94-or-more';
  static readonly DATACUBE_MSI_LAYERS_MSI_GET_CAP: string =
    GVAbstractTester.DATACUBE_MSI + '?request=GetCapabilities&amp;service=wms&amp;version=1.3.0&amp;layers=msi';

  static readonly DATACUBE_RING_FIRE: string = 'https://datacube.services.geo.ca/web/aerial.xml';
  static readonly DATACUBE_RING_FIRE_LAYER_ID_HALIFAX: string = 'halifax';
  static readonly DATACUBE_RING_FIRE_LAYER_ID_VICTORIA: string = 'victoria';

  /** The API for the tests */
  #api: API;

  /** The Map Viewer for the tests */
  #mapViewer: MapViewer;

  /**
   * Constructs a GeoView specific tester.
   * @param {string} name - The name of this Tester.
   * @param {API} api - The api.
   * @param {string} mapViewer - The map viewer.
   */
  constructor(name: string, api: API, mapViewer: MapViewer) {
    super(name);

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
