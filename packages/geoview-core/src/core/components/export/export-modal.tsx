import { ChangeEvent, MouseEventHandler, RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import * as htmlToImage from 'html-to-image';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, LoadingButton, Skeleton, TextField } from '@/ui';
import { exportPNG, delay } from '@/core/utils/utilities';
import { DateMgt } from '@/core/utils/date-mgt';
import { useUIActiveAppBarTab, useUIActiveFocusItem, useUIStoreActions } from '@/core/stores/store-interface-and-intial-values/ui-state';
import { useGeoViewMapId } from '@/core/stores/geoview-store';
import { useAppGeoviewHTMLElement } from '@/core/stores/store-interface-and-intial-values/app-state';
import { NorthArrowIcon } from '@/core/components/north-arrow/north-arrow-icon';
import { useMapAttribution, useMapNorthArrow, useMapScale } from '@/core/stores/store-interface-and-intial-values/map-state';
import { useManageArrow } from '@/core/components/north-arrow/hooks/useManageArrow';
import { logger } from '@/core/utils/logger';
import { useLayerLegendLayers } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { LegendContainer } from '@/core/components/export/export-legend-utils';
import { TypeLegendLayer } from '@/core/components/layers/types';
import { getSxClasses } from './export-modal-style';

/**
 * Export modal window component to export the viewer information in a PNG file
 *
 * @returns {JSX.Element} the export modal component
 */
export default function ExportModal(): JSX.Element {
  const { t } = useTranslation();
  const mapId = useGeoViewMapId();
  const fileExportDefaultPrefixName = t('exportModal.fileExportDefaultPrefixName');
  const mapElement = useAppGeoviewHTMLElement();
  const mapViewport = mapElement.getElementsByClassName('ol-viewport')[0];
  const footerbarLegendContainer = mapElement.querySelector(`[id^="${mapId}-footerBar-legendContainer"]`);
  const appBarLegendContainer = mapElement.querySelector(`[id^="${mapId}-appBar-legendContainer"]`);
  const legendId = `${mapId}AppbarPanelButtonLegend`;
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
  const { disableFocusTrap, setActiveAppBarTab } = useUIStoreActions();
  const activeModalId = useUIActiveFocusItem().activeElementId;
  const { isOpen } = useUIActiveAppBarTab();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);

  // Get layers from the store
  const layersList = useLayerLegendLayers()
    .filter((layer) => {
      if (layer.items.length > 0) {
        return layer.layerStatus === 'loaded' && layer.items.some((item) => item.isVisible === true);
      }
      return layer.layerStatus === 'loaded';
    })
    .map((layer) => ({ ...layer, items: layer.items.filter((item) => item.isVisible === true) }));

  // Set the legend layers
  const [legendLayers, setLegendLayers] = useState<TypeLegendLayer[]>([]);

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

  // resising image from dataurl
  async function resizeImageData(imageUri: string, inFileName: string): Promise<void> {
    const img = new Image();
    const imgCanvas = document.createElement('canvas');
    const ctx = imgCanvas.getContext('2d');

    img.addEventListener('load', () => {
      const dx = 0;
      const dy = 0;
      const dHeight = img.naturalHeight;

      // IMAGE TO CANVAS
      imgCanvas.width = img.naturalWidth;
      imgCanvas.height = dHeight;

      if (ctx) {
        // Optional: fill background if you want a color behind
        ctx.fillStyle = theme.palette.common.white; // or any background color
        ctx.fillRect(0, 0, imgCanvas.width, imgCanvas.height);
        ctx.drawImage(img, dx, dy); // Draw image to canvas
        const imgurl = imgCanvas.toDataURL('image/png');
        // Download png file from dataurl
        exportPNG(imgurl, inFileName);
      }
    });
    img.src = imageUri; // load image
    await delay(1500);
  }
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
  const exportMap = ((): void => {
    if (exportContainerRef?.current && textFieldRef.current && exportTitleRef.current) {
      // Hide the text field
      textFieldRef.current.style.display = 'none';

      // Update the title
      exportTitleRef.current.style.padding = '1rem';
      exportTitleRef.current.innerHTML = exportTitle;

      setIsMapExporting(true);

      // Create a temporary container
      if (activeModalId === 'export' && mapImageRef.current && dialogRef.current) {
        const dialogBox = dialogRef.current;
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'absolute';
        tempContainer.style.left = '-9999px';
        tempContainer.style.width = `${getCanvasWidth(dialogBox)}px`;

        // Clone the content
        const clonedContent = exportContainerRef.current.cloneNode(true) as HTMLDivElement;
        const legendContainer = clonedContent.querySelector(`#${mapId}-legend-container`) as HTMLElement;
        if (legendContainer) {
          legendContainer.style.width = `${getCanvasWidth(dialogBox)}px`;
        }
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
            })
            .then((dataUrl) => {
              setIsMapExporting(false);
              // Clean up
              document.body.removeChild(tempContainer);

              resizeImageData(dataUrl, `${fileExportDefaultPrefixName}-${exportTitle !== '' ? exportTitle.trim() : mapId}`)
                .then(() => {
                  setActiveAppBarTab(legendId, 'legend', false, false);
                  disableFocusTrap();
                })
                .catch((error) => {
                  logger.logError('Error while resizing the image', error);
                });
            })
            .catch((error) => {
              // Clean up on error too
              document.body.removeChild(tempContainer);
              setIsMapExporting(false);
              logger.logError('Error while exporting the image', error);
            });
        }, 100);
      }
    }
  }) as MouseEventHandler<HTMLButtonElement>;

  const handleCloseModal = (): void => {
    setActiveAppBarTab(legendId, 'legend', false, false);
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
    [scale.lineWidthMetric, scale.lineWidthImperial, SCALE_MODES.METRIC, SCALE_MODES.IMPERIAL]
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
        setActiveAppBarTab(legendId, 'legend', true, false);
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
          .catch((error) => {
            logger.logError('Error occured while converting map to image', error);
          });
        setIsLegendLoading(false);
      }, 100);
    }
    return () => {
      if (overviewMap) overviewMap.style.visibility = 'visible';

      if (timer) clearTimeout(timer);
      setIsMapLoading(true);
      setIsLegendLoading(true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeModalId, isOpen]);

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
          <Box ref={mapImageRef}>
            {isMapLoading && <Skeleton variant="rounded" width="100%" height={500} sx={{ bgcolor: theme.palette.grey[500] }} />}
          </Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ padding: '1rem', paddingBottom: 0 }}>
            <Box
              component="span"
              className="hasScaleLine interaction-static"
              sx={{
                ...getSxClasses(theme).scaleText,
                borderBottom: '1px solid',
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
          <Box textAlign="center" key={t('mapctrl.disclaimer.message')} component="p" sx={{ ...sxClasses.disclaimerText }}>
            {t('mapctrl.disclaimer.message')}
          </Box>
          <Box textAlign="center">
            {mapAttributions.map((mapAttribution) => (
              <Box key={mapAttribution} component="p" sx={{ ...sxClasses.AttributionText }}>
                {mapAttribution}
              </Box>
            ))}
          </Box>
          <Box textAlign="center" sx={{ ...sxClasses.dateText }}>
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
