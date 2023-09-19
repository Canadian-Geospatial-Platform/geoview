/// <reference types="react" />
import { TypeFieldEntry } from '@/api/events/payloads';
interface FeatureInfoTableProps {
    featureInfoList: TypeFieldEntry[];
}
/**
 * Feature info table that creates a table keys/values of the given feature info
 *
 * @returns {JSX.Element} the layers list
 */
export declare function FeatureInfoTable({ featureInfoList }: FeatureInfoTableProps): JSX.Element;
export {};
