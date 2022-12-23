/// <reference types="react" />
import { TypeArrayOfFeatureInfoEntries } from '../../../api/events/payloads/get-feature-info-payload';
export interface TypeDetailsProps {
    arrayOfLayerData: TypeArrayOfLayerData;
}
export interface TypeLayerData {
    layerPath: string;
    layerName: string;
    features: TypeArrayOfFeatureInfoEntries;
}
export type TypeArrayOfLayerData = TypeLayerData[];
/**
 * The Details component is used to display the list of layers that have selected features. It allows to show the list of features found in the click tolerance of the getFeatureInfo when you click on the expand icon.
 *
 * @returns {JSX.Element} returns the Details component
 */
export declare function Details(props: TypeDetailsProps): JSX.Element | null;
