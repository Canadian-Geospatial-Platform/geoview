import axios from 'axios';

import { Extent } from 'ol/extent';
import { XYZ, OSM } from 'ol/source';
import TileGrid from 'ol/tilegrid/TileGrid';

import { api } from '../../../app';

import { EVENT_NAMES } from '../../../api/events/event';

import {
  TypeBasemapProps,
  TypeBasemapLayer,
  TypeBasemapOptions,
  TypeProjectionCodes,
  TypeLocalizedLanguages,
  TypeJsonObject,
  toJsonObject,
  TypeJsonArray,
} from '../../../core/types/cgpv-types';

import { generateId, showMessage } from '../../../core/utils/utilities';
import { basemapLayerArrayPayload } from '../../../api/events/payloads/basemap-layers-payload';

/**
 * A class to get a Basemap for a define projection and language. For the moment, a list maps are available and
 * can be filtered by projection (currently only WM and LCC projections are listed,
 * in case other projections needed, they need to be added to the list)
 *
 * @exports
 * @class Basemap
 */
export class Basemap {
  // used to hold all created basemaps for a map
  basemaps: TypeBasemapProps[] = [];

  // active basemap
  activeBasemap?: TypeBasemapProps;

  // default origin
  defaultOrigin?: number[];

  // default resolution
  defaultResolutions?: number[];

  // default extent
  defaultExtent?: Extent;

  // attribution text
  attribution: string;

  // the language to use
  language: string;

  // the basemap options passed from the map config
  basemapOptions: TypeBasemapOptions;

  // the projection number
  private projection: number;

  // the map id to be used in events
  #mapId: string;

  // Pane Name for all basemap layers
  private basemapsPaneName!: string;

  /**
   * initialize basemap
   *
   * @param {TypeBasemapOptions} basemapOptions optional basemap option properties, passed in from map config
   * @param {string} language language to be used either en-CA or fr-CA
   * @param {number} projection projection number
   * @param {string} mapId the map id
   */
  constructor(basemapOptions: TypeBasemapOptions, language: string, projection: number, mapId: string) {
    this.#mapId = mapId;

    this.basemapOptions = basemapOptions;

    this.language = language;

    this.projection = projection;

    this.attribution = this.attributionVal[language] as string;
  }

  /**
   * basemap list
   */
  basemapsList: TypeJsonObject = toJsonObject({
    3978: {
      transport: {
        url: 'https://maps-cartes.services.geo.ca/server2_serveur2/rest/services/BaseMaps/CBMT_CBCT_GEOM_3978/MapServer/WMTS/tile/1.0.0/CBMT_CBCT_GEOM_3978/default/default028mm/{z}/{y}/{x}.jpg',
        jsonUrl: 'https://maps-cartes.services.geo.ca/server2_serveur2/rest/services/BaseMaps/CBMT_CBCT_GEOM_3978/MapServer?f=pjson',
      },
      simple: {
        url: 'https://maps-cartes.services.geo.ca/server2_serveur2/rest/services/BaseMaps/Simple/MapServer/WMTS/tile/1.0.0/Simple/default/default028mm/{z}/{y}/{x}.jpg',
        jsonUrl: 'https://maps-cartes.services.geo.ca/server2_serveur2/rest/services/BaseMaps/Simple/MapServer?f=pjson',
      },
      shaded: {
        url: 'https://maps-cartes.services.geo.ca/server2_serveur2/rest/services/BaseMaps/CBME_CBCE_HS_RO_3978/MapServer/WMTS/tile/1.0.0/CBMT_CBCT_GEOM_3978/default/default028mm/{z}/{y}/{x}.jpg',
        jsonUrl: 'https://maps-cartes.services.geo.ca/server2_serveur2/rest/services/BaseMaps/CBME_CBCE_HS_RO_3978/MapServer?f=pjson',
      },
      label: {
        url: 'https://maps-cartes.services.geo.ca/server2_serveur2/rest/services/BaseMaps/xxxx_TXT_3978/MapServer/WMTS/tile/1.0.0/xxxx_TXT_3978/default/default028mm/{z}/{y}/{x}.jpg',
        jsonUrl: 'https://maps-cartes.services.geo.ca/server2_serveur2/rest/services/BaseMaps/xxxx_TXT_3978/MapServer?f=pjson',
      },
    },
    3857: {
      transport: {
        url: 'https://maps-cartes.services.geo.ca/server2_serveur2/rest/services/BaseMaps/CBMT_CBCT_GEOM_3857/MapServer/WMTS/tile/1.0.0/BaseMaps_CBMT_CBCT_GEOM_3857/default/default028mm/{z}/{y}/{x}.jpg',
        jsonUrl: 'https://maps-cartes.services.geo.ca/server2_serveur2/rest/services/BaseMaps/CBMT_CBCT_GEOM_3857/MapServer?f=pjson',
      },
      simple: {
        url: 'https://maps-cartes.services.geo.ca/server2_serveur2/rest/services/BaseMaps/Simple/MapServer/WMTS/tile/1.0.0/Simple/default/default028mm/{z}/{y}/{x}.jpg',
        jsonUrl: 'https://maps-cartes.services.geo.ca/server2_serveur2/rest/services/BaseMaps/Simple/MapServer?f=pjson',
      },
      shaded: {
        url: 'https://maps-cartes.services.geo.ca/server2_serveur2/rest/services/BaseMaps/CBME_CBCE_HS_RO_3978/MapServer/WMTS/tile/1.0.0/CBMT_CBCT_GEOM_3978/default/default028mm/{z}/{y}/{x}.jpg',
        jsonUrl: 'https://maps-cartes.services.geo.ca/server2_serveur2/rest/services/BaseMaps/CBME_CBCE_HS_RO_3978/MapServer?f=pjson',
      },
      label: {
        url: 'https://maps-cartes.services.geo.ca/server2_serveur2/rest/services/BaseMaps/xxxx_TXT_3857/MapServer/WMTS/tile/1.0.0/BaseMaps_xxxx_TXT_3857/default/default028mm/{z}/{y}/{x}.jpg',
        jsonUrl: 'https://maps-cartes.services.geo.ca/server2_serveur2/rest/services/BaseMaps/xxxx_TXT_3857/MapServer?f=pjson',
      },
    },
  });

  /**
   * attribution to add the the map
   */
  private attributionVal: TypeJsonObject = toJsonObject({
    'en-CA': '© Her Majesty the Queen in Right of Canada, as represented by the Minister of Natural Resources',
    'fr-CA': '© Sa Majesté la Reine du Chef du Canada, représentée par le ministre des Ressources naturelles',
  });

  /**
   * Get projection from basemap url
   * Because OpenLayers can reporject on the fly raster, some like Shaded and Simple even if only available in 3978
   * can be use in 3857. For this we need to make a difference between map projection and url use for the basemap
   *
   * @param {string} url basemap url
   * @returns {number} projection code
   */
  private getProjectionFromUrl = (url: string): number => {
    let code = 0;
    const index = url.indexOf('/MapServer');

    if (url.substring(index - 6, index) === 'Simple') code = 3978;
    else code = Number(url.substring(index - 4, index));

    return code;
  };

  /**
   * Get basemap thumbnail url
   *
   * @param {string[]} basemapTypes basemap layer type (shaded, transport, label, simple)
   * @param {TypeProjectionCodes} projection basemap projection
   * @param {TypeLocalizedLanguages} language basemap language
   * @returns {string[]} array of thumbnail urls
   */
  private getThumbnailUrl = (basemapTypes: string[], projection: TypeProjectionCodes, language: TypeLocalizedLanguages): string[] => {
    const thumbnailUrls: string[] = [];

    for (let typeIndex = 0; typeIndex < basemapTypes.length; typeIndex++) {
      const type = basemapTypes[typeIndex];

      if (type === 'transport') {
        if (this.basemapsList[projection].transport?.url) {
          thumbnailUrls.push(
            (this.basemapsList[projection].transport?.url as string)
              .replace('{z}', '8')
              .replace('{y}', projection === 3978 ? '285' : '91')
              .replace('{x}', projection === 3978 ? '268' : '74')
          );
        }
      }

      if (type === 'simple') {
        // Only available in 3978
        if (this.basemapsList[projection].simple?.url) {
          thumbnailUrls.push(
            (this.basemapsList[projection].simple.url as string).replace('{z}', '8').replace('{y}', '285').replace('{x}', '268')
          );
        }
      }

      if (type === 'shaded') {
        // Only available in 3978
        if (this.basemapsList[projection].shaded?.url) {
          thumbnailUrls.push(
            (this.basemapsList[projection].shaded.url as string).replace('{z}', '8').replace('{y}', '285').replace('{x}', '268')
          );
        }
      }

      if (type === 'label') {
        if (this.basemapsList[this.projection].label?.url) {
          thumbnailUrls.push(
            (this.basemapsList[this.projection].label.url as string)
              .replace('xxxx', language === 'en-CA' ? 'CBMT' : 'CBCT')
              .replace('{z}', '8')
              .replace('{y}', projection === 3978 ? '285' : '91')
              .replace('{x}', projection === 3978 ? '268' : '74')
          );
        }
      }

      if (type === 'osm') {
        thumbnailUrls.push('https://tile.openstreetmap.org/0/0/0.png');
      }
    }

    return thumbnailUrls;
  };

  /**
   * Get basemap information (nbame and description)
   *
   * @param {string[]} basemapTypes basemap layer type (shaded, transport, label, simple)
   * @param {TypeLocalizedLanguages} language basemap language
   * @returns {string} array with information [name, description]
   */
  private getInfo = (basemapTypes: string[], language: TypeLocalizedLanguages): string[] => {
    // const info = { name: '', description: '' };

    let name = '';
    let description = '';

    if (basemapTypes.includes('transport')) {
      name = 'Transport';
      description = `${
        language === 'en-CA'
          ? 'The Canada Base Map - Transportation (CBMT). This web mapping service provides spatial reference context with an emphasis on transportation networks. It is designed especially for use as a background map in a web mapping application or geographic information system (GIS).'
          : "Carte de base du Canada - Transport (CBCT). Ce service de cartographie Web offre un contexte de référence spatiale axé sur les réseaux de transport. Il est particulièrement conçu pour être utilisé comme fond de carte dans une application cartographique Web ou un système d'information géographique (SIG)."
      }`;
    } else if (basemapTypes.includes('simple')) {
      name = 'Simple';
    } else if (basemapTypes.includes('shaded')) {
      name = `${language === 'en-CA' ? 'Shaded relief' : 'Relief ombré'}`;
      description = `${
        language === 'en-CA'
          ? 'The Canada Base Map - Elevation (CBME) web mapping services of the Earth Sciences Sector at Natural Resources Canada, is intended primarily for online mapping application users and developers'
          : "Les services de cartographie Web de la carte de base du Canada - élévation (CBCE) du Secteur des sciences de la Terre de Ressources naturelles Canada sont destinés principalement aux utilisateurs et aux développeurs d'applications de cartographie en ligne."
      }`;
    } else if (basemapTypes.includes('osm')) {
      name = `${language === 'en-CA' ? 'Open Street Maps' : 'Carte - Open Street Maps'}`;
    } else if (basemapTypes.includes('nogeom')) {
      name = `${language === 'en-CA' ? 'No geometry' : 'Pas de géométrie'}`;
    }

    if (basemapTypes.includes('label')) name = `${name} ${language === 'en-CA' ? 'with labels' : 'avec étiquettes'}`;

    return [name, description];
  };

  /**
   * Check if the type of basemap already exist
   *
   * @param {string} type basemap type
   * @returns {boolean} true if basemap exist, false otherwise
   */
  isExisting = (type: string): boolean => {
    // check if basemap with provided type exists
    const exists = this.basemaps.length === 0 ? [] : this.basemaps.filter((basemap: TypeBasemapProps) => basemap.type === type);

    // return true if basemap exist
    return exists.length !== 0;
  };

  /**
   * Create a basemap layer
   *
   * @param {string} id the id of the layer
   * @param {TypeJsonObject} basemapLayer the basemap layer url and json url
   * @param {number} opacity the opacity to use for this layer
   * @param {boolean} rest should we do a get request to get the info from the server
   * @returns {TypeBasemapLayer} return the created basemap layer
   */
  createBasemapLayer = async (id: string, basemapLayer: TypeJsonObject, opacity: number, rest: boolean): Promise<TypeBasemapLayer> => {
    const resolutions: number[] = [];
    let minZoom = 0;
    let maxZoom = 17;
    let extent: Extent = [0, 0, 0, 0];
    let origin: number[] = [];
    let urlProj = 0;
    let attributions = [];

    // should we do a get request to get the layer information from the server?
    if (rest && (basemapLayer.jsonUrl as string)) {
      try {
        // get info from server
        const result = toJsonObject((await axios.get(basemapLayer.jsonUrl as string)).data);

        // get minimum scale
        const minScale = result.minScale as number;

        // get maximum scale
        const maxScale = result.maxScale as number;

        // get extent
        const fullExtent = toJsonObject(result.fullExtent);

        // get the tile grid info
        const tileInfo = toJsonObject(result.tileInfo);

        const lods: TypeJsonObject = {};

        // get resolutions and scale from tile grid info
        (tileInfo.lods as TypeJsonArray)?.forEach((lod) => {
          const scale = lod.scale as number;
          const resolution = lod.resolution as number;

          if (scale <= minScale && scale >= maxScale) {
            resolutions.push(resolution);

            lods[scale] = lod;
          }
        });

        // set layer origin
        origin = [tileInfo?.origin?.x || 0, tileInfo?.origin?.y || 0] as number[];

        // set minimum zoom for this layer
        minZoom = lods[minScale].level as number;

        // set max zoom for this layer
        maxZoom = lods[maxScale].level as number;

        // set extent for this layer
        extent = [fullExtent.xmin as number, fullExtent.ymin as number, fullExtent.xmax as number, fullExtent.ymax as number];

        if (id === 'label') {
          if (result.copyrightText) {
            attributions.push(result.copyrightText as string);
            this.attribution = result.copyrightText as string;
          }
        }

        // Because OpenLayers can reporject on the fly raster, some like Shaded and Simple even if only available in 3978
        // can be use in 3857. For this we need to make a difference between map projection and url use for the basemap
        urlProj = this.getProjectionFromUrl(basemapLayer.url as string);
      } catch (error) {
        showMessage(this.#mapId, toJsonObject(error).toString());
      }
    }

    // return a basemap layer
    return {
      id,
      type: id,
      url: basemapLayer.url as string,
      jsonUrl: basemapLayer.jsonUrl as string,
      source: new XYZ({
        attributions,
        projection: api.projection.projections[urlProj],
        url: basemapLayer.url as string,
        tileGrid: new TileGrid({
          extent,
          origin,
          resolutions,
        }),
      }),
      opacity,
      origin,
      extent,
      resolutions,
      minScale: minZoom,
      maxScale: maxZoom,
    };
  };

  /**
   * Create the core basemap and add the layers to it
   *
   * @param {TypeBasemapOptions} basemapOptions basemap options
   */
  createCoreBasemap = async (basemapOptions: TypeBasemapOptions): Promise<TypeBasemapProps | undefined> => {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve) => {
      const basemapLayers: TypeBasemapLayer[] = [];
      const basemaplayerTypes: string[] = [];
      const defaultOpacity = 1;

      let defaultOrigin: number[] | undefined;
      let defaultExtent: Extent | undefined;
      let defaultResolutions: number[] | undefined;
      let minZoom = 0;
      let maxZoom = 17;

      const coreBasemapOptions = basemapOptions === undefined ? this.basemapOptions : basemapOptions;

      if (coreBasemapOptions) {
        // create shaded layer
        if (coreBasemapOptions.shaded && this.basemapsList[this.projection].shaded) {
          const shadedLayer = await this.createBasemapLayer('shaded', this.basemapsList[this.projection].shaded, defaultOpacity, true);

          basemapLayers.push(shadedLayer);
          basemaplayerTypes.push('shaded');
        }

        // create transport layer
        if (coreBasemapOptions.id === 'transport' && this.basemapsList[this.projection].transport) {
          const transportLayer = await this.createBasemapLayer(
            'transport',
            this.basemapsList[this.projection].transport,
            coreBasemapOptions.shaded ? 0.75 : defaultOpacity,
            true
          );

          basemapLayers.push(transportLayer);
          basemaplayerTypes.push('transport');

          // set default origin,extent,resolutions from layer
          defaultOrigin = transportLayer.origin;
          defaultExtent = transportLayer.extent;
          defaultResolutions = transportLayer.resolutions;
          minZoom = transportLayer.minScale;
          maxZoom = transportLayer.maxScale;
        }

        // create simple layer
        if (coreBasemapOptions.id === 'simple' && this.basemapsList[this.projection].simple) {
          const simpleLayer = await this.createBasemapLayer(
            'simple',
            this.basemapsList[this.projection].simple,
            coreBasemapOptions.shaded ? 0.75 : defaultOpacity,
            true
          );

          basemapLayers.push(simpleLayer);
          basemaplayerTypes.push('simple');

          // set default origin,extent,resolutions from layer
          defaultOrigin = simpleLayer.origin;
          defaultExtent = simpleLayer.extent;
          defaultResolutions = simpleLayer.resolutions;
          minZoom = simpleLayer.minScale;
          maxZoom = simpleLayer.maxScale;
        }

        // create open street maps layer
        if (coreBasemapOptions.id === 'osm') {
          basemapLayers.push({
            id: 'osm',
            type: 'osm',
            source: new OSM(),
            opacity: coreBasemapOptions.shaded ? 0.75 : defaultOpacity,
            origin: [],
            extent: [],
            resolutions: [],
            minScale: minZoom,
            maxScale: maxZoom,
          });
          basemaplayerTypes.push('osm');
        }

        // no geometry basemap layer
        if (coreBasemapOptions.id === 'nogeom') {
          basemaplayerTypes.push('nogeom');
        }

        if (basemapLayers.length && coreBasemapOptions.labeled) {
          const labelLayer = await this.createBasemapLayer(
            'label',
            toJsonObject({
              url: (this.basemapsList[this.projection].label.url as string)?.replaceAll(
                'xxxx',
                this.language === 'en-CA' ? 'CBMT' : 'CBCT'
              ),
              jsonUrl: (this.basemapsList[this.projection].label.jsonUrl as string)?.replaceAll(
                'xxxx',
                this.language === 'en-CA' ? 'CBMT' : 'CBCT'
              ),
            }),
            0.8,
            true
          );

          basemapLayers.push(labelLayer);
          basemaplayerTypes.push('label');
        }
      }

      if (
        !this.isExisting(basemaplayerTypes.join('-')) &&
        (basemapLayers.length > 0 || (basemapLayers.length === 0 && coreBasemapOptions.id === 'nogeom'))
      ) {
        const info = this.getInfo(basemaplayerTypes, this.language as TypeLocalizedLanguages);

        // id and typer are derived from the basemap type composition (shaded, label, transport, simple)
        const basemap = this.createBasemap({
          id: basemaplayerTypes.join(''),
          name: info[0],
          layers: basemapLayers,
          type: basemaplayerTypes.join('-'),
          description: info[1],
          descSummary: '',
          altText: info[1],
          thumbnailUrl: this.getThumbnailUrl(
            basemaplayerTypes,
            this.projection as TypeProjectionCodes,
            this.language as TypeLocalizedLanguages
          ),
          attribution: this.attribution,
          zoomLevels: {
            min: minZoom,
            max: maxZoom,
          },
          defaultExtent,
          defaultOrigin,
          defaultResolutions,
        });

        resolve(basemap);
      } else {
        // if no basemap set, resolve to undefined
        resolve(undefined);
      }
    });
  };

  /**
   * Create a custom basemap
   *
   * @param {TypeBasemapProps} basemapProps basemap properties
   * @returns {TypeBasemapProps} the created custom basemap
   */
  createCustomBasemap = (basemapProps: TypeBasemapProps): TypeBasemapProps => {
    interface bilingual {
      en: string;
      fr: string;
    }

    // extract bilangual sections
    const name: bilingual = basemapProps.name as unknown as bilingual;
    const description: bilingual = basemapProps.description as unknown as bilingual;
    const thumbnailUrl: bilingual = basemapProps.thumbnailUrl as unknown as bilingual;
    const attribution: bilingual = basemapProps.attribution as unknown as bilingual;

    // extract url from luanguage
    const formattedLayers: TypeBasemapLayer[] = [...basemapProps.layers];

    for (let layerIndex = 0; layerIndex < formattedLayers.length; layerIndex++) {
      // const layer = formattedLayers[layerIndex];
      // const urls = layer.url as unknown as bilingual;
      // layer.url = this.language === 'en-CA' ? urls.en : urls.fr;
      // layer.basemapPaneName = this.basemapsPaneName;
    }

    // create the basemap properties
    const formatProps: TypeBasemapProps = { ...basemapProps };
    formatProps.name = this.language === 'en-CA' ? name.en : name.fr;
    formatProps.layers = basemapProps.layers.map((layer) => {
      return {
        ...layer,
        url: this.language === 'en-CA' ? (layer.url as unknown as bilingual).en : (layer.url as unknown as bilingual).fr,
        source: new XYZ({
          projection: api.projection.projections[this.projection],
          url: this.language === 'en-CA' ? (layer.url as unknown as bilingual).en : (layer.url as unknown as bilingual).fr,
          tileGrid: new TileGrid({
            extent: this.defaultExtent,
            origin: this.defaultOrigin,
            resolutions: this.defaultResolutions!,
          }),
        }),
      };
    });
    formatProps.type = 'test';
    formatProps.description = this.language === 'en-CA' ? description.en : description.fr;
    formatProps.altText = this.language === 'en-CA' ? description.en : description.fr;
    formatProps.thumbnailUrl = this.language === 'en-CA' ? thumbnailUrl.en : thumbnailUrl.fr;
    formatProps.attribution = this.language === 'en-CA' ? attribution.en : attribution.fr;

    return this.createBasemap(formatProps);
  };

  /**
   * Load the default basemap that was passed in the map config
   *
   * @returns {TypeBasemapProps | undefined} the default basemap
   */
  loadDefaultBasemaps = async (): Promise<TypeBasemapProps | undefined> => {
    const basemap = await this.createCoreBasemap(this.basemapOptions);

    this.activeBasemap = basemap;

    this.defaultOrigin = basemap?.defaultOrigin;
    this.defaultResolutions = basemap?.defaultResolutions;
    this.defaultExtent = basemap?.defaultExtent;

    return basemap;
  };

  /**
   * Create a new basemap
   *
   * @param {TypeBasemapProps} basemapProps basemap properties
   */
  private createBasemap = (basemapProps: TypeBasemapProps): TypeBasemapProps => {
    // generate an id if none provided
    // eslint-disable-next-line no-param-reassign
    if (!basemapProps.id) basemapProps.id = generateId(basemapProps.id);

    const thumbnailUrls: string[] = [];

    // set thumbnail if not provided
    if (!basemapProps.thumbnailUrl || basemapProps.thumbnailUrl.length === 0) {
      basemapProps.layers.forEach(() => {
        // const { type } = layer;
        // TODO: set thumbnails from configuration
      });

      // eslint-disable-next-line no-param-reassign
      basemapProps.thumbnailUrl = thumbnailUrls;
    }

    this.basemaps.push(basemapProps);

    return basemapProps;
  };

  /**
   * Set the current basemap and update the basemap layers on the map
   *
   * @param {string} id the id of the basemap
   */
  setBasemap = (id: string): void => {
    // get basemap by id
    const basemap = this.basemaps.filter((basemapType: TypeBasemapProps) => basemapType.id === id)[0];

    // set active basemap
    this.activeBasemap = basemap;

    // emit an event to update the basemap layers on the map
    api.event.emit(basemapLayerArrayPayload(EVENT_NAMES.BASEMAP.EVENT_BASEMAP_LAYERS_UPDATE, this.#mapId, basemap.layers));
  };
}
