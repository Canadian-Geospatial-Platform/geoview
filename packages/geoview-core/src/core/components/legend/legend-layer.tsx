import { memo, useCallback, useId, useMemo, useEffect, useRef, useState } from 'react';

import { useTranslation } from 'react-i18next';

import { useTheme } from '@mui/material';

import { useGeoViewMapId } from '@/core/stores/geoview-store';
import { Box, ListItem, ListItemText, IconButton, KeyboardArrowDownIcon, KeyboardArrowUpIcon, ProgressBar } from '@/ui';
import {
  useLayerSelectorChildren,
  useLayerSelectorItems,
  useLayerSelectorName,
  useLayerSelectorStatus,
  useLayerSelectorSchemaTag,
} from '@/core/stores/store-interface-and-intial-values/layer-state';
import {
  useMapStoreActions,
  useMapSelectorLayerLegendCollapsed,
  useMapSelectorIsLayerHiddenOnMap,
} from '@/core/stores/store-interface-and-intial-values/map-state';
import { useLightBox } from '@/core/components/common';
import { LayerIcon } from '@/core/components/common/layer-icon';
import { SecondaryControls } from './legend-layer-ctrl';
import { CollapsibleContent } from './legend-layer-container';
import { CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';
import { getSxClasses } from './legend-styles';
import { logger } from '@/core/utils/logger';
import type { TypeContainerBox } from '@/core/types/global-types';
import { Typography } from '@/ui/typography/typography';

export interface LegendLayerProps {
  layerPath: string;
  showControls: boolean;
  containerType: TypeContainerBox;
}

interface LegendLayerHeaderProps {
  layerPath: string;
  tooltip: string;
  onExpandClick: (event: React.MouseEvent) => void;
  sxClasses: ReturnType<typeof getSxClasses>;
  showControls: boolean;
  layerNameId: string;
  collapseContainerId: string;
}

// Extracted Header Component
const LegendLayerHeader = memo(
  ({
    layerPath,
    tooltip,
    onExpandClick,
    sxClasses,
    showControls,
    layerNameId,
    collapseContainerId,
  }: LegendLayerHeaderProps): JSX.Element => {
    // Log
    logger.logTraceUseMemo('components/legend/legend-layer - LegendLayerHeader', layerPath);

    // Hooks
    const isCollapsed = useMapSelectorLayerLegendCollapsed(layerPath);
    const layerHidden = useMapSelectorIsLayerHiddenOnMap(layerPath);
    const layerName = useLayerSelectorName(layerPath) ?? layerPath;
    const layerItems = useLayerSelectorItems(layerPath);
    const layerChildren = useLayerSelectorChildren(layerPath);
    const schemaTag = useLayerSelectorSchemaTag(layerPath);
    const layerStatus = useLayerSelectorStatus(layerPath);

    // Return the ui
    return (
      <Box
        key={layerPath}
        sx={sxClasses.legendListItemHeader}
        className={`legendListItemHeader${layerHidden || layerStatus === 'error' ? ' outOfRange' : ''}`}
      >
        <LayerIcon layerPath={layerPath} />
        <ListItemText
          primary={
            <Typography component="div" id={layerNameId}>
              {layerName}
            </Typography>
          }
          sx={sxClasses.legendTitle}
          className="legendTitle"
          disableTypography
          secondary={showControls ? <SecondaryControls layerPath={layerPath} /> : undefined}
        />
        {showControls &&
          ((layerChildren && layerChildren.length > 0) || (layerItems && layerItems.length > 1) || schemaTag === CONST_LAYER_TYPES.WMS) && (
            <IconButton
              className="buttonOutline"
              onClick={onExpandClick}
              edge="end"
              size="small"
              tooltip={tooltip}
              aria-label={`${tooltip} - ${layerName}`} // WCAG - Provide descriptive aria-label for icon button tooltips
              aria-expanded={!isCollapsed} // WCAG - Indicate expanded/collapsed state with aria-expanded
              aria-controls={!isCollapsed ? collapseContainerId : undefined} // WCAG - Link button to collapsible content using aria-controls and matching IDs
            >
              {!isCollapsed ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            </IconButton>
          )}
      </Box>
    );
  }
);

LegendLayerHeader.displayName = 'LegendLayerHeader';

/**
 * Renders a layer entry in the legend with collapsible content.
 *
 * Triggers screen reader announcements when layer status changes between
 * loading/loaded/error states via ARIA live regions.
 */
export function LegendLayer({ layerPath, showControls, containerType }: LegendLayerProps): JSX.Element {
  // Log
  logger.logTraceRender('components/legend/legend-layer', layerPath);

  // Hooks
  const { t } = useTranslation<string>();
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);
  const mapId = useGeoViewMapId();
  const id = useId(); // WCAG - Generate a stable unique ID
  const layerNameId = `${mapId}-${containerType}-layer-name-${id}`; // WCAG - IDs to link the layer name to icon buttons related to it (aria-describedby)
  const collapseContainerId = `${mapId}-${containerType}-collapse-${id}`; // WCAG - IDs to link collapse buttons to collapsible content related to it (aria-controls)

  // Stores
  const layerStatus = useLayerSelectorStatus(layerPath);
  const layerName = useLayerSelectorName(layerPath) ?? layerPath;
  const { initLightBox, LightBoxComponent } = useLightBox();
  const { toggleLegendCollapsed } = useMapStoreActions();

  // Internal state
  const prevStatusRef = useRef<string | undefined>(undefined); // Ref to track previous status for status change detection
  const [statusMessage, setStatusMessage] = useState<string>('');

  const handleExpandGroupClick = useCallback(
    (event: React.MouseEvent): void => {
      event.stopPropagation();
      toggleLegendCollapsed(layerPath); // store value
    },
    [layerPath, toggleLegendCollapsed]
  );

  // WCAG - Track layer status changes for screen reader announcements
  useEffect(() => {
    if (layerStatus === 'loading' && prevStatusRef.current !== 'loading') {
      // Announce when loading starts
      setStatusMessage(t('legend.layerLoadingDescriptive', { layerName }) || '');
      prevStatusRef.current = layerStatus;
    } else if (layerStatus === 'loaded' && prevStatusRef.current === 'loading') {
      // Announce when loading completes successfully
      setStatusMessage(t('legend.layerLoadedDescriptive', { layerName }) || '');
      prevStatusRef.current = layerStatus;
    } else if (layerStatus === 'error' && prevStatusRef.current === 'loading') {
      // Announce when loading fails
      setStatusMessage(t('legend.layerErrorDescriptive', { layerName }) || '');
      prevStatusRef.current = layerStatus;
    } else {
      // Update ref for any other status changes
      prevStatusRef.current = layerStatus;
    }
  }, [layerStatus, layerName, t]);

  return (
    <ListItem className="legendListItem" sx={sxClasses.legendListItem} key={layerPath}>
      <LegendLayerHeader
        layerPath={layerPath}
        tooltip={t('layers.toggleCollapse')}
        onExpandClick={handleExpandGroupClick}
        sxClasses={sxClasses}
        showControls={showControls}
        layerNameId={layerNameId}
        collapseContainerId={collapseContainerId}
      />
      {/* WCAG - ARIA live region for screen reader announcements */}
      <Box sx={sxClasses.visuallyHidden} role="status" aria-live="polite" aria-atomic="true">
        {statusMessage}
      </Box>
      {layerStatus === 'loading' && (
        <Box sx={sxClasses.loading}>
          <ProgressBar aria-label={t('legend.layerLoadingDescriptive', { layerName }) || undefined} />
        </Box>
      )}

      <CollapsibleContent
        layerPath={layerPath}
        initLightBox={initLightBox}
        LegendLayerComponent={LegendLayer}
        showControls={showControls}
        containerType={containerType}
        collapseContainerId={collapseContainerId}
        layerNameId={layerNameId}
      />
      <LightBoxComponent />
    </ListItem>
  );
}
