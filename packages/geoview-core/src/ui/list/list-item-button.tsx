import { memo } from 'react';
import { ListItemButton as MaterialListItemButton, ListItemButtonProps } from '@mui/material';
import { logger } from '@/core/utils/logger';

/**
 * Create a customized Material UI List Item Button component.
 * This is a simple wrapper around MaterialListItemButton that maintains
 * full compatibility with Material-UI's List Item Button props.
 *
 * @param {ListItemButtonProps} props - All valid Material-UI List Item Button props
 * @returns {JSX.Element} The List Item Button component
 */
export const ListItemButton = memo(function ListItemButton(props: ListItemButtonProps): JSX.Element {
  logger.logTraceRender('ui/list/list-item-button', props);

  // Get constant from props
  const { children, className, style } = props;

  return (
    <MaterialListItemButton className={className || ''} style={style || undefined} {...props}>
      {children !== undefined && children}
    </MaterialListItemButton>
  );
});
