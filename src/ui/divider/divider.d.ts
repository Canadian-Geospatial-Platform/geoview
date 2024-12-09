import { SxProps, Theme } from '@mui/material/styles';
import { DividerProps } from '@mui/material';
/**
 * Properties for the Divider
 */
interface TypeDividerProps extends DividerProps {
    orientation?: 'horizontal' | 'vertical';
    grow?: boolean;
    sx?: SxProps<Theme>;
}
/**
 * Create a customized Material UI Divider
 *
 * @param {TypeDividerProps} props the properties passed to the Divider element
 * @returns {JSX.Element} the created Divider element
 */
export declare function Divider(props: TypeDividerProps): JSX.Element;
export {};
