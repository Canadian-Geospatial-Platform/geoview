import { TypeLegendLayer } from '@/core/components/layers/types';
import { LayerListEntry } from '.';
export interface TypeIconStackProps {
    layerPath: string;
    onIconClick?: () => void;
    onStackIconClick?: (e: React.KeyboardEvent<HTMLElement>) => void;
}
interface LayerIconProps {
    layer: TypeLegendLayer | LayerListEntry;
}
export declare const LayerIcon: import("react").NamedExoticComponent<LayerIconProps>;
export {};
