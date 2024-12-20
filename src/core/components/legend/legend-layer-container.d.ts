import { TypeLegendLayer } from '@/core/components/layers/types';
type LegendLayerType = React.FC<{
    layer: TypeLegendLayer;
}>;
interface CollapsibleContentProps {
    layer: TypeLegendLayer;
    legendExpanded: boolean;
    initLightBox: (imgSrc: string, title: string, index: number, total: number) => void;
    LegendLayerComponent: LegendLayerType;
}
export declare const CollapsibleContent: import("react").NamedExoticComponent<CollapsibleContentProps>;
export {};
