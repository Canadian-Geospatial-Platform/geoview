import React, { useState, ReactNode, useCallback, forwardRef, useImperativeHandle, Ref, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import Markdown from 'markdown-to-jsx';
import { Box, FullscreenIcon, IconButton } from '@/ui';
import { ResponsiveGrid } from './responsive-grid';
import { useFooterPanelHeight } from './use-footer-panel-height';
import { getSxClasses } from './responsive-grid-layout-style';
import FullScreenDialog from './full-screen-dialog';
import { logger } from '@/core/utils/logger';
import { ArrowBackIcon, ArrowForwardIcon, QuestionMarkIcon } from '@/ui/icons';
import { Button } from '@/ui/button/button';
import { useAppGuide, useAppFullscreenActive } from '@/core/stores/store-interface-and-intial-values/app-state';
import { TypeContainerBox } from '@/core/types/global-types';
import { CONTAINER_TYPE } from '@/core/utils/constant';

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
    const theme = useTheme();
    const sxClasses = getSxClasses(theme);
    const { t } = useTranslation<string>();
    const guide = useAppGuide();
    const isMapFullScreen = useAppFullscreenActive();

    const [isRightPanelVisible, setIsRightPanelVisible] = useState(false);
    const [isGuideOpen, setIsGuideOpen] = useState(false);
    const [isEnlarged, setIsEnlarged] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);

    // Custom hook for calculating the height of footer panel
    const { leftPanelRef, rightPanelRef, panelTitleRef } = useFooterPanelHeight({ footerPanelTab: 'default' });

    // Expose imperative methods to parent component
    useImperativeHandle(ref, function handleRef() {
      return {
        setIsRightPanelVisible: (isVisible: boolean) => setIsRightPanelVisible(isVisible),
      };
    });

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

    /**
     * Handles click on the Enlarge button.
     *
     * @param {boolean} isEnlarge Indicate if enlarge
     */
    const handleIsEnlarge = useCallback(
      (isEnlarge: boolean): void => {
        // Log
        logger.logTraceUseCallback('LAYOUT - handleIsEnlarge');

        // Set the isEnlarge
        setIsEnlarged(isEnlarge);

        // Callback
        onIsEnlargeClicked?.(isEnlarge);
      },
      [onIsEnlargeClicked]
    );

    const handleOpenGuide = useCallback((): void => {
      if (guideContentIds) {
        setIsGuideOpen(true);
      }
    }, [setIsGuideOpen, guideContentIds]);

    // If we're on mobile
    if (theme.breakpoints.down('md')) {
      if (!(leftMain || leftTop) && !isRightPanelVisible && !fullWidth) {
        setIsRightPanelVisible(true);
      }
    }

    const renderEnlargeButton = (): JSX.Element => {
      return (
        <Button
          type="text"
          size="small"
          color="primary"
          variant="contained"
          className="buttonFilledOutline"
          startIcon={isEnlarged ? <ArrowForwardIcon /> : <ArrowBackIcon />}
          sx={{ height: '40px', borderRadius: '1.5rem', boxShadow: 'none', [theme.breakpoints.down('md')]: { display: 'none' } }}
          onClick={() => handleIsEnlarge(!isEnlarged)}
          tooltip={isEnlarged ? t('dataTable.reduceBtn')! : t('dataTable.enlargeBtn')!}
          tooltipPlacement="top"
        >
          {isEnlarged ? t('dataTable.reduceBtn') : t('dataTable.enlargeBtn')}
        </Button>
      );
    };

    const renderCloseButton = (): JSX.Element => {
      return (
        <Button
          type="text"
          size="small"
          color="primary"
          variant="contained"
          className="buttonFilledOutline"
          sx={{
            height: '40px',
            borderRadius: '1.5rem',
            marginLeft: '1rem',
            padding: '0 0.75rem',
            ...(fullWidth ? sxClasses.appBarEnlargeButton : sxClasses.footerBarEnlargeButton),
            ...(fullWidth && { display: !isRightPanelVisible ? 'none' : 'block' }),
            ...(!fullWidth && {
              [theme.breakpoints.up('md')]: { display: 'none' },
            }),
          }}
          onClick={() => setIsRightPanelVisible(false)}
          tooltip={t('dataTable.close') ?? ''}
          tooltipPlacement="top"
        >
          {t('dataTable.close')}
        </Button>
      );
    };

    const renderGuideButton = (): JSX.Element => {
      return (
        <IconButton
          disabled={isGuideOpen}
          sx={{
            width: '2.5rem',
            height: '2.5rem',
            [theme.breakpoints.down('md')]: { display: 'none' },
          }}
          size="small"
          onClick={() => handleOpenGuide()}
          tooltip={t('general.openGuide')!}
          className="buttonFilledOutline"
          color="primary"
        >
          <QuestionMarkIcon />
        </IconButton>
      );
    };

    const renderFullScreenButton = (): JSX.Element => {
      return (
        <IconButton
          size="small"
          onClick={() => setIsFullScreen(!isFullScreen)}
          tooltip={isFullScreen ? t('general.closeFullscreen')! : t('general.openFullscreen')!}
          className="buttonFilledOutline"
          color="primary"
        >
          <FullscreenIcon />
        </IconButton>
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
        .join('\n');

      if (!content) return null;

      return (
        <Box sx={{ padding: '20px', overflow: 'auto' }}>
          <Box className="guideBox">
            <Markdown options={{ wrapper: 'article' }}>{content}</Markdown>
          </Box>
        </Box>
      );
    };

    const renderRightContent = (): JSX.Element => {
      const content = !isGuideOpen ? rightMain : renderGuide();

      return (
        <>
          <FullScreenDialog open={isFullScreen} onClose={() => setIsFullScreen(false)}>
            <Box sx={sxClasses.rightGridContent} className="responsive-layout-right-main-content fullscreen-mode">
              {content}
            </Box>
          </FullScreenDialog>

          <Box
            sx={sxClasses.rightGridContent}
            className={isGuideOpen ? 'responsive-layout-right-main-content guide-container' : 'responsive-layout-right-main-content'}
          >
            {content}
          </Box>
        </>
      );
    };

    return (
      <Box ref={ref}>
        <ResponsiveGrid.Root sx={{ pt: 8, pb: 0 }} ref={panelTitleRef}>
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
            sxProps={{ zIndex: isFullScreen ? 'unset' : 100 }}
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
                [theme.breakpoints.down('md')]: { justifyContent: 'space-between' },
              }}
            >
              {rightTop ?? <Box />}

              <Box sx={sxClasses.rightButtonsContainer}>
                {!fullWidth && !hideEnlargeBtn && renderEnlargeButton()}
                {!!guideContentIds?.length && renderGuideButton()}
                {!isMapFullScreen && renderFullScreenButton()}
                {!!(leftMain || leftTop) && renderCloseButton()}
              </Box>
            </Box>
          </ResponsiveGrid.Right>
        </ResponsiveGrid.Root>
        <ResponsiveGrid.Root>
          <ResponsiveGrid.Left
            {...(!fullWidth && { ref: leftPanelRef })}
            isEnlarged={isEnlarged}
            isRightPanelVisible={isRightPanelVisible}
            fullWidth={fullWidth}
            aria-hidden={!isRightPanelVisible}
            sxProps={{ zIndex: isFullScreen ? 'unset' : 200 }}
            className="responsive-layout-left-main"
          >
            {leftMain}
          </ResponsiveGrid.Left>
          <ResponsiveGrid.Right
            {...(!fullWidth && { ref: rightPanelRef })}
            isEnlarged={isEnlarged}
            isRightPanelVisible={isRightPanelVisible}
            fullWidth={fullWidth}
            sxProps={{ zIndex: isFullScreen ? 'unset' : 100 }}
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
