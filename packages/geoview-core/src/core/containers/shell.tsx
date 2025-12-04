import { useEffect, useState, useCallback, Fragment, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@mui/material/styles';
import { FocusTrap } from '@mui/base/FocusTrap';

import { Map } from '@/core/components/map/map';
import { AppBar } from '@/core/components/app-bar/app-bar';
import { NavBar } from '@/core/components/nav-bar/nav-bar';
import { FooterBar } from '@/core/components/footer-bar/footer-bar';
import { MapInfo } from '@/core/components/map-info/map-info';

import type { TypeModalProps, ModalApi, ModalEvent } from '@/ui';
import { Box, CircularProgress, Link, Modal, Snackbar, Button } from '@/ui';
import { getShellSxClasses } from './containers-style';
import { useMapInteraction, useMapLoaded } from '@/core/stores/store-interface-and-intial-values/map-state';
import {
  useAppCircularProgressActive,
  useAppFullscreenActive,
  useAppGeoviewHTMLElement,
  useAppHeight,
  useAppStoreActions,
} from '@/core/stores/store-interface-and-intial-values/app-state';
import {
  useUIActiveFocusItem,
  useUIActiveTrapGeoView,
  useUIFooterPanelResizeValue,
  useUIFooterBarIsCollapsed,
} from '@/core/stores/store-interface-and-intial-values/ui-state';
import ExportModal from '@/core/components/export/export-modal';
import DataTableModal from '@/core/components/data-table/data-table-modal';
import FeatureDetailModal from '@/core/components/details/feature-detail-modal';
import { useGeoViewConfig } from '@/core/stores/geoview-store';
import { logger } from '@/core/utils/logger';
import type { MapViewer, MapComponentAddedEvent, MapComponentRemovedEvent } from '@/geo/map/map-viewer';

import { FocusTrapDialog } from './focus-trap';
import type { Notifications, SnackBarOpenEvent, SnackbarType } from '@/core/utils/notifications';
import { useMapResize } from './use-map-resize';
import { delay, scrollIfNotVisible } from '@/core/utils/utilities';

type ShellProps = {
  mapViewer: MapViewer;
};

/** The length of time to display the snackbar message before closing it */
const DEFAULT_SNACKBAR_DISPLAY_TIME = 5 * 1000; // 5 seconds

/** The length of time to display the snackbar message if there are more messages in the queue */
const QUEUED_SNACKBAR_DISPLAY_TIME = 3 * 1000; // 3 seconds

/**
 * Create a shell component to wrap the map and other components not inside the map
 * @param {ShellProps} props the shell properties
 * @returns {JSX.Element} the shell component
 */
export function Shell(props: ShellProps): JSX.Element {
  // Log
  logger.logTraceRender('core/containers/shell');

  // Get const props
  const { mapViewer } = props;
  const { mapId } = mapViewer;

  // Hooks
  const { t } = useTranslation<string>();
  const theme = useTheme();
  const shellRef = useRef<HTMLDivElement>();

  // State render additional components if added by api
  const [components, setComponents] = useState<Record<string, JSX.Element>>({});
  const [modalProps, setModalProps] = useState<TypeModalProps>();
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  // State snackbar
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarType, setSnackbarType] = useState<SnackbarType>('info');
  const [snackbarButton, setSnackbarButton] = useState<JSX.Element>();

  // Store
  const mapLoaded = useMapLoaded();
  const circularProgressActive = useAppCircularProgressActive();
  const activeTrapGeoView = useUIActiveTrapGeoView();
  const interaction = useMapInteraction();
  const geoviewConfig = useGeoViewConfig();
  const focusItem = useUIActiveFocusItem();
  const isMapFullScreen = useAppFullscreenActive();
  const footerPanelResizeValue = useUIFooterPanelResizeValue();
  const isFooterBarCollapsed = useUIFooterBarIsCollapsed();
  const geoviewElement = useAppGeoviewHTMLElement();
  const appHeight = useAppHeight();
  const footerTabContainer = geoviewElement.querySelector(`[id^="${mapId}-tabsContainer"]`) as HTMLElement;
  const { setCrosshairActive } = useAppStoreActions();

  // SxClasses
  const sxClasses = useMemo(() => getShellSxClasses(theme, appHeight), [theme, appHeight]);

  // Ref for container height
  const { mapShellContainerRef } = useMapResize({
    isMapFullScreen,
    isFooterBarCollapsed,
    footerPanelResizeValue,
    isFooterBar: !!geoviewConfig?.footerBar,
    geoviewElement,
    footerTabContainer,
    appHeight,
  });

  // #region HANDLERS

  /**
   * Handles when a component is being added to the map
   * @param {MapComponentPayload} payload The map component being added
   */
  const handleMapAddComponent = useCallback((sender: MapViewer, event: MapComponentAddedEvent): void => {
    // Log
    logger.logTraceUseCallback('SHELL - handleMapAddComponent');

    setComponents((tempComponents) => ({
      ...tempComponents,
      [event.mapComponentId]: event.component,
    }));
  }, []);

  /**
   * Handles when a component is being removed from the map
   * @param {MapComponentPayload} payload The map component being removed (component is empty, only mapComponentId is set)
   */
  const handleMapRemoveComponent = useCallback(
    (sender: MapViewer, event: MapComponentRemovedEvent) => {
      // Log
      logger.logTraceUseCallback('SHELL - handleMapRemoveComponent');

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
      // Log
      logger.logTraceUseCallback('SHELL - handleModalOpen', event.modalId);

      setModalProps(mapViewer.modal.modals[event.modalId]);
      setModalOpen(true);
    },
    [mapViewer]
  );

  /**
   * Handles when the modal needs to close (only 1 at a time is allowed)
   */
  const handleModalClose = useCallback((sender: ModalApi, event: ModalEvent): void => {
    // Log
    logger.logTraceUseCallback('SHELL - handleModalClose', event.modalId);

    setModalOpen(false);
  }, []);

  /**
   * Handles when a SnackBar needs to open
   * @param {SnackBarOpenEvent} payload The snackbar information to open
   */
  const handleSnackBarOpen = useCallback(
    (sender: Notifications, payload: SnackBarOpenEvent): void => {
      // Log
      logger.logTraceUseCallback('SHELL - handleSnackBarOpen', payload);

      // Create button
      const myButton = payload.button?.label ? (
        <Button type="icon" onClick={payload.button.action}>
          {payload.button.label}
        </Button>
      ) : undefined;
      setSnackbarButton(myButton);

      // Set message and type
      setSnackbarMessage(payload.message);
      setSnackbarType(payload.snackbarType);

      // Show the snackbar
      setSnackbarOpen(true);

      // Close snackbar after delay
      delay(mapViewer.notifications.snackbarMessageQueue.length > 1 ? QUEUED_SNACKBAR_DISPLAY_TIME : DEFAULT_SNACKBAR_DISPLAY_TIME).then(
        () => {
          if (snackbarOpen) {
            setSnackbarOpen(false);

            // Remove displayed message from queue
            mapViewer.notifications.snackbarMessageQueue.shift();

            // Display next message in queue
            mapViewer.notifications.displayNextSnackbarMessage();
          }
        },
        (error: unknown) => {
          logger.logPromiseFailed('Error with delay in snackbar message', error);
        }
      );
    },
    [mapViewer.notifications, snackbarOpen]
  );

  /**
   * Handles when a SnackBar needs to close
   * @param {React.SyntheticEvent | Event} event The event associated with the closing of the snackbar
   * @param {string} reason The reason for closing
   */
  const handleSnackBarClose = useCallback(
    (event?: React.SyntheticEvent | Event, reason?: string) => {
      // Log
      logger.logTraceUseCallback('SHELL - handleSnackBarClose', reason);

      // Remove displayed message from queue
      mapViewer.notifications.snackbarMessageQueue.shift();
      if (reason === 'clickaway') {
        // Display next message in queue
        mapViewer.notifications.displayNextSnackbarMessage();
        return;
      }

      // Hide the snackbar
      setSnackbarOpen(false);

      // Display next message in queue
      mapViewer.notifications.displayNextSnackbarMessage();
    },
    [mapViewer.notifications]
  );

  // #endregion HANDLERS

  /**
   * Scrolls the map into view when clicking on the map info area
   * Uses smooth scrolling when available, or instant scrolling for users who prefer reduced motion
   * This improves accessibility by allowing users to easily return focus to the map
   */
  const handleScrollShellIntoView = useCallback((): void => {
    // Log
    logger.logTraceUseCallback('SHELL - scrollIntoViewListener');

    if (!shellRef.current) return;

    // Check if the map is already in view, then scroll if needed
    scrollIfNotVisible(shellRef.current.children[0] as HTMLElement, 'start');
  }, []);

  /**
   * Handles skip link navigation by focusing the target element
   * @param {string} targetId - The ID of the element to focus
   */
  const handleSkipLinkClick = useCallback((targetId: string) => {
    // Log
    logger.logTraceUseCallback('SHELL - handleSkipLinkClick', targetId);

    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      targetElement.focus();
    }
  }, []);

  /**
   * Handles the skip to main content by focusing the map container element so keyboard users can quickly access the map,
   * and activates the crosshair for visual feedback.
   */
  const handleSkipToMainContent = useCallback(() => {
    // Log
    logger.logTraceUseCallback('SHELL - handleSkipToMainContent');

    // Focus the map and set crosshair
    setCrosshairActive(true);
    document.getElementById(`mapTargetElement-${mapId}`)?.focus();
  }, [mapId, setCrosshairActive]);

  // Mount component
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
  }, [mapViewer, handleMapRemoveComponent, handleModalOpen, handleSnackBarOpen, handleModalClose, handleMapAddComponent]);

  return (
    <Box sx={sxClasses.all}>
      <Link
        id={`toplink-${mapViewer.mapId}`}
        href={`#bottomlink-${mapViewer.mapId}`}
        tabIndex={0}
        sx={{ ...sxClasses.skip, top: '0px' }}
        onClick={() => handleSkipLinkClick(`bottomlink-${mapViewer.mapId}`)}
      >
        {t('keyboardnav.start')}
      </Link>
      <FocusTrap open={activeTrapGeoView}>
        <Box ref={shellRef} id={`shell-${mapViewer.mapId}`} sx={sxClasses.shell} className="geoview-shell" tabIndex={-1}>
          <CircularProgress isLoaded={mapLoaded} />
          <CircularProgress isLoaded={!circularProgressActive} />
          {interaction === 'dynamic' && (
            <Link
              id={`main-map-${mapViewer.mapId}`}
              href={`#main-map-${mapViewer.mapId}`}
              tabIndex={0}
              sx={{ ...sxClasses.skip, top: '0px' }}
              onClick={(e) => {
                e.preventDefault();
                handleSkipToMainContent();
              }}
            >
              {t('keyboardnav.map')}
            </Link>
          )}

          <Box id={`map-${mapViewer.mapId}`} sx={sxClasses.mapShellContainer} className="mapContainer" ref={mapShellContainerRef}>
            <AppBar api={mapViewer.appBarApi} onScrollShellIntoView={handleScrollShellIntoView} />
            <Box sx={sxClasses.mapContainer}>
              <Map viewer={mapViewer} />
            </Box>
            {interaction === 'dynamic' && <NavBar api={mapViewer.navBarApi} />}
            <MapInfo onScrollShellIntoView={handleScrollShellIntoView} />
            <Snackbar
              snackBarId={mapViewer.mapId}
              message={snackbarMessage}
              open={snackbarOpen}
              type={snackbarType}
              button={snackbarButton}
              onClose={handleSnackBarClose}
            />
          </Box>
          {geoviewConfig?.footerBar && interaction === 'dynamic' && <FooterBar api={mapViewer.footerBarApi} />}
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
          {mapLoaded && <ExportModal />}
          {focusItem.activeElementId === 'layerDataTable' && <DataTableModal />}
          {/* Show Feature Detail Modal when detail icon is clicked in datatable each row */}
          {focusItem.activeElementId === 'featureDetailDataTable' && <FeatureDetailModal />}
          {/* modal section end */}
          {Object.keys(components).map((key: string) => {
            return <Fragment key={key}>{components[key]}</Fragment>;
          })}
        </Box>
      </FocusTrap>
      <Link
        id={`bottomlink-${mapViewer.mapId}`}
        href={`#toplink-${mapViewer.mapId}`}
        tabIndex={0}
        sx={{ ...sxClasses.skip, bottom: '0px' }}
        onClick={() => handleSkipLinkClick(`toplink-${mapViewer.mapId}`)}
      >
        {t('keyboardnav.end')}
      </Link>
    </Box>
  );
}
