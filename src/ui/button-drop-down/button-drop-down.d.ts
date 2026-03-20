import type { ButtonGroupProps } from '@mui/material';
/**
 * Properties for the ButtonDropDown component extending Material-UI's ButtonGroupProps
 */
export interface ButtonDropDownPropsExtend extends ButtonGroupProps {
    /** Array of option strings displayed as buttons in the dropdown menu */
    options: string[];
    /** Callback fired when a button or menu item is selected with (index, text) */
    onButtonClick?: (index: number, text: string) => void;
}
/**
 * Split button dropdown component for selecting from multiple options.
 *
 * Combines a main action button with a dropdown menu to provide quick access
 * to the current selection while allowing users to switch between alternatives.
 * Uses Material-UI's ButtonGroup, Popper, and MenuItem components. Manages
 * dropdown open/close state and notifies parent of selection changes via callback.
 *
 * @param props - ButtonDropDown configuration (see ButtonDropDownPropsExtend interface)
 * @returns Split button with dropdown menu that appears below on toggle
 *
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
 * @see {@link https://mui.com/material-ui/react-button-group/}
 */
declare function ButtonDropDownUI(props: ButtonDropDownPropsExtend): JSX.Element;
export declare const ButtonDropDown: typeof ButtonDropDownUI;
export {};
//# sourceMappingURL=button-drop-down.d.ts.map