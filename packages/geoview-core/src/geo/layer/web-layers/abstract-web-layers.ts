import { Layer, TileLayer } from 'leaflet';

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
  /*
  entries?: string;
  */
};

export abstract class AbstractWebLayersClass {
  // layer id with default
  id: string;

  // layer name with default
  name: string;

  // type of web layer
  type: TypeWebLayers;

  // The actual layer
  abstract layer: Layer | TileLayer | null;

  // layer or layer service url
  url: string;

  constructor(type: TypeWebLayers, name: string, layerConfig: TypeAbstractWebLayersConfig) {
    this.id = layerConfig.id || generateId('');
    this.name = name;
    this.type = type;
    this.url = layerConfig.url.trim();
  }
}
