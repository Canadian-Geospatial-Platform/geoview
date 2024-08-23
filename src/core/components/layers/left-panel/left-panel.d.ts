/// <reference types="react" />
import { TypeLegendLayer } from '@/core/components/layers/types';
interface LeftPanelProps {
    showLayerDetailsPanel: (layer: TypeLegendLayer) => void;
    isLayoutEnlarged: boolean;
}
export declare function LeftPanel({ showLayerDetailsPanel, isLayoutEnlarged }: LeftPanelProps): JSX.Element;
export {};
