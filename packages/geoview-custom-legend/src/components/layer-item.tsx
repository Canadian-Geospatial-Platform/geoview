import { LegendLayer } from 'geoview-core/core/components/legend/legend-layer';
import { CONTAINER_TYPE } from 'geoview-core/core/utils/constant';
import type { TypeLegendItem } from '../custom-legend-types';

import { isLegendLayer } from '../custom-legend-types';

interface LegendLayerItemProps {
  item: TypeLegendItem;
}

/**
 * Renders a legend layer item from geoview-core.
 *
 * Uses CONTAINER_TYPE.APP_BAR because this plugin extends AppBarPlugin
 * and will always be displayed in the application bar.
 *
 * @param {LegendLayerItemProps} props - Component props
 * @returns {JSX.Element | undefined} The rendered legend layer
 */
export function LegendLayerItem({ item }: LegendLayerItemProps): JSX.Element | undefined {
  if (!isLegendLayer(item)) return;

  return <LegendLayer layerPath={item.layerPath} showControls={true} containerType={CONTAINER_TYPE.APP_BAR} />;
}
