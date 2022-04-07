import { Layer, TileLayer } from 'leaflet';

import { TypeWebLayers, TypeAbstractWebLayersConfig, TypeLayersInWebLayer } from '../cgpv-types';

import { generateId } from '../../utils/utilities';

import { api } from '../../../api/api';

export abstract class AbstractWebLayersClass {
  // layer id with default
  id: string;

  // layer name with default
  name: string;

  // layer or layer service url
  url: string;

  // type of web layer
  type: TypeWebLayers;

  // The actual layer
  abstract layer: Layer | TileLayer | null;

  layers: TypeLayersInWebLayer = {};

  entries?: string[] | number[];

  setEntries?(entries: number[]): void;

  abstract getBounds(): L.LatLngBounds | Promise<L.LatLngBounds>;

  abstract setOpacity(opacity: number): void;

  constructor(type: TypeWebLayers, name: string, layerConfig: TypeAbstractWebLayersConfig, mapId: string) {
    this.id = layerConfig.id || generateId('');
    this.name = name;
    this.type = type;
    this.url = layerConfig.url[api.map(mapId).getLanguageCode()].trim();
  }
}
