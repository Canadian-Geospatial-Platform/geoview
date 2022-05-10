/// <reference types="react" />
import { CRS } from 'leaflet';
/**
 * north arrow passed in properties
 */
interface NorthArrowProps {
    projection: CRS;
}
/**
 * Create a north arrow
 * @param {NorthArrowProps} props north arrow properties
 * @return {JSX.Element} the north arrow component
 */
export declare function NorthArrow(props: NorthArrowProps): JSX.Element;
/**
 * Create a north pole flag icon
 *
 * @param {NorthArrowProps} props north pole properties (same as NorthArrow)
 * @return {JSX.Element} the north pole marker icon
 */
export declare function NorthPoleFlag(props: NorthArrowProps): JSX.Element;
export {};
