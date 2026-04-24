import type { TypeContainerBox } from '@/core/types/global-types';
interface LayerDetailsProps {
    /** The layer path for the layer to display. */
    layerPath: string;
    /** The type of container for the layer details panel. */
    containerType: TypeContainerBox;
}
/**
 * Creates the layer details panel with settings, info, and visibility controls.
 *
 * @param props - Properties defined in LayerDetailsProps interface
 * @returns The layer details panel element, or null if layer not found
 */
export declare function LayerDetails(props: LayerDetailsProps): JSX.Element | null;
export {};
//# sourceMappingURL=layer-details.d.ts.map