import { Theme } from '@mui/material/styles';

export const getSxClasses = (theme: Theme) => ({
  list: {
    color: 'text.primary',
    marginLeft: '1rem',
    width: '100%',
    paddingRight: '2rem',

    '& .MuiListItemText-primary': {
      font: theme.footerPanel.layerTitleFont,
    },

    '& .MuiListItem-root': {
      height: '100%',
      '& .MuiListItemButton-root': {
        padding: '0 0 0 16px',
        height: '100%',
      },
      '& .MuiBox-root': {
        height: '100%',
        borderTopRightRadius: '4px',
        borderBottomRightRadius: '4px',
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      },
    },

    '& .MuiListItemIcon-root': {
      minWidth: '2.5rem',
    },
    '& .MuiListItemText-root': {
      '>span': {
        fontSize: '1rem',
      },
      '> p': {
        fontSize: '0.875rem',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      },
    },
  },
  paper: { marginBottom: '1rem', height: '67px' },
  borderWithIndex: `2px solid ${theme.palette.primary.main}`,
  borderNone: 'none',
  headline: { fontSize: '1.125rem', fontWeight: 'bold' },
  dataPanel: { backgroundColor: '#F1F2F5', padding: '1.5rem' },
  gridContainer: { paddingLeft: '1rem', paddingRight: '1rem' },
  enlargeBtn: {
    width: '7rem !important',
    height: '2.5rem !important',
    borderRadius: '1.5rem',
    boxShadow: '0px 3px 6px #00000029',
    marginTop: '0.25rem',
    background: '#F4F5FF !important',
    '>div': {
      color: `${theme.palette.primary.main} !important`,
    },
    '& svg': {
      marginRight: '0.25rem',
    },
    ':hover': {
      backgroundColor: `${theme.palette.primary.main} !important`,
      '> div': {
        color: `${theme.palette.common.white} !important`,
      },
      '& svg': {
        color: `${theme.palette.common.white} !important`,
      },
    },
  },
  enlargeBtnIcon: {
    color: theme.palette.primary.main,
  },
  iconImage: {
    padding: 3,
    borderRadius: 0,
    border: '1px solid',
    borderColor: theme.palette.grey[600],
    boxShadow: 'rgb(0 0 0 / 20%) 0px 3px 1px -2px, rgb(0 0 0 / 14%) 0px 2px 2px 0px, rgb(0 0 0 / 12%) 0px 1px 5px 0px',
    background: theme.palette.common.white,
    objectFit: 'scale-down',
    width: '35px',
    height: '35px',
  },
  selectedRows: {
    backgroundColor: theme.palette.common.white,
    transition: 'box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
    fontWeight: 400,
    fontSize: '0.875rem',
    linHeight: 1.43,
    letterSpacing: '0.01071em',
    display: 'flex',
    padding: '6px',
    color: 'rgb(1, 67, 97)',
  },
  tableCell: { 'white-space': 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' },
  dataTableWrapper: {
    '& .MuiPaper-root': {
      border: `2px solid ${theme.palette.primary.main}`,
      borderRadius: '6px',
    },
    '& .MuiTableContainer-root': {
      borderRadius: '6px',
    },
    '& .MuiToolbar-root ': {
      borderRadius: '6px',
    },
  },
});
