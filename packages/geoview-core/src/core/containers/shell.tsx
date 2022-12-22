/* eslint-disable react/jsx-props-no-spreading */
import { useEffect, useState, useCallback, Fragment } from 'react';

import { useTranslation } from 'react-i18next';

import FocusTrap from 'focus-trap-react';

import makeStyles from '@mui/styles/makeStyles';

import { SnackbarProvider } from 'notistack';

import { Map } from '../components/map/map';
import { Appbar } from '../components/app-bar/app-bar';
import { Navbar } from '../components/nav-bar/nav-bar';
import { FooterTabs } from '../components/footer-tabs/footer-tabs';

import { FocusTrapDialog } from './focus-trap';

import { api } from '../../app';
import { EVENT_NAMES } from '../../api/events/event-types';

import { CircularProgress, Modal, Snackbar } from '../../ui';
import { payloadIsAMapComponent } from '../../api/events/payloads/map-component-payload';
import { payloadIsAMap } from '../../api/events/payloads/map-payload';
import { payloadIsAModal } from '../../api/events/payloads/modal-payload';
import { TypeMapFeaturesConfig } from '../types/global-types';

const useStyles = makeStyles((theme) => {
  return {
    shell: {
      display: 'flex',
      flexDirection: 'column',
      top: theme.spacing(0),
      right: theme.spacing(0),
      left: theme.spacing(0),
      bottom: theme.spacing(0),
      overflow: 'hidden',
      zIndex: 0,
      height: '100%',
    },
    mapContainer: {
      display: 'flex',
      flexDirection: 'row',
      height: '100%',
      position: 'relative',
    },
    skip: {
      position: 'absolute',
      left: -1000,
      height: 1,
      width: 1,
      textAlign: 'left',
      overflow: 'hidden',
      backgroundColor: '#FFFFFF',

      '&:active, &:focus, &:hover': {
        left: theme.spacing(0),
        zIndex: theme.zIndex.tooltip,
        width: 'auto',
        height: 'auto',
        overflow: 'visible',
      },
    },
    snackBar: {
      '& .MuiButton-text': { color: theme.palette.primary.light },
    },
  };
});

/**
 * Interface for the shell properties
 */
interface ShellProps {
  shellId: string;
  mapFeaturesConfig: TypeMapFeaturesConfig;
}

/**
 * Create a shell component to wrap the map and other components not inside the map
 * @param {ShellProps} props the shell properties
 * @returns {JSX.Element} the shell component
 */
export function Shell(props: ShellProps): JSX.Element {
  const { shellId, mapFeaturesConfig } = props;

  const classes = useStyles();

  const { t } = useTranslation<string>();

  // set the active trap value for FocusTrap and pass the callback to the dialog window
  const [activeTrap, setActivetrap] = useState(false);

  // render additional components if added by api
  const [components, setComponents] = useState<Record<string, JSX.Element>>({});

  const [, setUpdate] = useState<number>(0);

  // show a splash screen before map is loaded
  const [isLoaded, setIsLoaded] = useState(false);

  /**
   * Set the focus trap
   * @param {boolean} dialogTrap the callback value from dialog trap
   */
  function handleCallback(dialogTrap: boolean): void {
    setActivetrap(dialogTrap);
  }

  /**
   * Causes the shell to re-render
   */
  const updateShell = useCallback(() => {
    setUpdate((prevState) => {
      return 1 + prevState;
    });
  }, []);

  useEffect(() => {
    // listen to adding a new component events
    api.event.on(
      EVENT_NAMES.MAP.EVENT_MAP_ADD_COMPONENT,
      (payload) => {
        if (payloadIsAMapComponent(payload)) {
          if (payload.handlerName === shellId)
            setComponents((tempComponents) => ({
              ...tempComponents,
              [payload.mapComponentId]: payload.component!,
            }));
        }
      },
      shellId
    );

    // listen to removing a component events
    api.event.on(
      EVENT_NAMES.MAP.EVENT_MAP_REMOVE_COMPONENT,
      (payload) => {
        if (payloadIsAMapComponent(payload)) {
          if (payload.handlerName === shellId) {
            const tempComponents: Record<string, JSX.Element> = { ...components };
            delete tempComponents[payload.mapComponentId];

            setComponents(() => ({
              ...tempComponents,
            }));
          }
        }
      },
      shellId
    );

    api.event.on(
      EVENT_NAMES.MAP.EVENT_MAP_LOADED,
      (payload) => {
        if (payloadIsAMap(payload)) {
          if (payload.handlerName!.includes(shellId)) {
            // even if the map loads some layers (basemap) are not finish rendering. Same for north arrow
            setIsLoaded(true);
          }
        }
      },
      shellId
    );

    // CHANGED
    api.event.on(
      EVENT_NAMES.MODAL.EVENT_MODAL_CREATE,
      (payload) => {
        if (payloadIsAModal(payload)) {
          if (payload.handlerName === shellId) {
            updateShell();
          }
        }
      },
      shellId
    );

    return () => {
      api.event.off(EVENT_NAMES.MAP.EVENT_MAP_ADD_COMPONENT, shellId);
      api.event.off(EVENT_NAMES.MAP.EVENT_MAP_REMOVE_COMPONENT, shellId);
      api.event.off(EVENT_NAMES.MAP.EVENT_MAP_LOADED, shellId);
      api.event.off(EVENT_NAMES.MODAL.EVENT_MODAL_CREATE, shellId);
    };
  }, [components, shellId, updateShell]);

  return (
    <FocusTrap active={activeTrap} focusTrapOptions={{ escapeDeactivates: false }}>
      <div id={`shell-${shellId}`} className={classes.shell}>
        <CircularProgress isLoaded={isLoaded} />
        <a id={`toplink-${shellId}`} href={`#bottomlink-${shellId}`} className={classes.skip} style={{ top: '0px' }}>
          {t('keyboardnav.start')}
        </a>
        <div className={classes.mapContainer}>
          {mapFeaturesConfig.components !== undefined && mapFeaturesConfig.components.indexOf('app-bar') > -1 && <Appbar />}
          <Map {...mapFeaturesConfig} />
          {mapFeaturesConfig.components !== undefined && mapFeaturesConfig.components.indexOf('nav-bar') > -1 && <Navbar />}
        </div>
        <FooterTabs />
        {Object.keys(api.map(shellId).modal.modals).map((modalId) => (
          <Modal key={modalId} id={modalId} open={false} mapId={shellId} />
        ))}
        <FocusTrapDialog focusTrapId={shellId} callback={(isActive) => handleCallback(isActive)} />
        <a id={`bottomlink-${shellId}`} href={`#toplink-${shellId}`} className={classes.skip} style={{ bottom: '0px' }}>
          {t('keyboardnav.end')}
        </a>
        {Object.keys(components).map((key: string) => {
          return <Fragment key={key}>{components[key]}</Fragment>;
        })}
        <SnackbarProvider
          maxSnack={3}
          dense
          autoHideDuration={5000}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'center',
          }}
          className={`${classes.snackBar}`}
        >
          <Snackbar snackBarId={shellId} />
        </SnackbarProvider>
      </div>
    </FocusTrap>
  );
}
