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
export function Button(props: ButtonProps): JSX.Element {
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
  } = props;

  const { t } = useTranslation<string>();

  const theme = useTheme();
  const mobileView = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Tooltip title={t(tooltip || '')} placement={tooltipPlacement || 'bottom'} TransitionComponent={Fade}>
      <MaterialButton
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
      >
        {!(makeResponsive && mobileView) ? children : null}
      </MaterialButton>
    </Tooltip>
  );
}
