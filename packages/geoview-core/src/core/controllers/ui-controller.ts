import { type TypeDisplayLanguage, type TypeDisplayTheme } from '@/api/types/map-schema-types';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import { AbstractMapViewerController } from '@/core/controllers/base/abstract-map-viewer-controller';
import { UIStateAdaptor } from '@/core/adaptors/ui-state-adaptor';
import type { FocusItemProps } from '@/core/stores/store-interface-and-intial-values/ui-state';
import { useControllers } from '@/core/controllers/controller-manager';
import { DateMgt, type TimeIANA } from '@/core/utils/date-mgt';
import type { TypeHTMLElement } from '@/core/types/global-types';
import { formatError } from '@/core/exceptions/core-exceptions';
import { createGuideObject, exitFullscreen, requestFullscreen } from '@/core/utils/utilities';
import type { SnackbarType } from '@/core/utils/notifications';
import type { NotificationDetailsType } from '@/core/components/notifications/notifications';
import { getStoreGeoviewAssetsURL } from '@/core/stores/store-interface-and-intial-values/app-state';
import type { UIDomain } from '@/core/domains/ui-domain';
import type { MapViewer } from '@/geo/map/map-viewer';
import { logger } from '@/core/utils/logger';

/**
 * Controller responsible for managing the UI state interactions.
 *
 * Extends AbstractMapViewerController and delegates state mutations to the UIStateAdaptor.
 */
export class UIController extends AbstractMapViewerController {
  /** The UI Domain instance associated with this controller */
  #uiDomain: UIDomain;

  /** The UI State Adaptor used to interact with the UI state store */
  #uiStateAdaptor: UIStateAdaptor;

  /**
   * Creates an instance of UIController.
   *
   * @param mapViewer - The map viewer instance
   * @param uiDomain - The UI domain instance
   */
  constructor(mapViewer: MapViewer, uiDomain: UIDomain) {
    super(mapViewer);

    // Keep the domain internally
    this.#uiDomain = uiDomain;

    // Keep the state adaptor internally
    this.#uiStateAdaptor = new UIStateAdaptor(uiDomain, mapViewer.mapId);
  }

  /**
   * Shows a tab button in the footer bar.
   *
   * @param tab - The tab identifier to show
   */
  showTabButton(tab: string): void {
    // Save in store
    this.#uiStateAdaptor.showTabButton(tab);
  }

  /**
   * Hides a tab button in the footer bar.
   *
   * @param tab - The tab identifier to hide
   */
  hideTabButton(tab: string): void {
    // Save in store
    this.#uiStateAdaptor.hideTabButton(tab);
  }

  /**
   * Sets the active footer bar tab.
   *
   * @param tab - The tab identifier to activate, or undefined to deactivate
   */
  setActiveFooterBarTab(tab: string | undefined): void {
    // Save in store
    this.#uiStateAdaptor.setActiveFooterBarTab(tab);
  }

  /**
   * Sets the active app bar tab with its open and focus trap states.
   *
   * @param tab - The tab identifier to activate, or undefined to deactivate
   * @param isOpen - Whether the tab panel is open
   * @param isFocusTrapped - Whether focus should be trapped in the panel
   */
  setActiveAppBarTab(tab: string | undefined, isOpen: boolean, isFocusTrapped: boolean): void {
    // Save in store
    this.#uiStateAdaptor.setActiveAppBarTab(tab, isOpen, isFocusTrapped);
  }

  /**
   * Sets the footer bar open state.
   *
   * @param isOpen - Whether the footer bar is open
   */
  setFooterBarIsOpen(isOpen: boolean): void {
    // Save in store
    this.#uiStateAdaptor.setFooterBarIsOpen(isOpen);
  }

  /**
   * Enables the focus trap with the given focus item properties.
   *
   * @param uiFocus - The focus item properties to apply
   */
  enableFocusTrap(uiFocus: FocusItemProps): void {
    // Save in store
    this.#uiStateAdaptor.enableFocusTrap(uiFocus);
  }

  /**
   * Disables the focus trap and optionally returns focus to a callback element.
   *
   * @param callbackElementId - Optional element ID to return focus to
   */
  disableFocusTrap(callbackElementId?: string): void {
    // Save in store
    this.#uiStateAdaptor.disableFocusTrap(callbackElementId);
  }

  /**
   * Sets the active state of the GeoView focus trap.
   *
   * @param active - Whether the GeoView trap is active
   */
  setActiveTrapGeoView(active: boolean): void {
    // Save in store
    this.#uiStateAdaptor.setActiveTrapGeoView(active);
  }

  /**
   * Sets the footer panel resize value.
   *
   * @param value - The resize value
   */
  setFooterPanelResizeValue(value: number): void {
    // Save in store
    this.#uiStateAdaptor.setFooterPanelResizeValue(value);
  }

  /**
   * Sets the circular progress indicator state.
   *
   * @param active - Whether the circular progress is active
   */
  setCircularProgress(active: boolean): void {
    // Save in store
    this.#uiStateAdaptor.setCircularProgress(active);
  }

  /**
   * Gets the current display language.
   *
   * @returns The current display language
   */
  getDisplayLanguage(): TypeDisplayLanguage {
    return this.#uiDomain.getLanguage();
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
      const promiseResetBasemap = MapEventProcessor.resetBasemap(mapId);

      // load guide in new language
      const promiseSetGuide = this.createGuide();

      // Remove all previous notifications to ensure there is no mix en and fr
      this.#uiStateAdaptor.removeAllNotifications();

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
    // Save in store
    this.#uiStateAdaptor.setDisplayTheme(theme);
  }

  /**
   * Sets the display date timezone after validation.
   *
   * @param displayDateTimezone - The IANA timezone identifier to set
   */
  setDisplayDateTimezone(displayDateTimezone: TimeIANA): void {
    // Validate the timezone
    DateMgt.validateTimezone(displayDateTimezone);

    // Save in store
    this.#uiStateAdaptor.setDisplayDateTimezone(displayDateTimezone);
  }

  /**
   * Sets the crosshair active state and updates WCAG map interactions accordingly.
   *
   * @param active - Whether the crosshair is active
   */
  setCrosshairActive(active: boolean): void {
    // Save in store
    this.#uiStateAdaptor.setCrosshairActive(active);

    // Because the map is focused/blured, we need to enable/disable the map interaction for WCAG
    MapEventProcessor.setActiveMapInteractionWCAG(this.getMapId(), active);
  }

  /**
   * Toggles the fullscreen state.
   *
   * When entering fullscreen, requests fullscreen on the provided element.
   * When exiting, preserves the current map extent by zooming back after the size change.
   *
   * @param status - Whether to enter or exit fullscreen
   * @param element - Optional HTML element to make fullscreen
   */
  setFullScreen(status: boolean, element?: TypeHTMLElement): void {
    // If entering fullscreen
    if (status && element) {
      // Request full screen on the element
      requestFullscreen(element);
    }

    // exit fullscreen
    if (!status) {
      // Store the extent before any size changes occur
      const currentExtent = this.getMapViewer().getView().calculateExtent();

      // Store the extent and other relevant information
      const handleSizeChange = (): void => {
        this.getMapViewer()
          .zoomToExtent(currentExtent, { padding: [0, 0, 0, 0] })
          .then(() => {
            // Force render
            this.getMapViewer().map.renderSync();
          })
          .catch((error: unknown) => {
            logger.logError('Error during zoom after fullscreen exit:', error);
          });
      };

      // Add the listener before exiting fullscreen
      this.getMapViewer().map.once('change:size', handleSizeChange);
      exitFullscreen();
    }

    // Save in store
    this.#uiStateAdaptor.setFullScreen(status);
  }

  /**
   * Adds a snackbar message of the specified type.
   *
   * @param type - The snackbar type (info, success, warning, or error)
   * @param messageKey - The translation key for the message
   * @param messageParams - Optional parameters for message interpolation
   * @param notification - Optional flag indicating whether to also create a notification
   */
  addMessage(type: SnackbarType, messageKey: string, messageParams?: unknown[], notification?: boolean): void {
    switch (type) {
      case 'info':
        this.getMapViewer().notifications.showMessage(messageKey, messageParams, notification);
        break;
      case 'success':
        this.getMapViewer().notifications.showSuccess(messageKey, messageParams, notification);
        break;
      case 'warning':
        this.getMapViewer().notifications.showWarning(messageKey, messageParams, notification);
        break;
      case 'error':
        this.getMapViewer().notifications.showError(messageKey, messageParams, notification);
        break;
      default:
        break;
    }
  }

  /**
   * Adds a notification to the notification center.
   *
   * @param notification - The notification details to add
   */
  addNotification(notification: NotificationDetailsType): void {
    // Save in store
    this.#uiStateAdaptor.addNotification(notification).catch((error: unknown) => {
      // Log
      logger.logPromiseFailed('uiController.addNotification in appState', error);
    });
  }

  /**
   * Removes a notification by its key.
   *
   * @param key - The notification key to remove
   */
  removeNotification(key: string): void {
    // Save in store
    this.#uiStateAdaptor.removeNotification(key);
  }

  /** Removes all notifications from the notification center. */
  removeAllNotifications(): void {
    // Save in store
    this.#uiStateAdaptor.removeAllNotifications();
  }

  /**
   * Creates the guide object from the current language and saves it in the store.
   *
   * @returns A promise that resolves when the guide has been created and stored
   */
  async createGuide(): Promise<void> {
    // Start guide loading tracker
    logger.logMarkerStart('map-guide');

    const mapId = this.getMapId();
    const language = this.#uiDomain.getLanguage();

    try {
      // Create the guide
      const guide = await createGuideObject(language, getStoreGeoviewAssetsURL(mapId));

      // Save in store
      this.#uiStateAdaptor.setGuide(guide);

      // Check guide loading tracker
      logger.logMarkerCheck('map-guide', 'for guide to be loaded');
    } catch (error: unknown) {
      // Log error
      logger.logError(mapId, error, 'createGuide');
    }
  }
}

/**
 * Hook to access the UI controller from the controller context.
 *
 * @returns The UI controller instance
 */
export function useUIController(): UIController {
  return useControllers().uiController;
}
