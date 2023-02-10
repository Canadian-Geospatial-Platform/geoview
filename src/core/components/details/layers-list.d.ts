/// <reference types="react" />
import { TypeArrayOfLayerData, DetailsProps } from './details';
interface TypeLayersListProps {
    arrayOfLayerData: TypeArrayOfLayerData;
    detailsSettings: DetailsProps;
}
/**
 * layers list
 *
 * @returns {JSX.Element} the layers list
 */
export declare function LayersList(props: TypeLayersListProps): JSX.Element;
export {};
