import type { Theme } from '@mui/material/styles';
import type { SxProps, SxStyles } from '@/ui/style/types';
import { ellipsisOverflow } from '@/ui/style/default';
import { FOCUS_OUTLINE_WIDTH } from '@/ui/style/themeOptionsGenerator';

/**
 * Sx for truncated, single-line cell content (tooltip wrapper).
 *
 * No theme dependency, so exported as a standalone constant for components without theme access.
 */
export const truncatedCellContentSx: SxProps<Theme> = {
  display: 'block',
  width: '100%',
  ...ellipsisOverflow,
};

/**
 * Gets custom sx classes for the data table.
 *
 * @param theme - The theme object
 * @returns The sx classes object
 */
export const getSxClasses = (theme: Theme): SxStyles => ({
  dataPanel: { background: theme.palette.surface?.high ?? theme.palette.background.paper, paddingBottom: theme.spacing(2) },
  gridContainer: { paddingLeft: theme.spacing(2), paddingRight: theme.spacing(2) },
  selectedRows: {
    fontSize: theme.typography.body2.fontSize,
    margin: theme.spacing(0),
    padding: theme.spacing(0.75),
  },
  selectedRowsDirection: {
    display: 'flex',
    flexDirection: 'column',
  },
  tableCell: ellipsisOverflow,
  loadingSpinnerContainer: {
    minHeight: '300px',
    minWidth: '450px',
    position: 'relative',
  },
  dataTableWrapper: {
    height: '100%',
    '& .MuiTableContainer-root': {
      borderRadius: theme.shape.borderRadiusMd,
    },
    '& .MuiToolbar-root ': {
      borderRadius: theme.shape.borderRadiusMd,
    },
    '& .layer-icon': {
      marginRight: theme.spacing(0),
    },
    '& .MuiFormHelperText-root': {
      color: theme.palette.text.secondary, // WCAG - Matches global placeholder text color
    },
  },
  dataTableTopToolbar: {
    flexShrink: 0, // Keep the toolbar at its natural (possibly wrapped) height; only the table container shrinks and scrolls
    '& .MuiInputBase-input[type="search"]': {
      boxSizing: 'content-box',
    },
  },
  filterMap: {
    '& .MuiTouchRipple-root': {
      color: theme.palette.action.active,
    },
  },
  filterTextField: {
    minWidth: '50px',
  },
  tableHead: {
    '& th:nth-of-type(-n+3)': {
      justifyContent: 'center',
      padding: theme.spacing(0),
    },
  },
  pinnedColumn: {
    justifyContent: 'center !important',
    textAlign: 'center',
    padding: theme.spacing(0.5, 0.75),
    '& > div': {
      justifyContent: 'center',
    },
  },
  pinnedColumnButton: {
    '&.Mui-focusVisible': {
      outlineOffset: `-${FOCUS_OUTLINE_WIDTH}`,
      boxShadow: 'none',
    },
  },
  tableHeadCell: {
    '& .MuiCollapse-wrapperInner': {
      '& .MuiBox-root': {
        gridTemplateColumns: '1fr',
      },
    },
    '& .MuiInput-root': { fontSize: theme.typography.body2.fontSize, '& .MuiSvgIcon-root': { width: '0.75em', height: '0.75em' } },
    '& .MuiBadge-root': {
      marginLeft: theme.spacing(1),
      svg: {
        marginTop: theme.spacing(0.5),
        marginBottom: theme.spacing(0.5),
      },
      '&.Mui-focusVisible': {
        backgroundColor: theme.palette.action.focus,
        borderRadius: theme.shape.borderRadiusFull,
        outlineOffset: `-${FOCUS_OUTLINE_WIDTH}`,
        boxShadow: 'none',
        '> svg': {
          opacity: 1,
        },
      },
      '& .MuiTableSortLabel-root': {
        width: '32px',
        height: '32px',
        minWidth: '32px',
        minHeight: '32px',
        maxWidth: '32px',
        maxHeight: '32px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing(0),
      },
    },
    '& .MuiBadge-root >span': {
      opacity: 1,
      border: `2px solid transparent`,
      borderRadius: theme.shape.borderRadiusFull,
      height: '32px',
      width: '32px',
      '& .MuiTableSortLabel-icon': {
        opacity: 1,
        color: `${theme.palette.primary.main}!important`,
        width: '24px',
        height: '24px',
      },
      '&:hover': {
        backgroundColor: theme.palette.action.hover,
        borderRadius: theme.shape.borderRadiusFull,
        border: `2px solid ${theme.palette.divider}`,
      },
      '&:focus-visible': {
        backgroundColor: theme.palette.action.focus,
        borderRadius: theme.shape.borderRadiusFull,
        outlineOffset: `-${FOCUS_OUTLINE_WIDTH}`,
        boxShadow: 'none',
      },
    },
    '& .Mui-TableHeadCell-Content-Actions': {
      '& .MuiIconButton-root': {
        opacity: 1,
        marginRight: theme.spacing(0.25),
        '&:hover': {
          border: `2px solid ${theme.palette.divider}`,
        },
        '&.Mui-focusVisible': {
          borderRadius: theme.shape.borderRadiusFull,
          outlineOffset: `-${FOCUS_OUTLINE_WIDTH}`,
          boxShadow: 'none',
        },
      },
    },
  },
  dataTableInstructionsTitle: {
    fontSize: theme.typography.h4.fontSize,
    fontWeight: '600',
    lineHeight: '1.5em',
  },
  dataTableInstructionsBody: {
    fontSize: theme.typography.body2.fontSize,
  },
  rightPanelContainer: {
    overflowY: 'auto',
    color: theme.palette.text.primary,
  },
  toolbarContainer: {
    justifyContent: 'space-between',
    borderBottom: `1px solid ${theme.palette.divider}`,
    padding: theme.spacing(0.75),
    display: 'flex',
    gap: theme.spacing(1),
    flexDirection: 'column',
  },
  toolbarRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing(0.75),
    '& > *': {
      flex: '0 1 auto', // Default: can shrink
      minWidth: 0, // Allow shrinking below content size
    },
    '& > *:last-child': {
      flex: '0 0 auto', // Don't grow, don't shrink - use natural width
      minWidth: 'fit-content', // Use as much room as needed
    },
    [theme.breakpoints.down('md')]: {
      flexDirection: 'column',
    },
  },
  searchWrapper: {
    maxWidth: '15rem',
  },
  toolbarControls: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.25), // Space between Switch and button group
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  toolbarButtonGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.25),
    '& .MuiIconButton-root': {
      '&.Mui-focusVisible': {
        outlineOffset: `-${FOCUS_OUTLINE_WIDTH}`,
        boxShadow: 'none',
      },
    },
  },
  tablePaper: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  tableContainer: {
    flex: '1 1 0%', // Take the height left below the toolbar so the table scrolls (and its scrollbars stay visible) inside the panel
    minHeight: 0,
    maxHeight: 'none',
  },
  tableHeaderContent: {
    whiteSpace: 'nowrap',
    justifyContent: 'end',
  },
  tableBody: {
    '& tr:nth-of-type(odd) > td': {
      backgroundColor: theme.palette.geoViewColor?.bgColor.darken(0.01),
    },
  },
  lightboxButton: {
    height: '40px',
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1),
    textTransform: 'none',
    '&.Mui-focusVisible': {
      outlineOffset: `-${FOCUS_OUTLINE_WIDTH}`,
      boxShadow: 'none',
    },
  },
});
