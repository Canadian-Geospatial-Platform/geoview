import { MutableRefObject } from 'react';
import { TypeArrayOfFeatureInfoEntries, TypeFeatureInfoEntry } from '@/api/events/payloads';
export interface TypeFeatureInfoProps {
    mapId: string;
    features: TypeArrayOfFeatureInfoEntries;
    currentFeatureIndex: number;
    onClearCheckboxes: () => void;
    onFeatureNavigateChange: (checkedFeatures: Exclude<TypeArrayOfFeatureInfoEntries, null | undefined>, currentFeature: TypeFeatureInfoEntry) => void;
    setDisableClearAllBtn: (isDisabled: boolean) => void;
    selectedFeatures?: MutableRefObject<string[]>;
    clearAllCheckboxes?: boolean;
}
/**
 * feature info for a layer list
 *
 * @param {TypeFeatureInfoProps} Feature info properties
 * @returns {JSX.Element} the feature info
 */
export declare function FeatureInfo({ mapId, features, currentFeatureIndex, selectedFeatures, onClearCheckboxes, onFeatureNavigateChange, setDisableClearAllBtn, clearAllCheckboxes, }: TypeFeatureInfoProps): JSX.Element;
