/// <reference types="react" />
import { TypeArrayOfLayerData } from './details';
interface TypeLayersListProps {
    arrayOfLayerData: TypeArrayOfLayerData;
    mapId: string;
}
/**
 * layers list
 *
 * @param {TypeLayersListProps} props The properties passed to LayersListFooter
 * @returns {JSX.Element} the layers list
 */
export declare function LayersListFooter(props: TypeLayersListProps): JSX.Element;
export {};
