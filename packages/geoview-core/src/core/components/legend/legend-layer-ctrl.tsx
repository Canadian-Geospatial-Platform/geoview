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
import {
  useLayerHighlightedLayer,
  useLayerStoreActions,
  useSelectorLayerChildren,
  useSelectorLayerControls,
  useSelectorLayerItems,
  useSelectorLayerStatus,
} from '@/core/stores/store-interface-and-intial-values/layer-state';
import { TypeLegendItem, TypeLegendLayer } from '@/core/components/layers/types';
import { useMapStoreActions, useSelectorLayerVisibility } from '@/core/stores/';
import { getSxClasses } from './legend-styles';
import { logger } from '@/core/utils/logger';

interface SecondaryControlsProps {
  layerPath: string;
}

type ControlActions = {
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
  const { setHighlightLayer, zoomToLayerExtent } = useLayerStoreActions();

  return useMemo(
    () => ({
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
    [layerPath, setHighlightLayer, setOrToggleLayerVisibility, zoomToLayerExtent]
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
export function SecondaryControls({ layerPath }: SecondaryControlsProps): JSX.Element {
  // Log
  logger.logTraceRender('components/legend/legend-layer-ctrl', layerPath);

  // Hooks
  const { t } = useTranslation<string>();
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);
  const layerStatus = useSelectorLayerStatus(layerPath);
  const layerChildren = useSelectorLayerChildren(layerPath);
  const layerItems = useSelectorLayerItems(layerPath);
  const layerControls = useSelectorLayerControls(layerPath);
  const isVisible = useSelectorLayerVisibility(layerPath);
  const highlightedLayer = useLayerHighlightedLayer();

  // Is button disabled?
  const isLayerVisibleCapable = layerControls?.visibility ?? false;

  // Component helper
  const controls = useControlActions(layerPath);
  const subTitle = useSubtitle(layerChildren || [], layerItems || []);

  if (!['processed', 'loaded'].includes(layerStatus || 'error')) {
    return <Box />;
  }

  return (
    <Stack direction="row" alignItems="center" sx={sxClasses.layerStackIcons}>
      {!!subTitle.length && <Typography fontSize={14}>{subTitle}</Typography>}
      <Box sx={sxClasses.subtitle}>
        <IconButton
          edge="end"
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
