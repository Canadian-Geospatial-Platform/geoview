import type { Ref } from 'react';
import { forwardRef, useMemo } from 'react';
import MaterialList from '@mui/material/List';
import type { ListProps } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import type { Theme, SxStyles } from '@/ui/style/types';
import { composeSxProps } from '@/ui/style/types';
import { logger } from '@/core/utils/logger';

/**
 * Properties for the List UI
 */
export interface TypeListProps extends ListProps {
  type?: 'ul' | 'ol';
}

/**
 * Gets custom sx classes for the list.
 *
 * @param theme - The MUI theme object
 * @returns The sx classes object
 */
const getSxClasses = (theme: Theme): SxStyles => ({
  list: {
    padding: theme.spacing(0),
    width: '100%',
  },
});

/**
 * Material-UI List component with semantic HTML support.
 *
 * Wraps Material-UI's List to provide ordered/unordered list container with
 * semantic HTML support via the `type` prop. Renders as <ul> or <ol> element.
 * All Material-UI List props are supported and passed through directly.
 *
 * @param props - List configuration (see TypeListProps interface)
 * @param ref - Reference to the underlying list element
 * @returns List container component with semantic HTML structure
 */
function ListUI(props: TypeListProps, ref: Ref<HTMLUListElement>): JSX.Element {
  logger.logTraceRenderDetailed('ui/list/list', props);

  // Get constant from props
  const { children, className, style, type, sx, ...rest } = props;

  // Hook
  const theme = useTheme();
  const memoSxClasses = useMemo(() => getSxClasses(theme), [theme]);

  const sxMerged = composeSxProps(memoSxClasses.list, sx);

  return (
    <MaterialList ref={ref} sx={sxMerged} className={className || ''} style={style || undefined} component={type || 'ul'} {...rest}>
      {children !== undefined && children}
    </MaterialList>
  );
}

// Export the List using forwardRef so that passing ref is permitted and functional in the react standards
export const List = forwardRef<HTMLUListElement, TypeListProps>(ListUI);
