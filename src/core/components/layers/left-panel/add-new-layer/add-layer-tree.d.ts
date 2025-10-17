import type { TypeGeoviewLayerConfig } from '@/api/types/layer-schema-types';
export interface AddLayerTreeProps {
    layerTree: TypeGeoviewLayerConfig;
    onSelectedItemsChange(items: string[]): void;
}
export declare function AddLayerTree(props: AddLayerTreeProps): JSX.Element | null;
//# sourceMappingURL=add-layer-tree.d.ts.map