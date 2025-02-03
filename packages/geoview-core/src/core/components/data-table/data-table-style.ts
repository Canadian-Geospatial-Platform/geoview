import { Theme } from '@mui/material';
import { SxStyles } from '@/ui/style/types';

/**
 * Get custom sx classes for the data table
 *
 * @param {Theme} theme the theme object
 * @returns {Object} the sx classes object
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
    padding: '6px',
    alignItems: 'center',
  },
  selectedRowsDirection: {
    display: 'flex',
    flexDirection: 'column',
  },
  tableCell: { whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' },
  dataTableWrapper: {
    '& .MuiTableContainer-root': {
      borderRadius: '6px',
    },
    '& .MuiToolbar-root ': {
      borderRadius: '6px',
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
  tableHead: {
    '& th:nth-of-type(-n+3)': {
      justifyContent: 'end',
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
      '>span': {
        width: '100%',
      },
      svg: {
        marginTop: '0.25rem',
        marginBottom: '0.25rem',
      },
      '& .keyboard-focused': {
        backgroundColor: 'rgba(81, 91, 165, 0.08)',
        borderRadius: '50%',
        border: `1px solid black !important`,
        '> svg': {
          opacity: 1,
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
});
