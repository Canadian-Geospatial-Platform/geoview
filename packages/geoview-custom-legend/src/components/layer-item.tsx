import { LegendLayer } from 'geoview-core/core/components/legend/legend-layer';
import type { TypeLegendItem } from '../custom-legend-types';
import { isLegendLayer } from '../custom-legend-types';

interface LegendLayerItemProps {
  item: TypeLegendItem;
}

/**
 * Renders a legend layer item from geoview-core.
 * @param {LegendLayerItemProps} props - Component props
 * @returns {JSX.Element | undefined} The rendered legend layer
 */
export function LegendLayerItem({ item }: LegendLayerItemProps): JSX.Element | undefined {
  if (!isLegendLayer(item)) return;

  return <LegendLayer layerPath={item.layerPath} />;
}
