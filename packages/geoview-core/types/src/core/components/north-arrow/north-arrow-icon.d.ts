/// <reference types="react" />
import { ClassNameMap } from '@mui/styles';
/**
 * interface for north arrow icon properties
 */
interface NorthArrowIconProps {
    classes: ClassNameMap;
}
/**
 * Create a north arrow icon
 *
 * @param {NorthArrowIconProps} props north arrow icon properties
 */
export declare function NorthArrowIcon(props: NorthArrowIconProps): JSX.Element;
/**
 * Create a north pole svg icon
 */
export declare const NorthPoleIcon = "<svg xmlns=\"http://www.w3.org/2000/svg\" height=\"24\" viewBox=\"0 0 24 24\" width=\"24\"><path d=\"M0 0h24v24H0z\" fill=\"none\"/><path d=\"M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z\"/></svg>";
export {};
