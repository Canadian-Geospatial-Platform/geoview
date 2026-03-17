import { memo, useId, useMemo, type ComponentType } from 'react';

import { useTranslation } from 'react-i18next';

import { useTheme } from '@mui/material';

import { Box, Button, Collapse, List } from '@/ui';
import { getSxClasses } from './legend-styles';
import { CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';
import { ItemsList } from './legend-layer-items';
import type { LegendLayerProps } from './legend-layer';
import {
  useLayerSelectorChildren,
  useLayerSelectorIcons,
  useLayerSelectorItems,
  useLayerSelectorName,
  useLayerSelectorStatus,
  useLayerSelectorSchemaTag,
} from '@/core/stores/store-interface-and-intial-values/layer-state';
import { useGeoViewMapId } from '@/core/stores/geoview-store';
import { logger } from '@/core/utils/logger';
import { useMapSelectorLayerLegendCollapsed } from '@/core/stores/store-interface-and-intial-values/map-state';
import type { TypeContainerBox } from '@/core/types/global-types';

interface CollapsibleContentProps {
  layerPath: string;
  initLightBox: (images: string, altText: string, returnFocusId: string, index?: number) => void;
  LegendLayerComponent: ComponentType<LegendLayerProps>;
  showControls: boolean;
  containerType: TypeContainerBox;
  collapseContainerId: string;
  layerNameId: string;
}

interface WMSLegendImageProps {
  imgSrc: string;
  title?: string;
  initLightBox: (images: string, altText: string, returnFocusId: string, index?: number) => void;
  legendExpanded: boolean;
  sxClasses: Record<string, object>;
  mapId: string;
  containerType: TypeContainerBox;
  collapseContainerId: string;
}

// Extracted WMS Legend Component
const WMSLegendImage = memo(
  ({
    imgSrc,
    initLightBox,
    legendExpanded,
    sxClasses,
    title,
    mapId,
    containerType,
    collapseContainerId,
  }: WMSLegendImageProps): JSX.Element => {
    const { t } = useTranslation();
    const id = useId();
    const buttonId = `${mapId}-${containerType}-legend-image-btn-${id}`; // Create unique ID for focus management after lightbox closes
    const altText = title ? `${t('legend.title')}, ${title}` : t('legend.title');

    return (
      <Collapse id={collapseContainerId} in={legendExpanded} sx={sxClasses.collapsibleContainer} timeout="auto">
        <Button
          type="icon"
          sx={sxClasses.imageButton}
          id={buttonId}
          onClick={() => initLightBox(imgSrc, altText, buttonId, 0)}
          tooltip={t('general.enlargeImage')!}
          tooltipPlacement="top"
          aria-label={title ? t('general.enlargeImageName', { title })! : t('general.enlargeImage')!} // WCAG - Descriptive aria-label for screen readers
          disableRipple
        >
          <Box component="img" src={imgSrc} alt={altText} sx={sxClasses.wmsImage} />
        </Button>
      </Collapse>
    );
  }
);
WMSLegendImage.displayName = 'WMSLegendImage';

export const CollapsibleContent = memo(function CollapsibleContent({
  layerPath,
  initLightBox,
  LegendLayerComponent,
  showControls,
  containerType,
  collapseContainerId,
  layerNameId,
}: CollapsibleContentProps): JSX.Element | null {
  // Hooks
  const mapId = useGeoViewMapId();
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);
  const isCollapsed = useMapSelectorLayerLegendCollapsed(layerPath);
  const schemaTag = useLayerSelectorSchemaTag(layerPath);
  const layerItems = useLayerSelectorItems(layerPath);
  const layerChildren = useLayerSelectorChildren(layerPath);
  const layerIcons = useLayerSelectorIcons(layerPath);
  const layerStatus = useLayerSelectorStatus(layerPath);
  const layerName = useLayerSelectorName(layerPath);

  // Log
  logger.logTraceUseMemo('components/legend/legend-layer-container - CollapsibleContent', layerPath, layerChildren?.length);

  // Early returns
  if ((layerChildren?.length === 0 && layerItems?.length === 1) || layerStatus === 'error') return null;

  const isWMSWithLegend = schemaTag === CONST_LAYER_TYPES.WMS && layerIcons?.[0]?.iconImage && layerIcons[0].iconImage !== 'no data';

  // If it is a WMS legend, create a specific component
  if (isWMSWithLegend) {
    return (
      <WMSLegendImage
        imgSrc={layerIcons[0].iconImage!}
        initLightBox={initLightBox}
        legendExpanded={!isCollapsed}
        sxClasses={sxClasses}
        title={layerName}
        mapId={mapId}
        containerType={containerType}
        collapseContainerId={collapseContainerId}
      />
    );
  }

  return (
    <Collapse
      id={collapseContainerId}
      role="region" // WCAG - aria-labelledby requires the region role to be announced by screen readers
      aria-labelledby={layerNameId} // WCAG - Link collapsible content to its header using aria-labelledby and matching IDs
      in={!isCollapsed}
      sx={sxClasses.collapsibleContainer}
      timeout="auto"
      unmountOnExit
    >
      <List>
        {layerChildren &&
          layerChildren.map((item) => (
            <LegendLayerComponent
              layerPath={item.layerPath}
              key={item.layerPath}
              showControls={showControls}
              containerType={containerType}
            />
          ))}
      </List>
      <ItemsList items={layerItems || []} layerPath={layerPath} />
    </Collapse>
  );
});
