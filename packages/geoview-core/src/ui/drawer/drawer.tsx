import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@mui/material/styles';
import { Drawer as MaterialDrawer, DrawerProps, Box } from '@mui/material';

import { IconButton } from '@/ui/icon-button/icon-button';
import { ChevronLeftIcon, ChevronRightIcon } from '@/ui/icons/index';
import { getSxClasses } from '@/ui/drawer/drawer-style';
import { logger } from '@/core/utils/logger';

/**
 * Drawer Properties
 */
export interface TypeDrawerProps extends DrawerProps {
  status?: boolean;
}

/**
 * Create a customized Material UI Drawer
 *
 * @param {TypeDrawerProps} props the properties passed to the Drawer element
 * @returns {JSX.Element} the created Drawer element
 */
export const Drawer = memo(function Drawer(props: TypeDrawerProps): JSX.Element {
  logger.logTraceRender('ui/drawer/drawer');

  // Get constant from props
  const { variant, status, className, style, children, ...rest } = props;

  // Hooks
  const { t } = useTranslation<string>();
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);

  // State
  const [open, setOpen] = useState(false);

  // Memoize toggle handler
  const handleDrawerToggle = useCallback((drawerStatus: boolean): void => {
    logger.logTraceUseCallback('UI.DRAWER - handleDrawerToggle', drawerStatus);

    setOpen(drawerStatus);
  }, []);

  // Update open state when status prop changes
  useEffect(() => {
    logger.logTraceUseEffect('UI.DRAWER - status', status);

    // set status from props if passed in
    if (status !== undefined) {
      setOpen(status);
    }
  }, [status]);

  return (
    <MaterialDrawer
      variant={variant || 'permanent'}
      sx={open ? sxClasses.drawerOpen : sxClasses.drawerClose}
      classes={{
        paper: className,
      }}
      style={style || undefined}
      {...rest}
    >
      <Box sx={sxClasses.toolbar}>
        <IconButton
          tooltip={open ? t('general.close')! : t('general.open')!}
          tooltipPlacement="right"
          onClick={() => {
            handleDrawerToggle(!open);
          }}
          size="large"
        >
          {!open ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </IconButton>
      </Box>
      {children !== undefined && children}
    </MaterialDrawer>
  );
});
