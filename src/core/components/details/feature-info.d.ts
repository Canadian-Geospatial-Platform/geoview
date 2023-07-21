import { MutableRefObject } from 'react';
import { TypeFeatureInfoEntry } from '@/api/events/payloads/get-feature-info-payload';
import { DetailsProps } from './details';
export interface TypeFeatureProps {
    feature: TypeFeatureInfoEntry;
    startOpen?: boolean;
    selectedFeatures?: MutableRefObject<string[]>;
    detailsSettings: DetailsProps;
}
/**
 * feature info for a layer list
 *
 * @returns {JSX.Element} the feature info
 */
export declare function FeatureInfo(props: TypeFeatureProps): JSX.Element;
