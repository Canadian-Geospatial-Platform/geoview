import { TypeLegendLayer } from '@/core/components/layers/types';
import { LayerListEntry } from '@/core/components/common/layer-list';
export interface TypeIconStackProps {
    layerPath: string;
    onIconClick?: () => void;
    onStackIconClick?: (event: React.KeyboardEvent<HTMLElement>) => void;
}
interface LayerIconProps {
    layer: TypeLegendLayer | LayerListEntry;
}
export declare const LayerIcon: import("react").NamedExoticComponent<LayerIconProps>;
export {};
