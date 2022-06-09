import { api } from '../../../app';

import { EVENT_NAMES } from '../../../api/events/event';

import {
  TypeBasemapProps,
  TypeBasemapLayerOptions,
  TypeBasemapLayer,
  TypeBasemapOptions,
  TypeAttribution,
  TypeProjectionCodes,
  TypeLocalizedLanguages,
} from '../../../core/types/cgpv-types';

import { generateId } from '../../../core/utils/utilities';
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
  activeBasemap!: TypeBasemapProps;

  // the language to use
  language: string;

  // the basemap options passed from the map config
  basemapOptions: TypeBasemapOptions;

  // the projection number
  private projection: number;

  // the map id to be used in events
  private mapId!: string;

  // Pane Name for all basemap layers
  private basemapsPaneName!: string;

  /**
   * initialize basemap
   *
   * @param {TypeBasemapOptions} basemapOptions optional basemap option properties, passed in from map config
   * @param {string} language language to be used either en-CA or fr-CA
   * @param {number} projection projection number
   */
  constructor(basemapOptions: TypeBasemapOptions, language: string, projection: number, mapId?: string) {
    this.basemapOptions = basemapOptions;

    this.language = language;

    this.projection = projection;

    if (mapId) {
      this.mapId = mapId;

      if (this.basemapOptions) {
        this.loadDefaultBasemaps(this.basemapOptions);
      }
    }
  }

  /**
   * basemap list
   */
  basemapsList: Record<number, Record<string, string>> = {
    3978: {
      transport:
        'https://maps-cartes.services.geo.ca/server2_serveur2/rest/services/BaseMaps/CBMT_CBCT_GEOM_3978/MapServer/WMTS/tile/1.0.0/CBMT_CBCT_GEOM_3978/default/default028mm/{z}/{y}/{x}.jpg',
      simple:
        'https://maps-cartes.services.geo.ca/server2_serveur2/rest/services/BaseMaps/Simple/MapServer/WMTS/tile/1.0.0/Simple/default/default028mm/{z}/{y}/{x}.jpg',
      shaded:
        'https://maps-cartes.services.geo.ca/server2_serveur2/rest/services/BaseMaps/CBME_CBCE_HS_RO_3978/MapServer/WMTS/tile/1.0.0/CBMT_CBCT_GEOM_3978/default/default028mm/{z}/{y}/{x}.jpg',
      label:
        'https://maps-cartes.services.geo.ca/server2_serveur2/rest/services/BaseMaps/xxxx_TXT_3978/MapServer/WMTS/tile/1.0.0/xxxx_TXT_3978/default/default028mm/{z}/{y}/{x}.jpg',
    },
    3857: {
      transport:
        'https://maps-cartes.services.geo.ca/server2_serveur2/rest/services/BaseMaps/CBMT_CBCT_GEOM_3857/MapServer/WMTS/tile/1.0.0/BaseMaps_CBMT_CBCT_GEOM_3857/default/default028mm/{z}/{y}/{x}.jpg',
      label:
        'https://maps-cartes.services.geo.ca/server2_serveur2/rest/services/BaseMaps/xxxx_TXT_3857/MapServer/WMTS/tile/1.0.0/BaseMaps_xxxx_TXT_3857/default/default028mm/{z}/{y}/{x}.jpg',
    },
  };

  /**
   * basemap layer configuration
   */
  private basemapLayerOptions: TypeBasemapLayerOptions = {
    tms: false,
    tileSize: 256,
    attribution: false,
    noWrap: false,
  };

  /**
   * attribution to add the the map
   */
  private attributionVal: TypeAttribution = {
    'en-CA': '© Her Majesty the Queen in Right of Canada, as represented by the Minister of Natural Resources',
    'fr-CA': '© Sa Majesté la Reine du Chef du Canada, représentée par le ministre des Ressources naturelles',
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
        if (this.basemapsList[projection].transport) {
          thumbnailUrls.push(
            this.basemapsList[projection].transport
              .replace('{z}', '8')
              .replace('{y}', projection === 3978 ? '285' : '91')
              .replace('{x}', projection === 3978 ? '268' : '74')
          );
        }
      }

      if (type === 'simple') {
        if (this.basemapsList[projection].simple) {
          thumbnailUrls.push(
            this.basemapsList[projection].simple
              .replace('{z}', '8')
              .replace('{y}', projection === 3978 ? '285' : '91')
              .replace('{x}', projection === 3978 ? '268' : '74')
          );
        }
      }

      if (type === 'shaded') {
        if (this.basemapsList[projection].shaded) {
          thumbnailUrls.push(
            this.basemapsList[projection].shaded
              .replace('{z}', '8')
              .replace('{y}', projection === 3978 ? '285' : '91')
              .replace('{x}', projection === 3978 ? '268' : '74')
          );
        }
      }

      if (type === 'label') {
        if (this.basemapsList[this.projection].label) {
          thumbnailUrls.push(
            this.basemapsList[this.projection].label
              .replace('xxxx', language === 'en-CA' ? 'CBMT' : 'CBCT')
              .replace('{z}', '8')
              .replace('{y}', projection === 3978 ? '285' : '91')
              .replace('{x}', projection === 3978 ? '268' : '74')
          );
        }
      }
    }

    return thumbnailUrls;
  };

  /**
   * Get basemap information (nbame and description)
   *
   * @param {string[]} basemapTypes basemap layer type (shaded, transport, label, simple)
   * @param {TypeProjectionCodes} projection basemap projection
   * @param {TypeLocalizedLanguages} language basemap language
   * @returns {string} array with information [name, description]
   */
  private getInfo = (basemapTypes: string[], projection: TypeProjectionCodes, language: TypeLocalizedLanguages): string[] => {
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
   * Create the core basemap and add the layers to it
   *
   * @param {TypeBasemapOptions} basemapOptions basemap options
   */
  createCoreBasemap = (basemapOptions: TypeBasemapOptions): void => {
    const basemapLayers: TypeBasemapLayer[] = [];
    const basemaplayerTypes: string[] = [];

    const coreBasemapOptions = basemapOptions === undefined ? this.basemapOptions : basemapOptions;
    if (coreBasemapOptions) {
      if (coreBasemapOptions.shaded && this.basemapsList[this.projection].shaded) {
        basemapLayers.push({
          id: 'shaded',
          type: 'shaded',
          url: this.basemapsList[this.projection].shaded,
          options: this.basemapLayerOptions,
          opacity: 0.75,
          basemapPaneName: this.basemapsPaneName,
        });
        basemaplayerTypes.push('shaded');
      }

      if (this.basemapsList[this.projection][coreBasemapOptions.id]) {
        basemapLayers.push({
          id: coreBasemapOptions.id || 'transport',
          type: 'transport',
          url: this.basemapsList[this.projection][coreBasemapOptions.id] || this.basemapsList[this.projection].transport,
          options: this.basemapLayerOptions,
          opacity: 1,
          basemapPaneName: this.basemapsPaneName,
        });
        basemaplayerTypes.push(coreBasemapOptions.id || 'transport');
      }

      if (basemapLayers.length && coreBasemapOptions.labeled) {
        // get proper label url
        basemapLayers.push({
          id: 'label',
          type: 'label',
          url: this.basemapsList[this.projection].label.replaceAll('xxxx', this.language === 'en-CA' ? 'CBMT' : 'CBCT'),
          options: this.basemapLayerOptions,
          opacity: 0.8,
          basemapPaneName: this.basemapsPaneName,
        });
        basemaplayerTypes.push('label');
      }
    }

    if (!this.isExisting(basemaplayerTypes.join('-'))) {
      const info = this.getInfo(basemaplayerTypes, this.projection as TypeProjectionCodes, this.language as TypeLocalizedLanguages);

      // id and typer are derived from the basemap type composition (shaded, label, transport, simple)
      this.createBasemap({
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
        attribution: '',
        zoomLevels: {
          min: 0,
          max: 17,
        },
      });
    }
  };

  /**
   * Create a custom basemap
   *
   * @param {TypeBasemapProps} basemapProps basemap properties
   */
  createCustomBasemap = (basemapProps: TypeBasemapProps): void => {
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
        basemapPaneName: this.basemapsPaneName,
      };
    });
    formatProps.type = 'test';
    formatProps.description = this.language === 'en-CA' ? description.en : description.fr;
    formatProps.altText = this.language === 'en-CA' ? description.en : description.fr;
    formatProps.thumbnailUrl = this.language === 'en-CA' ? thumbnailUrl.en : thumbnailUrl.fr;
    formatProps.attribution = this.language === 'en-CA' ? attribution.en : attribution.fr;

    this.createBasemap(formatProps);
  };

  /**
   * Load the default basemap that was passed in the map config
   *
   * @param {TypeBasemapOptions} basemapOptions basemap options
   */
  loadDefaultBasemaps = (basemapOptions: TypeBasemapOptions): void => {
    this.createCoreBasemap(basemapOptions);

    const { layers } = this.basemaps[0];

    [this.activeBasemap] = [this.basemaps[0]];

    // emit an event to update the basemap layers on the map
    api.event.emit(basemapLayerArrayPayload(EVENT_NAMES.BASEMAP.EVENT_BASEMAP_LAYERS_UPDATE, this.mapId, layers));
  };

  /**
   * Create a new basemap
   *
   * @param {TypeBasemapProps} basemapProps basemap properties
   */
  private createBasemap = (basemapProps: TypeBasemapProps): void => {
    // generate an id if none provided
    // eslint-disable-next-line no-param-reassign
    if (!basemapProps.id) basemapProps.id = generateId(basemapProps.id);

    const thumbnailUrls: string[] = [];

    // set thumbnail if not provided
    if (!basemapProps.thumbnailUrl || basemapProps.thumbnailUrl.length === 0) {
      basemapProps.layers.forEach((layer) => {
        // const { type } = layer;

        // eslint-disable-next-line no-param-reassign
        layer.basemapPaneName = this.basemapsPaneName;

        // TODO: set thumbnails from configuration
      });

      // eslint-disable-next-line no-param-reassign
      basemapProps.thumbnailUrl = thumbnailUrls;
    }

    // add the basemap to the basemaps if it has layers
    if (basemapProps.layers.length) this.basemaps.push(basemapProps);
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
    api.event.emit(basemapLayerArrayPayload(EVENT_NAMES.BASEMAP.EVENT_BASEMAP_LAYERS_UPDATE, this.mapId, basemap.layers));
  };

  /**
   * get attribution value to add the the map
   *
   * @returns {TypeAttribution} the attribution value
   */
  get attribution(): TypeAttribution {
    return this.attributionVal;
  }
}
