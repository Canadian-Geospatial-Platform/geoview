/// <reference types="react" />
import { TypeArrayOfFeatureInfoEntries } from '@/api/events/payloads';
export interface TypeDetailsProps {
    arrayOfLayerData: TypeArrayOfLayerData;
    mapId: string;
}
export interface TypeLayerData {
    layerPath: string;
    layerName: string;
    features: Exclude<TypeArrayOfFeatureInfoEntries, null | undefined>;
}
export type TypeArrayOfLayerData = TypeLayerData[];
/**
 * The Details component is used to display the list of layers in footer that have selected features. It allows to show the list of features found in the click tolerance of the getFeatureInfo when you click on the expand icon.
 *
 * @returns {JSX.Element} returns the Details component
 */
export declare function DetailsFooter({ arrayOfLayerData, mapId }: TypeDetailsProps): JSX.Element | null;
