/// <reference types="react" />
import { SwitchProps } from '@mui/material';
/**
 * Custom Material UI Switch properties
 */
export type TypeSwitchProps = SwitchProps & {
    mapId?: string;
};
/**
 * Create a Material UI Swich component
 *
 * @param {TypeSwitchProps} props custom switch properties
 * @returns {JSX.Element} the switch ui component
 */
export declare function Switch(props: TypeSwitchProps): JSX.Element;
