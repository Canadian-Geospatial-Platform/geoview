/// <reference types="react" />
import { TypeFieldEntry, TypeLayerData } from '@/app';
export interface MappedLayerDataType extends TypeLayerData {
    fieldInfos: Record<string, TypeFieldEntry | undefined>;
}
/**
 * Build Data panel from map.
 * @return {ReactElement} Data table as react element.
 */
export declare function Datapanel(): import("react").JSX.Element;
