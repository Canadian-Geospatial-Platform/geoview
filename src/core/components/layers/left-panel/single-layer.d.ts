import type { TypeContainerBox } from '@/core/types/global-types';
interface SingleLayerProps {
    layerPath: string;
    depth: number;
    showLayerDetailsPanel: (layerId: string) => void;
    isFirst: boolean;
    isLast: boolean;
    isLayoutEnlarged: boolean;
    containerType: TypeContainerBox;
}
export declare function SingleLayer({ depth, layerPath, showLayerDetailsPanel, isFirst, isLast, isLayoutEnlarged, containerType, }: SingleLayerProps): JSX.Element;
export {};
//# sourceMappingURL=single-layer.d.ts.map