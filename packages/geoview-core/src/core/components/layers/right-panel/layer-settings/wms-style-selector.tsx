import { useState, useEffect, useId, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import type { SxProps } from '@mui/material';

import { Box, ButtonBase, CircularProgressBase, Collapse, Typography } from '@/ui';
import { ImageNotSupportedIcon, PaletteIcon, ExpandMoreIcon, ExpandLessIcon } from '@/ui';

import { getSxClasses } from './layer-settings-style';
import { useStoreLayerWmsStyle, useStoreLayerWmsStyles } from '@/core/stores/states/layer-state';
import type { TypeMetadataWMSCapabilityLayerStyle } from '@/api/types/layer-schema-types';
import { logger } from '@/core/utils/logger';
import { useLayerController } from '@/core/controllers/use-controllers';

interface WmsStyleItemProps {
  style: TypeMetadataWMSCapabilityLayerStyle;
  isSelected: boolean;
  onSelect: (name: string) => void;
}

interface WmsStylePanelProps {
  /** The layer path to configure WMS styles for. */
  layerPath: string;
}

/**
 * Card component displaying a WMS style option with legend preview.
 *
 * @param style - The WMS style metadata.
 * @param isSelected - Whether this style is currently selected.
 * @param onSelect - Callback invoked when the user selects this style.
 * @returns A JSX element representing the WMS style card.
 */
function WmsStyleItem({ style, isSelected, onSelect }: WmsStyleItemProps): JSX.Element {
  // Log
  logger.logTraceRender('components/layers/right-panel/layer-settings/wms-style-selector > WmsStyleItem');

  // Hooks
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // State
  const [legendSrc, setLegendSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Log
    logger.logTraceUseEffect(`WMS STYLE ITEM - legend image - ${style.Name}`, style.LegendURL);

    // Get the first legend URL if available
    const legendUrl = style.LegendURL?.[0]?.OnlineResource?.['@attributes']?.['xlink:href'];

    if (legendUrl) {
      setLegendSrc(legendUrl);
    } else {
      setLegendSrc(null);
    }
    setLoading(false);
  }, [style]);

  const renderIcon = (): JSX.Element => {
    if (loading) {
      return (
        <Box component="span" sx={[sxClasses.previewImageContainer, sxClasses.wmsStylePreviewImageContainer] as SxProps}>
          <CircularProgressBase size={40} />
        </Box>
      );
    }
    if (legendSrc) {
      return (
        <Box component="span" sx={[sxClasses.previewImageContainer, sxClasses.wmsStylePreviewImageContainer] as SxProps}>
          <Box component="img" alt="" src={legendSrc} sx={[sxClasses.previewImage, sxClasses.wmsStylePreviewImage] as SxProps} />
        </Box>
      );
    }
    return (
      <Box component="span" sx={[sxClasses.previewImageContainer, sxClasses.wmsStylePreviewImageContainer] as SxProps}>
        <ImageNotSupportedIcon sx={sxClasses.settingSelectorPreviewIcon} />
      </Box>
    );
  };

  // #region Handlers

  /**
   * Handles selection of the WMS style.
   */
  const handleClick = useCallback((): void => {
    onSelect(style.Name);
  }, [onSelect, style.Name]);

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
          {style.Name}
        </Typography>
      </Box>
    </ButtonBase>
  );
}

/**
 * Inline panel section for selecting WMS styles.
 *
 * Displays available styles as cards within a collapsible section,
 * consistent with the raster function panel pattern.
 *
 * @param layerPath - The layer path to configure WMS styles for.
 * @returns A JSX element representing the WMS style panel.
 */
export function WmsStylePanel({ layerPath }: WmsStylePanelProps): JSX.Element {
  // Log
  logger.logTraceRender('components/layers/right-panel/layer-settings/wms-style-selector > WmsStylePanel');

  // Hooks
  const { t } = useTranslation();
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // Store hooks
  const currentWmsStyle = useStoreLayerWmsStyle(layerPath);
  const storeWmsStyles = useStoreLayerWmsStyles(layerPath);
  const memoWmsStyleArray = useMemo(() => {
    logger.logTraceUseMemo('WMS-STYLE-SELECTOR - memoWmsStyleArray', storeWmsStyles);
    return storeWmsStyles || [];
  }, [storeWmsStyles]);
  const layerController = useLayerController();

  // State
  const [expanded, setExpanded] = useState<boolean>(false);

  const baseId = useId();
  const collapseId = `${baseId}-content`;
  const titleId = `${baseId}-title`;

  const handleSelect = useCallback(
    (wmsStyleName: string): void => {
      layerController.setLayerWmsStyle(layerPath, wmsStyleName);
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
        <PaletteIcon fontSize="small" />
        <Box component="span" sx={sxClasses.settingsSectionHeaderText}>
          <Typography component="span" sx={sxClasses.settingsSectionTitle} id={titleId}>
            {t('layers.settings.selectWmsStyle')}
          </Typography>
          {currentWmsStyle && (
            <Typography component="span" variant="body2" color="text.secondary" sx={sxClasses.settingsSectionSummary} noWrap>
              {currentWmsStyle}
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
        <Box role="group" aria-labelledby={titleId} sx={sxClasses.settingsCardList}>
          {memoWmsStyleArray.map((style) => (
            <WmsStyleItem key={style.Name} style={style} isSelected={currentWmsStyle === style.Name} onSelect={handleSelect} />
          ))}
        </Box>
      </Collapse>
    </Box>
  );
}
