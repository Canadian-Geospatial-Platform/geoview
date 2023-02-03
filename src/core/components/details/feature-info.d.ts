/// <reference types="react" />
import { TypeFeatureInfoEntry } from '../../../api/events/payloads/get-feature-info-payload';
export interface TypeFeatureProps {
    feature: TypeFeatureInfoEntry;
    startOpen?: boolean;
    backgroundStyle?: string;
}
/**
 * feature info for a layer list
 *
 * @returns {JSX.Element} the feature info
 */
export declare function FeatureInfo(props: TypeFeatureProps): JSX.Element;
