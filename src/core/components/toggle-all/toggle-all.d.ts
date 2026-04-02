import type { TypeContainerBox } from '@/core/types/global-types';
/** The properties for the toggle all component. */
interface ToggleAllProps {
    /** The source panel triggering the toggle. */
    source: 'layers' | 'legend';
    /** The type of container box. */
    containerType: TypeContainerBox;
}
/**
 * Renders toggle switches to control visibility and collapse state of all layers.
 *
 * @param props - The toggle all properties
 * @returns The toggle all component
 */
export declare function ToggleAll({ source, containerType }: ToggleAllProps): JSX.Element;
export {};
//# sourceMappingURL=toggle-all.d.ts.map