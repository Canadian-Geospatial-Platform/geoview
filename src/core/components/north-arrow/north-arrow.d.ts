/// <reference types="react" />
interface NorthArrowProps {
    projection: string;
}
/**
 * Create a north arrow
 *
 * @returns {JSX.Element} the north arrow component
 */
export declare function NorthArrow(props: NorthArrowProps): JSX.Element;
/**
 * Create a north pole flag icon
 * @param {NorthArrowProps} props north arrow icon props
 * @returns {JSX.Element} the north pole marker icon
 */
export declare function NorthPoleFlag(props: NorthArrowProps): JSX.Element;
export {};
