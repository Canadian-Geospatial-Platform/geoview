import type { ReactNode, Ref } from 'react';
import { useState, useCallback, forwardRef, useImperativeHandle, useEffect, useRef, useMemo, useContext } from 'react';

import { useTranslation } from 'react-i18next';

import { useMediaQuery } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import { useTheme } from '@mui/material/styles';
import Markdown from 'markdown-to-jsx';

import { Box } from '@/ui/layout';
import { ArrowBackIcon, ArrowForwardIcon, CloseIcon, FullscreenIcon, QuestionMarkIcon } from '@/ui/icons';
import { ButtonGroup } from '@/ui/button-group/button-group';
import { Button } from '@/ui/button/button';
import { Typography } from '@/ui/typography/typography';
import { IconButton } from '@/ui/icon-button/icon-button';
import { FocusTrap } from '@/ui/mui-reexports/mui-reexports';
import type { SxStyles } from '@/ui/style/types';
import { composeSxProps } from '@/ui/style/types';

import { ResponsiveGrid } from './responsive-grid';
import { PanelFocusOwnerContext } from './focus-trap-container';
import { getSxClasses, TOP_PANEL_STYLES } from './responsive-grid-layout-style';
import { getSxClasses as getGuideSxClasses } from '@/core/components/guide/guide-style';
import { FullScreenDialog } from './full-screen-dialog';
import { useShellContainer } from '@/core/containers/shell-container-context';
import { logger } from '@/core/utils/logger';
import { transformMarkdownIds } from '@/core/utils/utilities';
import { useStoreGeoViewMapId } from '@/core/stores/geoview-store';
import { DomHelper } from '@/core/utils/dom-helper';
import {
  getStoreAppIsCrosshairsActive,
  useStoreAppGuide,
  useStoreAppIsCrosshairsActive,
  useStoreAppIsFullscreenActive,
} from '@/core/stores/states/app-state';
import { getStoreUIActiveAppBarTab, getStoreUIFocusItem, useStoreUIActiveTrapGeoView, useStoreUIActiveFocusItem } from '@/core/stores/states/ui-state';
import type { TypeContainerBox } from '@/core/types/global-types';
import { BUILT_IN_MODAL_IDS, CONTAINER_TYPE, TIMEOUT, LIGHTBOX_SELECTORS, TABS } from '@/core/utils/constant';

/** SxProps for the main row root container. */
// TODO: To prevent the right panel toolbar to be hidden on first click of group layer. There is still a jump on first selection
const MAIN_ROW_SX: SxProps = {
  flexGrow: 1,
  overflow: 'hidden',
};

/** Properties for the ResponsiveGridLayout component. */
interface ResponsiveGridLayoutProps {
  leftTop?: ReactNode;
  leftMain?: ReactNode;
  rightTop?: ReactNode;
  guideContentIds?: string[];
  rightMain: ReactNode;
  onIsEnlargeClicked?: (isEnlarge: boolean) => void;
  onGuideIsOpen?: (isGuideOpen: boolean) => void;
  onRightPanelClosed?: () => void;
  onRightPanelVisibilityChanged?: (isVisible: boolean) => void;
  onFullScreenChanged?: (isFullScreen: boolean) => void;
  hideEnlargeBtn?: boolean;
  containerType: TypeContainerBox;
  titleFullscreen: string;
  toggleMode?: boolean;
}

/** Methods exposed by the ResponsiveGridLayout component via ref. */
interface ResponsiveGridLayoutExposedMethods {
  /** Shows or hides the right panel. */
  setIsRightPanelVisible: (isVisible: boolean) => void;
  /** Sets focus on the right panel's close button (if guide is not open). */
  setRightPanelFocus: () => void;
  /** Closes the guide panel and clears auto-open state. */
  closeGuide: () => void;
  /** Closes the right panel and triggers the onRightPanelClosed callback. */
  closeRightPanel: () => void;
  /** Optional ref to the close button element. */
  closeBtnRef?: React.RefObject<HTMLButtonElement | null>;
}

/** Captures the interaction that requested entry into the right panel. */
interface RightPanelFocusRequest {
  /** Element focused when entry was requested. */
  activeElement: Element | undefined;
  /** Focus owner at the time of the request. */
  ownerId: string | false;
  /** Whether a left-panel selection explicitly requested entry. */
  explicitEntry: boolean;
}

/**
 * GV modal element IDs that can open within the right panel.
 *
 * These modals should prevent focus trapping when active to avoid
 * conflicts between the FocusTrap and modal's own focus management.
 * Note: Update this list if new modals are added that can open within the right panel.
 */
const MODAL_ELEMENT_IDS = [BUILT_IN_MODAL_IDS.LAYER_DATA_TABLE, BUILT_IN_MODAL_IDS.FEATURE_DETAIL_DATA_TABLE] as const;

/**
 * Creates the two-panel responsive grid layout with guide, enlarge, and fullscreen support.
 *
 * @param props - Properties defined in ResponsiveGridLayoutProps interface
 * @param ref - Ref exposing panel visibility and focus methods
 * @returns The responsive grid layout element
 */
const ResponsiveGridLayout = forwardRef(
  (
    {
      leftTop = null,
      leftMain = null,
      rightTop = null,
      rightMain = null,
      guideContentIds = [],
      onIsEnlargeClicked,
      onGuideIsOpen,
      onRightPanelClosed,
      onRightPanelVisibilityChanged,
      onFullScreenChanged,
      hideEnlargeBtn = false,
      containerType,
      titleFullscreen,
      toggleMode = false,
    }: ResponsiveGridLayoutProps,
    ref: Ref<ResponsiveGridLayoutExposedMethods>
  ): JSX.Element => {
    logger.logTraceRender('components/common/responsive-grid-layout forwardRef');

    // Hooks
    const { t } = useTranslation<string>();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    // Derive whether we have content (vs guide-only) from rightMain prop
    const hasContent = !!rightMain;

    // Ref for right panel
    const rightMainRef = useRef<HTMLDivElement>(null);

    // Refs for focus management
    const guideContainerRef = useRef<HTMLDivElement>(null);
    const guideToggleBtnRef = useRef<HTMLButtonElement>(null);
    const fullScreenBtnRef = useRef<HTMLButtonElement>(null);
    const closeBtnRef = useRef<HTMLButtonElement>(null);
    /** Tracks whether the guide was auto-opened (vs explicitly toggled by user). */
    const wasAutoOpenedRef = useRef(false);

    // Store
    const mapId = useStoreGeoViewMapId();
    const guide = useStoreAppGuide();
    const isCrosshairsActive = useStoreAppIsCrosshairsActive();
    const isFocusTrap = useStoreUIActiveTrapGeoView();
    const isMapFullScreen = useStoreAppIsFullscreenActive();
    const focusItem = useStoreUIActiveFocusItem();
    const panelFocusOwnerId = useContext(PanelFocusOwnerContext);
    const shellContainer = useShellContainer();

    // States
    const [isRightPanelVisible, setIsRightPanelVisible] = useState<boolean>(false);
    const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
    const [isEnlarged, setIsEnlarged] = useState<boolean>(false);
    const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
    const [rightPanelFocusRequest, setRightPanelFocusRequest] = useState<RightPanelFocusRequest>();

    // #region Handlers

    /**
     * Handles the right panel close action, triggered by the close button or ESC key.
     */
    const handleClosePanel = useCallback((): void => {
      setIsRightPanelVisible(false);
      // Also close the guide so it doesn't stay stuck open and mask the next selected layer's content
      setIsGuideOpen(false);
      wasAutoOpenedRef.current = false;
      onRightPanelClosed?.();
    }, [onRightPanelClosed]);

    /**
     * Notifies parent when right panel visibility changes.
     */
    useEffect(() => {
      logger.logTraceUseEffect('RESPONSIVE-GRID-LAYOUT - right panel visibility changed', isRightPanelVisible);
      onRightPanelVisibilityChanged?.(isRightPanelVisible);
    }, [isRightPanelVisible, onRightPanelVisibilityChanged]);

    /** Memoized sx class definitions for the responsive layout. */
    const memoSxClasses = useMemo((): SxStyles => {
      logger.logTraceUseMemo('RESPONSIVE-GRID-LAYOUT - memoSxClasses', theme);
      return getSxClasses(theme);
    }, [theme]);

    /** Memoized sx class definitions for the guide panel. */
    const memoGuideSxClasses = useMemo((): SxStyles => {
      logger.logTraceUseMemo('RESPONSIVE-GRID-LAYOUT - memoGuideSxClasses', theme);
      return getGuideSxClasses(theme);
    }, [theme]);

    /** Sx props for the left-top panel. */
    const leftTopSxProps = isFullScreen ? TOP_PANEL_STYLES.leftFullscreen : TOP_PANEL_STYLES.left;

    /** Sx props for the right-top panel. */
    const rightTopSxProps = isFullScreen ? TOP_PANEL_STYLES.rightFullscreen : TOP_PANEL_STYLES.right;

    /** Memoized sx for the right-top content box layout. */
    const memoRightTopContentSx = useMemo((): SxProps<Theme> | undefined => {
      logger.logTraceUseMemo('RESPONSIVE-GRID-LAYOUT - memoRightTopContentSx', containerType, theme.breakpoints);

      return composeSxProps(memoSxClasses.rightTopContent, containerType === CONTAINER_TYPE.APP_BAR && memoSxClasses.rightTopContentAppBar);
    }, [containerType, theme.breakpoints, memoSxClasses]);

    /**
     * Requests panel entry without letting later content updates or map blur create a new request.
     *
     * @param explicitEntry - Whether the user explicitly selected an entry in the left panel
     */
    const requestRightPanelFocus = useCallback(
      (explicitEntry: boolean): void => {
        const ownerId = getStoreUIFocusItem(mapId).activeElementId;
        if (getStoreAppIsCrosshairsActive(mapId) || (ownerId && ownerId !== panelFocusOwnerId)) {
          setRightPanelFocusRequest(undefined);
          return;
        }
        setRightPanelFocusRequest({ activeElement: DomHelper.getActiveElement(), ownerId, explicitEntry });
      },
      [mapId, panelFocusOwnerId]
    );

    // Expose imperative methods to parent component
    useImperativeHandle(
      ref,
      function handleRef(): ResponsiveGridLayoutExposedMethods {
        return {
          setIsRightPanelVisible: (isVisible: boolean): void => {
            setIsRightPanelVisible(isVisible);
            if (isVisible && !isRightPanelVisible) requestRightPanelFocus(false);
          },
          closeRightPanel: handleClosePanel,
          setRightPanelFocus: (): void => requestRightPanelFocus(true),
          closeGuide: () => {
            setIsGuideOpen(false);
            wasAutoOpenedRef.current = false;
          },
          closeBtnRef,
        };
      },
      [isRightPanelVisible, requestRightPanelFocus, handleClosePanel]
    );

    /**
     * Auto-opens guide when no content is available and guide content exists.
     *
     * Auto-closes if the guide was auto-opened and either:
     * - Content becomes available (rightMain is truthy), OR
     * - Guide content becomes unavailable (guideContentIds is empty/undefined)
     */
    useEffect(() => {
      logger.logTraceUseEffect('RESPONSIVE-GRID-LAYOUT - guide auto-open/close', rightMain, guideContentIds, wasAutoOpenedRef.current);

      // Determine if we have guide content to show
      const hasGuideContent = guideContentIds && guideContentIds.length > 0;

      // Auto-open: no content AND has guide content
      if (!rightMain && hasGuideContent && !isGuideOpen) {
        setIsGuideOpen(true);
        wasAutoOpenedRef.current = true;
      }

      // Auto-close: guide was auto-opened AND (content appears OR no guide content)
      if (wasAutoOpenedRef.current && (rightMain || !hasGuideContent)) {
        setIsGuideOpen(false);
        wasAutoOpenedRef.current = false;
      }
    }, [rightMain, guideContentIds, isGuideOpen]);

    /**
     * Notifies parent when guide open state changes.
     */
    useEffect(() => {
      logger.logTraceUseEffect('RESPONSIVE-GRID-LAYOUT - guide open state changed', isGuideOpen);
      onGuideIsOpen?.(isGuideOpen);
    }, [isGuideOpen, onGuideIsOpen]);

    /**
     * Resets enlarged state when the enlarge button is hidden.
     */
    useEffect(() => {
      logger.logTraceUseEffect('RESPONSIVE-GRID-LAYOUT - reset enlarged state', hideEnlargeBtn, isEnlarged);
      // if hideEnlargeBtn changes to true and isEnlarged is true, set isEnlarged to false
      if (hideEnlargeBtn && isEnlarged) {
        setIsEnlarged(false);
      }
    }, [hideEnlargeBtn, isEnlarged]);

    /**
     * Handles escape key to close the right sub-panel.
     *
     * When the right panel is open and has content, pressing ESC should close it. However, if the guide is open, or if certain modals are open within the right panel,
     * we want to prevent this behavior to avoid conflicts with their own focus management and ESC handling.
     */
    const handleEscapeKeyCallback = useCallback((): void => {
      // Don't close sub panel if guide is open - guide must close first
      if (isGuideOpen) {
        return;
      }

      // Check if lightbox is open - if so, don't close sub panel (lightbox will handle its own ESC)
      // The lightbox is a single page-wide overlay (yarl portal); a global check is intentional.
      // eslint-disable-next-line no-restricted-syntax
      const isLightboxOpen = document.querySelector(LIGHTBOX_SELECTORS.ROOT) !== null;
      if (isLightboxOpen) {
        return;
      }

      // Check if the sub-panel close button is available
      const shouldCloseSubPanel = hasContent && isRightPanelVisible && isFocusTrap;

      if (shouldCloseSubPanel) {
        // Trigger the sub-panel close button click if it exists
        if (closeBtnRef.current) {
          closeBtnRef.current.click();
        } else {
          // Fallback to direct close if button ref not available
          setIsRightPanelVisible(false);
          onRightPanelClosed?.();
        }
      }
    }, [isGuideOpen, hasContent, isRightPanelVisible, isFocusTrap, onRightPanelClosed]);

    /**
     * Handles click on the enlarge button.
     */
    const handleIsEnlarge = useCallback(
      (isEnlarge: boolean): void => {
        // Set the isEnlarge
        setIsEnlarged(isEnlarge);

        // Callback
        onIsEnlargeClicked?.(isEnlarge);
      },
      [onIsEnlargeClicked]
    );

    /**
     * Toggles the guide panel open or closed (user action).
     */
    const handleOpenGuide = useCallback((): void => {
      setIsGuideOpen((prev) => !prev);
      // Clear auto-opened flag - user is taking explicit control
      wasAutoOpenedRef.current = false;
    }, []);

    /**
     * Focus management for the guide close button using requestAnimationFrame.
     *
     * We use requestAnimationFrame instead of direct ref focus because:
     * 1. React's state updates are asynchronous - when setIsGuideOpen runs, the DOM isn't updated yet
     * 2. Even useEffect runs before the DOM is painted with the new elements
     * 3. requestAnimationFrame ensures we run the focus after the browser has painted the new DOM
     */
    useEffect(() => {
      // Log
      logger.logTraceUseEffect('LAYOUT - focus on close button when guide is open in WCAG');

      if (!isGuideOpen) return undefined;

      // Use RAF for next frame; cancel on cleanup so an unmounted map root is never queried
      const frame = requestAnimationFrame(() => {
        // Focus on the close button for the container type
        DomHelper.getGuideCloseButton(mapId, containerType)?.focus();
      });
      return (): void => {
        cancelAnimationFrame(frame);
      };
    }, [isGuideOpen, mapId, containerType]);

    /**
     * Notifies parent when fullscreen state changes.
     */
    useEffect(() => {
      logger.logTraceUseEffect('RESPONSIVE-GRID-LAYOUT - fullscreen state changed', isFullScreen);
      onFullScreenChanged?.(isFullScreen);
    }, [isFullScreen, onFullScreenChanged]);

    /**
     * Closes the guide and returns focus to the guide toggle button.
     */
    const handleCloseGuide = useCallback((): void => {
      setIsGuideOpen(false);
      setTimeout(() => {
        guideToggleBtnRef.current?.focus();
      }, TIMEOUT.guideReturnFocus);
    }, []);

    /**
     * Completes an intentional panel entry only while its owner and focus destination remain current.
     */
    useEffect(() => {
      logger.logTraceUseEffect('RESPONSIVE-GRID-LAYOUT - focus close button when right panel visible', isRightPanelVisible, hasContent);
      if (!rightPanelFocusRequest) return undefined;
      if (!isRightPanelVisible || isCrosshairsActive || isGuideOpen) {
        setRightPanelFocusRequest(undefined);
        return undefined;
      }
      if (hasContent && closeBtnRef.current) {
        const frame = requestAnimationFrame(() => {
          setRightPanelFocusRequest(undefined);
          const ownerId = getStoreUIFocusItem(mapId).activeElementId;
          if (ownerId !== rightPanelFocusRequest.ownerId || (ownerId && ownerId !== panelFocusOwnerId)) return;
          if (getStoreAppIsCrosshairsActive(mapId)) return;

          const closeButton = closeBtnRef.current;
          if (!closeButton?.isConnected || closeButton.disabled || !closeButton.getClientRects().length) return;
          if (window.getComputedStyle(closeButton).visibility !== 'visible') return;
          const activeElement = DomHelper.getActiveElement();
          const entryElement = rightPanelFocusRequest.activeElement;

          // Mobile entry hides the left panel, which can move its focus to the document body.
          const isHiddenEntryFallback =
            activeElement === closeButton.ownerDocument.body && !!entryElement && !entryElement.getClientRects().length;
          if (activeElement !== entryElement && !isHiddenEntryFallback) return;

          // Keyboard-query results do not authorize entry, even after focus has left the map.
          const appBarTab = getStoreUIActiveAppBarTab(mapId);
          const isKeyboardQuery =
            !rightPanelFocusRequest.explicitEntry &&
            containerType === CONTAINER_TYPE.APP_BAR &&
            appBarTab.isOpen &&
            appBarTab.tabId === TABS.DETAILS &&
            appBarTab.returnFocusToMap;
          if (isKeyboardQuery) return;

          closeButton.focus();
        });
        return (): void => cancelAnimationFrame(frame);
      }
      return undefined;
    }, [rightPanelFocusRequest, isRightPanelVisible, hasContent, isGuideOpen, isCrosshairsActive, mapId, containerType, panelFocusOwnerId]);

    /**
     * Handles the enlarge toggle button click.
     */
    const handleEnlargeToggle = useCallback((): void => {
      handleIsEnlarge(!isEnlarged);
    }, [isEnlarged, handleIsEnlarge]);

    /**
     * Toggles fullscreen mode for the right panel.
     */
    const handleToggleFullScreen = useCallback((): void => {
      setIsFullScreen((prev) => !prev);
    }, []);

    /**
     * Handles the fullscreen dialog close event.
     */
    const handleFullScreenClose = useCallback((event?: {}, reason?: 'escapeKeyDown' | 'backdropClick'): void => {
      if (reason === 'escapeKeyDown') {
        // The lightbox is a single page-wide overlay (yarl portal); a global check is intentional.
        // eslint-disable-next-line no-restricted-syntax
        const isLightboxOpen = document.querySelector(LIGHTBOX_SELECTORS.ROOT) !== null;
        if (isLightboxOpen) {
          return;
        }
      }
      setIsFullScreen(false);
    }, []);

    /**
     * Handles keyboard events within the guide container.
     */
    const handleGuideKeyDown = useCallback(
      (event: React.KeyboardEvent<HTMLDivElement>): void => {
        // Only handle ESC when not in fullscreen (fullscreen dialog handles its own ESC)
        if (event.key === 'Escape' && !isFullScreen) {
          // Only close if the close button would be visible
          if (isFocusTrap && hasContent) {
            // IMPORTANT: Stop propagation to prevent parent handlers from closing the sub panel
            event.stopPropagation();
            event.preventDefault();
            handleCloseGuide();
          }
        }
      },
      [isFullScreen, isFocusTrap, hasContent, handleCloseGuide]
    );

    /**
     * Handles escape key within the right panel to close it.
     */
    const handlePanelKeyDown = useCallback(
      (event: React.KeyboardEvent<HTMLDivElement>): void => {
        // Only handle ESC when not in fullscreen (fullscreen dialog handles its own ESC)
        if (event.key === 'Escape' && !isFullScreen) {
          // If guide is open, close guide first (handles ESC from outside guide container, like toolbar buttons)
          if (isGuideOpen) {
            event.stopPropagation();
            event.preventDefault();
            handleCloseGuide();
            return;
          }

          // Guide is closed - handle sub-panel close.
          // Keep this guard for keyboard event suppression; callback also guards actual close behavior.
          if (isFocusTrap && hasContent) {
            event.stopPropagation();
            event.preventDefault();
            handleEscapeKeyCallback();
          }
        }
      },
      [isFullScreen, isGuideOpen, isFocusTrap, hasContent, handleEscapeKeyCallback, handleCloseGuide]
    );

    // #endregion Handlers

    // If we're on mobile
    // TODO: CHECK - theme.breakpoints.down('md') returns a CSS media query string which is always truthy
    // TO.DOCONT: in a boolean context. This should probably use isMobile or useMediaQuery for proper responsive behavior?
    if (theme.breakpoints.down('md')) {
      if (!(leftMain || leftTop) && !isRightPanelVisible) {
        setIsRightPanelVisible(true);
      }
    }

    /**
     * Renders the enlarge/reduce button for the right panel.
     *
     * @returns The enlarge button, or null on mobile
     */
    const renderEnlargeButton = (): JSX.Element | null => {
      if (isMobile) {
        return null; // Return null if on small screens (down to md)
      }

      return (
        <Button
          makeResponsive
          type="text"
          size="small"
          variant="outlined"
          startIcon={isEnlarged ? <ArrowForwardIcon /> : <ArrowBackIcon />}
          sx={memoSxClasses.enlargeButton}
          onClick={handleEnlargeToggle}
          tooltip={isEnlarged ? t('dataTable.reduceBtn') : t('dataTable.enlargeBtn')}
        >
          {isEnlarged ? t('dataTable.reduceBtn') : t('dataTable.enlargeBtn')}
        </Button>
      );
    };

    /**
     * Renders the close button for the right panel.
     *
     * @returns The close button, or null when not applicable
     */
    const renderCloseButton = (): JSX.Element | null => {
      // Check conditions for hiding the button

      // Default condition for mobile or toggle mode.
      // In toggle mode (app bar) the close button is the only way back to the left list, so show it whenever the right
      // panel is open, even without feature content (e.g. while the guide is showing).
      let shouldShowCloseButton = (toggleMode && isRightPanelVisible) || (isMobile && isRightPanelVisible);

      // In WCAG mode, show close button when there is content
      if (isFocusTrap && !toggleMode) {
        shouldShowCloseButton = hasContent && isRightPanelVisible;
      } else if (isMobile) {
        shouldShowCloseButton = isRightPanelVisible;
      }
      if (!shouldShowCloseButton) {
        return null;
      }

      return (
        <Button
          ref={closeBtnRef}
          makeResponsive
          type="text"
          size="small"
          variant="outlined"
          color="primary"
          startIcon={<CloseIcon />}
          onClick={handleClosePanel}
          tooltip={t('general.closeSelection')}
          aria-label={t('general.closeSelection')}
        >
          {t('general.close')}
        </Button>
      );
    };

    /**
     * Renders the guide toggle button.
     *
     * @returns The guide button, or null if not applicable
     */
    const renderGuideButton = (): JSX.Element | null => {
      const isDisabled = isGuideOpen && !hasContent;

      return (
        <Button
          ref={guideToggleBtnRef}
          makeResponsive
          type="text"
          variant="outlined"
          size="small"
          onClick={handleOpenGuide}
          startIcon={<QuestionMarkIcon />}
          className={`guideButton ${isGuideOpen ? 'active' : ''}`}
          disabled={isDisabled}
          aria-pressed={!isDisabled ? isGuideOpen : undefined}
          tooltip={t('guide.toggleGuide')}
        >
          {t('general.guide')}
        </Button>
      );
    };

    /**
     * Renders the fullscreen toggle button.
     *
     * @returns The fullscreen button
     */
    const renderFullScreenButton = (): JSX.Element => {
      return (
        <Button
          ref={fullScreenBtnRef}
          makeResponsive
          type="text"
          variant="outlined"
          size="small"
          onClick={handleToggleFullScreen}
          tooltip={isFullScreen ? t('general.closeFullscreen') : t('general.openFullscreen')}
          aria-label={
            isGuideOpen
              ? t('general.fullScreenAriaLabel', { title: t('guide.title') })
              : t('general.fullScreenAriaLabel', { title: titleFullscreen })
          }
          startIcon={<FullscreenIcon />}
        >
          {t('general.fullScreen')}
        </Button>
      );
    };

    /**
     * Gets a nested object property by dot-separated path.
     *
     * We need this custom get function because some guide content is nested and we want to access it via dynamic keys in guideContentIds.
     * Lodash get doesn't work well with our content structure and types, so we have this simple custom implementation.
     *
     * @param obj - The object to traverse
     * @param path - Dot-separated property path
     * @returns The value at the path, or undefined if not found
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function customGet<T>(obj: any, path: string): T | undefined {
      if (obj === undefined || obj === null) {
        return undefined;
      }

      const keys: string[] = path.split('.');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let result: any = obj;
      keys.forEach((key) => {
        if (!(key in result)) {
          result = undefined;
          return;
        }
        result = result[key];
      });

      return result;
    }

    /**
     * Renders the guide content panel.
     *
     * @returns The guide element, or null if no content
     */
    const renderGuide = (): JSX.Element | null => {
      const content = guideContentIds
        ?.map((key) => {
          return customGet(guide?.footerPanel?.children, `${key}.content`);
        })
        .filter((item) => item !== undefined)
        // Use \n\n (blank line) so markdown-to-jsx treats each section as a new block
        .join('\n\n')
        // Remove back-to-top guide navigation links when rendering individual sections
        .replace(/<a[^>]*data-guide-nav="top"[^>]*>.*?<\/a>/g, '');
      if (!content) return null;

      // Transform IDs to be unique for this map/container instance
      const transformedContent = transformMarkdownIds(content, `${mapId}-${containerType}`);

      return (
        <Box
          ref={guideContainerRef}
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- scrollable guide region must be keyboard-focusable to scroll it (WCAG 2.1.1)
          tabIndex={0}
          className="panel-content-container"
          sx={memoGuideSxClasses.guideContainer}
          onKeyDown={handleGuideKeyDown}
        >
          <Box sx={memoGuideSxClasses.guideBox}>
            {/* Close button inside guide - shown when WCAG is enabled, not fullscreen, and no feature content is selected */}

            {isFocusTrap && !isFullScreen && hasContent && (
              <IconButton
                id={DomHelper.buildGuideCloseButtonId(mapId, containerType)}
                onClick={handleCloseGuide}
                sx={composeSxProps(
                  memoSxClasses.guideCloseBtn,
                  containerType === CONTAINER_TYPE.APP_BAR ? memoSxClasses.guideCloseBtnAppBar : undefined
                )}
                tabIndex={0}
                aria-label={t('guide.closeGuide')}
              >
                <CloseIcon />
              </IconButton>
            )}
            <Markdown options={{ wrapper: 'article' }}>{transformedContent}</Markdown>
          </Box>
        </Box>
      );
    };

    // Check if a modal is currently open within the right panel
    const isModalOpen = focusItem.activeElementId !== false && (MODAL_ELEMENT_IDS as readonly string[]).includes(focusItem.activeElementId);

    /**
     * Renders the right panel content with focus trap, fullscreen, and guide support.
     *
     * @returns The right panel content element
     */
    const renderRightContent = (): JSX.Element => {
      const content = !isGuideOpen ? rightMain : renderGuide();

      // Only the owning panel may activate this non-modal boundary.
      const shouldTrapFocus =
        isFocusTrap && isRightPanelVisible && !isFullScreen && hasContent && !isModalOpen && focusItem.activeElementId === panelFocusOwnerId;

      // Wrap the content box in FocusTrap - control activation via 'open' prop
      const wrappedMainContent = (
        <FocusTrap open={shouldTrapFocus} disableEnforceFocus disableAutoFocus disableRestoreFocus>
          <Box
            ref={isGuideOpen ? undefined : rightMainRef}
            tabIndex={shouldTrapFocus ? -1 : undefined} // MUI will throw an error and automatically set this to -1 when box is focused
            sx={memoSxClasses.rightMainContent}
            className={`responsive-layout-right-main-content ${isGuideOpen ? 'guide-container' : ''}`}
            onKeyDown={handlePanelKeyDown}
          >
            <Box sx={memoSxClasses.rightButtonsContainer}>
              <ButtonGroup size="small" variant="outlined" aria-label={t('details.guideControls')} sx={memoSxClasses.guideButtonGroup}>
                {!toggleMode && !hideEnlargeBtn && renderEnlargeButton()}
                {!!guideContentIds?.length && renderGuideButton()}
                {!isMapFullScreen && renderFullScreenButton()}
                {!!(leftMain || leftTop) && renderCloseButton()}
              </ButtonGroup>
            </Box>
            {!isGuideOpen && (
              <Box
                // The enclosing named panel provides context; avoid a redundant nested region landmark.
                // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- scrollable panel region must be keyboard-focusable to scroll it (WCAG 2.1.1)
                tabIndex={0}
                className="panel-content-container"
              >
                {content || <Typography className="noSelection">{t('layers.noSelection')}</Typography>}
              </Box>
            )}
            {isGuideOpen && (content || <Typography className="noSelection">{t('layers.noSelection')}</Typography>)}
          </Box>
        </FocusTrap>
      );

      // Conditionally render EITHER fullscreen OR regular content to prevent duplicate IDs in the DOM
      // Keep dialog mounted during exit transition by always rendering it
      return (
        <>
          <FullScreenDialog
            open={isFullScreen}
            onClose={handleFullScreenClose}
            title={isGuideOpen ? `${t('guide.title')} - ${titleFullscreen}` : titleFullscreen}
            onExited={() => {
              // Use onExited callback to restore focus to the fullscreen button after the dialog exit animation completes
              fullScreenBtnRef.current?.focus();
            }}
            container={shellContainer}
          >
            <Box sx={memoSxClasses.rightMainContent} className="responsive-layout-right-main-content fullscreen-mode">
              {content}
            </Box>
          </FullScreenDialog>
          {!isFullScreen && wrappedMainContent}
        </>
      );
    };

    return (
      <Box ref={ref} sx={memoSxClasses.container} className="responsive-layout-container">
        <ResponsiveGrid.Root sx={memoSxClasses.topRow} className="responsive-layout-top-row">
          <ResponsiveGrid.Left
            isRightPanelVisible={isRightPanelVisible}
            isEnlarged={isEnlarged}
            toggleMode={toggleMode}
            sxProps={leftTopSxProps}
            className="responsive-layout-left-top"
          >
            {/* This panel is hidden from screen readers when not visible */}
            {leftTop}
          </ResponsiveGrid.Left>
          <ResponsiveGrid.Right
            isRightPanelVisible={isRightPanelVisible}
            isEnlarged={isEnlarged}
            toggleMode={toggleMode}
            sxProps={rightTopSxProps}
            className="responsive-layout-right-top"
          >
            <Box sx={memoRightTopContentSx}>{rightTop ?? <Box />}</Box>
          </ResponsiveGrid.Right>
        </ResponsiveGrid.Root>
        <ResponsiveGrid.Root className="responsive-layout-main-row" sx={MAIN_ROW_SX}>
          <ResponsiveGrid.Left
            isEnlarged={isEnlarged}
            isRightPanelVisible={isRightPanelVisible}
            toggleMode={toggleMode}
            sxProps={memoSxClasses.gridLeftMain as SxProps}
            className="responsive-layout-left-main"
          >
            {leftMain}
          </ResponsiveGrid.Left>
          <ResponsiveGrid.Right
            isEnlarged={isEnlarged}
            isRightPanelVisible={isRightPanelVisible}
            toggleMode={toggleMode}
            sxProps={memoSxClasses.gridRightMain as SxProps}
            className="responsive-layout-right-main"
          >
            {renderRightContent()}
          </ResponsiveGrid.Right>
        </ResponsiveGrid.Root>
      </Box>
    );
  }
);
ResponsiveGridLayout.displayName = 'ResponsiveGridLayout';
export { ResponsiveGridLayout };
export type { ResponsiveGridLayoutExposedMethods };
