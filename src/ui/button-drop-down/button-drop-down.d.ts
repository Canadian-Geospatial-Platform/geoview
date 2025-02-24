import { ButtonGroupProps } from '@mui/material';
/**
 * Properties for the ButtonDropDown component extending Material-UI's ButtonGroupProps
 */
export interface ButtonDropDownPropsExtend extends ButtonGroupProps {
    /** Array of options to display in the dropdown */
    options: string[];
    /** Callback fired when a button is clicked */
    onButtonClick?: (index: number, text: string) => void;
}
/**
 * A customized Material-UI Button Drop Down component.
 *
 * @component
 * @example
 * ```tsx
 * // Basic usage
 * <ButtonDropDown
 *   options={['Option 1', 'Option 2', 'Option 3']}
 *   onButtonClick={(index, text) => console.log(text)}
 * />
 *
 * // With custom styling
 * <ButtonDropDown
 *   options={['Small', 'Medium', 'Large']}
 *   sx={{
 *     backgroundColor: 'primary.light'
 *   }}
 * />
 * ```
 *
 * @param {ButtonDropDownPropsExtend} props - The properties for the ButtonDropDown component
 * @returns {JSX.Element} A rendered ButtonDropDown component
 *
 * @note For performance optimization in cases of frequent parent re-renders,
 * consider wrapping this component with React.memo at the consumption level.
 *
 * @see {@link https://mui.com/material-ui/react-button-group/}
 */
declare function ButtonDropDownUI(props: ButtonDropDownPropsExtend): JSX.Element;
export declare const ButtonDropDown: typeof ButtonDropDownUI;
export {};
