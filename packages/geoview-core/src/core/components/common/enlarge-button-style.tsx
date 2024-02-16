import { Theme } from '@mui/material';

export const getSxClasses = (theme: Theme) => ({
  enlargeBtn: {
    height: '2rem !important',
    lineHeight: 1,
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
  },
  footerBarEnlargeButton: {
    width: '7rem !important',
  },
  appBarEnlargeBtn: {
    width: '5rem !important',
    padding: '8px !important',
  },
  enlargeBtnIcon: {
    color: theme.palette.geoViewColor.primary.main,
  },
});
