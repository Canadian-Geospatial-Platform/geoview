import type { Theme } from '@mui/material/styles';
import type { SxStyles } from '@/ui/style/types';

/**
 * Gets custom sx classes for the data table loading skeleton.
 *
 * @param theme - The MUI theme object
 * @returns The sx classes object
 */
export const getSxClasses = (theme: Theme): SxStyles => ({
  skeletonCell: {
    width: '20%',
  },
  skeletonBar: {
    bgcolor: theme.palette.grey[400],
  },
  skeletonRow: {
    '&:last-child td, &:last-child th': {
      border: 0,
    },
  },
});
