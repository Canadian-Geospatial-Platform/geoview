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
 * Material-UI Divider component with orientation and growth options.
 *
 * Wraps Material-UI's Divider to provide flexible visual separation between content.
 * Supports horizontal/vertical orientation with optional flex-grow behavior for
 * layout spacing. All Material-UI Divider props are supported and passed through directly.
 *
 * @param props - Divider configuration (see DividerPropsExtend interface)
 * @returns Divider component with theme-aware styling
 *
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
 * @see {@link https://mui.com/material-ui/react-divider/}
 */
declare function DividerUI(props: DividerPropsExtend): JSX.Element;
export declare const Divider: typeof DividerUI;
export {};
//# sourceMappingURL=divider.d.ts.map