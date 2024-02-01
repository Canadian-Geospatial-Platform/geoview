import { Theme } from '@mui/material/styles';

export const getSxClasses = (theme: Theme) => ({
  textIconContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  icon: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    color: theme.palette.geoViewColor.primary.dark,
  },
  text: {
    width: '100%',
    textAlign: 'center',
    textTransform: 'none',
    marginLeft: 20,
    display: 'flex',
    justifyContent: 'center',
    '& $buttonClass': {
      justifyContent: 'flex-start',
    },
  },
  buttonClass: {
    display: 'flex',
    fontSize: theme.typography.fontSize,
    paddingLeft: '16px',
    paddingRight: '16px',
    justifyContent: 'center',
    width: '100%',
    height: 50,
  },
});
