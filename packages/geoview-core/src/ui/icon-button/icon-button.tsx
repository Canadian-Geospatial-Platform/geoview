import type { ReactNode, RefObject } from 'react';
import type { TooltipProps, IconButtonProps } from '@mui/material';
import { Fade, IconButton as MaterialIconButton, Tooltip } from '@mui/material';
import { logger } from '@/core/utils/logger';

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
function IconButtonUI(props: IconButtonPropsExtend): JSX.Element {
  logger.logTraceRenderDetailed('ui/icon-button/icon-button');

  // TODO: WCAG - Do we need to pass aria label? We should freuse toltip or title when define
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

  function createIconButtonUI(): JSX.Element {
    return (
      <MaterialIconButton
        id={id}
        sx={sx}
        aria-label={ariaLabel || tooltip}
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
        {children && children}
      </MaterialIconButton>
    );
  }

  if (disabled) {
    return createIconButtonUI();
  }

  return (
    <Tooltip title={tooltip} placement={tooltipPlacement} slots={{ transition: Fade }}>
      {createIconButtonUI()}
    </Tooltip>
  );
}

export const IconButton = IconButtonUI;
