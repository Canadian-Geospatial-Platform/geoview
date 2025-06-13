import { forwardRef, Ref, useCallback } from 'react';
import { useTheme } from '@mui/material/styles';
import { Button as MaterialButton, Tooltip, useMediaQuery } from '@mui/material';

import { TypeButtonProps } from '@/ui/panel/panel-types';
import { logger } from '@/core/utils/logger';

export type ButtonProps = {
  makeResponsive?: boolean;
} & TypeButtonProps;

/**
 * A customized Material-UI Button component with tooltip and responsive support.
 *
 * @component
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
 * @param {ButtonProps} props - The properties for the Button component
 * @param {Ref<HTMLButtonElement>} ref - The ref forwarded to the underlying MaterialButton
 * @returns {JSX.Element} A rendered Button component
 *
 * @note For performance optimization in cases of frequent parent re-renders,
 * consider wrapping this component with React.memo at the consumption level.
 *
 * @see {@link https://mui.com/material-ui/api/button/}
 */
function ButtonUI(props: ButtonProps, ref: Ref<HTMLButtonElement>): JSX.Element {
  logger.logTraceRenderDetailed('ui/button/button');

  // Get constant from props
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
  } = props;

  // Hooks
  const theme = useTheme();
  const mobileView = useMediaQuery(theme.breakpoints.down('md'));

  // Memoize click handler
  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      logger.logTraceUseCallback('UI.BUTTON - click');

      if (!disabled && onClick) {
        onClick(event);
      }
    },
    [disabled, onClick]
  );

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

  return (
    <Tooltip title={tooltip} placement={tooltipPlacement}>
      {createButtonUI()}
    </Tooltip>
  );
}

// Export the Button  using forwardRef so that passing ref is permitted and functional in the react standards
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(ButtonUI);
