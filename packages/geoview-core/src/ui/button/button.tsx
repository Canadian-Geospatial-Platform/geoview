import type { Ref } from 'react';
import { forwardRef, useCallback } from 'react';

import { useTheme } from '@mui/material/styles';
import { Button as MaterialButton, Tooltip, useMediaQuery } from '@mui/material';

import type { TypeButtonProps } from '@/ui/panel/panel-types';
import { logger } from '@/core/utils/logger';

export type ButtonProps = {
  makeResponsive?: boolean;
} & TypeButtonProps;

/**
 * Material-UI Button component with optional tooltip and responsive support.
 *
 * Wraps Material-UI's Button to provide flexible action trigger with optional
 * tooltip display and responsive behavior configuration. Supports all Material-UI
 * Button props in addition to custom `makeResponsive` and tooltip properties.
 *
 * @param props - Button configuration (see ButtonProps interface)
 * @param ref - Reference forwarded to underlying Material-UI Button
 * @returns Button component with optional tooltip overlay on hover
 * @example
 * ```tsx
 * // Basic usage
 * <Button>
 *   Click Me
 * </Button>
 *
 * // With tooltip and icon
 * <Button
 *   tooltip="Add item"
 *   tooltipPlacement="left"
 *   startIcon={<AddIcon />}
 * >
 *   Add
 * </Button>
 *
 * // Responsive button with variant, function and translation
 * <Button
 *    makeResponsive
 *    type="text"
 *    disabled={!legendLayers.length}
 *    size="small"
 *    tooltip={t('legend.sortLayers')!}
 *    variant={displayState === 'order' ? 'contained' : 'outlined'}
 *    startIcon={<HandleIcon fontSize={theme.palette.geoViewFontSize.sm} />}
 *    onClick={() => handleSetDisplayState('order')}
 * >
 *    {t('legend.sort')}
 * </Button>
 * ```
 *
 * @see {@link https://mui.com/material-ui/react-button/}
 */
function ButtonUI(props: ButtonProps, ref: Ref<HTMLButtonElement>): JSX.Element {
  logger.logTraceRenderDetailed('ui/button/button');

  // Get constant from props
  // Add commonly used aria attributes for WCAG compliance
  const {
    id,
    sx,
    variant = 'text',
    tooltip,
    tooltipPlacement,
    onClick,
    className,
    children,
    autoFocus,
    disabled,
    disableRipple = false,
    startIcon,
    endIcon,
    size = 'medium',
    makeResponsive,
    fullWidth,
    onKeyDown,
    'aria-label': ariaLabel,
    'aria-pressed': ariaPressed,
    'aria-expanded': ariaExpanded,
    'aria-checked': ariaChecked,
    'aria-controls': ariaControls,
    'aria-haspopup': ariaHaspopup,
    'aria-hidden': ariaHidden,
  } = props;

  // Hooks
  const theme = useTheme();
  const mobileView = useMediaQuery(theme.breakpoints.down('md'));

  // #region Handlers

  /**
   * Handles when the user clicks on the button
   */
  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      if (!disabled && onClick) {
        onClick(event);
      }
    },
    [disabled, onClick]
  );

  // #endregion

  function createButtonUI(): JSX.Element {
    return (
      <MaterialButton
        fullWidth={fullWidth}
        id={id}
        size={size}
        sx={sx}
        variant={variant || 'text'}
        className={className}
        onClick={handleClick}
        autoFocus={autoFocus}
        disabled={disabled}
        disableRipple={disableRipple}
        startIcon={startIcon}
        endIcon={endIcon}
        aria-label={ariaLabel}
        aria-pressed={ariaPressed}
        aria-expanded={ariaExpanded}
        aria-checked={ariaChecked}
        aria-controls={ariaControls}
        aria-haspopup={ariaHaspopup}
        aria-hidden={ariaHidden}
        {...(onKeyDown && { onKeyDown })}
        ref={ref}
      >
        {!(makeResponsive && mobileView) ? children : null}
      </MaterialButton>
    );
  }

  if (disabled) {
    return createButtonUI();
  }

  // Determine if tooltip should be shown
  const shouldShowTooltip = tooltip && (!makeResponsive || (makeResponsive && mobileView));

  if (disabled || !shouldShowTooltip) {
    return createButtonUI();
  }

  return (
    <Tooltip title={tooltip} placement={tooltipPlacement}>
      {createButtonUI()}
    </Tooltip>
  );
}

// Export the Button using forwardRef so that passing ref is permitted and functional in the react standards
// TODO: This (forwardRef) prevents TypeDoc from documenting the 'Button' component as expected...
// TODO: IconButton uses a custom prop ('iconRef') to work around this issue...
// TODO: Investigate if similar approach could work here.
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(ButtonUI);
