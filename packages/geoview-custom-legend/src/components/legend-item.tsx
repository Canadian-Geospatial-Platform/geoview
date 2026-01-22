import type { TypeWindow } from 'geoview-core/core/types/global-types';
import type { TypeLegendItem } from '../custom-legend-types';
import { isLegendLayer, isHeaderLayer, isGroupLayer } from '../custom-legend-types';
import type { getSxClasses } from '../custom-legend-style';
import { HeaderItem } from './header-item';
import { LegendLayerItem } from './layer-item';
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
 * @returns {JSX.Element | undefined} The rendered item
 */
export function LegendItem({ item, sxClasses, itemPath }: LegendItemProps): JSX.Element | undefined {
  const { cgpv } = window as TypeWindow;
  const { ui } = cgpv;
  const { ListItem } = ui.elements;

  if (isLegendLayer(item)) {
    return (
      <ListItem sx={sxClasses.legendListItem} disablePadding>
        <LegendLayerItem item={item} />
      </ListItem>
    );
  }

  if (isHeaderLayer(item)) {
    return <HeaderItem item={item} sxClasses={sxClasses} />;
  }

  if (isGroupLayer(item)) {
    return <GroupItem item={item} sxClasses={sxClasses} itemPath={itemPath} />;
  }

  return;
}
