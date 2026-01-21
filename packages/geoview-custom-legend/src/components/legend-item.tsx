import type { TypeLegendItem } from '../custom-legend-types';
import { isLegendLayer, isHeaderLayer, isGroupLayer } from '../custom-legend-types';
import type { getSxClasses } from '../custom-legend-style';
import { HeaderItem } from './header-item';
import { LegendLayerItem } from './legend-layer-item';
import { GroupItem } from './group-item';

interface LegendItemProps {
  item: TypeLegendItem;
  sxClasses: ReturnType<typeof getSxClasses>;
  itemPath?: string;
}

/**
 * Renders a single legend item based on its type.
 * @function LegendItem
 * @param {LegendItemProps} props - Component props
 * @returns {JSX.Element} The rendered item
 */
export function LegendItem({ item, sxClasses, itemPath }: LegendItemProps): JSX.Element | undefined {
  if (isLegendLayer(item)) {
    return <LegendLayerItem item={item} />;
  }

  if (isHeaderLayer(item)) {
    return <HeaderItem item={item} sxClasses={sxClasses} />;
  }

  if (isGroupLayer(item)) {
    return <GroupItem item={item} sxClasses={sxClasses} itemPath={itemPath} />;
  }

  return;
}
