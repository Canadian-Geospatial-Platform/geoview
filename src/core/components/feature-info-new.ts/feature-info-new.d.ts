import { MutableRefObject } from 'react';
import { TypeFeatureInfoEntry } from '@/app';
export interface TypeFeatureInfoProps {
    mapId: string;
    feature: TypeFeatureInfoEntry;
    selectedFeatures?: MutableRefObject<string[]>;
}
/**
 * feature info for a layer list
 *
 * @param {TypeFeatureInfoProps} Object of the propetties for FeatureInfo component
 * @returns {JSX.Element} the feature info
 */
export declare function FeatureInfo({ mapId, feature, selectedFeatures }: TypeFeatureInfoProps): JSX.Element;
