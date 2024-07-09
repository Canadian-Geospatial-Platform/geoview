/// <reference types="react" />
import { ButtonGroupProps } from '@mui/material';
/**
 * The ButtonDropDown props
 */
export type ButtonDropDownProps = ButtonGroupProps & {
    options: string[];
    onButtonClick?: (index: number, text: string) => void;
};
/**
 * Create a customized Material UI Button Drop Down.
 * Reference: https://mui.com/material-ui/react-button-group/ {Split button}
 *
 * @param {ButtonDropDownProps} props the properties passed to the Button Drop Down element
 * @returns {JSX.Element} the created Button Drop Down element
 */
export declare function ButtonDropDown(props: ButtonDropDownProps): JSX.Element;
