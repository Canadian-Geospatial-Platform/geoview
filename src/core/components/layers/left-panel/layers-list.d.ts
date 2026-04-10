import type { TypeContainerBox } from '@/core/types/global-types';
interface LayerListProps {
    depth: number;
    layerPaths: string[];
    showLayerDetailsPanel: (layerId: string) => void;
    isLayoutEnlarged: boolean;
    containerType: TypeContainerBox;
}
export declare function LayersList({ layerPaths, showLayerDetailsPanel, isLayoutEnlarged, depth, containerType }: LayerListProps): JSX.Element;
export {};
//# sourceMappingURL=layers-list.d.ts.map