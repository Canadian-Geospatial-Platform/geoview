interface SingleLayerProps {
    layerPath: string;
    depth: number;
    showLayerDetailsPanel: (layerId: string) => void;
    isFirst: boolean;
    isLast: boolean;
    isLayoutEnlarged: boolean;
}
export declare function SingleLayer({ depth, layerPath, showLayerDetailsPanel, isFirst, isLast, isLayoutEnlarged }: SingleLayerProps): JSX.Element;
export {};
