import { memo } from 'react';
import { MenuItem as MaterialMenuItem, MenuItemProps } from '@mui/material';
import { logger } from '@/core/utils/logger';

/**
 * Create a customized Material UI Menu Item component.
 * This is a simple wrapper around MaterialMenuItem that maintains
 * full compatibility with Material-UI's Menu Item props.
 *
 * @param {MenuItemProps} props - All valid Material-UI Menu Item props
 * @returns {JSX.Element} The Menu Item component
 */
export const MenuItem = memo(function MenuItem(props: MenuItemProps): JSX.Element {
  logger.logTraceRender('ui/menu/menu-item');

  // Get constant from props
  const { children } = props;

  return <MaterialMenuItem {...props}>{children && children}</MaterialMenuItem>;
});
