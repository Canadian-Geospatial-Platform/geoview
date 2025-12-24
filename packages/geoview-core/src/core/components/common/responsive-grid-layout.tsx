import type { ReactNode, Ref } from 'react';
import { useState, useCallback, forwardRef, useImperativeHandle, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useMediaQuery } from '@mui/material';
import type { SxProps } from '@mui/material/styles';
import { useTheme } from '@mui/material/styles';
import Markdown from 'markdown-to-jsx';
import { Box, FullscreenIcon, ButtonGroup, Button, Typography, IconButton } from '@/ui';
import { ResponsiveGrid } from './responsive-grid';
import { getSxClasses } from './responsive-grid-layout-style';
import { getSxClasses as getGuideSxClasses } from '@/core/components/guide/guide-style';
import { FullScreenDialog } from './full-screen-dialog';
import { logger } from '@/core/utils/logger';
import { ArrowBackIcon, ArrowForwardIcon, CloseIcon, QuestionMarkIcon } from '@/ui/icons';
import { useGeoViewMapId } from '@/core/stores/geoview-store';
import { useAppGuide, useAppFullscreenActive } from '@/core/stores/store-interface-and-intial-values/app-state';
import {
  useUIActiveTrapGeoView,
  useUISelectedFooterLayerListItemId,
  useUIActiveFocusItem,
} from '@/core/stores/store-interface-and-intial-values/ui-state';
import type { TypeContainerBox } from '@/core/types/global-types';
import { CONTAINER_TYPE } from '@/core/utils/constant';
import { handleEscapeKey } from '@/core/utils/utilities';
import { FocusTrap } from '@/ui';

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
  containerType?: TypeContainerBox;
  toggleMode?: boolean;
}

interface ResponsiveGridLayoutExposedMethods {
  setIsRightPanelVisible: (isVisible: boolean) => void;
  setRightPanelFocus: () => void;
  closeBtnRef?: React.RefObject<HTMLButtonElement>;
}

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
      toggleMode = false,
    }: ResponsiveGridLayoutProps,
    ref: Ref<ResponsiveGridLayoutExposedMethods>
  ) => {
    logger.logTraceRender('components/common/responsive-grid-layout forwardRef');

    // Hooks
    const { t } = useTranslation<string>();
    const theme = useTheme();
    const isMapFullScreen = useAppFullscreenActive();
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
    const mapId = useGeoViewMapId();
    const guide = useAppGuide();
    const selectedFooterLayerListItemId = useUISelectedFooterLayerListItemId();
    const isFocusTrap = useUIActiveTrapGeoView();
    const focusItem = useUIActiveFocusItem();

    // States
    const [isRightPanelVisible, setIsRightPanelVisible] = useState(false);
    const [isGuideOpen, setIsGuideOpen] = useState(false);
    const [isEnlarged, setIsEnlarged] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);

    // Notify parent when right panel visibility changes
    useEffect(() => {
      onRightPanelVisibilityChanged?.(isRightPanelVisible);
    }, [isRightPanelVisible, onRightPanelVisibilityChanged]);

    // sxClasses
    const sxClasses = useMemo(() => getSxClasses(theme), [theme]);
    const guideSxClasses = useMemo(() => getGuideSxClasses(theme), [theme]);

    // Expose imperative methods to parent component
    useImperativeHandle(
      ref,
      function handleRef() {
        return {
          setIsRightPanelVisible: (isVisible: boolean) => setIsRightPanelVisible(isVisible),
          setRightPanelFocus: () => {
            if (isGuideOpen) return;

            // Focus close button if available, otherwise focus main content
            if (closeBtnRef.current) {
              // Use  requestAnimationFrame to ensure DOM is fully painted
              requestAnimationFrame(() => {
                closeBtnRef.current?.focus();
              });
            } else if (rightMainRef.current) {
              requestAnimationFrame(() => {
                if (rightMainRef.current) {
                  rightMainRef.current.tabIndex = 0;
                  rightMainRef.current.focus();
                }
              });
            }
          },
          closeBtnRef,
        };
      },
      [isGuideOpen]
    );

    useEffect(() => {
      if (rightMain) {
        setIsGuideOpen(false);
      } else if (guideContentIds) {
        setIsGuideOpen(true);
      } else {
        setIsGuideOpen(false);
      }
    }, [rightMain, guideContentIds]);

    useEffect(() => {
      onGuideIsOpen?.(isGuideOpen);
    }, [isGuideOpen, onGuideIsOpen]);

    // Auto-focus Close selection button when panel opens with content
    useEffect(() => {
      // Don't auto-focus on Close selection button if a modal is open (prevents stealing focus from modal restoration)
      // activeElementId is truthy (non-empty string) when a modal is active
      if (focusItem.activeElementId && focusItem.activeElementId !== '') {
        return;
      }

      // Only focus when: panel visible, has content, not showing guide, and close button exists
      if (isRightPanelVisible && hasContent && !isGuideOpen && closeBtnRef.current) {
        requestAnimationFrame(() => {
          closeBtnRef.current?.focus();
        });
      }
    }, [isRightPanelVisible, hasContent, isGuideOpen, focusItem.activeElementId]);

    useEffect(() => {
      // if hideEnlargeBtn changes to true and isEnlarged is true, set isEnlarged to false
      if (hideEnlargeBtn && isEnlarged) {
        setIsEnlarged(false);
      }
    }, [hideEnlargeBtn, isEnlarged]);

    // Callback to be executed after escape key is pressed.
    // When the right sub-panel is open, escape triggers the sub-panel close button.
    // When the right sub-panel is not open, escape closes the main panel.
    const handleEscapeKeyCallback = useCallback((): void => {
      // Don't close sub panel if guide is open - let the guide handle its own ESC
      if (isGuideOpen) {
        return;
      }

      // Check if the sub-panel close button is available (indicating the right panel is open and can be closed)
      // Close button is visible when there's feature content, the right panel is visible, and WCAG mode is on
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
      } else if (rightMainRef.current && selectedFooterLayerListItemId.length) {
        // Fall back to original focus management behavior (allows parent to handle closing the main panel)
        rightMainRef.current.tabIndex = -1;
      }
    }, [isGuideOpen, hasContent, isRightPanelVisible, isFocusTrap, closeBtnRef, selectedFooterLayerListItemId, onRightPanelClosed]);

    const handleKeyDown = useCallback(
      (event: KeyboardEvent): void => {
        // Check if we're in fullscreen mode - if so, don't handle escape here
        // The fullscreen dialog will handle it
        if (isFullScreen) {
          return;
        }
        handleEscapeKey(event.key, selectedFooterLayerListItemId, true, handleEscapeKeyCallback);
      },
      [handleEscapeKeyCallback, selectedFooterLayerListItemId, isFullScreen]
    );

    // return back the focus to layeritem for which right panel was opened.
    useEffect(() => {
      const rightPanel = rightMainRef.current;
      rightPanel?.addEventListener('keydown', handleKeyDown);

      return () => {
        rightPanel?.removeEventListener('keydown', handleKeyDown);
      };
    }, [handleKeyDown]);

    /**
     * Handles click on the Enlarge button.
     *
     * @param {boolean} isEnlarge Indicate if enlarge
     */
    const handleIsEnlarge = useCallback(
      (isEnlarge: boolean): void => {
        // Log
        logger.logTraceUseCallback('LAYOUT - handleIsEnlarge', isEnlarge);

        // Set the isEnlarge
        setIsEnlarged(isEnlarge);

        // Callback
        onIsEnlargeClicked?.(isEnlarge);
      },
      [onIsEnlargeClicked]
    );

    const handleOpenGuide = useCallback((): void => {
      // Log
      logger.logTraceUseCallback('LAYOUT - handleOpenGuide', !isGuideOpen);

      setIsGuideOpen(!isGuideOpen);
    }, [isGuideOpen]);

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
          document.getElementById(`layout-close-guide-${mapId}`)?.focus();
        });
      }
    }, [isGuideOpen, mapId]);

    // Add a handler to close the guide and return focus to the Guide button
    const handleCloseGuide = useCallback(() => {
      setIsGuideOpen(false);
      setTimeout(() => {
        guideToggleBtnRef.current?.focus();
      }, 200);
    }, []);

    // Add keyboard handler for guide
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

    // If we're on mobile
    if (theme.breakpoints.down('md')) {
      if (!(leftMain || leftTop) && !isRightPanelVisible) {
        setIsRightPanelVisible(true);
      }
    }

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
          onClick={() => handleIsEnlarge(!isEnlarged)}
          tooltip={isEnlarged ? t('dataTable.reduceBtn')! : t('dataTable.enlargeBtn')!}
        >
          {isEnlarged ? t('dataTable.reduceBtn') : t('dataTable.enlargeBtn')}
        </Button>
      );
    };

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
          onClick={() => {
            setIsRightPanelVisible(false);
            onRightPanelClosed?.();
          }}
          tooltip={t('details.closeSelection')!}
        >
          {t('dataTable.close')}
        </Button>
      );
    };

    const renderGuideButton = (): JSX.Element | null => {
      return (
        <Button
          ref={guideToggleBtnRef}
          makeResponsive
          type="text"
          variant="outlined"
          size="small"
          onClick={handleOpenGuide}
          tooltip={t('general.openGuide')!}
          startIcon={<QuestionMarkIcon />}
          className={`guideButton ${isGuideOpen ? 'active' : ''}`}
          disabled={isGuideOpen && !hasContent}
        >
          {t('general.guide')}
        </Button>
      );
    };

    const renderFullScreenButton = (): JSX.Element => {
      return (
        <Button
          ref={fullScreenBtnRef}
          makeResponsive
          type="text"
          variant="outlined"
          size="small"
          onClick={() => setIsFullScreen(!isFullScreen)}
          tooltip={isFullScreen ? t('general.closeFullscreen')! : t('general.openFullscreen')!}
          startIcon={<FullscreenIcon />}
        >
          {t('general.fullScreen')!}
        </Button>
      );
    };

    // added a customGet function to get nested object properties. _.get was not working for this kind of object
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

    const renderGuide = (): JSX.Element | null => {
      const content = guideContentIds
        ?.map((key) => {
          return customGet(guide?.footerPanel?.children, `${key}.content`);
        })
        .filter((item) => item !== undefined)
        .join('\n')
        // Remove Top/Haut anchor links when rendering individual sections in tabs
        .replace(/<a href="[^"]*">(Top|Haut de page)<\/a>/g, '');

      if (!content) return null;

      return (
        <Box
          ref={guideContainerRef}
          tabIndex={0}
          className="panel-content-container"
          sx={guideSxClasses.guideContainer}
          onKeyDown={handleGuideKeyDown}
        >
          <Box
            className="guideBox"
            sx={{
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ...(guideSxClasses.guideContainer as any)?.['& .guideBox'],
            }}
          >
            {/* Close button inside guide - shown when WCAG is enabled, not fullscreen, and no feature content is selected */}

            {isFocusTrap && !isFullScreen && hasContent && (
              <IconButton
                id={`layout-close-guide-${mapId}`}
                onClick={handleCloseGuide}
                sx={{
                  position: 'absolute',
                  top: 15,
                  right: 0,
                  zIndex: 1000,
                }}
                tabIndex={0}
                aria-label={t('guide.closeGuide') || 'Close guide'}
              >
                <CloseIcon />
              </IconButton>
            )}
            <Markdown options={{ wrapper: 'article' }}>{content}</Markdown>
          </Box>
        </Box>
      );
    };

    const renderRightContent = (): JSX.Element => {
      const content = !isGuideOpen ? rightMain : renderGuide();

      // Only trap focus when: WCAG mode on, right panel is visible, not fullscreen, has feature content, AND no modal is open
      const shouldTrapFocus = isFocusTrap && isRightPanelVisible && !isFullScreen && hasContent && !focusItem.activeElementId;

      // Build the main content box
      const mainContentBox = (
        <Box
          ref={isGuideOpen ? undefined : rightMainRef}
          tabIndex={shouldTrapFocus ? -1 : undefined} // MUI will throw an error and automatically set this to -1 when box is focused
          sx={sxClasses.rightMainContent}
          className={`responsive-layout-right-main-content ${isGuideOpen ? 'guide-container' : ''}`}
        >
          <Box sx={sxClasses.rightButtonsContainer} className="guide-button-container">
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
      );

      // Wrap the content box in FocusTrap if conditions are met
      const wrappedMainContent = shouldTrapFocus ? (
        <FocusTrap open={true} disableAutoFocus>
          {mainContentBox}
        </FocusTrap>
      ) : (
        mainContentBox
      );

      return (
        <>
          <FullScreenDialog
            open={isFullScreen}
            onClose={() => {
              setIsFullScreen(false);
            }}
            onExited={() => {
              // Use onExited callback to restore focus to the fullscreen button after the dialog exit animation completes
              fullScreenBtnRef.current?.focus();
            }}
          >
            <Box sx={sxClasses.rightMainContent} className="responsive-layout-right-main-content fullscreen-mode">
              {content}
            </Box>
          </FullScreenDialog>

          {wrappedMainContent}
        </>
      );
    };

    return (
      <Box ref={ref} sx={sxClasses.container} className="responsive-layout-container">
        <ResponsiveGrid.Root sx={sxClasses.topRow} className="responsive-layout-top-row">
          <ResponsiveGrid.Left
            isRightPanelVisible={isRightPanelVisible}
            isEnlarged={isEnlarged}
            aria-hidden={!isRightPanelVisible}
            toggleMode={toggleMode}
            sxProps={{ zIndex: isFullScreen ? 'unset' : 200 }}
            className="responsive-layout-left-top"
          >
            {/* This panel is hidden from screen readers when not visible */}
            {leftTop}
          </ResponsiveGrid.Left>
          <ResponsiveGrid.Right
            isRightPanelVisible={isRightPanelVisible}
            isEnlarged={isEnlarged}
            toggleMode={toggleMode}
            sxProps={{ zIndex: isFullScreen ? 'unset' : 100, alignContent: 'flex-end' }}
            className="responsive-layout-right-top"
          >
            <Box
              sx={{
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
              }}
            >
              {rightTop ?? <Box />}
            </Box>
          </ResponsiveGrid.Right>
        </ResponsiveGrid.Root>
        <ResponsiveGrid.Root
          className="responsive-layout-main-row"
          sx={{
            flexGrow: 1,
            overflow: 'hidden',
            paddingTop: '0',
          }}
        >
          <ResponsiveGrid.Left
            isEnlarged={isEnlarged}
            isRightPanelVisible={isRightPanelVisible}
            toggleMode={toggleMode}
            aria-hidden={!isRightPanelVisible}
            sxProps={sxClasses.gridLeftMain as SxProps}
            className="responsive-layout-left-main"
          >
            {leftMain}
          </ResponsiveGrid.Left>
          <ResponsiveGrid.Right
            isEnlarged={isEnlarged}
            isRightPanelVisible={isRightPanelVisible}
            toggleMode={toggleMode}
            sxProps={sxClasses.gridRightMain as SxProps}
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
