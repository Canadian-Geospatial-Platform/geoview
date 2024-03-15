import { ChangeEvent, MouseEventHandler, RefObject, useEffect, useRef, useState } from 'react';

import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';

import html2Canvas from 'html2canvas';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, LoadingButton, Skeleton, TextField } from '@/ui';
import { exportPNG } from '@/core/utils/utilities';
import { useUIActiveFocusItem, useUIStoreActions } from '@/core/stores/store-interface-and-intial-values/ui-state';
import { useGeoViewMapId } from '@/core/stores/geoview-store';
import { NorthArrowIcon, api, useMapAttribution, useMapNorthArrow, useMapScale } from '@/app';
import { logger } from '@/core/utils/logger';
import useManageArrow from '../north-arrow/hooks/useManageArrow';

/**
 * Export modal window component to export the viewer information in a PNG file
 *
 * @returns {JSX.Element} the export modal component
 */
export default function ExportModal(): JSX.Element {
  const { t } = useTranslation();
  const mapId = useGeoViewMapId();

  const theme = useTheme();

  const { map } = api.maps[mapId];
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
  const { closeModal } = useUIStoreActions();
  const activeModalId = useUIActiveFocusItem().activeElementId;

  const exportMap = ((): void => {
    if (exportContainerRef.current && textFieldRef.current && exportTitleRef.current) {
      textFieldRef.current.style.display = 'none';
      exportTitleRef.current.style.padding = '1rem';
      exportTitleRef.current.innerHTML = exportTitle;
      setIsMapExporting(true);
      html2Canvas(exportContainerRef.current).then((canvas: HTMLCanvasElement) => {
        exportPNG(canvas, mapId);
        setIsMapExporting(false);
        closeModal();
      });
    }
  }) as MouseEventHandler<HTMLButtonElement>;

  /**
   * Calculate the width of the canvas based on dialog box container width.
   * @param {HTMLDivElement} dialogBox container where canvas will be rendered.
   * @returns number
   */
  const getCanvasWidth = (dialogBox: HTMLDivElement) => {
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

      // Reason for timer, so that content of the export modal will be loaded
      // after modal is fully opened.
      timer = setTimeout(() => {
        // https://html2canvas.hertzen.com/configuration/
        setIsMapLoading(true);
        html2Canvas(map.getViewport()).then((canvas) => {
          setIsMapLoading(false);
          mapImage.appendChild(canvas);
        });

        // add legend
        const legendContainer = document.getElementById(`${mapId}-legendContainer`);
        if (legendContainer && legendContainerRef.current) {
          const styleObj = legendContainer.getAttribute('style')!;
          legendContainer.removeAttribute('style');
          setIsLegendLoading(true);
          html2Canvas(legendContainer, {
            backgroundColor: 'inherit',
            width: getCanvasWidth(dialogBox),
            windowWidth: getCanvasWidth(dialogBox),
          }).then((canvas) => {
            setIsLegendLoading(false);
            legendContainerRef.current?.appendChild(canvas);
            legendContainer.setAttribute('style', styleObj);
          });
        }
      }, 10);
    }
    return () => {
      if (timer) clearTimeout(timer);
      setIsMapLoading(true);
      setIsLegendLoading(true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeModalId]);

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
              sx={{ paddingBottom: '1rem', minWidth: 300 }}
            />
          </Box>
          <Box ref={exportTitleRef} />

          <Box ref={mapImageRef}>{isMapLoading && <Skeleton variant="rounded" width="100%" height={500} />}</Box>
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
          <Box ref={legendContainerRef}>{isLegendLoading && <Skeleton variant="rounded" width="100%" height={500} />}</Box>

          <Box textAlign="center">
            {mapAttributions.map((mapAttribution) => (
              <Box key={mapAttribution} component="p" sx={{ margin: 0 }}>
                {mapAttribution}
              </Box>
            ))}
          </Box>
          <Box textAlign="center" sx={{ marginBottom: '1rem' }}>
            {api.dateUtilities.formatDate(new Date(), 'YYYY-MM-DD, hh:mm:ss A')}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={closeModal} type="text" size="small" role="button" tabIndex={-1} autoFocus sx={{ width: 'inherit' }}>
          {t('exportModal.cancelBtn')}
        </Button>
        <LoadingButton
          loading={isMapExporting}
          variant="outlined"
          onClick={exportMap}
          size="small"
          sx={{ fontSize: theme.palette.geoViewFontSize.xs, padding: '0.7rem 1rem', backgroundColor: 'inherit' }}
          disabled={isLegendLoading || isMapLoading}
        >
          {t('exportModal.exportBtn')}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
