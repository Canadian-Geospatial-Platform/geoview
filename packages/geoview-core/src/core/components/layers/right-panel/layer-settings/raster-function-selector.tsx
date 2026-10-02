import { useState, useEffect, useCallback, useId, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import type { SxProps } from '@mui/material';

import { Box, ButtonBase, CircularProgressBase, Collapse, Typography } from '@/ui';
import { ImageNotSupportedIcon, FunctionsIcon, ExpandMoreIcon, ExpandLessIcon } from '@/ui';

import { getSxClasses } from './layer-settings-style';
import { useStoreLayerRasterFunctionInfos, useStoreLayerRasterFunction } from '@/core/stores/states/layer-state';
import type { TypeMetadataEsriRasterFunctionInfos } from '@/api/types/layer-schema-types';
import { logger } from '@/core/utils/logger';
import { useLayerController } from '@/core/controllers/use-controllers';

interface RasterFunctionItemProps {
  info: TypeMetadataEsriRasterFunctionInfos;
  isSelected: boolean;
  previewPromise: Promise<string> | undefined;
  onSelect: (name: string) => void;
}

interface RasterFunctionPanelProps {
  /** The layer path to configure raster functions for. */
  layerPath: string;
}

/** Stable empty array reference to avoid re-renders when raster function infos are undefined. */
const EMPTY_RASTER_FUNCTION_INFOS: TypeMetadataEsriRasterFunctionInfos[] = [];

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
  const [loading, setLoading] = useState<boolean>(true);

  /**
   * Resolves the preview image for this raster function.
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect(`RASTER FUNCTION ITEM - image preview - ${info.name}`, previewPromise);

    // No promise means no preview could be built at all, e.g. the service exposes no extent to export from
    if (!previewPromise) {
      setPreviewSrc(null);
      setLoading(false);
      return undefined;
    }

    // Discard a settlement arriving after the promise was replaced, otherwise a stale rejection
    // can wipe out an image that a newer promise already resolved successfully
    let cancelled = false;
    setLoading(true);

    previewPromise
      .then((src) => {
        if (!cancelled) setPreviewSrc(src);
      })
      .catch(() => {
        if (!cancelled) setPreviewSrc(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [info.name, previewPromise]);

  /**
   * Handles a preview that decoded to something that isn't a renderable image.
   */
  const handlePreviewError = useCallback((): void => {
    // ArcGIS answers a failed exportImage with a 200 carrying a JSON error body, which survives the
    // blob fetch and becomes a valid-looking data URL, so only the <img> can tell us it isn't an image
    setPreviewSrc(null);
  }, []);

  const renderIcon = (): JSX.Element => {
    if (loading) {
      return (
        <Box component="span" sx={[sxClasses.previewImageContainer, sxClasses.rasterFunctionPreviewImageContainer] as SxProps}>
          <CircularProgressBase size={40} />
        </Box>
      );
    }
    if (previewSrc) {
      return (
        <Box component="span" sx={[sxClasses.previewImageContainer, sxClasses.rasterFunctionPreviewImageContainer] as SxProps}>
          <Box
            component="img"
            src={previewSrc}
            alt=""
            onError={handlePreviewError}
            sx={[sxClasses.previewImage, sxClasses.rasterFunctionPreviewImage] as SxProps}
          />
        </Box>
      );
    }
    return (
      <Box component="span" sx={[sxClasses.previewImageContainer, sxClasses.rasterFunctionPreviewImageContainer] as SxProps}>
        <ImageNotSupportedIcon sx={sxClasses.settingSelectorPreviewIcon} />
      </Box>
    );
  };

  // #region Handlers

  /**
   * Handles selection of the raster function.
   */
  const handleClick = useCallback((): void => {
    onSelect(info.name);
  }, [onSelect, info.name]);

  // #endregion Handlers

  return (
    <ButtonBase
      onClick={handleClick}
      aria-current={isSelected ? 'true' : undefined}
      disableRipple
      sx={[sxClasses.settingsCard, isSelected && sxClasses.settingsCardSelected] as SxProps}
    >
      {renderIcon()}
      <Box component="span" sx={sxClasses.settingsCardText}>
        <Typography component="span" sx={sxClasses.settingsCardTitle}>
          {info.name}
        </Typography>
        {info.description && (
          <Typography component="span" variant="body2" color="text.secondary" sx={sxClasses.settingsCardDescription}>
            {info.description}
          </Typography>
        )}
      </Box>
    </ButtonBase>
  );
}

/**
 * Inline panel section for selecting raster functions.
 *
 * Replaces the previous Menu-based approach with cards displayed
 * directly within the settings panel.
 *
 * @param layerPath - The layer path to configure raster functions for.
 * @returns A JSX element representing the RasterFunctionPanel component.
 */
export function RasterFunctionPanel({ layerPath }: RasterFunctionPanelProps): JSX.Element {
  // Log
  logger.logTraceRender('components/layers/right-panel/layer-settings/raster-function-selector > RasterFunctionPanel');

  // Hooks
  const { t } = useTranslation();
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // Store hooks
  const rasterFunctionInfos = useStoreLayerRasterFunctionInfos(layerPath) ?? EMPTY_RASTER_FUNCTION_INFOS;
  const currentRasterFunction = useStoreLayerRasterFunction(layerPath);
  const layerController = useLayerController();

  // State
  const [expanded, setExpanded] = useState<boolean>(false);

  const baseId = useId();
  const titleId = `${baseId}-title`;
  const collapseId = `${baseId}-content`;

  /**
   * Builds preview image promises for the available raster functions.
   */
  const memoPreviewPromises = useMemo((): Map<string, Promise<string>> => {
    // Log
    logger.logTraceUseMemo('RASTER FUNCTION PANEL - memoPreviewPromises', layerPath, rasterFunctionInfos);

    if (rasterFunctionInfos.length === 0) return new Map<string, Promise<string>>();
    return layerController.getLayerRasterFunctionPreviews(layerPath);
  }, [layerPath, rasterFunctionInfos, layerController]);

  const handleSelect = useCallback(
    (rasterFunctionName: string): void => {
      layerController.setLayerRasterFunction(layerPath, rasterFunctionName);
    },
    [layerPath, layerController]
  );

  const handleToggle = useCallback((): void => {
    setExpanded((prev) => !prev);
  }, []);

  return (
    <Box sx={sxClasses.settingsSection}>
      <ButtonBase
        sx={sxClasses.settingsSectionHeader}
        onClick={handleToggle}
        aria-expanded={expanded}
        aria-controls={collapseId}
        disableRipple
      >
        <FunctionsIcon fontSize="small" />
        <Box component="span" sx={sxClasses.settingsSectionHeaderText}>
          <Typography component="span" sx={sxClasses.settingsSectionTitle} id={titleId}>
            {t('layers.settings.selectRasterFunction')}
          </Typography>
          {currentRasterFunction && (
            <Typography component="span" variant="body2" color="text.secondary" sx={sxClasses.settingsSectionSummary} noWrap>
              {currentRasterFunction}
            </Typography>
          )}
        </Box>
        {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
      </ButtonBase>
      <Collapse
        id={collapseId}
        in={expanded}
        sx={expanded ? sxClasses.settingsSectionContentExpanded : sxClasses.settingsSectionContentCollapsed}
      >
        <Box sx={sxClasses.settingsCardList} role="group" aria-labelledby={titleId}>
          {rasterFunctionInfos.map((info) => (
            <RasterFunctionItem
              key={info.name}
              info={info}
              isSelected={currentRasterFunction === info.name}
              previewPromise={memoPreviewPromises.get(info.name)}
              onSelect={handleSelect}
            />
          ))}
        </Box>
      </Collapse>
    </Box>
  );
}
