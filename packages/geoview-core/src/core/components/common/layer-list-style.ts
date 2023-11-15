import { Theme } from '@mui/material';

export const getSxClasses = (theme: Theme) => ({
  list: {
    color: 'text.primary',
    width: '100%',
    [theme.breakpoints.up('md')]: {
      paddingRight: '2rem',
    },
    '& .MuiListItemText-primary': {
      font: theme.footerPanel.layerTitleFont,
    },

    '& .MuiListItem-root': {
      height: '100%',
      '& .MuiListItemButton-root': {
        padding: '0 0 0 16px',
        height: '100%',
      },
    },

    '& .MuiListItemIcon-root': {
      minWidth: '2rem',
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
  listPrimaryText: {
    minWidth: '0',
    marginTop: '0.5rem',
    marginBottom: '0.5rem',
    marginLeft: '10px',
    flex: '1 1 auto',
    display: 'flex',
    flexDirection: 'column',
    '& p': {
      fontSize: '1rem',
      font: '600 18px / 24px Roboto, Helvetica, Arial, sans-serif;',
      fontWeight: 400,
      lineHeight: 1.5,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    '>div': {
      display: 'flex',
      alignItems: 'center',
      marginTop: '4px',
      '>p': {
        fontSize: '0.875rem !important',
        color: theme.palette.text.secondary,
      },
      ' svg': {
        width: '0.75em',
        height: '0.75em',
      },
    },
  },
  paper: { marginBottom: '1rem' },
  borderWithIndex: `2px solid ${theme.palette.primary.main}`,
  borderNone: 'none',
  headline: { fontSize: '1.125rem', fontWeight: 'bold' },
});
