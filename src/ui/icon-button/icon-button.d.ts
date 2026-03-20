import type { ReactNode, RefObject } from 'react';
import type { TooltipProps, IconButtonProps } from '@mui/material';
/**
 * Custom properties for the IconButton component.
 *
 * Extends Material-UI's IconButtonProps with tooltip support and accessibility enhancements.
 *
 * @property children - The icon or content to display inside the button
 * @property aria-label - Screen reader text for accessibility. An icon button will never have a text label so it needs a descriptive label for screen readers
 * @property tooltip - Optional tooltip text shown on hover (defaults to aria-label if not provided, set to null to disable)
 * @property tooltipPlacement - Optional position of the tooltip (top, bottom, left, right, etc.)
 * @property tabIndex - Optional tab order for keyboard navigation
 * @property iconRef - Optional ref to access the button element
 * @property visible - Optional controls button visibility
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
 * Material-UI IconButton component with optional tooltip support.
 *
 * Wraps Material-UI's IconButton to provide accessible icon-based button control
 * with built-in tooltip support. Requires aria-label for accessibility compliance.
 * Tooltip can either use the aria-label or be customized via tooltip prop.
 * All Material-UI IconButton props are supported and passed through directly.
 *
 * @param props - IconButton configuration (see IconButtonPropsExtend interface)
 * @returns IconButton component with optional tooltip overlay on hover
 *
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