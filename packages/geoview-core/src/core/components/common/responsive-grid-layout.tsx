import { useState, ReactNode, useCallback, forwardRef, useImperativeHandle, Ref } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import { Box, FullscreenIcon, IconButton } from '@/ui';
import { ResponsiveGrid } from './responsive-grid';
import { EnlargeButton } from './enlarge-button';
import { CloseButton } from './close-button';
import { useFooterPanelHeight } from './use-footer-panel-height';
import { getSxClasses } from './responsive-grid-layout-style';
import FullScreenDialog from './full-screen-dialog';
import { logger } from '@/core/utils/logger';

interface ResponsiveGridLayoutProps {
  leftTop?: ReactNode;
  leftMain?: ReactNode;
  rightTop?: ReactNode;
  rightMain: ReactNode;
  fullWidth?: boolean;
  onIsEnlargeClicked?: (isEnlarge: boolean) => void;
}

interface ResponsiveGridLayoutExposedMethods {
  setIsRightPanelVisible: (isVisible: boolean) => void;
}

const ResponsiveGridLayout = forwardRef(
  (
    { leftTop, leftMain, rightTop, rightMain, fullWidth, onIsEnlargeClicked }: ResponsiveGridLayoutProps,
    ref: Ref<ResponsiveGridLayoutExposedMethods>
  ) => {
    const theme = useTheme();
    const sxClasses = getSxClasses(theme);
    const { t } = useTranslation<string>();

    const [isRightPanelVisible, setIsRightPanelVisible] = useState(false);
    const [isEnlarged, setIsEnlarged] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);

    // Custom hook for calculating the height of footer panel
    const { leftPanelRef, rightPanelRef, panelTitleRef } = useFooterPanelHeight({ footerPanelTab: 'default' });

    // Expose imperative methods to parent component
    useImperativeHandle(ref, () => ({
      setIsRightPanelVisible: (isVisible: boolean) => setIsRightPanelVisible(isVisible),
    }));

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
    // // If we're on mobile
    if (theme.breakpoints.down('md')) {
      if (!(leftMain || leftTop) && !isRightPanelVisible && !fullWidth) {
        setIsRightPanelVisible(true);
      }
    }

    return (
      <Box ref={ref}>
        <ResponsiveGrid.Root sx={{ pt: 8, pb: 8 }} ref={panelTitleRef}>
          {!fullWidth && (
            <ResponsiveGrid.Left isRightPanelVisible={isRightPanelVisible} isEnlarged={isEnlarged} aria-hidden={!isRightPanelVisible}>
              {/* This panel is hidden from screen readers when not visible */}
              {leftTop}
            </ResponsiveGrid.Left>
          )}
          <ResponsiveGrid.Right isRightPanelVisible={isRightPanelVisible} isEnlarged={isEnlarged} fullWidth={fullWidth}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                [theme.breakpoints.up('md')]: { justifyContent: fullWidth ? 'space-between' : 'right' },
                [theme.breakpoints.down('md')]: { justifyContent: 'space-between' },
              }}
            >
              {rightTop ?? <div></div>}

              <Box sx={{ display: 'flex', flexDirection: 'row', gap: '0.6rem' }}>
                {!fullWidth && <EnlargeButton isEnlarged={isEnlarged} onSetIsEnlarged={handleIsEnlarge} />}
                <IconButton
                  size="small"
                  onClick={() => setIsFullScreen(!isFullScreen)}
                  tooltip={isFullScreen ? t('general.closeFullscreen')! : t('general.openFullscreen')!}
                  className="style2"
                  color="primary"
                >
                  <FullscreenIcon />
                </IconButton>
                {!!(leftMain || leftTop) && (
                  <CloseButton
                    isRightPanelVisible={isRightPanelVisible}
                    onSetIsRightPanelVisible={setIsRightPanelVisible}
                    fullWidth={fullWidth}
                    aria-label={t('general.close')}
                  />
                )}
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
          >
            {leftMain}
          </ResponsiveGrid.Left>
          <ResponsiveGrid.Right
            {...(!fullWidth && { ref: rightPanelRef })}
            isEnlarged={isEnlarged}
            isRightPanelVisible={isRightPanelVisible}
            fullWidth={fullWidth}
          >
            <FullScreenDialog open={isFullScreen} onClose={() => setIsFullScreen(false)}>
              <Box sx={sxClasses.rightGridContent} className="fullscreen-mode">
                {rightMain}
              </Box>
            </FullScreenDialog>

            <Box sx={sxClasses.rightGridContent}>{rightMain}</Box>
          </ResponsiveGrid.Right>
        </ResponsiveGrid.Root>
      </Box>
    );
  }
);

ResponsiveGridLayout.displayName = 'ResponsiveGridLayout';

ResponsiveGridLayout.defaultProps = {
  leftTop: null,
  leftMain: null,
  rightTop: null,
  fullWidth: false,
  onIsEnlargeClicked: undefined,
};

export { ResponsiveGridLayout };
export type { ResponsiveGridLayoutExposedMethods };
