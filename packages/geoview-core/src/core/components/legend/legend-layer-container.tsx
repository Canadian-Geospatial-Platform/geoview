import { useTheme } from '@mui/material';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Collapse, List } from '@/ui';
import { getSxClasses } from './legend-styles';
import { CONST_LAYER_TYPES } from '@/api/config/types/map-schema-types';
import { ItemsList } from './legend-layer-items';
import { LegendLayer } from './legend-layer';
import {
  useSelectorLayerChildren,
  useSelectorLayerIcons,
  useSelectorLayerItems,
  useSelectorLayerType,
  useSelectorLayerStatus,
} from '@/core/stores/store-interface-and-intial-values/layer-state';
import { logger } from '@/core/utils/logger';
import { useSelectorLayerLegendCollapsed } from '@/core/stores/store-interface-and-intial-values/map-state';

interface CollapsibleContentProps {
  layerPath: string;
  initLightBox: (imgSrc: string, title: string, index: number, total: number) => void;
  LegendLayerComponent: typeof LegendLayer;
}

interface WMSLegendImageProps {
  imgSrc: string;
  title: string;
  initLightBox: (imgSrc: string, title: string, index: number, total: number) => void;
  legendExpanded: boolean;
  sxClasses: Record<string, object>;
}

// Constant style outside of render
const styles = {
  wmsImage: {
    maxWidth: '90%',
    cursor: 'pointer',
  },
} as const;

// Extracted WMS Legend Component
const WMSLegendImage = memo(
  ({ imgSrc, initLightBox, legendExpanded, sxClasses, title }: WMSLegendImageProps): JSX.Element => (
    <Collapse in={legendExpanded} sx={sxClasses.collapsibleContainer} timeout="auto">
      <Box
        component="img"
        tabIndex={0}
        src={imgSrc}
        sx={styles.wmsImage}
        title={title}
        onClick={() => initLightBox(imgSrc, '', 0, 2)}
        onKeyDown={(e) => (e.code === 'Space' || e.code === 'Enter' ? initLightBox(imgSrc, '', 0, 2) : null)}
      />
    </Collapse>
  )
);
WMSLegendImage.displayName = 'WMSLegendImage';

export const CollapsibleContent = memo(function CollapsibleContent({
  layerPath,
  initLightBox,
  LegendLayerComponent,
}: CollapsibleContentProps): JSX.Element | null {
  // Hooks
  const { t } = useTranslation();
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);
  const layerType = useSelectorLayerType(layerPath);
  const isCollapsed = useSelectorLayerLegendCollapsed(layerPath);
  const layerItems = useSelectorLayerItems(layerPath);
  const layerChildren = useSelectorLayerChildren(layerPath);
  const layerIcons = useSelectorLayerIcons(layerPath);
  const layerStatus = useSelectorLayerStatus(layerPath);

  // Log
  logger.logTraceUseMemo('components/legend/legend-layer-container - CollapsibleContent', layerPath, layerChildren?.length);

  // Early returns
  if ((layerChildren?.length === 0 && layerItems?.length === 1) || layerStatus === 'error') return null;

  const isWMSWithLegend = layerType === CONST_LAYER_TYPES.WMS && layerIcons?.[0]?.iconImage && layerIcons[0].iconImage !== 'no data';

  // If it is a WMS legend, create a specific component
  if (isWMSWithLegend) {
    return (
      <WMSLegendImage
        imgSrc={layerIcons[0].iconImage!}
        initLightBox={initLightBox}
        legendExpanded={!isCollapsed}
        sxClasses={sxClasses}
        title={t('general.clickEnlarge')}
      />
    );
  }

  return (
    <Collapse in={!isCollapsed} sx={sxClasses.collapsibleContainer} timeout="auto" unmountOnExit>
      <List>{layerChildren && layerChildren.map((item) => <LegendLayerComponent layerPath={item.layerPath} key={item.layerPath} />)}</List>
      <ItemsList items={layerItems || []} layerPath={layerPath} />
    </Collapse>
  );
});
