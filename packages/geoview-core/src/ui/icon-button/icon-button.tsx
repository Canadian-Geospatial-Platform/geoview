import { useTranslation } from 'react-i18next';

import { Fade, IconButton as MaterialIconButton, Tooltip } from '@mui/material';

import { TypeIconButtonProps } from './icon-button-types';

/**
 * Create a customized Material UI Icon Button
 *
 * @param {TypeIconButtonProps} props the properties passed to the Icon Button element
 * @returns {JSX.Element} the created Icon Button element
 */
export function IconButton(props: TypeIconButtonProps): JSX.Element {
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

  const { t } = useTranslation<string>();

  function getMaterialIconButton(): JSX.Element {
    return (
      <MaterialIconButton
        id={id}
        sx={sx}
        aria-label={(t(ariaLabel as string) || t(tooltip as string)) as string}
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
    return getMaterialIconButton();
  }
  return (
    <Tooltip title={t((tooltip as string) || '') as string} placement={tooltipPlacement} TransitionComponent={Fade}>
      {getMaterialIconButton()}
    </Tooltip>
  );
}
