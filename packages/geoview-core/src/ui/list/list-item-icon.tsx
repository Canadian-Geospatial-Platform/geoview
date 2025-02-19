import { ListItemIcon as MaterialListItemIcon, ListItemIconProps } from '@mui/material';
import { logger } from '@/core/utils/logger';

/**
 * Create a customized Material UI List Item Icon component.
 * This is a simple wrapper around MaterialListItemIcon that maintains
 * full compatibility with Material-UI's List Item Icon props.
 *
 * @param {ListItemIconProps} props - All valid Material-UI List Item Icon props
 * @returns {JSX.Element} The List Item Icon component
 */
function ListItemIconUI(props: ListItemIconProps): JSX.Element {
  logger.logTraceRender('ui/list/list-item-icon', props);

  /// Get constant from props
  const { children, className, style, ...rest } = props;

  return (
    <MaterialListItemIcon className={className || ''} style={style || undefined} {...rest}>
      {children !== undefined && children}
    </MaterialListItemIcon>
  );
}

export const ListItemIcon = ListItemIconUI;
