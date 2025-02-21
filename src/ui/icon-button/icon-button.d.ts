import { ReactNode, RefObject } from 'react';
import { TooltipProps, IconButtonProps } from '@mui/material';
/**
 * Properties for the icon button extending Material-UI's IconButtonProps
 */
export interface IconButtonPropsExtend extends IconButtonProps {
    children?: ReactNode;
    tooltip?: string;
    tooltipPlacement?: TooltipProps['placement'];
    tabIndex?: number;
    iconRef?: RefObject<HTMLButtonElement>;
    visible?: boolean;
}
/**
 * Create a customized Material UI Icon Button component.
 *
 * @component
 * @example
 * ```tsx
 * // Basic usage
 * <IconButton>
 *   <DeleteIcon />
 * </IconButton>
 *
 * // With tooltip
 * <IconButton
 *   tooltip="Delete item"
 *   tooltipPlacement="top"
 * >
 *   <DeleteIcon />
 * </IconButton>
 *
 * // With custom styling
 * <IconButton
 *   className="custom-button"
 *   size="small"
 *   color="primary"
 * >
 *   <EditIcon />
 * </IconButton>
 *
 * // With disabled state
 * <IconButton
 *   disabled={true}
 *   tooltip="Not available"
 * >
 *   <SaveIcon />
 * </IconButton>
 * ```
 *
 * @param {IconButtonPropsExtend} props - The properties passed to the Icon Button element
 * @returns {JSX.Element} The Icon Button component
 *
 * @see {@link https://mui.com/material-ui/react-button/#icon-button}
 */
declare function IconButtonUI(props: IconButtonPropsExtend): JSX.Element;
export declare const IconButton: typeof IconButtonUI;
export {};
