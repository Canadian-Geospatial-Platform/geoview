/// <reference types="react" />
import { TypeVectorLayerEntryConfig, TypeStyleGeometry, TypeLayerEntryConfig } from '../../types/cgpv-types';
export interface TypeLegendIconListProps {
    iconImages: string[];
    iconLabels: string[];
    mapId: string;
    layerConfig?: TypeVectorLayerEntryConfig;
    geometryKey?: TypeStyleGeometry;
    toggleMapVisible: (layerConfig: TypeLayerEntryConfig) => void;
}
export declare function LegendIconList(props: TypeLegendIconListProps): JSX.Element;
