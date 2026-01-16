import { forwardRef, type Ref } from 'react';
import type { ListItemButtonProps } from '@mui/material';
import { ListItemButton as MaterialListItemButton } from '@mui/material';
import { logger } from '@/core/utils/logger';

/**
 * Create a customized Material UI List Item Button component.
 * This is a simple wrapper around MaterialListItemButton that maintains
 * full compatibility with Material-UI's List Item Button props.
 *
 * @param {ListItemButtonProps} props - All valid Material-UI List Item Button props
 * @param {Ref<HTMLDivElement>} ref - Reference to the underlying HTML element
 * @returns {JSX.Element} The List Item Button component
 */
function ListItemButtonUI(props: ListItemButtonProps, ref: Ref<HTMLDivElement>): JSX.Element {
  logger.logTraceRenderDetailed('ui/list/list-item-button', props);

  // Get constant from props
  const { children, className, style } = props;

  return (
    <MaterialListItemButton ref={ref} className={className || ''} style={style || undefined} {...props}>
      {children !== undefined && children}
    </MaterialListItemButton>
  );
}

// Export the ListItemButton using forwardRef so that passing ref is permitted and functional
export const ListItemButton = forwardRef<HTMLDivElement, ListItemButtonProps>(ListItemButtonUI);
