import type { TypeContainerBox } from '@/core/types/global-types';
/** Properties for the Datapanel component. */
interface DataPanelType {
    /** The container type (app-bar or footer-bar). */
    containerType: TypeContainerBox;
}
/**
 * Renders the data panel with layer list and data table.
 *
 * @param props - Datapanel properties
 * @returns The data panel element
 */
export declare function Datapanel({ containerType }: DataPanelType): JSX.Element;
export {};
//# sourceMappingURL=data-panel.d.ts.map