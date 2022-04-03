import { Layer, TileLayer } from 'leaflet';
import { TypeLayersInWebLayer } from '../../../core/types/cgpv-types';

import { generateId } from '../../../core/utils/utilities';

/**
 * interface used to define the web-layers
 */
export type TypeWebLayers = 'esriDynamic' | 'esriFeature' | 'geoJSON' | 'xyzTiles' | 'ogcFeature' | 'ogcWFS' | 'ogcWMS';

/**
 * interface used by all web layers
 */
export type TypeAbstractWebLayersConfig = {
  id?: string;
  name?: string;
  url: string;
};

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

  constructor(type: TypeWebLayers, name: string, layerConfig: TypeAbstractWebLayersConfig) {
    this.id = layerConfig.id || generateId('');
    this.name = name;
    this.type = type;
    this.url = layerConfig.url.trim();
  }
}
