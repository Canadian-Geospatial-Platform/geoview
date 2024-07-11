import { ChangeEvent, MouseEventHandler, RefObject, useEffect, useRef, useState } from 'react';

import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import * as htmlToImage from 'html-to-image';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, LoadingButton, Skeleton, TextField } from '@/ui';
import { exportPNG } from '@/core/utils/utilities';
import { DateMgt } from '@/core/utils/date-mgt';
import { useActiveAppBarTab, useUIActiveFocusItem, useUIStoreActions } from '@/core/stores/store-interface-and-intial-values/ui-state';
import { useGeoViewMapId } from '@/core/stores/geoview-store';
import { useAppGeoviewHTMLElement } from '@/core/stores/store-interface-and-intial-values/app-state';
import { NorthArrowIcon } from '@/core/components/north-arrow/north-arrow-icon';
import { useMapAttribution, useMapNorthArrow, useMapScale } from '@/core/stores/store-interface-and-intial-values/map-state';
import useManageArrow from '@/core/components/north-arrow/hooks/useManageArrow';
import { logger } from '@/core/utils/logger';

/**
 * Export modal window component to export the viewer information in a PNG file
 *
 * @returns {JSX.Element} the export modal component
 */
export default function ExportModal(): JSX.Element {
  const { t } = useTranslation();
  const mapId = useGeoViewMapId();
  const mapElement = useAppGeoviewHTMLElement();
  const mapViewport = mapElement.getElementsByClassName('ol-viewport')[0];
  const footerbarLegendContainer = mapElement.querySelector(`[id^="${mapId}-footerBar-legendContainer"]`);
  const appBarLegendContainer = mapElement.querySelector(`[id^="${mapId}-appBar-legendContainer"]`);

  const theme = useTheme();

  const [isMapLoading, setIsMapLoading] = useState(true);
  const [isLegendLoading, setIsLegendLoading] = useState(true);
  const [isMapExporting, setIsMapExporting] = useState(false);

  // export template variables
  const [exportTitle, setExportTitle] = useState<string>('');
  const exportContainerRef = useRef(null) as RefObject<HTMLDivElement>;
  const mapImageRef = useRef(null) as RefObject<HTMLDivElement>;
  const dialogRef = useRef(null) as RefObject<HTMLDivElement>;
  const legendContainerRef = useRef(null) as RefObject<HTMLDivElement>;
  const textFieldRef = useRef(null) as RefObject<HTMLInputElement>;
  const exportTitleRef = useRef(null) as RefObject<HTMLDivElement>;

  const northArrow = useMapNorthArrow();
  const scale = useMapScale();
  const mapAttributions = useMapAttribution();

  const { rotationAngle } = useManageArrow();

  // get store function
  const { closeModal, setActiveAppBarTab } = useUIStoreActions();
  const activeModalId = useUIActiveFocusItem().activeElementId;
  const { isOpen } = useActiveAppBarTab();

  const exportMap = ((): void => {
    if (exportContainerRef.current && textFieldRef.current && exportTitleRef.current) {
      textFieldRef.current.style.display = 'none';
      exportTitleRef.current.style.padding = '1rem';
      exportTitleRef.current.innerHTML = exportTitle;
      setIsMapExporting(true);

      htmlToImage
        .toPng(exportContainerRef.current, { backgroundColor: theme.palette.common.white, fontEmbedCSS: '' })
        .then((dataUrl) => {
          setIsMapExporting(false);
          exportPNG(dataUrl, mapId);
          setActiveAppBarTab('AppbarPanelButtonLegend', 'legend', false);
          closeModal();
        })
        .catch((error: Error) => {
          logger.logError('Error while exporting the image', error);
        });
    }
  }) as MouseEventHandler<HTMLButtonElement>;

  const handleCloseModal = (): void => {
    setActiveAppBarTab('AppbarPanelButtonLegend', 'legend', false);
    closeModal();
  };
  /**
   * Calculate the width of the canvas based on dialog box container width.
   * @param {HTMLDivElement} dialogBox - Container where canvas will be rendered.
   * @returns {number} The canvas width
   */
  const getCanvasWidth = (dialogBox: HTMLDivElement): number => {
    const dialogBoxCompStyles = window.getComputedStyle(dialogBox);

    const paddingLeft = Number(dialogBoxCompStyles.getPropertyValue('padding-left').match(/\d+/)![0]);
    const paddingRight = Number(dialogBoxCompStyles.getPropertyValue('padding-left').match(/\d+/)![0]);

    return dialogBox.clientWidth - paddingLeft - paddingRight;
  };

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('Export Modal - mount');

    let timer: NodeJS.Timeout;
    if (activeModalId === 'export' && mapImageRef.current && dialogRef.current) {
      const mapImage = mapImageRef.current;
      const dialogBox = dialogRef.current;
      // open legend in appbar when only appbar exists
      if (appBarLegendContainer && !footerbarLegendContainer) {
        setActiveAppBarTab('AppbarPanelButtonLegend', 'legend', true);
      }
      // Reason for timer, so that content of the export modal will be loaded
      // after modal is fully opened.
      timer = setTimeout(() => {
        setIsMapLoading(true);
        htmlToImage
          .toPng(mapViewport as HTMLElement, { fontEmbedCSS: '' })
          .then((dataUrl) => {
            setIsMapLoading(false);
            const img = new Image();
            img.src = dataUrl;
            img.style.maxWidth = `${getCanvasWidth(dialogBox)}px`;
            mapImage.appendChild(img);
          })
          .catch((error: Error) => {
            logger.logError('Error occured while converting map to image', error);
          });

        // add legend
        // check if footer tab exist then we don't need appBar Legend.
        const legendContainer = (footerbarLegendContainer ?? appBarLegendContainer) as HTMLElement;
        if (legendContainer && legendContainerRef.current) {
          legendContainer.removeAttribute('style');
          setIsLegendLoading(true);
          // remove hidden attribute from document legend, so that html-to-image can copy the legend container.
          const legendTab = document.getElementById(`shell-${mapId}-legend`) as HTMLElement;
          const hasHiddenAttr = legendTab?.hasAttribute('hidden') ?? null;
          if (hasHiddenAttr) legendTab.removeAttribute('hidden');
          htmlToImage
            .toPng(legendContainer, { fontEmbedCSS: '' })
            .then((dataUrl) => {
              setIsLegendLoading(false);
              const img = new Image();
              img.src = dataUrl;
              img.style.maxWidth = `${getCanvasWidth(dialogBox)}px`;
              legendContainerRef.current?.appendChild(img);
              if (hasHiddenAttr) legendTab.hidden = true;
            })
            .catch((error: Error) => {
              logger.logError('Error occured while converting legend to image', error);
            });
        } else {
          setIsLegendLoading(false);
        }
      }, 500);
    }
    return () => {
      if (timer) clearTimeout(timer);
      setIsMapLoading(true);
      setIsLegendLoading(true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeModalId, isOpen]);

  return (
    <Dialog open={activeModalId === 'export'} onClose={closeModal} fullWidth maxWidth="xl" disablePortal>
      <DialogTitle>{t('exportModal.title')}</DialogTitle>
      <DialogContent dividers ref={dialogRef}>
        <Box ref={exportContainerRef} textAlign="center">
          <Box ref={textFieldRef}>
            <TextField
              label={t('exportModal.exportTitle')}
              variant="standard"
              value={exportTitle}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setExportTitle(e.target.value)}
              sx={{
                paddingBottom: '1rem',
                minWidth: 300,
                '& label + div': { marginTop: '0.5rem' },
              }}
            />
          </Box>
          <Box ref={exportTitleRef} />

          <Box ref={mapImageRef}>
            {isMapLoading && <Skeleton variant="rounded" width="100%" height={500} sx={{ bgcolor: theme.palette.grey[500] }} />}
          </Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ padding: '1rem', paddingBottom: 0 }}>
            <Box>
              {!!scale.labelGraphic.length && (
                <Box>
                  {scale.labelGraphic} {t('exportModal.approx')} <hr />
                </Box>
              )}
            </Box>
            {northArrow && (
              <Box
                textAlign="right"
                style={{
                  transform: `rotate(${rotationAngle.angle}deg)`,
                }}
              >
                <NorthArrowIcon width={44} height={44} />
              </Box>
            )}
          </Box>
          <Box ref={legendContainerRef}>
            {isLegendLoading && <Skeleton variant="rounded" width="100%" height={500} sx={{ bgcolor: theme.palette.grey[500] }} />}
          </Box>

          <Box textAlign="center">
            {mapAttributions.map((mapAttribution) => (
              <Box key={mapAttribution} component="p" sx={{ margin: 0 }}>
                {mapAttribution}
              </Box>
            ))}
          </Box>
          <Box textAlign="center" sx={{ marginBottom: '1rem' }}>
            {DateMgt.formatDate(new Date(), 'YYYY-MM-DD, hh:mm:ss A')}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={handleCloseModal}
          type="text"
          size="small"
          role="button"
          tabIndex={-1}
          autoFocus
          aria-hidden="true"
          sx={{
            width: 'inherit',
            fontSize: theme.palette.geoViewFontSize.sm,
            color: theme.palette.common.white,
            padding: '0.7rem 1rem',
            backgroundColor: theme.palette.geoViewColor.primary.main,
            '&:hover': {
              backgroundColor: theme.palette.geoViewColor.primary.dark[200],
            },
          }}
        >
          {t('exportModal.cancelBtn')}
        </Button>
        <LoadingButton
          loading={isMapExporting}
          variant="contained"
          onClick={exportMap}
          size="small"
          sx={{
            fontSize: theme.palette.geoViewFontSize.sm,
            padding: '0.7rem 1rem',
            backgroundColor: theme.palette.geoViewColor.primary.main,
            height: '47px',
          }}
          disabled={isLegendLoading || isMapLoading}
        >
          {t('exportModal.exportBtn')}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
