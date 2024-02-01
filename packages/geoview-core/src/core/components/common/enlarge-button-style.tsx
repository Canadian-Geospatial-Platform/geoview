import { Theme } from '@mui/material';

export const getSxClasses = (theme: Theme) => ({
  enlargeBtn: {
    width: '7rem !important',
    height: '2.5rem !important',
    borderRadius: '1.5rem',
    boxShadow: `0px 3px 6px ${theme.palette.geoViewColor.bgColor.dark[600]}`,
    marginTop: '0.25rem',
    background: `${theme.palette.geoViewColor.primary.light[800]} !important`,
    '>div': {
      color: `${theme.palette.geoViewColor.primary.main} !important`,
    },
    '& svg': {
      marginRight: '0.25rem',
    },
    ':hover': {
      backgroundColor: `${theme.palette.geoViewColor.primary.main} !important`,
      '> div': {
        color: `${theme.palette.geoViewColor.white} !important`,
      },
      '& svg': {
        color: `${theme.palette.geoViewColor.white} !important`,
      },
    },
    [theme.breakpoints.down('md')]: { display: 'none' },
  },
  enlargeBtnIcon: {
    color: theme.palette.geoViewColor.primary.main,
  },
});
