import { Theme } from '@mui/material/styles';

export const getSxClasses = (theme: Theme) => ({
  list: {
    color: 'text.primary',
    marginLeft: '1rem',
    width: '100%',
    paddingRight: '2rem',
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
  dataPanel: { backgroundColor: '#F1F2F5', marginTop: '1rem' },
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
});
