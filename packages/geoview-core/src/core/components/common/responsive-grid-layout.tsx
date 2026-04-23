import type { ReactNode, Ref } from 'react';
import { useState, useCallback, forwardRef, useImperativeHandle, useEffect, useRef, useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import { useMediaQuery } from '@mui/material';
import type { SxProps } from '@mui/material/styles';
import { useTheme } from '@mui/material/styles';
import Markdown from 'markdown-to-jsx';

import { Box, FullscreenIcon, ButtonGroup, Button, Typography, IconButton } from '@/ui';
import { FocusTrap } from '@/ui';

import { ResponsiveGrid } from './responsive-grid';
import { getSxClasses } from './responsive-grid-layout-style';
import { getSxClasses as getGuideSxClasses } from '@/core/components/guide/guide-style';
import { FullScreenDialog } from './full-screen-dialog';
import { logger } from '@/core/utils/logger';
import { ArrowBackIcon, ArrowForwardIcon, CloseIcon, QuestionMarkIcon } from '@/ui/icons';
import { useStoreGeoViewMapId } from '@/core/stores/geoview-store';
import {
  useStoreAppGuide,
  useStoreAppIsFullscreenActive,
  useStoreAppShellContainer,
} from '@/core/stores/store-interface-and-intial-values/app-state';
import { useStoreUIActiveTrapGeoView, useStoreUIActiveFocusItem } from '@/core/stores/store-interface-and-intial-values/ui-state';
import type { TypeContainerBox } from '@/core/types/global-types';
import { CONTAINER_TYPE, TIMEOUT, LIGHTBOX_SELECTORS } from '@/core/utils/constant';

/** SxProps for the main row root container. */
// TODO: To prevent the right panel toolbar to be hidden on first click of group layer. There is still a jump on first selection
const MAIN_ROW_SX: SxProps = {
  flexGrow: 1,
  overflow: 'hidden',
  paddingTop: '30px',
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
  hideEnlargeBtn?: boolean;
  containerType: TypeContainerBox;
  titleFullscreen: string;
  toggleMode?: boolean;
}

/** Methods exposed by the ResponsiveGridLayout component via ref. */
interface ResponsiveGridLayoutExposedMethods {
  setIsRightPanelVisible: (isVisible: boolean) => void;
  setRightPanelFocus: () => void;
  closeBtnRef?: React.RefObject<HTMLButtonElement>;
}

/**
 * GV modal element IDs that can open within the right panel.
 *
 * These modals should prevent focus trapping when active to avoid
 * conflicts between the FocusTrap and modal's own focus management.
 * Note: Update this list if new modals are added that can open within the right panel.
 */
const MODAL_ELEMENT_IDS = ['layerDataTable', 'featureDetailDataTable'] as const;

/**
 * Two-panel responsive grid layout with guide, enlarge, and fullscreen support.
 *
 * @param props - ResponsiveGridLayout properties
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
      hideEnlargeBtn = false,
      containerType,
      titleFullscreen,
      toggleMode = false,
    }: ResponsiveGridLayoutProps,
    ref: Ref<ResponsiveGridLayoutExposedMethods>
  ) => {
    logger.logTraceRender('components/common/responsive-grid-layout forwardRef');

    // Hooks
    const { t } = useTranslation<string>();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    // Derive whether we have content (vs guide-only) from rightMain prop
    const hasContent = !!rightMain;

    // Ref for right panel
    const rightMainRef = useRef<HTMLDivElement>();

    // Refs for focus management
    const guideContainerRef = useRef<HTMLDivElement>(null);
    const guideToggleBtnRef = useRef<HTMLButtonElement>(null);
    const fullScreenBtnRef = useRef<HTMLButtonElement>(null);
    const closeBtnRef = useRef<HTMLButtonElement>(null);

    // Store
    const mapId = useStoreGeoViewMapId();
    const guide = useStoreAppGuide();
    const isFocusTrap = useStoreUIActiveTrapGeoView();
    const isMapFullScreen = useStoreAppIsFullscreenActive();
    const focusItem = useStoreUIActiveFocusItem();
    const shellContainer = useStoreAppShellContainer();

    // States
    const [isRightPanelVisible, setIsRightPanelVisible] = useState(false);
    const [isGuideOpen, setIsGuideOpen] = useState(false);
    const [isEnlarged, setIsEnlarged] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);

    /**
     * Notifies parent when right panel visibility changes.
     */
    useEffect(() => {
      logger.logTraceUseEffect('RESPONSIVE-GRID-LAYOUT - right panel visibility changed', isRightPanelVisible);
      onRightPanelVisibilityChanged?.(isRightPanelVisible);
    }, [isRightPanelVisible, onRightPanelVisibilityChanged]);

    /** Memoized sx class definitions for the responsive layout. */
    const memoSxClasses = useMemo(() => {
      logger.logTraceUseMemo('RESPONSIVE-GRID-LAYOUT - memoSxClasses', theme);
      return getSxClasses(theme);
    }, [theme]);

    /** Memoized sx class definitions for the guide panel. */
    const memoGuideSxClasses = useMemo(() => {
      logger.logTraceUseMemo('RESPONSIVE-GRID-LAYOUT - memoGuideSxClasses', theme);
      return getGuideSxClasses(theme);
    }, [theme]);

    /** Sx props for the left-top panel. */
    const leftTopSxProps = { zIndex: isFullScreen ? 'unset' : 200 };

    /** Sx props for the right-top panel. */
    const rightTopSxProps = { zIndex: isFullScreen ? 'unset' : 100, alignContent: 'flex-end' };

    /** Memoized sx for the right-top content box layout. */
    const memoRightTopContentSx = useMemo(
      () => {
        logger.logTraceUseMemo('RESPONSIVE-GRID-LAYOUT - memoRightTopContentSx', containerType, theme.breakpoints);

        return {
          display: 'flex',
          alignItems: containerType === CONTAINER_TYPE.APP_BAR ? 'end' : 'center',
          flexDirection: containerType === CONTAINER_TYPE.APP_BAR ? 'column' : 'row',
          gap: containerType === CONTAINER_TYPE.APP_BAR ? '10px' : '0',
          [theme.breakpoints.up('sm')]: {
            justifyContent: containerType === CONTAINER_TYPE.APP_BAR ? 'space-between' : 'right',
          },
          [theme.breakpoints.down('sm')]: {
            justifyContent: 'space-between',
          },
            width: '100%',
        };
      },
      [containerType, theme.breakpoints]
    );

    // Expose imperative methods to parent component
    useImperativeHandle(
      ref,
      function handleRef() {
        return {
          setIsRightPanelVisible: (isVisible: boolean) => setIsRightPanelVisible(isVisible),
          setRightPanelFocus: () => {
            if (isGuideOpen) return;

            // Focus close button if available and attached to DOM
            requestAnimationFrame(() => {
              if (closeBtnRef.current && document.contains(closeBtnRef.current)) {
                closeBtnRef.current.focus();
              }
            });
          },
          closeBtnRef,
        };
      },
      [isGuideOpen]
    );

    /**
     * Toggles guide visibility based on rightMain content availability.
     */
    useEffect(() => {
      logger.logTraceUseEffect('RESPONSIVE-GRID-LAYOUT - guide visibility toggle', rightMain, guideContentIds);
      if (rightMain) {
        setIsGuideOpen(false);
      } else if (guideContentIds) {
        setIsGuideOpen(true);
      } else {
        setIsGuideOpen(false);
      }
    }, [rightMain, guideContentIds]);

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
      // Don't close sub panel if guide is open - let the guide handle its own ESC
      if (isGuideOpen) {
        return;
      }

      // Check if lightbox is open - if so, don't close sub panel (lightbox will handle its own ESC)
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
    }, [isGuideOpen, hasContent, isRightPanelVisible, isFocusTrap, closeBtnRef, onRightPanelClosed]);

    /**
     * Handles click on the enlarge button.
     *
     * @param isEnlarge - Whether the panel should be enlarged
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
     * Toggles the guide panel open or closed.
     */
    const handleOpenGuide = useCallback((): void => {
      setIsGuideOpen((prev) => !prev);
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

      if (isGuideOpen) {
        // Use RAF for next frame
        requestAnimationFrame(() => {
          document.getElementById(`${mapId}-${containerType}-guide-close-btn`)?.focus();
        });
      }
    }, [isGuideOpen, mapId, containerType]);

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
     * Focuses the close button when the right panel becomes visible with content.
     */
    useEffect(() => {
      logger.logTraceUseEffect('RESPONSIVE-GRID-LAYOUT - focus close button when right panel visible', isRightPanelVisible, hasContent);
      if (isRightPanelVisible && hasContent && !isGuideOpen && closeBtnRef.current) {
        requestAnimationFrame(() => {
          closeBtnRef.current?.focus();
        });
      }
    }, [isRightPanelVisible, hasContent, isGuideOpen]);

    /**
     * Handles the enlarge toggle button click.
     */
    const handleEnlargeToggle = useCallback(() => {
      handleIsEnlarge(!isEnlarged);
    }, [isEnlarged, handleIsEnlarge]);

    /**
     * Handles the right panel close action, triggered by the close button or ESC key.
     */
    const handleClosePanel = useCallback(() => {
      setIsRightPanelVisible(false);
      onRightPanelClosed?.();
    }, [onRightPanelClosed]);

    /**
     * Toggles fullscreen mode for the right panel.
     */
    const handleToggleFullScreen = useCallback((): void => {
      setIsFullScreen((prev) => !prev);
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
          // Don't handle if guide is open - let guide handle it
          if (!isGuideOpen) {
            // Only trap ESC when the right panel can actually be closed via keyboard
            if (isFocusTrap && hasContent) {
              event.stopPropagation();
              event.preventDefault();
              handleEscapeKeyCallback();
            }
            // Otherwise, let ESC bubble up to parent handlers (e.g., main panel close)
          }
        }
      },
      [isFullScreen, isGuideOpen, isFocusTrap, hasContent, handleEscapeKeyCallback]
    );

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
          sx={{ boxShadow: 'none' }}
          onClick={handleEnlargeToggle}
          tooltip={isEnlarged ? t('dataTable.reduceBtn')! : t('dataTable.enlargeBtn')!}
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

      // Default condition for mobile or toggle mode
      let shouldShowCloseButton = (toggleMode && hasContent) || (isMobile && isRightPanelVisible);

      // In WCAG mode, show close button when there is content
      if (isFocusTrap) {
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
          startIcon={<CloseIcon sx={{ fontSize: theme.palette.geoViewFontSize.sm }} />}
          onClick={handleClosePanel}
          tooltip={t('general.closeSelection')!}
          aria-label={t('general.closeSelection')!}
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
          tooltip={t('guide.toggleGuide')!}
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
          tooltip={isFullScreen ? t('general.closeFullscreen')! : t('general.openFullscreen')!}
          aria-label={
            isGuideOpen
              ? t('general.fullScreenAriaLabel', { title: t('guide.title') })!
              : t('general.fullScreenAriaLabel', { title: titleFullscreen })!
          }
          startIcon={<FullscreenIcon />}
        >
          {t('general.fullScreen')!}
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
        // Remove Top/Haut anchor links when rendering individual sections in tabs
        .replace(/<a href="[^"]*">(Top|Haut de page)<\/a>/g, '');

      if (!content) return null;

      return (
        <Box
          ref={guideContainerRef}
          tabIndex={0}
          className="panel-content-container"
          sx={memoGuideSxClasses.guideContainer}
          onKeyDown={handleGuideKeyDown}
        >
          <Box
            className="guideBox"
            sx={{
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ...(memoGuideSxClasses.guideContainer as any)?.['& .guideBox'],
            }}
          >
            {/* Close button inside guide - shown when WCAG is enabled, not fullscreen, and no feature content is selected */}

            {isFocusTrap && !isFullScreen && hasContent && (
              <IconButton
                id={`${mapId}-${containerType}-guide-close-btn`}
                onClick={handleCloseGuide}
                sx={{
                  position: 'absolute',
                  top: 15,
                  right: 0,
                  zIndex: 1000,
                }}
                tabIndex={0}
                aria-label={t('guide.closeGuide')}
              >
                <CloseIcon />
              </IconButton>
            )}
            <Markdown options={{ wrapper: 'article' }}>{content}</Markdown>
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

      // Only trap focus when: WCAG mode on, right panel is visible, not fullscreen, has feature content, AND no modal is open within it
      const shouldTrapFocus = isFocusTrap && isRightPanelVisible && !isFullScreen && hasContent && !isModalOpen;

      // Wrap the content box in FocusTrap - control activation via 'open' prop
      // disableAutoFocus is used to prevent modals fighting for focus when opened
      const wrappedMainContent = (
        <FocusTrap open={shouldTrapFocus} disableAutoFocus>
          <Box
            ref={isGuideOpen ? undefined : rightMainRef}
            tabIndex={shouldTrapFocus ? -1 : undefined} // MUI will throw an error and automatically set this to -1 when box is focused
            sx={memoSxClasses.rightMainContent}
            className={`responsive-layout-right-main-content ${isGuideOpen ? 'guide-container' : ''}`}
            onKeyDown={handlePanelKeyDown}
          >
            <Box sx={memoSxClasses.rightButtonsContainer} className="guide-button-container">
              <ButtonGroup size="small" variant="outlined" aria-label={t('details.guideControls')!} className="guide-button-group">
                {!toggleMode && !hideEnlargeBtn && renderEnlargeButton()}
                {!!guideContentIds?.length && renderGuideButton()}
                {!isMapFullScreen && renderFullScreenButton()}
                {!!(leftMain || leftTop) && renderCloseButton()}
              </ButtonGroup>
            </Box>
            {!isGuideOpen && (
              <Box className="panel-content-container">
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
            onClose={(event, reason) => {
              // Don't close fullscreen if ESC was pressed while lightbox is open
              // The lightbox should handle ESC, not the fullscreen dialog
              if (reason === 'escapeKeyDown') {
                const isLightboxOpen = document.querySelector(LIGHTBOX_SELECTORS.ROOT) !== null;
                if (isLightboxOpen) {
                  // Let lightbox handle ESC - don't close fullscreen
                  return;
                }
              }

              // Otherwise, close fullscreen normally
              setIsFullScreen(false);
            }}
            title={isGuideOpen ? `${t('guide.title')} - ${titleFullscreen}` : titleFullscreen}
            onExited={() => {
              // Use onExited callback to restore focus to the fullscreen button after the dialog exit animation completes
              fullScreenBtnRef.current?.focus();
            }}
            container={shellContainer}
            disableEnforceFocus={true}
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
