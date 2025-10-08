/*
Export Process Overview:
- Modal displays preview and handles user input (title, format, page size, etc.)
- Canvas layout (createCanvasMapUrls) generates raster images for preview/export
- PDF layout (createPDFMapUrl) generates vector PDFs for export only
- Both call utilities>getMapInfo for map preparation and legend processing

Key Processing Steps:
- getMapInfo captures map canvas at 300DPI, extracts scale/north arrow, processes legend data
- Map rotation handled by canvas transforms during capture
- Legend items filtered by visibility and flattened into hierarchy with height estimates
- Footer space reserved based on disclaimer/attribution text length estimates

Legend Distribution Logic:
- Distributes parent+child groups into columns based on available space
- Groups that don't fit move to overflow page
- Maintains vector quality until final rasterization (canvas) or keeps vectors (PDF)
*/

import { ChangeEvent, RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';

import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, LoadingButton, Skeleton, TextField, Menu, MenuItem } from '@/ui';
import { useUIActiveFocusItem, useUIStoreActions } from '@/core/stores/store-interface-and-intial-values/ui-state';
import { useGeoViewMapId } from '@/core/stores/geoview-store';
import { useAppGeoviewHTMLElement } from '@/core/stores/store-interface-and-intial-values/app-state';
import { exportFile } from '@/core/utils/utilities';
import { logger } from '@/core/utils/logger';

import { createPDFMapUrl } from './pdf-layout';
import { createCanvasMapUrls } from './canvas-layout';
import { getSxClasses } from './export-modal-style';

type FileFormat = 'pdf' | 'png' | 'jpeg';

type DocumentSize = 'LETTER' | 'LEGAL' | 'TABLOID';

const QUALITY_OPTIONS = [50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100];

const PREVIEW_TIMEOUT = 200;

export interface FileExportProps {
  exportTitle: string;
  disclaimer: string;
  pageSize: DocumentSize;
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
  const [exportFormat, setExportFormat] = useState<FileFormat>('pdf');
  const exportContainerRef = useRef(null) as RefObject<HTMLDivElement>;
  const [dpiMenuOpen, setDpiMenuOpen] = useState(false);
  const [dpiAnchorEl, setDpiAnchorEl] = useState<null | HTMLElement>(null);
  const [formatMenuOpen, setFormatMenuOpen] = useState(false);
  const [formatAnchorEl, setFormatAnchorEl] = useState<null | HTMLElement>(null);
  const [jpegQuality, setJpegQuality] = useState(90); // Default 90%
  const [qualityMenuOpen, setQualityMenuOpen] = useState(false);
  const [qualityAnchorEl, setQualityAnchorEl] = useState<null | HTMLElement>(null);
  const [pageSize, setPageSize] = useState<DocumentSize>('LETTER');
  const [pageSizeMenuOpen, setPageSizeMenuOpen] = useState(false);
  const [pageSizeAnchorEl, setPageSizeAnchorEl] = useState<null | HTMLElement>(null);
  const dialogRef = useRef(null) as RefObject<HTMLDivElement>;
  const [pngPreviewUrls, setPngPreviewUrls] = useState<string[]>([]);

  const fileExportDefaultPrefixName = t('exportModal.fileExportDefaultPrefixName');

  const handleCloseModal = useCallback(() => {
    logger.logTraceUseCallback('EXPORT-MODAL - handleCloseModal');
    setActiveAppBarTab('legend', false, false);
    disableFocusTrap();
  }, [setActiveAppBarTab, disableFocusTrap]);

  // Generate preview of PDF
  const generatePreview = useCallback(async () => {
    logger.logTraceUseCallback('EXPORT-MODAL - generatePreview Callback');
    try {
      setIsMapLoading(true);
      const disclaimer = t('mapctrl.disclaimer.message');
      const pngUrls = await createCanvasMapUrls(mapId, { exportTitle: '', disclaimer, pageSize: pageSize, dpi: 96, format: 'jpeg' });
      setPngPreviewUrls(pngUrls);
      pngUrls.forEach((url) => URL.revokeObjectURL(url));
    } catch (error) {
      logger.logError(error);
    } finally {
      setIsMapLoading(false);
      setIsLegendLoading(false);
    }
  }, [t, mapId, pageSize]);

  // Export the requested file
  const performExport = useCallback(async () => {
    logger.logTraceUseCallback('EXPORT-MODAL - performExport');
    try {
      setIsMapExporting(true);
      const disclaimer = t('mapctrl.disclaimer.message');
      const dpi = exportFormat === 'pdf' ? 300 : exportMapResolution;
      const filename = `${fileExportDefaultPrefixName}-${exportTitle.trim() || mapId}`;

      if (exportFormat === 'pdf') {
        const pdfUrl = await createPDFMapUrl(mapId, { exportTitle, disclaimer, pageSize: pageSize, dpi, format: exportFormat });
        exportFile(pdfUrl, filename, exportFormat);
        URL.revokeObjectURL(pdfUrl);
      } else {
        const imageUrl = await createCanvasMapUrls(mapId, {
          exportTitle,
          disclaimer,
          pageSize: pageSize,
          dpi,
          jpegQuality,
          format: exportFormat,
        });
        imageUrl.forEach((url, i) => {
          let exportName = filename;
          if (i > 0) {
            exportName = `${filename}-legend-overflow-${i}`;
          }
          exportFile(url, exportName, exportFormat);
          URL.revokeObjectURL(url);
        });
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
    pageSize,
    setActiveAppBarTab,
    t,
  ]);

  useEffect(() => {
    logger.logTraceUseEffect('EXPORT-MODAL - generatePreview useEffect');
    if (activeModalId !== 'export') return;

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

  const handleExport = useCallback(() => {
    logger.logTraceUseCallback('EXPORT-MODAL - handleExport');
    performExport().catch((error) => logger.logError(error));
  }, [performExport]);

  const handleFormatMenuClick = (event: React.MouseEvent<HTMLElement>) => {
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

  const handleDpiMenuClick = (event: React.MouseEvent<HTMLElement>) => {
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

  const handlePageSizeMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setPageSizeAnchorEl(event.currentTarget);
    setPageSizeMenuOpen(true);
  };

  const handlePageSizeMenuClose = useCallback(() => {
    logger.logTraceUseCallback('EXPORT-MODAL - handlePageSizeMenuClose');
    setPageSizeMenuOpen(false);
  }, []);

  const handleSelectPageSize = useCallback(
    (size: 'LETTER' | 'LEGAL' | 'TABLOID') => {
      setPageSize(size);
      handlePageSizeMenuClose();
    },
    [handlePageSizeMenuClose]
  );

  const handleQualityMenuClick = (event: React.MouseEvent<HTMLElement>) => {
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

  return (
    <Dialog open={activeModalId === 'export'} onClose={handleCloseModal} fullWidth maxWidth="xl" disablePortal>
      <DialogTitle>{t('exportModal.title')}</DialogTitle>
      <DialogContent dividers ref={dialogRef}>
        {/* Title input */}
        <Box sx={{ marginBottom: 2, textAlign: 'center' }}>
          <TextField
            label={t('exportModal.exportTitle')}
            variant="standard"
            value={exportTitle}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setExportTitle(e.target.value)}
            sx={{ minWidth: 300 }}
          />
        </Box>

        {/* PDF Preview */}
        <Box ref={exportContainerRef} sx={{ textAlign: 'center' }}>
          {(() => {
            if (isMapLoading || isLegendLoading) {
              return <Skeleton variant="rounded" width={600} height={777} sx={{ margin: '0 auto' }} />;
            }

            if (pngPreviewUrls) {
              return pngPreviewUrls.map((imageUrl) => {
                const key = imageUrl.substring(imageUrl.length - 10);
                return <img key={key} src={imageUrl} alt="Export Preview" style={{ width: 600, height: 777, border: '1px solid #ccc' }} />;
              });
            }

            return <Box sx={{ width: 600, height: 777, border: '1px solid #ccc', margin: '0 auto' }}>Loading preview...</Box>;
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

        {/* Page Size Selection Menu */}
        <Menu id="pagesize-selection" open={pageSizeMenuOpen} onClose={handlePageSizeMenuClose} anchorEl={pageSizeAnchorEl}>
          <MenuItem onClick={() => handleSelectPageSize('LETTER')}>Letter (8.5" x 11")</MenuItem>
          <MenuItem onClick={() => handleSelectPageSize('LEGAL')}>Legal (8.5" x 14")</MenuItem>
          <MenuItem onClick={() => handleSelectPageSize('TABLOID')}>Tabloid (11" x 17")</MenuItem>
        </Menu>
        <Button type="text" onClick={handlePageSizeMenuClick} variant="outlined" size="small" sx={sxClasses.buttonOutlined}>
          Size: {pageSize}
        </Button>

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
