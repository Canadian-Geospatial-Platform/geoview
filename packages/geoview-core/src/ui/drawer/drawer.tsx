import { useContext, useEffect, useState } from 'react';

import { useTranslation } from 'react-i18next';

import { Drawer as MaterialDrawer, DrawerProps } from '@mui/material';

import makeStyles from '@mui/styles/makeStyles';

import { api } from '@/app';
import { EVENT_NAMES } from '@/api/events/event-types';

import { IconButton, ChevronLeftIcon, ChevronRightIcon } from '..';
import { MapContext } from '@/core/app-start';
import { PayloadBaseClass, booleanPayload, payloadIsABoolean } from '@/api/events/payloads';

/**
 * Drawer Properties
 */
export interface TypeDrawerProps extends DrawerProps {
  // eslint-disable-next-line react/require-default-props
  status?: boolean;
}

const drawerWidth = 200;
const useStyles = makeStyles((theme) => ({
  drawer: {
    width: drawerWidth,
    flexShrink: 0,
    whiteSpace: 'nowrap',
  },
  drawerOpen: {
    width: drawerWidth,
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    '& $toolbar': {
      justifyContent: 'flex-end',
    },
  },
  drawerClose: {
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    overflowX: 'hidden',
    width: '61px',
    '& $toolbar': {
      justifyContent: 'center',
    },
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing(0, 1),
  },
}));

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

  const classes = useStyles();

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
      className={open ? classes.drawerOpen : classes.drawerClose}
      classes={{
        paper: className || (open ? classes.drawerOpen : classes.drawerClose),
      }}
      style={style || undefined}
    >
      <div className={classes.toolbar}>
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
      </div>
      {children !== undefined && children}
    </MaterialDrawer>
  );
}
