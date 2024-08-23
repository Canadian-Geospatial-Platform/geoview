import { forwardRef, Ref } from 'react';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@mui/material/styles';
import { Button as MaterialButton, Fade, Tooltip, useMediaQuery } from '@mui/material';

import { TypeButtonProps } from '@/ui/panel/panel-types';

export type ButtonProps = {
  makeResponsive?: boolean;
} & TypeButtonProps;

/**
 * Create a customized Material UI button
 *
 * @param {ButtonProps} props the properties of the Button UI element
 * @returns {JSX.Element} the new UI element
 */
function MaterialBtn(props: ButtonProps, ref: Ref<HTMLButtonElement>): JSX.Element {
  const {
    id,
    sx,
    variant,
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
    size,
    makeResponsive,
    fullWidth,
    onKeyDown,
    'aria-label': ariaLabel,
  } = props;

  const { t } = useTranslation<string>();

  const theme = useTheme();
  const mobileView = useMediaQuery(theme.breakpoints.down('md'));

  function getMaterialButton(): JSX.Element {
    return (
      <MaterialButton
        fullWidth={fullWidth}
        id={id}
        size={size || 'medium'}
        sx={sx}
        variant={variant || 'text'}
        className={`${className || ''}`}
        onClick={onClick}
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
    return getMaterialButton();
  }
  return (
    <Tooltip title={t((tooltip as string) || '') as string} placement={tooltipPlacement} TransitionComponent={Fade}>
      {getMaterialButton()}
    </Tooltip>
  );
}

// Export the Button  using forwardRef so that passing ref is permitted and functional in the react standards
export const Button = forwardRef(MaterialBtn);
