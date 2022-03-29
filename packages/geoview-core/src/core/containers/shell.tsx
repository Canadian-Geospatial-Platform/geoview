import { useEffect, useState, useCallback } from 'react';

import { useTranslation } from 'react-i18next';

import FocusTrap from 'focus-trap-react';

import makeStyles from '@mui/styles/makeStyles';

import { Map } from '../components/map/map';
import { Appbar } from '../components/appbar/app-bar';
import { Navbar } from '../components/navbar/nav-bar';

import { FocusTrapDialog } from './focus-trap';
import { TypeMapConfigProps } from '../types/cgpv-types';

import { api } from '../../api/api';
import { EVENT_NAMES } from '../../api/event';

import { CircularProgress, Modal } from '../../ui';

const useStyles = makeStyles((theme) => {
  return {
    shell: {
      top: theme.spacing(0),
      right: theme.spacing(0),
      left: theme.spacing(0),
      bottom: theme.spacing(0),
      overflow: 'hidden',
      zIndex: 0,
      height: '100%',
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
  id: string;
  config: TypeMapConfigProps;
}

/**
 * Create a shell component to wrap the map and other components not inside the map
 * @param {ShellProps} props the shell properties
 * @returns {JSX.Element} the shell component
 */
export function Shell(props: ShellProps): JSX.Element {
  const { id, config } = props;

  const classes = useStyles();
  const { t } = useTranslation<string>();

  // set the active trap value for FocusTrap and pass the callback to the dialog window
  const [activeTrap, setActivetrap] = useState(false);

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
    api.event.on(
      EVENT_NAMES.EVENT_MAP_LOADED,
      (payload) => {
        if (payload && payload.handlerName.includes(id)) {
          // even if the map loads some layers (basemap) are not finish rendering. Same for north arrow
          setIsLoaded(true);
        }
      },
      id
    );

    // CHANGED
    api.event.on(
      EVENT_NAMES.EVENT_MODAL_CREATE,
      (payload) => {
        if (payload.handlerName === id) {
          updateShell();
        }
      },
      id
    );

    return () => {
      api.event.off(EVENT_NAMES.EVENT_MAP_LOADED, id);
      api.event.off(EVENT_NAMES.EVENT_MODAL_CREATE, id);
    };
  }, [id, updateShell]);

  return (
    <FocusTrap active={activeTrap} focusTrapOptions={{ escapeDeactivates: false }}>
      <div className={classes.shell}>
        <CircularProgress isLoaded={isLoaded} />
        <a id={`toplink-${id}`} href={`#bottomlink-${id}`} className={classes.skip} style={{ top: '0px' }}>
          {t('keyboardnav.start')}
        </a>
        <Appbar />
        <Navbar />
        <Map
          id={id}
          center={config.center}
          zoom={config.zoom}
          projection={config.projection}
          language={config.language}
          selectBox={config.selectBox}
          boxZoom={config.boxZoom}
          layers={config.layers}
          basemapOptions={config.basemapOptions}
          plugins={config.plugins}
          extraOptions={config.extraOptions}
        />
        {Object.keys(api.map(id).modal.modals).map((modalId) => (
          <Modal key={modalId} id={modalId} open={false} mapId={id} />
        ))}
        <FocusTrapDialog id={id} callback={() => handleCallback(true)} />
        <a id={`bottomlink-${id}`} href={`#toplink-${id}`} className={classes.skip} style={{ bottom: '0px' }}>
          {t('keyboardnav.end')}
        </a>
      </div>
    </FocusTrap>
  );
}
