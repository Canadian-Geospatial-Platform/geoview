/// <reference types="react" />
import { TypeLayerEntryConfig, TypeStyleGeometry, TypeVectorLayerEntryConfig } from '../../types/cgpv-types';
export interface TypeLegendIconListProps {
    iconImages: string[];
    iconLabels: string[];
    layerConfig?: TypeVectorLayerEntryConfig;
    geometryKey?: TypeStyleGeometry;
    isParentVisible?: boolean;
    toggleMapVisible: (layerConfig: TypeLayerEntryConfig) => void;
}
/**
 * List of Icons to show in expanded Legend Item
 *
 * @returns {JSX.Element} the list of icons
 */
export declare function LegendIconList(props: TypeLegendIconListProps): JSX.Element;
