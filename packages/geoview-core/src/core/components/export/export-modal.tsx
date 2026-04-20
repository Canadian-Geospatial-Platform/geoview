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
import type { SelectChangeEvent } from '@mui/material';

import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, LoadingButton, Select, Skeleton, TextField } from '@/ui';
import type { TypeMenuItemProps } from '@/ui/select/select';
import type { TypeDisplayLanguage } from '@/api/types/map-schema-types';
import { useStoreUIActiveFocusItem } from '@/core/stores/store-interface-and-intial-values/ui-state';
import { useStoreGeoViewMapId } from '@/core/stores/geoview-store';
import {
  useStoreAppDisplayLanguage,
  useStoreAppGeoviewHTMLElement,
  useStoreAppShellContainer,
} from '@/core/stores/store-interface-and-intial-values/app-state';
import {
  useStoreLayerDateTemporalModeSet,
  useStoreLayerDisplayDateFormatSet,
} from '@/core/stores/store-interface-and-intial-values/layer-state';
import { exportFile } from '@/core/utils/utilities';

import { useUIController } from '@/core/controllers/use-controllers';
import type { TemporalMode, TypeDisplayDateFormat } from '@/core/utils/date-mgt';
import { createPDFMapUrl } from '@/core/components/export/pdf-layout';
import { createCanvasMapUrls } from '@/core/components/export/canvas-layout';
import { getSxClasses } from '@/core/components/export/export-modal-style';
import { TIMEOUT } from '@/core/utils/constant';
import { logger } from '@/core/utils/logger';
import type { SxStyles } from '@/ui/style/types';

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
export function ExportModal(): JSX.Element {
  // Log
  logger.logTraceRender('components/export/export-modal');

  // Hooks
  const { t } = useTranslation();
  const theme = useTheme();

  /**
   * Computes SX style classes for the export modal.
   */
  const memoSxClasses = useMemo((): SxStyles => {
    // Log
    logger.logTraceUseMemo('EXPORT-MODAL - memoSxClasses', theme);

    return getSxClasses(theme);
  }, [theme]);

  // Store
  const mapId = useStoreGeoViewMapId();
  const mapElement = useStoreAppGeoviewHTMLElement();
  const uiController = useUIController();
  const activeModalId = useStoreUIActiveFocusItem().activeElementId;
  const shellContainer = useStoreAppShellContainer();
  const language = useStoreAppDisplayLanguage();
  const layerDateFormats = useStoreLayerDisplayDateFormatSet();
  const layerDateTemporalModes = useStoreLayerDateTemporalModeSet();

  // State & refs
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [isLegendLoading, setIsLegendLoading] = useState(true);
  const [isMapExporting, setIsMapExporting] = useState(false);
  const [exportTitle, setExportTitle] = useState<string>('');
  const [exportMapResolution, setExportMapResolution] = useState(300);
  const [exportFormat, setExportFormat] = useState<FileFormat>('png');
  const exportContainerRef = useRef(null) as RefObject<HTMLDivElement>;
  const [jpegQuality, setJpegQuality] = useState(90); // Default 90%
  const [pngPreviewUrls, setPngPreviewUrls] = useState<string[]>([]);
  const dialogRef = useRef(null) as RefObject<HTMLDivElement>;
  const titleInputRef = useRef<HTMLInputElement>(null);

  const fileExportDefaultPrefixName = t('exportModal.fileExportDefaultPrefixName');

  /**
   * Builds menu items for format selection.
   */
  const memoFormatMenuItems = useMemo<TypeMenuItemProps[]>((): TypeMenuItemProps[] => {
    logger.logTraceUseMemo('EXPORT-MODAL - memoFormatMenuItems', t);

    return [
      { item: { value: 'pdf', children: t('exportModal.pdf') } },
      { item: { value: 'png', children: t('exportModal.png') } },
      { item: { value: 'jpeg', children: t('exportModal.jpeg') } },
    ];
  }, [t]);

  /**
   * Builds menu items for DPI selection.
   */
  const memoDpiMenuItems = useMemo<TypeMenuItemProps[]>((): TypeMenuItemProps[] => {
    logger.logTraceUseMemo('EXPORT-MODAL - memoDpiMenuItems', t);

    return [
      { item: { value: 96, children: `96 ${t('exportModal.dpi')}` } },
      { item: { value: 150, children: `150 ${t('exportModal.dpi')}` } },
      { item: { value: 300, children: `300 ${t('exportModal.dpi')}` } },
    ];
  }, [t]);

  /**
   * Builds menu items for quality selection.
   */
  const memoQualityMenuItems = useMemo<TypeMenuItemProps[]>((): TypeMenuItemProps[] => {
    logger.logTraceUseMemo('EXPORT-MODAL - memoQualityMenuItems');

    return QUALITY_OPTIONS.map((quality) => ({ item: { value: quality, children: `${quality}%` } }));
  }, []);

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
  const handleCloseModal = useCallback(() => {
    uiController.disableFocusTrap();

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
   * Handles format selection change.
   */
  const handleFormatChange = useCallback((event: SelectChangeEvent<unknown>): void => {
    const format = event.target.value as FileFormat;
    setExportFormat(format);
    if (format === 'pdf') {
      setExportMapResolution(300);
    }
  }, []);

  /**
   * Handles DPI selection change.
   */
  const handleDpiChange = useCallback((event: SelectChangeEvent<unknown>): void => {
    setExportMapResolution(Number(event.target.value));
  }, []);

  /**
   * Handles quality selection change.
   */
  const handleQualityChange = useCallback((event: SelectChangeEvent<unknown>): void => {
    setJpegQuality(Number(event.target.value));
  }, []);

  /**
   * Handles focusing the title input when the dialog opens.
   */
  const handleDialogEntered = useCallback((): void => {
    titleInputRef.current?.focus();
  }, []);

  /**
   * Handles when the title input value changes.
   */
  const handleTitleChange = useCallback((e: ChangeEvent<HTMLInputElement>): void => {
    setExportTitle(e.target.value);
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
      <DialogContent dividers ref={dialogRef} sx={memoSxClasses.dialogContent}>
        {/* Title input */}
        <Box sx={memoSxClasses.exportSettings}>
          <TextField
            id={`${mapId}-export-title-input`}
            inputRef={titleInputRef}
            label={t('exportModal.exportTitle')}
            variant="standard"
            value={exportTitle}
            onChange={handleTitleChange}
            sx={memoSxClasses.exportTitleInput}
          />
          <Box sx={memoSxClasses.exportOptions}>
            {/* Format Selection */}
            <Select
              labelId={`${mapId}-export-type-label`}
              formControlProps={{ variant: 'standard', size: 'small' }}
              id={`${mapId}-export-type-select`}
              value={exportFormat}
              onChange={handleFormatChange}
              label={t('exportModal.formatSelect')}
              menuItems={memoFormatMenuItems}
              variant="standard"
              MenuProps={{ container: shellContainer }}
              inputLabel={{ id: `${mapId}-export-type-label` }}
              fullWidth
            />

            {/* DPI Selection - Only show for PNG and JPEG */}
            {(exportFormat === 'png' || exportFormat === 'jpeg') && (
              <Select
                labelId={`${mapId}-export-value-label`}
                formControlProps={{ variant: 'standard', size: 'small' }}
                id={`${mapId}-export-value-select`}
                value={exportMapResolution}
                onChange={handleDpiChange}
                label={t('exportModal.resolutionSelect')}
                menuItems={memoDpiMenuItems}
                variant="standard"
                MenuProps={{ container: shellContainer }}
                inputLabel={{ id: `${mapId}-export-value-label` }}
                fullWidth
              />
            )}

            {/* Quality Selection - Only show for JPEG */}
            {exportFormat === 'jpeg' && (
              <Select
                labelId={`${mapId}-export-quality-label`}
                formControlProps={{ variant: 'standard', size: 'small' }}
                id={`${mapId}-export-quality-select`}
                value={jpegQuality}
                onChange={handleQualityChange}
                label={t('exportModal.qualitySelect')}
                menuItems={memoQualityMenuItems}
                variant="standard"
                MenuProps={{ container: shellContainer }}
                inputLabel={{ id: `${mapId}-export-quality-label` }}
                fullWidth
              />
            )}
          </Box>
        </Box>

        {/* PDF Preview */}
        <Box ref={exportContainerRef}>
          {(() => {
            if (isMapLoading || isLegendLoading) {
              // Calculate skeleton dimensions: 80% of dialog width with map aspect ratio
              const dialogWidth = dialogRef.current?.offsetWidth || window.innerWidth * 0.8;
              const skeletonWidth = dialogWidth * 0.8;
              const mapCanvas = mapElement.querySelector('.ol-viewport canvas:not(.ol-overviewmap canvas)') as HTMLCanvasElement;
              const mapAspectRatio = mapCanvas ? mapCanvas.height / mapCanvas.width : 1.3;
              const skeletonHeight = skeletonWidth * mapAspectRatio;

              return <Skeleton variant="rounded" width={skeletonWidth} height={skeletonHeight} sx={memoSxClasses.mapSkeletonMargin} />;
            }

            if (pngPreviewUrls) {
              return pngPreviewUrls.map((imageUrl) => {
                const key = imageUrl.substring(imageUrl.length - 10);
                return <Box component="img" key={key} src={imageUrl} alt={t('exportModal.previewAlt')!} sx={memoSxClasses.mapPreview} />;
              });
            }

            return <Box sx={memoSxClasses.mapLoading}>Loading preview...</Box>;
          })()}
        </Box>
      </DialogContent>
      <DialogActions sx={memoSxClasses.dialogActions}>
        <Button onClick={handleCloseModal} type="text" size="medium" variant="outlined">
          {t('general.cancel')}
        </Button>

        <LoadingButton
          loading={isMapExporting}
          variant="contained"
          onClick={handleExport}
          size="medium"
          disabled={isLegendLoading || isMapLoading}
        >
          {t('exportModal.exportBtn')}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
