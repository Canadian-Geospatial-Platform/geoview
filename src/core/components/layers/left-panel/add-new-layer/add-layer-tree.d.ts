import type { TypeGeoviewLayerConfig } from '@/api/types/layer-schema-types';
export interface AddLayerTreeProps {
    layerTree: TypeGeoviewLayerConfig;
    onSelectedItemsChange(items: string[]): void;
}
/**
 * Creates the add-layer tree component.
 *
 * @param props - Properties defined in AddLayerTreeProps interface
 * @returns The add-layer tree component
 */
export declare function AddLayerTree(props: AddLayerTreeProps): JSX.Element | null;
//# sourceMappingURL=add-layer-tree.d.ts.map