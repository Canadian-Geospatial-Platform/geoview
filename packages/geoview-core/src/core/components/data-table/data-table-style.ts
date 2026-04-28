import type { Theme } from '@mui/material';
import type { SxStyles } from '@/ui/style/types';

/**
 * Gets custom sx classes for the data table.
 *
 * @param theme - The theme object
 * @returns The sx classes object
 */
export const getSxClasses = (theme: Theme): SxStyles => ({
  dataPanel: { background: theme.palette.geoViewColor.bgColor.main, paddingBottom: '1rem' },
  gridContainer: { paddingLeft: '1rem', paddingRight: '1rem' },
  selectedRows: {
    transition: 'box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
    fontWeight: 400,
    fontSize: theme.palette.geoViewFontSize.sm,
    linHeight: 1.43,
    letterSpacing: '0.01071em',
    display: 'flex',
    margin: '0px',
    padding: '6px',
    alignItems: 'center',
  },
  selectedRowsDirection: {
    display: 'flex',
    flexDirection: 'column',
  },
  tableCell: { whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' },
  dataTableWrapper: {
    height: '100%',
    '& .MuiTableContainer-root': {
      borderRadius: '6px',
    },
    '& .MuiToolbar-root ': {
      borderRadius: '6px',
    },
    '& .layer-icon': {
      marginRight: '0 !important',
    },
    '& .MuiFormHelperText-root': {
      color: theme.palette.geoViewColor.textColor.light[200], // WCAG - Matches global placeholder text color
    },
  },
  filterMap: {
    '& .Mui-checked': {
      '& .MuiTouchRipple-root': {
        color: theme.palette.action.active,
      },
    },
    '& .MuiTouchRipple-root': {
      color: theme.palette.geoViewColor.grey.dark[900],
    },
  },
  filterTextField: {
    minWidth: '50px',
  },
  tableHead: {
    '& th:nth-of-type(-n+3)': {
      justifyContent: 'center',
      padding: '0px',
    },
  },
  pinnedColumn: {
    justifyContent: 'center !important',
    textAlign: 'center',
    padding: '4px 6px 3px 6px !important',
    '& > div': {
      justifyContent: 'center',
    },
  },
  tableHeadCell: {
    '& .MuiCollapse-wrapperInner': {
      '& .MuiBox-root': {
        gridTemplateColumns: '1fr',
      },
    },
    '& .MuiInput-root': { fontSize: theme.palette.geoViewFontSize.sm, '& .MuiSvgIcon-root': { width: '0.75em', height: '0.75em' } },
    '& .MuiBadge-root': {
      marginLeft: '0.5rem',
      svg: {
        marginTop: '0.25rem',
        marginBottom: '0.25rem',
      },
      '& .keyboard-focused': {
        backgroundColor: theme.palette.action.focus,
        borderRadius: '50%',
        border: `1px solid black !important`,
        '> svg': {
          opacity: 1,
        },
      },
      '& .MuiTableSortLabel-root': {
        width: '2rem',
        height: '2rem',
        minWidth: '2rem',
        minHeight: '2rem',
        maxWidth: '2rem',
        maxHeight: '2rem',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
      },
    },
    '& .MuiBadge-root >span': {
      opacity: 1,
      border: `2px solid transparent`,
      borderRadius: '50%',
      height: '2rem',
      width: '2rem',
      '& .MuiTableSortLabel-icon': {
        opacity: 1,
        color: `${theme.palette.primary.main}!important`,
        width: '1.5rem',
        height: '1.5rem',
      },
      '&:hover': {
        backgroundColor: theme.palette.action.hover,
        borderRadius: '50%',
        border: `2px solid ${theme.palette.divider}`,
      },
      '&.keyboard-focused, &:focus-visible': {
        backgroundColor: theme.palette.geoViewColor.bgColor.dark[100],
        borderRadius: '50%',
        border: `2px solid black !important`,
      },
    },
    '& .Mui-TableHeadCell-Content-Actions': {
      '& .MuiIconButton-root': {
        opacity: 1,
        marginRight: '1px',
        '&:hover': {
          border: `2px solid ${theme.palette.divider}`,
        },
        '&.keyboard-focused, &:focus-visible': {
          borderRadius: '50%',
          border: `2px solid black !important`,
        },
      },
    },
  },
  dataTableInstructionsTitle: {
    fontSize: theme.palette.geoViewFontSize.lg,
    fontWeight: '600',
    lineHeight: '1.5em',
  },
  dataTableInstructionsBody: {
    fontSize: theme.palette.geoViewFontSize.sm,
  },
  rightPanelContainer: {
    overflowY: 'auto',
    color: theme.palette.geoViewColor.textColor.main,
  },
  toolbarContainer: {
    justifyContent: 'space-between',
    borderBottom: `1px solid ${theme.palette.divider}`,
    padding: theme.spacing(4),
    display: 'flex',
    gap: theme.spacing(4),
    flexDirection: 'column',
  },
  toolbarRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing(4),
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
    gap: theme.spacing(2), // Space between Switch and button group
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  toolbarButtonGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1), // Tighter spacing between buttons
  },
  tableContainer: {
    height: '100%',
    maxHeight: 'calc(100% - 97px)',
  },
  tableHeaderContent: {
    whiteSpace: 'nowrap',
    justifyContent: 'end',
  },
  tableBody: {
    '& tr:nth-of-type(odd) > td': {
      backgroundColor: theme.palette.geoViewColor.bgColor.darken(0.01),
    },
  },
  lightboxButton: {
    height: '2.5rem',
    paddingLeft: '0.5rem',
    paddingRight: '0.5rem',
    textTransform: 'none',
  },
});
