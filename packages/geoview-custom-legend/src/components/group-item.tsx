import type { TypeWindow } from 'geoview-core/core/types/global-types';
import { useAppDisplayLanguage } from 'geoview-core/core/stores/store-interface-and-intial-values/app-state';
import {
  useMapStoreActions,
  useMapSelectorLayerArrayVisibility,
} from 'geoview-core/core/stores/store-interface-and-intial-values/map-state';
import { getLocalizedMessage } from 'geoview-core/core/utils/utilities';

import type { TypeGroupLayer, TypeLegendItem } from '../custom-legend-types';
import { isGroupLayer, generateLegendItemId, isLegendLayer } from '../custom-legend-types';
import type { getSxClasses } from '../custom-legend-style';
import { LegendItem } from './legend-item';
import { DescriptionText } from './description-text';

interface GroupItemProps {
  item: TypeGroupLayer;
  sxClasses: ReturnType<typeof getSxClasses>;
  itemPath?: string;
}

/**
 * Recursively collect all legend layer paths from group children.
 * @param {TypeLegendItem[]} children - The children to collect from
 * @returns {string[]} Array of layer paths
 */
function collectLayerPaths(children: TypeLegendItem[]): string[] {
  const paths: string[] = [];

  children.forEach((child) => {
    if (isLegendLayer(child)) {
      paths.push(child.layerPath);
    } else if (isGroupLayer(child)) {
      // Recursively collect from nested groups
      paths.push(...collectLayerPaths(child.children));
    }
  });

  return paths;
}

/**
 * Renders a group item with collapsible children.
 * @param {GroupItemProps} props - Component props
 * @returns {JSX.Element | undefined} The rendered group
 */
export function GroupItem({ item, sxClasses, itemPath }: GroupItemProps): JSX.Element | undefined {
  const { cgpv } = window as TypeWindow;
  const { ui, reactUtilities } = cgpv;
  const { useState, useMemo } = reactUtilities.react;
  const {
    Box,
    ListItem,
    ListItemIcon,
    ListItemButton,
    IconButton,
    Collapse,
    Typography,
    LayerGroupIcon,
    VisibilityOutlinedIcon,
    VisibilityOffOutlinedIcon,
    KeyboardArrowDownIcon,
    KeyboardArrowUpIcon,
  } = ui.elements;

  const displayLanguage = useAppDisplayLanguage();
  const { setOrToggleLayerVisibility } = useMapStoreActions();

  const [collapsed, setCollapsed] = useState<boolean>(isGroupLayer(item) ? (item.collapsed ?? false) : false);

  // Collect all layer paths from children
  const layerPaths = useMemo(() => collectLayerPaths(item.children), [item.children]);

  // Check if all child layers are visible
  const allVisible = useMapSelectorLayerArrayVisibility(layerPaths);

  if (!isGroupLayer(item)) return;

  const handleToggleCollapse = (): void => {
    setCollapsed((prev) => !prev);
  };

  const handleToggleVisibility = (): void => {
    const newVisibility = !allVisible;

    // Toggle all child layers
    layerPaths.forEach((layerPath) => {
      setOrToggleLayerVisibility(layerPath, newVisibility);
    });
  };

  // Get current item text and path for children
  const currentPath = itemPath || item.itemId || `group-${item.text.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <ListItem sx={sxClasses.legendListItem} disablePadding className="layerListItem groupItem">
      <Box sx={{ width: '100%' }}>
        <ListItemButton disableRipple sx={sxClasses.groupItemButton} className="layerListItemButton groupHeader">
          {/* Group Icon*/}
          <ListItemIcon sx={{ alignSelf: 'center' }}>
            <Box sx={{ display: 'flex', padding: '0 18px 0 18px', margin: '0 -18px 0 -18px' }}>
              <Box sx={sxClasses.groupIcon}>
                <LayerGroupIcon />
              </Box>
            </Box>
          </ListItemIcon>

          {/* Title, subtext, and visibility button */}
          <Box sx={{ flex: 1 }}>
            {/* Group title */}
            <Typography noWrap sx={sxClasses.groupTitle}>
              {item.text}
            </Typography>

            {/* Description */}
            {item.description && (
              <Box sx={{ mt: 0.5 }}>
                <DescriptionText description={item.description} sxClasses={sxClasses} />
              </Box>
            )}

            {/* Sublayer count */}
            <Typography variant="caption" sx={sxClasses.groupSubLayerCount}>
              {item.children.length}{' '}
              {item.children.length === 1
                ? getLocalizedMessage(displayLanguage, 'CustomLegend.layer')
                : getLocalizedMessage(displayLanguage, 'CustomLegend.sublayers')}
            </Typography>

            {/* Action buttons */}
            <Box sx={sxClasses.groupButtonRow}>
              <IconButton
                onClick={handleToggleVisibility}
                size="small"
                aria-label={getLocalizedMessage(displayLanguage, 'layers.toggleVisibility')}
                sx={{ padding: '4px' }}
              >
                {allVisible ? <VisibilityOutlinedIcon /> : <VisibilityOffOutlinedIcon />}
              </IconButton>
            </Box>
          </Box>

          {/* Collapse button */}
          <Box sx={{ alignSelf: 'center' }}>
            <IconButton
              onClick={handleToggleCollapse}
              size="small"
              aria-label={getLocalizedMessage(displayLanguage, 'layers.toggleCollapse')}
              sx={{ padding: '4px' }}
            >
              {collapsed ? <KeyboardArrowDownIcon /> : <KeyboardArrowUpIcon />}
            </IconButton>
          </Box>
        </ListItemButton>

        {/* Collapsible children */}
        <Collapse in={!collapsed}>
          <Box sx={sxClasses.groupChildren}>
            {item.children.map((child, index) => {
              const childId = generateLegendItemId(child, index, displayLanguage);
              return <LegendItem key={childId} item={child} sxClasses={sxClasses} itemPath={`${currentPath}/${childId}`} />;
            })}
          </Box>
        </Collapse>
      </Box>
    </ListItem>
  );
}
