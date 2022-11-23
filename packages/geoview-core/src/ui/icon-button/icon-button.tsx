import React from 'react';
import { useTranslation } from 'react-i18next';
import MaterialIconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Fade from '@mui/material/Fade';
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
  } = props;
  const { t } = useTranslation<string>();
  return (
    <Tooltip title={t((tooltip as string) || '') as string} placement={tooltipPlacement} TransitionComponent={Fade}>
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
      >
        {children && children}
      </MaterialIconButton>
    </Tooltip>
  );
}
