import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import type { SxProps } from '@mui/material';

import { Box, CircularProgress, Collapse, Typography } from '@/ui';
import { ImageNotSupportedIcon, FunctionsIcon, ExpandMoreIcon, ExpandLessIcon } from '@/ui';

import { getSxClasses } from './layer-settings-style';
import {
  useLayerSelectorRasterFunctionInfos,
  useLayerSelectorRasterFunction,
} from '@/core/stores/store-interface-and-intial-values/layer-state';
import type { TypeLegendLayer } from '@/core/components/layers/types';
import type { TypeMetadataEsriRasterFunctionInfos } from '@/api/types/layer-schema-types';
import { logger } from '@/core/utils/logger';
import { useLayerController } from '@/core/controllers/layer-controller';

interface RasterFunctionItemProps {
  info: TypeMetadataEsriRasterFunctionInfos;
  isSelected: boolean;
  previewPromise: Promise<string> | undefined;
  onSelect: (name: string) => void;
}

interface RasterFunctionPanelProps {
  layerDetails: TypeLegendLayer;
}

/**
 * Card component displaying a raster function option with image preview.
 *
 * @param info - The raster function metadata.
 * @param isSelected - Whether this function is currently selected.
 * @param previewPromise - Promise resolving to the preview image URL.
 * @param onSelect - Callback invoked when the user selects this function.
 * @returns A JSX element representing the raster function card.
 */
function RasterFunctionItem({ info, isSelected, previewPromise, onSelect }: RasterFunctionItemProps): JSX.Element {
  // Log
  logger.logTraceRender('components/layers/right-panel/layer-settings/raster-function-selector > RasterFunctionItem');

  // Hooks
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // State
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Log
    logger.logTraceUseEffect(`RASTER FUNCTION ITEM - image preview - ${info.name}`, previewPromise);

    if (!previewPromise) return;
    previewPromise
      .then(setPreviewSrc)
      .catch(() => setPreviewSrc(null))
      .finally(() => setLoading(false));
  }, [info.name, previewPromise]);

  const renderIcon = (): JSX.Element => {
    if (loading) {
      return (
        <Box sx={sxClasses.rasterFunctionPreviewImageContainer}>
          <CircularProgress
            isLoaded={false}
            size={24}
            sx={{
              position: 'relative',
              backgroundColor: 'transparent',
            }}
            sxCircular={{
              width: '40px !important',
              height: '40px !important',
            }}
          />
        </Box>
      );
    }
    if (previewSrc) {
      return (
        <Box sx={sxClasses.rasterFunctionPreviewImageContainer}>
          <Box component="img" src={previewSrc} alt={info.name} sx={sxClasses.rasterFunctionPreviewImage} />
        </Box>
      );
    }
    return (
      <Box sx={sxClasses.rasterFunctionPreviewImageContainer}>
        <ImageNotSupportedIcon sx={sxClasses.settingSelectorPreviewIcon} />
      </Box>
    );
  };

  const handleClick = useCallback((): void => {
    onSelect(info.name);
  }, [onSelect, info.name]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>): void => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onSelect(info.name);
      }
    },
    [onSelect, info.name]
  );

  return (
    <Box
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      sx={[sxClasses.settingsCard, isSelected && sxClasses.settingsCardSelected] as SxProps}
    >
      {renderIcon()}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontWeight: 600 }}>{info.name}</Typography>
        {info.description && (
          <Typography variant="body2" color="text.secondary">
            {info.description}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

/**
 * Inline panel section for selecting raster functions.
 *
 * Replaces the previous Menu-based approach with cards displayed
 * directly within the settings panel.
 *
 * @param layerDetails - The legend layer to configure raster functions for.
 * @returns A JSX element representing the RasterFunctionPanel component.
 */
export function RasterFunctionPanel({ layerDetails }: RasterFunctionPanelProps): JSX.Element {
  // Log
  logger.logTraceRender('components/layers/right-panel/layer-settings/raster-function-selector > RasterFunctionPanel');

  // Hooks
  const { t } = useTranslation();
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // Store hooks
  const storeRasterFunctionInfos = useLayerSelectorRasterFunctionInfos(layerDetails.layerPath);
  const memoRasterFunctionInfos = useMemo(() => storeRasterFunctionInfos || [], [storeRasterFunctionInfos]);
  const currentRasterFunction = useLayerSelectorRasterFunction(layerDetails.layerPath);
  const layerController = useLayerController();

  // State
  const [previewPromises, setPreviewPromises] = useState<Map<string, Promise<string>>>(new Map());
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('RASTER FUNCTION PANEL - Layer Raster Function Infos sync', memoRasterFunctionInfos);

    if (memoRasterFunctionInfos.length > 0) {
      // TODO: CHECK - Verify if that's the intent here? - Use a hook?
      const promises = layerController.getLayerRasterFunctionPreviews(layerDetails.layerPath);
      setPreviewPromises(promises);
    }
  }, [layerDetails.layerPath, memoRasterFunctionInfos, layerController]);

  const handleSelect = useCallback(
    (rasterFunctionName: string): void => {
      layerController.setLayerRasterFunction(layerDetails.layerPath, rasterFunctionName);
    },
    [layerDetails.layerPath, layerController]
  );

  const handleToggle = useCallback((): void => {
    setExpanded((prev) => !prev);
  }, []);

  const handleToggleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>): void => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleToggle();
      }
    },
    [handleToggle]
  );

  return (
    <Box sx={sxClasses.settingsSection}>
      <Box sx={sxClasses.settingsSectionHeader} onClick={handleToggle} onKeyDown={handleToggleKeyDown} role="button" tabIndex={0}>
        <FunctionsIcon fontSize="small" />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={sxClasses.settingsSectionTitle}>{t('layers.settings.selectRasterFunction')}</Typography>
          {currentRasterFunction && (
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: theme.palette.geoViewFontSize.sm }} noWrap>
              {currentRasterFunction}
            </Typography>
          )}
        </Box>
        {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
      </Box>
      <Collapse in={expanded} sx={{ marginTop: expanded ? '12px' : 0 }}>
        <Box sx={sxClasses.settingsCardList}>
          {memoRasterFunctionInfos.map((info) => (
            <RasterFunctionItem
              key={info.name}
              info={info}
              isSelected={currentRasterFunction === info.name}
              previewPromise={previewPromises.get(info.name)}
              onSelect={handleSelect}
            />
          ))}
        </Box>
      </Collapse>
    </Box>
  );
}
