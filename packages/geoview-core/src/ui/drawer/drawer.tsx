import { useContext, useEffect, useState } from 'react';

import { useTranslation } from 'react-i18next';

import makeStyles from '@mui/styles/makeStyles';
import { Drawer as MaterialDrawer } from '@mui/material';

import { api } from '../../app';
import { EVENT_NAMES } from '../../api/event';

import { IconButton, ChevronLeftIcon, ChevronRightIcon } from '..';
import { MapContext } from '../../core/app-start';
import { TypeDrawerProps } from '../../core/types/cgpv-types';

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

  const mapId = mapConfig.id;

  const openCloseDrawer = (drawerStatus: boolean): void => {
    setOpen(drawerStatus);

    // if appbar is open then close it
    api.event.emit(EVENT_NAMES.DRAWER.EVENT_DRAWER_OPEN_CLOSE, mapId, {
      drawerStatus,
    });

    // if panel is open then close it
    // if (panelOpen) openClosePanel(false);
    // use an event to close the panel instead of calling a function
  };

  useEffect(() => {
    // set status from props if passed in
    if (status !== undefined) {
      setOpen(status);
    }

    // listen to drawer open/close events
    api.event.on(
      EVENT_NAMES.DRAWER.EVENT_DRAWER_OPEN_CLOSE,
      (payload) => {
        if (payload && (payload.handlerName as string) === mapId) {
          setOpen(payload.status as boolean);
        }
      },
      mapId
    );

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
          tooltip={open ? t('general.close') : t('general.open')}
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
