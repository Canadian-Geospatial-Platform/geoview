import type { ListItemIconProps } from '@mui/material';
import { ListItemIcon as MaterialListItemIcon } from '@mui/material';
import { logger } from '@/core/utils/logger';

/**
 * Material-UI ListItemIcon component for list item icons.
 *
 * Wraps Material-UI's ListItemIcon to provide icon container within list items.
 * Maintains full compatibility with Material-UI ListItemIcon props. Typically
 * used alongside ListItem and ListItemText for complete list item layouts.
 *
 * @param props - ListItemIcon configuration (see MUI docs for all available props)
 * @returns ListItemIcon component for list item icon placement
 */
function ListItemIconUI(props: ListItemIconProps): JSX.Element {
  logger.logTraceRenderDetailed('ui/list/list-item-icon', props);

  /// Get constant from props
  const { children, className, style, ...rest } = props;

  return (
    <MaterialListItemIcon className={className || ''} style={style || undefined} {...rest}>
      {children !== undefined && children}
    </MaterialListItemIcon>
  );
}

export const ListItemIcon = ListItemIconUI;
