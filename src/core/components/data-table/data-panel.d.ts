/// <reference types="react" />
import { TypeContainerBox } from '@/core/types/global-types';
interface DataPanelType {
    fullWidth?: boolean;
    containerType?: TypeContainerBox;
}
/**
 * Build Data panel from map.
 * @returns {JSX.Element} Data table as react element.
 */
export declare function Datapanel({ fullWidth, containerType }: DataPanelType): JSX.Element;
export {};
