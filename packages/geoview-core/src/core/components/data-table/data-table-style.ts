import { Theme } from '@mui/material';

export const getSxClasses = (theme: Theme) => ({
  dataPanel: { background: theme.palette.geoViewColor.bgColor.main, paddingBottom: '1rem' },
  gridContainer: { paddingLeft: '1rem', paddingRight: '1rem' },
  selectedRows: {
    transition: 'box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
    fontWeight: 400,
    fontSize: '0.875rem',
    linHeight: 1.43,
    letterSpacing: '0.01071em',
    display: 'flex',
    padding: '6px',
  },
  selectedRowsDirection: {
    display: 'flex',
    flexDirection: 'column',
  },
  tableCell: { whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' },
  dataTableWrapper: {
    '& .MuiPaper-root': {
      border: `2px solid ${theme.palette.geoViewColor.primary.main}`,
      borderRadius: '6px',
    },
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
  tableHeadCell: {
    '& .MuiCollapse-wrapperInner': {
      '& .MuiBox-root': {
        gridTemplateColumns: '1fr',
      },
    },
    '& .MuiInput-root': { fontSize: '0.875rem', '& .MuiSvgIcon-root': { width: '0.75em', height: '0.75em' } },
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
});
