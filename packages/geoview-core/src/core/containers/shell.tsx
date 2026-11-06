import { useEffect, useState, useCallback, Fragment, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@mui/material/styles';
import FocusTrap from '@mui/material/Unstable_TrapFocus';

import { Map } from '@/core/components/map/map';
import { AppBar } from '@/core/components/app-bar/app-bar';
import { NavBar } from '@/core/components/nav-bar/nav-bar';
import { FooterBar } from '@/core/components/footer-bar/footer-bar';
import { MapInfo } from '@/core/components/map-info/map-info';
import { MAP_SECTION_SCROLL_GAP_PX, TIMEOUT } from '@/core/utils/constant';

import { Box, Link } from '@/ui/layout';
import { CircularProgress } from '@/ui/circular-progress/circular-progress';
import { Modal, type TypeModalProps } from '@/ui/modal/modal';
import type { ModalApi, ModalEvent } from '@/ui/modal/modal-api';
import { Snackbar } from '@/ui/snackbar/snackbar';
import { Typography } from '@/ui/typography/typography';
import { getShellSxClasses } from './containers-style';
import { useUIController } from '@/core/controllers/use-controllers';
import { useStoreMapInteraction, useStoreMapLoaded } from '@/core/stores/states/map-state';
import { useStoreAppIsCircularProgressActive, useStoreAppIsFullscreenActive, useStoreAppHeight } from '@/core/stores/states/app-state';
import {
  useStoreUIActiveFocusItem,
  useStoreUIActiveTrapGeoView,
  useStoreUIFocusRestoreRequest,
  useStoreUIFooterPanelResizeValue,
  useStoreUIActiveFooterBarTab,
} from '@/core/stores/states/ui-state';
import { ExportModal } from '@/core/components/export/export-modal';
import DataTableModal from '@/core/components/data-table/data-table-modal';
import FeatureDetailModal from '@/core/components/details/feature-detail-modal';
import { useStoreGeoViewConfig } from '@/core/stores/geoview-store';
import { logger } from '@/core/utils/logger';
import type { MapViewer, MapComponentAddedEvent, MapComponentRemovedEvent } from '@/geo/map/map-viewer';

import { FocusTrapDialog } from './focus-trap';
import { ShellContainerContext } from '@/core/containers/shell-container-context';
import type { Notifications, SnackBarOpenEvent, SnackbarType } from '@/core/utils/notifications';
import { useMapResize } from './use-map-resize';
import { useEffectHostResizeSync } from './use-effect-host-resize-sync';
import { delay } from '@/core/utils/utilities';
import { DomHelper } from '@/core/utils/dom-helper';
import type { SxStyles } from '@/ui/style/types';
import { visuallyHidden } from '@/ui/style/default';

/** The properties for the shell component. */
type ShellProps = {
  /** The map viewer instance. */
  mapViewer: MapViewer;
};

/** The length of time to display the snackbar message before closing it. */
const DEFAULT_SNACKBAR_DISPLAY_TIME = 5 * 1000; // 5 seconds

/** The length of time to display the snackbar message if there are more messages in the queue. */
const QUEUED_SNACKBAR_DISPLAY_TIME = 3 * 1000; // 3 seconds

/**
 * Creates a shell component to wrap the map and other components not inside the map.
 *
 * @param props - The shell properties
 * @returns The shell component
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
  const shellRef = useRef<HTMLDivElement>(null);
  const [shellElement, setShellElement] = useState<HTMLElement | undefined>();
  const keyboardNavigationModeActionRef = useRef<((active: boolean) => void) | undefined>(undefined);

  // State render additional components if added by api
  const [components, setComponents] = useState<Record<string, JSX.Element>>({});
  const [modalProps, setModalProps] = useState<TypeModalProps>();
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  // State snackbar
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarType, setSnackbarType] = useState<SnackbarType>('info');

  // State for transient status announcements
  const [mapLoadedAnnouncement, setMapLoadedAnnouncement] = useState<string>('');
  const [processingCompleteAnnouncement, setProcessingCompleteAnnouncement] = useState<string>('');

  // Store
  const mapLoaded = useStoreMapLoaded();
  const circularProgressActive = useStoreAppIsCircularProgressActive();
  const activeTrapGeoView = useStoreUIActiveTrapGeoView();
  const interaction = useStoreMapInteraction();
  const geoviewConfig = useStoreGeoViewConfig();
  const focusItem = useStoreUIActiveFocusItem();
  const focusRestoreRequest = useStoreUIFocusRestoreRequest();
  const isMapFullScreen = useStoreAppIsFullscreenActive();
  const footerPanelResizeValue = useStoreUIFooterPanelResizeValue();
  const { isOpen } = useStoreUIActiveFooterBarTab();
  const appHeight = useStoreAppHeight();
  const uiController = useUIController();
  const isFooterBar = !!geoviewConfig?.footerBar && interaction === 'dynamic';

  /**
   * Registers the FocusTrapDialog-owned keyboard-navigation lifecycle action.
   *
   * @param action - The action that performs a coordinated mode transition
   * @returns A cleanup callback that removes the action when the dialog unmounts
   */
  const registerModeAction = useCallback((action: (active: boolean) => void): (() => void) => {
    keyboardNavigationModeActionRef.current = action;
    return (): void => {
      if (keyboardNavigationModeActionRef.current === action) keyboardNavigationModeActionRef.current = undefined;
    };
  }, []);

  /**
   * Delegates a Settings switch change to the mode lifecycle owner.
   *
   * @param active - Whether keyboard navigation should be enabled
   */
  const handleKeyboardNavigationModeChange = useCallback((active: boolean): void => {
    const changeMode = keyboardNavigationModeActionRef.current;
    if (!changeMode) {
      logger.logError('Keyboard-navigation mode action is not registered');
      return;
    }
    changeMode(active);
  }, []);

  // TODO: Revisit whether requestAnimationFrame makes setTimeout unnecessary for focus restoration.
  // (RAF ensures that modal transitions, focus trap releases, and DOM updates, are completed before focus restoration takes place)
  /**
   * Restores focus after a controller requests a focus target.
   */
  useEffect(() => {
    logger.logTraceUseEffect('SHELL - restore requested focus', focusRestoreRequest, mapId, uiController);
    if (!focusRestoreRequest) return undefined;

    const requestId = requestAnimationFrame(() => {
      DomHelper.getGVElementByFullId(mapId, focusRestoreRequest.elementId)?.focus({ focusVisible: true });
      uiController.completeFocusRestore(focusRestoreRequest.requestId);
    });
    return (): void => {
      cancelAnimationFrame(requestId);
    };
  }, [focusRestoreRequest, mapId, uiController]);

  const prevMapLoadedRef = useRef<boolean>(mapLoaded);
  const prevCircularProgressActiveRef = useRef<boolean>(circularProgressActive);
  const [collapsedFooterHeight, setCollapsedFooterHeight] = useState<number>(0);

  const gvRootElement = DomHelper.getGVRootElement(mapId);

  /**
   * Computes the style classes for the shell container.
   */
  const memoSxClasses = useMemo((): SxStyles => {
    logger.logTraceUseMemo('SHELL - memoSxClasses', appHeight);
    return getShellSxClasses(theme, appHeight);
  }, [theme, appHeight]);

  // Ref for container height
  const { mapShellContainerRef, hostOriginalHeightRef } = useMapResize({
    isMapFullScreen,
    isFooterBarOpen: isOpen,
    footerPanelResizeValue,
    isFooterBar,
    collapsedFooterHeight,
    geoviewElement: gvRootElement,
    appHeight,
  });

  /**
   * Finds visible tabbable elements within this map's shell.
   *
   * @param root - The viewer focus trap root
   * @returns The elements in keyboard order
   */
  const getShellTabbable = useCallback((root: HTMLElement): HTMLElement[] => DomHelper.getGVVisibleTabbable(mapId, root), [mapId]);

  /**
   * Keeps the shell element available to its React descendants without resolving it through the store.
   */
  const setShellElementRef = useCallback((element: HTMLDivElement | null): void => {
    shellRef.current = element;
    setShellElement(element ?? undefined);
  }, []);

  // #region HANDLERS

  /**
   * Handles when a component is being added to the map.
   */
  const handleMapAddComponent = useCallback((sender: MapViewer, event: MapComponentAddedEvent): void => {
    setComponents((tempComponents) => ({
      ...tempComponents,
      [event.mapComponentId]: event.component,
    }));
  }, []);

  /**
   * Handles when a component is being removed from the map.
   */
  const handleMapRemoveComponent = useCallback(
    (sender: MapViewer, event: MapComponentRemovedEvent): void => {
      const tempComponents: Record<string, JSX.Element> = { ...components };
      delete tempComponents[event.mapComponentId];

      setComponents(() => ({
        ...tempComponents,
      }));
    },
    [components]
  );

  /**
   * Handles when a modal needs to open.
   */
  const handleModalOpen = useCallback(
    (sender: ModalApi, event: ModalEvent): void => {
      setModalProps(mapViewer.modal.modals[event.modalId]);
      setModalOpen(true);
    },
    [mapViewer]
  );

  /**
   * Handles when the modal needs to close (only 1 at a time is allowed).
   */
  const handleModalClose = useCallback((): void => {
    setModalOpen(false);
  }, []);

  /**
   * Handles when a SnackBar needs to open.
   */
  const handleSnackBarOpen = useCallback(
    (sender: Notifications, payload: SnackBarOpenEvent): void => {
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
   * Handles when a SnackBar needs to close.
   */
  const handleSnackBarClose = useCallback(
    (event?: React.SyntheticEvent | Event | null, reason?: string): void => {
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

  /**
   * Reveals the complete map section on app-bar or map-info activation.
   * Leaves up to MAP_SECTION_SCROLL_GAP_PX above fitting sections; oversized sections keep a stable gap of that size.
   */
  const handleScrollShellIntoView = useCallback((): void => {
    const mapSection = mapShellContainerRef.current;
    if (!mapSection) return;

    const { top, height } = mapSection.getBoundingClientRect();
    const isOversized = height > window.innerHeight;
    const offset = isOversized ? MAP_SECTION_SCROLL_GAP_PX : Math.min(MAP_SECTION_SCROLL_GAP_PX, window.innerHeight - height);
    if (isOversized && Math.abs(top - offset) <= 1) return;

    DomHelper.scrollIfNotVisible(mapSection, 'start', offset);
  }, [mapShellContainerRef]);

  /**
   * Handles the skip to main content by focusing the map container element and activating the crosshair.
   */
  const handleSkipToMainContent = useCallback((): void => {
    // Focus the map and set crosshair
    uiController.setCrosshairActive(true);
    // Intentionally use plain focus() without focusVisible: true because the crosshair itself
    // serves as the visual indicator for keyboard navigation mode. The focus ring is redundant
    // when the crosshair is active and would create visual noise.
    DomHelper.getMapTargetElement(mapId)?.focus();
  }, [mapId, uiController]);

  /**
   * Handles navigation from the top skip link to the bottom skip link.
   */
  const handleSkipToBottomLink = useCallback((): void => {
    DomHelper.getWCAGBottomLink(mapId)?.focus({ focusVisible: true });
  }, [mapId]);

  /**
   * Handles navigation from the main-content skip link to the map.
   */
  const handleSkipToMap = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>): void => {
      event.preventDefault();
      handleSkipToMainContent();
    },
    [handleSkipToMainContent]
  );

  /**
   * Handles navigation from the bottom skip link to the top skip link.
   */
  const handleSkipToTopLink = useCallback((): void => {
    DomHelper.getWCAGTopLink(mapId)?.focus({ focusVisible: true });
  }, [mapId]);

  /**
   * Handles when the host element is resized by an external layout.
   */
  const handleHostHeightChange = useCallback(
    (height: number): void => {
      uiController.resizeMapHeight(height);
    },
    [uiController]
  );

  // #endregion HANDLERS

  // Keep the viewer height in sync when an external layout resizes the host (e.g. 100% height in a resizable parent)
  useEffectHostResizeSync({
    mapId,
    geoviewElement: gvRootElement,
    isMapFullScreen,
    hostOriginalHeightRef,
    onHostHeightChange: handleHostHeightChange,
  });

  /**
   * Registers map viewer event listeners on mount and cleans up on unmount.
   */
  useEffect(() => {
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
      mapViewer.offMapComponentAdded(handleMapAddComponent);
      mapViewer.modal.offModalClosed(handleModalClose);
      mapViewer.modal.offModalOpened(handleModalOpen);
      mapViewer.notifications.offSnackbarOpen(handleSnackBarOpen);
    };
  }, [mapViewer, handleMapRemoveComponent, handleModalOpen, handleSnackBarOpen, handleModalClose, handleMapAddComponent]);

  /**
   * Announces when the map finishes loading, then clears the announcement.
   */
  useEffect(() => {
    logger.logTraceUseEffect('SHELL - map loaded announcement', mapLoaded);

    // Capture previous value before updating
    const prevMapLoaded = prevMapLoadedRef.current;

    // Update ref immediately (unconditionally)
    prevMapLoadedRef.current = mapLoaded;

    // Only announce on the transition from NOT loaded → loaded
    if (mapLoaded && !prevMapLoaded) {
      setMapLoadedAnnouncement(t('map.status.mapLoaded'));

      // Clear the announcement after screen readers have time to speak it
      const timer = setTimeout(() => {
        setMapLoadedAnnouncement('');
      }, TIMEOUT.screenReaderAnnouncement);

      return () => clearTimeout(timer);
    }

    return undefined;
  }, [mapLoaded, t]);

  /**
   * Announces when processing completes, then clears the announcement.
   */
  useEffect(() => {
    logger.logTraceUseEffect('SHELL - processing complete announcement', circularProgressActive);

    // Capture previous value before updating
    const prevCircularProgressActive = prevCircularProgressActiveRef.current;

    // Update ref immediately (unconditionally)
    prevCircularProgressActiveRef.current = circularProgressActive;

    // Only announce on the transition from active → inactive
    if (!circularProgressActive && prevCircularProgressActive) {
      setProcessingCompleteAnnouncement(t('map.status.processingComplete'));

      // Clear the announcement after screen readers have time to speak it
      const timer = setTimeout(() => {
        setProcessingCompleteAnnouncement('');
      }, TIMEOUT.screenReaderAnnouncement);

      return () => clearTimeout(timer);
    }

    return undefined;
  }, [circularProgressActive, t]);

  /**
   * Measures the collapsed footer header so fixed-height maps include it in the requested viewer height.
   */
  useEffect(() => {
    logger.logTraceUseEffect('SHELL - collapsed footer height measurement', isFooterBar, isOpen, mapId);

    // Static maps do not render a footer bar, so no footer height belongs in the shell size calculation.
    if (!isFooterBar) {
      setCollapsedFooterHeight(0);
      return undefined;
    }

    // Wait for both footer elements because the measured element depends on whether the panel is open.
    const footerContainer = DomHelper.getTabsContainer(mapId);
    const footerHeader = DomHelper.getFooterBarHeader(mapId);
    if (!footerHeader || !footerContainer) {
      setCollapsedFooterHeight(0);
      return undefined;
    }

    const updateCollapsedFooterHeight = (): void => {
      // When expanded, reserve only the header height; when collapsed, measure the entire footer container.
      const measuredFooterElement = isOpen ? footerHeader : footerContainer;
      const nextHeight = Math.ceil(measuredFooterElement.getBoundingClientRect().height);
      setCollapsedFooterHeight((previousHeight) => (previousHeight === nextHeight ? previousHeight : nextHeight));
    };

    updateCollapsedFooterHeight();

    if (typeof ResizeObserver === 'undefined') {
      return undefined;
    }

    // Recalculate when either the footer panel or its header changes size.
    const resizeObserver = new ResizeObserver(updateCollapsedFooterHeight);
    resizeObserver.observe(footerContainer);
    resizeObserver.observe(footerHeader);

    return (): void => {
      resizeObserver.disconnect();
    };
  }, [isFooterBar, isOpen, mapId]);

  /**
   * Updates the OpenLayers map size after shell height calculations change.
   */
  useEffect(() => {
    logger.logTraceUseEffect(
      'SHELL - update OpenLayers size after layout change',
      appHeight,
      collapsedFooterHeight,
      isMapFullScreen,
      isOpen
    );

    mapViewer.map?.updateSize();
  }, [mapViewer, appHeight, collapsedFooterHeight, isMapFullScreen, isOpen]);

  return (
    <Box sx={memoSxClasses.all}>
      <Link
        id={DomHelper.buildWCAGTopLinkId(mapViewer.mapId)}
        href={`#${DomHelper.buildWCAGBottomLinkId(mapViewer.mapId)}`}
        tabIndex={0}
        sx={{ ...memoSxClasses.skip, top: '0px' }}
        onClick={handleSkipToBottomLink}
      >
        {t('keyboardnav.start')}
      </Link>
      <FocusTrap open={activeTrapGeoView} disableEnforceFocus disableAutoFocus disableRestoreFocus getTabbable={getShellTabbable}>
        <Box
          ref={setShellElementRef}
          id={DomHelper.buildShellId(mapViewer.mapId)}
          sx={memoSxClasses.shell}
          // geoview-keyboard-active scopes keyboard-only focus outlines (form controls) to GeoView's keyboard-navigation mode
          className={`geoview-shell${activeTrapGeoView ? ' geoview-keyboard-active' : ' geoview-keyboard-inactive'}`}
          tabIndex={-1}
        >
          <ShellContainerContext.Provider value={shellElement}>
            {/* Map loading */}
            <Box role="status" aria-busy={!mapLoaded}>
              <CircularProgress isLoaded={mapLoaded} />
              {!mapLoaded && <Typography sx={visuallyHidden}>{t('map.status.loadingMap')}</Typography>}
              {mapLoadedAnnouncement && <Typography sx={visuallyHidden}>{mapLoadedAnnouncement}</Typography>}
            </Box>

            {/* Processing */}
            <Box role="status" aria-busy={circularProgressActive}>
              <CircularProgress isLoaded={!circularProgressActive} />
              {circularProgressActive && <Typography sx={visuallyHidden}>{t('map.status.processing')}</Typography>}
              {processingCompleteAnnouncement && <Typography sx={visuallyHidden}>{processingCompleteAnnouncement}</Typography>}
            </Box>
            {interaction === 'dynamic' && (
              <Link
                id={DomHelper.buildWCAGLinkToMapId(mapId)}
                href={`#${DomHelper.buildWCAGLinkToMapId(mapId)}`}
                tabIndex={0}
                sx={{ ...memoSxClasses.skip, top: '0px' }}
                onClick={handleSkipToMap}
              >
                {t('keyboardnav.map')}
              </Link>
            )}

            <Box
              id={DomHelper.buildMapContainerId(mapId)}
              sx={memoSxClasses.mapShellContainer}
              className="mapContainer"
              ref={mapShellContainerRef}
            >
              <AppBar
                api={mapViewer.appBarApi}
                onScrollShellIntoView={handleScrollShellIntoView}
                onKeyboardNavigationModeChange={handleKeyboardNavigationModeChange}
              />
              <Box sx={memoSxClasses.mapContainer}>
                <Map viewer={mapViewer} />
              </Box>
              {interaction === 'dynamic' && <NavBar api={mapViewer.navBarApi} />}
              <MapInfo onScrollShellIntoView={handleScrollShellIntoView} />
              <Snackbar
                snackBarId={`${mapViewer.mapId}-snackbar`}
                message={snackbarMessage}
                open={snackbarOpen}
                type={snackbarType}
                closeButtonText={t('general.close')}
                onClose={handleSnackBarClose}
              />
            </Box>
            {isFooterBar && <FooterBar api={mapViewer.footerBarApi} />}
            {Object.keys(mapViewer.modal.modals).map((modalId) => (
              <Modal key={modalId} modalId={modalId} open={modalOpen} modalProps={modalProps} container={gvRootElement} />
            ))}
            {/* modal section start */}
            <FocusTrapDialog mapId={mapViewer.mapId} registerModeAction={registerModeAction} />
            {mapLoaded && <ExportModal />}
            {focusItem.activeElementId === 'layerDataTable' && <DataTableModal />}
            {/* Show Feature Detail Modal when detail icon is clicked in datatable each row */}
            {focusItem.activeElementId === 'featureDetailDataTable' && <FeatureDetailModal />}
            {/* modal section end */}
            {Object.keys(components).map((key: string) => {
              return <Fragment key={key}>{components[key]}</Fragment>;
            })}
          </ShellContainerContext.Provider>
        </Box>
      </FocusTrap>
      <Link
        id={DomHelper.buildWCAGBottomLinkId(mapViewer.mapId)}
        href={`#${DomHelper.buildWCAGTopLinkId(mapViewer.mapId)}`}
        tabIndex={0}
        sx={{ ...memoSxClasses.skip, bottom: '0px' }}
        onClick={handleSkipToTopLink}
      >
        {t('keyboardnav.end')}
      </Link>
    </Box>
  );
}
