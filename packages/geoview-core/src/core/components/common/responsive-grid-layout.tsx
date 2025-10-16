import type { ReactNode, Ref} from 'react';
import { useState, useCallback, forwardRef, useImperativeHandle, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { SxProps} from '@mui/material/styles';
import { useTheme } from '@mui/material/styles';
import Markdown from 'markdown-to-jsx';
import { Box, FullscreenIcon, ButtonGroup, Button, Typography, IconButton } from '@/ui';
import { ResponsiveGrid } from './responsive-grid';
import { getSxClasses } from './responsive-grid-layout-style';
import { FullScreenDialog } from './full-screen-dialog';
import { logger } from '@/core/utils/logger';
import { ArrowBackIcon, ArrowForwardIcon, CloseIcon, QuestionMarkIcon } from '@/ui/icons';
import { useGeoViewMapId } from '@/core/stores/geoview-store';
import { useAppGuide, useAppFullscreenActive } from '@/core/stores/store-interface-and-intial-values/app-state';
import { useUIActiveTrapGeoView, useUISelectedFooterLayerListItemId } from '@/core/stores/store-interface-and-intial-values/ui-state';
import type { TypeContainerBox } from '@/core/types/global-types';
import { CONTAINER_TYPE } from '@/core/utils/constant';
import { handleEscapeKey } from '@/core/utils/utilities';

interface ResponsiveGridLayoutProps {
  leftTop?: ReactNode;
  leftMain?: ReactNode;
  rightTop?: ReactNode;
  guideContentIds?: string[];
  rightMain: ReactNode;
  fullWidth?: boolean;
  onIsEnlargeClicked?: (isEnlarge: boolean) => void;
  onGuideIsOpen?: (isGuideOpen: boolean) => void;
  hideEnlargeBtn?: boolean;
  containerType?: TypeContainerBox;
}

interface ResponsiveGridLayoutExposedMethods {
  setIsRightPanelVisible: (isVisible: boolean) => void;
  setRightPanelFocus: () => void;
}

const ResponsiveGridLayout = forwardRef(
  (
    {
      leftTop = null,
      leftMain = null,
      rightTop = null,
      rightMain = null,
      fullWidth = false,
      guideContentIds = [],
      onIsEnlargeClicked,
      onGuideIsOpen,
      hideEnlargeBtn = false,
      containerType,
    }: ResponsiveGridLayoutProps,
    ref: Ref<ResponsiveGridLayoutExposedMethods>
  ) => {
    logger.logTraceRender('components/common/responsive-grid-layout forwardRef');

    // Hooks
    const { t } = useTranslation<string>();
    const theme = useTheme();
    const isMapFullScreen = useAppFullscreenActive();

    // Ref for right panel
    const rightMainRef = useRef<HTMLDivElement>();

    // Refs for focus management
    const guideContainerRef = useRef<HTMLDivElement>(null);
    const guideToggleBtnRef = useRef<HTMLButtonElement>(null);
    const fullScreenBtnRef = useRef<HTMLButtonElement>(null);

    // Store
    const mapId = useGeoViewMapId();
    const guide = useAppGuide();
    const selectedFooterLayerListItemId = useUISelectedFooterLayerListItemId();
    const isFocusTrap = useUIActiveTrapGeoView();

    // States
    const [isRightPanelVisible, setIsRightPanelVisible] = useState(false);
    const [isGuideOpen, setIsGuideOpen] = useState(false);
    const [isEnlarged, setIsEnlarged] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);

    // sxClasses
    const sxClasses = useMemo(() => getSxClasses(theme, containerType!), [theme, containerType]);

    // Expose imperative methods to parent component
    useImperativeHandle(
      ref,
      function handleRef() {
        return {
          setIsRightPanelVisible: (isVisible: boolean) => setIsRightPanelVisible(isVisible),
          setRightPanelFocus: () => {
            if (rightMainRef.current && !isGuideOpen) {
              setTimeout(() => {
                if (rightMainRef.current) rightMainRef.current.tabIndex = 0;
                rightMainRef.current?.focus();
              }, 0);
            }
          },
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

    useEffect(() => {
      // if hideEnlargeBtn changes to true and isEnlarged is true, set isEnlarged to false
      if (hideEnlargeBtn && isEnlarged) {
        setIsEnlarged(false);
      }
    }, [hideEnlargeBtn, isEnlarged]);

    // Callback to be executed after escape key is pressed.
    const handleEscapeKeyCallback = useCallback((): void => {
      if (rightMainRef.current && selectedFooterLayerListItemId.length) {
        rightMainRef.current.tabIndex = -1;
      }
    }, [selectedFooterLayerListItemId]);

    const handleKeyDown = useCallback(
      (event: KeyboardEvent): void => handleEscapeKey(event.key, selectedFooterLayerListItemId, true, handleEscapeKeyCallback),
      [handleEscapeKeyCallback, selectedFooterLayerListItemId]
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

    // If we're on mobile
    if (theme.breakpoints.down('md')) {
      if (!(leftMain || leftTop) && !isRightPanelVisible && !fullWidth) {
        setIsRightPanelVisible(true);
      }
    }

    const renderEnlargeButton = (): JSX.Element | null => {
      if (window.innerWidth <= theme.breakpoints.values.md) {
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
      if (!fullWidth && (window.innerWidth >= theme.breakpoints.values.md || !isRightPanelVisible)) {
        return null;
      }

      return (
        <Button
          makeResponsive
          type="text"
          size="small"
          variant="outlined"
          color="primary"
          startIcon={<CloseIcon sx={{ fontSize: theme.palette.geoViewFontSize.sm }} />}
          onClick={() => setIsRightPanelVisible(false)}
          tooltip={t('details.closeSelection')!}
        >
          {t('dataTable.close')}
        </Button>
      );
    };

    const renderGuideButton = (): JSX.Element | null => {
      if (window.innerWidth <= theme.breakpoints.values.md) {
        return null; // Return null if on small screens (down to md)
      }

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
        // Remove links
        .replaceAll(/\[Top\]\(#.*?\)/g, '');

      if (!content) return null;

      return (
        <Box ref={guideContainerRef} tabIndex={0} sx={{ padding: '20px', overflow: 'auto' }}>
          <Box className="guideBox">
            {/* Close button, only shown WCAG is enabled and not fullScreen */}
            {(isFocusTrap && !isFullScreen) && (
              <IconButton
                id={`layout-close-guide-${mapId}`}
                onClick={handleCloseGuide}
                sx={{
                  position: 'absolute',
                  top: 15,
                  right: 15,
                  zIndex: 1000,
                }}
                tabIndex={0}
                aria-label={t('general.closeGuide') || 'Close guide'}
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

      return (
        <>
          <FullScreenDialog
            open={isFullScreen}
            onClose={() => {
              setIsFullScreen(false);
              fullScreenBtnRef.current?.focus();
            }}
          >
            <Box sx={sxClasses.rightMainContent} className="responsive-layout-right-main-content fullscreen-mode">
              {content}
            </Box>
          </FullScreenDialog>

          <Box
            ref={isGuideOpen ? undefined : rightMainRef}
            sx={sxClasses.rightMainContent}
            className={isGuideOpen ? 'responsive-layout-right-main-content guide-container' : 'responsive-layout-right-main-content'}
          >
            {content || <Typography className="noSelection">{t('layers.noSelection')}</Typography>}
          </Box>
        </>
      );
    };

    return (
      <Box ref={ref} sx={sxClasses.container} className="responsive-layout-container">
        <ResponsiveGrid.Root sx={{ pt: 8, pb: 0, paddingTop: '0' }} className="responsive-layout-top-row">
          {!fullWidth && (
            <ResponsiveGrid.Left
              isRightPanelVisible={isRightPanelVisible}
              isEnlarged={isEnlarged}
              aria-hidden={!isRightPanelVisible}
              sxProps={{ zIndex: isFullScreen ? 'unset' : 200 }}
              className="responsive-layout-left-top"
            >
              {/* This panel is hidden from screen readers when not visible */}
              {leftTop}
            </ResponsiveGrid.Left>
          )}
          <ResponsiveGrid.Right
            isRightPanelVisible={isRightPanelVisible}
            isEnlarged={isEnlarged}
            fullWidth={fullWidth}
            sxProps={{ zIndex: isFullScreen ? 'unset' : 100, alignContent: 'flex-end' }}
            className="responsive-layout-right-top"
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: fullWidth || containerType === CONTAINER_TYPE.APP_BAR ? 'end' : 'center',
                flexDirection: fullWidth || containerType === CONTAINER_TYPE.APP_BAR ? 'column' : 'row',
                gap: fullWidth || containerType === CONTAINER_TYPE.APP_BAR ? '10px' : '0',
                [theme.breakpoints.up('md')]: {
                  justifyContent: fullWidth || containerType === CONTAINER_TYPE.APP_BAR ? 'space-between' : 'right',
                },
                [theme.breakpoints.down('md')]: {
                  justifyContent: 'space-between',
                },
                width: '100%',
              }}
            >
              {rightTop ?? <Box />}

              <Box sx={sxClasses.rightButtonsContainer}>
                <ButtonGroup size="small" variant="outlined" aria-label="outlined button group">
                  {!fullWidth && !hideEnlargeBtn && renderEnlargeButton()}
                  {!!guideContentIds?.length && renderGuideButton()}
                  {!isMapFullScreen && renderFullScreenButton()}
                  {!!(leftMain || leftTop) && renderCloseButton()}
                </ButtonGroup>
              </Box>
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
            fullWidth={fullWidth}
            aria-hidden={!isRightPanelVisible}
            sxProps={sxClasses.gridLeftMain as SxProps}
            className="responsive-layout-left-main"
          >
            {leftMain}
          </ResponsiveGrid.Left>
          <ResponsiveGrid.Right
            isEnlarged={isEnlarged}
            isRightPanelVisible={isRightPanelVisible}
            fullWidth={fullWidth}
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
