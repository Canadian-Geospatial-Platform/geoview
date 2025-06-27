import { GroupLayerEntryConfig } from '@/api/config/types/map-schema-types';
export interface AddLayerTreeProps {
    layersData: GroupLayerEntryConfig[];
    onSelectedItemsChange(items: string[]): void;
}
export declare function AddLayerTree(props: AddLayerTreeProps): JSX.Element | null;
//# sourceMappingURL=add-layer-tree.d.ts.map