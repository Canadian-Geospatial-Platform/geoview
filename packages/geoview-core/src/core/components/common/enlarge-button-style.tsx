import { Theme } from '@mui/material';

export const getSxClasses = (theme: Theme) => ({
  enlargeBtn: {
    width: '7rem !important',
    height: '2.5rem !important',
    borderRadius: '1.5rem',
    boxShadow: `0px 3px 6px ${theme.palette.geoViewColors.bgColor.dark[600]}`,
    marginTop: '0.25rem',
    background: `${theme.palette.geoViewColors.primary.light[800]} !important`,
    '>div': {
      color: `${theme.palette.geoViewColors.primary.main} !important`,
    },
    '& svg': {
      marginRight: '0.25rem',
    },
    ':hover': {
      backgroundColor: `${theme.palette.geoViewColors.primary.main} !important`,
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
    color: theme.palette.geoViewColors.primary.main,
  },
});
