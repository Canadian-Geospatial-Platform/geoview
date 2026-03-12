/*
Export Process Overview:
- Modal displays preview and handles user input (title, format, DPI, quality)
- Canvas layout (createCanvasMapUrls) generates raster images for preview/export
- PDF layout (createPDFMapUrl) generates vector PDFs for export only
- Both call utilities>getMapInfo for map preparation and legend processing

Key Processing Steps:
- getMapInfo captures map canvas, extracts scale/north arrow, processes legend data
- Map rotation handled by canvas transforms during capture
- Legend items filtered by visibility and flattened into hierarchy
- Document uses AUTO mode only - height calculated dynamically from rendered content

Legend Distribution Logic:
- Measures actual rendered height/width of each layer group in DOM
- Distributes groups into 2-4 columns based on available width (min 280px/column)
- Uses 2-step look-ahead optimization to balance column heights
- Column widths justify to fill available space without gaps
- All content fits on single auto-sized page (no overflow pages)
- Canvas/PDF rendering uses measured dimensions for consistent output
*/

import type { ChangeEvent, RefObject } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';

import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, LoadingButton, Skeleton, TextField, Menu, MenuItem } from '@/ui';
import type { TypeDisplayLanguage } from '@/api/types/map-schema-types';
import { useUIActiveFocusItem } from '@/core/stores/store-interface-and-intial-values/ui-state';
import { useGeoViewMapId } from '@/core/stores/geoview-store';
import {
  useAppDisplayLanguage,
  useAppGeoviewHTMLElement,
  useAppShellContainer,
} from '@/core/stores/store-interface-and-intial-values/app-state';
import { useLayerDateTemporalModes, useLayerDisplayDateFormats } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { exportFile } from '@/core/utils/utilities';

import { useUIController } from '@/core/controllers/ui-controller';
import type { TemporalMode, TypeDisplayDateFormat } from '@/core/utils/date-mgt';
import { createPDFMapUrl } from '@/core/components/export/pdf-layout';
import { createCanvasMapUrls } from '@/core/components/export/canvas-layout';
import { getSxClasses } from '@/core/components/export/export-modal-style';
import { TIMEOUT } from '@/core/utils/constant';
import { logger } from '@/core/utils/logger';

/** Supported export file formats. */
type FileFormat = 'pdf' | 'png' | 'jpeg';

/** Available JPEG quality options (percentage values). */
const QUALITY_OPTIONS = [50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100];

/** Properties for file export configuration. */
export interface FileExportProps {
  /** The language */
  language: TypeDisplayLanguage;
  /** The export title text. */
  exportTitle: string;
  /** The disclaimer text. */
  disclaimer: string;
  /** The export resolution in DPI. */
  dpi: number;
  /** Optional JPEG quality percentage. */
  jpegQuality?: number;
  /** The output file format. */
  format: FileFormat;
  /** Date display formats keyed by layer path. */
  layerDateFormats: Record<string, TypeDisplayDateFormat>;
  /** Temporal modes keyed by layer path. */
  layerDateTemporalModes: Record<string, TemporalMode>;
}

/**
 * Creates the export modal component for exporting the viewer information.
 *
 * @returns The export modal component
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
  const uiController = useUIController();
  const activeModalId = useUIActiveFocusItem().activeElementId;
  const shellContainer = useAppShellContainer();
  const language = useAppDisplayLanguage();
  const layerDateFormats = useLayerDisplayDateFormats();
  const layerDateTemporalModes = useLayerDateTemporalModes();

  // State & refs
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [isLegendLoading, setIsLegendLoading] = useState(true);
  const [isMapExporting, setIsMapExporting] = useState(false);
  const [exportTitle, setExportTitle] = useState<string>('');
  const [exportMapResolution, setExportMapResolution] = useState(300);
  const [exportFormat, setExportFormat] = useState<FileFormat>('png');
  const exportContainerRef = useRef(null) as RefObject<HTMLDivElement>;
  const [dpiMenuOpen, setDpiMenuOpen] = useState(false);
  const [dpiAnchorEl, setDpiAnchorEl] = useState<null | HTMLElement>(null);
  const [formatMenuOpen, setFormatMenuOpen] = useState(false);
  const [formatAnchorEl, setFormatAnchorEl] = useState<null | HTMLElement>(null);
  const [jpegQuality, setJpegQuality] = useState(90); // Default 90%
  const [qualityMenuOpen, setQualityMenuOpen] = useState(false);
  const [qualityAnchorEl, setQualityAnchorEl] = useState<null | HTMLElement>(null);
  const [pngPreviewUrls, setPngPreviewUrls] = useState<string[]>([]);
  const dialogRef = useRef(null) as RefObject<HTMLDivElement>;
  const titleInputRef = useRef<HTMLInputElement>(null);

  const fileExportDefaultPrefixName = t('exportModal.fileExportDefaultPrefixName');

  /**
   * Generates the export preview at maximum quality.
   *
   * @returns A promise that resolves when the preview generation is complete
   */
  const generatePreview = useCallback(async (): Promise<void> => {
    try {
      setIsMapLoading(true);
      const disclaimer = t('mapctrl.disclaimer.message');
      // Always generate at 300 DPI for best quality, browser will downsample for display
      // Export regenerates canvas at user-selected DPI anyway
      const pngUrl = await createCanvasMapUrls(mapId, {
        exportTitle: '',
        disclaimer,
        dpi: 300,
        format: 'jpeg',
        layerDateFormats,
        layerDateTemporalModes,
        language,
      });
      setPngPreviewUrls([pngUrl]);
      URL.revokeObjectURL(pngUrl);
    } catch (error) {
      logger.logError(error);
    } finally {
      setIsMapLoading(false);
      setIsLegendLoading(false);
    }
  }, [t, mapId, layerDateFormats, layerDateTemporalModes, language]);

  /**
   * Exports the file in the selected format and resolution.
   *
   * @returns A promise that resolves when the export process is complete
   */
  // Export the requested file
  const performExport = useCallback(async (): Promise<void> => {
    try {
      setIsMapExporting(true);
      const disclaimer = t('mapctrl.disclaimer.message');
      const dpi = exportFormat === 'pdf' ? 300 : exportMapResolution;

      // Sanitize filename: limit to 20 characters and remove special characters
      const sanitizedTitle = (exportTitle.trim() || mapId)
        .replace(/[^a-zA-Z0-9-_]/g, '_') // Replace special characters with underscore
        .replace(/_+/g, '_') // Collapse multiple underscores into one
        .substring(0, 35); // Limit to 35 characters
      const filename = `${fileExportDefaultPrefixName}-${sanitizedTitle}`;

      // TODO Find a way to use sx in the pdf/canvas-layout files.
      // TO.DO Probably would need to pass the theme to the createPDFMapUrl and createCanvasMapUrls here and in above generatePreview
      if (exportFormat === 'pdf') {
        const pdfUrl = await createPDFMapUrl(mapId, {
          exportTitle,
          disclaimer,
          dpi,
          format: exportFormat,
          layerDateFormats,
          layerDateTemporalModes,
          language,
        });
        exportFile(pdfUrl, filename, exportFormat);
        URL.revokeObjectURL(pdfUrl);
      } else {
        const imageUrl = await createCanvasMapUrls(mapId, {
          exportTitle,
          disclaimer,
          dpi,
          jpegQuality,
          format: exportFormat,
          layerDateFormats,
          layerDateTemporalModes,
          language,
        });
        exportFile(imageUrl, filename, exportFormat);
        URL.revokeObjectURL(imageUrl);
      }
    } catch (error) {
      logger.logError(`Error exporting ${exportFormat.toUpperCase()}`, error);
    } finally {
      setIsMapExporting(false);
      uiController.disableFocusTrap();
    }
  }, [
    uiController,
    exportFormat,
    exportMapResolution,
    exportTitle,
    fileExportDefaultPrefixName,
    jpegQuality,
    layerDateFormats,
    layerDateTemporalModes,
    language,
    mapId,
    t,
  ]);

  /**
   * Generates the image preview when the modal opens.
   */
  useEffect(() => {
    logger.logTraceUseEffect('EXPORT-MODAL - generatePreview useEffect');
    if (activeModalId !== 'export') return;

    // Reset loading states to show skeleton immediately when modal opens
    setIsMapLoading(true);
    setIsLegendLoading(true);

    const overviewMap = mapElement.getElementsByClassName('ol-overviewmap')[0] as HTMLDivElement;
    if (overviewMap) overviewMap.style.visibility = 'hidden';

    const timer = setTimeout(() => {
      generatePreview().catch((error) => logger.logError(error));
    }, TIMEOUT.exportPreview);

    return () => {
      clearTimeout(timer);
      if (overviewMap) overviewMap.style.visibility = 'visible';
    };
  }, [activeModalId, generatePreview, mapElement]);

  // #region HANDLERS

  /**
   * Handles closing the export modal.
   */
  // TODO: WCAG Issue #3222 - Review Disable Focus Trap Behaviour
  const handleCloseModal = useCallback(() => {
    // Defer disabling the focus trap to the next tick so the Dialog's own focus trap
    // has time to release before we attempt to restore focus via disableFocusTrap
    // (which uses the callbackElementId to re-focus the export button in the app bar).
    setTimeout(() => {
      uiController.disableFocusTrap();
    }, TIMEOUT.deferExecution);

    // Clear preview content so skeleton shows on next open
    setPngPreviewUrls([]);
    setIsMapLoading(false);
    setIsLegendLoading(false);
  }, [uiController]);

  /**
   * Handles triggering the export process.
   */
  const handleExport = useCallback((): void => {
    performExport().catch((error) => logger.logError(error));
  }, [performExport]);

  /**
   * Handles opening the format selection menu.
   */
  const handleFormatMenuClick = (event: React.MouseEvent<HTMLElement>): void => {
    setFormatAnchorEl(event.currentTarget);
    setFormatMenuOpen(true);
  };

  /**
   * Handles closing the format selection menu.
   */
  const handleFormatMenuClose = useCallback((): void => {
    setFormatMenuOpen(false);
  }, []);

  /**
   * Handles selecting a file format.
   *
   * @param format - The selected file format
   */
  const handleSelectFormat = useCallback(
    (format: FileFormat): void => {
      setExportFormat(format);
      if (format === 'pdf') {
        setExportMapResolution(300);
      }
      handleFormatMenuClose();
    },
    [handleFormatMenuClose]
  );

  /**
   * Handles opening the DPI selection menu.
   */
  const handleDpiMenuClick = (event: React.MouseEvent<HTMLElement>): void => {
    setDpiAnchorEl(event.currentTarget);
    setDpiMenuOpen(true);
  };

  /**
   * Handles closing the DPI selection menu.
   */
  const handleMenuClose = useCallback((): void => {
    setDpiMenuOpen(false);
  }, []);

  /**
   * Handles selecting a DPI value.
   *
   * @param dpi - The selected DPI value
   */
  const handleSelectDpi = useCallback(
    (dpi: number): void => {
      setExportMapResolution(dpi);
      handleMenuClose();
    },
    [handleMenuClose]
  );

  /**
   * Handles opening the quality selection menu.
   */
  const handleQualityMenuClick = (event: React.MouseEvent<HTMLElement>): void => {
    setQualityAnchorEl(event.currentTarget);
    setQualityMenuOpen(true);
  };

  /**
   * Handles closing the quality selection menu.
   */
  const handleQualityMenuClose = useCallback((): void => {
    setQualityMenuOpen(false);
  }, []);

  /**
   * Handles selecting a quality value.
   *
   * @param quality - The selected JPEG quality percentage
   */
  const handleSelectQuality = useCallback(
    (quality: number): void => {
      setJpegQuality(quality);
      handleQualityMenuClose();
    },
    [handleQualityMenuClose]
  );

  /**
   * Handles focusing the title input when the dialog opens.
   */
  const handleDialogEntered = useCallback((): void => {
    titleInputRef.current?.focus();
  }, []);

  // #endregion HANDLERS

  return (
    <Dialog
      id={`${mapId}-export-dialog`}
      open={activeModalId === 'export'}
      onClose={handleCloseModal}
      slotProps={{
        transition: {
          onEntered: handleDialogEntered, // Pass the handler within slotProps.transition
        },
      }}
      fullWidth
      maxWidth="xl"
      container={shellContainer}
    >
      <DialogTitle>{t('exportModal.title')}</DialogTitle>
      <DialogContent dividers ref={dialogRef}>
        {/* Title input */}
        <Box sx={sxClasses.title}>
          <TextField
            id={`${mapId}-export-title-input`}
            inputRef={titleInputRef}
            label={t('exportModal.exportTitle')}
            variant="standard"
            value={exportTitle}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setExportTitle(e.target.value)}
            sx={sxClasses.titleInput}
          />
        </Box>

        {/* PDF Preview */}
        <Box ref={exportContainerRef} sx={{ textAlign: 'center' }}>
          {(() => {
            if (isMapLoading || isLegendLoading) {
              // Calculate skeleton dimensions: 80% of dialog width with map aspect ratio
              const dialogWidth = dialogRef.current?.offsetWidth || window.innerWidth * 0.8;
              const skeletonWidth = dialogWidth * 0.8;
              const mapCanvas = mapElement.querySelector('.ol-viewport canvas:not(.ol-overviewmap canvas)') as HTMLCanvasElement;
              const mapAspectRatio = mapCanvas ? mapCanvas.height / mapCanvas.width : 1.3;
              const skeletonHeight = skeletonWidth * mapAspectRatio;

              return <Skeleton variant="rounded" width={skeletonWidth} height={skeletonHeight} sx={sxClasses.mapSkeletonMargin} />;
            }

            if (pngPreviewUrls) {
              return pngPreviewUrls.map((imageUrl) => {
                const key = imageUrl.substring(imageUrl.length - 10);
                return <Box component="img" key={key} src={imageUrl} alt="Export Preview" sx={sxClasses.mapPreview} />;
              });
            }

            return <Box sx={sxClasses.mapLoading}>Loading preview...</Box>;
          })()}
        </Box>
      </DialogContent>
      <DialogActions sx={sxClasses.dialogActions}>
        <Button onClick={handleCloseModal} type="text" size="small" sx={sxClasses.buttonOutlined}>
          {t('general.cancel')}
        </Button>

        {/* Format Selection Menu */}
        <Menu id={`${mapId}-export-format-selection`} open={formatMenuOpen} onClose={handleFormatMenuClose} anchorEl={formatAnchorEl}>
          <MenuItem onClick={() => handleSelectFormat('pdf')}>PDF</MenuItem>
          <MenuItem onClick={() => handleSelectFormat('png')}>PNG</MenuItem>
          <MenuItem onClick={() => handleSelectFormat('jpeg')}>JPEG</MenuItem>
        </Menu>
        <Button type="text" onClick={handleFormatMenuClick} variant="outlined" size="small" sx={sxClasses.buttonOutlined}>
          {t('exportModal.formatBtn')} {exportFormat.toUpperCase()}
        </Button>

        {/* DPI Selection - Only show for PNG and JPEG */}
        {(exportFormat === 'png' || exportFormat === 'jpeg') && (
          <>
            <Menu id={`${mapId}-export-dpi-selection`} open={dpiMenuOpen} onClose={handleMenuClose} anchorEl={dpiAnchorEl}>
              <MenuItem onClick={() => handleSelectDpi(96)}>96 {t('exportModal.dpiBtn')}</MenuItem>
              <MenuItem onClick={() => handleSelectDpi(150)}>150 {t('exportModal.dpiBtn')}</MenuItem>
              <MenuItem onClick={() => handleSelectDpi(300)}>300 {t('exportModal.dpiBtn')}</MenuItem>
            </Menu>
            <Button type="text" onClick={handleDpiMenuClick} variant="outlined" size="small" sx={sxClasses.buttonOutlined}>
              {t('exportModal.dpiBtn')}: {exportMapResolution}
            </Button>
          </>
        )}

        {/* Quality Selection - Only show for JPEG */}
        {exportFormat === 'jpeg' && (
          <>
            <Menu
              id={`${mapId}-export-quality-selection`}
              open={qualityMenuOpen}
              onClose={handleQualityMenuClose}
              anchorEl={qualityAnchorEl}
            >
              {QUALITY_OPTIONS.map((quality) => (
                <MenuItem key={quality} onClick={() => handleSelectQuality(quality)}>
                  {quality}%
                </MenuItem>
              ))}
            </Menu>
            <Button type="text" onClick={handleQualityMenuClick} variant="outlined" size="small" sx={sxClasses.buttonOutlined}>
              {t('exportModal.qualityBtn')}: {jpegQuality}%
            </Button>
          </>
        )}

        <LoadingButton
          loading={isMapExporting}
          variant="contained"
          onClick={handleExport}
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
