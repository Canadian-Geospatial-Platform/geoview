/// <reference types="react" />
import { TypeVectorLayerEntryConfig, TypeStyleGeometry, TypeLayerEntryConfig } from '@/geo/map/map-schema-types';
export interface TypeLegendIconListProps {
    iconImages: string[];
    iconLabels: string[];
    mapId: string;
    layerConfig?: TypeVectorLayerEntryConfig;
    geometryKey?: TypeStyleGeometry;
    toggleMapVisible: (layerConfig: TypeLayerEntryConfig) => void;
}
export declare function LayerIconList(props: TypeLegendIconListProps): JSX.Element;
