import { LegendLayer } from './legend-layer';
interface CollapsibleContentProps {
    layerPath: string;
    initLightBox: (imgSrc: string, title: string, index: number, total: number) => void;
    LegendLayerComponent: typeof LegendLayer;
}
export declare const CollapsibleContent: import("react").NamedExoticComponent<CollapsibleContentProps>;
export {};
//# sourceMappingURL=legend-layer-container.d.ts.map