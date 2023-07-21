/// <reference types="react" />
import { TypeFeatureInfoEntry } from '@/api/events/payloads/get-feature-info-payload';
export interface TypeFeatureInfoProps {
    mapId: string;
    feature: TypeFeatureInfoEntry;
    startOpen?: boolean;
}
/**
 * feature info for a layer list
 *
 * @returns {JSX.Element} the feature info
 */
export declare function FeatureInfo(props: TypeFeatureInfoProps): JSX.Element;
