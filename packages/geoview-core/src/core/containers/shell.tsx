import { useEffect, useState, useCallback, Fragment } from 'react';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@mui/material/styles';
import { FocusTrap } from '@mui/base/FocusTrap';

import { Map } from '@/core/components/map/map';
import { Appbar } from '@/core/components/app-bar/app-bar';
import { Navbar } from '@/core/components/nav-bar/nav-bar';
import { FooterBar } from '@/core/components/footer-bar/footer-bar';
import { Geolocator } from '@/core/components/geolocator/geolocator';
import { MapInfo } from '@/core/components/map-info/map-info';

import { api } from '@/app';
import { EVENT_NAMES } from '@/api/events/event-types';
import { Box, CircularProgress, Link, Modal, Snackbar, Button, TypeModalProps } from '@/ui';
import {
  ModalPayload,
  PayloadBaseClass,
  SnackbarMessagePayload,
  SnackbarType,
  mapConfigPayload,
  payloadIsAMapComponent,
  payloadIsAmapFeaturesConfig,
} from '@/api/events/payloads';
import { getShellSxClasses } from './containers-style';
import { useMapInteraction, useMapLoaded } from '@/core/stores/store-interface-and-intial-values/map-state';
import { useAppCircularProgressActive } from '@/core/stores/store-interface-and-intial-values/app-state';
import {
  useUIActiveFocusItem,
  useUIActiveTrapGeoView,
  useUIAppbarComponents,
} from '@/core/stores/store-interface-and-intial-values/ui-state';
import ExportModal from '@/core/components/export/export-modal';
import DataTableModal from '@/core/components/data-table/data-table-modal';
import { useGeoViewConfig, useGeoViewMapId } from '@/core/stores/geoview-store';
import { logger } from '@/core/utils/logger';

import { FocusTrapDialog } from './focus-trap';

/**
 * Create a shell component to wrap the map and other components not inside the map
 * @param {ShellProps} props the shell properties
 * @returns {JSX.Element} the shell component
 */
export function Shell(): JSX.Element {
  const { t } = useTranslation<string>();

  const theme = useTheme();
  const sxClasses = getShellSxClasses(theme);

  // render additional components if added by api
  const [components, setComponents] = useState<Record<string, JSX.Element>>({});
  const [update, setUpdate] = useState<number>(0);
  const [modalProps, setModalProps] = useState<TypeModalProps>();
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  // snackbar state
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarType, setSnackbarType] = useState<SnackbarType>('info');
  const [snackbarButton, setSnackbarButton] = useState<JSX.Element>();

  // get values from the store
  const mapLoaded = useMapLoaded();
  const circularProgressActive = useAppCircularProgressActive();
  const activeTrapGeoView = useUIActiveTrapGeoView();
  const mapId = useGeoViewMapId();
  const interaction = useMapInteraction();
  const appBarComponents = useUIAppbarComponents();
  const geoviewConfig = useGeoViewConfig();
  const focusItem = useUIActiveFocusItem();

  /**
   * Causes the shell to re-render
   */
  const updateShell = useCallback(() => {
    // Log
    logger.logTraceUseCallback('SHELL - updateShell');

    setUpdate((prevState) => {
      return 1 + prevState;
    });
  }, []);

  const mapAddComponentHandler = (payload: PayloadBaseClass) => {
    // Log
    logger.logTraceCoreAPIEvent('SHELL - mapAddComponentHandler', payload);

    if (payloadIsAMapComponent(payload)) {
      setComponents((tempComponents) => ({
        ...tempComponents,
        [payload.mapComponentId]: payload.component!,
      }));
    }
  };

  const snackBarOpenListenerFunction = (payload: SnackbarMessagePayload) => {
    // create button
    const myButton = payload.button?.label ? (
      <Button type="icon" onClick={payload.button.action}>
        {payload.button.label}
      </Button>
    ) : undefined;
    setSnackbarButton(myButton);

    // set message and type
    setSnackbarMessage(payload.message);
    setSnackbarType(payload.snackbarType);

    // show the notification
    setSnackbarOpen(true);
  };

  const snackBarCloseListenerFunction = useCallback((event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  }, []);

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('SHELL - mount', mapId, geoviewConfig, components);

    // listen to adding a new component events
    api.event.on(EVENT_NAMES.MAP.EVENT_MAP_ADD_COMPONENT, mapAddComponentHandler, mapId);

    const mapRemoveComponentHandler = (payload: PayloadBaseClass) => {
      // Log
      logger.logTraceCoreAPIEvent('SHELL - mapRemoveComponentHandler', payload);

      if (payloadIsAMapComponent(payload)) {
        const tempComponents: Record<string, JSX.Element> = { ...components };
        delete tempComponents[payload.mapComponentId];

        setComponents(() => ({
          ...tempComponents,
        }));
      }
    };

    // listen to removing a component events
    api.event.on(EVENT_NAMES.MAP.EVENT_MAP_REMOVE_COMPONENT, mapRemoveComponentHandler, mapId);

    // Reload
    // TODO: use store config when we reload the map
    const mapReloadHandler = (payload: PayloadBaseClass) => {
      // Log
      logger.logTraceCoreAPIEvent('SHELL - mapReloadHandler', payload);

      if (payloadIsAmapFeaturesConfig(payload)) {
        api.event.emit(mapConfigPayload(EVENT_NAMES.MAP.EVENT_MAP_RELOAD, `${mapId}/delete_old_map`, geoviewConfig!));
        updateShell();
      }
    };

    api.event.on(EVENT_NAMES.MAP.EVENT_MAP_RELOAD, mapReloadHandler, mapId);

    // listen to API event when app wants to show message
    api.event.onSnackbarOpen(shellId, snackBarOpenListenerFunction);

    return () => {

    const modalOpenListenerFunction = (payload: ModalPayload) => {
      setModalProps(api.maps[mapId].modal.modals[payload.modalId] as TypeModalProps);
      setModalOpen(true);
    };

    const modalCloseListenerFunction = () => {
      setModalOpen(false);
    };

    // to open the modal
    api.event.onModalOpen(mapId, modalOpenListenerFunction);

    // to close the modal
    api.event.onModalClose(mapId, modalCloseListenerFunction);

    return () => {
      api.event.off(EVENT_NAMES.MAP.EVENT_MAP_ADD_COMPONENT, mapId, mapAddComponentHandler);
      api.event.off(EVENT_NAMES.MAP.EVENT_MAP_REMOVE_COMPONENT, mapId, mapRemoveComponentHandler);
      api.event.off(EVENT_NAMES.MAP.EVENT_MAP_RELOAD, mapId, mapReloadHandler);
      api.event.offModalOpen(mapId, modalOpenListenerFunction);
      api.event.offModalClose(mapId, modalCloseListenerFunction);
      api.event.offSnackbarOpen(shellId, snackBarOpenListenerFunction);
    };
  }, [components, mapId, geoviewConfig, updateShell]);

  return (
    <Box sx={sxClasses.all}>
      <Link id={`toplink-${mapId}`} href={`#bottomlink-${mapId}`} tabIndex={0} sx={[sxClasses.skip, { top: '0px' }]}>
        {t('keyboardnav.start')}
      </Link>
      <FocusTrap open={activeTrapGeoView}>
        <Box id={`shell-${mapId}`} sx={sxClasses.shell} className="geoview-shell" key={update} tabIndex={-1}>
          <CircularProgress isLoaded={mapLoaded} />
          <CircularProgress isLoaded={!circularProgressActive} />
          <Box id={`map-${mapId}`} sx={sxClasses.mapShellContainer} className="mapContainer">
            <Appbar />
            {/* load geolocator component if config includes in list of components in appBar */}
            {appBarComponents.includes('geolocator') && interaction === 'dynamic' && <Geolocator />}
            <Box sx={sxClasses.mapContainer}>
              <Map />
              <MapInfo />
            </Box>
            {interaction === 'dynamic' && <Navbar />}
          </Box>
          {geoviewConfig!.footerBar !== undefined && <FooterBar />}
          {Object.keys(api.maps[mapId].modal.modals).map((modalId) => (
            <Modal key={modalId} modalId={modalId} open={modalOpen} modalProps={modalProps} />
          ))}
          {/* modal section start */}
          <FocusTrapDialog mapId={mapId} focusTrapId={mapId} />
          <ExportModal />
          {focusItem.activeElementId === 'layerDatatable' && <DataTableModal />}
          {/* modal section end */}
          {Object.keys(components).map((key: string) => {
            return <Fragment key={key}>{components[key]}</Fragment>;
          })}
          <Snackbar
            snackBarId={mapId}
            message={snackbarMessage}
            open={snackbarOpen}
            type={snackbarType}
            button={snackbarButton}
            onClose={snackBarCloseListenerFunction}
          />
        </Box>
      </FocusTrap>
      <Link id={`bottomlink-${mapId}`} href={`#toplink-${mapId}`} tabIndex={0} sx={[sxClasses.skip, { bottom: '0px' }]}>
        {t('keyboardnav.end')}
      </Link>
    </Box>
  );
}
