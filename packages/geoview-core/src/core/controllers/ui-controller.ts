import KeyboardPan from 'ol/interaction/KeyboardPan';
import KeyboardZoom from 'ol/interaction/KeyboardZoom';
import type { Coordinate } from 'ol/coordinate';
import type View from 'ol/View';

import type { TypeDisplayLanguage, TypeDisplayTheme } from '@/api/types/map-schema-types';
import { AbstractMapViewerController } from '@/core/controllers/base/abstract-map-viewer-controller';
import type { ControllerRegistry } from '@/core/controllers/base/controller-registry';
import { logger } from '@/core/utils/logger';
import {
  addStoreUIAppBarPanelId,
  addStoreUIFooterTab,
  bumpStoreUINavBarButtonPanelVersion,
  clearStoreUIFocusRestoreRequest,
  disableStoreUIFocusTrap,
  enableStoreUIFocusTrap,
  hideStoreUITabButton,
  removeStoreUIAppBarPanelId,
  removeStoreUIFooterTab,
  setStoreUIActiveAppBarTab,
  setStoreUIActiveFooterBarTab,
  setStoreUIActiveTrapGeoView,
  setStoreUIFooterBarIsOpen,
  setStoreUIFooterPanelResizeValue,
  setStoreUIMapInfoExpanded,
  showStoreUITabButton,
  type FocusItemProps,
  type TypeFooterTabEntry,
} from '@/core/stores/states/ui-state';
import {
  addStoreAppNotification,
  getStoreAppGeoviewAssetsURL,
  removeStoreAppAllNotifications,
  removeStoreAppNotification,
  setStoreAppCircularProgress,
  setStoreAppCrosshairActive,
  setStoreAppDisplayDateMode,
  setStoreAppDisplayDateTimezone,
  setStoreAppDisplayLanguage,
  setStoreAppDisplayTheme,
  setStoreAppFullScreenActive,
  setStoreAppGuide,
  setStoreAppHeight,
} from '@/core/stores/states/app-state';
import { getStoreMapConfigNavBar } from '@/core/stores/states/map-state';
import type { TimeIANA } from '@/core/utils/date-mgt';
import type { TypeHTMLElement } from '@/core/types/global-types';
import { formatError } from '@/core/exceptions/core-exceptions';
import { createGuideObject, exitFullscreen, getFullscreenElement, requestFullscreen } from '@/core/utils/utilities';
import type { SnackbarType } from '@/core/utils/notifications';
import type { NotificationDetailsType } from '@/core/components/notifications/notifications';
import type {
  DomainDisplayDateModeChangedDelegate,
  DomainDisplayDateModeChangedEvent,
  DomainDisplayDateTimezoneChangedDelegate,
  DomainDisplayDateTimezoneChangedEvent,
  DomainLanguageChangedDelegate,
  DomainLanguageChangedEvent,
  DomainThemeChangedDelegate,
  DomainThemeChangedEvent,
  UIDomain,
} from '@/core/domains/ui-domain';
import type { MapViewer } from '@/geo/map/map-viewer';

// GV Controllers shouldn't import DomHelper

/**
 * Controller responsible for managing the UI state interactions.
 *
 * Extends AbstractMapViewerController and delegates state mutations to the UIStateAdaptor.
 */
export class UIController extends AbstractMapViewerController {
  /** The UI Domain instance associated with this controller. */
  #uiDomain: UIDomain;

  /** The bounded reference to the display language changed handler. */
  #boundedHandleDisplayLanguageChanged: DomainLanguageChangedDelegate;

  /** The bounded reference to the display theme changed handler. */
  #boundedHandleDisplayThemeChanged: DomainThemeChangedDelegate;

  /** The bounded reference to the display date mode changed handler. */
  #boundedHandleDisplayDateModeChanged: DomainDisplayDateModeChangedDelegate;

  /** The bounded reference to the display date timezone changed handler. */
  #boundedHandleDisplayDateTimezoneChanged: DomainDisplayDateTimezoneChangedDelegate;

  /** The browser fullscreen change event names (standard and vendor-prefixed). */
  static readonly #FULLSCREEN_CHANGE_EVENTS = ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'];

  /** The tolerance used to compare view states around fullscreen transitions. */
  static readonly #FULLSCREEN_VIEW_TOLERANCE = 1e-6;

  /** The element currently in fullscreen for this map, undefined when fullscreen is not active. */
  #fullscreenElement?: TypeHTMLElement;

  /** The view state saved when entering fullscreen. */
  #fullscreenSavedView?: TypeFullscreenSavedView;

  /** The view state after the last map size change while in fullscreen. */
  #fullscreenSettledState?: TypeFullscreenViewState;

  /** Whether the view was changed (user or programmatic) while in fullscreen, sticky until exit. */
  #fullscreenViewChanged = false;

  /** The bounded reference to the browser fullscreen change handler. */
  #boundedHandleFullscreenChanged: () => void;

  /** The bounded reference to the map size changed handler used while in fullscreen. */
  #boundedHandleFullscreenSizeChanged: () => void;

  /** The bounded reference to the map move end handler used while in fullscreen. */
  #boundedHandleFullscreenMoveEnd: () => void;

  /**
   * Creates an instance of UIController.
   *
   * @param mapViewer - The map viewer instance
   * @param controllerRegistry - The controller registry for accessing sibling controllers
   * @param uiDomain - The UI domain instance
   */
  constructor(mapViewer: MapViewer, controllerRegistry: ControllerRegistry, uiDomain: UIDomain) {
    super(mapViewer, controllerRegistry);

    // Keep the domain internally
    this.#uiDomain = uiDomain;

    // Keep a bounded reference to the handle display language changed
    this.#boundedHandleDisplayLanguageChanged = this.#handleDisplayLanguageChanged.bind(this);

    // Keep a bounded reference to the handle display theme changed
    this.#boundedHandleDisplayThemeChanged = this.#handleDisplayThemeChanged.bind(this);

    // Keep a bounded reference to the handle display date mode changed
    this.#boundedHandleDisplayDateModeChanged = this.#handleDisplayDateModeChanged.bind(this);

    // Keep a bounded reference to the handle display date timezone changed
    this.#boundedHandleDisplayDateTimezoneChanged = this.#handleDisplayDateTimezoneChanged.bind(this);

    // Keep bounded references to the fullscreen handlers
    this.#boundedHandleFullscreenChanged = this.#handleFullscreenChanged.bind(this);
    this.#boundedHandleFullscreenSizeChanged = this.#handleFullscreenSizeChanged.bind(this);
    this.#boundedHandleFullscreenMoveEnd = this.#handleFullscreenMoveEnd.bind(this);
  }

  // #region OVERRIDES

  /**
   * Hooks the controller into action.
   */
  protected override onHook(): void {
    // Listens when the language is changed in the UI domain and updates the store accordingly
    this.#uiDomain.onLanguageChanged(this.#boundedHandleDisplayLanguageChanged);

    // Listens when the display theme changes
    this.#uiDomain.onThemeChanged(this.#boundedHandleDisplayThemeChanged);

    // Listens when the display date mode changes
    this.#uiDomain.onDisplayDateModeChanged(this.#boundedHandleDisplayDateModeChanged);

    // Listens when the display date timezone changes
    this.#uiDomain.onDisplayDateTimezoneChanged(this.#boundedHandleDisplayDateTimezoneChanged);
  }

  /**
   * Unhooks the controller from the action.
   */
  protected override onUnhook(): void {
    // Unhooks the fullscreen listeners, if fullscreen is active
    if (this.#fullscreenElement) this.#removeFullscreenListeners();

    // Unhooks when the display date timezone changes
    this.#uiDomain.offDisplayDateTimezoneChanged(this.#boundedHandleDisplayDateTimezoneChanged);

    // Listens when the display date mode changes
    this.#uiDomain.offDisplayDateModeChanged(this.#boundedHandleDisplayDateModeChanged);

    // Unhooks when the display theme changes
    this.#uiDomain.offThemeChanged(this.#boundedHandleDisplayThemeChanged);

    // Unhooks when the language is changed in the UI domain and updates the store accordingly
    this.#uiDomain.offLanguageChanged(this.#boundedHandleDisplayLanguageChanged);
  }

  // #endregion OVERRIDES

  // #region PUBLIC METHODS

  /**
   * Gets the current display language.
   *
   * @returns The current display language
   */
  getDisplayLanguage(): TypeDisplayLanguage {
    // Get the language from the domain
    return this.#uiDomain.getLanguage();
  }

  /**
   * Shows a tab button in the footer bar.
   *
   * @param tab - The tab identifier to show
   */
  showTabButton(tab: string): void {
    // Save in the store
    showStoreUITabButton(this.getMapId(), tab);
  }

  /**
   * Hides a tab button in the footer bar.
   *
   * @param tab - The tab identifier to hide
   */
  hideTabButton(tab: string): void {
    // Save in the store
    hideStoreUITabButton(this.getMapId(), tab);
  }

  /**
   * Adds a tab to the footer bar with the given properties.
   *
   * @param tab - The properties of the tab to add
   */
  addFooterTab(tab: TypeFooterTabEntry): void {
    // Save in the store
    addStoreUIFooterTab(this.getMapId(), tab);
  }

  /**
   * Removes a tab from the footer bar by its identifier.
   *
   * @param id - The identifier of the tab to remove
   */
  removeFooterTab(id: string): void {
    // Save in the store
    removeStoreUIFooterTab(this.getMapId(), id);
  }

  /**
   * Sets the active footer bar tab.
   *
   * @param tab - The tab identifier to activate, or undefined to deactivate
   */
  setActiveFooterBarTab(tab: string | undefined): void {
    // Save in the store
    setStoreUIActiveFooterBarTab(this.getMapId(), tab);
  }

  /**
   * Adds an app-bar panel id to the store, which will make the app-bar show the corresponding panel.
   *
   * @param id - The id of the panel to be added and shown in the app-bar
   */
  addAppBarPanelId(id: string): void {
    // Save in the store
    addStoreUIAppBarPanelId(this.getMapId(), id);
  }

  /**
   * Removes an app-bar panel id from the store, which will make the app-bar hide the corresponding panel.
   *
   * @param id - The id of the panel to be removed and hidden in the app-bar
   */
  removeAppBarPanelId(id: string): void {
    // Save in the store
    removeStoreUIAppBarPanelId(this.getMapId(), id);
  }

  /**
   * Sets the active app bar tab with its open and focus trap states.
   *
   * @param tab - The tab identifier to activate, or undefined to deactivate
   * @param isOpen - Whether the tab panel is open
   * @param isFocusTrapped - Whether focus should be trapped in the panel
   */
  setActiveAppBarTab(tab: string | undefined, isOpen: boolean, isFocusTrapped: boolean): void {
    // Save in the store
    setStoreUIActiveAppBarTab(this.getMapId(), tab, isOpen, isFocusTrapped);
  }

  /**
   * Sets the footer bar open state.
   *
   * @param isOpen - Whether the footer bar is open
   */
  setFooterBarIsOpen(isOpen: boolean): void {
    // Save in store
    setStoreUIFooterBarIsOpen(this.getMapId(), isOpen);
  }

  /**
   * Bumps the nav-bar button panel version to trigger a re-render in the nav-bar component when button panels are
   * added or removed without necessarily adding or removing a panel id (ex: when all buttons are removed from a panel
   * but the panel itself is not removed from the store to avoid losing its state).
   * This is a workaround and eventually the store structure should be refactored to better accommodate button panel
   * state and avoid this type of workaround.
   */
  bumpNavBarButtonPanelVersion(): void {
    // Save in the store
    bumpStoreUINavBarButtonPanelVersion(this.getMapId());
  }

  /**
   * Enables the focus trap with the given focus item properties.
   *
   * @param uiFocus - The focus item properties to apply
   */
  enableFocusTrap(uiFocus: FocusItemProps): void {
    // Save in store
    enableStoreUIFocusTrap(this.getMapId(), uiFocus);
  }

  /**
   * Disables the focus trap and optionally returns focus to a callback element.
   *
   * @param callbackElementId - Optional element ID to return focus to
   */
  disableFocusTrap(callbackElementId?: string): void {
    // Save in store
    disableStoreUIFocusTrap(this.getMapId(), callbackElementId);
  }

  /**
   * Completes a focus restoration request handled by the UI shell.
   *
   * @param requestId - The identifier of the completed request
   */
  completeFocusRestore(requestId: number): void {
    clearStoreUIFocusRestoreRequest(this.getMapId(), requestId);
  }

  /**
   * Sets the active state of the GeoView focus trap.
   *
   * @param active - Whether the GeoView trap is active
   */
  setActiveTrapGeoView(active: boolean): void {
    // Save in store
    setStoreUIActiveTrapGeoView(this.getMapId(), active);
  }

  /**
   * Sets the footer panel resize value.
   *
   * @param value - The resize value
   */
  setFooterPanelResizeValue(value: number): void {
    // Save in store
    setStoreUIFooterPanelResizeValue(this.getMapId(), value);
  }

  /**
   * Sets the map info bar expanded state.
   *
   * Affects nav-bar positioning to avoid overlap when the info bar expands.
   *
   * @param expanded - Whether the map info bar is expanded
   */
  setMapInfoExpanded(expanded: boolean): void {
    // Save in store
    setStoreUIMapInfoExpanded(this.getMapId(), expanded);
  }

  /**
   * Sets the circular progress indicator state.
   *
   * @param active - Whether the circular progress is active
   */
  setCircularProgress(active: boolean): void {
    // Save in store
    setStoreAppCircularProgress(this.getMapId(), active);
  }

  /**
   * Sets the display language and reloads dependent resources.
   *
   * Resets the basemap, recreates the guide, and removes all notifications
   * to ensure consistent language across the application.
   *
   * @param lang - The display language to set
   * @returns A promise that resolves when all language-dependent resources have been reloaded
   */
  setDisplayLanguage(lang: TypeDisplayLanguage): Promise<void> {
    // Return a new promise of void when all will be done instead of promise of array of voids
    return new Promise((resolve, reject) => {
      // Get the map id
      const mapId = this.getMapId();

      // Set the language in the domain
      const promiseChangeLanguage = this.#uiDomain.setLanguage(lang);

      // reload the basemap from new language
      const promiseResetBasemap = this.getControllersRegistry().mapController.resetBasemap();

      // load guide in new language
      const promiseSetGuide = this.createGuide();

      // Remove all previous notifications to ensure there is no mix en and fr
      removeStoreAppAllNotifications(mapId);

      // When all promises are done
      Promise.all([promiseChangeLanguage, promiseResetBasemap, promiseSetGuide])
        .then(() => {
          // Now resolve
          resolve();
        })
        .catch((error: unknown) => {
          // Reject
          reject(formatError(error));
        });
    });
  }

  /**
   * Sets the display theme.
   *
   * @param theme - The display theme to set
   */
  setDisplayTheme(theme: TypeDisplayTheme): void {
    // Set the theme in the domain
    this.#uiDomain.setDisplayTheme(theme);
  }

  /**
   * Sets the display date timezone after validation.
   *
   * @param displayDateTimezone - The IANA timezone identifier to set
   * @throws {InvalidTimezoneError} When the time zone is not a valid or supported IANA identifier
   */
  setDisplayDateTimezone(displayDateTimezone: TimeIANA): void {
    // Set the display date timezone in the domain
    this.#uiDomain.setDisplayDateTimezone(displayDateTimezone);
  }

  /**
   * Sets the crosshair active state and updates WCAG map interactions accordingly.
   *
   * @param active - Whether the crosshair is active
   */
  setCrosshairActive(active: boolean): void {
    // Save in store
    setStoreAppCrosshairActive(this.getMapId(), active);

    // Because the map is focused/blured, we need to enable/disable the map interaction for WCAG
    this.setActiveMapInteractionWCAG(active);
  }

  /**
   * Activates or deactivates WCAG keyboard map interactions (pan and zoom).
   *
   * @param active - Whether to activate or deactivate keyboard interactions
   */
  setActiveMapInteractionWCAG(active: boolean): void {
    const mapElement = this.getMapViewer().map;

    // replace the KeyboardPan interaction by a new one
    mapElement.getInteractions().forEach((interactionItem) => {
      if (interactionItem instanceof KeyboardPan) interactionItem.setActive(active);
      if (interactionItem instanceof KeyboardZoom) interactionItem.setActive(active);
    });
  }

  /**
   * Replaces the keyboard pan interaction with a new one using the specified pixel delta.
   *
   * @param panDelta - The pixel delta for keyboard panning
   */
  setMapKeyboardPanInteractions(panDelta: number): void {
    const mapElement = this.getMapViewer().map;

    // replace the KeyboardPan interaction by a new one
    mapElement.getInteractions().forEach((interactionItem) => {
      if (interactionItem instanceof KeyboardPan) {
        mapElement.removeInteraction(interactionItem);
      }
    });
    mapElement.addInteraction(new KeyboardPan({ pixelDelta: panDelta }));
  }

  /**
   * Toggles the fullscreen state.
   *
   * When entering fullscreen, saves the current view (center, resolution, rotation) and requests fullscreen on the provided element.
   * When exiting, only asks the browser to leave fullscreen; the view is handled once the browser reports the exit
   * (same path for the fullscreen button, the `Esc` key and this API). If the user did not change the view while in fullscreen,
   * the saved view is restored exactly; otherwise the current center and resolution are kept.
   * Calls that do not change the state (entering while active, exiting while inactive) are ignored.
   *
   * @param status - Whether to enter or exit fullscreen
   * @param element - Optional HTML element to make fullscreen (required to enter fullscreen)
   */
  setFullScreen(status: boolean, element?: TypeHTMLElement): void {
    // If entering fullscreen
    if (status) {
      // If already active or no element to make fullscreen, nothing to do
      if (this.#fullscreenElement || !element) return;

      const view = this.getMapViewer().getView();
      const viewState = UIController.#getViewState(view);
      if (viewState) this.#fullscreenSavedView = { view, ...viewState };
      this.#fullscreenSettledState = viewState;
      this.#fullscreenViewChanged = false;
      this.#fullscreenElement = element;

      // Track view changes and size changes, and listen for the browser leaving fullscreen
      this.#addFullscreenListeners();

      // Request full screen on the element
      void requestFullscreen(element).catch((): void => {
        if (this.#fullscreenElement === element && getFullscreenElement() !== element) this.#handleFullscreenExited();
      });

      // Save in store
      setStoreAppFullScreenActive(this.getMapId(), true);
      return;
    }

    // Exiting fullscreen, if not active, nothing to do
    if (!this.#fullscreenElement) return;

    if (getFullscreenElement() === this.#fullscreenElement) {
      // Ask the browser to exit, the 'fullscreenchange' handler finishes the exit
      exitFullscreen();
    } else {
      // The browser is not in fullscreen on this map (e.g. request rejected), finish the exit now
      this.#handleFullscreenExited();
    }
  }

  /**
   * Adds a snackbar message of the specified type.
   *
   * @param type - The snackbar type (info, success, warning, or error)
   * @param messageKey - The translation key for the message
   * @param messageParams - Optional parameters for message interpolation
   */
  addMessage(type: SnackbarType, messageKey: string, messageParams?: Record<string, unknown>): void {
    // Redirect to the MapViewer
    switch (type) {
      case 'info':
        this.getMapViewer().notifications.showMessage(messageKey, messageParams);
        break;
      case 'success':
        this.getMapViewer().notifications.showSuccess(messageKey, messageParams);
        break;
      case 'warning':
        this.getMapViewer().notifications.showWarning(messageKey, messageParams);
        break;
      case 'error':
        this.getMapViewer().notifications.showError(messageKey, messageParams);
        break;
      default:
        break;
    }
  }

  /**
   * Displays a detailed INFO message in the snackbar while grouping a separate generic message in the notification panel.
   *
   * High-frequency progress updates (e.g. a large export) would otherwise flood the notification panel with one entry
   * per update. The snackbar carries live detail (e.g. a count) while the panel regroups every update into a single entry.
   *
   * INFO-only by design: the grouped panel entry does not increment the unread badge, so warnings and errors must stay
   * ungrouped via `addMessage('warning'/'error', …)` so each one is individually surfaced and counted.
   *
   * @param snackbarKey - The translation key shown in the snackbar (detailed)
   * @param snackbarParams - Parameters for the snackbar message
   * @param notificationKey - The translation key added to the notification panel (generic)
   * @param notificationParams - Optional parameters for the notification-panel message
   */
  addInfoDetailedSnackbar(
    snackbarKey: string,
    snackbarParams: Record<string, unknown>,
    notificationKey: string,
    notificationParams: Record<string, unknown> = {}
  ): void {
    // Redirect to the MapViewer
    this.getMapViewer().notifications.showInfoDetailedSnackbar(snackbarKey, snackbarParams, notificationKey, notificationParams);
  }

  /**
   * Adds a notification to the notification center.
   *
   * @param notification - The notification details to add
   */
  addNotification(notification: NotificationDetailsType): void {
    // Save in store
    addStoreAppNotification(this.getMapId(), notification).catch((error: unknown) => {
      // Log
      logger.logPromiseFailed('uiController.addNotification in uiController', error);
    });
  }

  /**
   * Removes a notification by its key.
   *
   * @param key - The notification key to remove
   */
  removeNotification(key: string): void {
    // Save in store
    removeStoreAppNotification(this.getMapId(), key).catch((error: unknown) => {
      // Log
      logger.logPromiseFailed('uiController.removeNotification in uiController', error);
    });
  }

  /** Removes all notifications from the notification center. */
  removeAllNotifications(): void {
    // Save in store
    removeStoreAppAllNotifications(this.getMapId());
  }

  /**
   * Creates the guide object from the current language and saves it in the store.
   *
   * @returns A promise that resolves when the guide has been created and stored
   */
  async createGuide(): Promise<void> {
    const mapId = this.getMapId();
    const language = this.#uiDomain.getLanguage();

    try {
      // Create the guide
      const guide = await createGuideObject(language, getStoreAppGeoviewAssetsURL(mapId));

      // Remove sections that depend on optional packages not present in this map config
      const navBar = getStoreMapConfigNavBar(mapId);
      if (!navBar?.includes('drawer')) {
        delete guide.drawingTools;
      }

      // Save in store
      setStoreAppGuide(mapId, guide);
    } catch (error: unknown) {
      // Log error
      logger.logError(mapId, error, 'createGuide');
    }
  }

  /**
   * Resizes the map viewer height without destroying and recreating the MapViewer.
   *
   * Updates the stored viewer height so the footer bar split and the OpenLayers canvas recalculate to match,
   * through their existing effects. Useful when a host application resizes the container after mount.
   *
   * @param height - The new viewer height in pixels
   */
  resizeMapHeight(height: number): void {
    setStoreAppHeight(this.getMapId(), height);
  }

  // #endregion PUBLIC METHODS

  // #region DOMAIN HANDLERS
  // GV Eventually, these should be moved to a store adaptor or similar construct that directly connects the domain to the store without going through the controller
  // GV.CONT but for now this allows us to keep domain-store interactions in one place and call application-level processes as needed during migration.

  /**
   * Handles the display language changed event from the UI domain.
   *
   * @param sender - The UI domain that emitted the event
   * @param event - The language changed event containing the new language
   */
  #handleDisplayLanguageChanged(sender: UIDomain, event: DomainLanguageChangedEvent): void {
    // Save in the store
    setStoreAppDisplayLanguage(this.getMapId(), event.language);
  }

  /**
   * Handles the display theme changed event from the UI domain.
   *
   * @param sender - The UI domain that emitted the event
   * @param event - The theme changed event containing the new theme
   */
  #handleDisplayThemeChanged(sender: UIDomain, event: DomainThemeChangedEvent): void {
    // Save in the store
    setStoreAppDisplayTheme(this.getMapId(), event.theme);
  }

  /**
   * Handles the display date mode changed event from the UI domain.
   *
   * @param sender - The UI domain that emitted the event
   * @param event - The display date mode changed event containing the new mode
   */
  #handleDisplayDateModeChanged(sender: UIDomain, event: DomainDisplayDateModeChangedEvent): void {
    // Save in the store
    setStoreAppDisplayDateMode(this.getMapId(), event.displayDateMode);
  }

  /**
   * Handles the display date timezone changed event from the UI domain.
   *
   * @param sender - The UI domain that emitted the event
   * @param event - The display date timezone changed event containing the new timezone
   */
  #handleDisplayDateTimezoneChanged(sender: UIDomain, event: DomainDisplayDateTimezoneChangedEvent): void {
    // Save in the store
    setStoreAppDisplayDateTimezone(this.getMapId(), event.displayDateTimezone);
  }

  // #endregion DOMAIN HANDLERS

  // #region FULLSCREEN

  /**
   * Handles the browser fullscreen change events while this map is in fullscreen.
   *
   * Finishes the exit when the browser is no longer in fullscreen on this map's element (fullscreen button, `Esc` key or API).
   */
  #handleFullscreenChanged(): void {
    // If still in fullscreen on this map's element (e.g. the 'enter' event), nothing to do
    if (!this.#fullscreenElement || getFullscreenElement() === this.#fullscreenElement) return;

    this.#handleFullscreenExited();
  }

  /**
   * Handles the map size changes while in fullscreen.
   *
   * OpenLayers resolves the view constraints on size change before this handler runs, so the recorded state
   * is the view as the resize left it, any later difference comes from a user or programmatic interaction.
   */
  #handleFullscreenSizeChanged(): void {
    this.#fullscreenSettledState = UIController.#getViewState(this.getMapViewer().getView());
  }

  /**
   * Handles the map move end while in fullscreen.
   *
   * Marks the view as changed when it differs from the state recorded after the last size change. The flag is sticky,
   * so a later size change (e.g. footer resize) re-recording the settled state cannot hide an earlier interaction.
   * Size-driven constraint adjustments are not flagged: OpenLayers applies them synchronously on `change:size`,
   * before the settled state is recorded, while `moveend` only fires after the next render.
   */
  #handleFullscreenMoveEnd(): void {
    if (this.#fullscreenViewChanged) return;
    const currentState = UIController.#getViewState(this.getMapViewer().getView());
    if (!UIController.#isSameViewState(currentState, this.#fullscreenSettledState)) this.#fullscreenViewChanged = true;
  }

  /**
   * Finishes exiting fullscreen: removes the listeners, restores the saved view when the user did not interact
   * (otherwise keeps the current center and resolution) and updates the store.
   */
  #handleFullscreenExited(): void {
    // Unregister the listeners
    this.#removeFullscreenListeners();

    const savedView = this.#fullscreenSavedView;
    const settledState = this.#fullscreenSettledState;
    const viewChanged = this.#fullscreenViewChanged;
    this.#fullscreenElement = undefined;
    this.#fullscreenSavedView = undefined;
    this.#fullscreenSettledState = undefined;
    this.#fullscreenViewChanged = false;

    // Restore the saved view only if the view (and projection) is the same and was not changed while in fullscreen
    // (the state comparison catches a change made after the last 'moveend', e.g. exiting mid-interaction)
    const view = this.getMapViewer().getView();
    const currentState = UIController.#getViewState(view);
    if (savedView && savedView.view === view && !viewChanged && UIController.#isSameViewState(currentState, settledState)) {
      view.cancelAnimations();
      view.setRotation(savedView.rotation);
      view.setResolution(savedView.resolution);
      view.setCenter(savedView.center);
    }

    // Save in store
    setStoreAppFullScreenActive(this.getMapId(), false);
  }

  /**
   * Adds the map size change, map move end and browser fullscreen change listeners used while in fullscreen.
   */
  #addFullscreenListeners(): void {
    const { map } = this.getMapViewer();
    map.on('change:size', this.#boundedHandleFullscreenSizeChanged);
    map.on('moveend', this.#boundedHandleFullscreenMoveEnd);
    UIController.#FULLSCREEN_CHANGE_EVENTS.forEach((eventName) => {
      document.addEventListener(eventName, this.#boundedHandleFullscreenChanged);
    });
  }

  /**
   * Removes the map size change, map move end and browser fullscreen change listeners used while in fullscreen.
   */
  #removeFullscreenListeners(): void {
    const { map } = this.getMapViewer();
    map.un('change:size', this.#boundedHandleFullscreenSizeChanged);
    map.un('moveend', this.#boundedHandleFullscreenMoveEnd);
    UIController.#FULLSCREEN_CHANGE_EVENTS.forEach((eventName) => {
      document.removeEventListener(eventName, this.#boundedHandleFullscreenChanged);
    });
  }

  /**
   * Gets the center, resolution and rotation of a view.
   *
   * @param view - The OpenLayers view
   * @returns The view state, or undefined when the view is not fully defined
   */
  static #getViewState(view: View): TypeFullscreenViewState | undefined {
    const center = view.getCenter();
    const resolution = view.getResolution();
    if (!center || resolution === undefined) return undefined;
    return { center: [...center], resolution, rotation: view.getRotation() };
  }

  /**
   * Indicates if two view states are the same, within a tolerance for floating point rounding.
   *
   * @param stateA - The first view state
   * @param stateB - The second view state
   * @returns True when both states are defined and equal
   */
  static #isSameViewState(stateA: TypeFullscreenViewState | undefined, stateB: TypeFullscreenViewState | undefined): boolean {
    if (!stateA || !stateB) return false;

    // Center tolerance is a tiny fraction of a pixel, resolution and rotation tolerances are relative/absolute epsilons
    const centerTolerance = stateB.resolution * UIController.#FULLSCREEN_VIEW_TOLERANCE;
    return (
      Math.abs(stateA.center[0] - stateB.center[0]) <= centerTolerance &&
      Math.abs(stateA.center[1] - stateB.center[1]) <= centerTolerance &&
      Math.abs(stateA.resolution - stateB.resolution) <= stateB.resolution * UIController.#FULLSCREEN_VIEW_TOLERANCE &&
      Math.abs(stateA.rotation - stateB.rotation) <= UIController.#FULLSCREEN_VIEW_TOLERANCE
    );
  }

  // #endregion FULLSCREEN
}

/** The center, resolution and rotation of the map view, saved around fullscreen transitions. */
type TypeFullscreenViewState = {
  /** The view center. */
  center: Coordinate;
  /** The view resolution. */
  resolution: number;
  /** The view rotation in radians. */
  rotation: number;
};

/** The view state saved when entering fullscreen, with the view it belongs to (a projection change replaces the view). */
type TypeFullscreenSavedView = TypeFullscreenViewState & {
  /** The view the state was read from. */
  view: View;
};
