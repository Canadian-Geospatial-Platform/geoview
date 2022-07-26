import { Extent } from 'ol/extent';
import { ImageArcGISRest, ImageWMS, Vector as VectorSource, XYZ } from 'ol/source';
import { Vector as VectorLayer, VectorImage, Image as ImageLayer, Tile as TileLayer } from 'ol/layer';

import { TypeWebLayers, TypeBaseWebLayersConfig, TypeLayersInWebLayer } from '../cgpv-types';

import { generateId } from '../../utils/utilities';

import { api } from '../../../app';

// Constant used to define the default layer names
const DEFAULT_LAYER_NAMES: Record<TypeWebLayers, string> = {
  esriDynamic: 'Esri Dynamic Layer',
  esriFeature: 'Esri Feature Layer',
  geojson: 'GeoJson Layer',
  geoCore: 'GeoCore Layer',
  xyzTiles: 'XYZ Tiles',
  ogcFeature: 'OGC Feature Layer',
  ogcWfs: 'WFS Layer',
  ogcWms: 'WMS Layer',
};

export abstract class AbstractWebLayersClass {
  // type of web layer
  type: TypeWebLayers;

  // layer id with default
  id: string;

  // layer name with default
  name: string;

  // layer or layer service url
  url: string;

  // map id
  protected mapId: string;

  // The actual layer
  abstract layer:
    | ImageLayer<ImageArcGISRest>
    | ImageLayer<ImageWMS>
    | VectorImage<VectorSource>
    | VectorLayer<VectorSource>
    | TileLayer<XYZ>;

  layers: TypeLayersInWebLayer = {};

  // service entries
  entries?: string[] | number[];

  setEntries?(entries: number[]): void;

  abstract getBounds(): Extent | Promise<Extent>;

  abstract setOpacity(opacity: number): void;

  constructor(type: TypeWebLayers, layerConfig: TypeBaseWebLayersConfig, mapId: string) {
    this.type = type;
    this.id = layerConfig.id || generateId('');
    this.name = layerConfig.name ? layerConfig.name[api.map(mapId).getLanguageCode()] : DEFAULT_LAYER_NAMES[type];
    this.url = layerConfig.url[api.map(mapId).getLanguageCode()].trim();
    this.mapId = mapId;
  }
}
