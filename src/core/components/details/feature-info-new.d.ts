/// <reference types="react" />
import { TypeArrayOfFeatureInfoEntries } from '@/api/events/payloads';
export interface TypeFeatureInfoProps {
    features: TypeArrayOfFeatureInfoEntries;
    currentFeatureIndex: number;
}
/**
 * feature info for a layer list
 *
 * @param {TypeFeatureInfoProps} Feature info properties
 * @returns {JSX.Element} the feature info
 */
export declare function FeatureInfo({ features, currentFeatureIndex }: TypeFeatureInfoProps): JSX.Element;
