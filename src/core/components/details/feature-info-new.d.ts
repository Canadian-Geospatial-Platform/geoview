/// <reference types="react" />
import { TypeFeatureInfoEntry } from '@/geo/map/map-schema-types';
export interface TypeFeatureInfoProps {
    features: TypeFeatureInfoEntry[] | undefined | null;
    currentFeatureIndex: number;
}
/**
 * feature info for a layer list
 *
 * @param {TypeFeatureInfoProps} Feature info properties
 * @returns {JSX.Element} the feature info
 */
export declare function FeatureInfo({ features, currentFeatureIndex }: TypeFeatureInfoProps): JSX.Element;
