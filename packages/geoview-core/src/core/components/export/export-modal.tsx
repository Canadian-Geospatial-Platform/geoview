import { ChangeEvent, MouseEventHandler, RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import * as htmlToImage from 'html-to-image';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, LoadingButton, Skeleton, TextField, Menu, MenuItem } from '@/ui';
import { exportImage } from '@/core/utils/utilities';
import { DateMgt } from '@/core/utils/date-mgt';
import { useUIActiveAppBarTab, useUIActiveFocusItem, useUIStoreActions } from '@/core/stores/store-interface-and-intial-values/ui-state';
import { useGeoViewMapId } from '@/core/stores/geoview-store';
import { useAppGeoviewHTMLElement } from '@/core/stores/store-interface-and-intial-values/app-state';
import { NorthArrowIcon } from '@/core/components/north-arrow/north-arrow-icon';
import {
  useMapAttribution,
  useMapNorthArrow,
  useMapScale,
  useMapStoreActions,
} from '@/core/stores/store-interface-and-intial-values/map-state';
import { useManageArrow } from '@/core/components/north-arrow/hooks/useManageArrow';
import { logger } from '@/core/utils/logger';
import { useLayerLegendLayers } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { LegendContainer } from '@/core/components/export/export-legend-utils';
import { TypeLegendLayer } from '@/core/components/layers/types';
import { getSxClasses } from './export-modal-style';

interface TypeScale {
  scaleId: string;
  label: string;
  borderBottom: boolean;
}

const SCALE_MODES = {
  METRIC: 0,
  IMPERIAL: 1,
  NUMERIC: 2,
} as const;

/**
 * Export modal window component to export the viewer information in a PNG file
 *
 * @returns {JSX.Element} the export modal component
 */
export default function ExportModal(): JSX.Element {
  // Log
  logger.logTraceRender('components/export/export-modal');

  // Hooks
  const { t } = useTranslation();
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);

  // Store
  const mapId = useGeoViewMapId();
  const mapElement = useAppGeoviewHTMLElement();
  const mapViewport = mapElement.getElementsByClassName('ol-viewport')[0];
  const northArrow = useMapNorthArrow();
  const scale = useMapScale();
  const mapAttributions = useMapAttribution();
  const { getMapViewer } = useMapStoreActions();
  const { rotationAngle } = useManageArrow();
  const { disableFocusTrap, setActiveAppBarTab } = useUIStoreActions();
  const activeModalId = useUIActiveFocusItem().activeElementId;
  const { isOpen } = useUIActiveAppBarTab();

  // State & refs
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [isLegendLoading, setIsLegendLoading] = useState(true);
  const [isMapExporting, setIsMapExporting] = useState(false);
  const [exportTitle, setExportTitle] = useState<string>('');
  const [exportMapResolution, setExportMapResolution] = useState(150); // GV THE DPI of the exported map
  const [dpiMenuOpen, setDpiMenuOpen] = useState(false);
  const [dpiAnchorEl, setDpiAnchorEl] = useState<null | HTMLElement>(null);
  const [legendLayers, setLegendLayers] = useState<TypeLegendLayer[]>([]);
  const exportContainerRef = useRef(null) as RefObject<HTMLDivElement>;
  const mapImageRef = useRef(null) as RefObject<HTMLDivElement>;
  const dialogRef = useRef(null) as RefObject<HTMLDivElement>;
  const legendContainerRef = useRef(null) as RefObject<HTMLDivElement>;
  const textFieldRef = useRef(null) as RefObject<HTMLInputElement>;
  const exportTitleRef = useRef(null) as RefObject<HTMLDivElement>;

  const fileExportDefaultPrefixName = t('exportModal.fileExportDefaultPrefixName');
  const footerbarLegendContainer = mapElement.querySelector(`[id^="${mapId}-footerBar-legendContainer"]`);
  const appBarLegendContainer = mapElement.querySelector(`[id^="${mapId}-appBar-legendContainer"]`);

  // Get layers from the store
  const layersList = useLayerLegendLayers()
    .filter((layer) => {
      if (layer.items.length > 0) {
        return layer.layerStatus === 'loaded' && layer.items.some((item) => item.isVisible === true);
      }
      return layer.layerStatus === 'loaded';
    })
    .map((layer) => ({ ...layer, items: layer.items.filter((item) => item.isVisible === true) }));

  // Memoize values
  const scaleValues: TypeScale[] = useMemo(
    () => [
      {
        scaleId: '0',
        label: scale.labelGraphicMetric,
        borderBottom: true,
      },
      {
        scaleId: '1',
        label: scale.labelGraphicImperial,
        borderBottom: true,
      },
      {
        scaleId: '2',
        label: scale.labelNumeric,
        borderBottom: false,
      },
    ],
    [scale.labelGraphicMetric, scale.labelGraphicImperial, scale.labelNumeric]
  );

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

  /**
   * Export the map as an image.
   * This function hides the text field, updates the title, and captures the map and legend as an image.
   * It then resizes the image and triggers the download.
   */
  const exportMap = ((): void => {
    if (exportContainerRef?.current && textFieldRef.current && exportTitleRef.current) {
      // Hide the text field
      textFieldRef.current.style.display = 'none';

      // Update the title
      exportTitleRef.current.style.padding = '1rem';
      exportTitleRef.current.innerHTML = exportTitle;

      setIsMapExporting(true);

      const overviewMap = mapElement.getElementsByClassName('ol-overviewmap')[0] as HTMLDivElement;
      if (overviewMap) {
        overviewMap.style.display = 'none';
      }

      // Create a temporary container
      if (activeModalId === 'export' && mapImageRef.current && dialogRef.current) {
        const dialogBox = dialogRef.current;

        // Temporarily increase map size for better resolution
        const mapViewer = getMapViewer();
        if (mapViewer?.map) {
          const { map } = mapViewer;

          // Store original map state
          const mapSize = map.getSize();
          const viewResolution = map.getView().getResolution();

          // Calculate high-res map canvas dimensions based on current map size
          const printWidth = Math.round((mapSize![0] * exportMapResolution) / 96); // Convert from 96 DPI to export DPI value
          const printHeight = Math.round((mapSize![1] * exportMapResolution) / 96);

          map.once('rendercomplete', () => {
            // Create high-res canvas for just the resulting map that we will export
            const resultCanvas = document.createElement('canvas');
            resultCanvas.width = printWidth;
            resultCanvas.height = printHeight;
            const resultContext = resultCanvas.getContext('2d');
            if (!resultContext) return;

            // Transform the canvas to the higher resolution
            // GV There were three canvases, 2 are needed for the export to work properly
            // GV.CONT 1 for layers / text and 1 for geometry layers from the basemap
            // GV.CONT In the export-pdf ol example, they use '.ol-layer canvas' for the query, which misses the geom canvas
            Array.prototype.forEach.call(mapViewport.querySelectorAll('canvas'), (canvas: HTMLCanvasElement) => {
              const isOverviewCanvas = canvas.closest('.ol-overviewmap');
              // Ignore the overview map canvas since it's not exported
              if (!isOverviewCanvas && canvas.width > 0) {
                const { opacity } = (canvas.parentNode as HTMLElement).style;
                resultContext.globalAlpha = opacity === '' ? 1 : Number(opacity);

                // Calculate scale to fit the high-res canvas
                const scaleX = printWidth / canvas.width;
                const scaleY = printHeight / canvas.height;

                // Get the transform parameters from the style's transform matrix
                const { transform } = canvas.style;
                if (transform && transform !== 'none') {
                  const matrix = transform
                    .match(/^matrix\(([^(]*)\)$/)![1]
                    .split(',')
                    .map(Number);
                  // Apply the transform to the result map context
                  resultContext.setTransform(
                    matrix[0] * scaleX,
                    matrix[1] * scaleY,
                    matrix[2] * scaleX,
                    matrix[3] * scaleY,
                    matrix[4] * scaleX,
                    matrix[5] * scaleY
                  );
                } else {
                  resultContext.setTransform(scaleX, 0, 0, scaleY, 0, 0);
                }
                // Draw the map canvas onto our result canvas
                resultContext.drawImage(canvas, 0, 0, printWidth, printHeight);
              }
            });

            resultContext.globalAlpha = 1;
            resultContext.setTransform(1, 0, 0, 1, 0, 0);

            // Replace the map image in the preview with high-res version
            const mapImage = mapImageRef.current;
            if (mapImage) {
              mapImage.innerHTML = '';
              const img = new Image();
              img.src = resultCanvas.toDataURL('image/png');
              img.style.maxWidth = `${getCanvasWidth(dialogBox)}px`;
              mapImage.appendChild(img);
            }

            // Export the entire layout with high-res map
            const tempContainer = document.createElement('div');
            tempContainer.style.position = 'absolute';
            tempContainer.style.left = '-9999px';
            tempContainer.style.width = `${getCanvasWidth(dialogBox)}px`;

            // Clone the content
            if (!exportContainerRef.current) return;
            const clonedContent = exportContainerRef.current.cloneNode(true) as HTMLDivElement;

            tempContainer.appendChild(clonedContent);
            document.body.appendChild(tempContainer);

            // Small delay to ensure content is rendered
            setTimeout(() => {
              htmlToImage
                .toPng(clonedContent, {
                  backgroundColor: theme.palette.common.white,
                  fontEmbedCSS: '',
                  width: getCanvasWidth(dialogBox),
                  height: clonedContent.offsetHeight,
                  pixelRatio: 2,
                })
                .then((dataUrl) => {
                  // Reset map
                  setIsMapExporting(false);
                  map.setSize(mapSize);
                  map.getView().setResolution(viewResolution!);

                  // Clean up
                  document.body.removeChild(tempContainer);
                  exportImage(dataUrl, `${fileExportDefaultPrefixName}-${exportTitle !== '' ? exportTitle.trim() : mapId}`, 'png');
                  setActiveAppBarTab('legend', false, false);
                  disableFocusTrap();
                  if (overviewMap) {
                    overviewMap.style.display = '';
                  }
                })
                .catch((error: unknown) => {
                  setIsMapExporting(false);
                  if (overviewMap) {
                    overviewMap.style.display = '';
                  }
                  logger.logError('Error while exporting the image', error);
                });
            }, 100);
          });

          // Set print size (this triggers the high-DPI rendering)
          const printSize = [printWidth, printHeight];
          map.setSize(printSize);
          const scaling = Math.min(printWidth / mapSize![0], printHeight / mapSize![1]);
          map.getView().setResolution(viewResolution! / scaling);
        }
      }
    }
  }) as MouseEventHandler<HTMLButtonElement>;

  const handleCloseModal = (): void => {
    setActiveAppBarTab('legend', false, false);
    disableFocusTrap();
  };

  // Callback
  const getScaleWidth = useCallback(
    (mode: number): string => {
      switch (mode) {
        case SCALE_MODES.METRIC:
          return scale.lineWidthMetric;
        case SCALE_MODES.IMPERIAL:
          return scale.lineWidthImperial;
        default:
          return 'none';
      }
    },
    [scale.lineWidthMetric, scale.lineWidthImperial]
  );

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('Export Modal - mount');
    setLegendLayers(layersList);

    const overviewMap = mapElement.getElementsByClassName('ol-overviewmap')[0] as HTMLDivElement;

    let timer: NodeJS.Timeout;
    if (activeModalId === 'export' && mapImageRef.current && dialogRef.current) {
      const mapImage = mapImageRef.current;
      const dialogBox = dialogRef.current;

      if (overviewMap) overviewMap.style.visibility = 'hidden';

      // open legend in appbar when only appbar exists
      if (appBarLegendContainer && !footerbarLegendContainer) {
        setActiveAppBarTab('legend', false, false);
      }
      // Reason for timer, so that content of the export modal will be loaded
      // after modal is fully opened.
      timer = setTimeout(() => {
        setIsMapLoading(true);
        htmlToImage
          .toPng(mapViewport as HTMLElement, {
            fontEmbedCSS: '',
            pixelRatio: 4,
          })
          .then((dataUrl) => {
            setIsMapLoading(false);
            const img = new Image();
            img.src = dataUrl;
            img.style.maxWidth = `${getCanvasWidth(dialogBox)}px`;
            mapImage.appendChild(img);
          })
          .catch((error) => {
            logger.logError('Error occured while converting map to image', error);
          })
          .finally(() => {
            // Set back overview map visibility to true. Use a timeout so the html-to-image library can finish its work.
            // Just put the code in then does not work all the time
            setTimeout(() => {
              if (overviewMap) overviewMap.style.visibility = 'visible';
            }, 600);
          });
        setIsLegendLoading(false);
      }, 200);
    }
    return () => {
      if (timer) clearTimeout(timer);
      setIsMapLoading(true);
      setIsLegendLoading(true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeModalId, isOpen]);

  const handleDpiMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setDpiAnchorEl(event.currentTarget);
    setDpiMenuOpen(true);
  };

  const handleMenuClose = useCallback(() => {
    setDpiMenuOpen(false);
  }, [setDpiMenuOpen]);

  const handleSelectDpi = useCallback(
    (dpi: number) => {
      setExportMapResolution(dpi);
      handleMenuClose();
    },
    [handleMenuClose]
  );

  return (
    <Dialog open={activeModalId === 'export'} onClose={() => disableFocusTrap()} fullWidth maxWidth="xl" disablePortal>
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
          <Box ref={mapImageRef} sx={{ ...sxClasses.mapContainer }}>
            {isMapLoading && <Skeleton variant="rounded" width="100%" height={500} sx={{ bgcolor: theme.palette.grey[500] }} />}
          </Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ padding: '1rem', paddingBottom: 0 }}>
            <Box
              component="span"
              className="hasScaleLine interaction-static"
              sx={{
                ...getSxClasses(theme).scaleText,
                width: `${parseInt(getScaleWidth(0), 10) + 60}px`,
              }}
            >
              {scaleValues[0].label} {t('exportModal.approx')}
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

          {/* Legend display using new React component */}
          <Box>
            {/* Render the legend hierarchy */}
            <LegendContainer layers={legendLayers} />
          </Box>
          <Box ref={legendContainerRef}>
            {isLegendLoading && <Skeleton variant="rounded" width="100%" height={500} sx={{ bgcolor: theme.palette.grey[500] }} />}
          </Box>
          <Box textAlign="center" key={t('mapctrl.disclaimer.message')} sx={{ ...sxClasses.disclaimerText }}>
            {t('mapctrl.disclaimer.message')}
          </Box>
          <Box textAlign="center">
            {mapAttributions.map((mapAttribution) => (
              <Box key={mapAttribution} sx={{ ...sxClasses.AttributionText }}>
                {mapAttribution}
              </Box>
            ))}
          </Box>
          <Box textAlign="center" sx={{ ...sxClasses.dateText }}>
            {DateMgt.formatDate(new Date(), 'YYYY-MM-DD, hh:mm:ss A')}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={sxClasses.dialogActions}>
        <Button
          onClick={handleCloseModal}
          type="text"
          size="small"
          role="button"
          tabIndex={-1}
          autoFocus
          aria-hidden="true"
          sx={sxClasses.buttonOutlined}
        >
          {t('exportModal.cancelBtn')}
        </Button>
        <Menu id="dpi-selection" open={dpiMenuOpen} onClose={handleMenuClose} anchorEl={dpiAnchorEl}>
          <MenuItem onClick={() => handleSelectDpi(96)}>96 {t('exportModal.dpiBtn')}</MenuItem>
          <MenuItem onClick={() => handleSelectDpi(150)}>150 {t('exportModal.dpiBtn')}</MenuItem>
          <MenuItem onClick={() => handleSelectDpi(300)}>300 {t('exportModal.dpiBtn')}</MenuItem>
        </Menu>
        <Button type="text" onClick={handleDpiMenuClick} variant="outlined" size="small" sx={sxClasses.buttonOutlined}>
          {t('exportModal.dpiBtn')}: {exportMapResolution}
        </Button>
        <LoadingButton
          loading={isMapExporting}
          variant="contained"
          onClick={exportMap}
          size="small"
          sx={sxClasses.buttonContained}
          disabled={isLegendLoading || isMapLoading}
        >
          {t('exportModal.exportBtn')}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
