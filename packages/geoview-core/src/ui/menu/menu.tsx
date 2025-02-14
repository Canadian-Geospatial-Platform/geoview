import { memo } from 'react';
import { Menu as MaterialMenu, MenuProps } from '@mui/material';
import { logger } from '@/core/utils/logger';

/**
 * Create a customized Material UI Menu component.
 * This is a simple wrapper around MaterialMenu that maintains
 * full compatibility with Material-UI's Menu props.
 *
 * @param {MenuProps} props - All valid Material-UI Menu props
 * @returns {JSX.Element} The Menu component
 */
export const Menu = memo(function Menu(props: MenuProps): JSX.Element {
  logger.logTraceRender('ui/menu/menu');

  // Get constant from props
  const { children } = props;

  return <MaterialMenu {...props}>{children && children}</MaterialMenu>;
});
