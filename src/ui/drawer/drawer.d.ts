/// <reference types="react" />
import { DrawerProps } from '@mui/material';
/**
 * Drawer Properties
 */
export interface TypeDrawerProps extends DrawerProps {
    status?: boolean;
}
/**
 * Create a customized Material UI Drawer
 *
 * @param {TypeDrawerProps} props the properties passed to the Drawer element
 * @returns {JSX.Element} the created Drawer element
 */
export declare function Drawer(props: TypeDrawerProps): JSX.Element;
