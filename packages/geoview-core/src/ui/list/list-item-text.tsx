import type { Ref } from 'react';
import { forwardRef } from 'react';
import type { ListItemTextProps } from '@mui/material';
import { ListItemText as MaterialListItemText } from '@mui/material';

const typographyProps = {
  primary: {
    fontSize: 14,
    noWrap: true,
  },
};

/**
 * Material-UI ListItemText component for list item text content.
 *
 * Wraps Material-UI's ListItemText to provide text content container within
 * list items with auto-truncation and typography styling. Maintains full
 * compatibility with Material-UI ListItemText props. Use with ListItem and
 * optionally ListItemIcon for complete list item compositions.
 *
 * @param props - ListItemText configuration (see MUI docs for all available props)
 * @param ref - Reference to the underlying div element
 * @returns ListItemText component for list item text layout
 */
function ListItemTextUI({ slotProps, ...restProps }: ListItemTextProps, ref: Ref<HTMLDivElement>): JSX.Element {
  // Preserve all consumer-provided slotProps (root, secondary, etc.) while merging defaults into primary (consumer overrides win)
  const mergedSlotProps = {
    ...slotProps,
    primary: {
      ...typographyProps.primary,
      ...slotProps?.primary,
    },
  };
  return <MaterialListItemText ref={ref} {...restProps} slotProps={mergedSlotProps} />;
}

// Export the List Item Text using forwardRef so that passing ref is permitted and functional in the react standards
export const ListItemText = forwardRef<HTMLDivElement, ListItemTextProps>(ListItemTextUI);
