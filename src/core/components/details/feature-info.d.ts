/// <reference types="react" />
import { TypeFeatureInfoEntry } from '../../../api/events/payloads/get-feature-info-payload';
export interface TypeFeatureProps {
    key: number;
    feature: TypeFeatureInfoEntry;
    startOpen?: boolean;
    backgroundStyle?: string;
    singleColumn?: boolean;
}
/**
 * feature info for a layer list
 *
 * @returns {JSX.Element} the feature info
 */
export declare function FeatureInfo(props: TypeFeatureProps): JSX.Element;
