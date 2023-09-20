/* eslint-disable react/jsx-props-no-spreading */
import { useEffect, useState, useCallback, Fragment } from 'react';

import { useTranslation } from 'react-i18next';

import FocusTrap from 'focus-trap-react';

import makeStyles from '@mui/styles/makeStyles';

import { Map } from '../components/map/map';
import { Appbar } from '../components/app-bar/app-bar';
import { Navbar } from '../components/nav-bar/nav-bar';
import { FooterTabs } from '../components/footer-tabs/footer-tabs';
import { Geolocator } from '../components/geolocator/geolocator';

import { FocusTrapDialog } from './focus-trap';

import { api } from '@/app';
import { EVENT_NAMES } from '@/api/events/event-types';

import { Modal, Snackbar } from '@/ui';
import { PayloadBaseClass, payloadIsAMapComponent, payloadIsAModal } from '@/api/events/payloads';
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

  const mapAddedComponentListenerFunction = (payload: PayloadBaseClass) => {
    if (payloadIsAMapComponent(payload)) {
      setComponents((tempComponents) => ({
        ...tempComponents,
        [payload.mapComponentId]: payload.component!,
      }));
    }
  };

  useEffect(() => {
    // listen to adding a new component events
    api.event.on(EVENT_NAMES.MAP.EVENT_MAP_ADD_COMPONENT, mapAddedComponentListenerFunction, shellId);

    const mapRemoveComponentListenerFunction = (payload: PayloadBaseClass) => {
      if (payloadIsAMapComponent(payload)) {
        const tempComponents: Record<string, JSX.Element> = { ...components };
        delete tempComponents[payload.mapComponentId];

        setComponents(() => ({
          ...tempComponents,
        }));
      }
    };

    // listen to removing a component events
    api.event.on(EVENT_NAMES.MAP.EVENT_MAP_REMOVE_COMPONENT, mapRemoveComponentListenerFunction, shellId);

    const modalCreateListenerFunction = (payload: PayloadBaseClass) => {
      if (payloadIsAModal(payload)) updateShell();
    };

    // CHANGED
    api.event.on(EVENT_NAMES.MODAL.EVENT_MODAL_CREATE, modalCreateListenerFunction, shellId);

    return () => {
      api.event.off(EVENT_NAMES.MAP.EVENT_MAP_ADD_COMPONENT, shellId, mapAddedComponentListenerFunction);
      api.event.off(EVENT_NAMES.MAP.EVENT_MAP_REMOVE_COMPONENT, shellId, mapRemoveComponentListenerFunction);
      api.event.off(EVENT_NAMES.MODAL.EVENT_MODAL_CREATE, shellId, modalCreateListenerFunction);
    };
  }, [components, shellId, updateShell]);

  return (
    <FocusTrap active={activeTrap} focusTrapOptions={{ escapeDeactivates: false }}>
      <div id={`shell-${shellId}`} className={classes.shell}>
        <a id={`toplink-${shellId}`} href={`#bottomlink-${shellId}`} className={classes.skip} style={{ top: '0px' }}>
          {t('keyboardnav.start')}
        </a>
        <div className={`${classes.mapContainer} mapContainer`}>
          <Appbar activeTrap={activeTrap} activeTrapSet={setActivetrap} />
          {/* load geolocator component if config includes in list of components in appBar */}
          {mapFeaturesConfig?.appBar?.includes('geolocator') && mapFeaturesConfig?.map.interaction === 'dynamic' && <Geolocator />}
          <Map {...mapFeaturesConfig} />
          {mapFeaturesConfig?.map.interaction === 'dynamic' && <Navbar activeTrap={activeTrap} activeTrapSet={setActivetrap} />}
        </div>
        {mapFeaturesConfig?.corePackages && mapFeaturesConfig?.corePackages.includes('footer-panel') && <FooterTabs />}
        {Object.keys(api.maps[shellId].modal.modals).map((modalId) => (
          <Modal key={modalId} id={modalId} open={false} mapId={shellId} />
        ))}
        <FocusTrapDialog focusTrapId={shellId} callback={(isActive) => handleCallback(isActive)} />
        <a id={`bottomlink-${shellId}`} href={`#toplink-${shellId}`} className={classes.skip} style={{ bottom: '0px' }}>
          {t('keyboardnav.end')}
        </a>
        {Object.keys(components).map((key: string) => {
          return <Fragment key={key}>{components[key]}</Fragment>;
        })}
        <Snackbar snackBarId={shellId} />
      </div>
    </FocusTrap>
  );
}
