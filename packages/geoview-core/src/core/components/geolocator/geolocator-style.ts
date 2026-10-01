import type { Theme } from '@mui/material';
import { Input, styled } from '@mui/material';
import type { SxStyles } from '@/ui/style/types';
import { visuallyHidden } from '@/ui/style/default';

/**
 * Gets custom sx classes for the geolocator.
 *
 * @param theme - The theme object
 * @returns The sx classes object
 */
export const getSxClasses = (theme: Theme): SxStyles => ({
  root: {
    position: 'absolute',
    top: 8,
    left: 56,
    right: 20,
    maxWidth: 350,
  },
  geolocator: {
    position: 'relative',
    display: 'flex',
    zIndex: 1100,
    '& form': {
      display: 'flex',
      width: '100%',
      padding: theme.spacing(0, 1.25, 0, 1.25),
      gap: theme.spacing(0.5),
    },
    '& .MuiPaper-root': {
      backgroundColor: 'background.default',
      color: 'text.primary',
      '& .MuiToolbar-root': {
        justifyContent: 'space-between',
      },
    },
  },
  geolocatorResultsStatus: {
    ...visuallyHidden,
    padding: theme.spacing(2),
  },
  progressBar: {
    position: 'relative',
    zIndex: 1100,
    '& span': {
      width: '100%',
    },
  },
  filter: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: theme.spacing(1),
    padding: theme.spacing(1),
    borderBottom: `1px solid ${theme.palette.divider}`,
    '& .MuiInputLabel-formControl': {
      fontSize: theme.palette.geoViewFontSize?.default,
      marginTop: theme.spacing(0),
    },
    '& .MuiInputLabel-formControl.Mui-focused': {
      color: theme.palette.text.primary,
    },
    '& .MuiInputBase-input.MuiSelect-select': {
      padding: theme.spacing(0, 1.5, 0.5, 0),
    },
    [theme.breakpoints.down('sm')]: {
      flexDirection: 'column',
      alignItems: 'stretch',
    },
  },
  filterBox: {
    flexGrow: 2,
    '& .MuiInputLabel-root': {
      fontSize: theme.palette.geoViewFontSize?.sm,
    },
  },
  searchResult: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 1100,
    marginTop: theme.spacing(1),
  },
  filterListError: {
    listStyleType: 'disc',
    listStylePosition: 'inside',
    '& li': {
      display: 'list-item',
      paddingLeft: theme.spacing(2),
      '& .MuiListItemText-root': {
        display: 'inline-flex',
        marginLeft: theme.spacing(-1),
      },
    },
  },
  resultsRegion: {
    overflowY: 'auto',
  },
  resultMessage: {
    padding: theme.spacing(2),
    fontSize: theme.palette.geoViewFontSize?.md,
  },
  clearFiltersIcon: {
    fontSize: theme.palette.geoViewFontSize?.md,
  },
  visuallyHidden,
});

/**
 * Gets custom sx classes for the geolocator list.
 *
 * @param theme - The theme object
 * @returns The sx classes object
 */
export const getSxClassesList = (theme: Theme): SxStyles => ({
  geoList: {
    paddingTop: theme.spacing(0.75), // Add spacing between the search bar and the list for the first items focus indicator to be visible
  },
  geoListItemButton: {
    marginInline: theme.spacing(0.75), // Create space for the focus indicator to be visible on the left and right sides of the button
    paddingInline: theme.spacing(1.25), // Reduce padding (from 16px) to maintain the same overall width as before the margin was added
  },
  geoListItemGrid: {
    width: '100%',
  },

  // Location name + province cell (left side, 66% width on sm+)
  geoListLocationCell: {
    fontSize: theme.palette.geoViewFontSize?.sm,
  },

  geoListCategoryCell: {
    fontSize: theme.palette.geoViewFontSize?.sm,
    textAlign: 'right',
    [theme.breakpoints.down('sm')]: {
      textAlign: 'left',
    },
  },
});

export const StyledInputField = styled(Input)(({ theme }) => ({
  color: 'inherit',
  width: '100%',
  fontSize: theme.palette.geoViewFontSize?.default,
  '& .MuiInputBase-input': {
    transition: theme.transitions.create('width'),
    width: '100%',
  },
  '& input:focus-visible': {
    // MUI adds a 2px border to the bottom of the input parent on focus.
    // It has sufficient contrast to meet WCAG 2.1 requirements (see Success Criterion 1.4.11 and 2.4.7)
    border: 'none !important',
  },
})) as unknown as typeof Input;
