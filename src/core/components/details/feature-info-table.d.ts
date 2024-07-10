/// <reference types="react" />
import { TypeFieldEntry } from '@/geo/map/map-schema-types';
interface FeatureInfoTableProps {
    featureInfoList: TypeFieldEntry[];
}
/**
 * Feature info table that creates a table keys/values of the given feature info
 *
 * @param {FeatureInfoTableProps} Feature info table properties
 * @returns {JSX.Element} the layers list
 */
export declare function FeatureInfoTable({ featureInfoList }: FeatureInfoTableProps): JSX.Element;
export {};
