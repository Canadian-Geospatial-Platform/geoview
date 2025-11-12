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
import { useUIActiveFocusItem, useUIStoreActions } from '@/core/stores/store-interface-and-intial-values/ui-state';
import { useGeoViewMapId } from '@/core/stores/geoview-store';
import { useAppGeoviewHTMLElement } from '@/core/stores/store-interface-and-intial-values/app-state';
import { exportFile } from '@/core/utils/utilities';
import { logger } from '@/core/utils/logger';

import { createPDFMapUrl } from '@/core/components/export/pdf-layout';
import { createCanvasMapUrls } from '@/core/components/export/canvas-layout';
import { getSxClasses } from '@/core/components/export/export-modal-style';

type FileFormat = 'pdf' | 'png' | 'jpeg';

const QUALITY_OPTIONS = [50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100];

const PREVIEW_TIMEOUT = 200;

export interface FileExportProps {
  exportTitle: string;
  disclaimer: string;
  dpi: number;
  jpegQuality?: number;
  format: FileFormat;
}

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
  const { disableFocusTrap, setActiveAppBarTab } = useUIStoreActions();
  const activeModalId = useUIActiveFocusItem().activeElementId;

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
  const dialogRef = useRef(null) as RefObject<HTMLDivElement>;
  const [pngPreviewUrls, setPngPreviewUrls] = useState<string[]>([]);

  const fileExportDefaultPrefixName = t('exportModal.fileExportDefaultPrefixName');

  // Generate preview
  const generatePreview = useCallback(async () => {
    logger.logTraceUseCallback('EXPORT-MODAL - generatePreview Callback');
    try {
      setIsMapLoading(true);
      const disclaimer = t('mapctrl.disclaimer.message');
      const pngUrl = await createCanvasMapUrls(mapId, { exportTitle: '', disclaimer, dpi: 96, format: 'jpeg' });
      setPngPreviewUrls([pngUrl]);
      URL.revokeObjectURL(pngUrl);
    } catch (error) {
      logger.logError(error);
    } finally {
      setIsMapLoading(false);
      setIsLegendLoading(false);
    }
  }, [t, mapId]);

  // Export the requested file
  const performExport = useCallback(async () => {
    logger.logTraceUseCallback('EXPORT-MODAL - performExport');
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
        const pdfUrl = await createPDFMapUrl(mapId, { exportTitle, disclaimer, dpi, format: exportFormat });
        exportFile(pdfUrl, filename, exportFormat);
        URL.revokeObjectURL(pdfUrl);
      } else {
        const imageUrl = await createCanvasMapUrls(mapId, {
          exportTitle,
          disclaimer,
          dpi,
          jpegQuality,
          format: exportFormat,
        });
        exportFile(imageUrl, filename, exportFormat);
        URL.revokeObjectURL(imageUrl);
      }
    } catch (error) {
      logger.logError(`Error exporting ${exportFormat.toUpperCase()}`, error);
    } finally {
      setIsMapExporting(false);
      setActiveAppBarTab('legend', false, false);
      disableFocusTrap();
    }
  }, [
    disableFocusTrap,
    exportFormat,
    exportMapResolution,
    exportTitle,
    fileExportDefaultPrefixName,
    jpegQuality,
    mapId,
    setActiveAppBarTab,
    t,
  ]);

  // Use Effect to generate the image preview on load
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
    }, PREVIEW_TIMEOUT);

    return () => {
      clearTimeout(timer);
      if (overviewMap) overviewMap.style.visibility = 'visible';
    };
  }, [activeModalId, generatePreview, mapElement]);

  // #region HANDLERS

  const handleCloseModal = useCallback(() => {
    logger.logTraceUseCallback('EXPORT-MODAL - handleCloseModal');
    setActiveAppBarTab('legend', false, false);
    disableFocusTrap();
    // Clear preview content so skeleton shows on next open
    setPngPreviewUrls([]);
    setIsMapLoading(false);
    setIsLegendLoading(false);
  }, [setActiveAppBarTab, disableFocusTrap]);

  const handleExport = useCallback(() => {
    logger.logTraceUseCallback('EXPORT-MODAL - handleExport');
    performExport().catch((error) => logger.logError(error));
  }, [performExport]);

  const handleFormatMenuClick = (event: React.MouseEvent<HTMLElement>): void => {
    setFormatAnchorEl(event.currentTarget);
    setFormatMenuOpen(true);
  };

  const handleFormatMenuClose = useCallback(() => {
    logger.logTraceUseCallback('EXPORT-MODAL - handleFormatMenuClose');
    setFormatMenuOpen(false);
  }, []);

  const handleSelectFormat = useCallback(
    (format: FileFormat) => {
      logger.logTraceUseCallback('EXPORT-MODAL - handleSelectFormat');
      setExportFormat(format);
      if (format === 'pdf') {
        setExportMapResolution(300);
      }
      handleFormatMenuClose();
    },
    [handleFormatMenuClose]
  );

  const handleDpiMenuClick = (event: React.MouseEvent<HTMLElement>): void => {
    setDpiAnchorEl(event.currentTarget);
    setDpiMenuOpen(true);
  };

  const handleMenuClose = useCallback(() => {
    logger.logTraceUseCallback('EXPORT-MODAL - handleMenuClose');
    setDpiMenuOpen(false);
  }, []);

  const handleSelectDpi = useCallback(
    (dpi: number) => {
      logger.logTraceUseCallback('EXPORT-MODAL - handleSelectDpi');
      setExportMapResolution(dpi);
      handleMenuClose();
    },
    [handleMenuClose]
  );

  const handleQualityMenuClick = (event: React.MouseEvent<HTMLElement>): void => {
    setQualityAnchorEl(event.currentTarget);
    setQualityMenuOpen(true);
  };

  const handleQualityMenuClose = useCallback(() => {
    logger.logTraceUseCallback('EXPORT-MODAL - handleQualityMenuClose');
    setQualityMenuOpen(false);
  }, []);

  const handleSelectQuality = useCallback(
    (quality: number) => {
      logger.logTraceUseCallback('EXPORT-MODAL - handleSelectQuality');
      setJpegQuality(quality);
      handleQualityMenuClose();
    },
    [handleQualityMenuClose]
  );

  // #endregion HANDLERS

  return (
    <Dialog open={activeModalId === 'export'} onClose={handleCloseModal} fullWidth maxWidth="xl" disablePortal>
      <DialogTitle>{t('exportModal.title')}</DialogTitle>
      <DialogContent dividers ref={dialogRef}>
        {/* Title input */}
        <Box sx={sxClasses.title}>
          <TextField
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
              return <Skeleton variant="rounded" width={600} height={777} sx={sxClasses.mapSkeletonMargin} />;
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
          {t('exportModal.cancelBtn')}
        </Button>

        {/* Format Selection Menu */}
        <Menu id="format-selection" open={formatMenuOpen} onClose={handleFormatMenuClose} anchorEl={formatAnchorEl}>
          <MenuItem onClick={() => handleSelectFormat('pdf')}>PDF</MenuItem>
          <MenuItem onClick={() => handleSelectFormat('png')}>PNG</MenuItem>
          <MenuItem onClick={() => handleSelectFormat('jpeg')}>JPEG</MenuItem>
        </Menu>
        <Button type="text" onClick={handleFormatMenuClick} variant="outlined" size="small" sx={sxClasses.buttonOutlined}>
          Format: {exportFormat.toUpperCase()}
        </Button>

        {/* DPI Selection - Only show for PNG and JPEG */}
        {(exportFormat === 'png' || exportFormat === 'jpeg') && (
          <>
            <Menu id="dpi-selection" open={dpiMenuOpen} onClose={handleMenuClose} anchorEl={dpiAnchorEl}>
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
            <Menu id="quality-selection" open={qualityMenuOpen} onClose={handleQualityMenuClose} anchorEl={qualityAnchorEl}>
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
