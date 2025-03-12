import { useTheme } from '@mui/material';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  IconButton,
  Stack,
  VisibilityOutlinedIcon,
  HighlightOutlinedIcon,
  ZoomInSearchIcon,
  Typography,
  VisibilityOffOutlinedIcon,
  HighlightIcon,
} from '@/ui';
import { useLayerHighlightedLayer, useLayerStoreActions } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { TypeLegendItem, TypeLegendLayer } from '@/core/components/layers/types';
import { useMapStoreActions } from '@/core/stores/';
import { getSxClasses } from './legend-styles';
import { logger } from '@/core/utils/logger';
import { TypeLayerControls } from '@/api/config/types/map-schema-types';
import { CenterFocusScaleIcon } from '@/ui/icons';

interface SecondaryControlsProps {
  layer: TypeLegendLayer;
  isVisible: boolean; // Visibility come from store ordered layer info array
  isInVisibleRange: boolean;
}

type ControlActions = {
  handleZoomToLayerVisibleScale: (event: React.MouseEvent) => void;
  handleToggleVisibility: (event: React.MouseEvent) => boolean;
  handleHighlightLayer: (event: React.MouseEvent) => void;
  handleZoomTo: (event: React.MouseEvent) => void;
};

// Constant style outside of render
const styles = {
  btnMargin: { marginTop: '-0.3125rem' },
} as const;

// Custom hook for control actions
const useControlActions = (layerPath: string): ControlActions => {
  // Store
  const { setOrToggleLayerVisibility } = useMapStoreActions();
  const { setHighlightLayer, zoomToLayerExtent, zoomToLayerVisibleScale } = useLayerStoreActions();

  return useMemo(
    () => ({
      handleZoomToLayerVisibleScale: (event: React.MouseEvent): void => {
        event.stopPropagation();
        zoomToLayerVisibleScale(layerPath);
      },
      handleToggleVisibility: (event: React.MouseEvent): boolean => {
        event.stopPropagation();
        return setOrToggleLayerVisibility(layerPath);
      },
      handleHighlightLayer: (event: React.MouseEvent): void => {
        event.stopPropagation();
        setHighlightLayer(layerPath);
      },
      handleZoomTo: (event: React.MouseEvent): void => {
        event.stopPropagation();
        zoomToLayerExtent(layerPath).catch((error) => {
          logger.logPromiseFailed('in zoomToLayerExtent in legend-layer.handleZoomTo', error);
        });
      },
    }),
    [layerPath, setHighlightLayer, setOrToggleLayerVisibility, zoomToLayerExtent, zoomToLayerVisibleScale]
  );
};

// Create subtitle
const useSubtitle = (children: TypeLegendLayer[], items: TypeLegendItem[]): string => {
  // Hooks
  const { t } = useTranslation();

  return useMemo(() => {
    if (children.length) {
      return t('legend.subLayersCount').replace('{count}', children.length.toString());
    }
    if (items.length > 1) {
      return t('legend.itemsCount')
        .replace('{count}', items.filter((item) => item.isVisible).length.toString())
        .replace('{totalCount}', items.length.toString());
    }
    return '';
  }, [children.length, items, t]);
};

// SecondaryControls component (no memo to force re render from layers panel modifications)
export function SecondaryControls({ layer, isVisible, isInVisibleRange }: SecondaryControlsProps): JSX.Element {
  // Extract constant from layer prop
  const { layerPath, layerStatus, items, children } = layer;
  const layerControls: TypeLayerControls | undefined = layer.controls;

  // Log
  logger.logTraceRender('components/legend/legend-layer-ctrl', layerPath, isVisible, isInVisibleRange);

  // Hooks
  const { t } = useTranslation<string>();
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);

  // Stores
  const highlightedLayer = useLayerHighlightedLayer();

  // Is button disabled?
  const isLayerVisibleCapable = (layerControls?.visibility && isInVisibleRange) ?? false;

  // Component helper
  const controls = useControlActions(layerPath);
  const subTitle = useSubtitle(children, items);

  if (!['processed', 'loaded'].includes(layerStatus || 'error')) {
    return <Box />;
  }

  return (
    <Stack direction="row" alignItems="center" sx={sxClasses.layerStackIcons}>
      {!!subTitle.length && <Typography fontSize={14}>{subTitle}</Typography>}
      <Box sx={sxClasses.subtitle}>
        <IconButton
          edge="end"
          tooltip={t('layers.zoomVisibleScale') as string}
          className={`buttonOutline ${isInVisibleRange ? 'outOfRangeButton' : ''}`}
          onClick={controls.handleZoomToLayerVisibleScale}
        >
          <CenterFocusScaleIcon />
        </IconButton>
        <IconButton
          edge={isInVisibleRange ? false : 'end'}
          tooltip={t('layers.toggleVisibility') as string}
          className="buttonOutline"
          onClick={controls.handleToggleVisibility}
          disabled={!isLayerVisibleCapable}
        >
          {isVisible ? <VisibilityOutlinedIcon /> : <VisibilityOffOutlinedIcon />}
        </IconButton>
        <IconButton
          tooltip={t('legend.highlightLayer') as string}
          sx={styles.btnMargin}
          className="buttonOutline"
          onClick={controls.handleHighlightLayer}
        >
          {highlightedLayer === layerPath ? <HighlightIcon /> : <HighlightOutlinedIcon />}
        </IconButton>
        <IconButton tooltip={t('legend.zoomTo') as string} className="buttonOutline" onClick={controls.handleZoomTo}>
          <ZoomInSearchIcon />
        </IconButton>
      </Box>
    </Stack>
  );
}
