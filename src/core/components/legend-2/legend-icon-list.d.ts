/// <reference types="react" />
import { TypeVectorLayerEntryConfig, TypeStyleGeometry, TypeLayerEntryConfig } from '../../types/cgpv-types';
export interface TypeLegendIconListProps {
    iconImages: string[];
    iconLabels: string[];
    layerConfig?: TypeVectorLayerEntryConfig;
    mapId?: string;
    geometryKey?: TypeStyleGeometry;
    isParentVisible?: boolean;
    toggleParentVisible?: () => void;
    toggleMapVisible?: (layerConfig: TypeLayerEntryConfig) => void;
}
export declare function LegendIconList(props: TypeLegendIconListProps): JSX.Element;
