import { SwitchProps } from '@mui/material';
/**
 * Create a customized Material UI Switch component.
 * This is a simple wrapper around MaterialSwitch that maintains
 * full compatibility with Material-UI's Switch props while providing
 * a form control label.
 *
 * @component
 * @example
 * ```tsx
 * // Basic usage
 * <Switch
 *   title="Toggle Switch"
 *   checked={isChecked}
 *   onChange={handleChange}
 * />
 *
 * // Disabled state
 * <Switch
 *   title="Disabled Switch"
 *   disabled
 *   checked={false}
 * />
 *
 * // With size variant
 * <Switch
 *   title="Small Switch"
 *   size="small"
 *   checked={isChecked}
 * />
 * ```
 *
 * @param {SwitchProps} props - All valid Material-UI Switch props
 * @returns {JSX.Element} The Switch component wrapped in FormControlLabel
 *
 * @see {@link https://mui.com/material-ui/react-switch/}
 */
declare function SwitchUI(props: SwitchProps): JSX.Element;
export declare const Switch: typeof SwitchUI;
export {};
