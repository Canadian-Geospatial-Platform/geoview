/// <reference types="react" />
import { TypographyProps } from '@mui/material';
/**
 * Custom Material UI Typography properties
 */
interface TypeTypographyProps extends TypographyProps {
    mapId?: string;
}
/**
 * Create a Material UI Typography component
 *
 * @param {TypeTypographyProps} props custom typography properties
 * @returns {JSX.Element} the auto complete ui component
 */
export declare const Typography: import("react").ForwardRefExoticComponent<Omit<TypeTypographyProps, "ref"> & import("react").RefAttributes<unknown>>;
export {};
