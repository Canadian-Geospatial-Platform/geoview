import { useTheme } from '@mui/material';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ToggleAll } from '../toggle-all/toggle-all';
import { Box, Typography } from '@/ui';
import { useGeoViewMapId, useLayerLegendLayers } from '@/core/stores/';
import { logger } from '@/core/utils/logger';

import { getSxClassesMain, getSxClasses } from './legend-styles';
import { LegendLayer } from './legend-layer';
import type { TypeLegendLayer } from '@/core/components/layers/types';
import { CONTAINER_TYPE } from '@/core/utils/constant';
import { useEventListener } from '@/core/components/common/hooks/use-event-listener';

interface LegendCustomProps {
  fullWidth?: boolean;
  containerType?: 'appBar' | 'footerBar';
}

// Constant style outside of render (styles)
const styles = {
  noLayersContainer: {
    padding: '2rem',
    margin: '2rem',
    width: '100%',
    textAlign: 'center',
    height: 'fit-content',
  },
  layerBox: {
    paddingRight: '0.65rem',
  },
  flexContainer: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
} as const;

// Constant style outside of render (responsive widths)
const responsiveWidths = {
  full: { xs: '100%' },
  responsive: {
    xs: '100%',
    sm: '50%',
    md: '33.33%',
    lg: '25%',
    xl: '25%',
  },
} as const;

export function LegendCustom({ fullWidth, containerType = CONTAINER_TYPE.FOOTER_BAR }: LegendCustomProps): JSX.Element {
  logger.logTraceRender('components/legend/legend-custom');

  // Hooks
  const { t } = useTranslation<string>();
  const theme = useTheme();
  const sxClassesMain = useMemo(() => getSxClassesMain(), []);
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);

  // State
  const [formattedLegendLayerList, setFormattedLegendLayersList] = useState<TypeLegendLayer[][]>([]);
  const [itemsJson, setItemsJson] = useState<string>('[]');

  // Store
  const mapId = useGeoViewMapId();
  const layersList = useLayerLegendLayers();

  // Memoize breakpoint values
  const breakpoints = useMemo(() => {
    // Log
    logger.logTraceUseMemo('LEGEND-CUSTOM - breakpoints', theme.breakpoints.values);

    return {
      sm: theme.breakpoints.values.sm,
      md: theme.breakpoints.values.md,
      lg: theme.breakpoints.values.lg,
    };
  }, [theme.breakpoints.values]);

  /**
   * Get the size of list based on window size.
   */
  const getLegendLayerListSize = useCallback(() => {
    if (containerType === CONTAINER_TYPE.APP_BAR) return 1;

    const { innerWidth } = window;
    if (innerWidth < breakpoints.sm) return 1;
    if (innerWidth < breakpoints.md) return 2;
    if (innerWidth < breakpoints.lg) return 3;
    return 4;
  }, [breakpoints, containerType]);

  /**
   * Transform the list of the legends into subsets of lists.
   * it will return subsets of lists with pattern:- [[0,4,8],[1,5,9],[2,6],[3,7] ]
   * This way we can layout the legends into column wraps.
   * @param {TypeLegendLayer} layers array of layers.
   * @returns List of array of layers
   */
  const updateLegendLayerListByWindowSize = useCallback(
    (layers: TypeLegendLayer[]): void => {
      const arrSize = getLegendLayerListSize();
      const list = Array.from({ length: arrSize }, () => []) as Array<TypeLegendLayer[]>;

      layers.forEach((layer, index) => {
        list[index % arrSize].push(layer);
      });

      // Format the list only if there is layers
      setFormattedLegendLayersList(layers.length === 0 ? [] : list);
    },
    [getLegendLayerListSize]
  );

  // Memoize the window resize handler and use the hook to add listener to avoid many creation
  const handleWindowResize = useCallback(() => {
    // Log
    logger.logTraceUseCallback('LEGEND-CUSTOM - window resize event');

    // Update the layer list based on window size
    updateLegendLayerListByWindowSize(layersList);
  }, [layersList, updateLegendLayerListByWindowSize]);

  // Helper to flatten a layer and all its children
  const flattenLayerTree = useCallback((layer: TypeLegendLayer): TypeLegendLayer[] => {
    const acc: TypeLegendLayer[] = [layer];
    if (Array.isArray(layer.children) && layer.children.length) {
      layer.children.forEach((child) => {
        acc.push(...flattenLayerTree(child));
      });
    }
    return acc;
  }, []);

  // Keep editable JSON in sync with current items list
  useEffect(() => {
    const detailed = formattedLegendLayerList
      .flat() // flatten columns
      .flatMap((l) => flattenLayerTree(l)) // include children recursively
      .map((l) => ({
        layerPath: l.layerPath,
        layerName: l.layerName,
        items: (l.items || []).map(({ geometryType, name, isVisible, icon }) => ({ geometryType, name, isVisible, icon })),
        icons: (l.icons || []).map(({ geometryType, iconType, name, iconImage, iconImageStacked, iconList }) => ({
          geometryType,
          iconType,
          name,
          iconImage,
          iconImageStacked,
          iconList: (iconList || []).map(({ geometryType: g, name: n, isVisible: v, icon: i }) => ({
            geometryType: g,
            name: n,
            isVisible: v,
            icon: i,
          })),
        })),
      }));
    setItemsJson(JSON.stringify(detailed, null, 2));
  }, [formattedLegendLayerList, flattenLayerTree]);

  // Wire a handler using a custom hook on the window resize event
  useEventListener<Window>('resize', handleWindowResize, window);

  // Handle initial layer setup
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('LEGEND-CUSTOM - layer setup', layersList);

    // Update the layer list based on window size
    updateLegendLayerListByWindowSize(layersList);
  }, [layersList, updateLegendLayerListByWindowSize]);

  // Memoize the no layers content
  const noLayersContent = useMemo(() => {
    // Log
    logger.logTraceUseMemo('components/legend-custom - noLayersContent');

    return (
      <Box sx={styles.noLayersContainer}>
        <Typography variant="h3" gutterBottom sx={sxClasses.legendInstructionsTitle}>
          {t('legend.noLayersAdded')}
        </Typography>
        <Typography component="p" sx={sxClasses.legendInstructionsBody}>
          {t('legend.noLayersAddedDescription')}
        </Typography>
      </Box>
    );
  }, [sxClasses, t]);

  // Memoize the rendered content based on whether there are legend layers
  const content = useMemo(() => {
    // Log
    logger.logTraceUseMemo('components/legend-custom - content', formattedLegendLayerList.length);

    if (!formattedLegendLayerList.length) {
      return noLayersContent;
    }

    return formattedLegendLayerList.map((layers, idx) => (
      // eslint-disable-next-line react/no-array-index-key
      <Box key={`${idx}`} width={fullWidth ? responsiveWidths.full : responsiveWidths.responsive} sx={styles.layerBox}>
        {layers.map((layer) => (
          <LegendLayer layerPath={layer.layerPath} key={layer.layerPath} />
        ))}
      </Box>
    ));
  }, [formattedLegendLayerList, fullWidth, noLayersContent]);

  return (
    <>
      <Box sx={sxClasses.toggleBar}>
        <ToggleAll />
      </Box>
      <Box
        sx={{ background: theme.palette.geoViewColor.bgColor.main, ...sxClassesMain.container }}
        id={`${mapId}-${containerType}-legendCustom`}
      >
        <Box sx={styles.flexContainer}>{content}</Box>
      </Box>
      <Box sx={{ mt: 2, pl: '20px', pr: '20px', pb: '5px' }}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          {t('Items JSON (editable)')}
        </Typography>
        <Box
          component="textarea"
          value={itemsJson}
          onChange={(e) => setItemsJson((e.target as HTMLTextAreaElement).value)}
          wrap="off"
          sx={{
            width: '300px',
            minHeight: '80px',
            maxHeight: '300px',
            fontFamily: 'monospace',
            fontSize: '0.875rem',
            lineHeight: 1.4,
            padding: '0.5rem',
            borderRadius: '6px',
            border: `1px solid ${theme.palette.divider}`,
            background: theme.palette.background.paper,
            color: theme.palette.text.primary,
            overflow: 'scroll',
            whiteSpace: 'pre',
          }}
        />
      </Box>
    </>
  );
}
