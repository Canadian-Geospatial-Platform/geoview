import { useTranslation } from 'react-i18next';

import { useTheme } from '@mui/material/styles';
import { Button as MaterialButton, Fade, Tooltip } from '@mui/material';

import { TypeButtonProps } from '@/ui/panel/panel-types';
import { getSxClasses } from './button-style';

/**
 * Create a customized Material UI button
 *
 * @param {TypeButtonProps} props the properties of the Button UI element
 * @returns {JSX.Element} the new UI element
 */
export function Button(props: TypeButtonProps): JSX.Element {
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
  } = props;

  const { t } = useTranslation<string>();

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  const sxProps = {
    ...(theme.palette.mode === 'light' && {
      backgroundColor: 'primary.light',
      color: 'primary.dark',
      '&:hover': { backgroundColor: 'primary.main', color: 'white' },
    }),
    ...sx,
  };

  return (
    <Tooltip title={t(tooltip || '')} placement={tooltipPlacement || 'bottom'} TransitionComponent={Fade}>
      <MaterialButton
        id={id}
        sx={{ ...sxClasses.buttonClass, ...sxProps }}
        variant={variant || 'text'}
        className={`${className || ''}`}
        onClick={onClick}
        autoFocus={autoFocus}
        disabled={disabled}
        disableRipple={disableRipple}
        startIcon={startIcon}
        endIcon={endIcon}
      >
        {children}
      </MaterialButton>
    </Tooltip>
  );
}
