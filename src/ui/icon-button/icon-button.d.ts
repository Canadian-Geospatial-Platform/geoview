import type { ReactNode, RefObject } from 'react';
import type { TooltipProps, IconButtonProps } from '@mui/material';
/**
 * Properties for the icon button extending Material-UI's IconButtonProps
 *
 * @property {ReactNode} [children] - The icon or content to display inside the button.
 * @property {string} aria-label - Screen reader text for accessibility. An icon button will never have a text label so it needs a descriptive label for screen readers.
 * @property {string | null} [tooltip] - Optional. Tooltip text shown on hover (defaults to aria-label if not provided, set to null to disable).
 * @property {TooltipProps['placement']} [tooltipPlacement] - Optional. Position of the tooltip (top, bottom, left, right, etc.)
 * @property {number} [tabIndex] - Optional. Tab order for keyboard navigation
 * @property {RefObject<HTMLButtonElement>} [iconRef] - Optional. Ref to access the button element
 * @property {boolean} [visible] - Optional. Controls button visibility
 *
 * @see {@link IconButtonProps} for additional inherited props from Material-UI
 */
export interface IconButtonPropsExtend extends Omit<IconButtonProps, 'aria-label'> {
    children?: ReactNode;
    'aria-label': string;
    tooltip?: string | null;
    tooltipPlacement?: TooltipProps['placement'];
    tabIndex?: number;
    iconRef?: RefObject<HTMLButtonElement>;
    visible?: boolean;
}
/**
 * Create a customized Material UI Icon Button component.
 *
 * @component
 * @param {IconButtonPropsExtend} props - The properties passed to the Icon Button element
 * @returns {JSX.Element} The Icon Button component
 * @example
 * ```tsx
 * // Basic usage
 * <IconButton aria-label="Delete item">
 *   <DeleteIcon />
 * </IconButton>
 *
 *  // With implicit tooltip (aria-label)
 * <IconButton
 *   aria-label="Delete item"
 *   tooltipPlacement="top"
 * >
 *   <DeleteIcon />
 * </IconButton>
 *
 * // With explicit tooltip
 * <IconButton
 *   aria-label="Delete item"
 *   tooltip="Delete item permanently"
 *   tooltipPlacement="top"
 * >
 *   <DeleteIcon />
 * </IconButton>
 *
 * // Tooltip disabled (no tooltip on hover)
 * <IconButton
 * aria-label="Close dialog"
 * tooltip={null}
 * >
 * <CloseIcon />
 * </IconButton>
 *
 * // With custom styling
 * <IconButton
 *   aria-label="Edit item"
 *   tooltip="Edit this item"
 *   className="custom-button"
 *   size="small"
 *   color="primary"
 * >
 *   <EditIcon />
 * </IconButton>
 *
 * // With disabled state
 * <IconButton
 *   aria-label="Save document"
 *   disabled={true}
 *   tooltip="Not available"
 * >
 *   <SaveIcon />
 * </IconButton>
 * ```

 *
 * @see {@link https://mui.com/material-ui/react-button/#icon-button}
 */
declare function IconButtonUI(props: IconButtonPropsExtend): JSX.Element;
export declare const IconButton: typeof IconButtonUI;
export {};
//# sourceMappingURL=icon-button.d.ts.map