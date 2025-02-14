import { ReactNode, RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { Fade, IconButton as MaterialIconButton, Tooltip, TooltipProps, IconButtonProps } from '@mui/material';

import { logger } from '@/core/utils/logger';

/**
 * Properties for the icon button
 */
export interface TypeIconButtonProps extends IconButtonProps {
  children?: ReactNode;
  tooltip?: string;
  tooltipPlacement?: TooltipProps['placement'];
  tabIndex?: number;
  iconRef?: RefObject<HTMLButtonElement>;
  visible?: boolean;
}

/**
 * Create a customized Material UI Icon Button
 *
 * @param {TypeIconButtonProps} props the properties passed to the Icon Button element
 * @returns {JSX.Element} the created Icon Button element
 */
export function IconButton(props: TypeIconButtonProps): JSX.Element {
  logger.logTraceRender('ui/icon-button/icon-button');

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

  // Hooks
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
