import { useEffect, useState, useCallback, Fragment } from 'react';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@mui/material/styles';
import { FocusTrap } from '@mui/base/FocusTrap';

import { Map } from '@/core/components/map/map';
import { AppBar } from '@/core/components/app-bar/app-bar';
import { NavBar } from '@/core/components/nav-bar/nav-bar';
import { FooterBar } from '@/core/components/footer-bar/footer-bar';
import { Geolocator } from '@/core/components/geolocator/geolocator';
import { MapInfo } from '@/core/components/map-info/map-info';

import { Box, CircularProgress, Link, Modal, Snackbar, Button, TypeModalProps, ModalApi, ModalEvent } from '@/ui';
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
import FeatureDetailModal from '@/core/components/details/feature-detail-modal';
import { useGeoViewConfig } from '@/core/stores/geoview-store';
import { logger } from '@/core/utils/logger';
import { MapViewer, MapComponentAddedEvent, MapComponentRemovedEvent } from '@/geo/map/map-viewer';

import { FocusTrapDialog } from './focus-trap';
import { Notifications, SnackBarOpenEvent, SnackbarType } from '@/core/utils/notifications';

type ShellProps = {
  mapViewer: MapViewer;
};

/**
 * Create a shell component to wrap the map and other components not inside the map
 * @param {ShellProps} props the shell properties
 * @returns {JSX.Element} the shell component
 */
export function Shell(props: ShellProps): JSX.Element {
  // Log
  logger.logTraceRender('core/containers/shell');

  const { mapViewer } = props;

  const { t } = useTranslation<string>();

  const theme = useTheme();
  const sxClasses = getShellSxClasses(theme);

  // render additional components if added by api
  const [components, setComponents] = useState<Record<string, JSX.Element>>({});
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
  const interaction = useMapInteraction();
  const appBarComponents = useUIAppbarComponents();
  const geoviewConfig = useGeoViewConfig();
  const focusItem = useUIActiveFocusItem();

  /**
   * Handles when a component is being added to the map
   * @param {MapComponentPayload} payload The map component being added
   */
  const handleMapAddComponent = (sender: MapViewer, event: MapComponentAddedEvent): void => {
    setComponents((tempComponents) => ({
      ...tempComponents,
      [event.mapComponentId]: event.component,
    }));
  };

  /**
   * Handles when a component is being removed from the map
   * @param {MapComponentPayload} payload The map component being removed (component is empty, only mapComponentId is set)
   */
  const handleMapRemoveComponent = useCallback(
    (sender: MapViewer, event: MapComponentRemovedEvent) => {
      const tempComponents: Record<string, JSX.Element> = { ...components };
      delete tempComponents[event.mapComponentId];

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
    (sender: ModalApi, event: ModalEvent) => {
      setModalProps(mapViewer.modal.modals[event.modalId]);
      setModalOpen(true);
    },
    [mapViewer]
  );

  /**
   * Handles when the modal needs to close (only 1 at a time is allowed)
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleModalClose = (sender: ModalApi, event: ModalEvent): void => {
    setModalOpen(false);
  };

  /**
   * Handles when a SnackBar needs to open
   * @param {SnackBarOpenEvent} payload The snackbar information to open
   */
  const handleSnackBarOpen = (sender: Notifications, payload: SnackBarOpenEvent): void => {
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

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('SHELL - mount');

    // listen to Notifications event when app wants to show message
    mapViewer.notifications.onSnackbarOpen(handleSnackBarOpen);

    // to open the modal
    mapViewer.modal.onModalOpened(handleModalOpen);

    // to close the modal
    mapViewer.modal.onModalClosed(handleModalClose);

    // listen to adding a component event
    mapViewer.onMapComponentAdded(handleMapAddComponent);

    // listen to removing a component event
    mapViewer.onMapComponentRemoved(handleMapRemoveComponent);

    return () => {
      mapViewer.offMapComponentRemoved(handleMapRemoveComponent);
      mapViewer.onMapComponentAdded(handleMapAddComponent);
      mapViewer.modal.offModalClosed(handleModalClose);
      mapViewer.modal.offModalOpened(handleModalOpen);
      mapViewer.notifications.offSnackbarOpen(handleSnackBarOpen);
    };
  }, [mapViewer, handleMapRemoveComponent, handleModalOpen]);

  return (
    <Box sx={sxClasses.all}>
      <Link id={`toplink-${mapViewer.mapId}`} href={`#bottomlink-${mapViewer.mapId}`} tabIndex={0} sx={[sxClasses.skip, { top: '0px' }]}>
        {t('keyboardnav.start')}
      </Link>
      <FocusTrap open={activeTrapGeoView}>
        <Box id={`shell-${mapViewer.mapId}`} sx={sxClasses.shell} className="geoview-shell" tabIndex={-1} aria-hidden="true">
          <CircularProgress isLoaded={mapLoaded} />
          <CircularProgress isLoaded={!circularProgressActive} />
          <Box id={`map-${mapViewer.mapId}`} sx={sxClasses.mapShellContainer} className="mapContainer">
            <AppBar api={mapViewer.appBarApi} />
            {/* load geolocator component if config includes in list of components in appBar */}
            {appBarComponents.includes('geolocator') && interaction === 'dynamic' && <Geolocator />}
            <Box sx={sxClasses.mapContainer}>
              <Map viewer={mapViewer} />
              <MapInfo />
            </Box>
            {interaction === 'dynamic' && <NavBar api={mapViewer.navBarApi} />}
          </Box>
          {geoviewConfig!.footerBar !== undefined && <FooterBar api={mapViewer.footerBarApi} />}
          {Object.keys(mapViewer.modal.modals).map((modalId) => (
            <Modal
              key={modalId}
              modalId={modalId}
              open={modalOpen}
              modalProps={modalProps}
              container={document.querySelector(`#${mapViewer.mapId}`) || undefined}
            />
          ))}
          {/* modal section start */}
          <FocusTrapDialog mapId={mapViewer.mapId} focusTrapId={mapViewer.mapId} />
          <ExportModal />
          {focusItem.activeElementId === 'layerDataTable' && <DataTableModal />}
          {/* Show Feature Detail Modal when detail icon is clicked in datatable each row */}
          {focusItem.activeElementId === 'featureDetailDataTable' && <FeatureDetailModal />}
          {/* modal section end */}
          {Object.keys(components).map((key: string) => {
            return <Fragment key={key}>{components[key]}</Fragment>;
          })}
          <Snackbar
            snackBarId={mapViewer.mapId}
            message={snackbarMessage}
            open={snackbarOpen}
            type={snackbarType}
            button={snackbarButton}
            onClose={handleSnackBarClose}
          />
        </Box>
      </FocusTrap>
      <Link id={`bottomlink-${mapViewer.mapId}`} href={`#toplink-${mapViewer.mapId}`} tabIndex={0} sx={[sxClasses.skip, { bottom: '0px' }]}>
        {t('keyboardnav.end')}
      </Link>
    </Box>
  );
}
