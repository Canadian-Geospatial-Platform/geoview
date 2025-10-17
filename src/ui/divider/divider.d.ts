import type { SxProps, Theme } from '@mui/material/styles';
import type { DividerProps } from '@mui/material';
/**
 * Properties for the Divider component extending Material-UI's DividerProps
 */
export interface DividerPropsExtend extends DividerProps {
    orientation?: 'horizontal' | 'vertical';
    grow?: boolean;
    sx?: SxProps<Theme>;
}
/**
 * Create a customized Material UI Divider component.
 *
 * @component
 * @example
 * ```tsx
 * // Basic usage
 * <Divider />
 *
 * // Vertical divider
 * <Divider orientation="vertical" />
 *
 * // Growing divider
 * <Divider grow />
 *
 * // With custom styling
 * <Divider
 *   sx={{
 *     borderColor: 'primary.main',
 *     margin: 2
 *   }}
 * />
 * ```
 *
 * @param {DividerPropsExtend} props - The properties passed to the Divider element
 * @returns {JSX.Element} The Divider component
 *
 * @see {@link https://mui.com/material-ui/react-divider/}
 */
declare function DividerUI(props: DividerPropsExtend): JSX.Element;
export declare const Divider: typeof DividerUI;
export {};
//# sourceMappingURL=divider.d.ts.map