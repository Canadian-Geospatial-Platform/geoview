/// <reference types="react" />
import { TypeButtonProps } from '@/ui/panel/panel-types';
export type ButtonProps = {
    makeResponsive?: boolean;
} & TypeButtonProps;
/**
 * Create a customized Material UI button
 *
 * @param {ButtonProps} props the properties of the Button UI element
 * @returns {JSX.Element} the new UI element
 */
export declare function Button(props: ButtonProps): JSX.Element;
