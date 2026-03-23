import { LegendLayer } from 'geoview-core/core/components/legend/legend-layer';
import { CONTAINER_TYPE } from 'geoview-core/core/utils/constant';
import { logger } from 'geoview-core/core/utils/logger';
import type { TypeLegendItem } from '../custom-legend-types';

import { isLegendLayer } from '../custom-legend-types';

/** Props for the LegendLayerItem component. */
interface LegendLayerItemProps {
  item: TypeLegendItem;
}

/**
 * Renders a legend layer item from geoview-core.
 *
 * Uses CONTAINER_TYPE.APP_BAR because this plugin extends AppBarPlugin
 * and will always be displayed in the application bar.
 *
 * @param props - Component props
 * @returns The rendered legend layer, or undefined if the item is not a layer
 */
export function LegendLayerItem({ item }: LegendLayerItemProps): JSX.Element | undefined {
  logger.logTraceRender('geoview-custom-legend/components/layer-item');

  if (!isLegendLayer(item)) return;

  return <LegendLayer layerPath={item.layerPath} showControls={true} containerType={CONTAINER_TYPE.APP_BAR} />;
}
