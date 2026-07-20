import type { TypeLegendItem } from '@/core/components/layers/types';
interface ItemsListProps {
    items: TypeLegendItem[];
    layerPath: string;
}
/**
 * Renders the list of legend items for a layer.
 *
 * Memoized to prevent unnecessary re-renders when unrelated layer state changes.
 *
 * @param props - Properties defined in ItemsListProps interface
 * @returns The items list element, or null if no items
 */
export declare const ItemsList: import("react").MemoExoticComponent<({ items, layerPath }: ItemsListProps) => JSX.Element | null>;
export {};
//# sourceMappingURL=legend-layer-items.d.ts.map