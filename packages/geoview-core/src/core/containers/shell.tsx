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
import { Box, CircularProgress, Link, Modal, Snackbar, Button, TypeModalProps } from '@/ui';
import { MapComponentPayload, ModalPayload } from '@/api/events/payloads';
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
import { Notifications, SnackBarOpenDelegate, SnackBarOpenEvent, SnackbarType } from '@/core/utils/notifications';

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

  /**
   * Handles when a component is being added to the map
   * @param {MapComponentPayload} payload The map component being added
   */
  const handleMapAddComponent = (payload: MapComponentPayload) => {
    setComponents((tempComponents) => ({
      ...tempComponents,
      [payload.mapComponentId]: payload.component!,
    }));
  };

  /**
   * Handles when a component is being removed from the map
   * @param {MapComponentPayload} payload The map component being removed (component is empty, only mapComponentId is set)
   */
  const handleMapRemoveComponent = useCallback(
    (payload: MapComponentPayload) => {
      const tempComponents: Record<string, JSX.Element> = { ...components };
      delete tempComponents[payload.mapComponentId];

      setComponents(() => ({
        ...tempComponents,
      }));
    },
    [components]
  );

  /**
   * Handles when a modal needs to open
   * @param {ModalPayload} payload The modal being opened
   */
  const handleModalOpen = useCallback(
    (payload: ModalPayload) => {
      setModalProps(api.maps[mapId].modal.modals[payload.modalId] as TypeModalProps);
      setModalOpen(true);
    },
    [mapId]
  );

  /**
   * Handles when the modal needs to close (only 1 at a time is allowed)
   */
  const handleModalClose = () => {
    setModalOpen(false);
  };

  /**
   * Handles when a SnackBar needs to open
   * @param {SnackBarOpenEvent} payload The snackbar information to open
   */
  const handleSnackBarOpen: SnackBarOpenDelegate = (sender: Notifications, payload: SnackBarOpenEvent) => {
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

    // show the snackbar
    setSnackbarOpen(true);
  };

  /**
   * Handles when a SnackBar needs to close
   * @param {React.SyntheticEvent | Event} event The event associated with the closing of the snackbar
   * @param {string} reason The reason for closing
   */
  const handleSnackBarClose = useCallback((event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    // hide the snackbar
    setSnackbarOpen(false);
  }, []);

  /**
   * Handles when the map needs to reload
   */
  const handleMapReload = useCallback(() => {
    // TODO: use store config when we reload the map
    // Emit a map reload removal
    api.event.emitMapRemove(mapId, geoviewConfig!);

    // Update the Shell
    updateShell();
  }, [geoviewConfig, mapId, updateShell]);

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('SHELL - mount', mapId, geoviewConfig, components);

    // listen to Notifications event when app wants to show message
    api.maps[mapId].notifications.onSnackbarOpen(handleSnackBarOpen);

    // to close the modal
    api.event.onModalClose(mapId, handleModalClose);

    // to open the modal
    api.event.onModalOpen(mapId, handleModalOpen);

    // listen to removing a component events
    api.event.onRemoveComponent(mapId, handleMapRemoveComponent);

    // listen to adding a new component events
    api.event.onCreateComponent(mapId, handleMapAddComponent);

    // listen to map reload
    api.event.onMapReload(mapId, handleMapReload);

    return () => {
      api.event.offMapReload(mapId, handleMapReload);
      api.event.offCreateComponent(mapId, handleMapAddComponent);
      api.event.offRemoveComponent(mapId, handleMapRemoveComponent);
      api.event.offModalOpen(mapId, handleModalOpen);
      api.event.offModalClose(mapId, handleModalClose);
      api.maps[mapId].notifications.offSnackbarOpen(handleSnackBarOpen);
    };
  }, [components, mapId, geoviewConfig, updateShell, handleMapRemoveComponent, handleModalOpen, handleMapReload]);

  return (
    <Box sx={sxClasses.all}>
      <Link id={`toplink-${mapId}`} href={`#bottomlink-${mapId}`} tabIndex={0} sx={[sxClasses.skip, { top: '0px' }]}>
        {t('keyboardnav.start')}
      </Link>
      <FocusTrap open={activeTrapGeoView}>
        <Box id={`shell-${mapId}`} sx={sxClasses.shell} className="geoview-shell" key={update} tabIndex={-1} aria-hidden="true">
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
            <Modal
              key={modalId}
              modalId={modalId}
              open={modalOpen}
              modalProps={modalProps}
              container={document.querySelector(`#${mapId}`) || undefined}
            />
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
            onClose={handleSnackBarClose}
          />
        </Box>
      </FocusTrap>
      <Link id={`bottomlink-${mapId}`} href={`#toplink-${mapId}`} tabIndex={0} sx={[sxClasses.skip, { bottom: '0px' }]}>
        {t('keyboardnav.end')}
      </Link>
    </Box>
  );
}
