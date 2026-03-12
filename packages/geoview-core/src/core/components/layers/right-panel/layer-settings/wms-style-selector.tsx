import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import type { SxProps } from '@mui/material';

import { Box, CircularProgress, Collapse, Typography } from '@/ui';
import { ImageNotSupportedIcon, PaletteIcon, ExpandMoreIcon, ExpandLessIcon } from '@/ui';

import { getSxClasses } from './layer-settings-style';
import { useLayerSelectorWmsStyle, useLayerSelectorWmsStyles } from '@/core/stores/store-interface-and-intial-values/layer-state';
import type { TypeLegendLayer } from '@/core/components/layers/types';
import type { TypeMetadataWMSCapabilityLayerStyle } from '@/api/types/layer-schema-types';
import { logger } from '@/core/utils/logger';
import { useLayerController } from '@/core/controllers/layer-controller';

interface WmsStyleItemProps {
  style: TypeMetadataWMSCapabilityLayerStyle;
  isSelected: boolean;
  onSelect: (name: string) => void;
}

interface WmsStylePanelProps {
  layerDetails: TypeLegendLayer;
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
  const [loading, setLoading] = useState(true);

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
        <Box sx={sxClasses.wmsStylePreviewImageContainer}>
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
    if (legendSrc) {
      return (
        <Box sx={sxClasses.wmsStylePreviewImageContainer}>
          <Box component="img" src={legendSrc} alt={style.Name} sx={sxClasses.wmsStylePreviewImage} />
        </Box>
      );
    }
    return (
      <Box sx={sxClasses.wmsStylePreviewImageContainer}>
        <ImageNotSupportedIcon sx={sxClasses.settingSelectorPreviewIcon} />
      </Box>
    );
  };

  const handleClick = useCallback((): void => {
    onSelect(style.Name);
  }, [onSelect, style.Name]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>): void => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onSelect(style.Name);
      }
    },
    [onSelect, style.Name]
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
        <Typography sx={{ fontWeight: 600 }}>{style.Name}</Typography>
      </Box>
    </Box>
  );
}

/**
 * Inline panel section for selecting WMS styles.
 *
 * Displays available styles as cards within a collapsible section,
 * consistent with the raster function panel pattern.
 *
 * @param layerDetails - The legend layer to configure WMS styles for.
 * @returns A JSX element representing the WMS style panel.
 */
export function WmsStylePanel({ layerDetails }: WmsStylePanelProps): JSX.Element {
  // Log
  logger.logTraceRender('components/layers/right-panel/layer-settings/wms-style-selector > WmsStylePanel');

  // Hooks
  const { t } = useTranslation();
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // Store hooks
  const currentWmsStyle = useLayerSelectorWmsStyle(layerDetails.layerPath);
  const storeWmsStyles = useLayerSelectorWmsStyles(layerDetails.layerPath);
  const memoWmsStyleArray = useMemo(() => storeWmsStyles || [], [storeWmsStyles]);
  const layerController = useLayerController();

  // State
  const [expanded, setExpanded] = useState(false);

  const handleSelect = useCallback(
    (wmsStyleName: string): void => {
      // TODO: REFACTOR - This setting of styles should be done through a controller, because it affects the domain directly.
      layerController.setLayerWmsStyle(layerDetails.layerPath, wmsStyleName);
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
        <PaletteIcon fontSize="small" />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={sxClasses.settingsSectionTitle}>{t('layers.settings.selectWmsStyle')}</Typography>
          {currentWmsStyle && (
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: theme.palette.geoViewFontSize.sm }} noWrap>
              {currentWmsStyle}
            </Typography>
          )}
        </Box>
        {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
      </Box>
      <Collapse in={expanded} sx={{ marginTop: expanded ? '12px' : 0 }}>
        <Box sx={sxClasses.settingsCardList}>
          {memoWmsStyleArray.map((style) => (
            <WmsStyleItem key={style.Name} style={style} isSelected={currentWmsStyle === style.Name} onSelect={handleSelect} />
          ))}
        </Box>
      </Collapse>
    </Box>
  );
}
