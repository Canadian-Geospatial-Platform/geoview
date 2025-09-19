import { ChangeEvent, MouseEventHandler, RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import ReactDOMServer from 'react-dom/server';

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
import { ExportDocument } from './pdf-layout';

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

  /**
   * Export as PDF using React-PDF
   */
  const exportVectorPDF = (): void => {
    if (!exportContainerRef?.current || !textFieldRef.current || !exportTitleRef.current) return;

    setIsMapExporting(true);

    const overviewMap = mapElement.getElementsByClassName('ol-overviewmap')[0] as HTMLDivElement;
    if (overviewMap) overviewMap.style.display = 'none';

    if (activeModalId === 'export' && mapImageRef.current && dialogRef.current) {
      const mapViewer = getMapViewer();
      if (mapViewer?.map) {
        const { map } = mapViewer;
        const mapSize = map.getSize();
        if (!mapSize) return;

        // Capture map canvas (same as before)
        const printWidth = Math.round((mapSize[0] * exportMapResolution) / 96);
        const printHeight = Math.round((mapSize[1] * exportMapResolution) / 96);

        const resultCanvas = document.createElement('canvas');
        resultCanvas.width = printWidth;
        resultCanvas.height = printHeight;
        const resultContext = resultCanvas.getContext('2d');
        if (!resultContext) return;

        Array.prototype.forEach.call(mapViewport.querySelectorAll('canvas'), (canvas: HTMLCanvasElement) => {
          const isOverviewCanvas = canvas.closest('.ol-overviewmap');
          if (!isOverviewCanvas && canvas.width > 0) {
            const { opacity } = (canvas.parentNode as HTMLElement).style;
            resultContext.globalAlpha = opacity === '' ? 1 : Number(opacity);
            resultContext.drawImage(canvas, 0, 0, printWidth, printHeight);
          }
        });

        // Extract north arrow SVG paths
        let northArrowSvgPaths = null;
        if (northArrow) {
          try {
            const iconString = ReactDOMServer.renderToString(<NorthArrowIcon width={24} height={24} />);
            const parser = new DOMParser();
            const svgDoc = parser.parseFromString(iconString, 'image/svg+xml');
            const paths = svgDoc.querySelectorAll('path');

            if (paths.length > 0) {
              northArrowSvgPaths = Array.from(paths).map((path) => ({
                d: path.getAttribute('d'),
                fill: path.getAttribute('fill'),
                stroke: path.getAttribute('stroke'),
                strokeWidth: path.getAttribute('stroke-width'),
                transform: `rotate(${rotationAngle.angle} 12 12)`,
              }));
            }
          } catch (error) {
            logger.logError('Error extracting north arrow SVG', error);
          }
        }

        // Generate PDF
        const generatePDF = async () => {
          try {
            const mapDataUrl = resultCanvas.toDataURL('image/jpeg', 0.9);

            const blob = await pdf(
              <ExportDocument
                mapDataUrl={mapDataUrl}
                exportTitle={exportTitle}
                scaleText={`${scaleValues[0].label} ${t('exportModal.approx')}`}
                northArrowSvg={northArrowSvgPaths}
                legendLayers={legendLayers}
                disclaimer={t('mapctrl.disclaimer.message')}
                attributions={mapAttributions.slice(0, 2)}
                date={DateMgt.formatDate(new Date(), 'YYYY-MM-DD, hh:mm:ss A')}
              />
            ).toBlob();

            // Download
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${fileExportDefaultPrefixName}-${exportTitle !== '' ? exportTitle.trim() : mapId}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
          } catch (error: unknown) {
            logger.logError('Error generating PDF', error);
          } finally {
            setIsMapExporting(false);
            setActiveAppBarTab('legend', false, false);
            disableFocusTrap();
            if (overviewMap) {
              overviewMap.style.display = '';
            }
          }
        };

        generatePDF().catch((error) => logger.logError(error));
      }
    }
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
      if (overviewMap) overviewMap.style.display = 'none';

      // Create a temporary container
      if (activeModalId === 'export' && mapImageRef.current && dialogRef.current) {
        const dialogBox = dialogRef.current;

        // Temporarily increase map size for better resolution
        const mapViewer = getMapViewer();
        if (mapViewer?.map) {
          const { map } = mapViewer;

          // Store original map state
          const mapSize = map.getSize();

          // Calculate high-res map canvas dimensions based on current map size
          const printWidth = Math.round((mapSize![0] * exportMapResolution) / 96); // Convert from 96 DPI to export DPI value
          const printHeight = Math.round((mapSize![1] * exportMapResolution) / 96);

          // Create high-res canvas for just the resulting map that we will export
          const resultCanvas = document.createElement('canvas');
          resultCanvas.width = printWidth;
          resultCanvas.height = printHeight;
          const resultContext = resultCanvas.getContext('2d');
          if (!resultContext) return;

          // Capture and upsample current canvases
          // GV There were three canvases, 2 are needed for the export to work properly
          // GV.CONT 1 for layers / text and 1 for geometry layers from the basemap
          // GV.CONT In the export-pdf ol example, they use '.ol-layer canvas' for the query, which misses the geom canvas
          Array.prototype.forEach.call(mapViewport.querySelectorAll('canvas'), (canvas: HTMLCanvasElement) => {
            const isOverviewCanvas = canvas.closest('.ol-overviewmap');
            // Ignore the overview map canvas since it's not exported
            if (!isOverviewCanvas && canvas.width > 0) {
              const { opacity } = (canvas.parentNode as HTMLElement).style;
              resultContext.globalAlpha = opacity === '' ? 1 : Number(opacity);

              // Draw the map canvas onto our result canvas
              resultContext.drawImage(canvas, 0, 0, printWidth, printHeight);
            }
          });

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
                pixelRatio: exportMapResolution / 96,
              })
              .then((dataUrl) => {
                // Reset map
                setIsMapExporting(false);

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
        }
      }
    }
  }) as MouseEventHandler<HTMLButtonElement>;

  const handleCloseModal = (): void => {
    setActiveAppBarTab('legend', false, false);
    disableFocusTrap();
  };

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
          onClick={exportVectorPDF}
          size="small"
          sx={sxClasses.buttonContained}
          disabled={isLegendLoading || isMapLoading}
        >
          Export PDF
        </LoadingButton>
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
