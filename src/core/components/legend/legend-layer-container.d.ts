import { type ComponentType } from 'react';
import type { LegendLayerProps } from './legend-layer';
import type { TypeContainerBox } from '@/core/types/global-types';
interface CollapsibleContentProps {
    layerPath: string;
    initLightBox: (images: string, altText: string, returnFocusId: string, index?: number) => void;
    LegendLayerComponent: ComponentType<LegendLayerProps>;
    showControls: boolean;
    containerType: TypeContainerBox;
    collapseContainerId: string;
    layerNameId: string;
}
export declare const CollapsibleContent: import("react").NamedExoticComponent<CollapsibleContentProps>;
export {};
//# sourceMappingURL=legend-layer-container.d.ts.map