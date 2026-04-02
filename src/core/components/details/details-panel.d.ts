import type { TypeContainerBox } from '@/core/types/global-types';
/** Properties for the details panel component. */
interface DetailsPanelType {
    /** The container type (appBar or footerBar). */
    containerType: TypeContainerBox;
}
/**
 * Creates the details panel component.
 *
 * @param props - Properties defined in DetailsPanelType interface
 * @returns The details panel component
 */
export declare function DetailsPanel({ containerType }: DetailsPanelType): JSX.Element;
export {};
//# sourceMappingURL=details-panel.d.ts.map