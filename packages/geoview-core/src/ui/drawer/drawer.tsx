import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@mui/material/styles';
import { Drawer as MaterialDrawer, DrawerProps, Box } from '@mui/material';

import { IconButton, ChevronLeftIcon, ChevronRightIcon } from '@/ui';
import { logger } from '@/core/utils/logger';
import { getSxClasses } from './drawer-style';

/**
 * Drawer Properties
 */
export interface TypeDrawerProps extends DrawerProps {
  // eslint-disable-next-line react/require-default-props
  status?: boolean;
}

/**
 * Create a customized Material UI Drawer
 *
 * @param {TypeDrawerProps} props the properties passed to the Drawer element
 * @returns {JSX.Element} the created Drawer element
 */
export function Drawer(props: TypeDrawerProps): JSX.Element {
  const { variant, status, className, style, children, ...rest } = props;

  const { t } = useTranslation<string>();

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // internal component state
  const [open, setOpen] = useState(false);

  const openCloseDrawer = (drawerStatus: boolean): void => {
    setOpen(drawerStatus);
  };

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('DRAWER - status', status);

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
            openCloseDrawer(!open);
          }}
          size="large"
        >
          {!open ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </IconButton>
      </Box>
      {children !== undefined && children}
    </MaterialDrawer>
  );
}
