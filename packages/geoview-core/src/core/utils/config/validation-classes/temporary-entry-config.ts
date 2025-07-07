import { MapConfigLayerEntry } from '@/api/config/types/map-schema-types';
import { ConfigBaseClass } from './config-base-class';

export class TemporaryLayerEntryConfig extends ConfigBaseClass {
  public constructor(layerConfig: MapConfigLayerEntry) {
    super({ geoviewLayerConfig: layerConfig } as ConfigBaseClass);
  }
}
