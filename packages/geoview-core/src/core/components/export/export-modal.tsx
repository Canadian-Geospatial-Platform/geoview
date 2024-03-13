/* eslint-disable @typescript-eslint/no-unused-vars */
import { ChangeEvent, MouseEventHandler, MutableRefObject, RefObject, useEffect, useRef, useState } from 'react';

import { useTranslation } from 'react-i18next';

import html2Canvas from 'html2canvas';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@/ui';
import { exportPNG } from '@/core/utils/utilities';
import { useUIActiveFocusItem, useUIStoreActions } from '@/core/stores/store-interface-and-intial-values/ui-state';
import { useGeoViewMapId } from '@/core/stores/geoview-store';
import { NorthArrowIcon, api, useMapAttribution, useMapNorthArrow, useMapScale } from '@/app';

/**
 * Export modal window component to export the viewer information in a PNG file
 *
 * @returns {JSX.Element} the export modal component
 */
export default function ExportModal(): JSX.Element {
  const mapId = useGeoViewMapId();

  const { map } = api.maps[mapId];

  // export template variables
  const [exportTitle, setExportTitle] = useState<string>('');
  const exportCanvasRef = useRef(null) as RefObject<HTMLCanvasElement>;
  const exportContainerRef = useRef(null) as RefObject<HTMLDivElement>;
  const mapImageRef = useRef(null) as RefObject<HTMLDivElement>;
  const dialogRef = useRef(null) as RefObject<HTMLDivElement>;
  const legendContainerRef = useRef(null) as RefObject<HTMLDivElement>;
  const textFieldRef = useRef(null) as RefObject<HTMLInputElement>;
  const exportTitleRef = useRef(null) as RefObject<HTMLDivElement>;

  const northArrow = useMapNorthArrow();
  const scale = useMapScale();
  const mapAttributions = useMapAttribution();

  const { t } = useTranslation();

  // get store function
  const { closeModal } = useUIStoreActions();
  const activeModalId = useUIActiveFocusItem().activeElementId;

  const exportMap = ((): void => {
    if (exportContainerRef.current && textFieldRef.current && exportTitleRef.current) {
      textFieldRef.current.style.display = 'none';
      exportTitleRef.current.style.padding = '1rem';
      exportTitleRef.current.innerHTML = exportTitle;
      html2Canvas(exportContainerRef.current).then((canvas: HTMLCanvasElement) => {
        exportPNG(canvas, mapId);
      });
    }
    closeModal();
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
    if (activeModalId === 'export' && mapImageRef.current && dialogRef.current) {
      const mapImage = mapImageRef.current;
      const dialogBox = dialogRef.current;

      const mapSize = map.getSize();
      const height = mapSize![1];
      // https://html2canvas.hertzen.com/configuration/
      html2Canvas(map.getViewport()).then((canvas) => {
        mapImage.appendChild(canvas);
        const styleObj = `width: ${getCanvasWidth(dialogBox)}px; height: ${height}px`;
        mapImage.querySelector('canvas')?.setAttribute('style', styleObj);
      });

      // add legend
      const legendContainer = document.getElementById(`${mapId}-legendContainer`);
      if (legendContainer && legendContainerRef.current) {
        const styleObj = legendContainer.getAttribute('style')!;
        legendContainer.removeAttribute('style');
        html2Canvas(legendContainer, {
          backgroundColor: 'inherit',
          width: getCanvasWidth(dialogBox),
          windowWidth: getCanvasWidth(dialogBox),
        }).then((canvas) => {
          legendContainerRef.current?.appendChild(canvas);
          legendContainer.setAttribute('style', styleObj);
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeModalId]);

  return (
    <Dialog open={activeModalId === 'export'} onClose={closeModal} fullWidth maxWidth="lg" disablePortal>
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
          <Box id="mapImage" ref={mapImageRef} />
          <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ padding: '1rem' }}>
            <Box>
              {!!scale.labelGraphic.length && (
                <Box>
                  {scale.labelGraphic} {t('exportModal.approx')} <hr />
                </Box>
              )}
            </Box>
            <Box textAlign="right">
              <NorthArrowIcon width={44} height={44} />
            </Box>
          </Box>
          <Box ref={legendContainerRef} />

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
        <Button type="text" onClick={exportMap} role="button" tabIndex={-1} size="small" sx={{ width: 'inherit' }}>
          {t('exportModal.exportBtn')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
