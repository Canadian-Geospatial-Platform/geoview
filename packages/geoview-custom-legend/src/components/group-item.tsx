import type { TypeWindow } from 'geoview-core/core/types/global-types';
import type { TypeLegendItem } from '../custom-legend-types';
import { isGroupLayer, generateLegendItemId, getLocalizedText } from '../custom-legend-types';
import type { getSxClasses } from '../custom-legend-style';
import { LegendItem } from './legend-item';

import { useAppDisplayLanguage } from 'geoview-core/core/stores/store-interface-and-intial-values/app-state';

interface GroupItemProps {
  item: TypeLegendItem;
  sxClasses: ReturnType<typeof getSxClasses>;
  itemPath?: string;
}

/**
 * Renders a group item with collapsible children.
 * @param {GroupItemProps} props - Component props
 * @returns {JSX.Element} The rendered group
 */
export function GroupItem({ item, sxClasses, itemPath }: GroupItemProps): JSX.Element | undefined {
  const { cgpv } = window as TypeWindow;
  const { ui, reactUtilities } = cgpv;
  const { useState } = reactUtilities.react;
  const { Box, Typography, IconButton, KeyboardArrowDownIcon, KeyboardArrowUpIcon, Collapse } = ui.elements;
  const appDisplayLanguage = useAppDisplayLanguage();

  const [collapsed, setCollapsed] = useState<boolean>(isGroupLayer(item) ? (item.collapsed ?? false) : false);

  if (!isGroupLayer(item)) return;

  const handleToggle = (): void => {
    setCollapsed((prev) => !prev);
  };

  // Get current item text and path for children
  const groupText = getLocalizedText(item.text, appDisplayLanguage);
  const currentPath = itemPath || item.itemId || `group-${groupText.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <Box sx={sxClasses.groupItem}>
      <Box sx={sxClasses.groupHeader}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', flex: 1 }}>
          {groupText}
        </Typography>
        <IconButton onClick={handleToggle} size="small" aria-label={collapsed ? 'Expand group' : 'Collapse group'}>
          {collapsed ? <KeyboardArrowDownIcon /> : <KeyboardArrowUpIcon />}
        </IconButton>
      </Box>
      <Collapse in={!collapsed}>
        <Box sx={sxClasses.groupChildren}>
          {item.children.map((child, index) => {
            const childId = generateLegendItemId(child, index, appDisplayLanguage, currentPath);
            return <LegendItem key={childId} item={child} sxClasses={sxClasses} itemPath={childId} />;
          })}
        </Box>
      </Collapse>
    </Box>
  );
}
