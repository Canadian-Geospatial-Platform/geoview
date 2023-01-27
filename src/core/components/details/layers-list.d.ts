/// <reference types="react" />
import { TypeArrayOfLayerData, DetailsStyleProps } from './details';
interface TypeLayersListProps {
    arrayOfLayerData: TypeArrayOfLayerData;
    detailsStyle: DetailsStyleProps;
}
/**
 * layers list
 *
 * @returns {JSX.Element} the layers list
 */
export declare function LayersList(props: TypeLayersListProps): JSX.Element;
export {};
