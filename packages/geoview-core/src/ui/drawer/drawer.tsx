import { useContext, useEffect, useState } from 'react';

import { useTranslation } from 'react-i18next';

import { Drawer as MaterialDrawer, DrawerProps, useTheme, Box } from '@mui/material';

import { api } from '@/app';
import { EVENT_NAMES } from '@/api/events/event-types';

import { IconButton, ChevronLeftIcon, ChevronRightIcon } from '..';
import { MapContext } from '@/core/app-start';
import { PayloadBaseClass, booleanPayload, payloadIsABoolean } from '@/api/events/payloads';
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
  const { variant, status, className, style, children } = props;

  const [open, setOpen] = useState(false);

  const { t } = useTranslation<string>();

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  const mapConfig = useContext(MapContext);

  const { mapId } = mapConfig;

  const openCloseDrawer = (drawerStatus: boolean): void => {
    setOpen(drawerStatus);

    // if app-bar is open then close it
    api.event.emit(booleanPayload(EVENT_NAMES.DRAWER.EVENT_DRAWER_OPEN_CLOSE, mapId, drawerStatus));

    // TODO: this is still needed?
    // if panel is open then close it
    // if (panelOpen) openClosePanel(false);
    // use an event to close the panel instead of calling a function
  };

  const drawerOpenCloseListenerFunction = (payload: PayloadBaseClass) => {
    if (payloadIsABoolean(payload)) setOpen(payload.status);
  };

  useEffect(() => {
    // set status from props if passed in
    if (status !== undefined) {
      setOpen(status);
    }

    // listen to drawer open/close events
    api.event.on(EVENT_NAMES.DRAWER.EVENT_DRAWER_OPEN_CLOSE, drawerOpenCloseListenerFunction, mapId);

    return () => {
      api.event.off(EVENT_NAMES.DRAWER.EVENT_DRAWER_OPEN_CLOSE, mapId);
    };
  }, [mapId, status]);

  return (
    <MaterialDrawer
      variant={variant || 'permanent'}
      sx={open ? sxClasses.drawerOpen : sxClasses.drawerClose}
      classes={{
        paper: className,
      }}
      style={style || undefined}
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
