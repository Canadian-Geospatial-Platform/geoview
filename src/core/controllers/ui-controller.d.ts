import type { TypeDisplayLanguage, TypeDisplayTheme } from '@/api/types/map-schema-types';
import { AbstractMapViewerController } from '@/core/controllers/base/abstract-map-viewer-controller';
import { type FocusItemProps } from '@/core/stores/store-interface-and-intial-values/ui-state';
import { type TimeIANA } from '@/core/utils/date-mgt';
import type { TypeHTMLElement } from '@/core/types/global-types';
import type { SnackbarType } from '@/core/utils/notifications';
import type { NotificationDetailsType } from '@/core/components/notifications/notifications';
import type { UIDomain } from '@/core/domains/ui-domain';
import type { MapViewer } from '@/geo/map/map-viewer';
/**
 * Controller responsible for managing the UI state interactions.
 *
 * Extends AbstractMapViewerController and delegates state mutations to the UIStateAdaptor.
 */
export declare class UIController extends AbstractMapViewerController {
    #private;
    /**
     * Creates an instance of UIController.
     *
     * @param mapViewer - The map viewer instance
     * @param uiDomain - The UI domain instance
     */
    constructor(mapViewer: MapViewer, uiDomain: UIDomain);
    /**
     * Hooks the controller into action.
     */
    protected onHook(): void;
    /**
     * Unhooks the controller from the action.
     */
    protected onUnhook(): void;
    /**
     * Gets the current display language.
     *
     * @returns The current display language
     */
    getDisplayLanguage(): TypeDisplayLanguage;
    /**
     * Shows a tab button in the footer bar.
     *
     * @param tab - The tab identifier to show
     */
    showTabButton(tab: string): void;
    /**
     * Hides a tab button in the footer bar.
     *
     * @param tab - The tab identifier to hide
     */
    hideTabButton(tab: string): void;
    /**
     * Sets the active footer bar tab.
     *
     * @param tab - The tab identifier to activate, or undefined to deactivate
     */
    setActiveFooterBarTab(tab: string | undefined): void;
    /**
     * Sets the active app bar tab with its open and focus trap states.
     *
     * @param tab - The tab identifier to activate, or undefined to deactivate
     * @param isOpen - Whether the tab panel is open
     * @param isFocusTrapped - Whether focus should be trapped in the panel
     */
    setActiveAppBarTab(tab: string | undefined, isOpen: boolean, isFocusTrapped: boolean): void;
    /**
     * Sets the footer bar open state.
     *
     * @param isOpen - Whether the footer bar is open
     */
    setFooterBarIsOpen(isOpen: boolean): void;
    /**
     * Enables the focus trap with the given focus item properties.
     *
     * @param uiFocus - The focus item properties to apply
     */
    enableFocusTrap(uiFocus: FocusItemProps): void;
    /**
     * Disables the focus trap and optionally returns focus to a callback element.
     *
     * @param callbackElementId - Optional element ID to return focus to
     */
    disableFocusTrap(callbackElementId?: string): void;
    /**
     * Sets the active state of the GeoView focus trap.
     *
     * @param active - Whether the GeoView trap is active
     */
    setActiveTrapGeoView(active: boolean): void;
    /**
     * Sets the footer panel resize value.
     *
     * @param value - The resize value
     */
    setFooterPanelResizeValue(value: number): void;
    /**
     * Sets the circular progress indicator state.
     *
     * @param active - Whether the circular progress is active
     */
    setCircularProgress(active: boolean): void;
    /**
     * Sets the display language and reloads dependent resources.
     *
     * Resets the basemap, recreates the guide, and removes all notifications
     * to ensure consistent language across the application.
     *
     * @param lang - The display language to set
     * @returns A promise that resolves when all language-dependent resources have been reloaded
     */
    setDisplayLanguage(lang: TypeDisplayLanguage): Promise<void>;
    /**
     * Sets the display theme.
     *
     * @param theme - The display theme to set
     */
    setDisplayTheme(theme: TypeDisplayTheme): void;
    /**
     * Sets the display date timezone after validation.
     *
     * @param displayDateTimezone - The IANA timezone identifier to set
     */
    setDisplayDateTimezone(displayDateTimezone: TimeIANA): void;
    /**
     * Sets the crosshair active state and updates WCAG map interactions accordingly.
     *
     * @param active - Whether the crosshair is active
     */
    setCrosshairActive(active: boolean): void;
    /**
     * Activates or deactivates WCAG keyboard map interactions (pan and zoom).
     *
     * @param active - Whether to activate or deactivate keyboard interactions
     */
    setActiveMapInteractionWCAG(active: boolean): void;
    /**
     * Replaces the keyboard pan interaction with a new one using the specified pixel delta.
     *
     * @param panDelta - The pixel delta for keyboard panning
     */
    setMapKeyboardPanInteractions(panDelta: number): void;
    /**
     * Toggles the fullscreen state.
     *
     * When entering fullscreen, requests fullscreen on the provided element.
     * When exiting, preserves the current map extent by zooming back after the size change.
     *
     * @param status - Whether to enter or exit fullscreen
     * @param element - Optional HTML element to make fullscreen
     */
    setFullScreen(status: boolean, element?: TypeHTMLElement): void;
    /**
     * Adds a snackbar message of the specified type.
     *
     * @param type - The snackbar type (info, success, warning, or error)
     * @param messageKey - The translation key for the message
     * @param messageParams - Optional parameters for message interpolation
     * @param notification - Optional flag indicating whether to also create a notification
     */
    addMessage(type: SnackbarType, messageKey: string, messageParams?: unknown[], notification?: boolean): void;
    /**
     * Adds a notification to the notification center.
     *
     * @param notification - The notification details to add
     */
    addNotification(notification: NotificationDetailsType): void;
    /**
     * Removes a notification by its key.
     *
     * @param key - The notification key to remove
     */
    removeNotification(key: string): void;
    /** Removes all notifications from the notification center. */
    removeAllNotifications(): void;
    /**
     * Creates the guide object from the current language and saves it in the store.
     *
     * @returns A promise that resolves when the guide has been created and stored
     */
    createGuide(): Promise<void>;
}
/**
 * Hook to access the UI controller from the controller context.
 *
 * @returns The UI controller instance
 * @throws {Error} When used outside of a ControllerContext.Provider.
 */
export declare function useUIController(): UIController;
//# sourceMappingURL=ui-controller.d.ts.map