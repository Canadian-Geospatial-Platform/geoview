import { Theme } from '@mui/material';

export const getSxClasses = (theme: Theme) => ({
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
    [theme.breakpoints.down('md')]: { display: 'none' },
  },
  enlargeBtnIcon: {
    color: theme.palette.primary.main,
  },
});
