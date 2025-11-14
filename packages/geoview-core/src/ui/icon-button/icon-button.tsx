import type { ReactNode, RefObject } from 'react';
import type { TooltipProps, IconButtonProps } from '@mui/material';
import { Fade, IconButton as MaterialIconButton, Tooltip } from '@mui/material';
import { logger } from '@/core/utils/logger';

/**
 * Properties for the icon button extending Material-UI's IconButtonProps
 *
 * @property {ReactNode} [children] - The icon or content to display inside the button. Required to display the icon. Without it, the button would be empty.
 * @property {string} aria-label - **Required.** Screen reader text for accessibility. An icon button will never have a text label so it needs a descriptive label for screen readers.
 * @property {string} [tooltip] - Optional. Tooltip text shown on hover (defaults to aria-label if not provided). Tooltip is for better UX but not required for accessibility.
 * @property {TooltipProps['placement']} [tooltipPlacement] - Optional. Position of the tooltip (top, bottom, left, right, etc.)
 * @property {number} [tabIndex] - Optional. Tab order for keyboard navigation
 * @property {RefObject<HTMLButtonElement>} [iconRef] - Optional. Ref to access the button element
 * @property {boolean} [visible] - Optional. Controls button visibility
 *
 * @see {@link IconButtonProps} for additional inherited props from Material-UI
 */

// TODO: WCAG - remove visible prop if it's not being used anywhere
export interface IconButtonPropsExtend extends Omit<IconButtonProps, 'aria-label'> {
  children?: ReactNode;
  'aria-label': string;
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
 * @param {IconButtonPropsExtend} props - The properties passed to the Icon Button element
 * @returns {JSX.Element} The Icon Button component
 * @example
 * ```tsx
 * // Basic usage
 * <IconButton aria-label="Delete item">
 *   <DeleteIcon />
 * </IconButton>
 *
 * // With tooltip
 * <IconButton
 *   aria-label="Delete item"
 *   tooltip="Delete item permanently"
 *   tooltipPlacement="top"
 * >
 *   <DeleteIcon />
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
function IconButtonUI(props: IconButtonPropsExtend): JSX.Element {
  logger.logTraceRenderDetailed('ui/icon-button/icon-button');

  // Get constant from props
  const {
    sx,
    className,
    style,
    children,
    onClick,
    'aria-label': ariaLabel,
    tooltip,
    tooltipPlacement,
    id,
    tabIndex,
    iconRef,
    size,
    disabled,
    color,
    ...rest
  } = props;

  // Tooltip can usually be the same as aria-label, but can be different if needed
  function createIconButtonUI(): JSX.Element {
    return (
      <MaterialIconButton
        id={id}
        sx={sx}
        aria-label={ariaLabel}
        style={style}
        className={className}
        onClick={onClick}
        tabIndex={tabIndex}
        size={size}
        ref={iconRef}
        disabled={disabled}
        color={color}
        {...rest}
      >
        {children}
      </MaterialIconButton>
    );
  }

  if (disabled) {
    return createIconButtonUI();
  }

  return (
    <Tooltip title={tooltip || ariaLabel} placement={tooltipPlacement} slots={{ transition: Fade }}>
      {createIconButtonUI()}
    </Tooltip>
  );
}

export const IconButton = IconButtonUI;
