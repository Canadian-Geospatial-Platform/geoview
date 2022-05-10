import { Layer, TileLayer } from 'leaflet';
import { TypeWebLayers, TypeBaseWebLayersConfig, TypeLayersInWebLayer } from '../cgpv-types';
export declare abstract class AbstractWebLayersClass {
    type: TypeWebLayers;
    id: string;
    name: string;
    url: string;
    protected mapId: string;
    abstract layer: Layer | TileLayer | null;
    layers: TypeLayersInWebLayer;
    entries?: string[] | number[];
    setEntries?(entries: number[]): void;
    abstract getBounds(): L.LatLngBounds | Promise<L.LatLngBounds>;
    abstract setOpacity(opacity: number): void;
    constructor(type: TypeWebLayers, layerConfig: TypeBaseWebLayersConfig, mapId: string);
}
