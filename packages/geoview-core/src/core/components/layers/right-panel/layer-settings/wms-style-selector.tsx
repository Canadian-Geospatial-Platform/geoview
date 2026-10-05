import { useState, useEffect, useId, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import type { SxProps } from '@mui/material';

import { Box, ButtonBase, CircularProgressBase, Collapse, Typography } from '@/ui';
import { ImageNotSupportedIcon, PaletteIcon, ExpandMoreIcon, ExpandLessIcon } from '@/ui';

import { getSxClasses } from './layer-settings-style';
import type { SxStyles } from '@/ui/style/types';
import { useStoreLayerWmsStyle, useStoreLayerWmsStyles } from '@/core/stores/states/layer-state';
import type { TypeMetadataWMSCapabilityLayerStyle } from '@/api/types/layer-schema-types';
import { logger } from '@/core/utils/logger';
import { useLayerController } from '@/core/controllers/use-controllers';

/** Properties for a WMS style selection card. */
interface WmsStyleItemProps {
  /** WMS style metadata displayed by the card. */
  style: TypeMetadataWMSCapabilityLayerStyle;
  /** Whether this style is currently active. */
  isSelected: boolean;
  /** Callback invoked when this style is selected. */
  onSelect: (name: string) => void;
}

/** Properties for the WMS style settings panel. */
interface WmsStylePanelProps {
  /** The layer path to configure WMS styles for. */
  layerPath: string;
}

/**
 * Creates a WMS style selection card with a legend preview.
 *
 * @param props - Properties defined in WmsStyleItemProps interface
 * @returns The WMS style card
 */
function WmsStyleItem({ style, isSelected, onSelect }: WmsStyleItemProps): JSX.Element {
  // Log
  logger.logTraceRender('components/layers/right-panel/layer-settings/wms-style-selector > WmsStyleItem');

  // Hooks
  const theme = useTheme();
  const memoSxClasses = useMemo((): SxStyles => {
    return getSxClasses(theme);
  }, [theme]);

  // State
  const [legendSrc, setLegendSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  /**
   * Synchronizes the legend preview with the selected style metadata.
   */
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
        <Box component="span" sx={[memoSxClasses.previewImageContainer, memoSxClasses.wmsStylePreviewImageContainer] as SxProps}>
          <CircularProgressBase size={40} />
        </Box>
      );
    }
    if (legendSrc) {
      return (
        <Box component="span" sx={[memoSxClasses.previewImageContainer, memoSxClasses.wmsStylePreviewImageContainer] as SxProps}>
          <Box component="img" alt="" src={legendSrc} sx={[memoSxClasses.previewImage, memoSxClasses.wmsStylePreviewImage] as SxProps} />
        </Box>
      );
    }
    return (
      <Box component="span" sx={[memoSxClasses.previewImageContainer, memoSxClasses.wmsStylePreviewImageContainer] as SxProps}>
        <ImageNotSupportedIcon sx={memoSxClasses.settingSelectorPreviewIcon} />
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
      sx={[memoSxClasses.settingsCard, isSelected && memoSxClasses.settingsCardSelected] as SxProps}
    >
      {renderIcon()}
      <Box component="span" sx={memoSxClasses.settingsCardText}>
        <Typography component="span" sx={memoSxClasses.settingsCardTitle}>
          {style.Name}
        </Typography>
      </Box>
    </ButtonBase>
  );
}

/**
 * Creates the inline WMS style settings panel.
 *
 * Displays available styles as cards within a collapsible section,
 * consistent with the raster function panel pattern.
 *
 * @param props - Properties defined in WmsStylePanelProps interface
 * @returns The WMS style panel
 */
export function WmsStylePanel({ layerPath }: WmsStylePanelProps): JSX.Element {
  // Log
  logger.logTraceRender('components/layers/right-panel/layer-settings/wms-style-selector > WmsStylePanel');

  // Hooks
  const { t } = useTranslation();
  const theme = useTheme();
  const memoSxClasses = useMemo((): SxStyles => {
    return getSxClasses(theme);
  }, [theme]);

  // Store hooks
  const currentWmsStyle = useStoreLayerWmsStyle(layerPath);
  const storeWmsStyles = useStoreLayerWmsStyles(layerPath);
  /**
   * Resolves the available WMS styles for the layer.
   */
  const memoWmsStyleArray = useMemo((): TypeMetadataWMSCapabilityLayerStyle[] => {
    logger.logTraceUseMemo('WMS-STYLE-SELECTOR - memoWmsStyleArray', storeWmsStyles);
    return storeWmsStyles || [];
  }, [storeWmsStyles]);
  const layerController = useLayerController();

  // State
  const [expanded, setExpanded] = useState<boolean>(false);

  const baseId = useId();
  const collapseId = `${baseId}-content`;
  const titleId = `${baseId}-title`;

  // #region Handlers

  /**
   * Applies the selected WMS style to the layer.
   */
  const handleSelect = useCallback(
    (wmsStyleName: string): void => {
      layerController.setLayerWmsStyle(layerPath, wmsStyleName);
    },
    [layerPath, layerController]
  );

  /**
   * Handles expanding or collapsing the WMS style settings.
   */
  const handleToggle = useCallback((): void => {
    setExpanded((prev) => !prev);
  }, []);

  // #endregion Handlers

  return (
    <Box sx={memoSxClasses.settingsSection}>
      <ButtonBase
        sx={memoSxClasses.settingsSectionHeader}
        onClick={handleToggle}
        aria-expanded={expanded}
        aria-controls={collapseId}
        disableRipple
      >
        <PaletteIcon fontSize="small" />
        <Box component="span" sx={memoSxClasses.settingsSectionHeaderText}>
          <Typography component="span" sx={memoSxClasses.settingsSectionTitle} id={titleId}>
            {t('layers.settings.selectWmsStyle')}
          </Typography>
          {currentWmsStyle && (
            <Typography component="span" variant="body2" color="text.secondary" sx={memoSxClasses.settingsSectionSummary} noWrap>
              {currentWmsStyle}
            </Typography>
          )}
        </Box>
        {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
      </ButtonBase>
      <Collapse
        id={collapseId}
        in={expanded}
        sx={expanded ? memoSxClasses.settingsSectionContentExpanded : memoSxClasses.settingsSectionContentCollapsed}
      >
        <Box role="group" aria-labelledby={titleId} sx={memoSxClasses.settingsCardList}>
          {memoWmsStyleArray.map((style) => (
            <WmsStyleItem key={style.Name} style={style} isSelected={currentWmsStyle === style.Name} onSelect={handleSelect} />
          ))}
        </Box>
      </Collapse>
    </Box>
  );
}
